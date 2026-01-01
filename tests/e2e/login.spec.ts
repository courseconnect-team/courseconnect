import { expect, test } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { storageStateForRole } from './utils/stub';

const emptyStorage = { cookies: [], origins: [] };

test.describe('login screen', () => {
  test.use({ storageState: storageStateForRole('student') });

  test('shows email/password inputs and login button without console errors', async ({
    page,
  }) => {
    const { errors, dispose } = collectConsoleErrors(page);

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response, 'No response for home').toBeTruthy();
    expect(response!.status(), 'Bad status for home').toBeLessThan(400);

    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible();

    expect(errors, 'Console errors on login').toEqual([]);
    dispose();
  });

  test('login with example student account', async ({ page }) => {
    test.use({ storageState: emptyStorage });

    const { errors, dispose } = collectConsoleErrors(page);
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response, 'No response for home').toBeTruthy();
    expect(response!.status(), 'Bad status for home').toBeLessThan(400);
    const emailLocator = page.getByLabel(/email/i).first();
    const passwordLocator = page.getByLabel(/password/i).first();

    await emailLocator.waitFor({ state: 'visible', timeout: 20_000 });
    await passwordLocator.waitFor({ state: 'visible', timeout: 20_000 });

    await emailLocator.fill('test@ufl.edu');
    await passwordLocator.fill('123456789Aa!');

    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 45_000 });
    expect(errors, 'Console errors on login').toEqual([]);
    dispose();
  });
});
