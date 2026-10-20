# Demo video: tenants on OpenShift, carried into Vault Enterprise

The first demo video, recorded from a real run of the [tutorial](../post.md).
It follows the [video guideline](../../docs/guidelines/video.md).

## What we want

**One recording of the whole tutorial, cut into three versions.** We record
every step once, from an empty cluster to a boundary that holds. Each
version is then cut from that footage for a different viewer, with its own
narration.

| Version | Length | For | Where |
|---|---|---|---|
| **Demo, the main cut** | About 4 minutes (3 to 5) | Anyone deciding whether this is worth trying | YouTube, the posts, sales; the link we share by default |
| **Full walkthrough** | About 17 minutes, a chapter per step | The engineer who wants every step on screen before trying it | YouTube, linked from the tutorial |
| **Short cut** | About 75 seconds | Feeds, mostly watched muted | LinkedIn, YouTube Shorts |

**They all leave the viewer knowing:** it installs on OpenShift in about an
hour. A tenant becomes a Vault namespace on its own. Apps get secrets with
a few annotations, and rotations reach the pod. Tenants can't reach each
other. It runs on the free Basic edition.

**In the recording:** steps 1 to 10, as written in the tutorial.
**Out:** the optional sign-in section, which is topic 2's subject, and the
clean-up, which every version points to in the tutorial.

## The demo: the main cut

About 4 minutes. The installs are one fast sequence; most of the time goes
to what makes it worth trying. The narration is in its own
[script](narration-demo.md), ready to record.

| # | Part | From the recording | Narration | Time |
|---|---|---|---|---|
| 1 | **Cold open** | Vault's namespace picker with `acme` and `globex`; the Multi-Tenant Operator console's Tenants page | [Script, part 1](narration-demo.md) | 0:15 |
| 2 | **The problem** | Title card; post 1's flow diagram | [Script, part 2](narration-demo.md) | 0:25 |
| 3 | **Setup** | Chapters 2 to 7 as one sequence, about 6 seconds per piece: each install, then its proof (Certified tile and "Succeeded"; `vault-0` ready; Vault Config Operator, External Secrets Operator and Reloader rolled out; the extension installed). Labeled "Setup, sped up". | [Script, part 3](narration-demo.md) | 0:50 |
| 4 | **Two tenants** | Chapter 8: the split screen as the Vault namespaces appear; the Multi-Tenant Operator console's Tenants and Namespaces pages | [Script, part 4](narration-demo.md) | 0:45 |
| 5 | **An app gets its secret** | Chapter 9: the annotations, highlighted; "6 characters"; the policy nobody wrote; the delivered Secret | [Script, part 5](narration-demo.md) | 0:40 |
| 6 | **Rotation** | Chapter 10: the pod rolling; "10 characters"; Reloader's console with two restarts | [Script, part 6](narration-demo.md) | 0:30 |
| 7 | **The boundary holds** | Chapter 11: both `403`s; the hand-widened policy put back | [Script, part 7](narration-demo.md) | 0:30 |
| 8 | **Close** | End card: "Try it free", the tutorial link, the docs link, the Stakater logo | [Script, part 8](narration-demo.md) | 0:15 |

Total: about 4:10.

## The full walkthrough

The whole recording, chapter by chapter. It's what the demo and the short
cut are cut from, and it's published as its own video for viewers who want
every step.

### How every chapter runs

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

### On screen

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

### Chapters

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
| 9 | **Step 8: Deploy an app that reads its secret** | Write the password; `checkout.yaml` with its annotations highlighted; apply it | The Secret appears; the log says "6 characters"; the secret in Vault; the policy nobody wrote; the Secret's owner in the OpenShift console | "An app asks for its secret with annotations: two on its service account, one on its deployment. That's it: no Vault token, no ticket. Here's the policy it was given, and nobody wrote it. And here's the password, delivered as an ordinary Kubernetes Secret." | 2:15 |
| 10 | **Step 9: Rotate the secret** | Rotate, force the refresh; then rotate again, sped up | The pod rolls; "10 characters", then "14 characters"; Reloader's console with two restarts caused by `checkout-db`; Vault's three versions | "Rotate the password in Vault. The Secret updates, Reloader rolls the pod, and the app has the new value. Do it again: same result, nothing new to set up. Reloader's console keeps the record: what restarted, and why." | 1:45 |
| 11 | **Step 10: Check the isolation** | globex's app logs in; reads its own secret; tries acme's; tries acme's role; a policy widened by hand, then the wait, sped up | The allowed read; both refusals, `403` highlighted; the policy back to what it was | "Now prove the boundary holds. The other team's app reads its own secret. It can't read acme's: 403. It can't borrow acme's role: 403. And if someone widens a policy by hand during an incident, a minute later it's back to what it should be." | 1:45 |
| 12 | **Close** | – | "What you built", four lines; then the end card: "Try it free", the tutorial link, the docs link, the Stakater logo | "Two tenants, each with its own Vault namespace. Secrets by annotation, rotations that reach the pod, and a boundary that holds. The tutorial, with every command and the clean-up, is linked below. Try it free, on your own cluster." | 0:40 |

