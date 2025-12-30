import fs from 'fs';
import path from 'path';
import { expect, test as setup } from '@playwright/test';

type Account = { email: string; password: string };

const accountCandidates = [
  path.join(process.cwd(), 'playwright.accounts.json'),
  path.join(process.cwd(), 'tests', 'utils', 'playwright.accounts.json'),
];
const accountsPath = accountCandidates.find((p) => fs.existsSync(p));
const accounts: Record<string, Account> = accountsPath
  ? JSON.parse(fs.readFileSync(accountsPath, 'utf-8'))
  : {};

setup.describe.configure({ mode: 'serial' });
setup.skip(
  Object.keys(accounts).length === 0,
  'No accounts file found for auth setup'
);

setup.beforeAll(async () => {
  await fs.promises.mkdir('playwright/.auth', { recursive: true });
});

async function fillLoginForm(page, creds: Account) {
  // Try label-based first, then fall back to name selectors.
  const emailLocator = page.getByLabel(/email/i).first();
  const passwordLocator = page.getByLabel(/password/i).first();
  const fallbackEmail = page.locator(
    'input[name="email"], input[type="email"]'
  );
  const fallbackPassword = page.locator(
    'input[name="password"], input[type="password"]'
  );

  const emailField = (await emailLocator.count())
    ? emailLocator
    : fallbackEmail;
  const passwordField = (await passwordLocator.count())
    ? passwordLocator
    : fallbackPassword;

  await emailField.waitFor({ state: 'visible', timeout: 20_000 });
  await passwordField.waitFor({ state: 'visible', timeout: 20_000 });

  await emailField.fill(creds.email);
  await passwordField.fill(creds.password);
}

for (const [role, creds] of Object.entries(accounts)) {
  setup(`${role} login`, async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await fillLoginForm(page, creds);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 45_000 });
    await page
      .context()
      .storageState({ path: `playwright/.auth/${role}.json` });
  });
}
