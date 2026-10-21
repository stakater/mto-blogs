// Chapter 9 (step 8): the secret in Vault, the policy nobody wrote, and the
// Secret's owner in the OpenShift console.
import { start, finish, highlight, pause, mark, vaultGo, consoleGo } from './lib.mjs';

const s = await start('09-app', { sessions: ['openshift'] });
const { page } = s;

await vaultGo(s, 'acme', '/vault/secrets-engines/kv/kv/dev%2Facme-shop%2Fcheckout%2Fdb?namespace=acme');
await page.getByText('Secret', { exact: true }).first().click();
await pause(page);
await highlight(page.getByRole('heading', { name: 'dev/acme-shop/checkout/db' }).first());
await highlight(page.getByText('password', { exact: true }).first());
await pause(page);

await vaultGo(s, 'acme', '/vault/policy/acl/kv.acme.acme-shop.checkout?namespace=acme');
await highlight(page.locator('span.token.string-literal').filter({ hasText: '"kv/data/dev/acme-shop/checkout/*"' }).first());
await pause(page);

await consoleGo(page, '/k8s/ns/acme-shop/secrets/checkout-db', 'checkout-db');
mark(s, 'secret owner');
await page.getByText('Owner', { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
await pause(page);
await highlight(page.locator('dd').filter({ has: page.getByRole('link', { name: 'checkout-db' }) }).first());
await pause(page, 3000);

await finish(s);
