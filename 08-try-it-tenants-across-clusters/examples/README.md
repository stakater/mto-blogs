# Example files

The files used by the tutorial
[Hands-on: one tenant, on every cluster](../post.md). Follow the tutorial
for the steps.

The team is defined once, in [`base/`](base/). Each cluster's environment is
an overlay in [`overlays/`](overlays/) that changes only the budget. The two
distribution folders carry that same base-plus-overlay to the spokes two
different ways.

| File | Used in | What |
|---|---|---|
| [base/](base/) | Steps 3, 5 | The `acme` tenant, defined once: its identity, access and namespaces, with a middling `Quota` the overlays replace |
| [overlays/dev/](overlays/dev/) | Steps 5, 7 | The dev cluster: the same tenant, with a smaller budget |
| [overlays/prod/](overlays/prod/) | Steps 5, 7 | The prod cluster: the same tenant, with a larger budget |
| [argocd/applicationset.yaml](argocd/applicationset.yaml) | Step 5 | Mechanism 1: one `ApplicationSet` on the hub, fanning the right overlay to each spoke by label |
| [rhacm/policy.yaml](rhacm/policy.yaml) | Step 8 | Mechanism 2: a `Policy`, `Placement` and `PlacementBinding` that enforce the same tenant as RHACM governance (dev; prod mirrors it) |
| [Makefile](Makefile), [test/render_test.sh](test/render_test.sh) | Before you start | `make render` shows what each cluster receives; `make test` proves the overlays hold, without a cluster |

## Check the examples without a cluster

Both overlays render the same team with its own budget. You can prove that
before you touch a cluster:

```bash
make test
```

```
ok   | dev: Tenant acme
ok   | prod: Tenant acme
...
PASS: every overlay renders the same team with its own budget.
```

It needs only `kubectl` (for `kubectl kustomize`) or `kustomize` on your
path. This is the quick gate; the tutorial is the full proof, on real
clusters.
