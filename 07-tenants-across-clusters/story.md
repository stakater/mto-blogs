# Topic 4: tenancy across a fleet. Story and outline

This is stage 1 of [how a topic is made](../docs/content-strategy.md#how-a-topic-is-made):
the story, for the three authors to agree before the posts are rewritten. It
also holds the outline for both posts, so we agree the argument before the
prose.

**Status:** proposal. Not agreed yet. The current drafts of
[post 7](post.md) and [post 8](../08-try-it-tenants-across-clusters/post.md)
were written before this and don't follow it. They get rewritten once the
story is agreed and the facts below are confirmed.

## The story

A platform team runs a fleet of OpenShift clusters: a hub with Red Hat
Advanced Cluster Management, and spoke clusters for development, production
and each region. The same application teams work across them. The hub
already tells the team which clusters exist and can send configuration to
any of them, yet tenancy is still done cluster by cluster: every team is a
pile of namespaces, role bindings, quotas and network policies, copied to
each cluster and kept in step by hand or by templates nobody enjoys
reading. With Multi-Tenant Operator on every spoke, the team is one small
`Tenant` in Git. The hub decides which clusters a team is on, and
Multi-Tenant Operator on each cluster turns that definition into the team's
namespaces, access, budget and guardrails, and keeps them right, including
for things that appear later. At the end the reader has two teams on two
clusters from one definition each, a new cluster that gets its teams from
one label, and a boundary that holds on every cluster even when the hub is
out of reach.

## The argument

The first draft argued that central definitions beat doing it by hand.
That's true, but OpenShift GitOps wins that argument without Multi-Tenant
Operator, so the post reads as if the operator were optional. The stronger
argument is a split of jobs:

> **The hub decides where a team exists. Multi-Tenant Operator decides what
> a team is there.**

It rests on four points. Each one must be shown in the tutorial, not only
claimed in the explainer.

| # | Point | How the reader sees it |
|---|---|---|
| 1 | **The hub ships objects, and a team isn't a fixed set of objects.** In plain manifests one team is a namespace, role bindings, a quota and network policies, for every namespace, on every cluster. As a tenant it's one object of about twenty lines. | The explainer counts both, side by side |
| 2 | **Some of tenancy needs a controller on the cluster.** One budget across all of a team's namespaces. A team creating its own namespace inside its boundary, with no pull request to the central repository. Guardrails that reach namespaces created later. The team's slice of Vault and Argo CD on that cluster, from the earlier articles. | The tutorial has a tenant owner create a namespace on a spoke, and shows it land inside the tenant |
| 3 | **Placement is the fleet's job, and it's one label.** Which clusters a team is on is a selector on the hub. A new cluster joins, gets its label, and its teams arrive. | The tutorial labels the second spoke and watches both teams appear |
| 4 | **Two loops keep it right.** Something inside a tenant changes on a spoke: the operator puts it back, locally. The `Tenant` itself is changed or deleted: the hub puts it back. A spoke cut off from the hub still holds its boundary. | The tutorial breaks it both ways |

What we say plainly isn't there: Multi-Tenant Operator has no view across
the fleet, each installation governs its own cluster, and a team's slice of
a tool is per cluster today. Sharing one Vault between clusters stays in the
[backlog](../docs/backlog.md#tenants-across-several-clusters) until
engineering has confirmed and tested it.

## To confirm before writing

These decide whether points 2 and 4 can be claimed. The outline below
assumes yes to each; if one is no, that part comes out.

| # | Question | Who | Why it matters |
|---|---|---|---|
| 1 | Is a tenant's `Quota` one budget across all its namespaces, and is that covered by tests? | Engineering | Point 2's first claim |
| 2 | When the `Tenant` is managed from Git, can a tenant owner still create a namespace on the spoke, and does it survive the next sync from the hub? | Engineering | Point 2's strongest claim, and the riskiest: a sync could revert it |
| 3 | Is the Basic edition two tenants per cluster, so two tenants on each of two spokes needs no license? | Rasheed | The tutorial must fit the free edition |
| 4 | Which distribution path does Red Hat want shown: Advanced Cluster Management placement with OpenShift GitOps delivering, or Advanced Cluster Management policies? | Raffaele | The tutorial shows one path, and it should be the one Red Hat recommends |
| 5 | Can the hub act as one of the spokes, so the tutorial needs two clusters and not three? | Validation run | Fewer readers can bring three clusters |

## Explainer outline (post 7)

Follows the [explainer guideline](../docs/guidelines/explainer.md), 1,500 to
2,000 words.

**Title options**

- Tenancy for a fleet: one team, every OpenShift cluster
- The hub knows your clusters. What knows your teams?
- One tenant, on every cluster

| Section | What goes in it |
|---|---|
| **Opening** | The scene: a hub, a dozen spokes, forty teams. The hub can reach every cluster, and tenancy is still per cluster. Then the approach in one paragraph: the hub places the team, Multi-Tenant Operator makes it real on each cluster. Names the product, Stakater, commercial with a free Basic edition. |
| **In this article** | Five bullets, matching the sections below |
| **Who it's for** | Platform engineers and architects who run a hub and spokes, and the people who own the fleet. Knows OpenShift RBAC and has met Advanced Cluster Management or OpenShift GitOps. Multi-Tenant Operator introduced from the ground up. |
| **Want to build it?** | The tutorial link, and how the two differ |
| **Why this is separate** | Earlier articles carried one team into one more tool on one cluster. This one is the cluster boundary. |
| **What a team costs across a fleet** | One team as the hub sends it today: the real manifests, counted. Times the team's namespaces, times the clusters, times forty teams. Then the upkeep: a new namespace, a new member, a new cluster. Then how it breaks: drift between clusters, a team waiting on the platform team for every namespace, production differing in ways nobody wrote down. |
| **The idea: the hub places, the tenant defines** | The `Tenant` YAML. The base and the per-environment overlay. The split of jobs in one sentence. |
| **By hand vs. with Multi-Tenant Operator** | A table with three columns, so credit goes where it's due: the manual step, what the hub does, what Multi-Tenant Operator does. No row gives the operator credit for distribution. |
| **How it works** | Components table: Git, the hub, each spoke. One flowchart showing both loops: Git to hub to spoke, and the operator's own loop inside each spoke. |
| **What people see** | Two screenshots reused from the tutorial: the Multi-Tenant Operator console on a dev spoke and on a prod spoke, the same team with a different budget. One of the hub showing where the team is placed. |
| **Guardrails for the fleet owner** | Their first question: what can the hub do on my clusters? The honest answer on the access the hub holds on each spoke, and how to narrow it. Who may merge to the base. What an overlay may change. What happens when the hub is unreachable. What the tests prove. |
| **Try it** | The free Basic edition, what the reader brings (the clusters, Advanced Cluster Management), the tutorial link. Not supported yet: a fleet-wide view, and sharing a tool's slice across clusters. No dates. |
| **What's next** | Where the series goes, without naming the next topic |
| **About Multi-Tenant Operator** | The standard section |
| **Byline** | Ayesha Arshad, Rasheed Amir, Raffaele Spazzoli |

## Tutorial outline (post 8)

Follows the [tutorial guideline](../docs/guidelines/tutorial.md). One
distribution path, pending question 4. Two tenants, `acme` and `globex`, so
the boundary between teams is visible and it fits the Basic edition.

**By the end you'll have**

- two teams on two clusters, each from one definition in Git
- the same team on both clusters, with a larger budget in production
- a cluster that got its teams from one label
- a team that created its own namespace without asking the platform team
- proof the boundary holds on every cluster, and is put back when broken

**Before you start:** a hub and two spokes with `cluster-admin`; a fork of
this repository, because the reader commits changes; the component table
with versions. A tenant owner is shown by impersonation
(`--as`, `--as-group`), labeled as a learning shortcut, so no identity
provider is needed. The "In production" note points to the sign-in articles.

| Step | Outcome | Proves | Screenshot |
|---|---|---|---|
| 1 | The hub is ready: Advanced Cluster Management and OpenShift GitOps installed and connected | | |
| 2 | Both spokes have joined the hub; only the dev spoke is labeled for tenancy | | The hub's cluster list, with the labels |
| 3 | Every labeled spoke gets Multi-Tenant Operator, installed from the hub | The operator is part of what the fleet delivers | |
| 4 | Two teams defined once, in the reader's fork: a base and an overlay per environment. `make test` passes without a cluster | | |
| 5 | Both teams appear on the dev spoke | Point 1 | Multi-Tenant Operator console on dev, Tenants page (required) |
| 6 | The prod spoke gets its label, and both teams arrive with the production budget | Point 3 | Multi-Tenant Operator console on prod (required); the hub showing both placements |
| 7 | One commit adds a member group; both clusters follow | One definition | |
| 8 | A tenant owner creates a namespace on the dev spoke; it lands inside the tenant and its budget, and survives the next sync | Point 2 | Multi-Tenant Operator console, Namespaces page |
| 9 | `acme`'s owner can't touch `globex`, on either cluster | The boundary | |
| 10 | Break it twice: delete a role binding on a spoke, then delete a `Tenant`. Each comes back, from a different loop | Point 4 | |
| | Clean up, in the order that works | | |
| | What you built; what was left out on purpose; where Enterprise comes in | | |

**What carries over from the current draft:** the base and overlay examples,
`make test`, the "what stays local" section, and the diagram as a starting
point.

**What goes:** the second distribution mechanism as a full set of steps
(it becomes one paragraph and a link), and the policy that copied the
overlay by hand.

**Video:** none planned until the tutorial has been validated.

## Next

1. The three authors agree the story, or change it.
2. Questions 1 to 4 are answered.
3. Post 7 is rewritten from the [explainer template](../docs/templates/explainer-post.md),
   then post 8 from the [tutorial template](../docs/templates/tutorial-post.md),
   with its shot list.
4. The validation run, on real clusters. Nothing in the explainer stays that
   the run didn't prove.
