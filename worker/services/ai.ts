import { experimental_MCPClient as MCPClient, experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
	type LanguageModel,
	NoSuchToolError,
	Output,
	type ToolCallRepairFunction,
	type ToolExecutionOptions,
	ToolLoopAgent,
	type ToolSet,
	generateText,
	stepCountIs,
} from 'ai';
import { env, waitUntil } from 'cloudflare:workers';
import { stripIndent } from 'common-tags';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';

import { type AvailableMCPResource, loadAvailableMCPResources } from './mcp-clients';
import { runWithResearchFallback } from './research-fallback';

import type { GenerationStatus } from '@shared/types';

const getCloudflareDocumentationMCP: () => Promise<MCPClient> = async () => {
	return await createMCPClient({
		transport: new StreamableHTTPClientTransport(new URL('https://docs.mcp.cloudflare.com/mcp')),
	});
};

const getWikimediaMCP: () => Promise<MCPClient> = async () => {
	return await createMCPClient({
		transport: new StreamableHTTPClientTransport(new URL('https://mcp.toolforge.org/')),
	});
};

function createModel(metadata?: Record<string, string>) {
	return createWorkersAI({
		binding: env.AI,
		gateway: {
			id: 'default',
			metadata: metadata ?? {},
		},
	})(env.WORKERS_AI_MODEL);
}

// Schema for AI-generated quiz questions
const QuestionSchema = z.object({
	text: z.string().describe('The question text'),
	options: z.array(z.string()).length(4).describe('Exactly 4 answer options'),
	correctAnswerIndex: z.number().min(0).max(3).describe('Index of the correct answer (0-3)'),
	isDoublePoints: z.boolean().optional().describe('Whether this question is worth double points'),
});

const QuizSchema = z.object({
	title: z.string().describe('A catchy title for the quiz'),
	questions: z.array(QuestionSchema).min(3).max(10).describe('Array of quiz questions'),
});

export type GeneratedQuiz = z.infer<typeof QuizSchema>;
export type GeneratedQuestion = z.infer<typeof QuestionSchema>;

export type OnStatusUpdate = (status: GenerationStatus) => void;

/**
 * Generate a quiz using AI based on a user prompt
 */
export async function generateQuizFromPrompt(
	prompt: string,
	numberQuestions: number = 4,
	abortSignal: AbortSignal,
	onStatusUpdate?: OnStatusUpdate,
	metadata?: Record<string, string>,
): Promise<GeneratedQuiz> {
	onStatusUpdate?.({ stage: 'researching', detail: prompt });
	const mcpServers = await loadAvailableMCPResources([
		{ name: 'cloudflare-documentation', load: getCloudflareDocumentationMCP },
		{ name: 'wikimedia', load: getWikimediaMCP },
	]);
	const activeModel = createModel(metadata);

	try {
		const researchOutput = await runWithResearchFallback({
			abortSignal,
			fallback: 'External research was unavailable. Use your existing knowledge of the requested topic.',
			operation: async () => {
				const researchAgent = await createResearchAgent(activeModel, mcpServers, onStatusUpdate);
				const { output } = await researchAgent.generate({
					messages: [
						{
							role: 'user',
							content: stripIndent`
								Research the following topic and provide detailed information:
								${prompt}
							`,
						},
					],
					abortSignal,
				});
				return output;
			},
			source: 'research-agent',
		});

		onStatusUpdate?.({ stage: 'generating', detail: 'Creating quiz questions' });

		const { output: quizOutput } = await generateText({
			model: activeModel,
			output: Output.object({
				schema: QuizSchema,
			}),
			messages: [
				{
					role: 'system',
					content: stripIndent`
						You are an expert quiz maker.
						
						Create exactly ${numberQuestions} multiple-choice questions. Each question should:
						- Have exactly 4 answer options
						- Have one clearly correct answer
						- Be interesting and educational
						- Vary in difficulty

						- The quiz question must be a single sentence with less than 120 characters
						- The quiz options should be as concise as possible and must have less than 75 characters
						- Make sure there are no full stops at the end of the sentences
						
						Also create a catchy title for the quiz that reflects the topic.
					`,
				},
				{
					role: 'user',
					content: stripIndent`
						Create a quiz based on the following topic:

						${prompt}
					`,
				},
				{
					role: 'assistant',
					content: stripIndent`
						Information about the topic:

						${researchOutput}
					`,
				},
			],
			abortSignal,
		});

		if (!quizOutput) {
			throw new Error('Failed to generate quiz - no output returned');
		}

		// Randomly select one question to be double points
		if (quizOutput.questions.length > 0) {
			const doublePointsIndex = Math.floor(Math.random() * quizOutput.questions.length);
			quizOutput.questions[doublePointsIndex].isDoublePoints = true;
		}

		return quizOutput;
	} finally {
		waitUntil(Promise.allSettled(mcpServers.map(({ value: mcp }) => mcp.close())));
	}
}

// Helper to safely access object properties
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

// Helper to get the query property used by the available research tools
const getQuery = (arguments_: unknown): string | undefined => {
	if (!isRecord(arguments_)) {
		return undefined;
	}

	if (typeof arguments_.query === 'string') {
		return arguments_.query;
	}
	if (typeof arguments_.title === 'string') {
		return arguments_.title;
	}
	return undefined;
};

