# Rafael: validating and publishing post 1

Thank you for publishing this with us. Everything is written: the post, your
section on Vault Config Operator, and a step-by-step guide. What we need
from you is to run the guide on your own cluster, tell us what breaks, and
then submit the post to Red Hat Developer.

## What's here

| File | What |
|---|---|
| [post.md](post.md) | The post, about 1,700 words |
| [examples/README.md](examples/README.md) | The guide readers follow, from an empty cluster to isolated tenants |
| [examples/](examples/) | The manifests and the Vault policy the guide uses |
| [screenshots/](screenshots/) | The Vault UI images in the post, captured by the extension's end-to-end tests |

## 1. Read the post

The section **"Vault configuration as Kubernetes resources"** is written for
your voice, as the Red Hat co-author. Change anything that doesn't sound
like you, or that you'd put differently as a Vault Config Operator
maintainer.

## 2. Run the guide

Run [examples/README.md](examples/README.md) on a clean OpenShift cluster
with a Vault Enterprise license. Mark each step as it passes. If a step
fails, write down the command and its output, and open an issue or comment
on the pull request.

| Step | Passes when |
|---|---|
| 1. Multi-Tenant Operator | Installs from OperatorHub, version 1.10.0 or later; the patch brings up a `template-operator-v2` deployment |
| 2. Vault Enterprise | `v version` prints `Vault v2.1.1+ent` |
| 3. Vault Config Operator | The deployment rolls out on OpenShift without cert-manager |
| 4. External Secrets Operator, Reloader | Both run. **Please confirm the OperatorHub install and configuration for External Secrets Operator (marked `RAFAEL-CHECK`)** |
| 5. Vault login | All four commands succeed |
| 6. Extension | The Helm install succeeds |
| 7. Tenants | `v namespace list` shows `acme/`, `globex/` and `shared/` |
| 8. App | The log says `db password has 6 characters` |
| 9. Rotation | After the forced refresh, a new pod logs `10 characters` |
| 10. Isolation | The allowed commands succeed, both refusals are refused, and the hand-widened policy is reverted |
| Clean up | No Vault Config Operator resources left, and no namespace stuck |

We validate the same guide on our side in parallel, so we compare notes
rather than you debugging alone.

## 3. Submit

Once the guide passes for both of us:

- Submit `post.md` in the format Red Hat Developer asks for. If the format
  isn't Markdown, tell us and we'll convert it.
- Agree the byline order and the title. There are three title options at the
  top of `post.md`.
- On the day it's published, we make this repository public, so the guide
  link in the post works. Please give us the date ahead of time.
- After it's published, we repost it on the Stakater blog with a canonical
  link to the Red Hat post. Tell us if Red Hat has rules about that.

## Questions for you

- How long does Red Hat Developer review take, and what does it need from us?
- Should HashiCorp see the post before it goes out? The IBM HashiCorp team
  may publish their own version of the story.
