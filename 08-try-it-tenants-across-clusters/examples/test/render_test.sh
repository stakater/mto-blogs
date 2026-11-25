#!/usr/bin/env bash
# Render test for the example files.
#
# It proves, without a cluster, what the tutorial claims about the
# definitions: each team renders with the same identity for every
# environment, and each overlay changes only the budget. It also checks that
# the hub's ApplicationSet lists every team in every environment, and that
# the guardrail template is the strict, tenant-keyed one the tutorial describes. This is the quick gate. The full proof is the
# tutorial's validation run on real clusters.
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
  if printf '%s' "$2" | grep -qF -- "$3"; then
    echo "ok   | $1"
  else
    echo "FAIL | $1 (expected to find: $3)"
    fail=1
  fi
}

# Only the Tenant document of a render, so identity can be compared.
tenant_of() { printf '%s\n' "$1" | awk 'BEGIN{RS="---\n"} /kind: Tenant/' | grep -v 'stakater.com/environment'; }

for team in acme globex; do
  dev="$(build "teams/$team/overlays/dev")"
  prod="$(build "teams/$team/overlays/prod")"

  # The same team in every environment.
  check "$team dev: the Tenant"            "$dev"  "name: $team"
  check "$team prod: the Tenant"           "$prod" "name: $team"
  check "$team dev: owners group"          "$dev"  "$team-owners"
  check "$team prod: owners group"         "$prod" "$team-owners"
  if [ "$(tenant_of "$dev")" = "$(tenant_of "$prod")" ]; then
    echo "ok   | $team: Tenant identical in dev and prod"
  else
    echo "FAIL | $team: Tenant differs between dev and prod"; fail=1
  fi

  # Each environment carries its own budget, under a name that doesn't change.
  check "$team dev: smaller cpu budget"    "$dev"  'requests.cpu: "2"'
  check "$team prod: larger cpu budget"    "$prod" 'requests.cpu: "20"'
  check "$team dev: quota name"            "$dev"  "name: $team-quota"
  check "$team prod: quota name"           "$prod" "name: $team-quota"

  # Each render is marked with its environment.
  check "$team dev: marked as dev"         "$dev"  "stakater.com/environment: dev"
  check "$team prod: marked as prod"       "$prod" "stakater.com/environment: prod"

  # The hub's ApplicationSet lists this team in both environments.
  for env in dev prod; do
    if grep -A1 -F -- "- team: $team" hub/teams.yaml | grep -qF "env: $env"; then
      echo "ok   | $team $env: listed in hub/teams.yaml"
    else
      echo "FAIL | $team $env: not listed in hub/teams.yaml"; fail=1
    fi
  done
done

# The guardrail template: Template Operator v2, strict, keyed on the tenant label.
g="$(cat guardrails/tenant-guardrails.yaml)"
check "guardrails: Template Operator v2 API"  "$g" "apiVersion: templates.v2.stakater.com/v2alpha1"
check "guardrails: a Template"                "$g" "kind: Template"
check "guardrails: a TemplateInstance"        "$g" "kind: TemplateInstance"
check "guardrails: only tenant namespaces"    "$g" 'hasKey $labels "stakater.com/tenant"'
check "guardrails: strict sync"               "$g" "mode: strict"

echo
if [ "$fail" -eq 0 ]; then
  echo "PASS: every team renders the same in each environment, with its own budget."
else
  echo "one or more checks failed" >&2
fi
exit $fail
