# Step 6, split: the extension. The console shows its parent TemplateInstance
# appear in vault-config. TOP_NS and TOP_SA come from step 1; this shell is new.
Source tapes/_setup.tape
Source tapes/_split.tape
Hide
Type "export TOP_NS=multi-tenant-operator TOP_SA=tenant-operator-template-operator-v2 && clear" Enter
Wait
Show
Type `helm upgrade --install mto-extension-vault-enterprise-bootstrap \` Enter
Type `  oci://ghcr.io/stakater/charts/mto-extension-vault-enterprise-bootstrap \` Enter
Type `  --version 0.1.0 -n vault-config --create-namespace \` Enter
Type `  --set parent.vaultServer=http://vault.vault.svc:8200 \` Enter
Type `  --set templateOperator.namespace="$TOP_NS" \` Enter
Type `  --set templateOperator.serviceAccountName="$TOP_SA"` Enter
Wait+Screen /STATUS: deployed/
Sleep 3s
