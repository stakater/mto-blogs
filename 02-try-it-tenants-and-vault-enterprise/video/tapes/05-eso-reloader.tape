# Step 4, terminal part: the External Secrets configuration, then Reloader with its console.
Source tapes/_setup.tape
Output clips/05-eso-reloader-terminal.mp4

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
Type "oc wait externalsecretsconfig/cluster --for=condition=Ready --timeout=300s" Enter
Wait+Screen /condition met/
Type "oc -n external-secrets rollout status deploy/external-secrets-webhook --timeout=300s" Enter
Wait+Screen /successfully rolled out/
Sleep 2s

Hide
Type "APPS_DOMAIN=$(oc get ingresses.config cluster -o jsonpath='{.spec.domain}') && clear" Enter
Wait
Show
Type "helm repo add stakater https://stakater.github.io/stakater-charts" Enter
Wait
Type `helm upgrade --install reloader stakater/reloader --version 3.0.0-beta.4 \` Enter
Type `  -n reloader --create-namespace \` Enter
Type `  --set reloader.isOpenshift=true \` Enter
Type `  --set reloader.deployment.securityContext.runAsUser=null \` Enter
Type `  --set enterprise.enabled=true \` Enter
Type `  --set global.host="reloader.$APPS_DOMAIN" \` Enter
Type `  --set 'enterprise.gateway.namespaces=acme-shop\,globex-web' \` Enter
Type `  --set 'enterprise.console.ingress.annotations.route\.openshift\.io/termination=edge' \` Enter
Type "  --set 'enterprise.gateway.ingress.annotations.route\.openshift\.io/termination=edge'" Enter
Wait+Screen /STATUS: deployed/
Sleep 1s

Hide
Type "clear" Enter
Wait
Show
Type "oc -n reloader rollout status deploy/reloader-reloader --timeout=300s" Enter
Wait+Screen /"reloader-reloader" successfully rolled out/
Type "oc -n reloader rollout status statefulset/reloader-enterprise-dragonfly --timeout=300s" Enter
Wait+Screen /(partitioned roll out complete|statefulset rolling update complete)/
Type "oc -n reloader rollout status deploy/reloader-enterprise-gateway --timeout=300s" Enter
Wait+Screen /"reloader-enterprise-gateway" successfully rolled out/
Type "oc -n reloader rollout status deploy/reloader-enterprise-console --timeout=300s" Enter
Wait+Screen /"reloader-enterprise-console" successfully rolled out/
Type `echo "https://reloader.$APPS_DOMAIN"` Enter
Wait+Screen /https:..reloader\./
Sleep 3s
