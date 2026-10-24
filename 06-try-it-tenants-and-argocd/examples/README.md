# Example files

The files used by the tutorial
[Hands-on: tenants on OpenShift, carried into Argo CD](../post.md). Follow
the tutorial for the steps.

| File | Used in | What |
|---|---|---|
| [values.yaml](values.yaml) | Step 4 | The Argo CD extension's settings: Argo CD's namespace, a repository per tenant, Applications in the tenant's own namespace |
| [tenants.yaml](tenants.yaml) | Step 5 | Two tenants, `acme` and `globex`, opted in to Argo CD |
| [acme-app.yaml](acme-app.yaml) | Step 6 | Anna's Application, deploying acme's repository into `acme-dev` |
| [acme-prod-app.yaml](acme-prod-app.yaml) | Step 9 | Anna's Application for `acme-prod` |
| [refused.yaml](refused.yaml) | Step 7 | Five Applications that cross acme's boundary, which Argo CD refuses |
| [gitops/acme/](gitops/acme/), [gitops/globex/](gitops/globex/) | Steps 6, 7 and 9 | What each tenant's repository holds (acme's also has a `quota/` folder, for step 7): `stakater/mto-blogs-acme-gitops` and `stakater/mto-blogs-globex-gitops` |
