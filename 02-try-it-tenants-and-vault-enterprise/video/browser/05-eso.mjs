// Chapter 5 (step 4): install External Secrets Operator for Red Hat OpenShift
// from the Software Catalog, with the defaults.
import { start, finish, highlight, pause, mark, consoleGo } from './lib.mjs';

const s = await start('05-eso', { sessions: ['openshift'] });
const { page } = s;

await consoleGo(page, '/catalog/all-namespaces?catalogType=operator');
mark(s, 'catalog');
await page.getByPlaceholder(/filter by keyword|search/i).first().pressSequentially('external secrets', { delay: 80 });
const tile = page.locator('.pf-v6-c-card').filter({ has: page.getByText('External Secrets Operator for Red Hat OpenShift', { exact: true }) }).first();
await tile.waitFor({ timeout: 60000 });
// This chapter installs; on a cluster that has it, the panel offers Uninstall.
if (await tile.getByText('Installed', { exact: true }).isVisible()) throw new Error('External Secrets Operator for Red Hat OpenShift is already installed: record this chapter on a fresh cluster');
await pause(page);
await highlight(tile);
await tile.getByRole('button').first().click();
await pause(page);
await page.getByRole('link', { name: 'Install', exact: true }).or(page.getByRole('button', { name: 'Install', exact: true })).first().click();
await page.waitForURL((u) => u.pathname.includes('subscribe'), { timeout: 60000 });
await pause(page, 3000);
await page.getByRole('button', { name: 'Install', exact: true }).click();
await page.getByText(/ready for use/i).first().waitFor({ timeout: 600000 });
mark(s, 'installed');
await pause(page, 3000);

await finish(s);
