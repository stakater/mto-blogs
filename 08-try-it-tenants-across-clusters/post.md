# Hands-on: one tenant, on every cluster

<!--
Outlet: Red Hat Developer (tutorial), then the Stakater blog, canonical link back.
Companion to post 7, "One tenant, on every cluster", which explains why.
Screenshots: each "Screenshot to capture" block is a slot, filled during the
validation run. The full list, with highlights, is in screenshots/README.md.

STATUS: DRAFT, rewritten from 07-tenants-across-clusters/story.md. NOT YET
VALIDATED. The team definitions render and pass `make test`. No step below
has been run on a cluster, so every expected output is what we expect, not
what we saw, and no version is claimed. Every "[To confirm: ...]" in the
text is an open question from story.md. The validation run resolves each
one, fills in the versions and fixes every step that needs it, per
docs/guidelines/tutorial.md. Do not submit until then.
-->

In [One tenant, on every cluster](../07-tenants-across-clusters/post.md), we
showed how a hub decides where a team exists, and Multi-Tenant Operator on
each cluster decides what the team is there. This tutorial builds it, step
by step.

By the end you'll have:

- two teams, `acme` and `globex`, on two clusters, each from one definition
  in Git
- the same team on both clusters, with a larger budget in production
- a cluster that got its teams from one label
- one guardrail in every namespace of every team, from a single template,
  which refuses changes made by hand
- a team that created its own namespace, without asking the platform team,
  and got the guardrail anyway
- proof that the boundary between teams holds on every cluster, and is put
  back when it's broken, by two different loops

Allow about two hours, most of it waiting for operators to install.
[Validated on: the OpenShift, Advanced Cluster Management and OpenShift
GitOps versions, from the validation run.]

## Before you start

You need:

- **A hub cluster,** with `cluster-admin`. It runs Red Hat Advanced Cluster
  Management and Red Hat OpenShift GitOps, which you install in step 1.
- **Two more clusters,** with `cluster-admin` on each. One will be the
  development spoke and one the production spoke. [To confirm in the
  validation run: whether the hub can also act as one of the spokes, so two
  clusters are enough.]
- `oc` and `git` on your machine, and a kubeconfig context for each cluster.
- **Your own fork** of
  [stakater/mto-blogs](https://github.com/stakater/mto-blogs), public so the
  hub can read it. You'll commit changes to the team definitions, and the
  hub delivers what's in your fork.

  ```bash
  git clone https://github.com/<your GitHub user>/mto-blogs.git
  cd mto-blogs/08-try-it-tenants-across-clusters/examples
  ```

Here's what you'll install:

| Component | Version | From | Job |
|---|---|---|---|
| Red Hat Advanced Cluster Management | [version] | Software Catalog (OperatorHub), on the hub | Knows the clusters and their labels, and decides which clusters each team is placed on |
| Red Hat OpenShift GitOps | [version] | Software Catalog (OperatorHub), on the hub | Delivers each team's definition to its clusters, and keeps it in step with Git |
| Multi-Tenant Operator | [version] | Software Catalog (OperatorHub), on each spoke | Turns each tenant into the team's namespaces, access and budget, and keeps them right |
| Template Operator v2 | Ships with Multi-Tenant Operator | Switched on in step 3 | Puts the platform's guardrails into every team's namespaces, and keeps them as written |

The Multi-Tenant Operator Basic edition is free with no expiry, and manages
up to two tenants. That's exactly what this tutorial uses on each spoke.
[To confirm: Basic is two tenants on each cluster, so two spokes need no
license.]

Set these now. Every step uses them:

```bash
export HUB=<kubeconfig context of the hub>
export DEV=<kubeconfig context of the development spoke>
export PROD=<kubeconfig context of the production spoke>
export REPO=https://github.com/<your GitHub user>/mto-blogs.git
```

**People in this tutorial are impersonated.** Where a step acts as Anna, an
owner of `acme`, it uses `--as anna --as-group acme-owners` with your own
`cluster-admin` login. That's a learning shortcut, so you don't need an
identity provider on each spoke. **In production,** people sign in through
your identity provider, and their groups come from it.

## Step 1: Prepare the hub

The hub needs two things: Advanced Cluster Management, which knows the
clusters, and OpenShift GitOps, which delivers to them.

In the hub's OpenShift console, go to **Ecosystem → Software Catalog** (on
older versions, **Operators → OperatorHub**), and install both with the
defaults:

