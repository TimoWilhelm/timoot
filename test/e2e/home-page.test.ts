import { expect, test } from 'playwright/test';

test.describe('Home Page', () => {
	test('displays hero section and featured quizzes', async ({ page }) => {
		await page.goto('/');

		// Hero Section Checks
		await expect(page.getByText(/the ultimate/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /join game/i })).toBeVisible();

		// Featured Quizzes Section
		await expect(page.getByText('Featured')).toBeVisible();
		await expect(page.getByText('TOP PICKS')).toBeVisible();

		// Check for at least one featured quiz (assuming predefined quizzes exist)
		// We know from seed/constants there are quizzes. If not, this might fail, but in dev/test env usually there are.
		const quizButtons = page.locator('button').filter({ has: page.locator('h3') });
		await expect(quizButtons.first()).toBeVisible();
	});

	test('can start a featured quiz', async ({ page }) => {
		await page.goto('/');

		// Find the first featured quiz button
		// We look for a button that contains a heading, likely a quiz card
		const quizButton = page
			.locator('button')
			.filter({ has: page.locator('h3') })
			.first();
		const quizTitle = (await quizButton.locator('h3').textContent()) || '';

		await quizButton.click();

		// Expect Start Game Dialog
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText(quizTitle)).toBeVisible();

		// Click "Start Game" in the dialog
		await dialog.getByRole('button', { name: /let's play/i }).click();

		// Expect redirect to host lobby
		await expect(page).toHaveURL(/\/host\/.+/);
		// Use exact text matching the paragraph we saw in the snapshot
		await expect(page.getByText('Waiting for players to join...')).toBeVisible();
	});

	test('can return to home from logo', async ({ page }) => {
		await page.goto('/edit');
		// Click the Timoot logo/link in header/footer/hero if accessible?
		// Actually the Create Page has a back button.
		await page
			.getByRole('link')
			.filter({ has: page.locator('svg.lucide-arrow-left') })
			.click();
		await expect(page).toHaveURL('/');
	});
});
