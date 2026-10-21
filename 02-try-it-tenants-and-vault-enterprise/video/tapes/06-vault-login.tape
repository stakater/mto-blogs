# Step 5: Vault Config Operator's login, and its policy file.
Source tapes/_setup.tape
Output clips/06-vault-login-terminal.mp4

Type "cat vco-admin-policy.hcl" Enter
Wait
Sleep 4s

Hide
Type "clear" Enter
Wait
Show
Type "v auth enable kubernetes" Enter
Wait+Screen /Enabled kubernetes auth method/
Type "v write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc:443" Enter
Wait+Screen /Data written to: auth.kubernetes.config/
Type "v policy write vco-admin - < vco-admin-policy.hcl" Enter
Wait+Screen /Uploaded policy: vco-admin/
Type `v write auth/kubernetes/role/vco-admin \` Enter
Type `  bound_service_account_names=vco-admin \` Enter
Type `  bound_service_account_namespaces=vault-config \` Enter
Type "  token_policies=vco-admin token_ttl=1h" Enter
Wait+Screen /Data written to: auth.kubernetes.role.vco-admin/
Sleep 3s