- **Red Hat OpenShift GitOps.** It creates an Argo CD instance in
  `openshift-gitops`.
- **Advanced Cluster Management for Kubernetes.** When it's installed,
  create its `MultiClusterHub` from the operator's page, with the defaults.

Wait until both are ready:

```bash
until oc --context "$HUB" -n openshift-gitops get deploy/openshift-gitops-server >/dev/null 2>&1; do sleep 10; done
oc --context "$HUB" -n openshift-gitops wait deploy/openshift-gitops-server \
  --for=condition=Available --timeout=600s
oc --context "$HUB" -n open-cluster-management wait multiclusterhub/multiclusterhub \
  --for=jsonpath='{.status.phase}'=Running --timeout=1800s
```

```
deployment.apps/openshift-gitops-server condition met
multiclusterhub.operator.open-cluster-management.io/multiclusterhub condition met
```

Now connect the two.
[`hub/gitops-clusters.yaml`](examples/hub/gitops-clusters.yaml) tells
Advanced Cluster Management to register every cluster that has an
`environment` label in the hub's Argo CD:

```bash
oc --context "$HUB" apply -f hub/gitops-clusters.yaml
```

```
managedclustersetbinding.cluster.open-cluster-management.io/default created
placement.cluster.open-cluster-management.io/tenancy-clusters created
gitopscluster.apps.open-cluster-management.io/tenancy-clusters created
```

**What just happened:** the hub now has both tools, and a rule joining them:
a cluster with an `environment` label is one OpenShift GitOps may deliver
to. No cluster has that label yet.

[To confirm with Raffaele: placement by Advanced Cluster Management with
delivery by OpenShift GitOps is the path Red Hat wants shown.]

## Step 2: Join the spokes to the hub

Import both spokes into Advanced Cluster Management. In the hub's console,
switch to **Fleet Management** (on older versions, **All Clusters**), go to
**Infrastructure → Clusters → Import cluster**, and import each one. Then
set each cluster's name as the hub knows it:

```bash
oc --context "$HUB" get managedclusters
```

```
NAME            HUB ACCEPTED   MANAGED CLUSTER URLS            JOINED   AVAILABLE   AGE
dev-spoke       true           https://api.dev...:6443         True     True        3m
local-cluster   true           https://api.hub...:6443         True     True        40m
prod-spoke      true           https://api.prod...:6443        True     True        2m
```

```bash
export DEV_CLUSTER=<name of the development spoke, such as dev-spoke>
export PROD_CLUSTER=<name of the production spoke, such as prod-spoke>
```

Label the development spoke only. The production spoke waits until step 7:

```bash
oc --context "$HUB" label managedcluster "$DEV_CLUSTER" environment=dev
sleep 30
oc --context "$HUB" -n openshift-gitops get secrets \
  -l argocd.argoproj.io/secret-type=cluster
```

```
NAME                       TYPE     DATA   AGE
dev-spoke-cluster-secret   Opaque   3      20s
```

> 📷 **Screenshot to capture** (`01-hub-clusters-labels.png`): the hub's console, Infrastructure → Clusters, with the hub and both spokes.
> **Highlight:** the label `environment=dev` on the development spoke.

**What just happened:** the hub knows both spokes, and the label put the
development spoke in the hub's Argo CD. The production spoke is managed by
the hub, but nothing delivers to it yet.

**In production,** clusters get their labels when they're provisioned, from
the cluster's own definition. The access the hub's Argo CD gets on each
spoke is also yours to narrow. [To confirm in the validation run: what
access it gets by default, and how to limit it to `Tenant` and `Quota`.]

## Step 3: Install Multi-Tenant Operator on each spoke

Each spoke needs the operator that turns a tenant into a team. On each
spoke's console, go to **Ecosystem → Software Catalog**, search for
**multi tenant**, and install **Multi Tenant Operator** with the defaults.
It installs into the `multi-tenant-operator` namespace.

