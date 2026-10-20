# Tutorial guideline

The tutorial answers **how do I build it**, for the engineer trying it on
their own cluster. It's the source of truth for the topic: the video is
recorded from it, and the explainer's claims match what it proves.
Examples: [post 2](../../02-try-it-tenants-and-vault-enterprise/post.md),
[post 4](../../04-try-it-one-login-for-tenant-members/post.md).

The rules in [CLAUDE.md](../../CLAUDE.md) apply to every piece. This page
adds what is specific to a tutorial.

## Shape

| Section | What it does |
|---|---|
| **Opening** | One line linking the explainer, then "By the end you'll have", as outcomes, not steps. Then how long it takes. |
| **Why this is separate** | Only when it follows another tutorial |
| **Before you start** | What the reader needs, the example files, and a table: component, version, where it comes from, its job |
| **Steps** | Numbered, one outcome each (see below) |
| **Optional sections** | Extras that not every reader needs, clearly marked |
| **Clean up** | How to undo everything, in the order that works |
| **What you built** | The outcome in a few sentences; what was left out on purpose; where Enterprise comes in |
| **About Multi-Tenant Operator** | The standard closing section |
| **Byline** | The authors and their companies |

## Each step

1. **A heading that names the outcome:** "Create two tenants", not
   "Apply tenants.yaml".
2. **One or two sentences on why,** before the command.
3. **The commands,** copy-pasteable as they are. Variables are set in an
   earlier step, and placeholders are obvious (`<your value>`).
4. **The expected output,** as text, so the reader knows it worked.
5. **A screenshot,** only for something seen in a UI.
6. **"What just happened"** for any step where the result isn't obvious:
   what each component did.
7. **"In production"** wherever the tutorial takes a learning shortcut, such
   as dev-mode Vault, a root login, or a default password.

## Rules

- **It runs on a clean cluster, exactly as written.** Validate it end to end
  before review, and note the OpenShift version it was validated on. Every
  fix found in the run goes into the text.
- **It fits the free Basic edition.** Two tenants, no license needed for
  Multi-Tenant Operator. Say what the reader brings, such as a Vault
  Enterprise license.
- **Secrets never appear in the files.** They are generated or read into
  Secrets by commands, never printed, except demo passwords the reader
  needs to sign in.
- **Learning shortcuts are labeled** as learning-only, with the production
  alternative next to them.
- **Example files live in `examples/`,** with a README listing which step
  uses each.
- **Command output stays as text.** Screenshots are for UIs only.
- **Platform tools get privileged namespaces in the tutorial,** to stay
  within two tenants. Say that production gives them a tenant of their own.

## Screenshots

- Captured during the validation run, on the same cluster, at 1440×900.
- Named `NN-what-it-shows.png`, and listed in `screenshots/README.md` with
  the step and what it shows.
- Each has alt text that says what's in it.
- Until captured, a slot is a visible block in the post:

  ```markdown
  > 📷 **Screenshot to capture:** <what it shows>
  > **Highlight:** <what to mark>
  ```

- Best value: the screens that show Multi-Tenant Operator's work, such as a
  tenant label, the Multi-Tenant Operator console, or a policy nobody wrote.
- When a step uses a Stakater product's own console (Multi-Tenant Operator,
  Reloader), its screenshot is required, not optional.

### Highlights

Most screenshots point at one or two things on a busy screen. The
highlight tells the reader where to look.

- **Every screenshot names its highlight,** in the slot's `Highlight:` line
  and in the Highlight column of `screenshots/README.md`. If nothing needs
  marking, write "None".
- **Name the element by what's on screen,** such as "the row `acme`" or "the
  label `stakater.com/tenant=acme`", so the capture can find it.
- **The capture draws it, in the page,** before taking the screenshot: an
  outline around the element, 3 px, Stakater orange `#EA7845`, 4 px from the
  element, with rounded corners. Nothing is drawn afterwards in an image
  editor, so a re-capture gives the same result.
- **At most three highlights per screenshot,** and no arrows, labels or
  blurring. If a screen needs more, it's two screenshots.
- **The highlighted element is in view,** not scrolled off or hidden behind a
  menu.
- **When the highlight changes, re-capture.** Mark the row "Re-capture" in
  `screenshots/README.md` until it's done.

## Checklist

- [ ] Validated end to end on a clean cluster; the version is in the post.
- [ ] Every step has its command and its expected output.
- [ ] "What just happened" wherever the result isn't obvious.
- [ ] Every learning shortcut has its "In production" note.
- [ ] Every screenshot slot is filled, listed in `screenshots/README.md`,
  and captured with its highlight.
- [ ] Clean up returns the cluster to where the tutorial started.
- [ ] Links back to the explainer; ends with "About Multi-Tenant Operator".