Total: about 17:30.

#### YouTube chapters

The description lists the chapters with their start times, so viewers can
jump to a step: Cold open, The problem, then Step 1 to Step 10, and Close.

## The short cut

About 75 seconds, cut from the demo: the cold open, the Vault namespaces
appearing, the annotations, the pod rolling with Reloader's console, the
`403`, and the end card. Captions burned in, because most people watch
muted. Narration optional; if used, rewritten to fit.

## Narration

Each version has its own script. A shorter version needs its own sentences,
not the long one cut down.

| Version | Script | Recorded |
|---|---|---|
| Demo | [narration-demo.md](narration-demo.md), ready to read aloud and record | One file per part, two takes each |
| Full walkthrough | The chapters table above | One take per chapter |
| Short cut | Captions, from the demo's lines; voice optional | Only if used |

## Steps to make it

| # | Step | Who | Output |
|---|---|---|---|
| 1 | **Agree the chapters and narration.** Read the narration aloud; cut anything that doesn't fit its time. | The three authors | This file, approved |
| 2 | **Get a clean cluster.** OpenShift 4.22, the same as the tutorial's validation. Pass the kubeconfig, the console login and the Vault license by file path, never pasted. | Stakater | A cluster nobody else is using during the recording |
| 3 | **Set up the recording tools,** as in [recording.md](recording.md#setup). | Stakater | Tools installed and checked |
| 4 | **Write the recording scripts,** following [recording.md](recording.md). One VHS tape per chapter's terminal part, from the tutorial's exact commands. One Playwright script per chapter's browser part, drawing the tutorial's highlights. One `record.sh` that runs them in tutorial order against the cluster. | Stakater | `video/tapes/`, `video/browser/`, `video/record.sh` |
| 5 | **Dry run.** Run everything once without keeping the footage. Fix timing, waits and anything on screen that doesn't match the tutorial. Fixes to the steps go into the tutorial first. | Stakater | A run with no surprises |
| 6 | **Reset and record.** Start from a clean cluster again, run `record.sh`, and keep the clips for each chapter. If a screen changed since the screenshots, re-capture them in the same run. | Stakater | `video/clips/NN-*.mp4` |
| 7 | **Record the voiceover.** Each version's script, as in the Narration table, in a quiet room. | One author | `video/voice/NN-*.wav` |
| 8 | **Assemble.** An `assemble.sh` joins the clips in order, speeds up the waits with an on-screen "sped up" note, adds the chapter cards and "In production" captions, builds the split screen for chapter 8, lays the voiceover on top, adds the opening and end cards, and writes the subtitle file and the YouTube chapter list. That's the full walkthrough. Then cut the demo and the short cut from the same clips, each with its own narration. | Stakater | `walkthrough.mp4`, `demo.mp4`, `short.mp4`, a subtitle file for each, thumbnails |
| 9 | **Review.** All three authors watch all three versions against the [video checklist](../../docs/guidelines/video.md#checklist). | The three authors | Approved, or a list of fixes |
| 10 | **Publish.** YouTube on the tutorial's publication day: the demo and the full walkthrough. The short cut on LinkedIn. The demo embedded in the posts if Red Hat Developer allows it. | Stakater, then everyone reposts | Live links, added to the tutorial |

The recording scripts and `assemble.sh` are committed with the video, so
it can be re-recorded when the tutorial changes. The clips and voice files
are large; they are kept out of Git and stored with the published video.

## Open questions

- Who records the voiceover?
- Does Red Hat Developer allow embedded video in the posts?
- Which YouTube channel publishes it, and can Red Hat share it on theirs?
