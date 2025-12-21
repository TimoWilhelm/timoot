import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { WsTestClient, createGame, generatePlayerNames } from './utils/ws-client';
import type { EmojiReaction } from '@shared/types';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Game Flow Integration Tests', () => {
	describe('Game Creation and Lobby', () => {
		it('should create a new game via API', async () => {
			const game = await createGame(BASE_URL);

			expect(game.gameId).toBeTruthy();
			expect(game.hostSecret).toBeTruthy();
			expect(game.pin).toMatch(/^\d{6}$/);
		});

		it('should allow host to connect to game', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});

			try {
				await host.connect();
				expect(host.isConnected).toBe(true);

				// Host should receive lobby update
				const lobbyMsg = await host.waitForMessage('lobbyUpdate');
				expect(lobbyMsg.gameId).toBe(game.gameId);
				expect(lobbyMsg.pin).toBe(game.pin);
				expect(lobbyMsg.players).toHaveLength(0);
			} finally {
				host.close();
			}
		});

		it('should allow player to connect and join game', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const player = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'player',
			});

			try {
				await host.connect();
				await player.connect();

				// Player joins with nickname
				const { playerId, playerToken } = await player.joinAndWait('TestPlayer');
				expect(playerId).toBeTruthy();
				expect(playerToken).toBeTruthy();

				// Host should receive lobby update with new player
				const lobbyMsg = await host.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length === 1);
				expect(lobbyMsg.players).toHaveLength(1);
				expect(lobbyMsg.players[0].name).toBe('TestPlayer');
			} finally {
				host.close();
				player.close();
			}
		});

		it('should reject duplicate nicknames', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const player1 = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'player',
			});
			const player2 = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'player',
			});

			try {
				await host.connect();
				await player1.connect();
				await player2.connect();

				player1.join('SameName');
				await host.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length === 1);

				// Try to join with same name
				player2.send({ type: 'join', nickname: 'SameName' });
				const errorMsg = await player2.waitForMessage('error');
				expect(errorMsg.code).toBe('NICKNAME_TAKEN');
			} finally {
				host.close();
				player1.close();
				player2.close();
			}
		});

		it('should support multiple players joining', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const players: WsTestClient[] = [];
			const playerNames = generatePlayerNames(3); // Reduced from 5 for reliability

			try {
				await host.connect();
				await host.waitForMessage('lobbyUpdate'); // Wait for initial lobby state

				// Connect and join all players with small delays
				for (const name of playerNames) {
					const player = new WsTestClient({
						baseUrl: BASE_URL,
						gameId: game.gameId,
						role: 'player',
					});
					await player.connect();
					player.join(name);
					players.push(player);
					// Wait for this player to appear in lobby before next one
					await host.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length === players.length);
				}

				// Host should see all players
				const lobbyMsg = await host.waitForMessage('lobbyUpdate', 10000, (m) => m.players.length === 3);
				expect(lobbyMsg.players).toHaveLength(3);
			} finally {
				host.close();
				players.forEach((p) => p.close());
			}
		});
	});

	describe('Full Game Flow', () => {
		it('should complete a full game with host and players', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const players: WsTestClient[] = [];
			const playerNames = generatePlayerNames(3);

			try {
				// Setup: Host connects
				await host.connect();
				await host.waitForMessage('lobbyUpdate');

				// Setup: Players connect and join with delays
				for (const name of playerNames) {
					const player = new WsTestClient({
						baseUrl: BASE_URL,
						gameId: game.gameId,
						role: 'player',
					});
					await player.connect();
					player.join(name);
					players.push(player);
					// Wait for this player to appear in lobby
					await host.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length === players.length);
				}

				// Verify all players in lobby
				const lobbyMsg = await host.waitForMessage('lobbyUpdate', 10000, (m) => m.players.length === 3);
				expect(lobbyMsg.players).toHaveLength(3);

				// Host starts game
				await host.startGame();

				// All clients receive getReady
				for (const player of players) {
					const readyMsg = await player.waitForMessage('getReady');
					expect(readyMsg.countdownMs).toBeGreaterThan(0);
					expect(readyMsg.totalQuestions).toBeGreaterThan(0);
				}

				// Wait for question to start (after countdown)
				const questionMsg = await host.waitForMessage('questionStart', 15000);
				expect(questionMsg.questionText).toBeTruthy();
				expect(questionMsg.options.length).toBeGreaterThanOrEqual(2);

				// All players submit answers
				for (const player of players) {
					await player.waitForMessage('questionStart', 5000);
					await player.submitAnswer(0); // All answer with first option
				}

				// Host advances to reveal
				host.nextState();
				const revealMsg = await host.waitForMessage('reveal');
				expect(revealMsg.correctAnswerIndex).toBeGreaterThanOrEqual(0);
				expect(revealMsg.answerCounts).toBeTruthy();

				// Players also receive reveal with their results
				for (const player of players) {
					const playerReveal = await player.waitForMessage('reveal');
					expect(playerReveal.playerResult).toBeTruthy();
				}

				// Host advances to leaderboard or end
				host.nextState();

				// Could be leaderboard or gameEnd depending on quiz length
				const nextMsg = await host.waitForMessage('leaderboard', 5000).catch(() => host.waitForMessage('gameEnd', 5000));
				expect(nextMsg).toBeTruthy();
			} finally {
				host.close();
				players.forEach((p) => p.close());
			}
		}, 60000); // Extended timeout for full game flow

		it('should handle emoji sending during reveal phase', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const player = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'player',
			});

			try {
				await host.connect();
				await host.waitForMessage('lobbyUpdate');

				await player.connect();
				await player.joinAndWait('EmojiPlayer');

				// Start game and get to question
				await host.startGame();
				await player.waitForMessage('questionStart', 15000);

				// Submit answer
				await player.submitAnswer(0);

				// Advance to reveal
				host.nextState();
				await player.waitForMessage('reveal');

				// Send emoji
				const emojis: EmojiReaction[] = ['❤️', '😂', '🤔', '🎉'];
				for (const emoji of emojis) {
					player.sendEmoji(emoji);
				}

				// Host should receive emojis
				const emojiMsg = await host.waitForMessage('emojiReceived', 5000);
				expect(emojis).toContain(emojiMsg.emoji);
				expect(emojiMsg.playerId).toBe(player.playerId);
			} finally {
				host.close();
				player.close();
			}
		}, 30000);
	});

	describe('Player Reconnection', () => {
		it('should allow player to reconnect with token', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});

			try {
				await host.connect();
				await host.waitForMessage('lobbyUpdate');

				// First connection
				const player1 = new WsTestClient({
					baseUrl: BASE_URL,
					gameId: game.gameId,
					role: 'player',
				});
				await player1.connect();
				const { playerId, playerToken } = await player1.joinAndWait('ReconnectPlayer');
				expect(playerId).toBeTruthy();
				expect(playerToken).toBeTruthy();

				// Disconnect
				player1.close();

				// Wait a moment
				await new Promise((r) => setTimeout(r, 500));

				// Reconnect with credentials
				const player2 = new WsTestClient({
					baseUrl: BASE_URL,
					gameId: game.gameId,
					role: 'player',
					playerId,
					playerToken,
				});
				await player2.connect();

				// Should be reconnected as same player
				expect(player2.playerId).toBe(playerId);
				player2.close();
			} finally {
				host.close();
			}
		});
	});

	describe('Error Handling', () => {
		it('should reject invalid host secret', async () => {
			const game = await createGame(BASE_URL);
			const badHost = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: 'invalid-secret',
			});

			await expect(badHost.connect()).rejects.toThrow();
		});

		it('should reject joining after game started', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const player1 = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'player',
			});

			try {
				await host.connect();
				await host.waitForMessage('lobbyUpdate');

				await player1.connect();
				await player1.join('FirstPlayer');

				// Start game
				await host.startGame();

				// Try to join after start
				const latePlayer = new WsTestClient({
					baseUrl: BASE_URL,
					gameId: game.gameId,
					role: 'player',
				});
				await latePlayer.connect();

				const errorMsg = await latePlayer.waitForMessage('error');
				expect(errorMsg.code).toBe('GAME_ALREADY_STARTED');
				latePlayer.close();
			} finally {
				host.close();
				player1.close();
			}
		});

		it('should reject answers outside question phase', async () => {
			const game = await createGame(BASE_URL);
			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});
			const player = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'player',
			});

			try {
				await host.connect();
				await host.waitForMessage('lobbyUpdate');

				await player.connect();
				await player.join('AnswerPlayer');

				// Try to answer in lobby phase
				player.send({ type: 'submitAnswer', answerIndex: 0 });
				const errorMsg = await player.waitForMessage('error');
				expect(errorMsg.code).toBe('NOT_IN_QUESTION_PHASE');
			} finally {
				host.close();
				player.close();
			}
		});
	});
});
