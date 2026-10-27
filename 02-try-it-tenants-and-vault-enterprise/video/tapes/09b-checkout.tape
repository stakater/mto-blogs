# Step 8, split: the app gets it. The console shows the Secret checkout-db
# appear in acme-shop, owned by its ExternalSecret.
Source tapes/_setup.tape
Source tapes/_split.tape
Type "oc apply -f checkout.yaml" Enter
Wait+Screen /deployment.apps.checkout (created|configured|unchanged)/
Type "oc -n acme-shop rollout status deploy/checkout   # waits for the Secret, about 20 seconds" Enter
Wait+Screen /"checkout" successfully rolled out/
Sleep 3s
