# Step 8: the password in Vault, the app, its Secret and its log.
Source tapes/_setup.tape
Output clips/09-app-terminal.mp4

Type "v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=s3cr3t" Enter
Wait+Screen /created_time/
Sleep 2s
Type "cat checkout.yaml" Enter
Wait
Sleep 5s

Hide
Type "clear" Enter
Wait
Show
Type "oc apply -f checkout.yaml" Enter
Wait+Screen /deployment.apps.checkout (created|configured|unchanged)/
Type "oc -n acme-shop get externalsecret,secret checkout-db" Enter
Wait
Sleep 2s
Type "oc -n acme-shop logs deploy/checkout" Enter
Wait+Screen /db password has 6 characters/
Sleep 3s
