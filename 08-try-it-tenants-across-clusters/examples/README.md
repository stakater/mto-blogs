# Example files

The files used by the tutorial
[Hands-on: one tenant, on every cluster](../post.md). Follow the tutorial
for the steps.

Each team is defined once, under [`teams/`](teams/): a base, which is the
team, and an overlay per environment, which changes only the budget. The
files under [`hub/`](hub/) are applied on the hub. They decide which
clusters each team is placed on, and deliver it there.

| File | Used in | What |
|---|---|---|
| [hub/gitops-clusters.yaml](hub/gitops-clusters.yaml) | Step 1 | Connects Advanced Cluster Management to OpenShift GitOps: every cluster with an `environment` label is registered in the hub's Argo CD |
| [teams/acme/](teams/acme/), [teams/globex/](teams/globex/) | Steps 4, 7 | The two teams. `base/` holds the `Tenant` and its `Quota`; `overlays/dev` and `overlays/prod` change the budget |
| [Makefile](Makefile), [test/render_test.sh](test/render_test.sh) | Steps 4, 7 | `make render` shows what each cluster receives; `make test` proves the overlays hold, without a cluster |
| [hub/placements.yaml](hub/placements.yaml) | Step 5 | The environments: clusters labeled `environment=dev`, and clusters labeled `environment=prod` |
| [hub/teams.yaml](hub/teams.yaml) | Step 5 | One `ApplicationSet` that delivers each team's overlay to every cluster in its environment |

The files under `hub/` have not run on a cluster yet. The tutorial's
validation run checks them.

## Check the examples without a cluster

Every team renders the same in each environment, with its own budget. You
can prove that before you touch a cluster:

```bash
make test
```

```
ok   | acme dev: the Tenant
ok   | acme prod: the Tenant
ok   | acme: Tenant identical in dev and prod
...
PASS: every team renders the same in each environment, with its own budget.
```

It needs only `kubectl` (for `kubectl kustomize`) or `kustomize` on your
path. This is the quick gate. The tutorial is the full proof, on real
clusters.
