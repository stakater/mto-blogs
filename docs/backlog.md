# Backlog

Topics we've committed to write about, or want to, but haven't started. A
topic moves from here to the [content strategy's topic table](content-strategy.md#topics)
when its writing starts. Add new ideas at the bottom of "Topics"; keep each
with why it matters, what's open, and what must happen before writing.

## Topics

### Tenants across several clusters

> **Note (foundation drafted):** the *core* model — the same tenant on every
> cluster, from one definition with per-cluster overlays, distributed by
> OpenShift GitOps and by Advanced Cluster Management — is drafted as topic 4,
> posts [7](../07-tenants-across-clusters/post.md) and
> [8](../08-try-it-tenants-across-clusters/post.md), and is being reworked to
> its [story](../07-tenants-across-clusters/story.md). It needs no new
> extension, but the story lists facts engineering must confirm before the
> posts claim them, and it hasn't run on clusters yet. **This entry is the
> remaining, gated part:** carrying a team's slice of a *tool* (Vault, and
> later Argo CD and Grafana) across clusters, which still needs the open
> questions below answered and the extensions tested on two clusters.

**Why:** most platforms run more than one OpenShift cluster, and a common
setup is **one Vault shared by several clusters**. Others run **one Vault per
environment**, such as one for production and one for the rest. Readers will
ask how tenants work in both. Raffaele raised it in his review of post 1, and
post 1 now says it's coming in a later article.

**Scenarios to cover:**

| Scenario | Shape |
|---|---|
| One Vault, several clusters | Every cluster runs Multi-Tenant Operator and the extension, all writing to the same Vault |
| One Vault per environment | Each environment's clusters share their own Vault: production with one, development and staging with another |
| A team on several clusters | The same tenant exists on more than one cluster: does it get one Vault namespace, or one per cluster? |

**Open questions, for engineering to answer first:**

- **Where each cluster's tenants live in Vault.** One parent Vault namespace
  per cluster (the extension's `vco.namespace`, such as `cluster-a/acme`), or
  one shared Vault namespace per tenant across clusters?
- **Name collisions.** Two clusters with a tenant called `acme` would write
  the same Vault namespace and the same policy names. Is that the intended
  "one team, one Vault namespace", or a conflict?
- **Workload login.** Each cluster needs its own Kubernetes auth method,
  because each has its own API server and token reviewer. How are they named
  and kept apart within a tenant's Vault namespace?
- **Who owns shared objects.** If two clusters' Vault Config Operators manage
  the same objects, their drift correction would fight. Which cluster owns
  what?
- **Sharing between tenants** on different clusters: does the shared Vault
  namespace still work?
- **People's sign-in:** one OIDC login per tenant regardless of cluster, or
  one per cluster?

**Before writing:** engineering confirms the design, the extension supports
it, and its tests cover at least two clusters against one Vault. Then the
topic follows the usual pattern: an explainer, a tutorial on two clusters,
and a video.

**Status:** idea. Promised in post 1.

### Tenants and Vault Community: a different isolation model

**Why:** Vault Community has no namespaces, so tenancy works differently: a
mount, policies and login roles per tenant, in one shared namespace. Many
readers run Community. The `mto-sales` deck `/vault-community` and the
`mto-extension-vault-community` repository cover the design.

**Before writing:** check the Community extension is built and tested to
the same level as the Enterprise one.

**Status:** idea.

### The same tenant in more tools: Grafana and others

**Why:** the series' larger point is that one tenant reaches every tool. The
Grafana extension runs today; others follow.

**Before writing:** pick the next tool by what's built and tested, using
`mto-sales` `docs/extensions-backlog.md`.

**Status:** idea.

### Ansible Automation Platform and Multi-Tenant Operator: better together

**Why:** customers, and sometimes Red Hat's own field, see Ansible Automation
Platform (AAP) and Multi-Tenant Operator as competing "multi-tenant
platforms". They work at different layers. AAP's multi-tenancy is *who may
automate what*: organizations, teams, credentials. Multi-Tenant Operator's is
*what a team owns on the platform*: namespaces, quotas, access, costs, and
its slice of every tool. AAP runs a workflow once when triggered;
Multi-Tenant Operator reconciles continuously. Together: **AAP is the front
door, Multi-Tenant Operator is the floor.**

**The story:**

- **Front door:** a request in ServiceNow goes to an AAP workflow. AAP does
  the work outside the cluster (directory groups, DNS, firewall, CMDB) and
  opens a pull request that adds or changes the `Tenant`.
- **Floor:** once merged, Multi-Tenant Operator creates the team's
  namespaces, quotas and access, and its slice of Vault, Argo CD and
  Grafana, and keeps them right from then on.
- **Back to the door:** Event-Driven Ansible reacts when the tenant is ready,
  and AAP closes the ticket and updates the CMDB.
- **Possible extension:** each tenant gets its own AAP organization and team,
  so teams run their own automation within their own boundary. An idea, not
  built.

**Pieces:** a deck in `mto-sales` (`/aap`), then an explainer and a tutorial
here: an AAP workflow that opens the `Tenant` pull request, and
Event-Driven Ansible reacting when the tenant is ready.

**Before writing:**

- Feedback on the deck from an AAP expert who knows Multi-Tenant Operator.
- Check with Raffaele how Red Hat's field frames AAP's multi-tenancy, and
  whether Red Hat would co-author a "better together" article.
- For the tutorial: the AAP version, the collections it uses
  (`kubernetes.core`, `servicenow.itsm`), and a run end to end.

**Status:** deck in progress.

## Open decisions

None open. Decided:

- **"Extension", not "integration"** (2026-10-25). The posts say "the Vault
  Enterprise extension for Multi-Tenant Operator", and keep doing so; see
  [CLAUDE.md](../CLAUDE.md).
