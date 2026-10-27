# Step 1, terminal: the platform's namespaces become privileged.
Source tapes/_setup.tape
Type "oc -n multi-tenant-operator patch integrationconfig tenant-operator-config --type json -p '[" Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^vault$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^vault-config$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^vault-config-operator$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^external-secrets$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^external-secrets-operator$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^reloader$"},` Enter
Type `  {"op":"add","path":"/spec/accessControl/privileged/namespaces/-","value":"^reloader-enterprise-system$"}` Enter
Type "]'" Enter
Wait+Screen /patched/
Sleep 3s