Then switch on two things it ships with, on both spokes: Template Operator
v2, which step 6 uses for guardrails, and the console. Template Operator
also gets the right to manage network policies, because that's what the
guardrail is. The first line of the loop waits until the operator has made
its configuration:

```bash
for CTX in "$DEV" "$PROD"; do
  until oc --context "$CTX" -n multi-tenant-operator get integrationconfig tenant-operator-config >/dev/null 2>&1; do sleep 10; done
  oc --context "$CTX" -n multi-tenant-operator patch integrationconfig tenant-operator-config --type merge -p '{
    "spec": {
      "components": {
        "console": true,
        "templateOperatorV2": {"mode": "Managed", "values": {"rbac": {"additionalRules": [
          {"apiGroups": [""], "resources": ["namespaces"], "verbs": ["get", "list", "watch"]},
          {"apiGroups": ["networking.k8s.io"], "resources": ["networkpolicies"], "verbs": ["*"]}
        ]}}}
      },
      "accessControl": {"privileged": {"users": ["mto@stakater.com"]}}
    }}'
done
```

```
integrationconfig.tenantoperator.stakater.com/tenant-operator-config patched
integrationconfig.tenantoperator.stakater.com/tenant-operator-config patched
```

Wait until Template Operator is running on each:

```bash
for CTX in "$DEV" "$PROD"; do
  until oc --context "$CTX" get crd templateinstances.templates.v2.stakater.com >/dev/null 2>&1; do sleep 10; done
  oc --context "$CTX" -n multi-tenant-operator get pods | grep template-operator-v2
done
```

```
template-operator-v2-controller-manager-...   1/1   Running   0   1m
template-operator-v2-controller-manager-...   1/1   Running   0   1m
```

[To confirm in the validation run: the exact form of `rbac.additionalRules`,
and whether refusing hand edits needs cert-manager on the spoke, as the
Template Operator documentation says for its strict mode.]

**What just happened:** both spokes can now turn a `Tenant` into a team, and
a template into guardrails. Neither has a tenant yet.

**In production,** the hub installs the operator on each cluster too, the
same way it delivers the teams, so a new cluster needs nothing done by hand.

## Step 4: Define two teams, once

The teams are already in your fork, under
[`teams/`](examples/teams/). Each team has a **base**, which is the team
itself, and an **overlay** per environment, which changes only the budget.
Here's all of `acme`, in
[`teams/acme/base/tenant.yaml`](examples/teams/acme/base/tenant.yaml):

```yaml
apiVersion: tenantoperator.stakater.com/v1beta3
kind: Tenant
metadata:
  name: acme
spec:
  quota: acme-quota
  accessControl:
    owners:
      groups:
        - acme-owners
    viewers:
      groups:
        - acme-viewers
  namespaces:
    withTenantPrefix:
      - apps
      - build
      - data
```

Before any cluster sees them, prove the overlays do what they claim:

```bash
make test
```

```
ok   | acme dev: the Tenant
ok   | acme prod: the Tenant
ok   | acme: Tenant identical in dev and prod
ok   | acme dev: smaller cpu budget
ok   | acme prod: larger cpu budget
...
PASS: every team renders the same in each environment, with its own budget.
```

**What just happened:** `make test` rendered each team for each environment
and compared them. The `Tenant` is identical in development and production,
and only the `Quota`'s numbers differ. `make render` shows exactly what each
cluster will receive.

## Step 5: Put both teams on the development spoke

Two files do the placing.
[`hub/placements.yaml`](examples/hub/placements.yaml) defines the
environments: the clusters labeled `environment=dev`, and those labeled
`environment=prod`. [`hub/teams.yaml`](examples/hub/teams.yaml) is one
`ApplicationSet` that delivers each team's overlay to every cluster in its
environment.

Apply both, pointing the second at your fork:

```bash
oc --context "$HUB" apply -f hub/placements.yaml
sed "s|https://github.com/stakater/mto-blogs.git|$REPO|" hub/teams.yaml \
  | oc --context "$HUB" apply -f -
sleep 60
oc --context "$HUB" -n openshift-gitops get applications
```

