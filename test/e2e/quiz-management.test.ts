import { expect, test } from 'playwright/test';

test.describe('Quiz Management', () => {
	test('full lifecycle: create, edit, and delete quiz', async ({ page }) => {
		// --- 1. Create Quiz ---
		await page.goto('/');
		await page.getByRole('button', { name: /create new/i }).click();

		await expect(page).toHaveURL('/edit');
		await expect(page.getByRole('heading', { name: /create a new quiz/i })).toBeVisible();

		await page.getByLabel('Quiz Title').fill('E2E Lifecycle Quiz');

		await page.getByLabel('Question Text').first().fill('What is 2 + 2?');
		await page.getByPlaceholder('Option 1').first().fill('3');
		await page.getByPlaceholder('Option 2').first().fill('4');
		await page.locator('button[role="radio"]').nth(1).click();

		await page.getByRole('button', { name: /add question/i }).click();

		await page.getByLabel('Question Text').nth(1).fill('Is the sky blue?');
		await page.getByPlaceholder('Option 1').nth(1).fill('Yes');
		await page.getByPlaceholder('Option 2').nth(1).fill('No');

		await page
			.getByRole('button', { name: /double points/i })
			.nth(1)
			.click();

		await page.getByRole('button', { name: /save quiz/i }).click();

		await expect(page).toHaveURL('/');
		await expect(page.getByText(/quiz "e2e lifecycle quiz" saved/i)).toBeVisible();
		// Scope to quiz card heading to avoid matching the toast heading
		await expect(page.locator('div[role="button"] h3', { hasText: 'E2E Lifecycle Quiz' })).toBeVisible();

		// --- 2. Edit Quiz ---
		const quizCard = page
			.locator('div[role="button"]')
			.filter({ has: page.locator('h3', { hasText: 'E2E Lifecycle Quiz' }) })
			.first();

		await quizCard.hover();
		await quizCard.locator('button').nth(0).click();

		await expect(page.getByRole('heading', { name: /edit quiz/i })).toBeVisible();
		await expect(page.getByLabel('Quiz Title')).toHaveValue('E2E Lifecycle Quiz');

		await page.getByLabel('Quiz Title').fill('E2E Lifecycle Quiz Updated');
		await expect(page.getByRole('button', { name: /double points/i }).nth(1)).toHaveAttribute('aria-pressed', 'true');

		await page.getByRole('button', { name: /save quiz/i }).click();

		await expect(page).toHaveURL('/');
		// Scope to quiz card heading to avoid matching the toast heading
		await expect(page.locator('div[role="button"] h3', { hasText: 'E2E Lifecycle Quiz Updated' })).toBeVisible();

		// --- 3. Delete Quiz ---
		const updatedQuizCard = page
			.locator('div[role="button"]')
			.filter({ has: page.locator('h3', { hasText: 'E2E Lifecycle Quiz Updated' }) })
			.first();

		await updatedQuizCard.hover();
		await updatedQuizCard.locator('button').nth(1).click();

		const dialog = page.getByRole('alertdialog');
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Yes, Delete it' }).click();

		await expect(page.getByText(/quiz deleted/i)).toBeVisible();
		await expect(updatedQuizCard).not.toBeVisible();
	});

	test('validation: cannot save invalid quiz', async ({ page }) => {
		await page.goto('/edit');

		await page.getByRole('button', { name: /save quiz/i }).click();

		await expect(page.getByText(/title is required/i)).toBeVisible();
	});
});
