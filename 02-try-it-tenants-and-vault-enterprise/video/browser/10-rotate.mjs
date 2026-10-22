// Chapter 10 (step 9): Reloader's console with the restarts and their cause,
// then the secret's three versions in Vault.
import { start, finish, highlight, pause, mark, url, vaultGo } from './lib.mjs';

const s = await start('10-rotate');
const { page } = s;

await page.goto(url.reloader() + '/deployments/Deployment/acme-shop/checkout');
const cause = page.locator('.react-flow__node').filter({ hasText: 'checkout-db' }).first();
await cause.waitFor({ timeout: 60000 });
mark(s, 'reloader');
await pause(page);
const restarts = page.locator('tbody tr').filter({ hasText: 'Deployment' });
// The event log is a 400 px scroll box whose wrappers hide overflow, which
// would cut the outlines' sides: let it take its full height and show them.
await restarts.first().evaluate((el) => {
  const card = el.closest('.bg-card');
  for (let n = el.closest('table').parentElement; n && n !== card; n = n.parentElement) {
    n.style.overflow = 'visible'; n.style.height = 'auto'; n.style.maxHeight = 'none';
  }
});
await highlight(cause);
await highlight(restarts.nth(0));
await highlight(restarts.nth(1));
await pause(page, 3000);

await vaultGo(s, 'acme', '/vault/secrets-engines/kv/kv/dev%2Facme-shop%2Fcheckout%2Fdb?namespace=acme');
await page.getByText('Version History', { exact: true }).first().click();
await pause(page);
for (const n of ['3', '2', '1']) await highlight(page.getByText(`Version ${n}`, { exact: true }).first());
await pause(page, 3000);

await finish(s);
