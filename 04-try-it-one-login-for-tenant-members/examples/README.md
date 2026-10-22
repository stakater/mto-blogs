# Example files

The files used by the tutorial
[Hands-on: one login for tenant members](../post.md). Follow the tutorial
for the steps.

| File | Used in | What |
|---|---|---|
| [keycloak.yaml](keycloak.yaml) | Step 2 | A learning Keycloak, standing in for your company's identity provider |
| [keycloak-realm.sh](keycloak-realm.sh) | Step 3 | Creates the realm, the groups `<tenant>-<level>s`, the users Anna and Ben, and the client Dex signs in with |
| [dex-connector.yaml](dex-connector.yaml) | Step 4 | Connects Multi-Tenant Operator's Dex to the identity provider |
| [dex-clients.yaml](dex-clients.yaml) | Step 5 | Registers OpenShift and Vault as clients of Dex |
| [tenants-with-groups.yaml](tenants-with-groups.yaml) | Step 7 | The two tenants, now granting access to groups only |
