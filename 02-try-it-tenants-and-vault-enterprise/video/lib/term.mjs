// Plays a VHS-style tape in a ttyd terminal page, so Playwright records the
// terminal on the same clock as the console. VHS draws its terminal the same
// way (ttyd and xterm.js in a browser); its own recordings ran 27-84% of real
// time in a container, which can't be lined up with a console clip.
//
// Supported tape commands: Source, Output, Set (FontSize, Width, Height,
// Padding, TypingSpeed, WaitTimeout, WaitPattern; others are ignored), Type,
// Enter, Backspace, Space, Ctrl+C, Sleep, Wait, Wait+Screen, Wait+Line (each
// with an optional @<duration>), Hide, Show, and one addition:
//   RepeatUntil /regex/ <every>   re-run the last typed command until the
//                                 screen matches, for "repeat until it lists them"
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULTS = {
  FontSize: 22, Width: 1920, Height: 1080, Padding: 40,
  TypingSpeed: 35, WaitTimeout: 600000, WaitPattern: /\$\s*$/,
};

const duration = (s) => {
  const m = /^(\d+(?:\.\d+)?)(ms|s|m)?$/.exec(s.trim());
  if (!m) throw new Error(`bad duration: ${s}`);
  return Number(m[1]) * ({ ms: 1, s: 1000, m: 60000 }[m[2] ?? 's']);
};
const regex = (s) => {
  const m = /^\/(.*)\/([a-z]*)$/.exec(s.trim());
  if (!m) throw new Error(`bad pattern: ${s}`);
  return new RegExp(m[1], m[2]);
};
// Type's argument: "…", `…` or '…', taken literally.
const literal = (s) => {
  s = s.trim();
  const q = s[0];
  if (!['"', '`', "'"].includes(q) || s.at(-1) !== q) throw new Error(`bad string: ${s}`);
  return s.slice(1, -1);
};

// Parses a tape and the tapes it sources into settings and a command list.
export function parseTape(file, base = path.dirname(path.dirname(file))) {
  const settings = { ...DEFAULTS };
  const commands = [];
  let output = null;
  const walk = (f) => {
    for (const [i, raw] of readFileSync(f, 'utf8').split('\n').entries()) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const where = `${path.basename(f)}:${i + 1}`;
      // Type "…" Enter: the string ends at its last quote; what follows on
      // the line (Enter, Sleep 1s, …) is more commands.
      const typed = /^(Type(?:@\S+)?)\s+(["'`])(.*)\2(?:\s+(.*))?$/.exec(line);
      if (typed) {
        commands.push({ word: typed[1], arg: typed[2] + typed[3] + typed[2], where });
        if (typed[4]) {
          const [w, ...a] = typed[4].trim().split(/\s+/);
          commands.push({ word: w, arg: a.join(' '), where });
        }
        continue;
      }
      const [word, ...rest] = line.split(/\s+/);
      const arg = line.slice(word.length).trim();
      if (word === 'Source') walk(path.join(base, arg));
      else if (word === 'Output') output = arg;
      else if (word === 'Set') {
        const [key, ...v] = rest;
        const value = v.join(' ').replace(/^"|"$/g, '');
        if (key === 'WaitTimeout' || key === 'TypingSpeed') settings[key] = duration(value);
        else if (key === 'WaitPattern') settings.WaitPattern = regex(value);
        else if (['FontSize', 'Width', 'Height', 'Padding'].includes(key)) settings[key] = Number(value);
      } else commands.push({ word, arg, where });
    }
  };
  walk(file);
  return { settings, commands, output };
}

// The xterm.js screen, as ttyd exposes it on window.term. A line the
// terminal wrapped is joined back to the one before it, so a word split at
// the pane's edge ("p" / "atched") still matches.
export const screenText = (page) => page.evaluate(() => {
  const b = window.term.buffer.active;
  const out = [];
  for (let i = b.viewportY; i < b.viewportY + window.term.rows; i++) {
    const line = b.getLine(i);
    const text = line?.translateToString(true) ?? '';
    if (line?.isWrapped && out.length) out[out.length - 1] += text;
    else out.push(text);
  }
  return out.join('\n');
});
const cursorLine = (page) => page.evaluate(() => {
  const b = window.term.buffer.active;
  return b.getLine(b.baseY + b.cursorY)?.translateToString(true) ?? '';
});

async function waitFor(page, read, re, timeout, where) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const text = await read(page);
    if (re.test(text)) return;
    if (Date.now() > deadline) {
      throw new Error(`${where}: timed out waiting for ${re}; last screen:\n${text.trim().split('\n').slice(-6).join('\n')}`);
    }
    await page.waitForTimeout(200);
  }
}

