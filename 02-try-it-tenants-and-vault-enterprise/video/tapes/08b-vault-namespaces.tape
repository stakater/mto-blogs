# Step 7, split: Vault namespaces appear. The command is repeated until it
# lists them; the Vault UI's namespace picker shows them appear too.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "v namespace list" Enter
RepeatUntil /acme\/[\s\S]*globex\// 5s
Sleep 3s
Hide
Type "clear" Enter
Wait
Show
Type "v secrets list -namespace=acme    # kv/ : the tenant's own secrets engine" Enter
Wait+Screen /kv\//
Sleep 2s
Type "v auth list -namespace=acme       # kubernetes/workloads/ : how its apps log in" Enter
Wait+Screen /workloads/
Sleep 2s
Type `echo "https://$(oc -n vault get route vault-ui -o jsonpath='{.spec.host}')"` Enter
Wait+Screen /https:..vault-ui/
Sleep 2s
Hide
Type "clear" Enter
Wait
Show
Type "oc -n vault-config get namespaces.redhatcop.redhat.io,secretenginemounts.redhatcop.redhat.io" Enter
Wait+Screen /shared-kv/
Sleep 3s
