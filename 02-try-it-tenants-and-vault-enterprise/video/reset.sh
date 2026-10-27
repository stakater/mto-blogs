#!/usr/bin/env bash
# Removes everything this tutorial installs, so a cluster can be recorded
# again from a real "before". It deletes the tenants, their projects, Vault
# (and all its data), Vault Config Operator, External Secrets Operator,
# Reloader and Multi-Tenant Operator. Only for a cluster used for this
# tutorial; recording.md prefers a fresh cluster when there is one.
#
#   KUBECONFIG=… ./reset.sh            asks first
#   KUBECONFIG=… ./reset.sh --yes      doesn't ask
set -uo pipefail
cd "$(dirname "$0")/../examples"

[[ ${1:-} == --yes ]] || {
  read -r -p "Remove the whole tutorial from $(oc whoami --show-server)? [y/N] " a
  [[ $a == [yY] ]] || exit 1
}
say() { echo "reset.sh: $*"; }
gone() { for i in $(seq 1 60); do oc get "$@" >/dev/null 2>&1 || return 0; sleep 5; done; return 1; }

# Vault Config Operator can't finish deleting what it wrote once Vault is
# gone or its login is, so its resources are released by hand.
release_vco() {
  local kinds
  kinds=$(oc api-resources --api-group=redhatcop.redhat.io --namespaced -o name | paste -sd, -)
  for r in $(oc -n vault-config get "$kinds" -o name 2>/dev/null); do
    oc -n vault-config patch "$r" --type merge -p '{"metadata":{"finalizers":null}}' >/dev/null 2>&1
  done
}

say "the apps and the tenants"
oc delete -f checkout.yaml -f web.yaml --ignore-not-found --wait=false
# A tenant's projects stay when it's deleted, and Multi-Tenant Operator's
# webhook then refuses to delete or relabel them ("Tenant 'acme' not found").
# Purging them with the tenant avoids that.
for t in acme globex; do
  oc patch tenants.tenantoperator.stakater.com "$t" --type merge \
    -p '{"spec":{"namespaces":{"onDeletePurgeNamespaces":true}}}' >/dev/null 2>&1
done
oc delete tenants.tenantoperator.stakater.com acme globex --ignore-not-found --wait=true --timeout=300s
# The Quota is first in tenants.yaml; it can only go once no tenant uses it.
oc delete -f tenants.yaml --ignore-not-found
gone ns acme-shop || say "acme-shop is still there"
gone ns globex-web || say "globex-web is still there"

say "the extension and Vault"
oc -n vault-config delete templateinstances.templates.v2.stakater.com mto-extension-vault-enterprise-parent --ignore-not-found --wait=false
sleep 20
helm uninstall mto-extension-vault-enterprise-bootstrap -n vault-config 2>/dev/null
helm uninstall vault -n vault 2>/dev/null
release_vco

say "Reloader"
helm uninstall reloader -n reloader 2>/dev/null
oc delete ns reloader reloader-enterprise-system --ignore-not-found --wait=false

say "External Secrets Operator"
oc delete externalsecretsconfig cluster --ignore-not-found --wait=false
oc -n external-secrets-operator delete subscription.operators.coreos.com openshift-external-secrets-operator --ignore-not-found
for c in $(oc -n external-secrets-operator get csv -o name 2>/dev/null | grep openshift-external-secrets-operator); do
  oc -n external-secrets-operator delete "$c"
done
oc delete validatingwebhookconfigurations externalsecret-validate secretstore-validate --ignore-not-found

say "Vault Config Operator, and the platform projects"
helm uninstall vault-config-operator -n vault-config-operator 2>/dev/null
release_vco
oc delete ns external-secrets external-secrets-operator vault-config-operator vault-config vault --ignore-not-found --wait=false

say "Multi-Tenant Operator"
oc -n multi-tenant-operator delete subscription.operators.coreos.com --all
oc -n multi-tenant-operator delete csv --all
sleep 20
# Its components are Helm releases it installed; uninstalling them removes
# their cluster-wide objects (webhooks among them) with them.
for r in $(helm -n multi-tenant-operator list -q 2>/dev/null); do helm uninstall "$r" -n multi-tenant-operator; done
oc delete ns multi-tenant-operator --ignore-not-found --wait=false
sleep 30
# With their controllers gone, nobody removes these objects' finalizers.
for k in $(oc api-resources --namespaced -o name | grep stakater.com); do
  for r in $(oc -n multi-tenant-operator get "$k" -o name 2>/dev/null); do
    oc -n multi-tenant-operator patch "$r" --type merge -p '{"metadata":{"finalizers":null}}' >/dev/null 2>&1
  done
done

say "waiting for the projects to go"
for n in multi-tenant-operator reloader reloader-enterprise-system external-secrets external-secrets-operator \
  vault-config-operator vault-config vault acme-shop globex-web; do
  gone ns "$n" || say "$n is still there"
done

# A webhook whose service is gone, with failurePolicy Fail, would block
# creating what the next recording creates.
for kind in validatingwebhookconfigurations mutatingwebhookconfigurations; do
  oc get "$kind" -o jsonpath='{range .items[*]}{.metadata.name}{" "}{range .webhooks[*]}{.clientConfig.service.namespace}/{.clientConfig.service.name}{" "}{end}{"\n"}{end}' |
  while read -r name services; do
    for s in $services; do
      [[ $s == / ]] && continue # a webhook that calls a URL, not a service
      if ! oc -n "${s%/*}" get svc "${s#*/}" >/dev/null 2>&1; then say "stale $kind $name -> $s"; break; fi
    done
  done
done
say "done"
