# Demo video: tenants on OpenShift, carried into Vault Enterprise

The first demo video, recorded from a real run of the [tutorial](../post.md).
It follows the [video guideline](../../docs/guidelines/video.md).

## What we want

**The whole tutorial, on screen, from an empty cluster to a boundary that
holds.** Every step, installs included, so the viewer sees that it all
installs, starts and works, not only the interesting parts.

| | |
|---|---|
| **Walkthrough** | About 17 minutes, one YouTube chapter per tutorial step |
| **Short cut** | About 75 seconds, from the same footage |
| **Viewer** | A platform engineer deciding whether to try the tutorial, and anyone who wants to see it working before they do |
| **They come away knowing** | It installs on OpenShift in about an hour. A tenant becomes a Vault namespace on its own. Apps get secrets with two annotations, and rotations reach the pod. Tenants can't reach each other. It runs on the free Basic edition. |

**In:** steps 1 to 10, as written in the tutorial.
**Out:** the optional sign-in section, which is topic 2's subject, and the
clean-up, which the close points to in the tutorial.

## How every chapter runs

Each tutorial step is one chapter, with the same rhythm, so the viewer always
knows where they are:

| Beat | What's on screen | Length |
|---|---|---|
| **Card** | "Step N: <the tutorial's heading>" | 2 s |
| **Why** | Narration only, over the last frame or the card: one or two sentences | 5–10 s |
| **Do** | The commands, typed quickly in the terminal, or the clicks in the console. The exact commands from the tutorial. | As needed |
| **Wait** | The real wait, sped up, with "sped up N×" in the corner. Never cut, so nobody thinks it's faster than it is. | 3–8 s on screen |
| **Show it running** | The proof the step worked: the rollout finishing, pods `Running`, "Succeeded" in the console, or the result in the UI, with the tutorial's highlights | 5–15 s |
| **What happened** | One line of narration, matching the tutorial's "What just happened" | 5–10 s |
| **In production** | Where the tutorial has an "In production" note: a lower-third caption for 3–4 s, not narrated | 3–4 s |
| **Beat** | One second of stillness before the next card | 1 s |

## On screen

- **Terminal:** full screen at 1920×1080, a clean dark theme, a font at
  least 22 points, and a prompt that shows only `$`. Commands appear typed,
  at about three times reading speed; output appears as it really comes.
- **Browser:** a 1920×1080 viewport, light theme, no browser frame. The
  tutorial's highlights are drawn in the page as the scene reaches them.
- **One split screen,** in step 7: the terminal on the left creates the
  tenants, the Vault UI on the right shows the namespaces appear. It's the
  moment the whole video builds to.
- **Nothing secret on screen.** The license is read from a file path; client
  secrets and tokens are never printed. The dev-mode root token `root` is
  part of the tutorial and can show.
- **A cluster with a neutral name,** because its domain appears in addresses
  on screen.

## Chapters

Narration is a first draft, to be read aloud and tightened before recording.

| # | Chapter | Do | Show it running | Narration (draft) | Time |
|---|---|---|---|---|---|
| 0 | **Cold open** | – | Vault UI namespace picker: `acme`, `globex`; the Multi-Tenant Operator console's Tenants page | "Two teams on one OpenShift cluster. Each has its own Vault namespace. Nobody wrote a line of Vault configuration. Here's how, from an empty cluster." | 0:20 |
| 1 | **The problem** | – | Title card; then post 1's flow diagram, from Tenant to pod | "OpenShift keeps teams apart. Vault has its own idea of who a team is. Multi-Tenant Operator connects the two: you define a team once, as a tenant, and Vault follows. Let's build it." | 0:40 |
| 2 | **Step 1: Install Multi-Tenant Operator** | Software Catalog: search "multi tenant", Install. Terminal: switch on Template Operator; add the privileged namespaces. | Installed Operators: all "Succeeded" (highlighted); the `template-operator-v2` deployment running | "Multi-Tenant Operator is a Red Hat certified operator, in the Software Catalog. The Basic edition is free and manages two tenants, which is all we need. It ships with Template Operator, so we switch that on. And we let the platform tools' namespaces through, because Multi-Tenant Operator now guards every namespace." | 2:00 |
| 3 | **Step 2: Install Vault Enterprise** | The license Secret; the Helm install; the route | `vault-0` Ready; `v version` showing `2.1.1+ent` | "Vault Enterprise, from Red Hat's certified image, with your own license. One learning pod here. In production you'd point at your existing Vault." | 1:15 |
| 4 | **Step 3: Install Vault Config Operator** | The Helm install | Its deployment rolled out | "Vault Config Operator, from the Red Hat Community of Practice, writes Vault configuration from Kubernetes resources. Drift detection puts back anything changed by hand. You'll see that at the end." | 0:50 |
| 5 | **Step 4: Install External Secrets Operator and Reloader** | Software Catalog: External Secrets Operator. Terminal: its configuration; then Reloader with its console | The webhook rolled out; Reloader's four parts rolled out; Reloader's console open, still empty | "External Secrets Operator delivers secrets from Vault into the cluster. Reloader restarts pods when a secret changes, and its free console keeps the history. Nothing to show yet. That comes in step 9." | 2:00 |
| 6 | **Step 5: Give Vault Config Operator its login** | The four Vault commands; the policy file, scrolled briefly | The login role written | "Vault Config Operator logs in once, with a narrow policy. It can create tenant namespaces and manage their access. It can't read a single secret, and it can't delete a tenant's data." | 0:50 |
| 7 | **Step 6: Install the extension** | The Helm install | The extension's resources ready in `vault-config` | "The Vault Enterprise extension for Multi-Tenant Operator. From now on it watches every tenant. There are none yet, so Vault hasn't changed." | 0:40 |
| 8 | **Step 7: Create two tenants** | `tenants.yaml` on screen; apply it | **Split screen:** Vault namespaces appear. Then: the Tenant tab; the project's tenant label; the Multi-Tenant Operator console's Tenants and Namespaces pages; `v namespace list`; Vault Config Operator's resources | "Now the part that matters. Two tenants: two small resources. Multi-Tenant Operator creates their projects and labels them. And within a minute, Vault has a namespace for each. We didn't touch Vault. Multi-Tenant Operator's own console shows both teams, and which projects are theirs. In Vault, each tenant has its own secrets engine and its own login. All of it is Kubernetes resources you can keep in Git." | 2:30 |
| 9 | **Step 8: Deploy an app that reads its secret** | Write the password; `checkout.yaml` with its two annotations highlighted; apply it | The Secret appears; the log says "6 characters"; the secret in Vault; the policy nobody wrote; the Secret's owner in the OpenShift console | "An app asks for its secret with two annotations. That's it: no Vault token, no ticket. Here's the policy it was given, and nobody wrote it. And here's the password, delivered as an ordinary Kubernetes Secret." | 2:15 |
| 10 | **Step 9: Rotate the secret** | Rotate, force the refresh; then rotate again, sped up | The pod rolls; "10 characters", then "14 characters"; Reloader's console with two restarts caused by `checkout-db`; Vault's three versions | "Rotate the password in Vault. The Secret updates, Reloader rolls the pod, and the app has the new value. Do it again: same result, nothing new to set up. Reloader's console keeps the record: what restarted, and why." | 1:45 |
| 11 | **Step 10: Check the isolation** | globex's app logs in; reads its own secret; tries acme's; tries acme's role; a policy widened by hand, then the wait, sped up | The allowed read; both refusals, `403` highlighted; the policy back to what it was | "Now prove the boundary holds. The other team's app reads its own secret. It can't read acme's: 403. It can't borrow acme's role: 403. And if someone widens a policy by hand during an incident, a minute later it's back to what it should be." | 1:45 |
| 12 | **Close** | – | "What you built", four lines; then the end card: "Try it free", the tutorial link, the docs link, the Stakater logo | "Two tenants, each with its own Vault namespace. Secrets by annotation, rotations that reach the pod, and a boundary that holds. The tutorial, with every command and the clean-up, is linked below. Try it free, on your own cluster." | 0:40 |

