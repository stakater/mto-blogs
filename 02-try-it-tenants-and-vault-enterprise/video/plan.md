# Demo video: tenants on OpenShift, carried into Vault Enterprise

The first demo video, recorded from a real run of the
[tutorial](../post.md). It follows the [video guideline](../../docs/guidelines/video.md).

| | |
|---|---|
| **Walkthrough** | About 10 minutes, a chapter per tutorial step |
| **Short cut** | About 75 seconds, from the same footage |
| **Viewer** | A platform engineer deciding whether to try the tutorial |
| **They come away knowing** | A tenant on OpenShift becomes a Vault namespace automatically; apps get secrets with two annotations; tenants can't reach each other; and it runs on the free Basic edition |

## Shot list and narration

Narration is a first draft, to be read aloud and tightened before
recording. Times are targets for the walkthrough.

| # | Tutorial step | Type | On screen | Narration (draft) | Time |
|---|---|---|---|---|---|
| 1 | – | Browser | Cold open: the Vault UI namespace picker with `acme` and `globex`, then the Multi-Tenant Operator console with the same two tenants | "Two teams on one OpenShift cluster. Each has its own Vault namespace. Nobody wrote a line of Vault configuration. Here's how." | 0:15 |
| 2 | – | Card | Title: "Tenants on OpenShift, carried into Vault Enterprise" | – | 0:04 |
| 3 | – | Diagram | Post 1's flow diagram, from Tenant to pod | "On a shared cluster, OpenShift keeps teams apart. Vault has its own idea of who a team is. Multi-Tenant Operator connects the two: you define a team once, as a tenant, and Vault follows." | 0:25 |
| 4 | 1 | Browser | Software Catalog: search "multi tenant", the Certified tile, Install, then Installed Operators showing Succeeded (sped up) | "Multi-Tenant Operator is a Red Hat certified operator. Install it from the Software Catalog. The Basic edition is free and manages two tenants, which is all this demo needs." | 0:40 |
| 5 | 1 | Terminal | The Template Operator patch, and the privileged namespaces patch | "Switch on the Template Operator it ships with, and let the platform tools' namespaces through." | 0:30 |
| 6 | 2 | Terminal | The Vault Enterprise Helm install, sped up, then `v version` | "Next, Vault Enterprise. This is a single learning pod with your own license. In production you'd point at your existing Vault." | 0:35 |
| 7 | 3–4 | Terminal | Vault Config Operator, External Secrets Operator and Reloader installs, sped up | "Three helpers. Vault Config Operator writes Vault configuration from Kubernetes resources. External Secrets Operator delivers secrets to pods. Reloader restarts them when a secret changes, and its free console shows every reload." | 0:45 |
| 8 | 5 | Terminal | The four Vault commands; then the policy file scrolled briefly | "Vault Config Operator logs in once, with a narrow policy. It can't read a single secret, and it can't delete a tenant's data." | 0:35 |
| 9 | 6 | Terminal | The extension's Helm install | "Then the Vault Enterprise extension for Multi-Tenant Operator. It now watches every tenant." | 0:20 |
| 10 | 7 | Terminal, then browser | `oc apply -f tenants.yaml`; the Tenant tab; the project's tenant label; `v namespace list` showing `acme/`, `globex/`, `shared/`; the Vault UI namespace picker | "Now the interesting part. Two tenants: two resources. Multi-Tenant Operator creates their projects and labels them. Within a minute, Vault has a namespace for each. We didn't touch Vault." | 1:10 |
| 11 | 7 | Browser | The Multi-Tenant Operator console: tenant `acme`, its project and quota | "Multi-Tenant Operator's own console shows each team's projects, quota and costs." | 0:20 |
| 12 | 8 | Terminal, then browser | `checkout.yaml` with its two annotations highlighted; apply; `logs` showing "6 characters"; the generated policy in the Vault UI; the Secret in the OpenShift console | "An app asks for its secret with two annotations. That's it. No Vault token, no ticket. Here's the policy it got, and nobody wrote it. And here's the secret, delivered as an ordinary Kubernetes Secret." | 1:20 |
| 13 | 9 | Terminal, then browser | `kv put` with the new value; force sync; rollout; `logs` showing "10 characters"; the version history in Vault; Reloader's console showing `checkout` reloaded because of `checkout-db` | "Rotate the password in Vault. The Secret updates, Reloader rolls the pod, and the app has the new value. Reloader's console shows exactly what restarted, and why." | 1:00 |
| 14 | 10 | Terminal | globex logs in; reads its own secret; refused on acme's (403); refused acme's role (403) | "Now prove the boundary. The other team's app reads its own secret. It can't read acme's: 403. It can't borrow acme's role: 403." | 0:55 |
| 15 | 10 | Terminal | Widen the policy by hand; wait (sped up); it's back | "Someone widens a policy by hand during an incident. A minute later, it's back to what it should be." | 0:40 |
| 16 | – | Card | "What you saw": four lines; then the end card: "Try it free" with the tutorial link, the docs link, the Stakater logo | "Two tenants, each with its own Vault namespace, secrets by annotation, and a boundary that holds. The tutorial is linked below. Try it free, on your own cluster." | 0:25 |

