# Screenshots

To be captured in one validation run on [OpenShift version], at 1440×900 and
2×, so each one matches exactly what the tutorial's steps do. Each file
replaces the slot that names it in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights): an
outline drawn around those elements in the page before the screenshot is
taken.

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-openshift-login-tenants.png` | 9 | The OpenShift login page, with a button per identity provider, including "tenants" | The button `tenants` | To capture |
| `02-dex-chooser.png` | 9 | Dex's page asking how to sign in: "Company sign-in" and the local account | The option `Company sign-in` | To capture |
| `03-keycloak-login.png` | 9 | The Keycloak sign-in form for realm `tenants`, username `anna`, password empty | None | To capture |
| `04-openshift-anna-projects.png` | 9 | The OpenShift console as Anna, Projects page: only `acme-shop` (also post 3) | The row `acme-shop` | To capture |
| `05-openshift-anna-globex-denied.png` | 9 | The OpenShift console as Anna, on project `globex-web`: no access | The no-access message | To capture |
| `06-vault-login-oidc.png` | 10 | The Vault UI sign-in, filled in: namespace `acme`, method OIDC, mount path `oidc/sso`, role `sso.acme.editor` | The namespace field, and the role field | To capture |
| `07-vault-anna-editor.png` | 10 | The Vault UI as Anna, namespace `acme`: the secret `dev/acme-shop/checkout/db`, keys hidden, with "Create new version" (also post 3) | The button `Create new version` | To capture |
| `08-vault-anna-globex-refused.png` | 10 | The Vault UI sign-in for namespace `globex`, role `sso.globex.editor`: Vault's error | The error message | To capture |
| `09-openshift-anna-after-move.png` | 11 | The OpenShift console as Anna, signed in again after leaving `acme-editors`: Projects page, no projects | The empty project list | To capture |

**Also for post 3.** Copy `04` into
[post 3's screenshots](../../03-one-login-for-tenant-members/screenshots/),
where it fills the slot of the same name. Copy `07` over post 3's
`vault-kv-secret-editor.png`: that image comes from the extension's tests,
and the post says it's Anna.

**Nothing secret on screen.** Anna's password is never shown: leave the
field empty in `03`. No client secret, token or Vault license is visible.
