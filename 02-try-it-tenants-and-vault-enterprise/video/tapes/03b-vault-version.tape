# Step 2, terminal: two helpers, then Vault answers.
Source tapes/_setup.tape
Type `v()  { oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault "$@"; }` Enter
Type `vt() { local t=$1; shift; oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$t" vault "$@"; }` Enter
Sleep 1s
Type "v version" Enter
Wait+Screen /Vault v2\.1\.1\+ent/
Sleep 3s
