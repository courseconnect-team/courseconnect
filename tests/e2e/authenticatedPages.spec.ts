import fs from 'fs';
import path from 'path';
import { expect, test } from '@playwright/test';

type CredsFile = Record<Role, { email: string; password: string }>;

const credsPath = path.resolve('tests/utils/playwright.accounts.json');

function loadCreds(): CredsFile {
  if (!fs.existsSync(credsPath)) {
    throw new Error(
      `Missing ${credsPath}. Create it locally and gitignore it (store test logins there).`
    );
  }
  const raw = fs.readFileSync(credsPath, 'utf-8');
  const data = JSON.parse(raw) as Partial<CredsFile>;

  for (const role of ['student', 'faculty', 'admin'] as const) {
    const c = data[role];
    if (!c?.email || !c?.password) {
      throw new Error(
        `Missing email/password for role "${role}" in ${credsPath}`
      );
    }
  }
  return data as CredsFile;
}

type Role = 'student' | 'faculty' | 'admin';

const routesByRole: Record<Role, { allowed: string[]; forbidden: string[] }> = {
  student: {
    allowed: [
      '/dashboard',
      '/applications',
      '/announcements',
      '/profile',
      '/features',
      '/status',
      '/underDevelopment',
      '/Research',
    ],
    forbidden: [
      '/faculty',
      '/faculty-stats',
      '/admincourses',
      '/admin-applications',
      '/users',
      '/courses',
    ],
  },
  faculty: {
    allowed: [
      '/dashboard',
      '/courses',
      '/announcements',
      '/applications',
      '/status',
      '/profile',
      '/features',
      '/Research',
    ],
    forbidden: [
      '/admincourses',
      '/admin-applications',
      '/users',
      '/faculty',
      '/faculty-stats',
    ],
  },
  admin: {
    allowed: [
      '/dashboard',
      '/courses',
      '/applications',
      '/announcements',
      '/profile',
      '/faculty',
      '/faculty-stats',
      '/admincourses',
      '/admin-applications',
      '/users',
      '/status',
      '/Research',
      '/features',
    ],
    forbidden: [],
  },
};

for (const role of ['student', 'faculty', 'admin'] as const) {
  test.describe(`${role} access control`, () => {
    const creds = loadCreds()[role];
    const storageStatePath = `playwright/.auth/${role}.json`;

    test.beforeAll(async ({ browser }) => {
      fs.mkdirSync('playwright/.auth', { recursive: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.getByRole('textbox', { name: /email/i }).fill(creds.email);
      await page
        .getByRole('textbox', { name: /password/i })
        .fill(creds.password);
      await page.getByRole('button', { name: /log in/i }).click();
      await page.waitForURL('**/dashboard', { timeout: 30_000 });

      await context.storageState({ path: storageStatePath });
      await context.close();
    });

    test.use({ storageState: storageStatePath });

    for (const route of routesByRole[role].allowed) {
      test(`[allowed] ${route}`, async ({ page }) => {
        const response = await page.goto(route);
        expect(response).toBeTruthy();
        expect(response!.status()).toBeLessThan(400);

        await page.waitForLoadState('networkidle');

        // assert NOT unauthorized
        await expect(page.getByText(/forbidden/i)).toHaveCount(0);
      });
    }

    for (const route of routesByRole[role].forbidden) {
      test(`[forbidden] ${route}`, async ({ page }) => {
        const response = await page.goto(route);
        expect(response).toBeTruthy();
        expect(response!.status()).toBeLessThan(400);

        await page.waitForLoadState('networkidle');

        // assert unauthorized screen (choose one)
        await expect(page.getByText(/forbidden/i)).toBeVisible();
      });
    }
  });
}