```
NAME               SYNC STATUS   HEALTH STATUS
acme-dev-spoke     Synced        Healthy
globex-dev-spoke   Synced        Healthy
```

The hub sent two objects per team. Look at what Multi-Tenant Operator made
of them on the spoke:

```bash
oc --context "$DEV" get tenants
oc --context "$DEV" get namespaces -l stakater.com/tenant \
  -o custom-columns=NAMESPACE:.metadata.name,TENANT:.metadata.labels.stakater\\.com/tenant
```

```
NAME     AGE
acme     40s
globex   40s
NAMESPACE     TENANT
acme-apps     acme
acme-build    acme
acme-data     acme
globex-apps   globex
```

And the team's people have their access. Anna, an owner of `acme`, can
deploy in her team's namespace:

```bash
oc --context "$DEV" auth can-i create deployments -n acme-apps \
  --as anna --as-group acme-owners
```

```
yes
```

In the spoke's Multi-Tenant Operator console, the **Tenants** page shows
both teams. Open the console's route, and sign in as `mto@stakater.com` with
the password Multi-Tenant Operator generated:

```bash
oc --context "$DEV" -n multi-tenant-operator get routes | grep console
oc --context "$DEV" -n multi-tenant-operator get secret tenant-operator-console-credentials \
  -o jsonpath='{.data.passwordPlainText}' | base64 -d; echo
```

> 📷 **Screenshot to capture** (`02-mto-console-dev-tenants.png`): the Multi-Tenant Operator console on the development spoke, Tenants page, with `acme` and `globex`.
> **Highlight:** the row `acme`, with its quota.

**What just happened:** Advanced Cluster Management matched the development
spoke to the `dev-clusters` placement. OpenShift GitOps delivered each
team's development overlay there: one `Tenant` and one `Quota` per team.
Multi-Tenant Operator created the namespaces and gave each group its
access. The hub never sent a namespace or a role binding.

**In production,** connect the console to your identity provider and delete
this built-in account: anyone who can read Secrets in
`multi-tenant-operator` can read its password, and it sees every tenant.

## Step 6: Give every team's namespaces the same guardrail

A team's namespaces need more than access and a budget. Here the platform
wants one rule everywhere: pods accept traffic from their own team's
namespaces and from the cluster's router, and from nobody else. Sent from
the hub as objects, that's one network policy per namespace, per team, per
cluster, and a new one for every namespace added later.

With Template Operator, it's two objects per cluster.
[`guardrails/tenant-guardrails.yaml`](examples/guardrails/tenant-guardrails.yaml)
holds a `Template`, which says what to write into each namespace that
belongs to a tenant, and a `TemplateInstance`, which renders it:

```yaml
  gotemplate: |
    {{- range $ns := .parameters.namespaces }}
    {{- $labels := default dict (index $ns.metadata "labels") }}
    {{- if and (hasKey $labels "stakater.com/tenant") (not (hasKey $ns.metadata "deletionTimestamp")) }}
    ---
    apiVersion: networking.k8s.io/v1
    kind: NetworkPolicy
    metadata:
      name: {{ $.instance.name }}-same-team-only
      namespace: {{ $ns.metadata.name }}
    spec:
      podSelector: {}
      policyTypes: [Ingress]
      ingress:
        - from:
            - namespaceSelector:
                matchLabels:
                  stakater.com/tenant: {{ index $labels "stakater.com/tenant" | quote }}
            - namespaceSelector:
                matchLabels:
                  policy-group.network.openshift.io/ingress: ""
    {{- end }}
    {{- end }}
  sync:
    mode: strict
```

[`hub/guardrails.yaml`](examples/hub/guardrails.yaml) delivers those two
objects to every cluster with an `environment` label. Apply it, pointing it
at your fork:

```bash
sed "s|https://github.com/stakater/mto-blogs.git|$REPO|" hub/guardrails.yaml \
  | oc --context "$HUB" apply -f -
sleep 60
oc --context "$DEV" get networkpolicies -A -l templates.v2.stakater.com/instance=tenant-guardrails
```

