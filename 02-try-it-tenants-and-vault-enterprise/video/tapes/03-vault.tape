# Step 2: Vault Enterprise in dev mode. The license Secret is created hidden.
Source tapes/_setup.tape
Output clips/03-vault-terminal.mp4

Type "oc new-project vault" Enter
Wait+Screen /Now using project "vault"/
Sleep 1s
Hide
Type `oc -n vault create secret generic vault-ent-license --from-file=license="$VAULT_LICENSE_FILE" >/dev/null && clear` Enter
Wait
Show

Type "helm repo add hashicorp https://helm.releases.hashicorp.com" Enter
Wait
Type `helm upgrade --install vault hashicorp/vault --version 0.34.1 -n vault \` Enter
Type `  --set global.openshift=true \` Enter
Type `  --set server.dev.enabled=true \` Enter
Type `  --set server.dev.devRootToken=root \` Enter
Type `  --set server.authDelegator.enabled=true \` Enter
Type `  --set server.image.repository=registry.connect.redhat.com/hashicorp/vault-enterprise \` Enter
Type `  --set server.image.tag=2.1.1-ent-ubi \` Enter
Type `  --set server.enterpriseLicense.secretName=vault-ent-license \` Enter
Type `  --set injector.enabled=false \` Enter
Type "  --set ui.enabled=true" Enter
Wait+Screen /STATUS: deployed/
Sleep 2s

Hide
Type "clear" Enter
Wait
Show

Type "oc -n vault wait --for=condition=Ready pod/vault-0 --timeout=300s" Enter
Wait+Screen /pod.vault-0 condition met/
Type "oc -n vault create route edge vault-ui --service=vault" Enter
Wait+Screen /route.route.openshift.io.vault-ui created/
Sleep 1s

Type "v version" Enter
Wait+Screen /Vault v2\.1\.1\+ent/
Sleep 3s
