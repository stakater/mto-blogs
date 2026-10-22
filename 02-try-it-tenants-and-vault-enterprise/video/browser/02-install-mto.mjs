// Chapter 2 (step 1): Software Catalog, search "multi tenant", Install,
// then Installed Operators with Multi Tenant Operator "Succeeded".
import { start, finish, highlight, pause, mark, consoleGo } from './lib.mjs';

const s = await start('02-install-mto', { sessions: ['openshift'] });
const { page } = s;

await consoleGo(page, '/catalog/all-namespaces?catalogType=operator');
mark(s, 'catalog');
await page.getByPlaceholder(/filter by keyword|search/i).first().pressSequentially('multi tenant', { delay: 80 });
const tile = page.locator('.pf-v6-c-card').filter({ has: page.getByText('Multi Tenant Operator', { exact: true }) }).first();
await tile.waitFor({ timeout: 60000 });
// This chapter installs; on a cluster that has it, the panel offers Uninstall.
if (await tile.getByText('Installed', { exact: true }).isVisible()) throw new Error('Multi Tenant Operator is already installed: record this chapter on a fresh cluster');
await pause(page);
await highlight(tile);
await tile.getByRole('button').first().click();
await pause(page);
await page.getByRole('link', { name: 'Install', exact: true }).or(page.getByRole('button', { name: 'Install', exact: true })).first().click();
await page.waitForURL((u) => u.pathname.includes('subscribe'), { timeout: 60000 });
await pause(page, 3000); // the defaults: channel, all namespaces, multi-tenant-operator
await page.getByRole('button', { name: 'Install', exact: true }).click();
await page.getByText(/ready for use/i).first().waitFor({ timeout: 600000 });
mark(s, 'installed');
await pause(page);

await consoleGo(page, '/k8s/ns/multi-tenant-operator/operators.coreos.com~v1alpha1~ClusterServiceVersion', 'Multi Tenant Operator');
const row = page.locator('tr').filter({ hasText: 'Multi Tenant Operator' }).first();
await row.getByText('Succeeded', { exact: true }).waitFor({ timeout: 600000 });
await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await highlight(row);
await highlight(row.getByText('Succeeded', { exact: true }).first());
await pause(page, 3000);

await finish(s);
