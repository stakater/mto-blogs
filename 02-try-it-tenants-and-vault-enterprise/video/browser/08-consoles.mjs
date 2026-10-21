// Chapter 8 (step 7): the Tenant tab, the project's tenant label, and the
// Multi-Tenant Operator console's Tenants and Namespaces pages.
import { start, finish, highlight, pause, mark, url, consoleGo, mtoCsv } from './lib.mjs';

const s = await start('08-consoles', { sessions: ['openshift', 'mto'] });
const { page } = s;

await consoleGo(page, `/k8s/ns/multi-tenant-operator/operators.coreos.com~v1alpha1~ClusterServiceVersion/${mtoCsv()}/tenantoperator.stakater.com~v1beta3~Tenant`, 'globex');
mark(s, 'tenant tab');
await pause(page);
await highlight(page.getByRole('link', { name: 'acme', exact: true }));
await highlight(page.getByRole('link', { name: 'globex', exact: true }));
await pause(page);

await consoleGo(page, '/k8s/cluster/projects/acme-shop/details', 'stakater.com/tenant=acme');
mark(s, 'project label');
await pause(page);
await highlight(page.locator('.pf-v6-c-label').filter({ hasText: 'stakater.com/tenant=acme' }).first());
await pause(page);

await page.goto(url.mto() + '/tenants');
await page.getByRole('link', { name: 'globex', exact: true }).waitFor({ timeout: 60000 });
mark(s, 'mto tenants');
await pause(page);
await highlight(page.getByRole('link', { name: 'acme', exact: true }));
await highlight(page.getByRole('link', { name: 'globex', exact: true }));
await pause(page);

await page.goto(url.mto() + '/namespaces');
await page.getByText('globex-web', { exact: true }).first().waitFor({ timeout: 60000 });
mark(s, 'mto namespaces');
await pause(page);
const row = (ns) => page.locator('tr').filter({ has: page.getByText(ns, { exact: true }) }).first();
// The table's wrapper hides overflow, which would cut the outlines' sides.
await row('acme-shop').evaluate((el) => { el.closest('table').parentElement.style.overflow = 'visible'; });
for (const ns of ['acme-shop', 'globex-web']) await highlight(row(ns));
await pause(page, 3000);

await finish(s);
