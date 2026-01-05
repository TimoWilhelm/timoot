import { expect, test } from 'playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Quiz Editor Navigation', () => {
	test('dirty form prompts confirmation on cancel button', async ({ page }) => {
		// 1. Navigate to quiz editor
		await page.goto('/edit');

		// 2. Make the form dirty
		await page.getByLabel('Quiz Title').fill('Dirty Quiz 1');

		// 3. Try to navigate away via "Cancel" button
		await page.getByRole('button', { name: /cancel/i }).click();

		// 4. Expect Blocked Dialog
		const dialog = page.getByRole('alertdialog');
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Unsaved Changes');

		// 5. Click "Stay"
		await page.getByRole('button', { name: /stay/i }).click();
		await expect(dialog).not.toBeVisible();
		expect(page.url()).toContain('/edit');

		// 6. Click "Leave"
		await page.getByRole('button', { name: /cancel/i }).click();
		await expect(dialog).toBeVisible();
		await page.getByRole('button', { name: /leave/i }).click();
		await expect(dialog).not.toBeVisible();
		expect(page.url()).not.toContain('/edit');
	});

	test('dirty form prompts on link click', async ({ page }) => {
		await page.goto('/edit');
		await page.getByLabel('Quiz Title').fill('Dirty Quiz 2');

		await page.locator('a[href="/"]').first().click();

		const dialog = page.getByRole('alertdialog');
		await expect(dialog).toBeVisible();

		await page.getByRole('button', { name: /leave/i }).click();
		await expect(dialog).not.toBeVisible();
		await expect(page).toHaveURL(BASE_URL + '/');
	});

	test.skip('dirty form prompts on browser back', async ({ page }) => {
		// Establish history
		await page.goto('/');
		await page.goto('/edit');

		await page.getByLabel('Quiz Title').fill('Dirty Quiz 3');
		await page.getByLabel('Quiz Title').blur();
		// Wait for state to settle
		await page.waitForTimeout(500);

		await page.goBack();

		const dialog = page.getByRole('alertdialog');
		await expect(dialog).toBeVisible();

		// Click Leave and verify we moved away
		await page.getByRole('button', { name: /leave/i }).click();
		await expect(dialog).not.toBeVisible();
		// We should be back at home (/) since we have history [home, edit] and went back
		await expect(page).toHaveURL(BASE_URL + '/');
	});
});
