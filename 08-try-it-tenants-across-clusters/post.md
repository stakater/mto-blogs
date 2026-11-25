# Hands-on: one tenant, on every cluster

<!--
Outlet: Red Hat Developer (tutorial), then the Stakater blog, canonical link back.
Companion to post 7, "One tenant, on every cluster", which explains why.
Screenshots: captured in the validation run. The full list, with highlights,
is in screenshots/README.md.

STATUS: DRAFT — NOT YET VALIDATED. The example files under examples/ render
and pass `make test`. The cluster steps below have not yet been run end to
end on a real hub-and-spokes setup, so no OpenShift version is claimed yet.
The validation run fills that in and fixes every step that needs it, per
docs/guidelines/tutorial.md. Do not submit until then.
-->

In [One tenant, on every cluster](../07-tenants-across-clusters/post.md), we
showed how a team defined once, as a tenant, can run the same way on every
cluster, with per-cluster differences kept to a small overlay. This tutorial
builds it, step by step, two ways: with Red Hat OpenShift GitOps, and with
Red Hat Advanced Cluster Management.

By the end you'll have:

- the `acme` team running on two clusters at once — a dev cluster and a prod
  cluster — from a single definition in Git
- the same team on both: same namespaces, same owners and viewers; and a
  different budget on each, from a one-line-per-value overlay
- that team distributed first by OpenShift GitOps, then by Advanced Cluster
  Management, so you can see which fits your platform
- proof that a change in Git reaches every cluster, and that a change made
  directly on a cluster is corrected

Allow about two hours, most of it installing operators on three clusters.

## Before you start

This tutorial needs more than one cluster, because that's the whole point.
You need:

- **A hub cluster**, with `cluster-admin`, running **Red Hat OpenShift
  GitOps** and **Red Hat Advanced Cluster Management**. You install both in
  step 1.
- **Two spoke clusters**, with `cluster-admin` on each: one you'll treat as
  **dev**, one as **prod**. Each runs **Multi-Tenant Operator**, installed in
  step 2. Two spokes show the overlays; one spoke is enough to see the
  mechanics if that's all you have.
- `oc`, `kubectl` and the `argocd` CLI on your machine, and a kubeconfig
  context for each cluster.
- The example files:

  ```bash
  git clone https://github.com/stakater/mto-blogs.git
  cd mto-blogs/08-try-it-tenants-across-clusters/examples
  ```

Here's what you'll install:

| Component | Where | From | Job |
|---|---|---|---|
| Red Hat OpenShift GitOps | Hub | Software Catalog (OperatorHub) | Mechanism 1: distribute the tenant to the spokes and keep them in sync |
| Red Hat Advanced Cluster Management | Hub | Software Catalog (OperatorHub) | Mechanism 2: enforce the tenant across the spokes and report compliance |
| Multi-Tenant Operator | Each spoke | Software Catalog (OperatorHub) | Reconcile the tenant it receives into namespaces, access and quota |

The Multi-Tenant Operator Basic edition is free with no expiry, and manages
up to two tenants per cluster. This tutorial uses one tenant per spoke, well
inside that.

Set a context variable for each cluster now; every step uses them:

```bash
export HUB=<your hub context>
export DEV=<your dev spoke context>
export PROD=<your prod spoke context>
```

### Check the team definition without a cluster

Before any cluster, prove the overlays do what they claim: the same team,
with a different budget per environment.

```bash
make test
```

```
ok   | dev: Tenant acme
ok   | prod: Tenant acme
ok   | dev: owners group
ok   | prod: owners group
ok   | dev: small cpu budget
ok   | prod: large cpu budget
ok   | dev: marked as dev
ok   | prod: marked as prod
...
PASS: every overlay renders the same team with its own budget.
```

**What just happened:** `make test` ran `kubectl kustomize` on each overlay
and checked the result — the tenant's identity is the same in both, and only
the quota numbers differ. This is the quick gate. The rest of the tutorial is
the full proof, on real clusters.

## Step 1: Prepare the hub

On the hub, install both distribution tools. In the OpenShift console, go to
**Ecosystem → Software Catalog** (on older versions, **Operators →
OperatorHub**), and install, with the defaults:

