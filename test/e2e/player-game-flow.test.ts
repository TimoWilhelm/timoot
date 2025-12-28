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

				// Start game and wait for question
				await host.startGame();
				await host.waitForMessage('questionStart', 15_000);

				// Wait for answer buttons to appear
				const answerButtons = page.locator('button').filter({ has: page.locator('svg') });
				await expect(answerButtons.first()).toBeVisible({ timeout: 10_000 });

				// Verify buttons are enabled before answering
				const buttonCount = await answerButtons.count();
				for (let index = 0; index < buttonCount; index++) {
					await expect(answerButtons.nth(index)).toBeEnabled();
				}

				// Click answer and verify server receives it
				const playerAnsweredPromise = host.waitForMessage('playerAnswered', 5000);
				await answerButtons.first().click();

				// Critical: buttons should become disabled after clicking
				for (let index = 0; index < buttonCount; index++) {
					await expect(answerButtons.nth(index)).toBeDisabled({ timeout: 5000 });
				}

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
				await expect(page.getByText('RoundFlowPlayer')).toBeVisible({ timeout: 10_000 });
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

				// Player should see correct/incorrect feedback (check icon appears)
				const resultIcon = page.locator('svg.h-24');
				await expect(resultIcon).toBeVisible({ timeout: 5000 });

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
});
