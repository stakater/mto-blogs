# Try it: tenants on OpenShift, carried into Vault Enterprise

The companion guide to [post 1](../post.md). You start with an OpenShift
cluster, and you finish with two tenants that each have their own Vault
namespace, an app reading its secret from Vault, a rotation that reaches the
running pod, and proof that each tenant can't read the other's secrets.

Allow about an hour.

## What you need

- An OpenShift 4 cluster, and `cluster-admin` on it.
- A **Vault Enterprise license**, for Vault 2.1 or later. You bring your own.
- `oc` and `helm` on your machine. You don't need the `vault` CLI: every
  Vault command runs inside the Vault pod.
- This folder, checked out locally:

  ```bash
  git clone https://github.com/stakater/mto-blogs.git
  cd mto-blogs/01-tenants-and-vault-enterprise/examples
  ```

What you'll install:

| Component | Version | From |
|---|---|---|
| Multi-Tenant Operator, with the Template Operator it ships | 1.10.0 or later | OperatorHub |
| Vault Enterprise | 2.1.1 | HashiCorp Helm chart |
| Vault Config Operator | v1.0.3 or later | Red Hat Community of Practice Helm chart |
| External Secrets Operator | current | OperatorHub |
| Reloader | current | Stakater Helm chart |
| The Vault Enterprise extension | current | `oci://ghcr.io/stakater/charts` |

The Multi-Tenant Operator Basic edition is free with no expiry, and manages
up to two tenants. That's exactly what this guide uses.

## 1. Install Multi-Tenant Operator

In the OpenShift console, go to **Operators → OperatorHub**, search for
**Multi-Tenant Operator**, and install it with the defaults. It installs into
the `multi-tenant-operator` namespace.

Then switch on Template Operator, which Multi-Tenant Operator deploys and
manages for you:

```bash
oc -n multi-tenant-operator patch integrationconfig tenant-operator-config \
  --type merge -p '{"spec":{"components":{"templateOperatorV2":{"mode":"Managed"}}}}'
```

Wait for it to run, and note the namespace and ServiceAccount it runs as.
You'll need both in step 6:

```bash
oc get deploy -A -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,SA:.spec.template.spec.serviceAccountName \
  | grep template-operator-v2
```

```bash
export TOP_NS=<namespace from the output>
export TOP_SA=<ServiceAccount from the output>
```

## 2. Install Vault Enterprise

Skip this step if you already run Vault Enterprise 2.1 or later and can
reach it from the cluster. The rest of the guide assumes the address
`http://vault.vault.svc:8200`, so change it where it appears.

For learning, run a single Vault pod in dev mode. It keeps everything in
memory, so a restart wipes it, and it is **not** for production.

```bash
oc new-project vault
oc -n vault create secret generic vault-ent-license --from-file=license=/path/to/vault.hclic

helm repo add hashicorp https://helm.releases.hashicorp.com
helm upgrade --install vault hashicorp/vault --version 0.34.1 -n vault \
  --set global.openshift=true \
  --set server.dev.enabled=true \
  --set server.dev.devRootToken=root \
  --set server.authDelegator.enabled=true \
  --set server.image.repository=hashicorp/vault-enterprise \
  --set server.image.tag=2.1.1-ent \
  --set server.enterpriseLicense.secretName=vault-ent-license \
  --set injector.enabled=false

oc -n vault wait --for=condition=Ready pod/vault-0 --timeout=300s
```

Two helpers run the `vault` CLI inside the pod. `v` uses the root token, and
`vt` uses a token you pass in:

```bash
v()  { oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault "$@"; }
vt() { local t=$1; shift; oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$t" vault "$@"; }

v version    # Vault v2.1.1+ent
```

## 3. Install Vault Config Operator

```bash
helm repo add vault-config-operator https://redhat-cop.github.io/vault-config-operator
helm upgrade --install vault-config-operator vault-config-operator/vault-config-operator \
  --version v1.0.3 -n vault-config-operator --create-namespace \
  --set 'env[0].name=VAULT_ADDR'             --set 'env[0].value=http://vault.vault.svc:8200' \
  --set 'env[1].name=ENABLE_DRIFT_DETECTION' --set-string 'env[1].value=true' \
  --set 'env[2].name=SYNC_PERIOD_SECONDS'    --set-string 'env[2].value=60' \
  --set 'env[3].name=CACHE_VAULT_TOKEN'      --set-string 'env[3].value=true'

oc -n vault-config-operator rollout status deploy/vault-config-operator --timeout=300s
```