Total: about 10 minutes.

### The short cut

Scenes 1, 10 (the namespaces appearing), 12 (the annotations and the
delivered secret), 13 (the pod rolling, and the reload in Reloader's console), 14 (the 403) and 16, with
narration rewritten to fit about 75 seconds. Captions burned in.

## Steps to make it

| # | Step | Who | Output |
|---|---|---|---|
| 1 | **Agree this shot list and narration.** Read the narration aloud; cut anything that doesn't fit its time. | The three authors | This file, approved |
| 2 | **Get a clean cluster.** OpenShift 4.22, the same as the tutorial's validation. Pass the kubeconfig, the console login and the Vault license by file path, never pasted. | Stakater | A cluster nobody else is using during the recording |
| 3 | **Set up the recording tools.** VHS and ffmpeg for the terminal scenes; Playwright for the browser scenes, with video recording on. | Stakater | Tools installed and checked |
| 4 | **Write the recording scripts.** One VHS tape per terminal scene, from the tutorial's exact commands. One Playwright script per browser scene. One `record.sh` that runs them in tutorial order against the cluster. | Stakater | `video/tapes/`, `video/browser/`, `video/record.sh` |
| 5 | **Dry run.** Run everything once without keeping the footage. Fix timing, waits and anything on screen that doesn't match the tutorial. Fixes to the steps go into the tutorial first. | Stakater | A run with no surprises |
| 6 | **Reset and record.** Start from a clean cluster again, run `record.sh`, and keep one clip per scene. Capture the tutorial's screenshot slots in the same run. | Stakater | `video/clips/NN-*.mp4`, the remaining screenshots |
| 7 | **Record the voiceover.** One take per scene, from the final narration, in a quiet room. | One author | `video/voice/NN-*.wav` |
| 8 | **Assemble.** An `assemble.sh` joins the clips in order, speeds up the waits with an on-screen "sped up" note, lays the voiceover on top, adds chapter labels and the opening and end cards, and writes the subtitle file. Then cut the short version from the same clips. | Stakater | `walkthrough.mp4`, `short.mp4`, `walkthrough.srt`, a thumbnail |
| 9 | **Review.** All three authors watch both cuts against the [video checklist](../../docs/guidelines/video.md#checklist). | The three authors | Approved, or a list of fixes |
| 10 | **Publish.** YouTube on the tutorial's publication day; the short cut on LinkedIn; embedded in the posts if Red Hat Developer allows it. | Stakater, then everyone reposts | Live links, added to the tutorial |

The recording scripts and `assemble.sh` are committed with the video, so
it can be re-recorded when the tutorial changes. The clips and voice files
are large; they are kept out of Git and stored with the published video.

## Open questions

- Who records the voiceover?
- Does Red Hat Developer allow embedded video in the posts?
- Which YouTube channel publishes it, and can Red Hat share it on theirs?