```
NAMESPACE     NAME                                POD-SELECTOR   AGE
acme-apps     tenant-guardrails-same-team-only    <none>         20s
acme-build    tenant-guardrails-same-team-only    <none>         20s
acme-data     tenant-guardrails-same-team-only    <none>         20s
globex-apps   tenant-guardrails-same-team-only    <none>         20s
```

**What just happened:** the hub sent one `Template` and one
`TemplateInstance`. Template Operator, on the spoke, listed the namespaces,
kept the ones that belong to a tenant, and wrote a policy into each, with
that team's name in it. It keeps watching the list, which matters in step 9.

## Step 7: Bring in the production spoke with one label

The production spoke has the operator and no teams. Placing it takes one
label, on the hub:

```bash
oc --context "$HUB" label managedcluster "$PROD_CLUSTER" environment=prod
sleep 90
oc --context "$HUB" -n openshift-gitops get applications
```

```
NAME                SYNC STATUS   HEALTH STATUS
acme-dev-spoke          Synced        Healthy
acme-prod-spoke         Synced        Healthy
globex-dev-spoke        Synced        Healthy
globex-prod-spoke       Synced        Healthy
guardrails-dev-spoke    Synced        Healthy
guardrails-prod-spoke   Synced        Healthy
```

Both teams arrived, and they're the same teams, with the production budget:

```bash
for CTX in "$DEV" "$PROD"; do
  oc --context "$CTX" get quotas.tenantoperator.stakater.com acme-quota \
    -o jsonpath='cpu={.spec.resourcequota.hard.requests\.cpu} pods={.spec.resourcequota.hard.pods}{"\n"}'
done
```

```
cpu=2 pods=10
cpu=20 pods=50
```

The guardrail came with them, in every one of their namespaces:

```bash
oc --context "$PROD" get networkpolicies -A -l templates.v2.stakater.com/instance=tenant-guardrails
```

```
NAMESPACE     NAME                                POD-SELECTOR   AGE
acme-apps     tenant-guardrails-same-team-only    <none>         30s
acme-build    tenant-guardrails-same-team-only    <none>         30s
acme-data     tenant-guardrails-same-team-only    <none>         30s
globex-apps   tenant-guardrails-same-team-only    <none>         30s
```

> 📷 **Screenshot to capture** (`03-mto-console-prod-tenants.png`): the Multi-Tenant Operator console on the production spoke, Tenants page, with `acme` and `globex`.
> **Highlight:** the row `acme`, with its larger quota.

> 📷 **Screenshot to capture** (`04-hub-team-placements.png`): OpenShift GitOps on the hub, Applications, with `acme` and `globex` on each spoke, all Synced and Healthy.
> **Highlight:** the two Applications for `acme`, one per spoke.

**What just happened:** the label did two things. It registered the cluster
in the hub's Argo CD, and it matched the `prod-clusters` placement, so the
`ApplicationSet` rendered an Application per team for it, with the
production overlay, and one for the guardrails. Nobody wired the cluster up
team by team, or namespace by namespace.

## Step 8: Change a team once

The `acme` team gets a group of editors. That's one change, in the base.
Add the `editors` lines to `teams/acme/base/tenant.yaml`:

```yaml
  accessControl:
    owners:
      groups:
        - acme-owners
    editors:              # add these three lines
      groups:
        - acme-editors
    viewers:
      groups:
        - acme-viewers
```

Check it, then commit and push to your fork:

```bash
make test
git commit -am "acme: add an editors group"
git push
```

Argo CD picks the change up within a few minutes. Then Ben, an editor, has
access on both clusters:

```bash
sleep 240
for CTX in "$DEV" "$PROD"; do
  oc --context "$CTX" auth can-i create deployments -n acme-apps \
    --as ben --as-group acme-editors
done
```

```
yes
yes
```

**What just happened:** one commit changed the team, and each cluster's
operator gave the new group its access in every one of the team's
namespaces. You changed the team once, not once per namespace per cluster.

## Step 9: Let a team create its own namespace

Anna needs a scratch namespace on the development spoke. She doesn't open a
pull request for it. She creates it, on the spoke, as an owner of `acme`:

```bash
oc --context "$DEV" create namespace acme-scratch \
  --as anna --as-group acme-owners
```