- **Drift detection** every 60 seconds makes Vault Config Operator put back
  anything changed by hand in Vault. You'll see it in step 10.
- **`CACHE_VAULT_TOKEN`** makes it reuse one Vault token, instead of logging
  in again on every check.

## 4. Install External Secrets Operator and Reloader

**External Secrets Operator:** in **Operators → OperatorHub**, install
**External Secrets Operator for Red Hat OpenShift** with the defaults. Then
tell it to deploy External Secrets Operator:

```bash
cat <<'YAML' | oc apply -f -
apiVersion: operator.openshift.io/v1alpha1
kind: ExternalSecretsConfig
metadata:
  name: cluster
spec: {}
YAML

oc get crd externalsecrets.external-secrets.io    # present once it is running
```

**Reloader:**

```bash
helm repo add stakater https://stakater.github.io/stakater-charts
helm upgrade --install reloader stakater/reloader -n reloader --create-namespace \
  --set reloader.isOpenshift=true
```

## 5. Give Vault Config Operator its login to Vault (one time)

Vault Config Operator logs in to Vault **once**, in the root namespace, with
the Kubernetes auth method. From there it writes into each tenant's Vault
namespace. The policy in [`vco-admin-policy.hcl`](vco-admin-policy.hcl)
grants only the paths the extension needs. It also **denies deletes** on the
tenants' Vault namespaces and KV mounts, so removing a tenant never deletes
its secrets.

```bash
v auth enable kubernetes
v write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc:443
v policy write vco-admin - < vco-admin-policy.hcl
v write auth/kubernetes/role/vco-admin \
  bound_service_account_names=vco-admin \
  bound_service_account_namespaces=vault-config \
  token_policies=vco-admin token_ttl=1h
```

Vault reviews the cluster's tokens with its own ServiceAccount. The Helm
chart bound that ServiceAccount to `system:auth-delegator` in step 2, so no
reviewer credential is stored anywhere.

## 6. Install the extension

```bash
helm upgrade --install mto-extension-vault-enterprise-bootstrap \
  oci://ghcr.io/stakater/charts/mto-extension-vault-enterprise-bootstrap \
  -n vault-config --create-namespace \
  --set parent.vaultServer=http://vault.vault.svc:8200 \
  --set templateOperator.namespace="$TOP_NS" \
  --set templateOperator.serviceAccountName="$TOP_SA"
```

The chart creates the `vco-admin` ServiceAccount that step 5 bound in Vault,
and it watches every `Tenant`.

## 7. Create two tenants

```bash
oc apply -f tenants.yaml
```

Multi-Tenant Operator creates `acme-shop` and `globex-web`, and labels each
with its tenant. Within a minute, Vault has a Vault namespace per tenant:

```bash
v namespace list
# acme/
# globex/
# shared/     <- where tenants share with each other, when they choose to

v secrets list -namespace=acme      # kv/ is the tenant's own KV engine
v auth list -namespace=acme         # kubernetes/workloads/ is its workload login
```

## 8. Deploy an app that reads its secret

Put a secret at the app's own path in tenant `acme`'s Vault namespace:

```bash
v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=s3cr3t
```

Deploy the app. Its ServiceAccount asks for its own KV prefix, and its
Deployment asks for one key from it (see [`checkout.yaml`](checkout.yaml)):

```bash
oc apply -f checkout.yaml
oc -n acme-shop get configmap vault-config-checkout     # the Vault settings the app got
oc -n acme-shop get externalsecret,secret checkout-db   # delivered by External Secrets Operator
oc -n acme-shop logs deploy/checkout
# db password has 6 characters
```

The app prints the length of the secret, not its value.

## 9. Rotate the secret

```bash
v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=n3w-s3cr3t
```

External Secrets Operator picks up the change on its next refresh, which is
every hour by default. To skip the wait, force a refresh:

```bash
oc -n acme-shop annotate externalsecret checkout-db force-sync="$(date +%s)" --overwrite
```

Reloader sees that the Secret changed and rolls the pod:

```bash
oc -n acme-shop rollout status deploy/checkout
oc -n acme-shop logs deploy/checkout
# db password has 10 characters
```

## 10. Check the isolation

Give tenant `globex` an app, and log in to Vault as that app, with its own
ServiceAccount token:

