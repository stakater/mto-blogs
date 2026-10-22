// Chapter 0: the end state. Record after chapter 11.
import { start, finish, highlight, pause, mark, url, vaultGo, openNamespacePicker, namespaceEntry } from './lib.mjs';

const s = await start('00-cold-open', { sessions: ['mto'] });
const { page } = s;

await vaultGo(s, '', '/vault/dashboard');
await openNamespacePicker(page);
await highlight(namespaceEntry(page, 'acme'));
await highlight(namespaceEntry(page, 'globex'));
await pause(page, 3000);

await page.goto(url.mto() + '/tenants');
await page.getByRole('link', { name: 'globex', exact: true }).waitFor({ timeout: 60000 });
mark(s, 'mto tenants');
await pause(page);
await highlight(page.getByRole('link', { name: 'acme', exact: true }));
await highlight(page.getByRole('link', { name: 'globex', exact: true }));
await pause(page, 3000);

await finish(s);