- **Red Hat OpenShift GitOps** — it creates an Argo CD instance in
  `openshift-gitops`.
- **Advanced Cluster Management for Kubernetes** — after it installs, create
  its `MultiClusterHub` instance from the operator's page, and wait until it
  reports running.

```bash
oc --context "$HUB" -n openshift-gitops \
  wait deploy/openshift-gitops-server --for=condition=Available --timeout=600s
oc --context "$HUB" -n open-cluster-management \
  wait multiclusterhub/multiclusterhub --for=condition=Complete --timeout=1200s
```

> 📷 **Screenshot to capture** (`01-rhacm-clusters.png`): the RHACM console,
> Infrastructure → Clusters, once the spokes are imported in step 2.
> **Highlight:** the `stakater.com/environment` label on each spoke.

## Step 2: Install Multi-Tenant Operator on each spoke

On each spoke, install **Multi Tenant Operator** from the Software Catalog
with the defaults; it installs into the `multi-tenant-operator` namespace.
Then switch on the Template Operator it ships with, and its console, on each:

```bash
for CTX in "$DEV" "$PROD"; do
  until oc --context "$CTX" -n multi-tenant-operator \
    get integrationconfig tenant-operator-config >/dev/null 2>&1; do sleep 10; done
  oc --context "$CTX" -n multi-tenant-operator \
    patch integrationconfig tenant-operator-config --type merge -p '{
      "spec": {"components": {"console": true}}}'
done
```

**What just happened:** each spoke now has Multi-Tenant Operator, ready to
turn a `Tenant` into namespaces, access and quota. Neither spoke has a tenant
yet.

Now import both spokes into Advanced Cluster Management, and label them by
environment. In the RHACM console, **Infrastructure → Clusters → Import
cluster**, import the dev and prod spokes, and give each a label
`stakater.com/environment` of `dev` or `prod`, and `stakater.com/tenancy` of
`true`. You can also set the labels from the hub once they're imported:

```bash
oc --context "$HUB" label managedcluster <dev-cluster-name> \
  stakater.com/environment=dev stakater.com/tenancy=true --overwrite
oc --context "$HUB" label managedcluster <prod-cluster-name> \
  stakater.com/environment=prod stakater.com/tenancy=true --overwrite
```

**In production,** you'd import clusters as part of provisioning them, and
set these labels from the cluster's definition, not by hand.

---

You'll now distribute the same team two ways. Steps 3 to 5 use OpenShift
GitOps. Steps 6 to 8 use Advanced Cluster Management. Each stands on its own;
do them in either order, and clean up between if you want a blank slate.

## Step 3: Register the spokes in Argo CD

OpenShift GitOps needs to know the spokes, with the same labels, so one
`ApplicationSet` can target them. Add each spoke to Argo CD and label it:

```bash
argocd login --core        # uses your current kubeconfig against the hub
argocd cluster add "$DEV"  --name dev-spoke  --label stakater.com/tenancy=true --label stakater.com/environment=dev
argocd cluster add "$PROD" --name prod-spoke --label stakater.com/tenancy=true --label stakater.com/environment=prod
```

```bash
argocd cluster list
```

```
SERVER                          NAME         STATUS      ...
https://api.dev...:6443         dev-spoke    Successful
https://api.prod...:6443        prod-spoke   Successful
https://kubernetes.default.svc  in-cluster   Successful
```

**What just happened:** Argo CD on the hub can now reach both spokes, and
each carries its environment as a label. Nothing is deployed yet.

## Step 4: Distribute the team with one ApplicationSet

[`argocd/applicationset.yaml`](examples/argocd/applicationset.yaml) is one
`ApplicationSet`. Its cluster generator selects every spoke labelled
`stakater.com/tenancy: "true"`, and renders one Application per spoke,
pointing at the overlay for that spoke's environment.

```bash
oc --context "$HUB" apply -f argocd/applicationset.yaml
sleep 20
oc --context "$HUB" -n openshift-gitops get applications
```

```
NAME                   SYNC STATUS   HEALTH STATUS
acme-tenant-dev-spoke  Synced        Healthy
acme-tenant-prod-spoke Synced        Healthy
```