```bash
oc apply -f web.yaml
JWT=$(oc -n globex-web create token web)
ROLE=$(oc -n globex-web get configmap vault-config-web -o jsonpath='{.data.VAULT_K8S_ROLE}')
GLOBEX=$(v write -namespace=globex -field=token auth/kubernetes/workloads/login \
  role="$ROLE" jwt="$JWT")
```

**Allowed:** globex's app writes and reads in its own place:

```bash
vt "$GLOBEX" kv put -namespace=globex -mount=kv dev/globex-web/web/api key=abc
vt "$GLOBEX" kv get -namespace=globex -mount=kv dev/globex-web/web/api
```

**Refused:** the same token can't read tenant `acme`'s secret:

```bash
vt "$GLOBEX" kv get -namespace=acme -mount=kv dev/acme-shop/checkout/db
# Code: 403. Errors: * permission denied
```

**Refused:** globex's ServiceAccount can't log in with acme's role:

```bash
ACME_ROLE=$(oc -n acme-shop get configmap vault-config-checkout -o jsonpath='{.data.VAULT_K8S_ROLE}')
v write -namespace=acme auth/kubernetes/workloads/login role="$ACME_ROLE" jwt="$JWT"
# refused: the role is bound to acme-shop/checkout only
```

**Drift is reverted:** widen the app's policy by hand, then wait a minute:

```bash
v policy list -namespace=acme                 # the app's policy is kv.acme.acme-shop.checkout
v policy read -namespace=acme kv.acme.acme-shop.checkout
echo 'path "*" { capabilities = ["read","list"] }' | v policy write -namespace=acme kv.acme.acme-shop.checkout -
sleep 90
v policy read -namespace=acme kv.acme.acme-shop.checkout   # back to what it was
```

## Optional: single sign-on for people

The extension can also give each tenant an OIDC login for people. Each
tenant gets four tiers, `viewer`, `editor`, `admin` and `audit-read`, and each
tier maps to an identity-provider group named `<tenant>-<tier>s`, such as
`acme-editors`.

You need an OIDC identity provider (for example Red Hat build of Keycloak)
with a client for Vault. Store the client's secret, then turn SSO on in the
extension:

```bash
oc -n vault-config create secret generic vault-oidc-client-secret \
  --from-literal=client-secret='<the client secret>'

helm upgrade mto-extension-vault-enterprise-bootstrap \
  oci://ghcr.io/stakater/charts/mto-extension-vault-enterprise-bootstrap \
  -n vault-config --reuse-values \
  --set parent.sso.enabled=true \
  --set parent.sso.issuerUrl=https://<your identity provider's issuer URL> \
  --set tenantValues.sso.oidc.clientId=<the client ID, default vault>
```

Every tenant now has an OIDC login at `oidc/sso`. A member of `acme-editors`
signs in to tenant `acme` with:

```bash
VAULT_NAMESPACE=acme vault login -method=oidc -path=oidc/sso role=sso.acme.editor
```

By default the login accepts only the Vault CLI's local callback. For browser
logins in the Vault UI, also set `parent.sso.allowedRedirectUris` to your
Vault UI's callback URL.

## Clean up

Remove things in this order. The order matters, because Vault Config
Operator still needs its login and RBAC to finish removing what it wrote.

```bash
oc delete -f checkout.yaml -f web.yaml
oc delete -f tenants.yaml
oc -n vault-config delete templateinstances.templates.v2.stakater.com mto-extension-vault-enterprise-parent --wait
oc -n vault-config get namespaces.redhatcop.redhat.io,policies.redhatcop.redhat.io   # wait until none are left
helm uninstall mto-extension-vault-enterprise-bootstrap -n vault-config
```

Use the full resource name `templateinstances.templates.v2.stakater.com`. On
OpenShift, the short name `templateinstance` means OpenShift's own template
resource.

Because the policy denies deleting Vault namespaces, the tenants' Vault
namespace resources stay `Terminating`. That's on purpose: deleting a
tenant's data is a person's decision. In this learning setup, uninstall Vault
(which wipes its in-memory data), then remove the finalizers:

```bash
helm uninstall vault -n vault
for r in $(oc -n vault-config get namespaces.redhatcop.redhat.io,secretenginemounts.redhatcop.redhat.io -o name); do
  oc -n vault-config patch "$r" --type merge -p '{"metadata":{"finalizers":null}}'
done
```
