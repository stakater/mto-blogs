# Recording: how the footage is made

Instructions for recording the screen for this video. They're written so
anyone with a cluster, or a Claude session working for them, can follow them
start to finish. The footage feeds all three versions in the
[video plan](plan.md); the voice is recorded separately, from
[the script](narration-demo.md).

The rules behind these instructions are in the
[video guideline](../../docs/guidelines/video.md) and the
[screenshot guideline](../../docs/guidelines/screenshots.md).

## What you're building

Scripts that record the screen **automatically**, so nobody types or clicks
while the camera runs:

| Kind | What it is | Records |
|---|---|---|
| **Terminal tapes** | Plain text files for [VHS](https://github.com/charmbracelet/vhs): what to type, and what to wait for | The terminal parts of each chapter, as MP4 |
| **Browser scripts** | [Playwright](https://playwright.dev) scripts: open a page, sign in, click, highlight | The console parts of each chapter, as video |
| **`record.sh`** | Runs everything in the tutorial's order | All the clips, and a timeline of when each ran |

Re-recording is then one command: when the tutorial or a product changes,
run `record.sh` again on a clean cluster.

## Two runs

| Run | When | Cluster | Purpose |
|---|---|---|---|
| **Dry run** | Now | Any cluster you can reset, on the current Reloader beta (chart 3.0.0-beta.2) | Write and debug the scripts. The footage is thrown away. |
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
npm init -y >/dev/null && npm install --save-dev playwright
npx playwright install chromium
```

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
  clips/                   output; never committed (.gitignore)
```

Name every file `NN-<chapter>`, with `NN` the chapter number from the
[plan](plan.md#chapters), so clips sort in video order.

## Terminal tapes

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

## Browser scripts

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

## Chapter by chapter

What each chapter records. The full description of each chapter, with what
to show, is in the [plan](plan.md#chapters).

| # | Chapter | Terminal tape | Browser script |
|---|---|---|---|
| 0 | Cold open | – | `00-cold-open`: Vault namespace picker (`acme`, `globex`), then the Multi-Tenant Operator console's Tenants page. Record after chapter 11. |
| 2 | Step 1 | `02-install-mto`: Template Operator on; privileged namespaces; its deployment running | `02-install-mto`: Software Catalog search "multi tenant", Install, Installed Operators "Succeeded" |
| 3 | Step 2 | `03-vault`: license Secret (hidden), Helm install, `vault-0` ready, route, `v version` | – |
| 4 | Step 3 | `04-vco`: Helm install, rollout | – |
| 5 | Step 4 | `05-eso-reloader`: the configuration, the webhook rollout, Reloader with its console, its four rollouts | `05-eso`: Software Catalog, External Secrets Operator for Red Hat OpenShift. `05-reloader-console`: the console open and still empty |
| 6 | Step 5 | `06-vault-login`: the four commands; `cat` of the policy, scrolled | – |
| 7 | Step 6 | `07-extension`: Helm install, the resources ready | – |
| 8 | Step 7 | `08-tenants`: `tenants.yaml`, apply, `v namespace list`, Vault Config Operator resources | `08-vault-split`: the Vault namespace picker, refreshed every few seconds **while the tape runs**, until `acme` and `globex` appear. `08-consoles`: Tenant tab, the project's label, the Multi-Tenant Operator console's Tenants and Namespaces pages |
| 9 | Step 8 | `09-app`: write the password, `checkout.yaml` shown, apply, the Secret, the log | `09-app`: the secret in Vault, its policy, the Secret's owner in the OpenShift console |
| 10 | Step 9 | `10-rotate`: both rotations, both logs | `10-rotate`: Reloader's console with two restarts; Vault's three versions |
| 11 | Step 10 | `11-isolation`: allowed read, both `403`s, the policy widened and put back | – |

Chapters 1 and 12 are cards and a diagram, made in the edit; nothing to
record.

**The split screen in chapter 8** needs two clips recorded at the same
time: start `08-vault-split.mjs` first, then the `08-tenants` tape, and stop
the browser once `acme` and `globex` are on screen. `record.sh` writes both
start times to the timeline, so the edit can line them up.

## `record.sh`

- Runs the chapters in order: 02 to 11, then 00.
- Stops at the first failure, saying which chapter and which command.
- Writes `clips/timeline.csv`: chapter, clip, start time, end time. The edit
  uses it to speed up the waits and line up the split screen.
- Never prints a secret, and never writes one to a file under `video/`.

## Dry run: done when

- [ ] Every chapter's clips exist in `clips/`, and play.
- [ ] Every command matches the tutorial; anything that had to change is
  fixed in the tutorial, in its own pull request.
- [ ] No frame shows a license, password, token or client secret. Check the
  clips for chapters 3 and 8 especially.
- [ ] Every highlight from the shot list appears in its browser clip.
- [ ] The split screen's two clips overlap in time, with the namespaces
  appearing while the tape runs.
- [ ] `record.sh` runs start to finish without anyone touching it.

## Report back

On the pull request:

- The list of clips, with their lengths.
- Anything that didn't work, and how it was fixed.
- Anything on screen that looked wrong or confusing, such as the Reloader
  console's timestamp or its "Alpha-dev" label.

Commit the scripts, tapes and `package.json` on a new branch from
`content-strategy`, named `video-01-recording`. Never commit clips, audio
or anything holding a secret.