```
namespace/acme-scratch created
```

[To confirm with engineering: that a tenant owner can create a namespace
this way while the `Tenant` is managed from Git, the exact command, and that
the namespace survives the next sync from the hub. If it doesn't work this
way, this step changes or comes out.]

It joined her team, with the team's access:

```bash
oc --context "$DEV" get namespace acme-scratch \
  -o jsonpath='tenant={.metadata.labels.stakater\.com/tenant}{"\n"}'
oc --context "$DEV" auth can-i create deployments -n acme-scratch \
  --as anna --as-group acme-owners
```

```
tenant=acme
yes
```

And it has the guardrail, though nobody asked for one:

```bash
oc --context "$DEV" -n acme-scratch get networkpolicies
```

```
NAME                               POD-SELECTOR   AGE
tenant-guardrails-same-team-only   <none>         15s
```

Sync the team from the hub, and check the namespace is still there:

```bash
oc --context "$HUB" -n openshift-gitops annotate application "acme-$DEV_CLUSTER" \
  argocd.argoproj.io/refresh=hard --overwrite
sleep 60
oc --context "$DEV" get namespace acme-scratch
```

```
NAME           STATUS   AGE
acme-scratch   Active   2m
```

> 📷 **Screenshot to capture** (`05-mto-console-dev-namespaces.png`): the Multi-Tenant Operator console on the development spoke, Namespaces page, with `acme`'s namespaces.
> **Highlight:** the namespace `acme-scratch`, under the tenant `acme`.

