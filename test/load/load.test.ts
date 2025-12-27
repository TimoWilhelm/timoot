import { describe, expect, it } from 'vitest';
import { WsTestClient, createGame, generatePlayerNames } from '../integration/utils/ws-client';
import type { EmojiReaction } from '@shared/types';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Load test configuration via env vars
const LOAD_TEST_PLAYERS = Number.parseInt(process.env.LOAD_TEST_PLAYERS || '20', 10);
const LOAD_TEST_CONCURRENT_GAMES = Number.parseInt(process.env.LOAD_TEST_CONCURRENT_GAMES || '3', 10);
const LOAD_TEST_EMOJI_BURST = Number.parseInt(process.env.LOAD_TEST_EMOJI_BURST || '10', 10);

interface LoadTestMetrics {
	totalPlayers: number;
	successfulConnections: number;
	failedConnections: number;
	successfulJoins: number;
	failedJoins: number;
	successfulAnswers: number;
	failedAnswers: number;
	emojisSent: number;
	avgConnectionTimeMs: number;
	avgJoinTimeMs: number;
	avgAnswerTimeMs: number;
	totalTimeMs: number;
	errors: string[];
}

/**
 * Simulates a single player participating in a game
 */
async function simulatePlayer(
	baseUrl: string,
	gameId: string,
	playerName: string,
	metrics: LoadTestMetrics,
): Promise<WsTestClient | undefined> {
	const player = new WsTestClient({
		baseUrl,
		gameId,
		role: 'player',
		timeout: 30_000,
	});

	const startConnect = Date.now();
	try {
		await player.connect();
		metrics.successfulConnections++;
		metrics.avgConnectionTimeMs += Date.now() - startConnect;
	} catch (error) {
		metrics.failedConnections++;
		metrics.errors.push(`Connection failed for ${playerName}: ${error}`);
		return undefined;
	}

	const startJoin = Date.now();
	try {
		player.join(playerName);
		metrics.successfulJoins++;
		metrics.avgJoinTimeMs += Date.now() - startJoin;
	} catch (error) {
		metrics.failedJoins++;
		metrics.errors.push(`Join failed for ${playerName}: ${error}`);
		return player;
	}

	return player;
}

/**
 * Runs a complete game with multiple players
 */
