# Video guideline

The demo video **shows it working**. It's recorded from a real run of the
tutorial, so it never shows anything the tutorial doesn't. Each topic gets
two cuts from the same footage.

The rules in [CLAUDE.md](../../CLAUDE.md) apply to every piece. This page
adds what is specific to video.

## Two cuts

| Cut | Length | For | Where |
|---|---|---|---|
| **Walkthrough** | 8 to 12 minutes | The engineer who wants to see every step before trying it | YouTube, embedded in the tutorial where allowed, sales demos |
| **Short cut** | 60 to 90 seconds | Everyone else: the moments that land | LinkedIn, YouTube Shorts, the explainer |

The walkthrough follows the tutorial step by step, with a chapter per step.
The short cut keeps only the moments where something visibly changes, such
as a Vault namespace appearing, a pod rolling, or a 403.

## Shape of the walkthrough

| Part | Length | What it shows |
|---|---|---|
| **Cold open** | 10 to 15 s | The end result first: two tenants, each with its own Vault namespace |
| **The problem** | 20 to 30 s | The gap the topic closes, in one sentence and one picture, often a diagram from the explainer |
| **Setup** | 1 to 2 min | Installing the pieces, sped up. Narration says what each piece is for, not every flag. |
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
- **Captions on every cut,** burned into the short cut, and as a subtitle
  file for the walkthrough. Most people watch the short cut muted.
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
- The **outputs:** the walkthrough, the short cut, the subtitle file, and a
  thumbnail.

## Checklist

- [ ] Recorded from a validated run of the current tutorial.
- [ ] Every scene matches a tutorial step; nothing extra.
- [ ] No secret visible in any frame.
- [ ] Sped-up parts are labeled.
- [ ] Human voiceover; captions on both cuts.
- [ ] Ends with the tutorial link and the free Basic edition.
- [ ] The recording scripts are committed, so the video can be re-made.