**What just happened:** the namespace was never in Git, so the hub couldn't
have sent it. Multi-Tenant Operator, on the spoke, saw an owner of `acme`
create it, made it part of the tenant, and counted it against the team's
one budget. [To confirm with engineering: the quota is one budget across
all the tenant's namespaces.] Template Operator saw a new namespace with a tenant's
label and wrote the guardrail into it. The namespace exists only on this
cluster, which is what Anna wanted.

## Step 10: See the boundary hold on every cluster

Anna owns `acme`, on the clusters `acme` is placed on. She has nothing in
`globex`, on either:

```bash
for CTX in "$DEV" "$PROD"; do
  oc --context "$CTX" auth can-i create deployments -n globex-apps \
    --as anna --as-group acme-owners
  oc --context "$CTX" auth can-i get pods -n globex-apps \
    --as anna --as-group acme-owners
done
```

```
no
no
no
no
```

**What just happened:** nothing, which is the point. Each cluster's operator
gave `acme`'s groups access to `acme`'s namespaces only, so the boundary is
the same on every cluster without anyone writing it per cluster.

## Step 11: Break it three ways

Two loops keep a cluster right, and the guardrails refuse changes outright.
Try each.

**First, inside the tenant.** Remove the owners' access from one of `acme`'s
namespaces on the development spoke, as a cluster administrator might by
mistake:

```bash
RB=$(oc --context "$DEV" -n acme-apps get rolebindings \
  -o jsonpath='{.items[?(@.subjects[0].name=="acme-owners")].metadata.name}')
oc --context "$DEV" -n acme-apps delete rolebinding $RB
sleep 30
oc --context "$DEV" auth can-i create deployments -n acme-apps \
  --as anna --as-group acme-owners
```

```
yes
```

**What just happened:** Multi-Tenant Operator put the role binding back, on
the spoke. The hub wasn't involved: the `Tenant` hadn't changed, so Argo CD
saw nothing to do.

**Then, the tenant itself.** Delete `globex` from the development spoke:

```bash
oc --context "$DEV" delete tenant globex
sleep 60
oc --context "$DEV" get tenant globex
```

```
NAME     AGE
globex   30s
```

**What just happened:** this time the hub acted. The `Tenant` in Git was
missing from the cluster, so Argo CD delivered it again, and Multi-Tenant
Operator took the team's namespace back into it. Each loop covers what the
other can't see.

**Last, a guardrail.** Open `acme-apps` to traffic from everywhere, by
changing its policy on the development spoke:

```bash
oc --context "$DEV" -n acme-apps patch networkpolicy tenant-guardrails-same-team-only \
  --type merge -p '{"spec":{"ingress":[{}]}}'
```

```
Error from server (Forbidden): admission webhook "sync-enforcement.templates.v2.stakater.com" denied the request: resource is managed by sync-enabled TemplateInstance multi-tenant-operator/tenant-guardrails; modifications to enforced fields are not allowed
```

**What just happened:** nothing was put back, because nothing changed. The
template is strict, so Template Operator refused the change before it
reached the cluster, and said which template owns the policy. To change a
guardrail, change the template in Git, and every namespace on every cluster
follows.

## Clean up

Remove things in this order:

```bash
# The delivery of teams and guardrails, and what joins the hub's two tools
oc --context "$HUB" -n openshift-gitops delete applicationset teams guardrails
oc --context "$HUB" delete -f hub/placements.yaml
oc --context "$HUB" delete -f hub/gitops-clusters.yaml

# The labels
oc --context "$HUB" label managedcluster "$DEV_CLUSTER" "$PROD_CLUSTER" environment-

# The guardrails and the teams on each spoke, if the hub left any. Multi-Tenant Operator keeps
# a deleted tenant's namespaces, so delete those too.
for CTX in "$DEV" "$PROD"; do
  oc --context "$CTX" -n multi-tenant-operator delete templateinstance tenant-guardrails --ignore-not-found
  oc --context "$CTX" -n multi-tenant-operator delete template tenant-guardrails --ignore-not-found
  oc --context "$CTX" delete tenant acme globex --ignore-not-found
  oc --context "$CTX" delete quotas.tenantoperator.stakater.com acme-quota globex-quota --ignore-not-found
  oc --context "$CTX" delete namespace acme-apps acme-build acme-data acme-scratch globex-apps --ignore-not-found
done
```

To detach the spokes, remove them from **Infrastructure → Clusters** on the
hub. To remove the operators as well, uninstall them from **Installed
Operators** on each cluster.

## What you built

Two teams, each defined once in Git, running on two clusters. The hub
decided where each team exists: a label placed a cluster, and the teams
followed. Multi-Tenant Operator decided what each team is there: it built
the namespaces, the access and the budget from two small objects, and the
guardrails from one template. It let a team add a namespace on its own,
gave that namespace its guardrail, and put back or refused what was
changed.

| You did | The hub | Multi-Tenant Operator |
|---|---|---|
| Labeled a cluster | Placed both teams on it | Built each team there |
| Committed one change to a team | Delivered it to every cluster | Applied it in every namespace of the team |
| Delivered one guardrail template | Sent it to every cluster | Wrote the guardrail into every team's namespaces |
| Created a namespace as a tenant owner | | Made it part of the tenant, and gave it the guardrail |
| Deleted a role binding on a spoke | | Put it back |
| Deleted a `Tenant` on a spoke | Put it back | Took the team's namespaces back into it |
| Changed a guardrail by hand | | Refused it |

What this tutorial left out on purpose: a team's slice of other tools, such
as a Vault namespace or an Argo CD AppProject. Those belong to one cluster
today, and the earlier tutorials in this series build them there. It also
used one way to deliver from the hub. Advanced Cluster Management's own
policies can deliver the same two objects, and the split of work stays the
same.

The free edition stops at two tenants. When a third team arrives, that's
where Multi-Tenant Operator Enterprise comes in.

## About Multi-Tenant Operator

Multi-Tenant Operator, from Stakater, turns a shared OpenShift cluster into
a platform of tenants. Each team is defined once, and that boundary reaches
its projects, its access, its quotas, its costs and, through extensions,
tools such as Argo CD and Vault. It's a Red Hat certified operator, available
in OperatorHub.

- **Try it free:** the Basic edition manages up to two tenants, with no
  expiry and no capability held back.
- **Learn more:** [docs.stakater.com/mto](https://docs.stakater.com/mto/)
- **Running more than two teams?** Multi-Tenant Operator Enterprise adds
  unlimited tenants and a support commitment. Contact
  [sales@stakater.com](mailto:sales@stakater.com).

---

*Ayesha Arshad, Stakater. Rasheed Amir, Stakater. Raffaele Spazzoli, Red Hat.*
