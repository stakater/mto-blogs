# Step 10, split: the wait, sped up in the edit. The Vault UI shows the
# widened rule replaced by the original one.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "sleep 90" Enter
Wait
Type "v policy read -namespace=acme kv.acme.acme-shop.checkout" Enter
Wait+Screen /kv\/data\/dev\/acme-shop\/checkout/
Sleep 3s
