# Screenshots

To be captured in one validation run on OpenShift 4.21, at 1440×900 and 2×,
so each one matches exactly what the tutorial's steps do. Each file replaces
the slot that names it in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights): an
outline drawn around those elements in the page before the screenshot is
taken.

All eight were captured in one run on 2026-10-30, on OpenShift 4.21.32
(hosted control planes) with Multi-Tenant Operator 1.10.2, its Dex
(v2.45.1) and Vault Enterprise 2.1.1, at 2880×1800.

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-openshift-login-tenants.png` | 7 | The OpenShift login page, with a button per identity provider, including "tenants" | The button `tenants` | Captured. The other button, `admins`, is the cluster's htpasswd sign-in for administrators |
| `02-dex-login.png` | 7 | Dex's sign-in form, email address `anna@example.com`, password empty | None | Captured |
| `03-openshift-anna-projects.png` | 7 | The OpenShift console as Anna, Projects page: only `acme-shop` (also post 3) | The row `acme-shop` | Captured |
| `04-openshift-anna-globex-denied.png` | 7 | The OpenShift console as Anna, on project `globex-web`: no access | The no-access message | Captured |
| `05-vault-login-oidc.png` | 8 | The Vault UI sign-in, filled in: namespace `acme`, method OIDC, role `sso.acme.editor`, mount path `oidc/sso` | The namespace field, and the role field | Captured |
| `06-vault-anna-editor.png` | 8 | The Vault UI as Anna, namespace `acme`: the Secret tab of `dev/acme-shop/checkout/db`, keys hidden, with "Create new version" (also post 3) | The button `Create new version` | Captured |
| `07-vault-anna-globex-refused.png` | 8 | The Vault UI sign-in for namespace `globex`, role `sso.globex.editor`: Vault's error | The error message | Captured |
| `08-openshift-anna-after-move.png` | 9 | The OpenShift console as Anna, signed in again after leaving `acme-editors`: Projects page, no projects | The empty project list | Captured |

**Also for post 3.** `03` is copied into
[post 3's screenshots](../../03-one-login-for-tenant-members/screenshots/),
where it fills the slot of the same name. `06` is copied over post 3's
`vault-kv-secret-editor.png`, which came from the extension's tests.

**Nothing secret on screen.** Anna's password is never shown: the field is
empty in `02`. No client secret, token or Vault license is visible.
