import { expect, test } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { storageStateForRole } from './utils/stub';
import { Role } from './utils/types';

/**
 * Unit 1 introduces the per-(user, announcement) state subcollection
 * and rewires the `AnnouncementsContext` partition to use it. There is
 * no new UI yet (that lands in Unit 2), so this file provides:
 *
 *   1. A smoke test per role that the `/announcements` page still
 *      renders cleanly after the partition rewrite — guards against
 *      the new `useAnnouncementStates` subscription breaking the page
 *      for anyone.
 *   2. Skipped scenarios describing the UI-driven flows that Unit 2
 *      will unskip once the mark-read / mark-unread / mark-all-read
 *      affordances land. They are intentionally skipped (not deleted)
 *      so the test surface is staged with the implementation.
 */

const expectNotLoading = async (page) => {
  const loadingNode = page.getByText(/loading/i).first();
  if (await loadingNode.isVisible({ timeout: 500 }).catch(() => false)) {
    await loadingNode
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }
};

(['student', 'faculty', 'admin'] as Role[]).forEach((role) => {
  test.describe(`[${role}] announcements read-state smoke`, () => {
    test.use({ storageState: storageStateForRole(role) });

    test('/announcements renders without console errors', async ({ page }) => {
      const { errors, dispose } = collectConsoleErrors(page);

      const response = await page.goto('/announcements', {
        waitUntil: 'domcontentloaded',
      });
      expect(response).toBeTruthy();
      expect(response!.status()).toBeLessThan(400);

      await page.waitForLoadState('load');
      await expectNotLoading(page);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(/Forbidden/i)).toHaveCount(0);

      expect(errors, 'Console errors on /announcements').toEqual([]);
      dispose();
    });
  });
});

/**
 * UI-level coverage for the mark-* flow is deferred to Unit 2. The
 * scenarios below are intentionally skipped until the list page
 * exposes the "Mark all as read" button and per-row toggle. Unit 2
 * will replace `test.skip` with `test` and fill in the assertions.
 */
test.describe('[deferred to Unit 2] mark-read UI flows', () => {
  test.use({ storageState: storageStateForRole('student') });

  test.skip('clicking an unread row marks it read after returning to the list', async () => {
    // Covered in Unit 2. Expected behavior:
    //   1. Student opens /announcements with >=1 unread item.
    //   2. Clicks the first row → lands on /announcements/[id].
    //   3. Navigates back → the row is now under the Read section.
  });

  test.skip('"Mark all as read" empties the Unread section in one click', async () => {
    // Covered in Unit 2. Requires the button introduced in
    // AnnouncementSections.tsx.
  });

  test.skip('per-row "Mark unread" on a Read item restores it to Unread', async () => {
    // Covered in Unit 2. Requires the per-row IconButton /
    // overflow menu introduced in AnnouncementsRow.tsx.
  });

  test.skip('requireAck items stay in Unread after detail-view open until acknowledged', async () => {
    // Covered in Unit 3 (ack flow). The partition rule from Unit 1
    // already enforces this; Unit 3 adds the acknowledge button.
  });
});
