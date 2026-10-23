# Screenshots

To be captured in one validation run on OpenShift 4.22 with OpenShift GitOps
1.22, at 1440×900 and 2×, so each one matches exactly what the tutorial's
steps do. Each file replaces the slot that names it in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights).

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-operatorhub-gitops.png` | 2 | Software Catalog search for "gitops": the Red Hat OpenShift GitOps tile | The Red Hat OpenShift GitOps tile | To capture |
| `02-mto-console-tenants.png` | 5 | Multi-Tenant Operator console, Tenants page: `acme` and `globex` | The rows `acme` and `globex` | To capture |
| `03-mto-console-namespaces.png` | 5 | Multi-Tenant Operator console, Namespaces page: `acme-dev`, `acme-argocd` under `acme`; `globex-dev`, `globex-argocd` under `globex` | The four namespaces, with their tenant | To capture |
| `04-argocd-projects.png` | 5 | Argo CD as an administrator, Settings → Projects: `acme`, `default`, `globex` | The projects `acme` and `globex` | To capture |
| `05-argocd-login.png` | 6 | The Argo CD sign-in page | The "Log in via OpenShift" button | To capture |
| `06-argocd-anna-apps.png` | 6 | Argo CD as Anna: the Application `hello` in project `acme`, Synced and Healthy | The Application `hello`, and its project `acme` | To capture |
| `07-argocd-hello-synced.png` | 6 | Argo CD as Anna: `hello` opened, its resource tree healthy | The Synced and Healthy status | To capture |
| `08-argocd-refused.png` | 7 | Argo CD as Anna: `wrong-destination`, with the error that `globex-dev` isn't an allowed destination | The error message | To capture |
| `09-argocd-project-destinations.png` | 8 | Argo CD as an administrator, project `acme`: destinations `acme-argocd`, `acme-dev`, `acme-prod` | The destination `acme-prod` | To capture |

02 and 03 are required: they are the only screenshots of Multi-Tenant
Operator's own console. 06 and 08 are also used in the explainer,
[post 5](../../05-tenants-and-argocd/post.md).
