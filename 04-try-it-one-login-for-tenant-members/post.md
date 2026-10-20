# Hands-on: one login for tenant members, on OpenShift and Vault

<!--
Outlet: Red Hat Developer (tutorial), then the Stakater blog, canonical link back.
Companion to post 3, "One login, every tool", which explains why.
Continues on the cluster from post 2.
Screenshots: each "Screenshot to capture" line is a slot; the files are listed in screenshots/README.md.
-->

In [One login, every tool](../03-one-login-for-tenant-members/post.md), we
showed how one group in your identity provider, such as `acme-editors`, can
decide what a person sees in OpenShift and in Vault, through the tenant.
This tutorial builds it.

By the end:

- Anna signs in to the OpenShift console with her company account, and sees
  only her team's project
- she signs in to Vault with the same account, and edits only her team's
  secrets
- she's refused in the other team, in both tools
- you remove her from the team in one place, and her access goes in both
  tools

Allow about an hour.

### Why this is a separate tutorial

The [first tutorial](../02-try-it-tenants-and-vault-enterprise/post.md)
gave apps their secrets. This one adds people, which brings in an identity
provider and a change to how OpenShift signs people in. Keeping them apart
keeps each one short enough to finish, and you can stop after the first if
apps are all you need.

## Before you start

You need the cluster from the first tutorial, with everything from it
running: Multi-Tenant Operator, Vault Enterprise with the `vault-ui` route,
Vault Config Operator, External Secrets Operator, the extension, and the two
tenants. Keep the `v` helper from it:

```bash
v() { oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault "$@"; }
```

You also need `openssl` on your machine, and a private browser window for
signing in as Anna.

The example files are in the same repository:

```bash
cd mto-blogs/04-try-it-one-login-for-tenant-members/examples
```

Here's what you'll set up:

| Piece | Job |
|---|---|
| Keycloak | Stands in for your company's identity provider: people and groups |
| Dex, which ships with Multi-Tenant Operator | The one connection to the identity provider; OpenShift and Vault are its clients |
| OpenShift OAuth | Signs people in to OpenShift through Dex, and takes their groups |
| The tenants | Name the groups that may use them |
| The Vault extension | Gives each tenant a Vault sign-in, one role per access level |

## Step 1: Collect the addresses

Every piece needs to know where the others are:

```bash
DEX_ISSUER=$(oc -n multi-tenant-operator get dexconfig dex-operator-config -o jsonpath='{.spec.issuer}')
OAUTH_HOST=$(oc -n openshift-authentication get route oauth-openshift -o jsonpath='{.spec.host}')
VAULT_UI_HOST=$(oc -n vault get route vault-ui -o jsonpath='{.spec.host}')
echo "$DEX_ISSUER  $OAUTH_HOST  $VAULT_UI_HOST"
```

`DEX_ISSUER` is the address of the Dex that Multi-Tenant Operator runs for
its own console.

Check whether your cluster's router certificate is trusted by public
certificate authorities. On most managed clusters it is:

```bash
curl -s "$DEX_ISSUER/.well-known/openid-configuration" >/dev/null && echo trusted || echo "not trusted"
```

If it says **not trusted**, save the router's certificate authority. Later
steps use it, each marked "if not trusted":

```bash
oc -n openshift-config-managed get configmap default-ingress-cert \
  -o jsonpath='{.data.ca-bundle\.crt}' > ingress-ca.crt
```

## Step 2: Start a Keycloak

Keycloak plays your company's identity provider. This one runs in dev mode
and keeps everything in memory, so use it for learning only. In production,
Dex connects to the identity provider you already have, such as Microsoft
Entra ID, Okta, LDAP or Red Hat build of Keycloak.

```bash
oc new-project keycloak
oc -n keycloak create secret generic keycloak-admin \
  --from-literal=username=admin --from-literal=password="$(openssl rand -hex 16)"
oc apply -f keycloak.yaml

KC_HOST=$(oc -n keycloak get route keycloak -o jsonpath='{.spec.host}')
oc -n keycloak set env deploy/keycloak KC_HOSTNAME="https://$KC_HOST"
oc -n keycloak rollout status deploy/keycloak --timeout=300s
```

## Step 3: Create the people and groups

[`keycloak-realm.sh`](examples/keycloak-realm.sh) creates a realm called
`tenants` with:

- the groups `<tenant>-<level>s` for both tenants, such as `acme-editors`
  and `globex-viewers`
- Anna, in `acme-editors`, and Ben, in `globex-editors`
- the client Dex signs in with, which sends each person's groups in a
  `groups` claim

