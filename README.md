# Multi-Tenant Operator blog series

Blog posts about Multi-Tenant Operator, written with Red Hat and published on
Red Hat Developer first, then on the Stakater blog. Each post has a folder
holding the draft, its screenshots and the examples readers run.

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

- Rasheed Amir (Stakater)
- Aisha (Stakater)
- Rafael (Red Hat)

## Series

| # | Post | Outlet | Status |
|---|---|---|---|
| 1 | [Tenants on OpenShift, carried into Vault Enterprise](01-tenants-and-vault-enterprise/post.md) | Red Hat Developer, then Stakater blog | Draft |
| 2 | Tenants and Vault Community: a different isolation model | Red Hat Developer, then Stakater blog | Idea |
| – | Same story, HashiCorp angle: Vault namespaces at scale on OpenShift | IBM HashiCorp | Idea, their team writes it |

## Writing rules

- **Problem first, product second.** Red Hat editors reject pitches. The
  post describes an OpenShift problem and shows the tenant solving it.
- **Name "Multi-Tenant Operator" in full, never "MTO".** Mention it by name
  three to five times in a post.
- **"Tenant" is the team boundary.** Always write "Vault namespace" in full
  so readers don't confuse it with a Kubernetes namespace.
- **Claim only what is tested.** The source of truth is each extension's
  repository: its README, and the e2e suite.
- **No prices, no comparisons with competitors, no "replace".** Red Hat and
  HashiCorp products come across positively.
- **Use one voice.** The lead author writes the draft. Co-authors add their
  sections and review through pull requests.

## Workflow

1. Draft in `NN-slug/post.md`, with diagrams in Mermaid in the same file.
2. Put screenshots in `NN-slug/screenshots/` and the files readers run in
   `NN-slug/examples/`.
3. Review happens on a pull request, and all three authors approve.
4. Before submitting, run the examples end to end on a clean OpenShift
   cluster.
5. Submit in the format Red Hat Developer asks for.
6. After Red Hat publishes, post on the Stakater blog with a canonical link
   to the Red Hat post.
