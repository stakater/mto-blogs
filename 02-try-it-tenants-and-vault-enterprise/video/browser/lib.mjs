// Shared by the scenes: panes recorded at their final size, sign-in helpers
// that keep secrets in memory, the highlight from the screenshot guideline,
// and the "watch until the change appears" loop of the recording guideline.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

export const oc = (...args) =>
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

const contextOptions = (width, height) => ({
  viewport: { width, height },
  colorScheme: 'light',
  locale: 'en-US',
  ignoreHTTPSErrors: true,
});

// A pane: one page recorded at its final size. t0 is when its video starts;
// ready is set once the pane shows what the viewer should see first.
export async function newPane(browser, { clip, width, height, storageState }) {
  mkdirSync('clips/raw', { recursive: true });
  const context = await browser.newContext({
    ...contextOptions(width, height),
    storageState,
    recordVideo: { dir: 'clips/raw', size: { width, height } },
  });
  const page = await context.newPage();
  return { context, page, clip, t0: Date.now(), ready: null, end: null };
}

export function ready(pane, at = Date.now()) { pane.ready = at; }

// Close to flush the video, then save it under the clip's name.
export async function finishPane(pane) {
  pane.end ??= Date.now();
  const video = pane.page.video();
  await pane.context.close();
  await video.saveAs(`clips/${pane.clip}.webm`);
  await video.delete();
}

// clips/marks.csv: clip, label, seconds into the clip, and the box of what
// was highlighted (x, y, width, height) so the edit can zoom in on it.
export function mark(pane, label, box) {
  const b = box ? [box.x, box.y, box.width, box.height].map((n) => Math.round(n)).join(',') : ',,,';
  appendFileSync('clips/marks.csv', `${pane.clip},${label},${((Date.now() - pane.t0) / 1000).toFixed(1)},${b}\n`);
}

// Same style as the screenshots: 3 px Stakater orange, drawn in the page.
// Consoles that re-render live (the OpenShift console) drop a style set on
// the element, so the same outline is also drawn as a box over it.
export async function highlight(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    el.style.outline = '3px solid #EA7845';
    el.style.outlineOffset = '4px';
    el.style.borderRadius = '6px';
    const r = el.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'recording-highlight';
    box.style.cssText = `position:absolute;pointer-events:none;z-index:2147483647;box-sizing:border-box;
      left:${r.left + window.scrollX - 7}px;top:${r.top + window.scrollY - 7}px;width:${r.width + 14}px;height:${r.height + 14}px;
      border:3px solid #EA7845;border-radius:10px`;
    document.body.appendChild(box);
  });
  return locator.boundingBox();
}

// Removes the highlight boxes before a script moves on in the same page.
export const clearHighlights = (page) => page.evaluate(() => {
  document.querySelectorAll('.recording-highlight').forEach((b) => b.remove());
});

// Highlights each element, marks their combined box, then holds.
export async function highlightAll(pane, locators, { hold = 3000, label = 'after' } = {}) {
  const boxes = [];
  for (const l of locators) { boxes.push(await highlight(l)); await pane.page.waitForTimeout(700); }
  const real = boxes.filter(Boolean);
  const box = real.length && {
    x: Math.min(...real.map((b) => b.x)), y: Math.min(...real.map((b) => b.y)),
    width: Math.max(...real.map((b) => b.x + b.width)) - Math.min(...real.map((b) => b.x)),
    height: Math.max(...real.map((b) => b.y + b.height)) - Math.min(...real.map((b) => b.y)),
  };
  mark(pane, label, box || null);
  await pane.page.waitForTimeout(hold);
}

// The recording guideline's loop: refresh every 2 seconds until find()
// returns what to highlight. refresh is the console's own way to update:
// nothing for a live console, a click on its Refresh, a reload, or an
// in-app refresh for the Vault UI.
// gate, if given, holds back the refresh until it returns true (for a console
// whose refresh shows a loading state: refresh only once the command ran).
export async function watchFor(page, find, { refresh, gate, every = 2000, timeout = 900000 } = {}) {
  const deadline = Date.now() + timeout;
  let open = !gate;
  for (;;) {
    const found = await find(page).catch(() => null);
    if (found) return found;
    if (Date.now() > deadline) throw new Error(`the change never appeared on ${page.url()}`);
    open ||= await gate().catch(() => false);
    // Refresh, then give the page its 2 seconds to load before looking again.
    if (refresh && open) await refresh(page).catch(() => {});
    await page.waitForTimeout(every);
  }
}

