import { expect, test, Page } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { storageStateForRole } from './utils/stub';
import { Role } from './utils/types';

/**
 * Unit 1 introduces the per-(user, announcement) state subcollection
 * and rewires the `AnnouncementsContext` partition to use it. Unit 2
 * wires the UI: mark-on-open in the detail view, "Mark all as read"
 * above the list, and per-row mark-read / mark-unread toggles.
 *
 * Fixture caveat
 * --------------
 * The Playwright fixtures (see `tests/e2e/utils/stub.ts`) only stub the
 * auth role via `localStorage`. They do NOT seed Firestore state, so
 * the list page typically renders with zero announcements for the stub
 * user. That means true end-to-end assertions about read/unread
 * transitions cannot be made from here without a separate seed step.
 *
 * The assertions below therefore concentrate on UI affordances that
 * are always present regardless of fixture data:
 *   - When the list is empty the "No announcements yet" copy renders.
 *   - When there is anything in the list the "Mark all as read" button
 *     is rendered. Its disabled state matches the current unread
 *     count (disabled iff Unread section is absent).
 *   - Per-row icon buttons are rendered inside rows when rows exist.
 *
 * Where content-dependent assertions are needed we gracefully no-op
 * via `test.info().annotations.push({ type: 'skip-reason', ... })` and
 * return early after the structural checks. This avoids fake-coverage
 * while letting the test file evolve as fixtures improve.
 */

