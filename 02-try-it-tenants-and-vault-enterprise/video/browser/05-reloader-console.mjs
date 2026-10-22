// Chapter 5 (step 4): Reloader's console, open and still empty.
import { start, finish, pause, mark, url } from './lib.mjs';

const s = await start('05-reloader-console');
const { page } = s;

await page.goto(url.reloader() + '/deployments');
await page.getByText('Deployments').first().waitFor({ timeout: 60000 });
mark(s, 'console');
await pause(page, 4000);

await finish(s);
