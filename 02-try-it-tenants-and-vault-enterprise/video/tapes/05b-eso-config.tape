# Step 4, split: External Secrets Operator's configuration, with the egress
# to Vault. The console shows its pods appear in external-secrets.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "cat <<'YAML' | oc apply -f -" Enter
Type "apiVersion: operator.openshift.io/v1alpha1" Enter
Type "kind: ExternalSecretsConfig" Enter
Type "metadata:" Enter
Type "  name: cluster" Enter
Type "spec:" Enter
Type "  controllerConfig:" Enter
Type "    networkPolicies:" Enter
Type "      - name: allow-egress-to-vault" Enter
Type "        componentName: ExternalSecretsCoreController" Enter
Type "        egress:" Enter
Type "          - to:" Enter
Type "              - namespaceSelector:" Enter
Type "                  matchLabels:" Enter
Type "                    kubernetes.io/metadata.name: vault" Enter
Type "            ports:" Enter
Type "              - protocol: TCP" Enter
Type "                port: 8200" Enter
Type "YAML" Enter
Wait+Screen /externalsecretsconfig.operator.openshift.io.cluster (created|configured|unchanged)/
Sleep 1s
Hide
Type "clear" Enter
Wait
Show
Type "oc wait externalsecretsconfig/cluster --for=condition=Ready --timeout=300s" Enter
Wait+Screen /condition met/
Type "oc -n external-secrets rollout status deploy/external-secrets-webhook --timeout=300s" Enter
Wait+Screen /successfully rolled out/
Sleep 2s
