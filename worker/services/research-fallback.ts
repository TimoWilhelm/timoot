type ResearchFallbackOptions<Result> = {
	abortSignal?: AbortSignal;
	fallback: Result;
	operation: () => PromiseLike<Result> | Result;
	source: string;
};

export async function runWithResearchFallback<Result>({
	abortSignal,
	fallback,
	operation,
	source,
}: ResearchFallbackOptions<Result>): Promise<Result> {
	try {
		return await operation();
	} catch (error) {
		if (abortSignal?.aborted) {
			throw error;
		}

		console.warn('[AI Research Unavailable]', {
			source,
			error: error instanceof Error ? error.message : String(error),
		});
		return fallback;
	}
}
