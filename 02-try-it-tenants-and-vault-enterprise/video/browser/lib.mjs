// Shared by every browser script: the same browser and viewport, sign-in
// helpers that keep secrets in memory, and the highlight from the screenshot
// guideline. Run the scripts from video/: `node browser/NN-<chapter>.mjs`.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const oc = (...args) =>
  execFileSync('oc', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// Addresses come from the cluster, so the scripts work on any cluster.
export const url = {
  console: () => oc('whoami', '--show-console'),
  vault: () => 'https://' + oc('-n', 'vault', 'get', 'route', 'vault-ui', '-o', 'jsonpath={.spec.host}'),
  mto: () => 'https://' + oc('-n', 'multi-tenant-operator', 'get', 'route', '-o',
    'jsonpath={range .items[?(@.spec.to.name=="tenant-operator-console")]}{.spec.host}{end}'),
  reloader: () => 'https://reloader.' + oc('get', 'ingresses.config', 'cluster', '-o', 'jsonpath={.spec.domain}'),
};

// Multi Tenant Operator's installed version, such as tenant-operator.v1.10.2:
// OLM upgrades it, so the console's operator pages can't use a fixed name.
export const mtoCsv = () =>
  oc('-n', 'multi-tenant-operator', 'get', 'csv', '-o', 'name').split('\n')
    .map((n) => n.replace(/^.*\//, '')).find((n) => n.startsWith('tenant-operator.v'));

const contextOptions = {
  viewport: { width: 1920, height: 1080 },
  colorScheme: 'light',
  locale: 'en-US',
  ignoreHTTPSErrors: true,
};

// sessions: 'openshift' and/or 'mto'. They are signed in first, in a browser
// that isn't recorded, so the clip starts already signed in.
export async function start(clip, { sessions = [] } = {}) {
  mkdirSync('clips/raw', { recursive: true });
  const browser = await chromium.launch();
  const states = [];
  for (const s of sessions) states.push(s === 'openshift' ? await openshiftState(browser) : await mtoState(browser));
  const storageState = {
    cookies: states.flatMap((s) => s.cookies),
    origins: states.flatMap((s) => s.origins),
  };
  const context = await browser.newContext({
    ...contextOptions,
    storageState,
    recordVideo: { dir: 'clips/raw', size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  // The video starts with the page; record.sh puts this in the timeline.
  const t0 = Date.now();
  writeFileSync(`clips/.${clip}.start`, (t0 / 1000).toFixed(3));
  return { browser, context, page, clip, t0 };
}

// Same style as the screenshots: 3 px Stakater orange, drawn in the page.
export async function highlight(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    el.style.outline = '3px solid #EA7845';
    el.style.outlineOffset = '4px';
    el.style.borderRadius = '6px';
  });
  await locator.page().waitForTimeout(1500); // let the viewer see it
}

export const pause = (page, ms = 2000) => page.waitForTimeout(ms);

// Seconds into the clip where something starts, for the edit:
// clips/marks.csv holds clip, label, seconds.
export function mark({ clip, t0 }, label) {
  appendFileSync('clips/marks.csv', `${clip},${label},${((Date.now() - t0) / 1000).toFixed(1)}\n`);
}

// Close to flush the video, then save it under the chapter's name.
export async function finish({ browser, context, page, clip }) {
  const video = page.video();
  writeFileSync(`clips/.${clip}.end`, (Date.now() / 1000).toFixed(3));
  await context.close();
  await video.saveAs(`clips/${clip}.webm`);
  await video.delete();
  await browser.close();
}

// --- OpenShift console ------------------------------------------------------

// A saved session (OCP_CONSOLE_STATE, a Playwright storage state file made by
// console-session.mjs) for clusters that sign in through SSO; otherwise the
// login form, with OCP_CONSOLE_USER and the password read from
// OCP_CONSOLE_PASSWORD_FILE.
async function openshiftState(browser) {
  const saved = process.env.OCP_CONSOLE_STATE;
  if (saved && existsSync(saved)) {
    const state = JSON.parse(readFileSync(saved, 'utf8'));
    if (!(await consoleSessionWorks(browser, state))) {
      throw new Error('The OpenShift console session in OCP_CONSOLE_STATE has ended. Save a new one: node browser/console-session.mjs');
    }
    return state;
  }
  const user = process.env.OCP_CONSOLE_USER;
  const file = process.env.OCP_CONSOLE_PASSWORD_FILE;
  if (!user || !file) throw new Error('Set OCP_CONSOLE_USER and OCP_CONSOLE_PASSWORD_FILE, or OCP_CONSOLE_STATE');
  const consoleUrl = url.console();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(consoleUrl).catch(() => {}); // redirects to the login page while loading
  const idp = process.env.OCP_CONSOLE_IDP;
  if (idp) await page.getByRole('link', { name: idp }).click();
  await page.locator('input[name="username"], #inputUsername, #username').first().fill(user);
  await page.locator('input[type="password"]').first().fill(readFileSync(file, 'utf8').trim());
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForURL((u) => u.href.startsWith(consoleUrl) && !u.pathname.startsWith('/auth'), { timeout: 120000 });
  await page.locator('nav').first().waitFor({ timeout: 60000 });
  const state = await context.storageState();
  await context.close();
  return state;
}

// A saved session ends when its SSO session does. The console then sends the
// browser to the sign-in page, on another host.
export async function consoleSessionWorks(browser, storageState) {
  const base = url.console();
  const context = await browser.newContext({ ...contextOptions, storageState });
  const page = await context.newPage();
  await page.goto(base).catch(() => {});
  const signedIn = await page.locator('nav').first().waitFor({ timeout: 60000 }).then(() => true, () => false);
  await pause(page, 3000);
  const onConsole = page.url().startsWith(base) && !new URL(page.url()).pathname.startsWith('/auth');
  await context.close();
  return signedIn && onConsole;
}

// Console pages: wait for the page, close the 4.22 welcome tour.
export async function consoleGo(page, route, waitText) {
  const base = url.console();
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((u) => u.href.startsWith(base) && !u.pathname.startsWith('/auth'), { timeout: 90000 });
  const skip = page.getByRole('button', { name: /skip tour/i });
  if (await skip.waitFor({ timeout: 4000 }).then(() => true).catch(() => false)) {
    await skip.click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
  }
  if (waitText) await page.getByText(waitText).first().waitFor({ timeout: 90000 });
  await pause(page, 1000);
}

// --- Multi-Tenant Operator console ------------------------------------------

// The built-in account; its password is read from the cluster, in memory.
async function mtoState(browser) {
  const password = Buffer.from(oc('-n', 'multi-tenant-operator', 'get', 'secret',
    'tenant-operator-console-credentials', '-o', 'jsonpath={.data.passwordPlainText}'), 'base64').toString();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(url.mto() + '/').catch(() => {});
  await page.locator('input[name="login"], input[type="email"]').first().fill('mto@stakater.com');
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /sign in|log ?in/i }).first().click();
  const grant = page.getByRole('button', { name: /grant access/i });
  await Promise.race([
    page.waitForURL((u) => !u.pathname.includes('/dex'), { timeout: 60000 }),
    grant.waitFor({ timeout: 60000 }).then(() => grant.click()),
  ]);
  await page.waitForURL((u) => !u.pathname.includes('/dex'), { timeout: 60000 });
  // The session is the OIDC user the console keeps in localStorage.
  await page.waitForFunction(() => Object.keys(localStorage).some((k) => k.startsWith('oidc.user:')), null, { timeout: 60000 });
  const state = await context.storageState();
  await context.close();
  return state;
}

// --- Vault UI ---------------------------------------------------------------

// Signs in to a Vault namespace with the tutorial's dev root token and lands
// on a route. A root token lives only in the page, so this is recorded; the
// mark tells the edit where the sign-in ends.
export async function vaultGo(s, ns, route) {
  const { page } = s;
  await page.goto(`${url.vault()}/ui/vault/auth?with=token&namespace=${ns}&redirect_to=${encodeURIComponent(route)}`);
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.locator('input[name="token"], #token').first().fill('root');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes('/auth'), { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // The root-token warning comes up a moment after the sign-in and stays.
  const toast = page.locator('.hds-toast').filter({ hasText: /root token/i }).first();
  if (await toast.waitFor({ timeout: 5000 }).then(() => true).catch(() => false)) {
    await toast.getByRole('button').last().click().catch(() => {});
    await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  mark(s, `vault ${ns || 'root'} ${route.split('?')[0]}`);
  await pause(page, 1000);
}

export async function openNamespacePicker(page) {
  await page.locator('[data-test-namespace-toggle], button:has-text("root")').first().click();
  await pause(page, 1000);
}

export const namespaceEntry = (page, ns) =>
  page.locator('li').filter({ hasText: new RegExp(`^\\s*${ns}\\s*$`) }).first().getByText(ns, { exact: true });
