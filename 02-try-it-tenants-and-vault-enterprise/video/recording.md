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
| **Terminal tapes** | Plain text files for [VHS](https://github.com/charmbracelet/vhs): what to type, and what to wait for | The terminal pane of each beat, at the pane's size |
| **Browser scripts** | [Playwright](https://playwright.dev) scripts: open the "before" page, refresh until the change appears, highlight it | The console pane of each beat, at the pane's size |
| **`record.sh`** | Runs the beats in the tutorial's order, starting each beat's browser and tape together | The clips, and a timeline with each clip's start time |

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
brew install vhs ffmpeg        # VHS also installs ttyd, which it needs
node --version                 # 20 or later
cd 02-try-it-tenants-and-vault-enterprise/video
npm install                    # Playwright, pinned in package.json
npx playwright install chromium
```

If Homebrew has no VHS or ffmpeg bottles for your macOS (13 has none, so it
builds 16 formulae from source), skip that line and install Docker:
`record.sh` then runs VHS and ffmpeg from VHS's container image, with Linux
`oc` and `helm` it downloads to `.tools/`.

Secrets come from files, never typed, never printed. Before recording, set:

```bash
export KUBECONFIG=/path/to/kubeconfig                 # cluster-admin
export VAULT_LICENSE_FILE=/path/to/vault.hclic
export OCP_CONSOLE_USER=<user>                         # for the OpenShift console
export OCP_CONSOLE_PASSWORD_FILE=/path/to/password-file
```

The Multi-Tenant Operator console's password and Vault's dev root token are
read from the cluster by the scripts, at run time.

## Layout

```
video/
  plan.md, narration-demo.md, recording.md
  package.json
  record.sh
  tapes/
    _setup.tape            shared settings and hidden helpers, sourced by every tape
    02-install-mto.tape
    03-vault.tape
    ...
  browser/
    lib.mjs                launch, sign-in helpers, highlight()
    02-install-mto.mjs
    ...
  clips/                   output, in .gitignore; the dry run's clips are committed for review
```

Name every file `NN-<chapter>`, with `NN` the chapter number from the
[plan](plan.md#chapters), so clips sort in video order.

## Terminal tapes

**Pane sizes:** the settings below are for a full-screen terminal beat. For a
split beat, the tape sets `Width 768`, `Height 1080` and `FontSize 18`, so
the pane is recorded at its final size.

Every tape starts from the shared settings:

```
Source tapes/_setup.tape
Output clips/08-tenants-terminal.mp4
```

`_setup.tape` holds:

```
Set Shell bash
Set FontSize 22
Set Width 1920
Set Height 1080
Set Padding 40
Set Theme "Dracula"
Set TypingSpeed 35ms

Hide
Type "export PS1='$ '; clear" Enter
Type `v()  { oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault "$@"; }` Enter
Type `vt() { local t=$1; shift; oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$t" vault "$@"; }` Enter
Type "cd ../examples && clear" Enter
Show
```

Strings that contain double quotes go in backticks, as above, rather than
escaped.

Rules for every tape:

- **The commands are the tutorial's, exactly.** Copy them from
  [post.md](../post.md). If a command has to change to work, fix the
  tutorial first, then the tape.
- **Wait for the result, not for a fixed time.** Use `Wait+Screen /pattern/`
  for what proves the step worked, such as `/successfully rolled out/` or
  `/acme\//`, with a `Sleep 2s` after so the viewer can read it. Waits run in
  real time; they're sped up in the edit, not here.
- **Long commands are typed, not pasted,** but lines over about 100
  characters use the tutorial's `\` line breaks, so they stay readable.
- **Anything that would show a secret runs hidden**, between `Hide` and
  `Show`. In this tutorial: creating the Vault license Secret (step 2), and
  reading the Multi-Tenant Operator console's password (step 7). The command
  that reads the password must never run where it's recorded.
- **Things only the recording needs run hidden too:** setting variables such
  as `APPS_DOMAIN`, or `clear` between parts.
- **Keep each part within one screen,** 34 rows at these settings. VHS
  0.10's `Wait+Screen` reads only the terminal's first screen since the last
  `clear`: once the output scrolls, it can't see new text, and the wait times
  out. Put a hidden `clear` between parts, for example after `cat` of a long
  file. A plain `Wait` (the prompt is back) still works after scrolling.

## Browser scripts

**Pane sizes:** the example below records 1920×1080, for a full-screen
console beat. For a split beat, the viewport and `recordVideo` size are
1152×1080. And a split beat's script doesn't click through: it opens the
"before" page, then reloads it (or clicks the console's Refresh) every 2
seconds until the expected element appears, highlights it, and holds 3
seconds.

`browser/lib.mjs` gives every script the same browser and the same
highlight:

```js
import { chromium } from 'playwright';

export async function start(clip) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: 'clips/raw', size: { width: 1920, height: 1080 } },
    colorScheme: 'light',
    locale: 'en-US',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  return { browser, context, page, clip };
}

// Same style as the screenshots: 3 px Stakater orange, drawn in the page.
export async function highlight(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    el.style.outline = '3px solid #EA7845';
    el.style.outlineOffset = '4px';
    el.style.borderRadius = '6px';
  });
  await locator.page().waitForTimeout(1500); // let the viewer see it
}

// Close to flush the video, then save it under the chapter's name.
export async function finish({ browser, context, page, clip }) {
  const video = page.video();
  await context.close();
  await video.saveAs(`clips/${clip}.webm`);
  await browser.close();
}
```

Rules for every browser script:

- **Sign in before the part that's recorded,** or crop it out: the clip
  should start on the page that matters.
- **Click where the tutorial says,** at a calm pace: about a second between
  actions, and 2 seconds on each page before moving on.
- **Highlight what the tutorial's screenshot highlights,** in the same order.
  The highlights are listed in
  [screenshots/README.md](../screenshots/README.md).
- **Dismiss banners and tours** before the recorded part, as for screenshots.
- **Convert each clip to MP4** at the end of `record.sh`:
  `ffmpeg -i clips/NN-x.webm -c:v libx264 -pix_fmt yuv420p clips/NN-x.mp4`.

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

Chapters 1 (the problem) and the close are cards, made in the edit.

## `record.sh`

- Runs the beats in the scene table's order, then the cold open.
- For a split beat: starts the browser on the "before" page, waits for it to
  settle, records its start time, starts the tape, records its start time,
  and stops both once the change is highlighted and held 3 seconds.
- Stops at the first failure, saying which chapter and which command.
- Writes `clips/timeline.csv`: beat, clip, start time, end time. The edit
  lines up each split beat's two clips by their start times, and speeds up
  the waits.
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