```bash
DEX_KC_SECRET=$(openssl rand -hex 24)
ANNA_PASSWORD=$(openssl rand -hex 8)
BEN_PASSWORD=$(openssl rand -hex 8)

oc -n keycloak exec -i deploy/keycloak -- env \
  DEX_ISSUER="$DEX_ISSUER" DEX_CLIENT_SECRET="$DEX_KC_SECRET" \
  ANNA_PASSWORD="$ANNA_PASSWORD" BEN_PASSWORD="$BEN_PASSWORD" \
  bash -s < keycloak-realm.sh

echo "anna: $ANNA_PASSWORD   ben: $BEN_PASSWORD"
```

```
realm tenants ready: anna in acme-editors, ben in globex-editors
```

Note both passwords. You'll sign in as Anna in step 9.

## Step 4: Connect Dex to the identity provider

Multi-Tenant Operator runs Dex, and the Dex Config Operator that comes with
it turns Kubernetes resources into Dex's configuration. A `Connector`
resource points Dex at the identity provider. Its connection details go in a
Secret:

```bash
INSECURE=""   # if not trusted: INSECURE=',"insecureSkipVerify":true'
cat > connector.json <<EOF
{"issuer":"https://$KC_HOST/realms/tenants","clientID":"dex","clientSecret":"$DEX_KC_SECRET",
 "redirectURI":"$DEX_ISSUER/callback","scopes":["openid","profile","email"],
 "insecureEnableGroups":true$INSECURE}
EOF
oc -n multi-tenant-operator create secret generic keycloak-connector-config --from-file=config=connector.json
rm connector.json

oc apply -f dex-connector.yaml
```

- **`insecureEnableGroups`** passes the person's groups from Keycloak on to
  every tool. Despite its name, it's the standard Dex setting for that.
- **`insecureSkipVerify`** is only for a router certificate your cluster
  doesn't trust. Leave it out in production.

The Dex Config Operator rewrites Dex's configuration and restarts Dex. Give
it a minute.

## Step 5: Register OpenShift and Vault with Dex

Each tool becomes a `Client` of Dex, with its own secret:

```bash
oc -n multi-tenant-operator create secret generic dex-openshift-client \
  --from-literal=client-secret="$(openssl rand -hex 24)"
oc -n multi-tenant-operator create secret generic dex-vault-client \
  --from-literal=client-secret="$(openssl rand -hex 24)"

sed -e "s|<oauth-openshift host>|$OAUTH_HOST|" -e "s|<vault-ui host>|$VAULT_UI_HOST|" \
  dex-clients.yaml | oc apply -f -
```

Look at [`dex-clients.yaml`](examples/dex-clients.yaml): each client is a
dozen lines. Adding another tool to the same sign-in later takes the same
dozen lines.

## Step 6: Sign people in to OpenShift through Dex

OpenShift needs the client's secret in its own namespace:

```bash
oc -n openshift-config create secret generic dex-openshift-client \
  --from-literal=clientSecret="$(oc -n multi-tenant-operator get secret dex-openshift-client \
    -o jsonpath='{.data.client-secret}' | base64 -d)"

# if not trusted:
# oc -n openshift-config create configmap ingress-ca --from-file=ca.crt=ingress-ca.crt
```

Add Dex as an identity provider called `tenants`. The `groups` claim is the
important line: OpenShift adds each person to the OpenShift groups named in
it when they sign in.

```bash
CA=""   # if not trusted: CA=',"ca":{"name":"ingress-ca"}'
IDP='{"name":"tenants","mappingMethod":"claim","type":"OpenID","openID":{
  "clientID":"openshift","clientSecret":{"name":"dex-openshift-client"},
  "issuer":"'"$DEX_ISSUER"'","extraScopes":["email","profile","groups"],
  "claims":{"preferredUsername":["email"],"name":["name"],"email":["email"],"groups":["groups"]}'"$CA"'}}'

if [ -n "$(oc get oauth cluster -o jsonpath='{.spec.identityProviders}')" ]; then
  oc patch oauth cluster --type json -p "[{\"op\":\"add\",\"path\":\"/spec/identityProviders/-\",\"value\":$IDP}]"
else
  oc patch oauth cluster --type json -p "[{\"op\":\"add\",\"path\":\"/spec/identityProviders\",\"value\":[$IDP]}]"
fi
```

OpenShift rolls out its sign-in service. Wait until it's done:

