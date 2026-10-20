# Multi-Tenant Operator blog series — rules

## Why this repository exists

**This series is co-marketing between Stakater and Red Hat,** with IBM
HashiCorp possibly telling its own version of the story. Each side has a
goal, and every post has to serve both:

- **Stakater:** more platform teams know Multi-Tenant Operator, try it, and
  adopt it.
- **Red Hat:** a strong, practical story for OpenShift customers, with Red
  Hat products shown at their best.

Multi-Tenant Operator is Stakater's product, and the posts are open about
it. The reader should always know what it is, what it did in the story, and
how to get it.

The plan for the whole series is in [docs/content-strategy.md](docs/content-strategy.md),
and each kind of piece has a guideline in [docs/guidelines/](docs/guidelines/):
explainer, tutorial, screenshots, video. Follow the guideline for the piece
you're working on, and tick its checklist before review.

**Start every new piece from its template** in [docs/templates/](docs/templates/):

| New piece | Copy | To |
|---|---|---|
| Explainer | `explainer-post.md` | `NN-<topic>/post.md` |
| Tutorial | `tutorial-post.md` | `NN-try-it-<topic>/post.md` |
| Shot list | `screenshots-README.md` | `NN-try-it-<topic>/screenshots/README.md` |
| Video plan | `video-plan.md` | `NN-try-it-<topic>/video/plan.md` |

Plan every screenshot as a slot in the post and a row in the shot list, with
its highlight, before anything is captured.

## What every post must do

- **Make Multi-Tenant Operator central to the story.** The reader should
  finish the post knowing what Multi-Tenant Operator is, what it did for
  them, and that it comes from Stakater. Never let it read as an incidental
  or optional component.
- **Lead from the reader's problem.** Show the problem on OpenShift first,
  then how Multi-Tenant Operator and the other pieces solve it. Keep the
  tone factual and confident, never pushy.
- **Give a clear way in.** Every post ends with the "About Multi-Tenant
  Operator" section:
  - install it from OperatorHub, with the free Basic edition (two tenants,
    no expiry)
  - the docs at https://docs.stakater.com/mto/
  - Enterprise for more than two tenants, via sales@stakater.com
- **Tutorials fit the free edition.** Two tenants is enough to prove the
  model, so anyone can follow a tutorial without a license. The tutorial
  says where Enterprise comes in.

## Facts to get right

- Multi-Tenant Operator is a **commercial product, not open source.** It is a
  Red Hat certified operator with a free **Basic** edition: up to two
  tenants, no expiry, no capability withheld. Never group it with the open
  source projects.
- Open source in the stack: Vault Config Operator (Red Hat Community of
  Practice; Stakater contributed the `targetNamespace` support in v1.0.3),
  External Secrets Operator, Reloader.
- Template Operator ships with Multi-Tenant Operator (1.10.0+, Managed mode).
- **Claim only what is tested.** The source of truth is each extension's
  repository: its README and its end-to-end suite. Say plainly what isn't
  supported yet. For Vault Enterprise, PKI and transit are on the roadmap,
  PKI first. Never give a delivery date unless engineering has one.
- **No prices** in posts. Name the editions, never the figures.

## Style

- "Multi-Tenant Operator" in full, never "MTO".
- "Tenant" is the team boundary. Always write "Vault namespace" in full, so
  it is never confused with a Kubernetes namespace.
- No comparisons with competitors, and no "replace". Red Hat and HashiCorp
  products come across positively.
- Leave out insider backstory: version numbers, field names, pull requests,
  who fixed what. Include a detail only if the reader needs it to decide or
  to act. Tutorials state required versions as prerequisites, nothing more.
- One voice per post. Placeholders must be visible text (`[role]`), never
  HTML comments, which render as nothing.
- Topics come in pairs: an explainer (why, for the people deciding) and a
  tutorial (how, for the engineer who tries it). Each says why it is
  separate from the other.