// A locator's first match if it's visible now, else null.
export const visible = async (locator) => ((await locator.first().isVisible()) ? locator.first() : null);

export const pause = (page, ms = 2000) => page.waitForTimeout(ms);

// --- OpenShift console ------------------------------------------------------

// A saved session (OCP_CONSOLE_STATE, made by console-session.mjs) for
// clusters that sign in through SSO; otherwise the login form, with
// OCP_CONSOLE_USER and the password read from OCP_CONSOLE_PASSWORD_FILE.
export async function openshiftState(browser) {
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
  const context = await browser.newContext(contextOptions(1920, 1080));
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
  const context = await browser.newContext({ ...contextOptions(1920, 1080), storageState });
  const page = await context.newPage();
  await page.goto(base).catch(() => {});
  const signedIn = await page.locator('nav').first().waitFor({ timeout: 60000 }).then(() => true, () => false);
  await pause(page, 3000);
  const onConsole = page.url().startsWith(base) && !new URL(page.url()).pathname.startsWith('/auth');
  await context.close();
  return signedIn && onConsole;
}

// Console pages: wait for the page, close the welcome tour.
export async function consoleGo(page, route, waitText) {
  const base = url.console();
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((u) => u.href.startsWith(base) && !u.pathname.startsWith('/auth'), { timeout: 90000 });
  const skip = page.getByRole('button', { name: /skip tour/i });
  if (await skip.waitFor({ timeout: 4000 }).then(() => true).catch(() => false)) {
    await skip.click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
  }
  if (waitText) await page.getByText(waitText).first().waitFor({ timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await pause(page, 1000);
}

// --- Multi-Tenant Operator console ------------------------------------------

// The built-in account; its password is read from the cluster, in memory.
export async function mtoState(browser) {
  const password = Buffer.from(oc('-n', 'multi-tenant-operator', 'get', 'secret',
    'tenant-operator-console-credentials', '-o', 'jsonpath={.data.passwordPlainText}'), 'base64').toString();
  const context = await browser.newContext(contextOptions(1920, 1080));
  const page = await context.newPage();
  // Right after it's switched on, the console and its Dex take a few minutes
  // to serve the sign-in form; retry until they do.
  const email = page.locator('input[name="login"], input[type="email"]').first();
  const deadline = Date.now() + 600000;
  for (;;) {
    await page.goto(url.mto() + '/').catch(() => {});
    if (await email.waitFor({ timeout: 30000 }).then(() => true, () => false)) break;
    if (Date.now() > deadline) throw new Error('the Multi-Tenant Operator console never showed its sign-in form');
    await page.waitForTimeout(10000);
  }
  await email.fill('mto@stakater.com');
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

export async function mtoGo(page, route, waitFor) {
  await page.goto(url.mto() + route);
  if (waitFor) await waitFor.waitFor({ timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await pause(page, 1000);
}

// --- Vault UI ---------------------------------------------------------------

// Signs in to a Vault namespace with the tutorial's dev root token and lands
// on a route. Vault keeps a root token in memory only, so the sign-in happens
// in the recorded page; the pane's ready time marks where the edit starts.
export async function vaultGo(page, ns, route) {
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
  await pause(page, 1000);
}

// Refreshes the current Vault UI page in place: a reload would sign out,
// since the root token lives only in memory. The UI caches lists (policies,
// for one), so those caches are cleared first. Only the current route is
// refreshed; refreshing the whole app flashes Vault's loading screen.
export const vaultRefresh = (page) => page.evaluate(async () => {
  const ns = window.requirejs('@ember/application/namespace').default.NAMESPACES[0];
  const instance = [...(ns._applicationInstances || [])][0];
  const pagination = instance.lookup('service:pagination');
  for (const key of [...(pagination?.lazyCaches?.keys() ?? [])]) pagination.clearDataset(key);
  const router = instance.lookup('service:router');
  await router.refresh(router.currentRouteName);
});

export async function openNamespacePicker(page) {
  await page.locator('[data-test-namespace-toggle], button:has-text("root")').first().click();
  await pause(page, 1000);
}

export const namespaceEntry = (page, ns) =>
  page.locator('li').filter({ hasText: new RegExp(`^\\s*${ns}\\s*$`) }).first().getByText(ns, { exact: true });
