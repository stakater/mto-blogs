# Step 4, split: Reloader with its console. The console shows its four pods
# appear in reloader. APPS_DOMAIN is set hidden: it only feeds the command.
Source tapes/_setup.tape
Source tapes/_split.tape
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
Sleep 2s
