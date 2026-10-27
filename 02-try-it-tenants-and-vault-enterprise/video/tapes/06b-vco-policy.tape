# Step 5, split: the narrow policy and its role. The Vault UI shows vco-admin
# appear next to default and root.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "v policy write vco-admin - < vco-admin-policy.hcl" Enter
Wait+Screen /Uploaded policy: vco-admin/
Sleep 1s
Type `v write auth/kubernetes/role/vco-admin \` Enter
Type `  bound_service_account_names=vco-admin \` Enter
Type `  bound_service_account_namespaces=vault-config \` Enter
Type "  token_policies=vco-admin token_ttl=1h" Enter
# Vault 2.1 answers with an audience warning instead of "Success!".
Wait+Screen /(Data written to: auth.kubernetes.role.vco-admin|Role vco-admin does not have an audience)/
Wait
Sleep 2s
