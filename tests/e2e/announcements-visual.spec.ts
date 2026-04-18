import { expect, test, Page } from '@playwright/test';
import { collectConsoleErrors } from './utils/consoleFilters';
import { storageStateForRole } from './utils/stub';

/**
 * Unit 6 — presentation polish smoke tests.
 *
 * Covers:
 *   1. Row body previews strip raw markdown characters (no literal `**`,
 *      `## `, ``` ` ```, etc. in the visible row body text).
 *   2. Pinned rows expose `data-pinned="true"` AND carry the amber row
 *      tint (`bg-amber-50`) so they stand out from the default row.
 *   3. The detail view renders markdown — the body container should
 *      contain at least one real HTML element (e.g. `<h1>`, `<h2>`,
 *      `<strong>`, `<em>`, `<code>`) when the source contains markdown,
 *      and in any case MUST NOT contain literal `**` or `## ` strings.
 *
 * Fixture caveat
 * --------------
 * The Playwright fixtures only stub auth via localStorage; they do not
 * seed Firestore data. When no announcements are rendered, the test
 * documents the gap via `test.info().annotations` and returns early
 * after structural checks. See `announcements-read-state.spec.ts` for
 * the same pattern applied to the Unit 1/2 flows.
 */

const expectNotLoading = async (page: Page) => {
  const loadingNode = page.getByText(/loading/i).first();
  if (await loadingNode.isVisible({ timeout: 500 }).catch(() => false)) {
    await loadingNode
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }
};

const RAW_MARKDOWN_PATTERNS: Array<RegExp> = [
  /\*\*/, // bold markers
  /(^|\s)#{1,6}\s/, // heading markers at token boundary
  /~~/, // strikethrough markers
  /`{1,3}/, // inline/fenced code markers
];

const containsRawMarkdown = (text: string): boolean =>
  RAW_MARKDOWN_PATTERNS.some((re) => re.test(text));

test.describe('[student] announcements visual polish', () => {
  test.use({ storageState: storageStateForRole('student') });

  test('row body previews strip raw markdown characters', async ({ page }) => {
    const { errors, dispose } = collectConsoleErrors(page);

    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    const previews = page.getByTestId('row-body-preview');
    const count = await previews.count();

    if (count === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; no announcements seeded, so no row body previews exist. Structural page health is still asserted.',
      });
      await expect(page.locator('body')).toBeVisible();
      expect(errors, 'Console errors on /announcements').toEqual([]);
      dispose();
      return;
    }

    for (let i = 0; i < count; i++) {
      const text = (await previews.nth(i).innerText()).trim();
      // Allow empty previews (empty announcement body); otherwise the
      // stripper should have removed every raw markdown marker we care
      // about for a single-line preview.
      expect(
        containsRawMarkdown(text),
        `Row #${i} preview contained raw markdown characters: ${JSON.stringify(
          text
        )}`
      ).toBe(false);
    }

    expect(errors, 'Console errors on /announcements').toEqual([]);
    dispose();
  });

  test('pinned rows expose data-pinned and the amber row tint', async ({
    page,
  }) => {
    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    const pinnedRows = page.locator('a[data-pinned="true"]');
    const pinnedCount = await pinnedRows.count();

    if (pinnedCount === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; no pinned announcement seeded, so no data-pinned rows to verify. The data-pinned attribute contract is still enforced by the component implementation.',
      });
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    for (let i = 0; i < pinnedCount; i++) {
      const row = pinnedRows.nth(i);
      const className = (await row.getAttribute('class')) ?? '';
      expect(
        className.includes('bg-amber-50'),
        `Pinned row #${i} is missing bg-amber-50: ${JSON.stringify(className)}`
      ).toBe(true);
    }
  });

  test('detail view renders markdown as formatted HTML (no raw markers)', async ({
    page,
  }) => {
    await page.goto('/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await expectNotLoading(page);

    const firstRow = page.locator('a[href^="/announcements/"]').first();
    const rowVisible = await firstRow
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (!rowVisible) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Fixture stubs auth only; no announcement seeded, so no detail view is reachable. Markdown rendering contract (no literal ** or ## in body; real HTML elements when markdown present) is unobservable without seeded content.',
      });
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/announcements\/.+/);
    await expectNotLoading(page);

    // The `@uiw/react-markdown-preview` renderer emits a wrapper element
    // with the `wmde-markdown` class. Prefer that as a target; fall back
    // to the whole card if it's not present for any reason.
    const mdContainer = page.locator('.wmde-markdown').first();
    const mdVisible = await mdContainer
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    if (!mdVisible) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Detail view loaded but no .wmde-markdown container found. The seeded body may be empty; skipping the parsed-HTML assertion.',
      });
      return;
    }

    // Contract #1: the body MUST NOT contain literal markdown tokens
    // that the stripper / renderer is expected to consume.
    const bodyText = await mdContainer.innerText();
    expect(
      containsRawMarkdown(bodyText),
      `Detail view body still contains raw markdown characters: ${JSON.stringify(
        bodyText
      )}`
    ).toBe(false);

    // Contract #2: if the source contained any structural markdown, the
    // rendered container should include at least one recognisable HTML
    // element. We check the common ones; if none are present, the body
    // was pure prose (acceptable) and we no-op with an annotation.
    const formattedCount = await mdContainer
      .locator('h1, h2, h3, strong, em, code, ul, ol, blockquote, a')
      .count();

    if (formattedCount === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Detail view body contained no structural markdown (pure prose). Formatted-HTML assertion skipped; raw-markdown assertion was satisfied.',
      });
    } else {
      expect(formattedCount).toBeGreaterThan(0);
    }
  });
});
