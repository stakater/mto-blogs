# Screenshots

Captured in one validation run, at 1440×900 and 2×, so each one matches
exactly what the tutorial's steps do. Each file fills the slot that names it
in [post.md](../post.md).

**Highlight** is what the capture marks on the screen, following the
[screenshot guideline](../../docs/guidelines/screenshots.md#highlights).

All were captured on OpenShift 4.21.32 (hosted control planes) with
OpenShift GitOps 1.22.2 (Argo CD v3.5.5), Multi-Tenant Operator 1.10.2 and
the extension's chart 0.8.0, at 2880×1800: 01 to 05 on 2026-11-02, and 06 to
10 on 2026-11-03.

| File | Step | Shows | Highlight | Status |
|---|---|---|---|---|
| `01-operatorhub-gitops.png` | 2 | Software Catalog search for "gitops": the Red Hat OpenShift GitOps tile | The Red Hat OpenShift GitOps tile | Captured, before the install |
| `02-mto-console-tenants.png` | 5 | Multi-Tenant Operator console, Tenants page: `acme` and `globex` | The rows `acme` and `globex` | Captured |
| `03-mto-console-namespaces.png` | 5 | Multi-Tenant Operator console, Namespaces page: `acme-dev`, `acme-argocd` under `acme`; `globex-dev`, `globex-argocd` under `globex` | The four namespaces, with their tenant | Captured. The table is sorted by the Tenant column, so the four namespaces are at the top |
| `04-argocd-projects.png` | 5 | Argo CD as an administrator, Settings → Projects: `acme`, `default`, `globex` | The projects `acme` and `globex` | Captured. The administrator must be in the group `cluster-admins` to see the projects |
| `05-argocd-login.png` | 6 | The Argo CD sign-in page | The "Log in via OpenShift" button | Captured |
| `06-argocd-anna-apps.png` | 6 | Argo CD as Anna: the Application `hello` in AppProject `acme`, Synced and Healthy | The Application `hello`, and its AppProject `acme` | Captured. They are close together, so one box holds both |
| `07-argocd-hello-synced.png` | 6 | Argo CD as Anna: `hello` opened, its resource tree healthy | The Synced and Healthy status | Captured. The left bar is collapsed and the tree zoomed to 90%, so the Pod fits |
| `08-argocd-refused.png` | 7 | Argo CD as Anna: `wrong-destination`, with the error that `globex-dev` isn't an allowed destination | The error message | Captured. Argo CD shows the conditions in a panel over the page, so the Application's name isn't on the screen |
| `08b-argocd-carl-viewer.png` | 8 | Argo CD as Carl, a viewer: `hello` in AppProject `acme`, with a permission error after trying to sync it | The Application `hello`, and the permission error | Captured. The error is a notification that closes after a few seconds |
| `09-argocd-project-destinations.png` | 9 | Argo CD as an administrator, AppProject `acme`: destinations `acme-argocd`, `acme-dev`, `acme-prod` | The destination `acme-prod` | Captured, signed in as Argo CD's own `admin` account |
| `10-argocd-sync-window.png` | 10 | Argo CD as Anna: `hello-prod`, its sync blocked by the deny sync window | The sync window and its message | Captured. Argo CD shows the window as "SyncWindow", not by its description |

02 and 03 are required: they are the only screenshots of Multi-Tenant
Operator's own console. 06 and 08 are also used in the explainer,
[post 5](../../05-tenants-and-argocd/post.md).
