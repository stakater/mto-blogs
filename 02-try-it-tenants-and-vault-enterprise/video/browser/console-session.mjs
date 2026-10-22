// Saves a signed-in OpenShift console session, for clusters that sign in
// through SSO, to the file in OCP_CONSOLE_STATE. It opens a browser window:
// sign in there. With --check, it only says whether the saved one still works.
//
//   export OCP_CONSOLE_STATE=~/.config/post2-console-session.json
//   node browser/console-session.mjs           # sign in, save
//   node browser/console-session.mjs --check   # record.sh runs this first
import { chromium } from 'playwright';
import { chmodSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { url, consoleSessionWorks } from './lib.mjs';

const file = process.env.OCP_CONSOLE_STATE;
if (!file) throw new Error('Set OCP_CONSOLE_STATE to where the session goes, outside video/');
// The session signs in as you, so it never goes under video/.
if (path.resolve(file).startsWith(path.resolve('.') + path.sep)) throw new Error('Keep OCP_CONSOLE_STATE outside video/');

if (process.argv.includes('--check')) {
  const browser = await chromium.launch();
  const works = existsSync(file) && (await consoleSessionWorks(browser, JSON.parse(readFileSync(file, 'utf8'))));
  await browser.close();
  if (!works) {
    console.error('The OpenShift console session in OCP_CONSOLE_STATE has ended or is missing. Save a new one: node browser/console-session.mjs');
    process.exit(1);
  }
} else {
  const base = url.console();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.goto(base).catch(() => {}); // redirects to the sign-in page while loading
  console.log('Sign in to the OpenShift console in the browser window (10 minutes at most).');
  await page.waitForURL((u) => !u.href.startsWith(base) || u.pathname.startsWith('/auth'), { timeout: 60000 });
  await page.waitForURL((u) => u.href.startsWith(base) && !u.pathname.startsWith('/auth'), { timeout: 600000 });
  await page.locator('nav').first().waitFor({ timeout: 60000 });
  await context.storageState({ path: file });
  chmodSync(file, 0o600);
  await browser.close();
  console.log('Saved.');
}
