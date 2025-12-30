import fs from 'fs';
import { expect, test } from '@playwright/test';

type RoleKey = 'student' | 'faculty' | 'admin';
type RouteCheck = { path: string; expectText?: RegExp | string };

const routesByRole: Record<RoleKey, RouteCheck[]> = {
  student: [
    { path: '/dashboard', expectText: /Dashboard/i },
    { path: '/applications', expectText: /Applications/i },
    { path: '/status', expectText: /Status/i },
    { path: '/profile', expectText: /User Profile/i },
  ],
  faculty: [
    { path: '/dashboard', expectText: /Dashboard/i },
    { path: '/applications', expectText: /Applications/i },
    { path: '/courses', expectText: /Courses/i },
    { path: '/announcements', expectText: /Announcements/i },
    { path: '/profile', expectText: /User Profile/i },
  ],
  admin: [
    { path: '/dashboard', expectText: /Dashboard/i },
    { path: '/admin-applications', expectText: /Applications & Assignments/i },
    { path: '/admincourses', expectText: /Admin Courses/i },
    { path: '/faculty-stats', expectText: /Faculty Statistics/i },
    { path: '/announcements', expectText: /Announcements/i },
    { path: '/users', expectText: /Users/i },
    { path: '/profile', expectText: /User Profile/i },
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

const storagePathFor = (role: RoleKey) => `playwright/.auth/${role}.json`;

test.describe('role-based coverage', () => {
  test('sidebar shows expected links for the role', async ({ page }) => {
    const role = test.info().project.name as RoleKey;
    const labels = navLabels[role];
    test.skip(!labels, `No nav expectations for role ${role}`);
    test.skip(
      !fs.existsSync(storagePathFor(role)),
      `Missing storage state for role ${role}`
    );

    await page.goto('/dashboard');
    for (const label of labels) {
      await expect(
        page.getByRole('link', { name: new RegExp(label, 'i') }),
        `Missing sidebar link ${label}`
      ).toBeVisible();
    }
  });

  test('core routes render without console errors', async ({ page }) => {
    const role = test.info().project.name as RoleKey;
    const routes = routesByRole[role];
    test.skip(!routes, `No routes registered for role ${role}`);
    test.skip(
      !fs.existsSync(storagePathFor(role)),
      `Missing storage state for role ${role}`
    );

    for (const route of routes) {
      const consoleErrors: string[] = [];
      const handler = (msg: { type: () => string; text: () => string }) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      };
      page.on('console', handler);

      const response = await page.goto(route.path);
      expect(response, `No response for ${route.path}`).toBeTruthy();
      expect(response!.status(), `Bad status for ${route.path}`).toBeLessThan(
        400
      );

      await page.waitForLoadState('networkidle');
      if (route.expectText) {
        await expect(
          page.getByText(route.expectText, { exact: false }),
          `Missing expected text for ${route.path}`
        ).toBeVisible();
      }

      expect(consoleErrors, `Console errors on ${route.path}`).toEqual([]);
      page.off('console', handler as any);
    }
  });
});
