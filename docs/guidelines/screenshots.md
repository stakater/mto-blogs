# Screenshot guideline

How every screenshot in the series is planned, taken and kept. Tutorials
use it most, explainers reuse tutorial screenshots, and the video's browser
scenes follow the same rules. Start from the
[shot list template](../templates/screenshots-README.md).

## The flow

1. **Plan it in the draft.** Each screenshot is a slot in the post, and a row
   in the topic's `screenshots/README.md`, before anything is captured.
2. **Capture it in the validation run,** on the same cluster, while running
   the tutorial exactly as written.
3. **Replace the slot with the image,** and mark the row "Captured".

## What earns a screenshot

- **Only screens in a UI.** Commands and their output stay as text, so
  readers can copy them.
- **Screens that show the product's work:** a tenant label, the Multi-Tenant
  Operator console, a policy nobody wrote, a restart with its cause.
- **Required:** every step that uses a Stakater product's own console, such
  as Multi-Tenant Operator or Reloader, has a screenshot of that console.
- **One idea per screenshot.** If a screen needs more than three highlights,
  it's two screenshots.

## The slot in the post

Until captured, a slot is a visible block, never an HTML comment:

```markdown
> 📷 **Screenshot to capture** (`NN-what-it-shows.png`): <the tool, the page, and what's on it>.
> **Highlight:** <the elements to mark, named as they appear on screen>.
```

The file name ties the slot to its row in the shot list, so the capture
knows which image replaces which slot. The "what's on it" text becomes the
image's alt text.

Once captured, the whole block becomes an image, with alt text that says
what's in it:

```markdown
![<the tool and page>: <what it shows>](screenshots/NN-what-it-shows.png)
```

## The row in the shot list

Each topic's `screenshots/README.md` lists every screenshot, captured or
not. It's the spec the capture follows:

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `NN-what-it-shows.png` | The tutorial step | The tool, the page, what's on it | What to mark, or "None" | To capture, Captured, or Re-capture |

## Naming

- `NN-what-it-shows.png`, numbered in the order the reader meets them.
- A screenshot added between two others takes a letter: `08a`, `08b`.
- Lowercase, hyphens, no spaces. The name says what's on screen, not the
  step: `07-project-tenant-label.png`, not `07-step-7.png`.

## Taking it

| Setting | Value |
|---|---|
| Viewport | 1440×900 |
| Pixel density | 2× (the image is 2880×1800, sharp on any screen) |
| Theme | Light |
| Zoom | 100% |
| Language | English |
| Browser frame | None: the page only, no address bar or tabs |

- **The real state from the tutorial.** No staged data, nothing the reader
  won't see when they follow the steps.
- **Nothing secret on screen:** no tokens, licenses, passwords or client
  secrets. Demo passwords the tutorial prints are fine.
- **No distractions:** close notifications, banners and tours before
  capturing. If a banner can't be closed, say so in the row.
- **The whole viewport,** not cropped afterwards. If one element on a busy
  page matters, highlight it rather than cropping.
- **Wait until the page has settled:** data loaded, spinners gone, the
  element to highlight visible.

## Highlights

The highlight tells the reader where to look.

- **Every screenshot names its highlight,** in the slot and in the row. If
  nothing needs marking, write "None".
- **Name the element as it appears on screen,** such as "the row `acme`" or
  "the label `stakater.com/tenant=acme`", so the capture can find it.
- **The capture draws it in the page,** before taking the screenshot: an
  outline around the element, 3 px, Stakater orange `#EA7845`, 4 px from the
  element, with rounded corners. Nothing is drawn afterwards in an image
  editor, so every re-capture comes out the same.
- **At most three highlights,** and no arrows or blurring.
- **A label only for a comparison.** When two screenshots differ by one
  thing, such as an editor's and a viewer's view, each may carry one short
  label next to its highlight, saying the difference in a few words:
  "Editor: can create a new version". White bold text on a Stakater orange
  pill, on the same line as the highlight, and drawn in the page like the
  highlight. Never on a screenshot that isn't part of a comparison.
- **The highlighted element is in view,** scrolled to if needed, not hidden
  behind a menu.

The reference implementation, for a Playwright capture. Use it as it is, so
every highlight looks the same:

```js
// Outline one element in Stakater orange, in the page, before capturing.
async function highlight(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    el.style.outline = '3px solid #EA7845';
    el.style.outlineOffset = '4px';
    el.style.borderRadius = '6px';
  });
}

// Example: the rows acme and globex on the Tenants page.
await highlight(page.getByRole('row', { name: /acme/ }));
await highlight(page.getByRole('row', { name: /globex/ }));
await page.screenshot({ path: 'screenshots/08a-mto-console-tenants.png' });
```

## Re-capturing

- **When a step, a highlight or the UI changes,** mark the row "Re-capture"
  and take it again in the next validation run.
- **When many screenshots need re-taking,** put the slots back in the post
  and remove the old images, so nobody mistakes an old image for a finished
  one.
- **All of a topic's screenshots come from one run,** so they show the same
  cluster, the same versions and the same names.
- **The row records the version,** when it matters: "OpenShift 4.22".

## Checklist

- [ ] Every screenshot has a slot in the post and a row in the shot list.
- [ ] Every row names its highlight, or "None".
- [ ] Captured at 1440×900, 2×, light theme, no browser frame.
- [ ] Highlights drawn in the page, in the standard style, at most three.
- [ ] Nothing secret on screen.
- [ ] Every image has alt text that says what's in it.
- [ ] Every row is "Captured".
