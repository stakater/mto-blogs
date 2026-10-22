# Screenshots to capture

Captured during the validation run on a real OpenShift cluster, at 1440×900.
Each file replaces its "Screenshot to capture" slot in [post.md](../post.md),
and two of them also fill the slots in post 3.

| File | Step | Shows |
|---|---|---|
| `01-openshift-login-tenants.png` | 9 | The OpenShift login page, with the "tenants" identity provider |
| `02-dex-chooser.png` | 9 | Dex's sign-in choice, with "Company sign-in" |
| `03-keycloak-login.png` | 9 | The Keycloak sign-in form for realm `tenants` |
| `04-openshift-anna-projects.png` | 9 | The OpenShift console as Anna: only `acme-shop` (also post 3) |
| `05-openshift-anna-globex-denied.png` | 9 | Anna opening `globex-web`: no access |
| `06-vault-login-oidc.png` | 10 | The Vault UI sign-in: namespace `acme`, method OIDC, role `sso.acme.editor` |
| `07-vault-anna-editor.png` | 10 | Anna in Vault: the secret `db`, with "Create new version" |
| `08-vault-anna-globex-refused.png` | 10 | Anna signing in to namespace `globex`: refused |
| `09-openshift-anna-after-move.png` | 11 | The OpenShift console as Anna after she leaves the group: no projects |
