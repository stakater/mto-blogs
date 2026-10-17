# One tenant, from OpenShift to Vault Enterprise

<!--
Outlet: Red Hat Developer (then the Stakater blog, canonical link back).
Authors: Rasheed Amir (Stakater), Aisha (Stakater), Rafael (Red Hat).
Target: about 1,600 words. Reader: platform engineers running OpenShift and Vault.
Title options:
  - One tenant, from OpenShift to Vault Enterprise
  - Give every team its own Vault namespace on OpenShift, automatically
  - Multi-tenancy on OpenShift that reaches all the way into Vault
-->

Most OpenShift platforms reach the same point. The cluster is shared, dozens
of teams deploy to it, and every one of them needs secrets. Vault Enterprise
holds those secrets. But Vault doesn't know who your teams are, and OpenShift
doesn't tell it.

So the platform team fills the gap by hand. A new team arrives, someone opens
a ticket, and an engineer writes the Vault policies, the auth roles and the
paths for that team. The team adds a project, and the ticket comes back. Over
time, the configuration in Vault drifts away from the teams on the cluster,
and nobody can say for sure who can read what.

This post shows a different approach. You define the team once on the
cluster, as a **tenant**, and that boundary carries into Vault automatically,
all the way to the secret inside a running pod.

## A project is not a team

OpenShift projects isolate workloads well, but a team is usually more than one
project. A team has `dev`, `staging` and `prod`. It has members with different
roles. It may own five services across three projects. Projects don't record
any of that, so every tool that needs to know who a team is ends up keeping
its own list.

Multi-Tenant Operator, a Red Hat certified operator, adds that missing object.
A `Tenant` is the team. It names the owners and the projects, and Multi-Tenant
Operator keeps the cluster in line with it:

```yaml
apiVersion: tenantoperator.stakater.com/v1beta3
kind: Tenant
metadata:
  name: acme
spec:
  accessControl:
    owners:
      users:
        - anna@example.com
  namespaces:
    withTenantPrefix:
      - shop
```

Multi-Tenant Operator creates `acme-shop`, gives Anna access to it, and
labels it `stakater.com/tenant: acme`. That label matters: it is how every
other tool finds out which tenant a project belongs to.

## Every tenant becomes a Vault namespace

Vault Enterprise already has a construct built for tenancy: **Vault
namespaces**. Each Vault namespace has its own policies, auth methods and
secret engines, isolated from the others. It's the natural home for a tenant.
What's usually missing is the automation that keeps the Vault namespaces in
line with the teams.

The Vault Enterprise extension for Multi-Tenant Operator provides it. For
every tenant, it creates:

- a Vault namespace named after the tenant (`acme`)
- a KV secrets engine inside it
- a Kubernetes auth method inside it, so the tenant's workloads can log in
  with their own ServiceAccount tokens
- optionally, an OIDC login for people, mapped to identity-provider groups

When you add a tenant, a new Vault namespace appears. When you add a project
to a tenant, its workloads can use that tenant's Vault namespace, and no
other.

## How it works

No new controller writes to Vault. The extension combines open source
projects that are already in use in OpenShift shops:

| Component | Role |
|---|---|
| **Multi-Tenant Operator** | Owns the `Tenant` and labels the tenant's projects |
| **Template Operator** | Renders one set of Vault configuration resources per tenant |
| **Vault Config Operator** | Writes that configuration into Vault, declaratively |
| **External Secrets Operator** | Copies secrets from Vault into Kubernetes Secrets |
| **Reloader** | Rolls the pods when a secret changes |

<!-- RAFAEL: this section is yours. Vault Config Operator, the Red Hat
Community of Practice project, why declarative Vault configuration matters,
and the targetNamespace work in v1.0.3 that made one Vault namespace per
tenant possible. About 200 words. -->

Vault Config Operator is a Red Hat Community of Practice project, maintained
by Red Hat and Stakater together. It manages Vault policies, auth methods
and secret engines as Kubernetes resources. Version 1.0.3 added the piece
this design depends on: Vault Config Operator logs in to Vault once, and
writes each tenant's configuration into that tenant's own Vault namespace.