> 📷 **Screenshot to capture** (`02-argocd-applicationset.png`): Argo CD,
> Applications, both `acme-tenant-*` Applications Synced and Healthy.
> **Highlight:** the two generated Applications, one per spoke.

**What just happened:** from one `ApplicationSet`, Argo CD created one
Application per spoke, each pointing at the right overlay — dev to the dev
spoke, prod to the prod spoke — and synced the `Tenant` and `Quota` onto each.

## Step 5: See the same team, with its own budget, on each spoke

The tenant now exists on both spokes. Look at what Multi-Tenant Operator made
of it:

```bash
oc --context "$DEV"  get tenant acme
oc --context "$PROD" get tenant acme
oc --context "$DEV"  get quota acme-quota -o jsonpath='dev  cpu={.spec.resourcequota.hard.requests\.cpu} pods={.spec.resourcequota.hard.pods}{"\n"}'
oc --context "$PROD" get quota acme-quota -o jsonpath='prod cpu={.spec.resourcequota.hard.requests\.cpu} pods={.spec.resourcequota.hard.pods}{"\n"}'
```

```
dev  cpu=2 pods=5
prod cpu=20 pods=50
```

Same tenant, same `acme-apps` namespace and same owner and viewer groups on
both; the budget small on dev and large on prod. In each spoke's
Multi-Tenant Operator console, the **Tenants** page shows `acme` with its
environment's quota:

> 📷 **Screenshot to capture** (`03-mto-console-dev.png`,
> `04-mto-console-prod.png`): the Multi-Tenant Operator console on each spoke,
> Tenants → acme → Quota. **Highlight:** the dev budget (cpu 2, pods 5) on
> one, the prod budget (cpu 20, pods 50) on the other.

Now change the team once, in the base, and watch both spokes follow. Add a
second namespace to [`base/tenant.yaml`](examples/base/tenant.yaml):

```yaml
  namespaces:
    withTenantPrefix:
      - apps
      - build        # add this line
```

Commit and push, then let Argo CD sync (or **Refresh** each Application):

```bash
oc --context "$DEV"  get namespaces | grep acme-
oc --context "$PROD" get namespaces | grep acme-
```

```
acme-apps
acme-build
```

**What just happened:** one change to the base reached both clusters, because
both read the same base. You changed the team once, not once per cluster.

## Step 6: Hand the same team to Advanced Cluster Management

The same team, distributed as governance instead of GitOps. If you did steps
3 to 5, remove the `ApplicationSet` first so the two mechanisms don't both
own the tenant:

```bash
oc --context "$HUB" -n openshift-gitops delete -f argocd/applicationset.yaml
```

Advanced Cluster Management delivers Policies from the hub into a namespace
there. Create it, and make sure the spokes are in a cluster set its
Placement can select — the default `default` cluster set is fine for this
tutorial:

```bash
oc --context "$HUB" create namespace tenancy-policies
oc --context "$HUB" -n tenancy-policies apply -f - <<'EOF'
apiVersion: cluster.open-cluster-management.io/v1beta2
kind: ManagedClusterSetBinding
metadata:
  name: default
spec:
  clusterSet: default
EOF
```

## Step 7: Enforce the team with a Policy

[`rhacm/policy.yaml`](examples/rhacm/policy.yaml) is the dev environment: a
`Policy` that enforces the `Tenant` and its `Quota`, a `Placement` that binds
it to clusters labelled `stakater.com/environment: dev`, and the
`PlacementBinding` that ties them together.

```bash
oc --context "$HUB" apply -f rhacm/policy.yaml
sleep 30
oc --context "$HUB" -n tenancy-policies get policy acme-tenant-dev \
  -o jsonpath='{.status.compliant}{"\n"}'
```

```
Compliant
```

> 📷 **Screenshot to capture** (`05-rhacm-policy-compliant.png`): the RHACM
> console, Governance, the `acme-tenant-dev` policy, Compliant on the dev
> spoke. **Highlight:** the compliance status.

On the dev spoke, the tenant is there, exactly as the GitOps path made it:

