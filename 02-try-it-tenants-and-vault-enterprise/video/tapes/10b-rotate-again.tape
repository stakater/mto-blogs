# Step 9, split: second rotation, sped up in the edit. Reloader's console
# shows restart 2.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=an0th3r-s3cr3t" Enter
Wait+Screen /created_time/
Hide
Type "clear" Enter
Wait
Show
Type `oc -n acme-shop annotate externalsecret checkout-db force-sync="$(date +%s)" --overwrite` Enter
Wait+Screen /annotated/
Type "sleep 15" Enter
Wait
Type "oc -n acme-shop rollout status deploy/checkout" Enter
Wait+Screen /successfully rolled out/
Type "oc -n acme-shop logs deploy/checkout" Enter
Wait+Screen /db password has 14 characters/
Sleep 3s