```bash
sleep 30   # give the rollout time to start
oc wait clusteroperator authentication --for=condition=Progressing=False --timeout=600s
```

Your existing logins, such as `kubeadmin`, keep working alongside it.

## Step 7: Let the tenants name their groups

[`tenants-with-groups.yaml`](examples/tenants-with-groups.yaml) updates the
two tenants from the first tutorial. Each now grants access to groups only:

```yaml
spec:
  accessControl:
    owners:
      groups: [acme-admins]
    editors:
      groups: [acme-editors]
    viewers:
      groups: [acme-viewers]
```

```bash
oc apply -f tenants-with-groups.yaml
oc -n acme-shop get rolebindings -o wide | grep acme-
```

**What just happened:** Multi-Tenant Operator bound each group in every
project the tenant owns: `acme-admins` to `admin`, `acme-editors` to `edit`,
`acme-viewers` to `view`. When the tenant gets another project, the same
bindings follow it. The individual users from the first tutorial are gone:
groups are now the only way in.

## Step 8: Turn on sign-in for people in Vault

Give the extension the Vault client's secret, and switch on single sign-on
through Dex:

```bash
oc -n vault-config create secret generic vault-oidc-client-secret \
  --from-literal=client-secret="$(oc -n multi-tenant-operator get secret dex-vault-client \
    -o jsonpath='{.data.client-secret}' | base64 -d)"

helm upgrade mto-extension-vault-enterprise-bootstrap \
  oci://ghcr.io/stakater/public/charts/mto-extension-vault-enterprise-bootstrap \
  -n vault-config --reuse-values \
  --set parent.sso.enabled=true \
  --set parent.sso.issuerUrl="$DEX_ISSUER" \
  --set tenantValues.sso.oidc.clientId=vault \
  --set "parent.sso.allowedRedirectUris={http://localhost:8250/oidc/callback,https://$VAULT_UI_HOST/ui/vault/auth/oidc/sso/oidc/callback}"
  # if not trusted, add: --set-file tenantValues.sso.oidc.caBundlePem=ingress-ca.crt
```

Within a minute, each tenant's Vault namespace has an OIDC sign-in with one
role per access level:

```bash
v list -namespace=acme auth/oidc/sso/role
```

```
Keys
----
sso.acme.admin
sso.acme.audit-read
sso.acme.editor
sso.acme.viewer
```

Each role accepts only its own group. `sso.acme.editor` accepts members of
`acme-editors`, and nobody else.

## Step 9: Anna signs in to OpenShift

Open the console in a private browser window:

```bash
oc whoami --show-console
```

On the login page, choose **tenants**.

> 📷 **Screenshot to capture:** the OpenShift login page, with the
> "tenants" identity provider.

Dex asks how to sign in. Choose **Company sign-in**. (The other option is
the local account Multi-Tenant Operator creates for its own console.)

> 📷 **Screenshot to capture:** Dex's sign-in choice, with "Company
> sign-in".

Sign in to Keycloak as `anna`, with her password from step 3.

> 📷 **Screenshot to capture:** the Keycloak sign-in form for realm
> `tenants`.

Anna lands in the console and sees one project: `acme-shop`.

> 📷 **Screenshot to capture:** the OpenShift console as Anna, with only
> `acme-shop` in the project list.

Now try the other team's project. Open
`https://<console>/k8s/cluster/projects/globex-web`. Anna has no access.

> 📷 **Screenshot to capture:** Anna opening `globex-web`, with no access.

**What just happened:** Dex sent OpenShift Anna's groups, and OpenShift
added her to its group `acme-editors`, which Multi-Tenant Operator had
bound in step 7. Check it as an administrator:

```bash
oc get group acme-editors
```

```
NAME           USERS
acme-editors   anna@example.com
```

## Step 10: Anna signs in to Vault

Open the Vault UI in the same private window:

```bash
echo "https://$VAULT_UI_HOST"
```

Sign in with:

- **Namespace:** `acme`
- **Method:** OIDC
- **Mount path** (under "More options"): `oidc/sso`
- **Role:** `sso.acme.editor`

> 📷 **Screenshot to capture:** the Vault sign-in page with namespace
> `acme`, method OIDC, mount path `oidc/sso` and role `sso.acme.editor`.

Vault sends Anna through the same sign-in. She's already signed in to
Keycloak, so she comes straight back. Open `kv`, then
`dev/acme-shop/checkout/db`. She sees the secret's keys, and **Create new
version**, because she's an editor.

> 📷 **Screenshot to capture:** Anna in Vault, viewing the secret `db`, with
> "Create new version".

