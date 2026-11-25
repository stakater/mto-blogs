# Screenshots

Captured during the validation run on [OpenShift version], at 1440×900 and
2×, so each one matches exactly what the tutorial's steps do. Each file is
embedded at its step in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights).

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-rhacm-clusters.png` | 2 | RHACM console, Infrastructure → Clusters: the hub and the two spokes `dev` and `prod`, with their environment labels | The `stakater.com/environment` label on each spoke | To capture |
| `02-argocd-applicationset.png` | 5 | Argo CD, Applications: `acme-tenant-dev` and `acme-tenant-prod`, both Synced and Healthy | The two generated Applications, one per spoke | To capture |
| `03-mto-console-dev.png` | 6 | Multi-Tenant Operator console on the dev spoke, Tenants → acme → Quota: the small budget | The dev budget (cpu 2, pods 5) | To capture |
| `04-mto-console-prod.png` | 6 | Multi-Tenant Operator console on the prod spoke, Tenants → acme → Quota: the large budget | The prod budget (cpu 20, pods 50) | To capture |
| `05-rhacm-policy-compliant.png` | 8 | RHACM console, Governance: the `acme-tenant-dev` policy, Compliant on the dev spoke | The compliance status | To capture |
| `06-rhacm-policy-drift.png` | 9 | RHACM console, Governance: the policy going NonCompliant then back to Compliant after the Quota is deleted on the spoke | The status change, before and after | To capture |

Required: the two Multi-Tenant Operator console shots (`03`, `04`), which
show the same tenant with a different budget on each cluster — the point of
the tutorial.
