# Screenshots

To be captured in one validation run on OpenShift 4.22, at 1440×900 and 2×,
so each one matches exactly what the tutorial's steps do. Each file replaces
the slot that names it in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights): an
outline drawn around those elements in the page before the screenshot is
taken.

All fourteen were captured in one run on 2026-10-20, on OpenShift 4.22 with
Multi-Tenant Operator 1.10.1, Vault Enterprise 2.1.1 and Reloader v2
(chart 3.0.0-beta.2), at 2880×1800.

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-operatorhub-mto.png` | 1 | Software Catalog search for "multi tenant": the Multi Tenant Operator tile with the "Certified" badge | The Multi Tenant Operator tile | Captured |
| `02-installed-mto.png` | 1 | Installed Operators: Multi Tenant Operator 1.10.1 and its companions, "Succeeded" | The Multi Tenant Operator row and its "Succeeded" status | Captured |
| `03-operatorhub-eso.png` | 4 | Software Catalog: External Secrets Operator for Red Hat OpenShift | The External Secrets Operator for Red Hat OpenShift tile | Captured |
| `04-mto-tenants.png` | 7 | Multi Tenant Operator's Tenant tab: `acme` and `globex`, Ready | The rows `acme` and `globex` | Captured |
| `05-vault-namespaces.png` | 7 | Vault UI namespace picker: `acme`, `globex`, `shared` | The entries `acme` and `globex` | Captured |
| `06-vault-checkout-secret.png` | 8 | Vault UI in namespace `acme`: the secret `dev/acme-shop/checkout/db` | The secret's path and the key `password` | Captured |
| `07-project-tenant-label.png` | 7 | OpenShift console, project `acme-shop`, Details: the label `stakater.com/tenant=acme` | The label `stakater.com/tenant=acme` | Captured |
| `08a-mto-console-tenants.png` | 7 | Multi-Tenant Operator console, Tenants page: `acme` and `globex` | The rows `acme` and `globex` | Captured |
| `08b-mto-console-namespaces.png` | 7 | Multi-Tenant Operator console, Namespaces page: `acme-shop` under `acme`, `globex-web` under `globex` | The rows `acme-shop` and `globex-web`, with their tenant | Captured |
| `09-vco-resources.png` | 7 | OpenShift console, Home → Search: Vault Config Operator `Namespace` resources in `vault-config` | The resources `acme` and `globex` | Captured |
| `10-vault-acme-policy.png` | 8 | Vault UI, namespace `acme`, ACL policies: `kv.acme.acme-shop.checkout` and its rules | The rule granting `dev/acme-shop/checkout/` | Captured |
| `11-openshift-secret-checkout-db.png` | 8 | OpenShift console, Secret `checkout-db`: key `password`, owner ExternalSecret | The owner `ExternalSecret checkout-db` | Captured |
| `12-vault-secret-versions.png` | 9 | Vault UI, secret `db`, Version History: versions 1 and 2 | Versions 1 and 2 | Captured |
| `13-reloader-console.png` | 9 | Reloader's console: the application `checkout` in `acme-shop`, its restart, and the Secret `checkout-db` that caused it | The restart entry, and the Secret `checkout-db` as its cause | Captured |

08a, 08b and 13 are required: they are the only screenshots of Multi-Tenant
Operator's and Reloader's own consoles.

Notes from the capture:

- **01 and 03** show an "Installed" badge on the tile: the cluster had
  already run the tutorial, so the operators were installed.
- **13**'s Time column reads `1/1/1`: the alpha Reloader console shows an
  empty timestamp for the reload. Re-capture once that is fixed.
- **08b and 13** outline whole table rows; the table's edges cut the sides of
  those outlines, so they show as lines above and below the row.