async function runGameWithPlayers(baseUrl: string, playerCount: number, sendEmojis: boolean): Promise<LoadTestMetrics> {
	const metrics: LoadTestMetrics = {
		totalPlayers: playerCount,
		successfulConnections: 0,
		failedConnections: 0,
		successfulJoins: 0,
		failedJoins: 0,
		successfulAnswers: 0,
		failedAnswers: 0,
		emojisSent: 0,
		avgConnectionTimeMs: 0,
		avgJoinTimeMs: 0,
		avgAnswerTimeMs: 0,
		totalTimeMs: 0,
		errors: [],
	};

	const startTime = Date.now();
	console.log('  Creating game...');
	const game = await createGame(baseUrl);
	console.log(`  Game created: ${game.gameId}`);

	// Connect host
	const host = new WsTestClient({
		baseUrl,
		gameId: game.gameId,
		role: 'host',
		hostSecret: game.hostSecret,
	});
	await host.connect();
	await host.waitForMessage('lobbyUpdate');

	// Connect all players concurrently
	console.log(`  Connecting ${playerCount} players...`);
	const playerNames = generatePlayerNames(playerCount, 'LoadPlayer');
	const playerPromises = playerNames.map((name) => simulatePlayer(baseUrl, game.gameId, name, metrics));
	const playerResults = await Promise.all(playerPromises);
	const players = playerResults.filter((p): p is WsTestClient => p !== null);
	console.log(`  ${players.length}/${playerCount} players connected`);

	// Wait for all players to be in lobby (with graceful timeout)
	if (players.length > 0) {
		console.log('  Waiting for lobby to sync...');
		await host
			.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length >= players.length)
			.catch(() => {
				const lobbyMsgs = host.getMessagesByType('lobbyUpdate');
				const lastLobby = lobbyMsgs.at(-1);
				console.log(`  Lobby has ${lastLobby?.players.length ?? 0}/${players.length} players, continuing...`);
			});
	}

	// Start game (only if we have players)
	const lobbyMsgs = host.getMessagesByType('lobbyUpdate');
	const lastLobby = lobbyMsgs.at(-1);
	if (!lastLobby || lastLobby.players.length === 0) {
		// No players joined - skip game
		console.log('  No players joined - skipping game');
		host.close();
		for (const p of players) p.close();
		return metrics;
	}
	console.log('  Starting game...');
	await host.startGame().catch(() => {});

	// Wait for question (with timeout handling)
	console.log('  Waiting for first question...');
	await host.waitForMessage('getReady', 10_000).catch(() => {});
	const questionPromises = players.map((p) => p.waitForMessage('questionStart', 20_000).catch(() => {}));
	await Promise.all(questionPromises);
	console.log('  Question received, submitting answers...');

	// All players submit answers (with timeout)
	const answerPromises = players.map(async (player, index) => {
		const startAnswer = Date.now();
		try {
			const answerIndex = index % 4;
			// Fire and forget - don't wait for confirmation in load test
			player.send({ type: 'submitAnswer', answerIndex });
			metrics.successfulAnswers++;
			metrics.avgAnswerTimeMs += Date.now() - startAnswer;
		} catch (error) {
			metrics.failedAnswers++;
			metrics.errors.push(`Answer failed: ${error}`);
		}
	});
	await Promise.all(answerPromises);
	// Small delay for answers to process
	await new Promise((r) => setTimeout(r, 500));

	// Host advances to reveal
	console.log('  Advancing to reveal...');
	host.nextState();
	const revealPromises = players.map((p) => p.waitForMessage('reveal', 10_000).catch(() => {}));
	await Promise.all(revealPromises);

	// Send emojis burst
	if (sendEmojis) {
		console.log(`  Sending emoji burst (${LOAD_TEST_EMOJI_BURST} per player)...`);
		const emojis: EmojiReaction[] = ['❤️', '😂', '🤔', '🎉'];
		for (const player of players) {
			for (let index = 0; index < LOAD_TEST_EMOJI_BURST; index++) {
				const emoji = emojis[Math.floor(Math.random() * emojis.length)];
				player.sendEmoji(emoji);
				metrics.emojisSent++;
			}
		}
		// Small delay to let emojis process
		await new Promise((r) => setTimeout(r, 500));
	}

	// Continue game through remaining questions until end
	console.log('  Playing through remaining questions...');
	let phase = 'REVEAL';
	let attempts = 0;
	let questionNumber = 1;
	const maxAttempts = 50; // Prevent infinite loop

	while (phase !== 'END' && attempts < maxAttempts) {
		attempts++;
		host.nextState();

		try {
			// Wait for next state
			const nextMessage = await Promise.race([
				host.waitForMessage('leaderboard', 5000),
				host.waitForMessage('gameEnd', 5000),
				host.waitForMessage('questionStart', 5000),
				host.waitForMessage('questionModifier', 5000),
			]);

			if (nextMessage.type === 'gameEnd') {
				console.log('  Game ended');
				phase = 'END';
				break;
			} else if (nextMessage.type === 'questionStart') {
				questionNumber++;
				console.log(`  Question ${questionNumber}...`);
				// Answer the question
				const answerProms = players.map(async (player, index) => {
					try {
						await player.waitForMessage('questionStart', 5000);
						await player.submitAnswer(index % 4);
						metrics.successfulAnswers++;
					} catch {
						metrics.failedAnswers++;
					}
				});
				await Promise.all(answerProms);
			}
		} catch {
			// Timeout - try advancing again
		}
	}

	// Cleanup
	metrics.totalTimeMs = Date.now() - startTime;

	// Calculate averages
	if (metrics.successfulConnections > 0) {
		metrics.avgConnectionTimeMs /= metrics.successfulConnections;
	}
	if (metrics.successfulJoins > 0) {
		metrics.avgJoinTimeMs /= metrics.successfulJoins;
	}
	if (metrics.successfulAnswers > 0) {
		metrics.avgAnswerTimeMs /= metrics.successfulAnswers;
	}

	// Close all connections
	host.close();
	for (const p of players) p.close();

	return metrics;
}

