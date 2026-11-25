#!/usr/bin/env bash
# Render test for the multi-cluster tenancy example.
#
# It proves the pattern the tutorial claims, without a cluster: the same
# Tenant identity renders for every environment, and each overlay changes
# only its own budget. This is the cheap, deterministic gate — the full
# proof is the tutorial's validation run on real clusters.
#
# Needs: kubectl (for `kubectl kustomize`) or kustomize. Run: ./test/render_test.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v kustomize >/dev/null 2>&1; then
  build() { kustomize build "$1"; }
elif command -v kubectl >/dev/null 2>&1; then
  build() { kubectl kustomize "$1"; }
else
  echo "need kustomize or kubectl on PATH" >&2
  exit 2
fi

fail=0
check() { # name  haystack  needle
  if printf '%s' "$2" | grep -qF "$3"; then
    echo "ok   | $1"
  else
    echo "FAIL | $1 (expected to find: $3)"
    fail=1
  fi
}

dev="$(build overlays/dev)"
prod="$(build overlays/prod)"

# Same team on every cluster: identity and access do not vary by environment.
check "dev: Tenant acme"          "$dev"  "name: acme"
check "prod: Tenant acme"         "$prod" "name: acme"
check "dev: owners group"         "$dev"  "acme-owners"
check "prod: owners group"        "$prod" "acme-owners"
check "dev: viewers group"        "$dev"  "acme-viewers"
check "prod: viewers group"       "$prod" "acme-viewers"

# Each environment carries its own budget, and only the budget differs.
check "dev: small cpu budget"     "$dev"  'requests.cpu: "2"'
check "dev: small pod budget"     "$dev"  'pods: "5"'
check "prod: large cpu budget"    "$prod" 'requests.cpu: "20"'
check "prod: large pod budget"    "$prod" 'pods: "50"'

# Each render is stamped with the environment it is for.
check "dev: marked as dev"        "$dev"  "stakater.com/environment: dev"
check "prod: marked as prod"      "$prod" "stakater.com/environment: prod"

# The quota's name is stable, so the Tenant's reference to it holds everywhere.
check "dev: quota name stable"    "$dev"  "name: acme-quota"
check "prod: quota name stable"   "$prod" "name: acme-quota"

echo
if [ "$fail" -eq 0 ]; then
  echo "PASS: every overlay renders the same team with its own budget."
else
  echo "one or more checks failed" >&2
fi
exit $fail
