# Video guideline

The demo video **shows it working**. It's recorded from a real run of the
tutorial, so it never shows anything the tutorial doesn't. Each topic gets
two cuts from the same footage.

The rules in [CLAUDE.md](../../CLAUDE.md) apply to every piece. This page
adds what is specific to video.

## Three versions, one recording

Each topic's tutorial is recorded once, in full. Three versions are cut from
that footage, each with its own narration:

| Version | Length | For | Where |
|---|---|---|---|
| **Demo, the main cut** | 3 to 5 minutes | Anyone deciding whether it's worth trying | YouTube, the posts, sales; the link we share by default |
| **Full walkthrough** | The whole tutorial, installs included: usually 15 to 20 minutes, a chapter per step | The engineer who wants every step on screen before trying it | YouTube, linked from the tutorial |
| **Short cut** | 60 to 90 seconds | Feeds, mostly watched muted | LinkedIn, YouTube Shorts |

**The demo is the headline.** Most viewers only watch that one. Its setup is
one fast, labeled sequence of installs and their proofs; most of its time
goes to the moments where something visibly changes, such as a Vault
namespace appearing, a pod rolling, or a 403.

**Each version has its own script.** A shorter version needs its own
sentences, not the long one cut down.

The walkthrough follows the tutorial step by step, with a chapter per step,
installs included, so the viewer sees that it all installs and works. Every
chapter has the same rhythm: a card, why, do it, the wait (sped up and
labeled), show it running, what happened, then a one-second beat. The first
video's [plan](../../02-try-it-tenants-and-vault-enterprise/video/plan.md#how-every-chapter-runs)
is the worked example.

## Shape of the walkthrough

| Part | Length | What it shows |
|---|---|---|
| **Cold open** | 10 to 15 s | The end result first: two tenants, each with its own Vault namespace |
| **The problem** | 20 to 30 s | The gap the topic closes, in one sentence and one picture, often a diagram from the explainer |
| **Setup** | Several chapters | Installing each piece, one chapter per tutorial step, with its waits sped up and each install shown running. Narration says what each piece is for, not every flag. |
| **The steps** | Most of the video | One chapter per tutorial step that changes something the viewer can see |
| **The proof** | 1 to 2 min | Isolation, refusals, drift put back: the guardrails, live |
| **Close** | 15 to 20 s | What you saw, the tutorial link, and the free Basic edition |

## How it's recorded

- **From the validation run.** The same cluster and the same run as the
  screenshots, so everything matches.
- **Scripted, so it can be re-recorded.** The terminal scenes are scripts of
  commands rendered to video (for example with VHS), so there are no typos
  and the pacing is consistent. The browser scenes are recorded by a
  scripted browser. When a step changes, re-run the scripts.
- **1920×1080, at a size you can read.** A terminal font of at least 20
  points at that resolution, and browser zoom so text is legible on a
  phone.
- **Only what the tutorial shows.** No extra steps, no hidden fixes.
- **Browser scenes use the tutorial's highlights,** in the same style, drawn
  in the page as the scene reaches that element.
- **No secrets on screen.** Licenses, tokens and client secrets never appear;
  the commands read them into Secrets without printing them.
- **Long waits are cut or sped up,** with an on-screen note such as "sped up
  4×", so nobody thinks it's faster than it is.

## Sound and text

- **A human voiceover.** One of the authors, recorded after the edit, from a
  written script. No synthetic voice.
- **Captions on every version,** burned into the short cut, and as a
  subtitle file for the demo and the walkthrough. Most people watch the short cut muted.
- **On-screen labels** name each chapter as the tutorial names the step.
- **No background music under narration.** Quiet music on the cold open and
  close at most.

## Branding

- **Opening card:** the topic's title. **End card:** "Try it free" with the
  tutorial link and docs link, and the Stakater logo.
- Red Hat or HashiCorp marks only with their approval.
- "Multi-Tenant Operator" in full, in narration and on screen.

## Each video has

- A **shot list and narration script** in the tutorial's `video/` folder,
  scene by scene, before anything is recorded.
- The **recording scripts** in the same folder, so anyone can re-record.
- The **outputs:** the demo, the walkthrough, the short cut, their subtitle
  files, and thumbnails.

## Checklist

- [ ] Recorded from a validated run of the current tutorial.
- [ ] Every scene matches a tutorial step; nothing extra.
- [ ] No secret visible in any frame.
- [ ] Sped-up parts are labeled.
- [ ] Human voiceover, from each version's own script; captions on all three.
- [ ] Ends with the tutorial link and the free Basic edition.
- [ ] The recording scripts are committed, so the video can be re-made.
