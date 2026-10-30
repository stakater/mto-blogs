# Step 5, split: Kubernetes login. The Vault UI shows kubernetes/ appear
# next to token/.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "v auth enable kubernetes" Enter
Wait+Screen /Enabled kubernetes auth method/
Sleep 2s
Type "v write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc:443" Enter
Wait+Screen /Data written to: auth.kubernetes.config/
Sleep 2s
