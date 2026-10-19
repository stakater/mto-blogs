# Screenshots

Captured during the validation run on a real OpenShift 4.22 cluster, at
1440×900, so each one matches exactly what the tutorial's steps do. Each file
is embedded at its step in [post.md](../post.md).

| File | Step | Shows |
|---|---|---|
| `01-operatorhub-mto.png` | 1 | Software Catalog search for "multi tenant": the Multi Tenant Operator tile with the "Certified" badge |
| `02-installed-mto.png` | 1 | Installed Operators: Multi Tenant Operator 1.10.1 and its companions, "Succeeded" |
| `03-operatorhub-eso.png` | 4 | Software Catalog: External Secrets Operator for Red Hat OpenShift |
| `04-mto-tenants.png` | 7 | Multi Tenant Operator's Tenant tab: `acme` and `globex`, Ready |
| `05-vault-namespaces.png` | 7 | Vault UI namespace picker: `acme`, `globex`, `shared` |
| `06-vault-checkout-secret.png` | 8 | Vault UI in namespace `acme`: the secret `dev/acme-shop/checkout/db` |
| `07-project-tenant-label.png` | 7 | OpenShift console, project `acme-shop`, Details: the label `stakater.com/tenant=acme` |
| `08-mto-console-tenant.png` | 7 | Multi-Tenant Operator console, tenant `acme`: its project and quota |
| `09-vco-resources.png` | 7 | OpenShift console, Vault Config Operator `Namespace` resources in `vault-config` |
| `10-vault-acme-policy.png` | 8 | Vault UI, namespace `acme`, Policies: `kv.acme.acme-shop.checkout` and its rules |
| `11-openshift-secret-checkout-db.png` | 8 | OpenShift console, Secret `checkout-db`: key `password`, owner ExternalSecret |
| `12-vault-secret-versions.png` | 9 | Vault UI, secret `db`, Version History: versions 1 and 2 |

Rows 07 to 12 are still to capture: each has a "Screenshot to capture" slot
in the post.
