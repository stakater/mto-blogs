# Example files

The files used by the tutorial
[Hands-on: tenants on OpenShift, carried into Vault Enterprise](../post.md).
Follow the tutorial for the steps.

| File | Used in | What |
|---|---|---|
| [vco-admin-policy.hcl](vco-admin-policy.hcl) | Step 5 | Vault Config Operator's policy: only the paths the extension needs, no deletes on tenant data |
| [tenants.yaml](tenants.yaml) | Step 7 | Two tenants, `acme` and `globex` |
| [checkout.yaml](checkout.yaml) | Step 8 | Tenant `acme`'s app, which reads its database password from Vault |
| [web.yaml](web.yaml) | Step 10 | Tenant `globex`'s app, used to prove the isolation |
