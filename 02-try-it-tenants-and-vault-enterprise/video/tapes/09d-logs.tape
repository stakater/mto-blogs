# Step 8, terminal: the app reads it.
Source tapes/_setup.tape
Type "oc -n acme-shop get externalsecret,secret checkout-db" Enter
Wait+Screen /SecretSynced/
Sleep 2s
Type "oc -n acme-shop logs deploy/checkout" Enter
Wait+Screen /db password has 6 characters/
Sleep 3s
