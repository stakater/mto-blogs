# Step 1, terminal part: Template Operator on, then the privileged namespaces.
Source tapes/_setup.tape
Output clips/02-install-mto-terminal.mp4

Type `oc -n multi-tenant-operator patch integrationconfig tenant-operator-config \` Enter
Type `  --type merge -p '{"spec":{"components":{"templateOperatorV2":{"mode":"Managed"}}}}'` Enter
Wait+Screen /integrationconfig.tenantoperator.stakater.com.tenant-operator-config patched/
Sleep 2s

Type `oc get deploy -A -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,SA:.spec.template.spec.serviceAccountName \` Enter
Type "  | grep template-operator-v2" Enter
Wait+Screen /template-operator-v2-controller-manager/
Sleep 2s
Type "export TOP_NS=multi-tenant-operator" Enter
Type "export TOP_SA=tenant-operator-template-operator-v2" Enter
Sleep 1s

Type "oc -n multi-tenant-operator patch integrationconfig tenant-operator-config --type json -p '[" Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^vault$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^vault-config$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^vault-config-operator$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^external-secrets$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^external-secrets-operator$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^reloader$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^reloader-enterprise-system$"}` Enter
Type "]'" Enter
Wait
Sleep 3s
