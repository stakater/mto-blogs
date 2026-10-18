# Multi-Tenant Operator blog series

Blog posts about Multi-Tenant Operator, written with Red Hat and published on
Red Hat Developer first, then on the Stakater blog. Each post has a folder
holding the draft, its screenshots and the examples readers run.

Topics come in pairs: an **explainer** (why, for the people deciding) and a
**tutorial** (how, for the engineer who tries it). The explainer links to the
tutorial, and the tutorial ends at the point where a third tenant needs
Enterprise. [HANDOFF.md](HANDOFF.md) is what Raffaele validates and submits.

**This repository is private until post 1 is published.** It becomes public
on the day Red Hat publishes, so the examples are there when readers arrive.
Red Hat publishes first, and the Stakater blog follows, linking back to the
Red Hat post.

## Why we write these

The goal is to bring in Multi-Tenant Operator customers. The route there:

1. A platform engineer reads about a problem they have on OpenShift.
2. They install Multi-Tenant Operator from OperatorHub. The Basic edition is
   free and has no expiry, with a limit of two tenants.
3. They run the post's example with their own two tenants.
4. When the third team arrives, they need Enterprise.

So every post needs to be something a reader can try. If the example doesn't
run on a clean cluster with two tenants, the post isn't ready.

## Authors

- Ayesha Arshad (Stakater)
- Rasheed Amir (Stakater)
- Raffaele Spazzoli (Red Hat)

## Series

| # | Post | Outlet | Status |
|---|---|---|---|
| 1 | [One tenant, from OpenShift to Vault Enterprise](01-tenants-and-vault-enterprise/post.md) (explainer: why) | Red Hat Developer, then Stakater blog | Draft |
| 2 | [Hands-on: tenants on OpenShift, carried into Vault Enterprise](02-try-it-tenants-and-vault-enterprise/post.md) (tutorial: how) | Red Hat Developer, then Stakater blog | Draft, screenshots to capture |
| 3 | [One login, every tool: tenant members on OpenShift and Vault](03-one-login-for-tenant-members/post.md) (explainer: why) | Red Hat Developer, then Stakater blog | Draft |
| 4 | [Hands-on: one login for tenant members, on OpenShift and Vault](04-try-it-one-login-for-tenant-members/post.md) (tutorial: how) | Red Hat Developer, then Stakater blog | Draft, screenshots to capture |
| 5 | Tenants and Vault Community: a different isolation model | Red Hat Developer, then Stakater blog | Idea |
| – | Same story, HashiCorp angle: Vault namespaces at scale on OpenShift | IBM HashiCorp | Idea, their team writes it |

Posts 3 and 4 are separate from 1 and 2 on purpose. Posts 1 and 2 are about
apps: how a workload gets its secrets and how tenants stay apart. Posts 3
and 4 are about people signing in, which needs an identity provider with
groups and a change to the OpenShift login. Putting both in one tutorial
would double it and mix two questions. Each post says so where it ends.

## Writing rules

The full rules are in [CLAUDE.md](CLAUDE.md). The short version: this series
is go-to-market for Multi-Tenant Operator. We write as Stakater, Multi-Tenant
Operator is the hero of every post, and every post ends with the way to try
it and to buy it. The tone is factual, not pushy.

## Workflow

1. Draft in `NN-slug/post.md`, with diagrams in Mermaid in the same file.
2. Put screenshots in `NN-slug/screenshots/` and the files readers run in
   `NN-slug/examples/`. Capture screenshots during the validation run, so
   they match the steps exactly.
3. Review happens on a pull request, and all three authors approve.
4. Before submitting, run the examples end to end on a clean OpenShift
   cluster.
5. Submit in the format Red Hat Developer asks for.
6. After Red Hat publishes, post on the Stakater blog with a canonical link
   to the Red Hat post.