// Opens the terminal at the tape's font size and padding, behind a cover,
// so nothing before the first Show is recorded as content.
export async function openTerminal(page, url, settings, theme = '#282a36') {
  await page.goto(url);
  await page.waitForFunction(() => window.term && window.term.element, null, { timeout: 30000 });
  await page.evaluate(({ fontSize, padding, theme }) => {
    const cover = document.createElement('div');
    cover.id = 'tape-cover';
    cover.style.cssText = `position:fixed;inset:0;background:${theme};z-index:1000`;
    document.body.appendChild(cover);
    document.body.style.background = theme;
    window.term.options.fontSize = fontSize;
    window.term.element.style.padding = `${padding}px`;
    window.dispatchEvent(new Event('resize'));
  }, { fontSize: settings.FontSize, padding: settings.Padding, theme });
  await page.waitForTimeout(500);
}

// Runs the tape's commands. onShow is called the first time content is shown,
// with the time it happened, so the caller can stamp the usable start.
export async function runTape(page, { settings, commands }, { onShow, signal } = {}) {
  let hidden = true;
  let lastTyped = null;
  let shown = false;
  for (const { word, arg, where } of commands) {
    if (signal?.aborted) throw new Error('aborted');
    const [cmd, at] = word.split('@');
    const timeout = at ? duration(at) : settings.WaitTimeout;
    switch (cmd) {
      case 'Type': {
        const speedAt = word.includes('@') ? duration(word.split('@')[1]) : null;
        const text = literal(arg);
        lastTyped = text;
        await page.keyboard.type(text, { delay: hidden ? 0 : (speedAt ?? settings.TypingSpeed) });
        break;
      }
      case 'Enter': for (let n = Number(arg || 1); n > 0; n--) await page.keyboard.press('Enter'); break;
      case 'Backspace': for (let n = Number(arg || 1); n > 0; n--) await page.keyboard.press('Backspace'); break;
      case 'Space': await page.keyboard.press(' '); break;
      case 'Ctrl+C': await page.keyboard.press('Control+C'); break;
      case 'Sleep': await page.waitForTimeout(duration(arg)); break;
      case 'Hide':
        hidden = true;
        await page.evaluate(() => { document.getElementById('tape-cover').style.display = 'block'; });
        break;
      case 'Show':
        hidden = false;
        await page.evaluate(() => { document.getElementById('tape-cover').style.display = 'none'; });
        if (!shown) { shown = true; onShow?.(Date.now()); }
        break;
      default:
        if (cmd === 'Wait') await waitFor(page, cursorLine, settings.WaitPattern, timeout, where);
        else if (cmd === 'Wait+Screen') await waitFor(page, screenText, regex(arg), timeout, where);
        else if (cmd === 'Wait+Line') await waitFor(page, cursorLine, regex(arg), timeout, where);
        else if (cmd === 'RepeatUntil') {
          const [pattern, every] = arg.split(/\s+(?=\d)/);
          const re = regex(pattern);
          const deadline = Date.now() + settings.WaitTimeout;
          for (;;) {
            await waitFor(page, cursorLine, settings.WaitPattern, settings.WaitTimeout, where);
            if (re.test(await screenText(page))) break;
            if (Date.now() > deadline) throw new Error(`${where}: ${re} never appeared`);
            await page.waitForTimeout(duration(every ?? '5s'));
            await page.keyboard.type(lastTyped, { delay: settings.TypingSpeed });
            await page.keyboard.press('Enter');
          }
        } else throw new Error(`${where}: unsupported tape command ${word}`);
    }
  }
}
