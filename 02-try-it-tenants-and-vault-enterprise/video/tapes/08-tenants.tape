# Step 7: the tenants. record.sh starts browser/08-vault-split.mjs first, so the
# Vault UI is recorded while this tape runs (the split screen).
Source tapes/_setup.tape
Output clips/08-tenants-terminal.mp4

Type "cat tenants.yaml" Enter
Wait
Sleep 3s

Hide
Type "clear" Enter
Wait
Show
Type "oc apply -f tenants.yaml" Enter
Wait+Screen /tenant.tenantoperator.stakater.com.globex (created|configured|unchanged)/
Sleep 3s

Hide
Type "clear" Enter
Wait
Show
Type "oc -n multi-tenant-operator patch integrationconfig tenant-operator-config --type merge -p '{" Enter
Type `  "spec": {` Enter
Type `    "components": {"console": true, "showback": true},` Enter
Type `    "accessControl": {"privileged": {"users": ["mto@stakater.com"]}}` Enter
Type "  }}'" Enter
Wait+Screen /tenant-operator-config patched/
Type "oc -n multi-tenant-operator get routes | grep console" Enter
Wait+Screen /tenant-operator-console/
Sleep 2s

Hide
Type "clear" Enter
Wait
Show
Type "v namespace list" Enter
Wait+Screen /shared./
Sleep 3s
Type "v secrets list -namespace=acme    # kv/ : the tenant's own secrets engine" Enter
Wait+Screen /Accessor/
Sleep 2s
Type "v auth list -namespace=acme       # kubernetes/workloads/ : how its apps log in" Enter
Wait+Screen /ns_token/
Sleep 2s

Hide
Type "clear" Enter
Wait
Show
Type `echo "https://$(oc -n vault get route vault-ui -o jsonpath='{.spec.host}')"` Enter
Wait+Screen /https:..vault-ui/
Sleep 2s
Type "oc -n vault-config get namespaces.redhatcop.redhat.io,secretenginemounts.redhatcop.redhat.io" Enter
Wait+Screen /shared-kv/
Sleep 3s