```bash
oc --context "$DEV" get tenant acme
oc --context "$DEV" get quota acme-quota -o jsonpath='cpu={.spec.resourcequota.hard.requests\.cpu}{"\n"}'
```

```
cpu=2
```

**What just happened:** Advanced Cluster Management placed the Policy on every
cluster the Placement selected — the dev spoke — and enforced the tenant
there. The prod environment is the same file with the prod quota numbers and
a Placement that selects `prod`; apply it the same way.

**In production,** you'd generate these Policies from the same overlays with
the RHACM Policy Generator, so the overlay stays the single source of truth
rather than being written into the Policy by hand.

## Step 8: Watch drift get corrected

Governance re-applies what drifts. Delete the Quota directly on the spoke,
and watch Advanced Cluster Management put it back:

```bash
oc --context "$DEV" delete quota acme-quota
sleep 60
oc --context "$DEV" get quota acme-quota
```

```
NAME         AGE
acme-quota   20s
```

> 📷 **Screenshot to capture** (`06-rhacm-policy-drift.png`): the RHACM
> console, Governance, the policy going NonCompliant and back to Compliant.
> **Highlight:** the status change, before and after.

**What just happened:** the Policy is set to `enforce`, so when the spoke
drifted from the tenant, Advanced Cluster Management reconciled it back.
OpenShift GitOps does the same with self-heal; both correct drift, and both
report which clusters are in step.

## Which mechanism

Both carry the same base and overlays to the same clusters. The difference is
which platform you already run:

| | OpenShift GitOps | Advanced Cluster Management |
|---|---|---|
| The tenant lives | with the rest of your GitOps config | with the rest of your governance |
| You see | sync status per cluster, in Argo CD | compliance per cluster, in the RHACM console |
| Picks the overlay by | a cluster label, in the `ApplicationSet` | a `Placement` label selector |
| Good fit when | you already deliver platform config by GitOps | you already manage the fleet with RHACM |

Many platforms run both, and RHACM can drive OpenShift GitOps directly. The
point of this tutorial is that the team — the base and its overlays — is the
same either way.

## Clean up

```bash
# Mechanism 1, if it's still there
oc --context "$HUB" -n openshift-gitops delete -f argocd/applicationset.yaml --ignore-not-found
argocd cluster rm "$DEV"  2>/dev/null || true
argocd cluster rm "$PROD" 2>/dev/null || true

# Mechanism 2
oc --context "$HUB" delete -f rhacm/policy.yaml --ignore-not-found
oc --context "$HUB" delete namespace tenancy-policies --ignore-not-found

# The tenant on each spoke. Multi-Tenant Operator keeps a deleted tenant's
# namespaces, so delete those too.
for CTX in "$DEV" "$PROD"; do
  oc --context "$CTX" delete tenant acme --ignore-not-found
  oc --context "$CTX" delete quota acme-quota --ignore-not-found
  oc --context "$CTX" delete namespace acme-apps acme-build --ignore-not-found
done
```

To remove the operators as well, uninstall them from **Installed Operators**
on each cluster.

## What you built

One team, defined once in Git, running the same way on two clusters — same
namespaces, same access — and differing only in budget, by one overlay per
environment. You distributed it two ways, and both kept the clusters in step
and corrected drift.

| You did | What took it over | By hand, per cluster |
|---|---|---|
| Wrote the team once, with an overlay per environment | One definition, reconciled on every cluster | Create and maintain the team on each cluster |
| Added a namespace to the base | Both clusters got it | Add it on every cluster |
| Pointed one `ApplicationSet` / `Policy` at the spokes | The right overlay reached the right cluster | Decide and apply per-cluster differences by hand |
| Deleted a resource on a spoke | It was put back | Notice the drift, if anyone ever does |

What this tutorial didn't do is carry a team's slice of another *tool* across
clusters — one Vault namespace, or one Argo CD AppProject, for a team that
spans clusters. That's a different question, covered in a later article in
this series. Here, the team itself is the same on every cluster, and that's
the ground the rest stands on.

The free edition manages two tenants per cluster. When a third team arrives
on a cluster, that's where Multi-Tenant Operator Enterprise comes in.

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
