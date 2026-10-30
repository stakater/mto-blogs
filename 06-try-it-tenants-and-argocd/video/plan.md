# Demo video: tenants on OpenShift, carried into Argo CD

The demo video, recorded from a real run of the [tutorial](../post.md). It
follows the [video guideline](../../docs/guidelines/video.md), and is made
the same way as the
[first video](../../02-try-it-tenants-and-vault-enterprise/video/plan.md):
one recording, three versions, narration recorded separately.

## What we want

**The whole tutorial, on screen.** Two teams on one OpenShift GitOps, each
with its own AppProject that nobody wrote, deploying on their own and
refused outside their boundary.

| Version | Length | For | Where |
|---|---|---|---|
| **Demo, the main cut** | About 4 minutes | Platform leads deciding whether to try it | YouTube, the posts, sales |
| **Full walkthrough** | About 15 minutes, a chapter per step | The engineer trying it | YouTube, linked from the tutorial |
| **Short cut** | About 75 seconds | Feeds, mostly muted | LinkedIn, YouTube Shorts |

**They all leave the viewer knowing:** every tenant gets its own Argo CD
AppProject, built from the tenant and kept in step with it. Teams deploy on
their own, never through Argo CD's control plane. Argo CD refuses anything
outside a team's boundary. It runs on the free Basic edition.

**In:** steps 1 to 12. **Out:** the clean-up, which the close points to.

## How every chapter runs

The rhythm from the [first video plan](../../02-try-it-tenants-and-vault-enterprise/video/plan.md#how-every-chapter-runs):
card, why, do, wait (sped up and labeled), show it running, what happened,
"In production" caption where the tutorial has one, beat.

## On screen

The terminal and browser settings from the first video. One split screen,
in step 5: the terminal applies `tenants.yaml` on the left, and Argo CD's
AppProject list on the right shows `acme` and `globex` appear.

## The demo: the main cut

Narration is a draft, to be tightened into a read-aloud script once the
tutorial is validated.

| # | Part | From the recording | Narration (draft) | Time |
|---|---|---|---|---|
| 1 | **Cold open** | Argo CD's AppProject list with `acme` and `globex`; Anna's Application synced | "Two teams, one Argo CD. Each has its own AppProject, and nobody wrote either of them." | 0:15 |
| 2 | **The problem** | Title card; the hand-written AppProject from post 5 | "Argo CD's AppProject is how you keep teams apart. But someone writes every one by hand, and keeps it up to date as teams change. Multi-Tenant Operator does it from the team itself." | 0:25 |
| 3 | **Setup** | Steps 1 to 4 as one fast, labeled sequence: Multi-Tenant Operator, OpenShift GitOps, the two people, the extension | "Multi-Tenant Operator, free for two tenants. Red Hat OpenShift GitOps. Two people, Anna and Ben. And the Argo CD extension for Multi-Tenant Operator." | 0:45 |
| 4 | **Two tenants, two AppProjects** | Step 5: the split screen; acme's AppProject: its namespaces, its repository, its roles; the Multi-Tenant Operator console | "Create two tenants, and Argo CD has an AppProject for each: only that team's namespaces, only its repository, roles for its people. Never Argo CD's own namespace." | 0:45 |
| 5 | **Anna deploys** | Step 6: Anna signs in; applies her Application; Synced and Healthy | "Anna signs in with her OpenShift account. She creates an Application in her team's own namespace, and Argo CD deploys it. She never needed access to Argo CD itself." | 0:40 |
| 6 | **The boundary holds** | Step 7: five refusals; the error in the UI; `no`, `no` | "Another team's namespace, its repository, its AppProject: refused. Argo CD's own namespace: refused. Raising her own quota: refused." | 0:35 |
| 7 | **It keeps up** | Steps 8 to 12, fast: Carl joins and sees read-only, then leaves; `acme-prod` appears; the release freeze blocks a sync, then lifts; `acme-prod` removed; the hand edit refused | "Carl joins the team: one group change, and he can look but not touch. He leaves: one change, and he's out. A new namespace, a release freeze, a namespace retired: each one change on the tenant. Nobody edits an AppProject, and a hand edit is refused." | 0:50 |
| 8 | **Close** | End card: "Try it free", the tutorial link, the docs link, the Stakater logo | "Every step is in the tutorial, linked below. Try it free, on your own cluster." | 0:15 |

Total: about 4:30.

## The full walkthrough: chapters

| # | Chapter | Do | Show it running |
|---|---|---|---|
| 0 | Cold open | – | Argo CD's AppProject list; Anna's synced Application |
| 1 | The problem | – | Title card; the hand-written AppProject |
| 2 | Step 1: Install Multi-Tenant Operator | Software Catalog; the IntegrationConfig patch | Installed Operators "Succeeded"; Template Operator running |
| 3 | Step 2: Install OpenShift GitOps | Software Catalog; the `sourceNamespaces` patch | The Argo CD server and controller rolled out |
| 4 | Step 3: Add two people | The password file, the identity provider, the groups | The authentication operator settled |
| 5 | Step 4: Install the extension | `values.yaml`; the Helm install | Installed; nothing rendered yet |
| 6 | Step 5: Create two tenants | `tenants.yaml`; apply | **Split screen:** AppProjects appear; acme's AppProject; the Multi-Tenant Operator console |
| 7 | Step 6: Anna deploys | Anna signs in; her Application | Synced and Healthy; the resource tree |
| 8 | Step 7: Check the boundary | `refused.yaml`; the five messages; `auth can-i` | Five refusals; the error in the UI |
| 9 | Step 8: People join and leave | Carl added to the viewers group; his login; removed | Read-only for Carl; then Forbidden |
| 10 | Step 9: The team grows | The tenant patch; Anna's production Application | `acme-prod` among the destinations; `hello-prod` synced |
| 11 | Step 10: A release freeze | The sync-window annotation; then removed | The sync blocked in the UI; the window gone |
| 12 | Step 11: The team shrinks, a team leaves | Remove `acme-prod`; take globex out | The destination gone; globex's AppProject released, still there |
| 13 | Step 12: Hand edits are refused | The direct patch | The webhook's refusal |
| 14 | Close | – | "What you built" with its table; the end card |

## The short cut

About 75 seconds, cut from the demo: the cold open, the AppProjects appearing,
Anna's app syncing, the five refusals, Carl joining and leaving, and the end card. Captions burned
in.

## Steps to make it

The steps in the [first video plan](../../02-try-it-tenants-and-vault-enterprise/video/plan.md#steps-to-make-it),
with recording scripts written as described in its
[recording.md](../../02-try-it-tenants-and-vault-enterprise/video/recording.md).

## Open questions

- Who records the voiceover? Rasheed did the first video's.
