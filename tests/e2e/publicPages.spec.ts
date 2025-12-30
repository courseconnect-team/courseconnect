import { expect, test } from '@playwright/test';

test.describe('public routes', () => {
  test('home renders login screen without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();

    await expect(page.getByText(/Course Connect/i)).toBeVisible();
    await expect(page.getByText(/Welcome to/i)).toBeVisible();

    expect(consoleErrors, 'Console errors on home').toEqual([]);
  });
});