describe('Load Tests', () => {
	// Skip load tests in CI unless explicitly enabled
	const runLoadTests = process.env.RUN_LOAD_TESTS === 'true';

	describe.skipIf(!runLoadTests)('Single Game Load Test', () => {
		it(`should handle ${LOAD_TEST_PLAYERS} concurrent players in a single game`, async () => {
			console.log(`\n🚀 Running load test with ${LOAD_TEST_PLAYERS} players against ${BASE_URL}`);

			const metrics = await runGameWithPlayers(BASE_URL, LOAD_TEST_PLAYERS, true);

			console.log('\n📊 Load Test Results:');
			console.log(`  Total Players: ${metrics.totalPlayers}`);
			console.log(`  Successful Connections: ${metrics.successfulConnections}`);
			console.log(`  Failed Connections: ${metrics.failedConnections}`);
			console.log(`  Successful Joins: ${metrics.successfulJoins}`);
			console.log(`  Failed Joins: ${metrics.failedJoins}`);
			console.log(`  Successful Answers: ${metrics.successfulAnswers}`);
			console.log(`  Failed Answers: ${metrics.failedAnswers}`);
			console.log(`  Emojis Sent: ${metrics.emojisSent}`);
			console.log(`  Avg Connection Time: ${metrics.avgConnectionTimeMs.toFixed(2)}ms`);
			console.log(`  Avg Join Time: ${metrics.avgJoinTimeMs.toFixed(2)}ms`);
			console.log(`  Avg Answer Time: ${metrics.avgAnswerTimeMs.toFixed(2)}ms`);
			console.log(`  Total Time: ${metrics.totalTimeMs}ms`);

			if (metrics.errors.length > 0) {
				console.log(`  Errors (first 10):`);
				for (const error of metrics.errors.slice(0, 10)) console.log(`    - ${error}`);
			}

			// Assertions
			expect(metrics.successfulConnections).toBeGreaterThanOrEqual(metrics.totalPlayers * 0.9); // 90% success rate
			expect(metrics.successfulJoins).toBeGreaterThanOrEqual(metrics.successfulConnections * 0.95);
			expect(metrics.avgConnectionTimeMs).toBeLessThan(10_000); // < 10s connection time
		}, 120_000); // 2 minute timeout
	});

	describe.skipIf(!runLoadTests)('Multiple Concurrent Games Load Test', () => {
		it(`should handle ${LOAD_TEST_CONCURRENT_GAMES} concurrent games with ${LOAD_TEST_PLAYERS} players each`, async () => {
			console.log(
				`\n🚀 Running concurrent games test: ${LOAD_TEST_CONCURRENT_GAMES} games x ${LOAD_TEST_PLAYERS} players against ${BASE_URL}`,
			);

			const startTime = Date.now();
			const gamePromises: Promise<LoadTestMetrics>[] = [];

			for (let index = 0; index < LOAD_TEST_CONCURRENT_GAMES; index++) {
				gamePromises.push(runGameWithPlayers(BASE_URL, LOAD_TEST_PLAYERS, true));
			}

			const allMetrics = await Promise.all(gamePromises);
			const totalTime = Date.now() - startTime;

			// Aggregate metrics
			const aggregated: LoadTestMetrics = {
				totalPlayers: 0,
				successfulConnections: 0,
				failedConnections: 0,
				successfulJoins: 0,
				failedJoins: 0,
				successfulAnswers: 0,
				failedAnswers: 0,
				emojisSent: 0,
				avgConnectionTimeMs: 0,
				avgJoinTimeMs: 0,
				avgAnswerTimeMs: 0,
				totalTimeMs: 0,
				errors: [],
			};
			for (const m of allMetrics) {
				aggregated.totalPlayers += m.totalPlayers;
				aggregated.successfulConnections += m.successfulConnections;
				aggregated.failedConnections += m.failedConnections;
				aggregated.successfulJoins += m.successfulJoins;
				aggregated.failedJoins += m.failedJoins;
				aggregated.successfulAnswers += m.successfulAnswers;
				aggregated.failedAnswers += m.failedAnswers;
				aggregated.emojisSent += m.emojisSent;
				aggregated.avgConnectionTimeMs += m.avgConnectionTimeMs;
				aggregated.avgJoinTimeMs += m.avgJoinTimeMs;
				aggregated.avgAnswerTimeMs += m.avgAnswerTimeMs;
				aggregated.errors.push(...m.errors);
			}

			// Average the averages
			aggregated.avgConnectionTimeMs /= allMetrics.length;
			aggregated.avgJoinTimeMs /= allMetrics.length;
			aggregated.avgAnswerTimeMs /= allMetrics.length;
			aggregated.totalTimeMs = totalTime;

			console.log('\n📊 Aggregated Load Test Results:');
			console.log(`  Total Games: ${LOAD_TEST_CONCURRENT_GAMES}`);
			console.log(`  Total Players: ${aggregated.totalPlayers}`);
			console.log(`  Successful Connections: ${aggregated.successfulConnections}`);
			console.log(`  Failed Connections: ${aggregated.failedConnections}`);
			console.log(`  Successful Joins: ${aggregated.successfulJoins}`);
			console.log(`  Failed Joins: ${aggregated.failedJoins}`);
			console.log(`  Successful Answers: ${aggregated.successfulAnswers}`);
			console.log(`  Failed Answers: ${aggregated.failedAnswers}`);
			console.log(`  Emojis Sent: ${aggregated.emojisSent}`);
			console.log(`  Avg Connection Time: ${aggregated.avgConnectionTimeMs.toFixed(2)}ms`);
			console.log(`  Avg Join Time: ${aggregated.avgJoinTimeMs.toFixed(2)}ms`);
			console.log(`  Avg Answer Time: ${aggregated.avgAnswerTimeMs.toFixed(2)}ms`);
			console.log(`  Total Time: ${aggregated.totalTimeMs}ms`);

			if (aggregated.errors.length > 0) {
				console.log(`  Errors (first 10):`);
				for (const error of aggregated.errors.slice(0, 10)) console.log(`    - ${error}`);
			}

			// Assertions
			const successRate = aggregated.successfulConnections / aggregated.totalPlayers;
			expect(successRate).toBeGreaterThanOrEqual(0.9); // 90% success rate for concurrent games
		}, 300_000); // 5 minute timeout
	});

	describe.skipIf(!runLoadTests)('Emoji Burst Test', () => {
		it('should handle rapid emoji sending from multiple players', async () => {
			const playerCount = 10;
			const emojisPerPlayer = 20;

			console.log(`\n🎉 Running emoji burst test: ${playerCount} players x ${emojisPerPlayer} emojis`);

			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});

			const players: WsTestClient[] = [];

			try {
				await host.connect();
				await host.waitForMessage('lobbyUpdate');

				// Connect and join players with small delays to avoid overwhelming server
				const playerNames = generatePlayerNames(playerCount, 'EmojiPlayer');

				for (const name of playerNames) {
					const player = new WsTestClient({
						baseUrl: BASE_URL,
						gameId: game.gameId,
						role: 'player',
					});
					await player.connect();
					await player.joinAndWait(name, 10_000);
					players.push(player);
				}

				// Verify all players joined by waiting for lobbyUpdate with all players
				await host.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length >= playerCount);

				// Start game and get to reveal phase
				await host.startGame();
				await Promise.all(players.map((p) => p.waitForMessage('questionStart', 20_000)));

				// All players submit answers (fire and forget, then wait)
				for (const p of players) p.send({ type: 'submitAnswer', answerIndex: 0 });
				await new Promise((r) => setTimeout(r, 2000));

				// Advance to reveal phase
				host.nextState();
				await host.waitForMessage('reveal', 10_000);
				// Give time for all players to receive reveal
				await new Promise((r) => setTimeout(r, 500));

				// Emoji burst - all players send emojis rapidly
				const emojis: EmojiReaction[] = ['❤️', '😂', '🤔', '🎉'];
				const startTime = Date.now();
				let totalEmojis = 0;

				for (const player of players) {
					for (let index = 0; index < emojisPerPlayer; index++) {
						const emoji = emojis[Math.floor(Math.random() * emojis.length)];
						player.sendEmoji(emoji);
						totalEmojis++;
					}
				}

				// Wait for emoji processing
				await new Promise((r) => setTimeout(r, 3000));

				const burstTime = Date.now() - startTime;
				const emojisPerSecond = (totalEmojis / burstTime) * 1000;

				console.log(`  Total Emojis Sent: ${totalEmojis}`);
				console.log(`  Burst Time: ${burstTime}ms`);
				console.log(`  Emojis/Second: ${emojisPerSecond.toFixed(2)}`);

				// Count received emojis on host
				const receivedEmojis = host.getMessagesByType('emojiReceived');
				console.log(`  Emojis Received by Host: ${receivedEmojis.length}`);

				// Check for errors on players (helps diagnose issues)
				let totalErrors = 0;
				for (const player of players) {
					const errors = player.getMessagesByType('error');
					totalErrors += errors.length;
					if (errors.length > 0) {
						console.log(`  Player errors: ${errors.map((error) => error.message).join(', ')}`);
					}
				}
				console.log(`  Total player errors: ${totalErrors}`);

				// Should receive most emojis (at least 50% delivered under load)
				expect(receivedEmojis.length).toBeGreaterThanOrEqual(totalEmojis * 0.5);
			} finally {
				// Cleanup
				host.close();
				for (const p of players) p.close();
			}
		}, 60_000);
	});

	describe.skipIf(!runLoadTests)('Stress Test - Rapid Player Joins', () => {
		it('should handle rapid player joins without race conditions', async () => {
			const playerCount = 30;

			console.log(`\n⚡ Running rapid join test: ${playerCount} players joining simultaneously`);

			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});

			await host.connect();
			await host.waitForMessage('lobbyUpdate');

			// Connect all players simultaneously
			const playerNames = generatePlayerNames(playerCount, 'RapidPlayer');
			const startTime = Date.now();

			const connectPromises = playerNames.map(async (name) => {
				const player = new WsTestClient({
					baseUrl: BASE_URL,
					gameId: game.gameId,
					role: 'player',
				});
				try {
					await player.connect();
					player.join(name);
					return { success: true, player };
				} catch (error) {
					return { success: false, error: String(error), player };
				}
			});

			const results = await Promise.all(connectPromises);

			// Wait for players to appear in lobby
			await host.waitForMessage('lobbyUpdate', 15_000, (m) => m.players.length >= playerCount * 0.9).catch(() => {});

			const joinTime = Date.now() - startTime;

			const successful = results.filter((r) => r.success);
			const failed = results.filter((r) => !r.success);

			console.log(`  Total Players: ${playerCount}`);
			console.log(`  Successful Joins: ${successful.length}`);
			console.log(`  Failed Joins: ${failed.length}`);
			console.log(`  Join Time: ${joinTime}ms`);
			console.log(`  Joins/Second: ${((successful.length / joinTime) * 1000).toFixed(2)}`);

			// Cleanup
			host.close();
			for (const r of results) r.player?.close();

			// Should have high success rate
			expect(successful.length).toBeGreaterThanOrEqual(playerCount * 0.9);
		}, 60_000);
	});
});

// Standalone load test runner for CI/manual execution
export async function runLoadTest(config: {
	baseUrl: string;
	playerCount: number;
	gameCount: number;
	sendEmojis?: boolean;
}): Promise<{ success: boolean; metrics: LoadTestMetrics[] }> {
	const { baseUrl, playerCount, gameCount, sendEmojis = true } = config;
	const metrics: LoadTestMetrics[] = [];

	try {
		const gamePromises = Array.from({ length: gameCount }, () => runGameWithPlayers(baseUrl, playerCount, sendEmojis));
		const results = await Promise.all(gamePromises);
		metrics.push(...results);

		const totalSuccess = results.every(
			(m) => m.successfulConnections >= m.totalPlayers * 0.9 && m.successfulJoins >= m.successfulConnections * 0.95,
		);

		return { success: totalSuccess, metrics };
	} catch (error) {
		console.error('Load test failed:', error);
		return { success: false, metrics };
	}
}
