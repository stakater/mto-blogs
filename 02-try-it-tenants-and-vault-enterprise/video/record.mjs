// Records the beats of recording.md's scene table, in order. record.sh starts
// the terminal server (ttyd) and runs this; see recording.md.
//
//   node record.mjs                 every beat, then the cold open
//   node record.mjs 08a 08b         only these beats
//   node record.mjs 08a-10c         a range, in table order
//
// Split beats record two panes at once, each at its final size: the console
// (1152x1080) opens on its "before" page first, then the terminal (768x1080)
// plays the tape while the console refreshes until the change appears. Both
// panes are Playwright recordings on one clock, so their start times in
// clips/timeline.csv line them up.
import { chromium } from 'playwright';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { scenes } from './browser/scenes.mjs';
import { parseTape, openTerminal, runTape, screenText } from './lib/term.mjs';
import { newPane, ready, finishPane, highlightAll, watchFor, mark, openshiftState, mtoState } from './browser/lib.mjs';

const TTYD = process.env.TTYD_URL ?? 'http://127.0.0.1:7681';

function select(args) {
  if (!args.length) return scenes;
  const ids = scenes.map((s) => s.id);
  const picked = new Set();
  for (const a of args) {
    const [from, to] = a.split('-');
    const i = ids.indexOf(from);
    const j = to ? ids.indexOf(to) : i;
    if (i < 0 || j < 0) throw new Error(`no beat ${a}; beats are ${ids.join(' ')}`);
    for (let k = i; k <= j; k++) picked.add(ids[k]);
  }
  return scenes.filter((s) => picked.has(s.id));
}

// clips/timeline.csv: beat, clip, start and end (Unix seconds, the usable
// part), offset (seconds into the clip file where that part starts), layout,
// and a note when something needs the edit's attention.
mkdirSync('clips', { recursive: true });
if (!existsSync('clips/timeline.csv')) writeFileSync('clips/timeline.csv', 'beat,clip,start,end,offset,layout,note\n');
if (!existsSync('clips/marks.csv')) writeFileSync('clips/marks.csv', 'clip,label,seconds,x,y,width,height\n');
const timeline = (s, pane, note = '') => {
  const start = pane.ready ?? pane.t0;
  appendFileSync('clips/timeline.csv', [s.id, pane.clip, (start / 1000).toFixed(3), (pane.end / 1000).toFixed(3),
    ((start - pane.t0) / 1000).toFixed(1), s.layout, note].join(',') + '\n');
};

const browser = await chromium.launch();
const cache = {};
async function storageState(names = []) {
  const states = [];
  for (const n of names) {
    cache[n] ??= n === 'openshift' ? await openshiftState(browser) : await mtoState(browser);
    states.push(cache[n]);
  }
  return { cookies: states.flatMap((s) => s.cookies), origins: states.flatMap((s) => s.origins) };
}

const clipName = (s, part) => `${s.id}-${s.name}${part ? `-${part}` : ''}`;

async function terminalPane(s, clip) {
  const tape = parseTape(`tapes/${s.tape}`);
  const pane = await newPane(browser, { clip, width: tape.settings.Width, height: tape.settings.Height });
  await openTerminal(pane.page, TTYD, tape.settings);
  return { pane, tape };
}

// Opens a split beat's console pane on its "before" page. A real "before"
// means the change isn't there yet.
async function openConsole(s) {
  const con = await newPane(browser, { clip: clipName(s, 'console'), width: 1152, height: 1080, storageState: await storageState(s.sessions) });
  await s.before(con.page);
  ready(con); mark(con, 'before');
  const already = await s.find(con.page).catch(() => null);
  return { con, already };
}

// Beats whose change is caused by the previous beat's command (the Vault
// namespaces appear because of step 7's apply) open their console early,
// before that command runs, so their "before" is real.
const early = new Map();

async function split(s, next) {
  const { con, already } = early.get(s.id) ?? await openConsole(s);
  early.delete(s.id);
  if (next?.openEarly && next.layout === 'split') early.set(next.id, await openConsole(next));
  const { pane: term, tape } = await terminalPane(s, clipName(s, 'terminal'));
  const typing = runTape(term.page, tape, { onShow: (t) => ready(term, t) }).then(() => { term.end = Date.now(); });
  const watching = (async () => {
    const gate = s.refreshAfter && (() => screenText(term.page).then((t) => s.refreshAfter.test(t)));
    const found = await watchFor(con.page, s.find, { refresh: s.refresh, gate });
    mark(con, 'change');
    await highlightAll(con, found);
    if (s.after) await s.after(con);
    con.end = Date.now();
  })();
  try {
    await Promise.all([typing, watching]);
  } finally {
    await Promise.allSettled([finishPane(con), finishPane(term)]);
  }
  const note = already ? 'no real before: the change was already there' : '';
  timeline(s, con, note);
  timeline(s, term);
  return note;
}

async function terminal(s) {
  const { pane, tape } = await terminalPane(s, clipName(s, ''));
  try {
    await runTape(pane.page, tape, { onShow: (t) => ready(pane, t) });
    pane.end = Date.now();
  } finally {
    await finishPane(pane).catch(() => {});
  }
  timeline(s, pane);
}

async function consoleBeat(s) {
  const pane = await newPane(browser, { clip: clipName(s, ''), width: 1920, height: 1080, storageState: await storageState(s.sessions) });
  try {
    await s.run(pane);
    pane.end = Date.now();
  } finally {
    await finishPane(pane).catch(() => {});
  }
  timeline(s, pane);
}

let failed = false;
const beats = select(process.argv.slice(2));
for (const [i, s] of beats.entries()) {
  console.log(`record: ${s.id} ${s.chapter}: ${s.title} (${s.layout})`);
  try {
    if (s.pre) await s.pre();
    const note = s.layout === 'split' ? await split(s, beats[i + 1]) : s.layout === 'terminal' ? await terminal(s) : await consoleBeat(s);
    if (note) console.log(`record: ${s.id}: ${note}`);
    if (s.post) await s.post();
  } catch (e) {
    console.error(`record: beat ${s.id} (${s.chapter}: ${s.title}) failed: ${e.message}`);
    failed = true;
    break;
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