Here's the flow from a new team to a running pod with its secret:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform admin
    actor Dev as Developer
    participant MTO as Multi-Tenant Operator
    participant TO as Template Operator
    participant VCO as Vault Config Operator
    participant Vault as Vault Enterprise
    participant ESO as External Secrets Operator
    participant Pod

    Admin->>MTO: create Tenant "acme"
    MTO->>MTO: create project acme-shop,<br/>label stakater.com/tenant=acme
    TO->>VCO: render Vault namespace, KV, Kubernetes auth for acme
    VCO->>Vault: create Vault namespace "acme" and its mounts
    Dev->>TO: annotate ServiceAccount "checkout" (kv, editor)
    TO->>VCO: render policy and login role for checkout
    VCO->>Vault: write policy and role in "acme"
    Dev->>ESO: annotate Deployment (kv-secret.db)
    ESO->>Vault: log in as checkout, read kv/dev/acme-shop/checkout/db
    ESO->>Pod: Secret checkout-db
    Note over Vault,Pod: When the value rotates in Vault, ESO updates<br/>the Secret and Reloader rolls the pod
```

## What a developer does

Two annotations on the ServiceAccount ask for the app's own space in the
tenant's Vault namespace, and decide how much access it gets:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: checkout
  namespace: acme-shop
  annotations:
    vault.stakater.com/kv: "true"
    vault.stakater.com/tier: editor
```

One annotation on the Deployment asks for a secret:

```yaml
metadata:
  annotations:
    vault.stakater.com/kv-secret.db: db#password
    reloader.stakater.com/auto: "true"
```

That's all. The developer doesn't write a Vault policy, open a ticket or
handle a Vault token. The app's secrets live at
`kv/dev/acme-shop/checkout/`, External Secrets Operator delivers them as the
Secret `checkout-db`, and the app reads it the way it reads any other
Kubernetes Secret.

Teams that need to share do it explicitly. A project can publish values to
the other projects in its tenant. Two tenants can exchange values through a
separate shared Vault namespace. Both sides have to annotate, and every share
is read-only for the side that receives it.

## What people see

Engineers sign in to Vault with single sign-on. Each tenant has four tiers:
`viewer`, `editor`, `admin` and `audit-read`. Each tier maps to an
identity-provider group named by a pattern, such as `acme-editors`, so access
follows the groups your identity team already manages.

An editor sees the app's secrets and can write a new version:

![An editor's view of the secret db, with Create new version](screenshots/vault-kv-secret-editor.png)

A viewer sees the same keys, and can't write:

![A viewer's view of the same secret, without Create new version](screenshots/vault-kv-secret-viewer.png)

An auditor can list what exists, but can't read any value:

![The audit-read view: You do not have permission to read this secret](screenshots/vault-kv-no-read.png)

## Guardrails for Vault owners

Vault owners will ask what this setup can do to their Vault. The answers,
each covered by the extension's end-to-end tests on Vault Enterprise 2.1.1:

- **Isolation holds.** A workload can't read another app's secrets, another
  tenant's Vault namespace, or log in with another tenant's role. Vault
  refuses each attempt with a 403.
- **Vault stays in charge.** Workloads log in through Vault's own Kubernetes
  auth method, and people through Vault's own OIDC method. Nothing goes
  around Vault.
- **Drift is reverted.** If someone widens a policy by hand in Vault, Vault
  Config Operator rewrites it, and the extra access goes away.
- **Secrets survive mistakes.** With the recommended Vault policy, removing a
  tenant revokes its access but keeps its Vault namespace and data. Deleting
  the data stays a deliberate step for a Vault admin.

One rule matters most: the `stakater.com/tenant` label grants Vault access,
so only the platform should be able to set it on a project. Multi-Tenant
Operator already depends on the same rule.

## Try it

Multi-Tenant Operator's Basic edition is free with no expiry, and manages up
to two tenants. That's enough to run this example and see two teams isolated
from each other. You bring your own Vault Enterprise license, version 2.1 or
later.

1. Install Multi-Tenant Operator from OperatorHub in the OpenShift console.
2. Install Vault Config Operator (v1.0.3 or later), Template Operator,
   External Secrets Operator and Reloader.
3. Have a Vault admin enable the Kubernetes auth method for Vault Config
   Operator. This is a one-time step, and the commands are in the repository.
4. Install the extension with Helm.
5. Apply the two tenants and the `checkout` app from the examples.

Every file in this post, and the full steps, are at
<!-- TODO: public URL once the repo is public, e.g. github.com/stakater/mto-blogs -->.

Transit and PKI engines aren't supported by the Vault Enterprise extension
yet. Today it covers KV secrets, workload login, single sign-on, sharing and
delivery through External Secrets Operator.

## What's next

The tenant you defined here doesn't stop at Vault. In the next posts in this
series, we'll carry the same boundary into more of the tools your teams use
every day.

---

*Rasheed Amir is <!-- role -->, Stakater. Aisha <!-- surname, role -->,
Stakater. Rafael <!-- surname, role -->, Red Hat.*
