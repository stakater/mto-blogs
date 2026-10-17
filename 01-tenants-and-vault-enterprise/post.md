# One tenant, from OpenShift to Vault Enterprise

<!--
Outlet: Red Hat Developer (then the Stakater blog, canonical link back).
Rafael (Red Hat) validates the guide on his own cluster and submits the post.
Authors: Rafael (Red Hat), Rasheed Amir (Stakater), Aisha (Stakater). Byline order to agree.
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

So the platform team fills the gap by hand. This post shows a different
approach: you define the team once on the cluster, as a **tenant**, and that
boundary carries into Vault automatically, all the way to the secret inside
a running pod.

## What one team costs in Vault

Here is what onboarding one team, with one app, looks like in Vault
Enterprise when it's done properly: the team gets its own Vault namespace,
the app gets its own path, and people sign in through the company's
identity provider. The commands are simplified, but every line is a real
step:

```bash
# A boundary for the team
vault namespace create acme
vault secrets enable -namespace=acme -path=kv kv-v2
vault auth enable    -namespace=acme -path=kubernetes/workloads kubernetes
vault write -namespace=acme auth/kubernetes/workloads/config \
  kubernetes_host=https://kubernetes.default.svc:443

# A policy and a login role for the app, limited to its own path
vault policy write -namespace=acme checkout-editor - <<'EOF'
path "kv/data/dev/acme-shop/checkout/*" { capabilities = ["create", "read", "update"] }
path "kv/metadata/dev/acme-shop/checkout/*" { capabilities = ["list", "read"] }
EOF
vault write -namespace=acme auth/kubernetes/workloads/role/checkout \
  bound_service_account_names=checkout \
  bound_service_account_namespaces=acme-shop \
  token_policies=checkout-editor

# Sign-in for people: an OIDC login, and a policy and role per access level
vault auth enable -namespace=acme -path=oidc/sso oidc
vault write -namespace=acme auth/oidc/sso/config oidc_discovery_url=... oidc_client_id=... oidc_client_secret=...
vault policy write -namespace=acme acme-editor ...
vault write -namespace=acme auth/oidc/sso/role/editor bound_claims='{"groups":["acme-editors"]}' token_policies=acme-editor ...
# ...and the same again for viewer, admin and audit-read
```

That's Vault. On the cluster, the app still needs a `SecretStore` and an
`ExternalSecret` before the secret reaches the pod.

Now multiply it. Every app in the team needs its own policy and role. Every
team needs the whole block. Then it has to be **kept** right: a new project
needs new bindings, an app that moves from editor to viewer needs its policy
rewritten, and a team that leaves needs every grant removed. Nothing in
Vault notices when the cluster changes.

Platform teams end up in one of three places:

- **One broad policy.** Quick to set up, and one leaked token reads every
  team's secrets.
- **A ticket per request.** Safe, and the platform team becomes the queue.
- **Kept by hand.** The quiet one. People and apps leave, and their access
  stays. It's the one that shows up in an audit.

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

The Vault Enterprise extension for Multi-Tenant Operator provides it. Every
step from the previous section is taken over, and kept up to date:

| By hand, per team | With the extension |
|---|---|
| Create a Vault namespace, a KV engine and a Kubernetes auth method | Created when the `Tenant` is created, named after it |
| Write a policy per app and access level | Generated from two annotations on the app's ServiceAccount |
| Write a login role per app | Generated per annotated ServiceAccount, bound to that ServiceAccount only |
| Set up OIDC sign-in, with a role per group | One role per access level, bound to the group `<tenant>-<level>s`, such as `acme-editors` |
| Wire up a `SecretStore` and an `ExternalSecret` per app | Generated from one annotation on the Deployment |
| Keep it all right as teams change | An access level change rewrites the policy. A removed annotation removes the grant. A removed tenant loses its access, and keeps its data. A hand edit in Vault is put back. |

When you add a tenant, a new Vault namespace appears. When you add a project
to a tenant, its workloads can use that tenant's Vault namespace, and no
other. Nobody runs a Vault command for any of it.

## How it works

No new controller writes to Vault. The extension combines open source
projects that are already in use in OpenShift shops:

| Component | Role |
|---|---|
| **Multi-Tenant Operator** | Owns the `Tenant` and labels the tenant's projects |
| **Template Operator** | Ships with Multi-Tenant Operator. Renders one set of Vault configuration resources per tenant |
| **Vault Config Operator** | Writes that configuration into Vault, declaratively |
| **External Secrets Operator** | Copies secrets from Vault into Kubernetes Secrets |
| **Reloader** | Rolls the pods when a secret changes |

### Vault configuration as Kubernetes resources

Vault Config Operator is the piece that makes this work without a single
hand-written Vault command per team. It's an open source project in the Red
Hat Community of Practice. It turns Vault configuration into Kubernetes
custom resources: a `Policy`, an `AuthEngineMount`, a
`KubernetesAuthEngineRole`, a `SecretEngineMount`, and even a Vault
`Namespace` itself.

That changes how a platform team runs Vault. The configuration lives in Git
and goes through review like any other manifest. It's applied by a
controller instead of a person with a root token. Vault Config Operator can
also check Vault against the resources and put back anything someone changed
by hand.

Until recently there was one gap for multi-tenancy. Vault Config Operator
wrote every object into the Vault namespace it had logged in to. Giving each
tenant its own Vault namespace would have meant a separate login, with its
own credentials, for every tenant.

Stakater closed that gap upstream. Version 1.0.3 adds
`spec.authentication.targetNamespace`, so Vault Config Operator logs in
**once** and writes each tenant's objects into that tenant's own Vault
namespace. The same release fixes the controller that creates Vault
namespaces, so they can be managed reliably as resources. The work went in
through the normal upstream review
([redhat-cop/vault-config-operator#373](https://github.com/redhat-cop/vault-config-operator/pull/373)),
and every Vault Config Operator user gets it, with or without Multi-Tenant
Operator.

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
to two tenants. That's enough to see two teams isolated from each other in
Vault. You bring your own Vault Enterprise license, version 2.1 or later.

The companion tutorial,
[Hands-on: tenants on OpenShift, carried into Vault Enterprise](https://github.com/stakater/mto-blogs/tree/main/02-try-it-tenants-and-vault-enterprise),
takes you from an empty OpenShift cluster to an app reading its secret from
its tenant's own Vault namespace, in about an hour.

Transit and PKI engines aren't supported by the Vault Enterprise extension
yet. Today it covers KV secrets, workload login, single sign-on, sharing and
delivery through External Secrets Operator.

## What's next

This post and its tutorial cover the apps: how a workload gets its secrets,
and how tenants stay apart. People signing in are the other half. Anna
should sign in once and see only `acme`, in the OpenShift console and in
Vault alike.

That half gets its own pair of posts, because it brings in pieces this one
doesn't need: an identity provider with groups, and a change to how
OpenShift signs people in. Covered here, it would double the tutorial and
mix two different questions. Next time, we connect both through one
login, and the same tenant decides what each person sees everywhere.

---

*Rafael [surname], [role], Red Hat. Rasheed Amir, [role], Stakater.
Aisha [surname], [role], Stakater.*
