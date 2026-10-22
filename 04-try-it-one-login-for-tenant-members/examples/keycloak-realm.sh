#!/usr/bin/env bash
# Sets up realm "tenants" in the tutorial's Keycloak. Runs inside the Keycloak
# pod, with Keycloak's own kcadm.sh:
#
#   oc -n keycloak exec -i deploy/keycloak -- env \
#     DEX_ISSUER=... DEX_CLIENT_SECRET=... ANNA_PASSWORD=... BEN_PASSWORD=... \
#     bash -s < keycloak-realm.sh
#
#   client "dex"   the client Dex signs in with; sends a "groups" claim with
#                  plain group names (acme-editors, not /acme-editors)
#   groups         <tenant>-<level>s for tenants acme and globex
#   users          anna (acme-editors), ben (globex-editors)
#
# Safe to run again. Passwords and the client secret come from the
# environment and are never printed.
set -euo pipefail
: "${DEX_ISSUER:?}" "${DEX_CLIENT_SECRET:?}" "${ANNA_PASSWORD:?}" "${BEN_PASSWORD:?}"

K=/opt/keycloak/bin/kcadm.sh
R=tenants
$K config credentials --server http://localhost:8080 --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null

$K get "realms/$R" >/dev/null 2>&1 || $K create realms -s realm=$R -s enabled=true

cid=$($K get clients -r $R -q clientId=dex --fields id --format csv --noquotes)
if [ -z "$cid" ]; then
  $K create clients -r $R -s clientId=dex -s enabled=true -s protocol=openid-connect \
    -s publicClient=false -s standardFlowEnabled=true -s directAccessGrantsEnabled=false \
    -s "redirectUris=[\"$DEX_ISSUER/callback\"]" -s "secret=$DEX_CLIENT_SECRET"
  cid=$($K get clients -r $R -q clientId=dex --fields id --format csv --noquotes)
else
  $K update "clients/$cid" -r $R -s "redirectUris=[\"$DEX_ISSUER/callback\"]" -s "secret=$DEX_CLIENT_SECRET"
fi
if ! $K get "clients/$cid/protocol-mappers/models" -r $R --fields name --format csv --noquotes | grep -qx groups; then
  $K create "clients/$cid/protocol-mappers/models" -r $R -s name=groups -s protocol=openid-connect \
    -s protocolMapper=oidc-group-membership-mapper \
    -s 'config."claim.name"=groups' -s 'config."full.path"=false' \
    -s 'config."id.token.claim"=true' -s 'config."access.token.claim"=true' \
    -s 'config."userinfo.token.claim"=true'
fi

group_id() { $K get groups -r $R -q search="$1" -q exact=true --fields id --format csv --noquotes; }
for t in acme globex; do
  for level in admins editors viewers audit-reads; do
    g="$t-$level"
    [ -n "$(group_id "$g")" ] || $K create groups -r $R -s name="$g"
  done
done

user() { # user <username> <first> <group> <password>
  uid=$($K get users -r $R -q username="$1" -q exact=true --fields id --format csv --noquotes)
  if [ -z "$uid" ]; then
    $K create users -r $R -s username="$1" -s enabled=true -s emailVerified=true \
      -s email="$1@example.com" -s firstName="$2" -s lastName=Example
    uid=$($K get users -r $R -q username="$1" -q exact=true --fields id --format csv --noquotes)
  fi
  $K set-password -r $R --userid "$uid" --new-password "$4"
  $K update "users/$uid/groups/$(group_id "$3")" -r $R -s realm=$R -s userId="$uid" \
    -s groupId="$(group_id "$3")" -n
}
user anna Anna acme-editors "$ANNA_PASSWORD"
user ben Ben globex-editors "$BEN_PASSWORD"

echo "realm $R ready: anna in acme-editors, ben in globex-editors"
