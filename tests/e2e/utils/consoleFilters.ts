import type { ConsoleMessage, Page } from '@playwright/test';

const ignoredErrorPatterns = [];

export type ConsoleCollector = {
  errors: string[];
  dispose: () => void;
};

export function collectConsoleErrors(page: Page): ConsoleCollector {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ignoredErrorPatterns.some((pat) => pat.test(text))) return;
    errors.push(text);
  };

  page.on('console', handler);

  return {
    errors,
    dispose: () => page.off('console', handler),
  };
}
