# Rafael: validating and publishing the posts

Thank you for publishing these with us. There are two pairs, each an
explainer and its tutorial:

| Post | Type | What it does |
|---|---|---|
| [1. One tenant, from OpenShift to Vault Enterprise](01-tenants-and-vault-enterprise/post.md) | Explainer, about 2,400 words | Why: the problem, the tenant, one Vault namespace per tenant, how it works, guardrails |
| [2. Hands-on: tenants on OpenShift, carried into Vault Enterprise](02-try-it-tenants-and-vault-enterprise/post.md) | Tutorial | How: every step from an empty cluster to two isolated tenants, with screenshots |
| [3. One login, every tool](03-one-login-for-tenant-members/post.md) | Explainer | Why: one group in the identity provider decides what a person sees in OpenShift and Vault, through the tenant and Multi-Tenant Operator's Dex |
| [4. Hands-on: one login for tenant members](04-try-it-one-login-for-tenant-members/post.md) | Tutorial | How: Keycloak behind Dex, OpenShift and Vault as clients; Anna signs in, is refused in the other team, and loses access when she leaves |

Each explainer links to its tutorial. A pair can go out together or a week
apart; the second pair follows the first.

What we need from you: read the explainers, run the two tutorials on your
own cluster, tell us what breaks, then submit them to Red Hat Developer.

## 1. Read post 1

The section **"Vault configuration as Kubernetes resources"** is written for
your voice, as the Red Hat co-author and a Vault Config Operator maintainer.
Change anything that doesn't sound like you.

## 2. Run post 2

Run it on a clean OpenShift cluster with a Vault Enterprise license. If a
step fails, note the command and its output, and comment on the pull
request.

| Step | Passes when |
|---|---|
| 1. Multi-Tenant Operator | Installs from OperatorHub, version 1.10.0 or later; the patch brings up a `template-operator-v2` deployment |
| 2. Vault Enterprise | `v version` prints `Vault v2.1.1+ent`; the `vault-ui` route opens |
| 3. Vault Config Operator | The deployment rolls out on OpenShift without cert-manager |
| 4. External Secrets Operator, Reloader | Both run. **Please confirm the `ExternalSecretsConfig` resource is the right way to turn on External Secrets Operator for Red Hat OpenShift on your version** |
| 5. Vault login | All four commands succeed |
| 6. Extension | The Helm install succeeds |
| 7. Tenants | `v namespace list` shows `acme/`, `globex/` and `shared/` |
| 8. App | The log says `db password has 6 characters` |
| 9. Rotation | After the forced refresh, a new pod logs `10 characters` |
| 10. Isolation | The allowed commands succeed, both refusals are refused, and the hand-widened policy is put back |
| Optional SSO | A member of `acme-editors` signs in to tenant `acme`, and nowhere else |
| Clean up | No Vault Config Operator resources left, and no namespace stuck |

We run the same tutorial on our side first and capture its screenshots, so
by the time it reaches you it should pass. You're confirming it, not
debugging it.

## 3. Run post 4

Post 4 continues on the same cluster after post 2.

| Step | Passes when |
|---|---|
| 1. Addresses | `DEX_ISSUER` comes from the `DexConfig` resource; the trust check gives a clear answer |
| 2–3. Keycloak | The route answers; the realm script ends with `realm tenants ready` |
| 4. Connector | Dex restarts and still serves its discovery document |
| 5. Clients | Both `Client` resources apply |
| 6. OpenShift OAuth | The authentication operator settles; the login page shows "tenants" |
| 7. Tenants | `acme-editors`, `acme-viewers` and `acme-admins` are bound in `acme-shop` |
| 8. Vault | `v list -namespace=acme auth/oidc/sso/role` shows four roles |
| 9. OpenShift as Anna | She sees only `acme-shop`; `globex-web` is refused; `oc get group acme-editors` lists her |
| 10. Vault as Anna | She edits `db` in `acme`; the `globex` sign-in is refused |
| 11. Anna leaves | **Please confirm that OpenShift removes her from `acme-editors` at her next sign-in**, and that Vault refuses her |
| Clean up | The cluster is back where post 2 ended |

## 4. Submit

- Submit the posts in the format Red Hat Developer asks for. If it isn't
  Markdown, tell us and we'll convert them.
- Agree the byline order and the titles. Post 1 has three title options at
  the top.
- On publish day we make this repository public, so the example files are
  there for readers. Please give us the date ahead of time.
- After publication we repost on the Stakater blog, with canonical links to
  the Red Hat posts. Tell us if Red Hat has rules about that.

## Questions for you

- How long does Red Hat Developer review take, and what does it need from us?
- Should HashiCorp see the posts before they go out? The IBM HashiCorp team
  may publish their own version of the story.
