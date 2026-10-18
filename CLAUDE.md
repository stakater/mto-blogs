# Multi-Tenant Operator blog series — rules

## Why this repository exists

**This series is go-to-market for Multi-Tenant Operator.** Its purpose is to
make more people aware of Multi-Tenant Operator and to win customers for it.
Every post should raise the chance that a reader installs it, and later buys
it.

We write as **Stakater**: Multi-Tenant Operator is our product. Red Hat
(Rafael) co-authors and publishes, and IBM HashiCorp may tell its own
version, but the series exists to sell Multi-Tenant Operator, and the posts
must make that clear.

## What every post must do

- **Make Multi-Tenant Operator the hero.** The reader should finish the post
  knowing what Multi-Tenant Operator is, what it did for them in the story,
  and that it comes from Stakater. Never let it read as an incidental or
  optional component.
- **Lead from the reader's problem, and land on Multi-Tenant Operator as the
  answer.** Keep the tone factual and confident, not pushy. That keeps Red
  Hat's editors on side and is more persuasive.
- **Give a clear way in.** Every post ends with the path to Multi-Tenant
  Operator:
  - install it from OperatorHub, with the free Basic edition (two tenants,
    no expiry)
  - the docs at https://docs.stakater.com/mto/
  - Enterprise when a third tenant arrives, via sales@stakater.com
  Include the "About Multi-Tenant Operator" closing section.
- **Tutorials stop at the free edition's limit on purpose.** Two tenants is
  enough to prove the model. The third tenant is where Enterprise begins, and
  the tutorial says so.

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
  supported yet (for Vault Enterprise: transit, PKI, cert-manager).
- **No prices** in posts. Name the editions, never the figures.

## Style

- "Multi-Tenant Operator" in full, never "MTO".
- "Tenant" is the team boundary. Always write "Vault namespace" in full, so
  it is never confused with a Kubernetes namespace.
- No comparisons with competitors, and no "replace". Red Hat and HashiCorp
  products come across positively.
- One voice per post. Placeholders must be visible text (`[role]`), never
  HTML comments, which render as nothing.
- Topics come in pairs: an explainer (why, for the people deciding) and a
  tutorial (how, for the engineer who tries it). Each says why it is
  separate from the other.
