# Step 9: two rotations. Each ends on a log line that appears only once.
Source tapes/_setup.tape
Output clips/10-rotate-terminal.mp4

Type "v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=n3w-s3cr3t" Enter
Wait+Screen /created_time/
Sleep 1s
Type `oc -n acme-shop annotate externalsecret checkout-db force-sync="$(date +%s)" --overwrite` Enter
Wait+Screen /annotated/
Type "sleep 15   # the Secret updates, then Reloader starts the rollout" Enter
Wait
Type "oc -n acme-shop rollout status deploy/checkout" Enter
Wait+Screen /successfully rolled out/
Type "oc -n acme-shop logs deploy/checkout" Enter
Wait+Screen /db password has 10 characters/
Sleep 3s

Hide
Type "clear" Enter
Wait
Show
Type "v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=an0th3r-s3cr3t" Enter
Wait+Screen /created_time/
Type `oc -n acme-shop annotate externalsecret checkout-db force-sync="$(date +%s)" --overwrite` Enter
Wait+Screen /annotated/
Type "sleep 15" Enter
Wait
Type "oc -n acme-shop rollout status deploy/checkout" Enter
Wait+Screen /successfully rolled out/
Type "oc -n acme-shop logs deploy/checkout" Enter
Wait+Screen /db password has 14 characters/
Sleep 3s
