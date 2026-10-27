# Step 1, split: Template Operator on. The console shows the
# template-operator-v2 deployment appear.
Source tapes/_setup.tape
Source tapes/_split.tape
Type `oc -n multi-tenant-operator patch integrationconfig tenant-operator-config \` Enter
Type `  --type merge -p '{"spec":{"components":{"templateOperatorV2":{"mode":"Managed"}}}}'` Enter
Wait+Screen /patched/
Sleep 2s
Type `oc get deploy -A -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,SA:.spec.template.spec.serviceAccountName \` Enter
Type "  | grep template-operator-v2" Enter
RepeatUntil /template-operator-v2-controller-manager/ 5s
Sleep 2s
Type "export TOP_NS=multi-tenant-operator" Enter
Type "export TOP_SA=tenant-operator-template-operator-v2" Enter
Sleep 2s
