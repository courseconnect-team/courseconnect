import { expect, test } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { storageStateForRole } from './utils/stub';
import { Role } from './utils/types';
const routesByRole: Record<Role, { allowed: string[]; forbidden: string[] }> = {
  student: {
    allowed: [
      '/dashboard',
      '/applications',
      '/profile',
      '/status',
      '/features',
      '/underDevelopment',
      '/announcements',
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
      '/applications',
      '/profile',
      '/features',
      '/announcements',
      '/courses',
      '/underDevelopment',
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
      '/faculty-stats',
      '/admincourses',
      '/admin-applications',
      '/users',
      '/underDevelopment',
      '/features',
    ],
    forbidden: [],
  },
};

const expectNotLoading = async (page) => {
  const loadingNode = page.getByText(/loading/i).first();
  if (await loadingNode.isVisible({ timeout: 500 }).catch(() => false)) {
    await loadingNode
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }
};

(['student', 'faculty', 'admin'] as Role[]).forEach((role) => {
  test.describe(`${role} access control`, () => {
    test.use({ storageState: storageStateForRole(role) });

    for (const route of routesByRole[role].allowed) {
      test(`[allowed] ${route}`, async ({ page }) => {
        const { errors, dispose } = collectConsoleErrors(page);

        const response = await page.goto(route, {
          waitUntil: 'domcontentloaded',
        });
        expect(response, `No response for ${route}`).toBeTruthy();
        expect(response!.status(), `Bad status for ${route}`).toBeLessThan(400);

        await page.waitForLoadState('networkidle');
        await expectNotLoading(page);
        await expect(page.getByText(/Forbidden/i)).toHaveCount(0);

        expect(errors, `Console errors on ${route}`).toEqual([]);
        dispose();
      });
    }

    for (const route of routesByRole[role].forbidden) {
      test(`[forbidden] ${route}`, async ({ page }) => {
        const { errors, dispose } = collectConsoleErrors(page);

        const response = await page.goto(route, {
          waitUntil: 'domcontentloaded',
        });
        expect(response, `No response for ${route}`).toBeTruthy();
        expect(response!.status(), `Bad status for ${route}`).toBeLessThan(400);

        await page.waitForLoadState('networkidle');
        await expectNotLoading(page);

        const unauthorizedMessage = page.getByText(/Forbidden/i);
        await expect(unauthorizedMessage).toBeVisible();

        expect(errors, `Console errors on ${route}`).toEqual([]);
        dispose();
      });
    }
  });
});
