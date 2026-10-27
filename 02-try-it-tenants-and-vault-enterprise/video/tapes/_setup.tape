# Shared by every tape: a full-screen terminal (1920x1080, font 22). Split
# beats override Width, FontSize and Padding for the 768x1080 pane. The tapes
# are played by lib/term.mjs in a ttyd terminal that Playwright records.
Set Shell bash
Set FontSize 22
Set Width 1920
Set Height 1080
Set Padding 40
Set Theme "Dracula"
Set TypingSpeed 35ms
# Waits run in real time and are sped up in the edit, so allow the slow ones
# (operator installs, rollouts, the 90-second drift wait).
Set WaitTimeout 600s
# The prompt is a bare "$ ", so a plain Wait means "the command finished".
Set WaitPattern /\$\s*$/

Hide
Type "export PS1='$ '; clear" Enter
Type `v()  { oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault "$@"; }` Enter
Type `vt() { local t=$1; shift; oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$t" vault "$@"; }` Enter
Type "cd ../examples && clear" Enter
Wait
Show
