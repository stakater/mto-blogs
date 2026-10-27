# Step 9, split: first rotation. Reloader's console shows restart 1, caused
# by checkout-db.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=n3w-s3cr3t" Enter
Wait+Screen /created_time/
Sleep 1s
Hide
Type "clear" Enter
Wait
Show
Type `oc -n acme-shop annotate externalsecret checkout-db force-sync="$(date +%s)" --overwrite` Enter
Wait+Screen /annotated/
Type "sleep 15   # the Secret updates, then Reloader starts the rollout" Enter
Wait
Type "oc -n acme-shop rollout status deploy/checkout" Enter
Wait+Screen /successfully rolled out/
Type "oc -n acme-shop logs deploy/checkout" Enter
Wait+Screen /db password has 10 characters/
Sleep 3s
