# Screenshots

Captured during the validation run on [OpenShift version], at 1440×900 and
2×, so each one matches exactly what the tutorial's steps do. Each file
fills the slot that names it in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights).

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-hub-clusters-labels.png` | 2 | The hub's console, Infrastructure → Clusters: the hub and both spokes | The label `environment=dev` on the development spoke | To capture |
| `02-mto-console-dev-tenants.png` | 5 | Multi-Tenant Operator console on the development spoke, Tenants page: `acme` and `globex` | The row `acme`, with its quota | To capture |
| `03-mto-console-prod-tenants.png` | 7 | Multi-Tenant Operator console on the production spoke, Tenants page: `acme` and `globex` | The row `acme`, with its larger quota | To capture |
| `04-hub-team-placements.png` | 7 | OpenShift GitOps on the hub, Applications: `acme`, `globex` and the guardrails on each spoke, all Synced and Healthy | The two Applications for `acme`, one per spoke | To capture |
| `05-mto-console-dev-namespaces.png` | 9 | Multi-Tenant Operator console on the development spoke, Namespaces page: `acme`'s namespaces | The namespace `acme-scratch`, under the tenant `acme` | To capture |

02, 03 and 05 are required: they are the screenshots of Multi-Tenant
Operator's own console. 02, 03 and 04 are also used in the explainer,
[post 7](../../07-tenants-across-clusters/post.md).

05 depends on step 9, which is still to be confirmed with engineering. If
step 9 changes or comes out, so does this row.
