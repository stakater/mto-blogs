# Recording guideline: scenes with a before and an after

How every demo video's footage is recorded, so a viewer sees what was done
and what it changed, at the same moment. It applies to every topic. Each
topic lists its own scenes in its `video/recording.md`, following this
pattern.

The [video guideline](video.md) covers the versions, sound and branding;
this page covers the footage.

## The idea

**Every change is shown as cause and effect, live.** The viewer sees the
console in its "before" state, watches the command typed, and sees the
console change while the command finishes. Nothing is a tour of a finished
state, recorded afterwards.

That needs two things the footage can't fake later:

- **A real "before".** Every recording starts from a fresh cluster, so the
  empty states are genuinely empty: no tenants, no Vault namespaces, no
  restarts.
- **One clock.** The terminal and the console are recorded at the same
  time, so the change on the right happens exactly when the command on the
  left finishes.

## Three layouts

Each beat of a scene uses one layout, chosen by where the proof is:

| Layout | When | Screen |
|---|---|---|
| **Split** | The command changes something a console shows. Most beats. | Terminal on the left (40%), console on the right (60%) |
| **Terminal** | The proof is the command's own output, such as `403` or `Synced Healthy` | Terminal, full screen |
| **Console** | The proof is a screen with no command behind it, such as Reloader's history or a sign-in | Console, full screen |

```
Split (1920×1080)
┌──────────────┬─────────────────────────┐
│ Terminal     │ Vault UI                │  ← pane labels
│ 768×1080     │ 1152×1080               │
│              │                         │
│ $ oc apply … │   acme/   ← highlighted │
│              │   globex/               │
└──────────────┴─────────────────────────┘
```

## A beat

Every beat in a split scene runs the same way:

| # | What happens | On screen |
|---|---|---|
| 1 | **Before.** The console shows the state before the change | A "Before" tag on the console pane, 2 seconds |
| 2 | **Do.** One command is typed and run | The terminal; the console unchanged |
| 3 | **Change.** The console refreshes and the change appears | The new element appears |
| 4 | **After.** The change is highlighted, and the console pane zooms in on it | The standard highlight; an "After" tag; 3 seconds |
| 5 | **Beat.** A second of stillness | – |

**One command, one change.** If a step runs several commands, it's several
beats. Commands that change nothing a viewer can see, such as setting a
variable, run hidden.

For the key moment of a chapter, the edit may add a half-second freeze of
both states side by side: the before and the after, labeled.

## Recording each pane

- **Each pane is recorded at its final size,** never scaled down
  afterwards: the terminal at 768×1080, the console at 1152×1080 (split), or
  either at 1920×1080 (full screen). Scaling a full-width recording into half
  the screen makes it unreadable.
- **The terminal:** a VHS tape at the pane's size, font at least 18 points
  for the split pane and 22 for full screen, the prompt `$ `.
- **The console:** a Playwright browser recording at the pane's size, light
  theme, signed in before recording starts, already on the "before" page.
- **The console refreshes itself.** Consoles don't update on their own, so
  the browser script reloads the page, or clicks the console's own Refresh,
  every 2 seconds until the expected element appears. Then it draws the
  highlight and holds.
- **Pane labels** name what the viewer is looking at: "Terminal", "Vault UI",
  "Multi-Tenant Operator console", "OpenShift console", "Reloader console".
  They're added in the edit.

## Keeping the panes in sync

For each split beat, the recording script:

1. Starts the browser recording, on the "before" page, and waits until the
   page has settled.
2. Writes the browser's start time to `clips/timeline.csv`.
3. Starts the terminal tape, and writes its start time.
4. Lets the browser refresh until the change appears, highlights it, holds 3
   seconds, then stops both.

The edit lines the two clips up by their start times. A skew under half a
second is invisible.

**The simpler alternative:** record the screen itself, with a terminal
window and a browser window placed side by side at the pane sizes, driven by
the same scripts. One recording can't get out of sync, at the cost of a
little sharpness. Use it if the two-clip approach gives trouble.

## The fresh cluster

- **Every real recording starts from a fresh cluster,** with nothing from the
  tutorial installed, so every "before" is real and the installs are
  recorded too.
- **The cluster has a neutral name,** because its domain appears in
  addresses on screen.
- **A dry run comes first,** on any cluster, to check the scripts. Its
  footage is never used.

## Each topic's recording.md has

A scene table: one row per beat, so the scripts can be written from it.

| Chapter | Beat | Layout | Console and its "before" | Command | The change, highlighted |
|---|---|---|---|---|---|
| Step 7 | Tenants appear | Split | Multi-Tenant Operator console, Tenants page: empty | `oc apply -f tenants.yaml` | Rows `acme` and `globex` |

## Checklist

- [ ] Recorded on a fresh cluster with a neutral name.
- [ ] Every split beat shows a real "before" and the change live.
- [ ] One command per beat; hidden commands change nothing visible.
- [ ] Each pane recorded at its final size; nothing scaled down.
- [ ] Every change highlighted, and zoomed where the pane is busy.
- [ ] Terminal and console in sync, under half a second apart.
- [ ] No secret visible in any frame.