async function createResearchAgent(model: LanguageModel, mcpServers: AvailableMCPResource<MCPClient>[], onStatusUpdate?: OnStatusUpdate) {
	const mcpToolSets = await loadAvailableMCPResources(mcpServers.map(({ name, value: mcp }) => ({ name, load: () => mcp.tools() })));
	const mcpTools: ToolSet = {};
	for (const { name, value: tools } of mcpToolSets) {
		const availableTools =
			name === 'wikimedia'
				? Object.fromEntries(Object.entries(tools).filter(([toolName]) => ['search-wikipedia', 'get-article-metadata'].includes(toolName)))
				: tools;
		Object.assign(mcpTools, availableTools);
	}

	// Wrap tools to intercept calls and report status
	const instrumentedTools: ToolSet = {};

	for (const [name, tool] of Object.entries(mcpTools)) {
		instrumentedTools[name] = {
			...tool,
			description: tool.description ?? undefined,
			strict: tool.strict ?? undefined,
			inputSchema: tool.inputSchema,
			execute: async (arguments_: unknown, options: ToolExecutionOptions) => {
				if (name === 'search_cloudflare_documentation') {
					const query = getQuery(arguments_);
					onStatusUpdate?.({ stage: 'reading_docs', detail: query || 'Cloudflare docs' });
				} else if (name === 'search-wikipedia' || name === 'get-article-metadata') {
					const query = getQuery(arguments_);
					onStatusUpdate?.({ stage: 'searching_web', detail: query || 'Wikipedia' });
				}
				return await runWithResearchFallback({
					abortSignal: options.abortSignal,
					fallback: `The ${name} research tool is temporarily unavailable. Continue with other sources and your own knowledge.`,
					operation: () => tool.execute?.(arguments_, options),
					source: name,
				});
			},
		};
	}

	const instructions = stripIndent`
		You are a professional researcher.
		
		Generate an information-rich response based on the information you have found and your own knowledge.
		Use the Wikimedia tools for factual topics and the Cloudflare documentation tool for Cloudflare-specific topics when relevant.
		If one research source is unavailable, continue with the other available tools and your own knowledge.
	`;

	const agent = new ToolLoopAgent({
		model,
		output: Output.text(),
		instructions,
		tools: instrumentedTools,
		experimental_repairToolCall: repairToolCall(model),
		stopWhen: stepCountIs(10),
	});

	return agent;
}

/**
 * Generate a single question based on quiz title and existing questions
 */
export async function generateSingleQuestion(
	title: string,
	existingQuestions: { text: string; options: string[]; correctAnswerIndex: number }[],
	abortSignal?: AbortSignal,
	metadata?: Record<string, string>,
): Promise<GeneratedQuestion> {
	const existingContext =
		existingQuestions.length > 0
			? stripIndent`
				
				Existing questions in this quiz:
				${existingQuestions.map((q, index) => `${index + 1}. ${q.text}\n   Options: ${q.options.join(', ')}\n   Correct answer index: ${q.correctAnswerIndex}`).join('\n')}`
			: '';

	const activeModel = createModel(metadata);
	const { output } = await generateText({
		model: activeModel,
		output: Output.object({
			schema: QuestionSchema,
		}),
		messages: [
			{
				role: 'system',
				content: stripIndent`
					You are a quiz question generator.
					
					Generate exactly 1 multiple-choice question. The question should:
					- Have exactly 4 answer options
					- Have one clearly correct answer
					- Be interesting and educational
					- Be different from any existing questions provided
					- Match the theme/topic of the quiz title

					- The quiz question must be a single sentence with less than 120 characters
					- The quiz options should be as concise as possible and must have less than 75 characters
					- Make sure there are no full stops at the end of the sentences
				`,
			},
			{
				role: 'user',
				content: stripIndent`
					Create a new question for a quiz titled: "${title}"${existingContext}
				`,
			},
		],
		abortSignal,
	});

	if (!output) {
		throw new Error('Failed to generate question - no output returned');
	}

	return output;
}

const repairToolCall: <T extends ToolSet>(model: LanguageModel) => ToolCallRepairFunction<T> =
	(model) =>
	async ({ toolCall, tools, inputSchema, error }) => {
		if (NoSuchToolError.isInstance(error)) {
			// eslint-disable-next-line unicorn/no-null -- required by ToolCallRepairFunction type
			return null;
		}

		if (!(toolCall.toolName in tools)) {
			// eslint-disable-next-line unicorn/no-null -- required by ToolCallRepairFunction type
			return null;
		}
		const tool = tools[toolCall.toolName];

		if (tool.inputSchema === undefined) {
			// eslint-disable-next-line unicorn/no-null -- required by ToolCallRepairFunction type
			return null;
		}

		const { output } = await generateText({
			model,
			output: Output.object({
				schema: tool.inputSchema,
			}),
			prompt: stripIndent`
				The model tried to call the tool "${toolCall.toolName}" with the following arguments:
				${JSON.stringify(toolCall.input)}
				The tool accepts the following schema:
				${JSON.stringify(inputSchema(toolCall))}
				Please fix the arguments.
			`,
		});

		return { ...toolCall, input: JSON.stringify(output) };
	};
