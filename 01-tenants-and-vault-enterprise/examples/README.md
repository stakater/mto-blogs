# Try it: tenants on OpenShift, carried into Vault Enterprise

The companion to [post 1](../post.md). It takes you from an OpenShift cluster
to a pod reading a secret from its tenant's own Vault namespace.

You need:

- an OpenShift cluster and `cluster-admin`
- Vault Enterprise **2.1 or later**, with your own license, reachable from the
  cluster
- `oc`, `helm` and the `vault` CLI

The Multi-Tenant Operator Basic edition is free and manages up to two tenants,
which is exactly what this example uses.

> **Draft:** steps marked TODO haven't been run end to end on OpenShift yet.
> They must be before the post is submitted.

## 1. Install Multi-Tenant Operator

In the OpenShift console, go to **Operators → OperatorHub**, search for
**Multi-Tenant Operator**, and install it. The installation guide is at
<https://docs.stakater.com/mto/>.

## 2. Install the supporting operators

- **Vault Config Operator v1.0.3 or later.** <!-- TODO: OperatorHub or its
  release chart; give the exact command -->
- **Template Operator v2, version 0.0.5 or later.** <!-- TODO: how readers
  get it, and confirm it is publicly available -->
- **External Secrets Operator.** <!-- TODO: OperatorHub channel -->
- **Reloader.** <!-- TODO: OperatorHub or Helm -->

## 3. Let Vault Config Operator log in to Vault (one time)

A Vault admin runs this in Vault's root namespace. The policy file is in the
extension repository at
[`charts/examples/vco-admin-policy.hcl`](https://github.com/stakater/mto-extension-vault-enterprise/blob/main/charts/examples/vco-admin-policy.hcl).
<!-- TODO: confirm the extension repo's public URL -->

```bash
vault auth enable kubernetes
vault write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc:443
vault policy write vco-admin vco-admin-policy.hcl
vault write auth/kubernetes/role/vco-admin \
  bound_service_account_names=vco-admin \
  bound_service_account_namespaces=vault-config \
  token_policies=vco-admin token_ttl=1h
```

The recommended policy denies deletes on the tenants' Vault namespaces and
mounts, so removing a tenant never deletes its secrets.

## 4. Install the extension

```bash
helm upgrade --install mto-extension-vault-enterprise-bootstrap \
  oci://ghcr.io/stakater/charts/mto-extension-vault-enterprise-bootstrap \
  -n vault-config --create-namespace \
  --set parent.vaultServer=https://vault.example.com:8200
```

## 5. Create two tenants

```bash
oc apply -f tenants.yaml
```

Vault now has two Vault namespaces, `acme` and `globex`, each with its own
`kv/` mount and `kubernetes/workloads/` auth method:

```bash
vault namespace list
```

## 6. Deploy an app that reads its secret

Write the secret into the app's own path in tenant `acme`'s Vault namespace:

```bash
VAULT_NAMESPACE=acme vault kv put -mount=kv dev/acme-shop/checkout/db password=s3cr3t
```

Deploy the app:

```bash
oc apply -f checkout.yaml
oc -n acme-shop logs deploy/checkout
```

The log line shows the pod received the password. It prints the length, not
the value.

## 7. See the isolation

<!-- TODO: a short command that shows a globex-web workload refused (403)
when it tries to read acme's path. Take it from the extension's e2e
"isolation" step. -->

## 8. Rotate the secret

```bash
VAULT_NAMESPACE=acme vault kv put -mount=kv dev/acme-shop/checkout/db password=n3w-s3cr3t
```

External Secrets Operator picks up the new value on its next refresh. The
default refresh is one hour, so for the demo you can force it:

```bash
oc -n acme-shop annotate externalsecret checkout-db force-sync=$(date +%s) --overwrite
```

Reloader sees the changed Secret and rolls the pod.
