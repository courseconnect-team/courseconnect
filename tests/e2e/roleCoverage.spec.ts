import { expect, test } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { Role } from './utils/types';
import { storageStateForRole } from './utils/stub';
type RouteCheck = { path: string; expectText?: RegExp | string };

const routesByRole: Record<Role, RouteCheck[]> = {
  student: [
    { path: '/dashboard' },
    { path: '/applications' },
    { path: '/Profile' },
  ],
  faculty: [
    { path: '/dashboard' },
    { path: '/applications' },
    { path: '/Profile' },
  ],
  admin: [
    { path: '/dashboard' },
    { path: '/applications' },
    { path: '/Profile' },
  ],
};

const navLabels: Partial<Record<Role, string[]>> = {
  student: ['Applications', 'Research', 'Status', 'Announcements'],
  faculty: ['Applications', 'Research', 'Courses', 'Announcements'],
  admin: [
    'Users',
    'Applications',
    'Courses',
    'Scheduling',
    'Faculty Stats',
    'Research',
    'Announcements',
  ],
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
  test.describe(`[${role}] role-based coverage`, () => {
    test.use({ storageState: storageStateForRole(role) });

    const labels = navLabels[role];
    const routes = routesByRole[role];

    if (labels) {
      test('sidebar shows expected links', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('load');
        await expectNotLoading(page);
        for (const label of labels) {
          await expect(
            page.getByTestId(`nav-${label}`).first()
          ).toBeVisible();
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

          await page.waitForLoadState('load');
          await expectNotLoading(page);
          await expect(page.locator('body')).toBeVisible();

          expect(errors, `Console errors on ${route.path}`).toEqual([]);
          dispose();
        }
      });
    }
  });
});
