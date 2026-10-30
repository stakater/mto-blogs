# Step 3, split: Vault Config Operator. The console shows its pod appear.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "helm repo add vault-config-operator https://redhat-cop.github.io/vault-config-operator" Enter
Wait
Type `helm upgrade --install vault-config-operator vault-config-operator/vault-config-operator \` Enter
Type `  --version v1.0.3 -n vault-config-operator --create-namespace \` Enter
Type `  --set 'env[0].name=VAULT_ADDR'             --set 'env[0].value=http://vault.vault.svc:8200' \` Enter
Type `  --set 'env[1].name=ENABLE_DRIFT_DETECTION' --set-string 'env[1].value=true' \` Enter
Type `  --set 'env[2].name=SYNC_PERIOD_SECONDS'    --set-string 'env[2].value=60' \` Enter
Type "  --set 'env[3].name=CACHE_VAULT_TOKEN'      --set-string 'env[3].value=true'" Enter
Wait+Screen /STATUS: deployed/
Sleep 1s
Hide
Type "clear" Enter
Wait
Show
Type "oc -n vault-config-operator rollout status deploy/vault-config-operator --timeout=300s" Enter
Wait+Screen /successfully rolled out/
Sleep 2s
