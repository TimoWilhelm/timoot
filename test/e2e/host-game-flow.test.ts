import { test, expect } from 'playwright/test';

import { createGame, WsTestClient } from '../integration/utils/ws-client';

/**
 * E2E tests for the host game flow.
 *
 * Note: The host page requires a hostSecret stored in localStorage.
 * These tests use WebSocket connections to verify game behavior,
 * since directly navigating to /host/:gameId without the secret
 * would show an "Access Denied" error.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Host Game Flow E2E', () => {
	test.describe('Host Page Access', () => {
		test('host page shows error when no secret stored', async ({ page }) => {
			const game = await createGame(BASE_URL);

			// Navigate directly without storing secret - should show error
			await page.goto(`/host/${game.gameId}`);

			// Should show session expired or access denied message
			await expect(page.getByText(/session expired|access denied/i)).toBeVisible({ timeout: 10_000 });
		});
	});

	test.describe('Host via WebSocket', () => {
		test('host receives lobbyUpdate after connecting', async () => {
			const game = await createGame(BASE_URL);

			const host = new WsTestClient({
				baseUrl: BASE_URL,
				gameId: game.gameId,
				role: 'host',
				hostSecret: game.hostSecret,
			});

			try {
				await host.connect();
				const lobbyUpdate = await host.waitForMessage('lobbyUpdate');

				expect(lobbyUpdate.gameId).toBe(game.gameId);
				expect(lobbyUpdate.pin).toBe(game.pin);
				expect(Array.isArray(lobbyUpdate.players)).toBe(true);
			} finally {
				host.close();
			}
		});

		test('host sees player join in lobby update', async () => {
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
				await player.joinAndWait('E2ETestPlayer');

				// Host should receive updated lobby with the player
				const lobbyUpdate = await host.waitForMessage('lobbyUpdate', 5000, (m) => m.players.length === 1);
				expect(lobbyUpdate.players).toHaveLength(1);
				expect(lobbyUpdate.players[0].name).toBe('E2ETestPlayer');
			} finally {
				host.close();
				player.close();
			}
		});

		test('host can start game and advance phases', async () => {
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
				await player.joinAndWait('StartGamePlayer');

				// Start the game
				await host.startGame();

				// Should receive getReady
				const getReady = await host.waitForMessage('getReady', 10_000);
				expect(getReady.totalQuestions).toBeGreaterThan(0);

				// Wait for question
				const questionStart = await host.waitForMessage('questionStart', 15_000);
				expect(questionStart.questionText).toBeTruthy();
				expect(questionStart.options.length).toBeGreaterThanOrEqual(2);
			} finally {
				host.close();
				player.close();
			}
		});
	});

	test.describe('Full Game via Browser', () => {
		test('player can join and answer via browser', async ({ page }) => {
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

				// Player joins via browser
				await page.goto(`/play?gameId=${game.gameId}`);
				await page.getByPlaceholder('Your cool name').fill('BrowserPlayer');
				await page.getByRole('button', { name: /join/i }).click();

				// Wait for player to join
				await host.waitForMessage('lobbyUpdate', 10_000, (m) => m.players.length === 1);

				// Start game via WebSocket
				await host.startGame();
				await host.waitForMessage('questionStart', 15_000);

				// Player should see answer buttons
				const answerButtons = page.locator('button').filter({ has: page.locator('svg') });
				await expect(answerButtons.first()).toBeVisible({ timeout: 10_000 });

				// Click an answer- should disable buttons
				await answerButtons.first().click();
				await expect(answerButtons.first()).toBeDisabled({ timeout: 5000 });
			} finally {
				host.close();
			}
		});
	});
});
