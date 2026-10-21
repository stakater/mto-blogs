Set Shell bash
Set FontSize 22
Set Width 1920
Set Height 1080
Set Padding 40
Set Theme "Dracula"
Set TypingSpeed 35ms
# Playwright's rate. At VHS's default of 50, a container can't capture
# 1920x1080 in real time, so the clip plays about twice as fast as it ran.
Set Framerate 25
# Waits run in real time and are sped up in the edit, so allow the slow ones
# (rollouts, the 90-second drift wait).
Set WaitTimeout 600s
# The prompt is a bare "$ ", so a plain Wait means "the command finished".
Set WaitPattern /\$\s*$/

Hide
Type "export PS1='$ '; clear" Enter
Type `v()  { oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault "$@"; }` Enter
Type `vt() { local t=$1; shift; oc -n vault exec -i vault-0 -- env VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$t" vault "$@"; }` Enter
# When the visible part starts, for record.sh's timeline (CLIP is set by record.sh).
Type `perl -MTime::HiRes=time -e 'printf "%.3f\n", time' > "clips/.${CLIP:-tape}.start"` Enter
Type "cd ../examples && clear" Enter
Wait
Show