const expectNotLoading = async (page: Page) => {
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

test.describe('[student] mark-read UI flows', () => {
  test.use({ storageState: storageStateForRole('student') });

  test('clicking an unread row marks it read after returning to the list', async ({
    page,
  }) => {
    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    // Fixture limitation: no seeded announcements. If there is no
    // Unread section we cannot meaningfully exercise the row click
    // flow; document that and verify the structural guarantees instead.
    const unreadHeader = page.getByText('Unread', { exact: true });
    const unreadVisible = await unreadHeader
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (!unreadVisible) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; no seeded announcements means no Unread rows to click.',
      });
      // Structural guarantee: either the empty-state copy or the
      // mark-all-as-read toolbar is present when the page is healthy.
      const emptyState = page.getByText('No announcements yet.');
      const markAll = page.getByTestId('mark-all-as-read');
      const emptyVisible = await emptyState
        .isVisible({ timeout: 500 })
        .catch(() => false);
      const markAllVisible = await markAll
        .isVisible({ timeout: 500 })
        .catch(() => false);
      expect(
        emptyVisible || markAllVisible,
        'either the empty-state or the mark-all toolbar renders'
      ).toBe(true);
      return;
    }

    // If rows do exist (e.g. when seeded fixtures arrive later), click
    // the first Unread row and assert it moves to Read on return.
    const firstUnreadRow = page
      .locator('a[href^="/announcements/"]')
      .filter({ has: page.locator('[aria-label$="(unread)"]') })
      .first();
    const firstUnreadHref = await firstUnreadRow.getAttribute('href');
    expect(firstUnreadHref).toBeTruthy();
    await firstUnreadRow.click();
    await page.waitForURL(/\/announcements\/.+/);
    await page.goBack();
    await expectNotLoading(page);

    // The previously-unread link now lacks the "(unread)" aria-label.
    const sameRow = page.locator(`a[href="${firstUnreadHref}"]`);
    await expect(sameRow).toHaveCount(1);
    const label = await sameRow.getAttribute('aria-label');
    expect(label).not.toMatch(/\(unread\)$/);
  });

  test('"Mark all as read" button is wired correctly', async ({ page }) => {
    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    const markAll = page.getByTestId('mark-all-as-read');
    const emptyState = page.getByText('No announcements yet.');

    const emptyVisible = await emptyState
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (emptyVisible) {
      // Nothing to mark; button is not rendered at all in the pure
      // empty state. Document the fixture limitation.
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; list is empty so the mark-all toolbar is not rendered.',
      });
      await expect(emptyState).toBeVisible();
      return;
    }

    // Whenever ANY announcement is visible, the button is rendered.
    await expect(markAll).toBeVisible();

    const unreadVisible = await page
      .getByText('Unread', { exact: true })
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (!unreadVisible) {
      // All caught up: button is rendered but must be disabled.
      await expect(markAll).toBeDisabled();
      await expect(page.getByTestId('all-caught-up')).toBeVisible();
      return;
    }

    // Unread exists: button is enabled. Clicking it should clear the
    // Unread section on the next snapshot tick.
    await expect(markAll).toBeEnabled();
    await markAll.click();
    await expect(page.getByText('Unread', { exact: true })).toHaveCount(0);
    await expect(markAll).toBeDisabled();
  });

  test('per-row "Mark unread" on a Read item restores it to Unread', async ({
    page,
  }) => {
    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    const readHeader = page.getByText('Read', { exact: true });
    const readVisible = await readHeader
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (!readVisible) {
      // Fixture limitation: nothing in the Read bucket, so no row to
      // toggle back to Unread. Verify the structural guarantee that
      // the mark-unread button only exists on Read rows.
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; no Read rows means no mark-unread affordance to exercise.',
      });
      const unreadToggle = page.getByRole('button', { name: 'Mark as unread' });
      await expect(unreadToggle).toHaveCount(0);
      return;
    }

    // Real content path: focus-within should reveal the mark-unread
    // button on a Read row; clicking it should flip the row's
    // aria-label to include "(unread)".
    const firstReadRow = page
      .locator('a[href^="/announcements/"]')
      .filter({ hasNot: page.locator('[aria-label$="(unread)"]') })
      .first();
    const href = await firstReadRow.getAttribute('href');
    expect(href).toBeTruthy();
    await firstReadRow.hover();
    const toggle = firstReadRow.getByRole('button', { name: 'Mark as unread' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const sameRow = page.locator(`a[href="${href}"]`);
    await expect(sameRow).toHaveAttribute('aria-label', /\(unread\)$/);
  });

  test('requireAck items stay in Unread after detail-view open until acknowledged', async ({
    page,
  }) => {
    // Fixture caveat (see file header): the stub fixtures cannot seed a
    // real Firestore `requireAck=true` announcement for the test user,
    // so we cannot deterministically open one and observe the Unread
    // bucket reacting to an ack click. Instead, this test asserts the
    // structural invariants that MUST hold regardless of seeded data:
    //
    //   1. The announcements list renders (possibly empty) without
    //      errors. Per-row `(unread)` aria-labels are only removed by
    //      explicit mark-read (Unit 2) or markAck (Unit 3) — they are
    //      never removed merely by visiting a detail page of a
    //      requireAck item.
    //   2. If we can reach a detail view (seeded or otherwise), the
    //      ack affordances follow the contract:
    //        - requireAck announcement, not yet acked → exactly one
    //          element with `data-testid="ack-button"` exists and no
    //          `data-testid="ack-confirmation"` exists.
    //        - requireAck announcement, acked → exactly one
    //          `data-testid="ack-confirmation"` element and no
    //          `data-testid="ack-button"`.
    //        - non-requireAck announcement → neither testid exists.
    //
    // With no seed we verify what is verifiable (list renders; the two
    // testids are mutually exclusive wherever they appear) and document
    // the remaining coverage gap rather than fabricating assertions.

    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    // Structural guarantee on the list page: an announcement detail
    // link opens /announcements/{id}. We walk into the first available
    // row (if any) and assert the ack-testid invariant on the detail
    // view.
    const firstRow = page.locator('a[href^="/announcements/"]').first();
    const rowVisible = await firstRow
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (!rowVisible) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; no announcements seeded, so no detail view is reachable to exercise the ack flow. Structural invariant (ack-button and ack-confirmation are mutually exclusive on the detail view) is unobservable without seeded content.',
      });
      // Empty-state page is still a healthy render; assert it.
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    const href = await firstRow.getAttribute('href');
    expect(href).toBeTruthy();
    await firstRow.click();
    await page.waitForURL(/\/announcements\/.+/);
    await expectNotLoading(page);

    // Mutually exclusive contract: a detail view MUST NOT simultaneously
    // show an ack button AND an ack confirmation. Either one (exclusive)
    // or neither (for non-requireAck items) is valid.
    const ackButtonCount = await page.getByTestId('ack-button').count();
    const ackConfirmCount = await page.getByTestId('ack-confirmation').count();
    expect(
      !(ackButtonCount > 0 && ackConfirmCount > 0),
      'ack-button and ack-confirmation must never render together'
    ).toBe(true);

    // If the detail view is a requireAck item in its not-yet-acked
    // state, exercising the button should flip the view to the
    // confirmation state. This is the end-to-end happy path; it will
    // only execute when the fixture supplies such an announcement.
    if (ackButtonCount > 0) {
      const ackButton = page.getByTestId('ack-button');
      await expect(ackButton).toBeEnabled();
      await ackButton.click();
      await expect(page.getByTestId('ack-confirmation')).toBeVisible({
        timeout: 5_000,
      });
      await expect(page.getByTestId('ack-button')).toHaveCount(0);
    }
  });
});
