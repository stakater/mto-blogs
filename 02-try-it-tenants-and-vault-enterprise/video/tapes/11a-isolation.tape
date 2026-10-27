# Step 10, terminal: globex's app reads its own space, is refused acme's, and
# acme's role refuses globex's token. Then acme's policy is widened, which the
# next beat watches being put back.
Source tapes/_setup.tape
Type "oc apply -f web.yaml" Enter
Wait+Screen /serviceaccount.web (created|configured|unchanged)/
Type "JWT=$(oc -n globex-web create token web)" Enter
Wait
Type `ROLE=$(oc -n globex-web get configmap vault-config-web -o jsonpath='{.data.VAULT_K8S_ROLE}')` Enter
Wait
Type `GLOBEX=$(v write -namespace=globex -field=token auth/kubernetes/workloads/login \` Enter
Type `  role="$ROLE" jwt="$JWT")` Enter
Wait
Sleep 2s
Hide
Type "clear" Enter
Wait
Show
Type `vt "$GLOBEX" kv put -namespace=globex -mount=kv dev/globex-web/web/api key=abc` Enter
Wait+Screen /created_time/
Type `vt "$GLOBEX" kv get -namespace=globex -mount=kv dev/globex-web/web/api` Enter
Wait+Screen /key\s+abc/
Sleep 2s
Hide
Type "clear" Enter
Wait
Show
Type `vt "$GLOBEX" kv get -namespace=acme -mount=kv dev/acme-shop/checkout/db` Enter
Wait+Screen /Code: 403/
Sleep 3s
Type `ACME_ROLE=$(oc -n acme-shop get configmap vault-config-checkout -o jsonpath='{.data.VAULT_K8S_ROLE}')` Enter
Wait
Type `v write -namespace=acme auth/kubernetes/workloads/login role="$ACME_ROLE" jwt="$JWT"` Enter
Wait+Screen /service account name not authorized/
Sleep 3s
Hide
Type "clear" Enter
Wait
Show
Type "v policy read -namespace=acme kv.acme.acme-shop.checkout" Enter
Wait
Sleep 3s
Type `echo 'path "*" { capabilities = ["read","list"] }' | v policy write -namespace=acme kv.acme.acme-shop.checkout -` Enter
Wait+Screen /Uploaded policy: kv.acme.acme-shop.checkout/
Sleep 2s
