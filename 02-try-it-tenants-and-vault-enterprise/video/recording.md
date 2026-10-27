# Recording: how the footage is made

Instructions for recording the screen for this video. They're written so
anyone with a cluster, or a Claude session working for them, can follow them
start to finish. The footage feeds all three versions in the
[video plan](plan.md); the voice is recorded separately, from
[the script](narration-demo.md).

**The pattern:** every change is recorded as a scene with a before and an
after: the terminal on the left, the console on the right, recorded at the
same time, so the viewer watches the console change as the command runs. The
[recording guideline](../../docs/guidelines/recording.md) defines it; this
page applies it to this video. The other rules are in the
[video guideline](../../docs/guidelines/video.md) and the
[screenshot guideline](../../docs/guidelines/screenshots.md).

> **The first dry run didn't follow this pattern.** Its terminal and browser
> clips were recorded one after the other, on a cluster that already had
> everything installed, so the consoles never showed a "before" or a live
> change. Those clips can't make the videos; the scenes below replace them.

## What you're building

Scripts that record the screen **automatically**, so nobody types or clicks
while the camera runs:

| Kind | What it is | Records |
|---|---|---|
| **Terminal tapes** | Plain text files in [VHS](https://github.com/charmbracelet/vhs)'s tape format: what to type, and what to wait for | The terminal pane of each beat, at the pane's size |
| **Scenes** | `browser/scenes.mjs`, one entry per beat of the scene table: the console's "before" page, how it refreshes, and what to highlight | The console pane of each beat, at the pane's size |
| **`record.sh`** | Runs the beats in the tutorial's order, starting each split beat's console and terminal together | The clips, a timeline with each clip's start time, and marks for the edit |

Both panes are [Playwright](https://playwright.dev) recordings, made by one
process on one clock. The tapes are played in a ttyd terminal, the same
terminal VHS draws (xterm.js in a browser), and Playwright records it like
any other page. VHS's own recordings can't be lined up with a console clip:
in a container they ran at 27 to 84% of real time, depending on size and
frame rate. Playwright's run at real time.

Re-recording is then one command: when the tutorial or a product changes,
run `record.sh` again on a clean cluster.

## Two runs

| Run | When | Cluster | Purpose |
|---|---|---|---|
| **Dry run** | Now | Any cluster you can reset, on the Reloader beta the tutorial pins (chart 3.0.0-beta.4) | Write and debug the scripts. The footage is thrown away. |
| **Real recording** | After the Reloader console release | A **fresh** OpenShift 4.22 cluster, with a neutral name | The footage we use |

The installs (chapters 2 to 7) need a cluster with none of the tutorial
installed yet. If your cluster already has it, either reset it, or dry-run
chapters 8 to 11 there and the installs on a fresh cluster later.

## Setup

On the machine that records:

```bash
node --version                 # 20 or later
docker info >/dev/null         # Docker: the terminal runs in VHS's image
cd 02-try-it-tenants-and-vault-enterprise/video
npm install                    # Playwright, pinned in package.json
npx playwright install chromium
```

VHS's container image provides the terminal server (ttyd) and ffmpeg;
`record.sh` adds Linux `oc` and `helm`, downloaded to `.tools/`. Nothing
else is installed on the machine.

Secrets come from files, never typed, never printed. Before recording, set:

```bash
export KUBECONFIG=/path/to/kubeconfig                 # cluster-admin
export VAULT_LICENSE_FILE=/path/to/vault.hclic
export OCP_CONSOLE_USER=<user>                         # for the OpenShift console
export OCP_CONSOLE_PASSWORD_FILE=/path/to/password-file
```

On a cluster that signs in through SSO, save a console session instead and
point `OCP_CONSOLE_STATE` at it: `node browser/console-session.mjs` opens a
window to sign in. `record.sh` checks it before recording anything; it ends
with the SSO session, about a day.

The Multi-Tenant Operator console's password and Vault's dev root token are
read from the cluster by the scripts, at run time.

**A cluster that already has the tutorial:** `./reset.sh` removes all of it
(tenants, Vault and its data, the operators), in an order that leaves no
stuck resources or webhooks behind.

## Layout

```
video/
  plan.md, narration-demo.md, recording.md
  package.json
  record.sh                starts the terminal server, runs record.mjs, converts the clips
  record.mjs               runs the beats; writes clips/timeline.csv and clips/marks.csv
  reset.sh                 removes the tutorial from a cluster, for a real "before"
  lib/term.mjs             plays a tape in the terminal page
  tapes/
    _setup.tape            shared settings and hidden helpers, sourced by every tape
    _split.tape            the split pane's size: 768x1080, font 18
    02b-template-operator.tape
    ...
  browser/
    lib.mjs                panes, sign-in helpers, highlight(), the refresh loop
    scenes.mjs             the scene table: one entry per beat
    console-session.mjs    saves an OpenShift console session (SSO clusters)
  clips/                   output, in .gitignore; the dry run's clips are committed for review
```

Beats are named after the scene table: `NN` is the chapter number from the
[plan](plan.md#chapters) and a letter orders the beats in it (`08a`, `08b`).
A split beat makes `NNx-<name>-console.mp4` and `NNx-<name>-terminal.mp4`;
a terminal or console beat makes `NNx-<name>.mp4`.

## Terminal tapes

The tapes use VHS's tape format; `lib/term.mjs` plays them. Every tape
sources the shared settings, and a split beat's tape also sources the split
pane's:

```
Source tapes/_setup.tape
Source tapes/_split.tape
```

`_setup.tape` sets a full-screen terminal (1920x1080, font 22, padding 40,
Dracula, 35 ms per character), a 600-second wait limit, and the prompt
`$ `. It then defines the `v` and `vt` helpers and moves to `examples/`,
hidden. `_split.tape` sets 768x1080, font 18, padding 24.

The commands `lib/term.mjs` understands: `Type` (with `Enter` on the same
line, or alone), `Enter`, `Backspace`, `Sleep`, `Hide`, `Show`, `Wait`
(the prompt is back), `Wait+Screen /re/` and `Wait+Line /re/` (each with an
optional `@<duration>`), and one addition, `RepeatUntil /re/ 5s`: run the
last command again every 5 seconds until the screen matches, for "repeat
until it lists them". `Hide` covers the terminal with a plain pane, so a
hidden part records as an empty terminal; the edit cuts it.

Strings that contain double quotes go in backticks rather than escaped.

Rules for every tape:

- **The commands are the tutorial's, exactly.** Copy them from
  [post.md](../post.md). If a command has to change to work, fix the
  tutorial first, then the tape.
- **Wait for the result, not for a fixed time.** Use `Wait+Screen /pattern/`
  for what proves the step worked, such as `/successfully rolled out/` or
  `/acme\//`, with a `Sleep 2s` after so the viewer can read it. Waits run in
  real time; they're sped up in the edit, not here. The screen is the
  visible terminal, with lines the pane wrapped joined back, so a word split
  at the edge still matches.
- **Long commands are typed, not pasted,** but lines over about 100
  characters use the tutorial's `\` line breaks, so they stay readable. At
  768 pixels the split pane is 68 columns wide, so long lines wrap.
- **Anything that would show a secret runs hidden**, between `Hide` and
  `Show`. In this tutorial: creating the Vault license Secret (step 2). The
  Multi-Tenant Operator console's password is never read in a tape; the
  scripts read it in memory.
- **Things only the recording needs run hidden too:** setting variables such
  as `APPS_DOMAIN`, or `clear` between parts.

## Browser scripts

`browser/scenes.mjs` holds one entry per beat. A **split** beat has a `tape`
and a console:

| Field | What it does |
|---|---|
| `before(page)` | Opens the "before" page, signed in, and waits until it has settled |
| `find(page)` | Returns what to highlight once the change is there, else `null` |
| `refresh(page)` | The console's own way to update, run every 2 seconds until `find` succeeds |
| `refreshAfter` | Holds the refresh back until the terminal shows this pattern: for a console whose refresh shows a loading state |
| `openEarly` | Opens this beat's console during the previous beat, before its command: for a change that command causes |
| `after(pane)` | What to show after the highlight, such as the Secret's owner |

A **console** beat has `run(pane)`, a scripted walk through the console; a
**terminal** beat has only its tape. `pre` and `post` run between beats,
unrecorded.

How each console refreshes:

| Console | Refresh |
|---|---|
| OpenShift console | None: it watches the API, so the change appears by itself |
| Vault UI | In place, through the UI's own router, after clearing its cached lists. A reload would sign out, since a root token lives only in memory |
| Reloader console | Its own **Refresh** button |
| Multi-Tenant Operator console | A reload, once the command's result is on the terminal (`refreshAfter`), since a reload shows loading placeholders |

The highlight is the screenshot guideline's (3 px Stakater orange, offset 4
px), drawn on the element and also as a box over it, because the OpenShift
console re-renders live and drops a style set on the element. Each
highlight's box goes into `clips/marks.csv`, so the edit can zoom in on it.

Rules for every scene:

- **Sign in before the part that's recorded.** The OpenShift and
  Multi-Tenant Operator consoles are signed in before the pane is created;
  the Vault UI signs in inside the pane (a root token can't be carried over),
  so the pane's start time in the timeline is after it.
- **Highlight what the tutorial's screenshot highlights,** in the same order.
  The highlights are listed in [screenshots/README.md](../screenshots/README.md).
- **Dismiss banners and tours** before the recorded part, as for screenshots.

## Scenes

One row per beat, in the tutorial's order. **Split** beats record a terminal
tape (768×1080) and a browser script (1152×1080) at the same time.
**Terminal** and **Console** beats record one pane at 1920×1080. The beat's
console starts on its "before" state, already signed in, and refreshes every
2 seconds until the change appears.

| Chapter | Beat | Layout | Console, and its "before" | Command | The change, highlighted |
|---|---|---|---|---|---|
| Step 1 | Install Multi-Tenant Operator | Console | Software Catalog, search "multi tenant" | – (Install clicked) | Installed Operators: Multi Tenant Operator "Succeeded" |
| Step 1 | Template Operator on | Split | OpenShift console, Deployments in all projects, filtered by `template-operator`: none | the IntegrationConfig patch | `template-operator-v2`, Available |
| Step 1 | Privileged namespaces | Terminal | – | the privileged namespaces patch | `patched` |
| Step 2 | Vault Enterprise | Split | OpenShift console, Pods in project `vault`: none | the Helm install (license Secret hidden) | `vault-0`, Running |
| Step 2 | Vault answers | Terminal | – | `v version` | `Vault v2.1.1+ent` |
| Step 3 | Vault Config Operator | Split | OpenShift console, Pods in `vault-config-operator`: none | the Helm install | its pod, Running |
| Step 4 | External Secrets Operator | Console | Software Catalog, search "external secrets" | – (Install clicked) | Installed Operators: "Succeeded" |
| Step 4 | Its configuration | Split | OpenShift console, Pods in `external-secrets`: none | the `ExternalSecretsConfig` apply | its pods, Running |
| Step 4 | Reloader | Split | OpenShift console, Pods in `reloader`: none | the Helm install | Reloader's four pods, Running |
| Step 4 | Reloader's console | Console | Reloader console, Deployments | – | The empty event log: nothing restarted yet |
| Step 5 | Kubernetes login | Split | Vault UI, root, Access → Authentication methods: `token/` only | `v auth enable kubernetes` | `kubernetes/` |
| Step 5 | The narrow policy | Split | Vault UI, root, Policies: `default`, `root` | the `vco-admin` policy and role | `vco-admin` |
| Step 6 | The extension | Split | OpenShift console, Search: TemplateInstances in `vault-config`: none | the Helm install | the parent TemplateInstance |
| Step 7 | Tenants appear | Split | Multi-Tenant Operator console, Tenants: empty | `oc apply -f tenants.yaml` | Rows `acme` and `globex` |
| Step 7 | Vault namespaces appear | Split | Vault UI, namespace picker: `root` only | `v namespace list`, repeated until it lists them | `acme`, `globex` |
| Step 7 | Projects, by tenant | Console | Multi-Tenant Operator console, Namespaces | – | `acme-shop` under `acme`, `globex-web` under `globex` |
| Step 7 | The tenant label | Console | OpenShift console, project `acme-shop`, Details | – | `stakater.com/tenant=acme` |
| Step 8 | The password, in Vault | Split | Vault UI, `acme`, `kv/dev/acme-shop/checkout/`: empty | `v kv put …` | the secret `db` |
| Step 8 | The app gets it | Split | OpenShift console, Secrets in `acme-shop`: no `checkout-db` | `oc apply -f checkout.yaml` | `checkout-db`, owned by its ExternalSecret |
| Step 8 | The policy nobody wrote | Console | Vault UI, `acme`, ACL policies | – | `kv.acme.acme-shop.checkout` and its rule |
| Step 8 | The app reads it | Terminal | – | `oc -n acme-shop logs deploy/checkout` | `db password has 6 characters` |
| Step 9 | First rotation | Split | Reloader console, `checkout`: empty event log | `v kv put …`, then the forced refresh | Restart 1, caused by `checkout-db` |
| Step 9 | Second rotation | Split | Reloader console, `checkout`: one restart | the same, with the new value (sped up) | Restart 2 |
| Step 9 | Three versions | Console | Vault UI, `acme`, the secret's Version History | – | Versions 1, 2 and 3 |
| Step 10 | Allowed, then refused | Terminal | – | globex's login, its own read, acme's secret, acme's role | the two `403`s |
| Step 10 | Put back | Split | Vault UI, `acme`, policy `kv.acme.acme-shop.checkout`: the widened rule just written | the wait (sped up) | the original rule, back |
| Cold open | The end result | Console | Vault namespace picker, then the Multi-Tenant Operator console's Tenants | – | `acme`, `globex`. Record last. |

Notes from the dry run, for the rows above:

- **Step 4, Reloader's console:** right after the install it lists only
  Reloader's own three components; there's no event log until a workload
  restarts. The beat highlights the three components.
- **Step 5, the narrow policy:** Vault 2.1's policies are `default`,
  `default-ceiling` and `root` before the change.
- **Step 7, Tenants appear:** the Multi-Tenant Operator console must be on
  before the apply, so the tutorial switches it on first (the post's step 7
  was reordered for this).
- **Step 7, Vault namespaces appear:** the picker's "before" is `root` and
  `shared` (`shared` comes from the extension, in step 6). The namespaces
  are created by the apply, about 15 seconds later, so this beat's console
  opens during the previous beat (`openEarly`) and refreshes once the
  terminal lists them.

Chapters 1 (the problem) and the close are cards, made in the edit.

## `record.sh`

- Runs the beats in the scene table's order, then the cold open; or only
  the beats named (`./record.sh 08a 08b`, `./record.sh 08a-10c`).
- For a split beat: opens the console on its "before" page, records its
  start time, starts the tape, records its start time, and stops both once
  the change is highlighted and held 3 seconds and the tape has finished.
  If the change is already there when the console opens, the timeline says
  so: that beat has no real "before".
- Stops at the first failure, saying which beat and which tape line or page.
- Writes `clips/timeline.csv`: beat, clip, start and end (Unix seconds, the
  usable part), offset (seconds into the clip file where that part starts),
  layout, and a note. And `clips/marks.csv`: clip, label (`before`,
  `change`, `after`, …), seconds into the clip, and the highlighted box.
- Never prints a secret, and never writes one to a file under `video/`.

## Dry run: done when

- [ ] Every chapter's clips exist in `clips/`, and play.
- [ ] Every command matches the tutorial; anything that had to change is
  fixed in the tutorial, in its own pull request.
- [ ] No frame shows a license, password, token or client secret. Check the
  clips for chapters 3 and 8 especially.
- [ ] Every highlight from the shot list appears in its browser clip.
- [ ] Every split beat's two clips overlap in time, and the console shows
  its "before" first and the change while the tape runs.
- [ ] Each pane is recorded at its final size: 768×1080 and 1152×1080 for a
  split, 1920×1080 otherwise.
- [ ] `record.sh` runs start to finish without anyone touching it.

## Report back

On the pull request:

- The list of clips, with their lengths.
- Anything that didn't work, and how it was fixed.
- Anything on screen that looked wrong or confusing, such as the Reloader
  console's timestamp or its "Alpha-dev" label.

The scripts, tapes and `package.json` are committed here, in `video/`, with
the dry run's clips for review. Never commit audio, or anything holding a
secret.
