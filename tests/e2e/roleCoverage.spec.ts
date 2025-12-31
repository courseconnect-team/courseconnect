import { expect, test } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';

type RoleKey = 'student' | 'faculty' | 'admin';
type RouteCheck = { path: string; expectText?: RegExp | string };

const routesByRole: Record<RoleKey, RouteCheck[]> = {
  student: [
    { path: '/dashboard' },
    { path: '/applications' },
    { path: '/profile' },
  ],
  faculty: [
    { path: '/dashboard' },
    { path: '/applications' },
    { path: '/profile' },
  ],
  admin: [
    { path: '/dashboard' },
    { path: '/applications' },
    { path: '/profile' },
  ],
};

const navLabels: Partial<Record<RoleKey, string[]>> = {
  student: ['Applications', 'Status'],
  faculty: ['Applications', 'Courses'],
  admin: [
    'Users',
    'Applications',
    'Courses',
    'Scheduling',
    'Faculty Stats',
    'Announcements',
  ],
};

const setRoleInStorage = async (page, role: RoleKey) => {
  await page.addInitScript(
    ({ roleKey }) => {
      localStorage.setItem('e2e_role', roleKey);
      localStorage.setItem('e2e_email', `${roleKey}@example.com`);
      localStorage.setItem('e2e_name', `${roleKey} user`);
    },
    { roleKey: role }
  );
};

const expectNotLoading = async (page) => {
  const loadingNode = page.getByText(/loading/i).first();
  if (await loadingNode.isVisible({ timeout: 500 }).catch(() => false)) {
    await loadingNode
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }
};

(['student', 'faculty', 'admin'] as RoleKey[]).forEach((role) => {
  test.describe(`[${role}] role-based coverage`, () => {
    test.beforeEach(async ({ page }) => {
      await setRoleInStorage(page, role);
    });

    const labels = navLabels[role];
    const routes = routesByRole[role];

    if (labels) {
      test('sidebar shows expected links', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 45_000 });
        await expectNotLoading(page);
        for (const label of labels) {
          await expect(page.getByTestId(`nav-${label}`)).toBeVisible();
        }
      });
    }

    if (routes) {
      test('core routes render without console errors', async ({ page }) => {
        for (const route of routes) {
          const { errors, dispose } = collectConsoleErrors(page);

          const response = await page.goto(route.path, {
            waitUntil: 'domcontentloaded',
          });
          expect(response, `No response for ${route.path}`).toBeTruthy();
          expect(
            response!.status(),
            `Bad status for ${route.path}`
          ).toBeLessThan(400);

          await page.waitForLoadState('networkidle', { timeout: 45_000 });
          await expectNotLoading(page);
          await expect(page.locator('body')).toBeVisible();

          expect(errors, `Console errors on ${route.path}`).toEqual([]);
          dispose();
        }
      });
    }
  });
});
