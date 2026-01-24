import { test, expect } from 'playwright/test';

import { createGame, WsTestClient } from '../integration/utils/ws-client';

/**
 * E2E tests for the player game flow.
 * These tests verify the actual browser UI behavior that integration tests cannot catch.
 *
 * Key test: Answer buttons responding to clicks (would have caught the !== null bug)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Player Game Flow E2E', () => {
	test.describe('Answer Submission', () => {
		test('clicking an answer button should disable all buttons and send answer to server', async ({ page }) => {
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
				await page.getByPlaceholder('Your cool name').fill('E2EPlayer');
				await page.getByRole('button', { name: /join/i }).click();

				await host.waitForMessage('lobbyUpdate', 10_000, (m) => m.players.length === 1);

				// Set up listener for server receiving answer BEFORE starting game
				const playerAnsweredPromise = host.waitForMessage('playerAnswered', 30_000);

				// Start game and wait for question
				await host.startGame();
				await host.waitForMessage('questionStart', 15_000);

				// Wait for answer buttons to appear - use specific selector for answer buttons
				// Answer buttons have colored backgrounds (bg-red, bg-blue, bg-green, bg-yellow)
				// and contain an SVG shape. They're the large buttons in the answer grid.
				const answerButtons = page
					.locator('button.bg-red, button.bg-blue, button.bg-green, button.bg-yellow')
					.filter({ has: page.locator('svg') });

				// Wait for at least one answer button to be visible and enabled
				await expect(answerButtons.first()).toBeVisible({ timeout: 10_000 });
				await expect(answerButtons.first()).toBeEnabled({ timeout: 5000 });

				// Click an answer immediately to avoid timing issues with question timer
				await answerButtons.first().click();

				// Critical: the clicked button should now be disabled
				await expect(answerButtons.first()).toBeDisabled({ timeout: 5000 });

				// Verify server received the answer
				const playerAnswered = await playerAnsweredPromise;
				expect(playerAnswered.answeredCount).toBe(1);
			} finally {
				host.close();
			}
		});
	});

	test.describe('Game Round Flow', () => {
		test('player can complete a full round: join → answer → reveal → leaderboard', async ({ page }) => {
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

				// Player joins
				await page.goto(`/play?gameId=${game.gameId}`);
				await page.getByPlaceholder('Your cool name').fill('RoundFlowPlayer');
				await page.getByRole('button', { name: /join/i }).click();

				await host.waitForMessage('lobbyUpdate', 10_000, (m) => m.players.length === 1);

				// Verify player name and score are displayed
				await expect(page.getByText('RoundFlowPlayer', { exact: true })).toBeVisible({ timeout: 10_000 });
				await expect(page.getByText(/score:/i)).toBeVisible();

				// Start game
				await host.startGame();
				await host.waitForMessage('questionStart', 15_000);

				// Answer the question
				const answerButtons = page.locator('button').filter({ has: page.locator('svg') });
				await expect(answerButtons.first()).toBeVisible({ timeout: 10_000 });
				await answerButtons.first().click();
				await expect(answerButtons.first()).toBeDisabled({ timeout: 5000 });

				// Advance to reveal - player should see result
				host.nextState();
				await host.waitForMessage('reveal', 10_000);

				// Player should see correct/incorrect feedback
				const resultText = page.getByText(/^(Correct!|Incorrect)$/);
				await expect(resultText).toBeVisible({ timeout: 5000 });

				// Advance to leaderboard
				host.nextState();
				await host.waitForMessage('leaderboard', 10_000);

				// Score should still be visible
				await expect(page.getByText(/score:/i)).toBeVisible();
			} finally {
				host.close();
			}
		});
	});

	test.describe('Game Code Entry', () => {
		test('player can enter game code and proceed to nickname screen', async ({ page }) => {
			const game = await createGame(BASE_URL);

			// Navigate to /play without gameId - shows game code entry form
			await page.goto('/play');

			// Should see the game code input (has placeholder like "happy-blue-panda")
			const gameCodeInput = page.locator('input[type="text"]').first();
			await expect(gameCodeInput).toBeVisible({ timeout: 5000 });

			// Enter the game code
			await gameCodeInput.fill(game.gameId);

			// Should see the checkmark indicating valid code
			await expect(page.locator('.text-green')).toBeVisible({ timeout: 5000 });

			// Click "Join Game" button
			await page.getByRole('button', { name: /join game/i }).click();

			// Should now see the nickname input - this is the key assertion
			// If the bug exists, we'd still see the game code input instead
			await expect(page.getByPlaceholder('Your cool name')).toBeVisible({ timeout: 5000 });
		});

		test('player can complete full flow: enter code → nickname → lobby', async ({ page }) => {
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

				// Navigate to /play without gameId
				await page.goto('/play');

				// Enter game code
				const gameCodeInput = page.locator('input[type="text"]').first();
				await gameCodeInput.fill(game.gameId);
				await page.getByRole('button', { name: /join game/i }).click();

				// Enter nickname
				await page.getByPlaceholder('Your cool name').fill('FullFlowPlayer');
				await page.getByRole('button', { name: /join/i }).click();

				// Wait for server to confirm player joined
				await host.waitForMessage('lobbyUpdate', 10_000, (m) => m.players.length === 1);

				// Player should see their name and score in the lobby
				await expect(page.getByText('FullFlowPlayer', { exact: true })).toBeVisible({ timeout: 10_000 });
				await expect(page.getByText(/score:/i)).toBeVisible();
			} finally {
				host.close();
			}
		});
	});
});
