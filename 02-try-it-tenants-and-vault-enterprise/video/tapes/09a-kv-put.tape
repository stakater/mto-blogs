# Step 8, split: the password, in Vault. The Vault UI shows the secret db
# appear in acme's kv, under dev/acme-shop/checkout/.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "v kv put -namespace=acme -mount=kv dev/acme-shop/checkout/db password=s3cr3t" Enter
Wait+Screen /created_time/
# Long enough for the console to show the change before the terminal stops.
Sleep 6s
