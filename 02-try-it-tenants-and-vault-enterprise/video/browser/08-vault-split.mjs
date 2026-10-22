// Chapter 8 (step 7), right half of the split screen: the Vault namespace
// picker, refreshed while the 08-tenants tape runs, until acme and globex appear.
import { start, finish, highlight, pause, mark, vaultGo, openNamespacePicker, namespaceEntry } from './lib.mjs';

const s = await start('08-vault-split');
const { page } = s;

await vaultGo(s, '', '/vault/dashboard');
await openNamespacePicker(page);
mark(s, 'picker open');

const refresh = page.getByRole('button', { name: /refresh list/i });
const deadline = Date.now() + 10 * 60 * 1000;
while (!((await namespaceEntry(page, 'acme').isVisible()) && (await namespaceEntry(page, 'globex').isVisible()))) {
  if (Date.now() > deadline) throw new Error('acme and globex did not appear in Vault within 10 minutes');
  await pause(page, 3000);
  if (!(await refresh.isVisible())) await openNamespacePicker(page);
  await refresh.click();
}
mark(s, 'acme and globex appear');
await highlight(namespaceEntry(page, 'acme'));
await highlight(namespaceEntry(page, 'globex'));
await pause(page, 4000);

await finish(s);
