# Example files

The files used by the tutorial
[Hands-on: one login for tenant members](../post.md). Follow the tutorial
for the steps.

| File | Used in | What |
|---|---|---|
| [dex-people.yaml](dex-people.yaml) | Step 2 | Anna and Ben, as people kept in Multi-Tenant Operator's Dex. Their email, password hash and groups are in Secrets the tutorial creates |
| [dex-clients.yaml](dex-clients.yaml) | Step 3 | Registers OpenShift and Vault as clients of Dex |
| [tenants-with-groups.yaml](tenants-with-groups.yaml) | Step 5 | The two tenants, now granting access to groups only |
| [dex-connector.yaml](dex-connector.yaml) | Use your own identity provider | Connects Multi-Tenant Operator's Dex to your company's identity provider, in place of the tutorial's people |
