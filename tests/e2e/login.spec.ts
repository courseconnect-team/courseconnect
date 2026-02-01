import { expect, test } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { storageStateForRole } from './utils/stub';

const emptyStorage = { cookies: [], origins: [] };

test.describe('login screen (stubbed role)', () => {
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
});

// test('login with example student account', async ({ page }) => {
//   const { errors, dispose } = collectConsoleErrors(page);
//   const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
//   expect(response, 'No response for home').toBeTruthy();
//   expect(response!.status(), 'Bad status for home').toBeLessThan(400);
//   const emailLocator = page.getByLabel(/email/i).first();
//   const passwordLocator = page.getByLabel(/password/i).first();

//   await expect(emailLocator).toBeVisible();
//   await expect(passwordLocator).toBeVisible();

//   await emailLocator.fill('test@ufl.edu');
//   await passwordLocator.fill('123456789Aa!');

//   // In E2E mode there is no real auth backend; stash a stub user/role and navigate to dashboard.
//   await page.evaluate(() => {
//     localStorage.setItem('e2e_role', 'student');
//     localStorage.setItem('e2e_email', 'test@ufl.edu');
//     localStorage.setItem('e2e_name', 'Test Student');
//   });
//   await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
//   await page.waitForLoadState('networkidle');
//   await expect(page.locator('body')).toBeVisible();
//   expect(errors, 'Console errors on login').toEqual([]);
//   dispose();
// });