Total: about 17:30.

### YouTube chapters

The description lists the chapters with their start times, so viewers can
jump to a step: Cold open, The problem, then Step 1 to Step 10, and Close.

### The short cut

Chapter 0; the split screen from chapter 8; the two annotations and the
delivered Secret from chapter 9; the pod rolling and Reloader's console from
chapter 10; the `403` from chapter 11; and the end card. Narration rewritten
to fit about 75 seconds, captions burned in.

## Steps to make it

| # | Step | Who | Output |
|---|---|---|---|
| 1 | **Agree the chapters and narration.** Read the narration aloud; cut anything that doesn't fit its time. | The three authors | This file, approved |
| 2 | **Get a clean cluster.** OpenShift 4.22, the same as the tutorial's validation. Pass the kubeconfig, the console login and the Vault license by file path, never pasted. | Stakater | A cluster nobody else is using during the recording |
| 3 | **Set up the recording tools.** VHS and ffmpeg for the terminal scenes; Playwright for the browser scenes, with video recording on. | Stakater | Tools installed and checked |
| 4 | **Write the recording scripts.** One VHS tape per chapter's terminal part, from the tutorial's exact commands. One Playwright script per chapter's browser part, drawing the tutorial's highlights. One `record.sh` that runs them in tutorial order against the cluster. | Stakater | `video/tapes/`, `video/browser/`, `video/record.sh` |
| 5 | **Dry run.** Run everything once without keeping the footage. Fix timing, waits and anything on screen that doesn't match the tutorial. Fixes to the steps go into the tutorial first. | Stakater | A run with no surprises |
| 6 | **Reset and record.** Start from a clean cluster again, run `record.sh`, and keep the clips for each chapter. If a screen changed since the screenshots, re-capture them in the same run. | Stakater | `video/clips/NN-*.mp4` |
| 7 | **Record the voiceover.** One take per chapter, from the final narration, in a quiet room. | One author | `video/voice/NN-*.wav` |
| 8 | **Assemble.** An `assemble.sh` joins the clips in order, speeds up the waits with an on-screen "sped up" note, adds the chapter cards and "In production" captions, builds the split screen for chapter 8, lays the voiceover on top, adds the opening and end cards, and writes the subtitle file and the YouTube chapter list. Then cut the short version from the same clips. | Stakater | `walkthrough.mp4`, `short.mp4`, `walkthrough.srt`, a thumbnail |
| 9 | **Review.** All three authors watch both cuts against the [video checklist](../../docs/guidelines/video.md#checklist). | The three authors | Approved, or a list of fixes |
| 10 | **Publish.** YouTube on the tutorial's publication day; the short cut on LinkedIn; embedded in the posts if Red Hat Developer allows it. | Stakater, then everyone reposts | Live links, added to the tutorial |

The recording scripts and `assemble.sh` are committed with the video, so
it can be re-recorded when the tutorial changes. The clips and voice files
are large; they are kept out of Git and stored with the published video.

## Open questions

- Who records the voiceover?
- Does Red Hat Developer allow embedded video in the posts?
- Which YouTube channel publishes it, and can Red Hat share it on theirs?