Sign out, and try the other team: namespace `globex`, role
`sso.globex.editor`. Vault refuses, because Anna isn't in `globex-editors`.

> 📷 **Screenshot to capture:** the refused sign-in to namespace `globex`.

## Step 11: Anna leaves the team

Remove Anna from `acme-editors` in Keycloak, the one place her team
membership lives:

```bash
oc -n keycloak exec -i deploy/keycloak -- bash -s <<'EOF'
K=/opt/keycloak/bin/kcadm.sh
$K config credentials --server http://localhost:8080 --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null
uid=$($K get users -r tenants -q username=anna -q exact=true --fields id --format csv --noquotes)
gid=$($K get groups -r tenants -q search=acme-editors -q exact=true --fields id --format csv --noquotes)
$K delete "users/$uid/groups/$gid" -r tenants
echo "anna removed from acme-editors"
EOF
```

Sessions Anna already has last until they expire. A leaver process ends them
straight away. End her OpenShift sessions:

```bash
oc get oauthaccesstokens -o custom-columns=NAME:.metadata.name,USER:.userName --no-headers \
  | awk '$2=="anna@example.com" {print $1}' | xargs -r oc delete oauthaccesstokens
```

Now Anna signs in again, in a new private window:

- **OpenShift:** she signs in, and has no projects. OpenShift took her out of
  `acme-editors` because her groups claim no longer has it.
- **Vault:** her sign-in to `acme` as `sso.acme.editor` is refused.

> 📷 **Screenshot to capture:** the OpenShift console as Anna after leaving
> the group, with no projects.

```bash
oc get group acme-editors
```

```
NAME           USERS
acme-editors
```

Nobody touched OpenShift's role bindings or Vault's configuration. One
change in the identity provider, and her access went everywhere.

## Clean up

To undo this tutorial and return to where the first one ended:

```bash
# OpenShift: remove the "tenants" identity provider
IDX=$(( $(oc get oauth cluster -o jsonpath='{range .spec.identityProviders[*]}{.name}{"\n"}{end}' \
  | grep -n -x tenants | cut -d: -f1) - 1 ))
oc patch oauth cluster --type json -p "[{\"op\":\"remove\",\"path\":\"/spec/identityProviders/$IDX\"}]"
oc -n openshift-config delete secret dex-openshift-client
oc -n openshift-config delete configmap ingress-ca --ignore-not-found

# Vault: turn sign-in for people off again
helm upgrade mto-extension-vault-enterprise-bootstrap \
  oci://ghcr.io/stakater/public/charts/mto-extension-vault-enterprise-bootstrap \
  -n vault-config --reuse-values --set parent.sso.enabled=false
oc -n vault-config delete secret vault-oidc-client-secret

# Dex: remove the clients and the connector
oc delete -f dex-clients.yaml -f dex-connector.yaml
oc -n multi-tenant-operator delete secret dex-openshift-client dex-vault-client keycloak-connector-config

# The tenants as they were, and Keycloak
oc apply -f ../../02-try-it-tenants-and-vault-enterprise/examples/tenants.yaml
oc delete project keycloak
```

## What you built

One identity provider holds who is in which team. Multi-Tenant Operator's
Dex connects it to every tool. The tenant decides what each group means:
`acme-editors` edits `acme`'s projects in OpenShift and `acme`'s secrets in
Vault, and nothing else. Joiners, movers and leavers are one change in one
place.

Each new tool joins the same way: a `Client` for Dex, and the same groups.
That's how the next tools in this series, such as Argo CD and Grafana, will
follow the tenant too.

You're still on the free edition's two tenants. When a third team arrives,
that's where Multi-Tenant Operator Enterprise comes in.

## About Multi-Tenant Operator

Multi-Tenant Operator, from Stakater, turns a shared OpenShift cluster into
a platform of tenants. Each team is defined once, and that boundary reaches
its projects, its access, its quotas, its costs and, through extensions,
tools such as Vault. It's a Red Hat certified operator, available in
OperatorHub.

- **Try it free:** the Basic edition manages up to two tenants, with no
  expiry and no capability held back.
- **Learn more:** [docs.stakater.com/mto](https://docs.stakater.com/mto/)
- **Running more than two teams?** Multi-Tenant Operator Enterprise adds
  unlimited tenants and a support commitment. Contact
  [sales@stakater.com](mailto:sales@stakater.com).

---

*Ayesha Arshad, Stakater. Rasheed Amir, Stakater. Raffaele Spazzoli, Red Hat.*
