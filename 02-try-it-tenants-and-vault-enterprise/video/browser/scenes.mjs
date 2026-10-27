// The scene table of recording.md, one entry per beat, in the tutorial's
// order. A split beat has a tape (the terminal pane) and a console pane:
// before() opens its "before" page; find() returns what to highlight once
// the change is there, else null; refresh() is the console's own way to
// update. A console beat has run(); a terminal beat has only a tape.
import {
  url, oc, consoleGo, mtoGo, vaultGo, vaultRefresh, openNamespacePicker, namespaceEntry,
  visible, highlightAll, clearHighlights, ready, mark, pause,
} from './lib.mjs';

const row = (page, text) => page.locator('tr').filter({ hasText: text }).first();
const reload = (page) => page.reload({ waitUntil: 'domcontentloaded' }).then(() => page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}));
const reloaderRefresh = (page) => page.getByRole('button', { name: 'Refresh' }).first().click();
const waitFor = (fn, what, timeout = 900000) => {
  const deadline = Date.now() + timeout;
  return (async () => {
    for (;;) {
      try { if (fn()) return; } catch {}
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  })();
};

// An OpenShift list page in one namespace: the "before" is the empty list (or
// the project not existing yet). The console watches the API itself, so the
// change appears without a refresh.
const podsBefore = (ns) => (page) => consoleGo(page, `/k8s/ns/${ns}/pods`);
const runningPods = (names) => async (page) => {
  const rows = names.map((n) => page.locator('tr').filter({ has: page.getByRole('link', { name: n }) }).filter({ hasText: 'Running' }).first());
  for (const r of rows) if (!(await r.isVisible())) return null;
  return rows.map((r) => r.locator('td').first());
};

// Installs an operator from the Software Catalog with its defaults, ending on
// Installed Operators with its row "Succeeded".
async function installFromCatalog(pane, { keyword, title, csvPrefix, namespace }) {
  const { page } = pane;
  await consoleGo(page, '/catalog/all-namespaces?catalogType=operator');
  ready(pane); mark(pane, 'before');
  await page.getByPlaceholder(/filter by keyword|search/i).first().pressSequentially(keyword, { delay: 80 });
  const tile = page.locator('.pf-v6-c-card').filter({ has: page.getByText(title, { exact: true }) }).first();
  await tile.waitFor({ timeout: 60000 });
  // This beat installs; on a cluster that has it, the panel offers Uninstall.
  if (await tile.getByText('Installed', { exact: true }).isVisible()) throw new Error(`${title} is already installed: run the clean-up first`);
  await pause(page);
  await highlightAll(pane, [tile], { hold: 1500, label: 'tile' });
  await clearHighlights(page);
  await tile.getByRole('button').first().click();
  await pause(page);
  await page.getByRole('link', { name: 'Install', exact: true }).or(page.getByRole('button', { name: 'Install', exact: true })).first().click();
  await page.waitForURL((u) => u.pathname.includes('subscribe'), { timeout: 60000 });
  await pause(page, 3000); // the defaults: channel, namespace
  await page.getByRole('button', { name: 'Install', exact: true }).click();
  await page.getByText(/ready for use/i).first().waitFor({ timeout: 900000 });
  mark(pane, 'installed');
  await pause(page);
  const csv = oc('-n', namespace, 'get', 'csv', '-o', 'name').split('\n').map((n) => n.replace(/^.*\//, '')).find((n) => n.startsWith(csvPrefix));
  await consoleGo(page, `/k8s/ns/${namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion`);
  const r = row(page, title);
  await r.getByText('Succeeded', { exact: true }).waitFor({ timeout: 900000 });
  await r.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await highlightAll(pane, [r, r.getByText('Succeeded', { exact: true }).first()], { label: `after ${csv}` });
}

// The Reloader console's event log is a scroll box whose wrappers hide
// overflow, which cuts the outlines' sides: let it take its full height.
const openEventLog = (page) => page.locator('tbody tr').first().evaluate((el) => {
  const card = el.closest('.bg-card');
  for (let n = el.closest('table').parentElement; n && n !== card; n = n.parentElement) {
    n.style.overflow = 'visible'; n.style.height = 'auto'; n.style.maxHeight = 'none';
  }
}).catch(() => {});
const restarts = (page) => page.locator('tbody tr').filter({ hasText: 'Deployment' });
const reloaderCheckout = (page) => page.goto(url.reloader() + '/deployments/Deployment/acme-shop/checkout')
  .then(() => page.locator('.react-flow__node').filter({ hasText: 'checkout-db' }).first().waitFor({ timeout: 90000 }))
  .then(() => pause(page, 2000));

const SECRET = '/vault/secrets-engines/kv/kv/dev%2Facme-shop%2Fcheckout%2Fdb?namespace=acme';
const POLICY = '/vault/policy/acl/kv.acme.acme-shop.checkout?namespace=acme';
const originalRule = (page) => page.locator('span.token.string-literal').filter({ hasText: '"kv/data/dev/acme-shop/checkout/*"' });

export const scenes = [
  {
    id: '02a', name: 'install-mto', chapter: 'Step 1', title: 'Install Multi-Tenant Operator', layout: 'console', sessions: ['openshift'],
    run: (pane) => installFromCatalog(pane, { keyword: 'multi tenant', title: 'Multi Tenant Operator', csvPrefix: 'tenant-operator.v', namespace: 'multi-tenant-operator' }),
    // The next beat patches its IntegrationConfig, which the operator creates.
    post: () => waitFor(() => oc('-n', 'multi-tenant-operator', 'get', 'integrationconfig', 'tenant-operator-config', '-o', 'name'), 'the IntegrationConfig'),
  },
  {
    id: '02b', name: 'template-operator', chapter: 'Step 1', title: 'Template Operator on', layout: 'split', tape: '02b-template-operator.tape', sessions: ['openshift'],
    before: (page) => consoleGo(page, '/k8s/all-namespaces/deployments?name=template-operator-v2'),
    find: async (page) => {
      const r = page.locator('tr').filter({ has: page.getByRole('link', { name: /template-operator-v2/ }) }).filter({ hasText: /1 of 1 pods/ }).first();
      return (await r.isVisible()) ? [r.getByRole('link', { name: /template-operator-v2/ }).first(), r.getByText(/1 of 1 pods/).first()] : null;
    },
  },
  { id: '02c', name: 'privileged', chapter: 'Step 1', title: 'Privileged namespaces', layout: 'terminal', tape: '02c-privileged.tape' },
  {
    id: '03a', name: 'vault', chapter: 'Step 2', title: 'Vault Enterprise', layout: 'split', tape: '03a-vault.tape', sessions: ['openshift'],
    before: podsBefore('vault'), find: runningPods(['vault-0']),
  },
  { id: '03b', name: 'vault-version', chapter: 'Step 2', title: 'Vault answers', layout: 'terminal', tape: '03b-vault-version.tape' },
  {
    id: '04', name: 'vco', chapter: 'Step 3', title: 'Vault Config Operator', layout: 'split', tape: '04-vco.tape', sessions: ['openshift'],
    before: podsBefore('vault-config-operator'),
    find: async (page) => {
      const r = page.locator('tr').filter({ has: page.getByRole('link', { name: /^vault-config-operator-/ }) }).filter({ hasText: 'Running' }).first();
      return (await r.isVisible()) ? [r.locator('td').first()] : null;
    },
  },
  {
    id: '05a', name: 'install-eso', chapter: 'Step 4', title: 'External Secrets Operator', layout: 'console', sessions: ['openshift'],
    run: (pane) => installFromCatalog(pane, { keyword: 'external secrets', title: 'External Secrets Operator for Red Hat OpenShift', csvPrefix: 'openshift-external-secrets-operator', namespace: 'external-secrets-operator' }),
  },
  {
    id: '05b', name: 'eso-config', chapter: 'Step 4', title: 'Its configuration', layout: 'split', tape: '05b-eso-config.tape', sessions: ['openshift'],
    before: podsBefore('external-secrets'),
    find: async (page) => {
      const rows = page.locator('tr').filter({ has: page.getByRole('link', { name: /^external-secrets/ }) }).filter({ hasText: 'Running' });
      return (await rows.count()) >= 3 ? [rows.nth(0), rows.nth(1), rows.nth(2)].map((r) => r.locator('td').first()) : null;
    },
  },
  {
    id: '05c', name: 'reloader', chapter: 'Step 4', title: 'Reloader', layout: 'split', tape: '05c-reloader.tape', sessions: ['openshift'],
    before: podsBefore('reloader'),
    find: async (page) => {
      const rows = page.locator('tr').filter({ has: page.getByRole('link', { name: /^reloader-/ }) }).filter({ hasText: 'Running' });
      return (await rows.count()) >= 4 ? [0, 1, 2, 3].map((i) => rows.nth(i).locator('td').first()) : null;
    },
  },
  {
    id: '05d', name: 'reloader-console', chapter: 'Step 4', title: "Reloader's console", layout: 'console',
    run: async (pane) => {
      const { page } = pane;
      await page.goto(url.reloader() + '/deployments');
      await page.getByText('Deployments').first().waitFor({ timeout: 90000 });
      await pause(page, 2000);
      ready(pane); mark(pane, 'before');
      // Nothing of the tenants' yet: only Reloader's own three components.
      const cards = ['reloader-enterprise-gateway', 'reloader-enterprise-console', 'reloader-reloader']
        .map((n) => page.getByText(n, { exact: true }).first());
      await highlightAll(pane, cards, { hold: 4000, label: 'empty' });
    },
  },
  {
    id: '06a', name: 'vault-k8s-auth', chapter: 'Step 5', title: 'Kubernetes login', layout: 'split', tape: '06a-vault-k8s-auth.tape',
    before: (page) => vaultGo(page, '', '/vault/access'),
    find: (page) => visible(page.getByRole('link', { name: /kubernetes\// })).then((l) => l && [l]),
    refresh: vaultRefresh,
  },
  {
    id: '06b', name: 'vco-policy', chapter: 'Step 5', title: 'The narrow policy', layout: 'split', tape: '06b-vco-policy.tape',
    before: (page) => vaultGo(page, '', '/vault/policies/acl'),
    find: (page) => visible(page.getByRole('link', { name: 'vco-admin', exact: true })).then((l) => l && [l]),
    refresh: vaultRefresh,
  },
  {
    id: '07', name: 'extension', chapter: 'Step 6', title: 'The extension', layout: 'split', tape: '07-extension.tape', sessions: ['openshift'],
    before: (page) => consoleGo(page, '/search/ns/vault-config?kind=templates.v2.stakater.com~v2alpha1~TemplateInstance'),
    find: (page) => visible(page.getByRole('link', { name: 'mto-extension-vault-enterprise-parent', exact: true })).then((l) => l && [l]),
  },
  {
    id: '08a', name: 'tenants', chapter: 'Step 7', title: 'Tenants appear', layout: 'split', tape: '08a-tenants.tape', sessions: ['mto'],
    // The console is switched on before this beat; see recording.md.
    pre: async () => {
      oc('-n', 'multi-tenant-operator', 'patch', 'integrationconfig', 'tenant-operator-config', '--type', 'merge', '-p',
        JSON.stringify({ spec: { components: { console: true, showback: true }, accessControl: { privileged: { users: ['mto@stakater.com'] } } } }));
      await waitFor(() => url.mto() !== 'https://' && oc('-n', 'multi-tenant-operator', 'get', 'secret', 'tenant-operator-console-credentials', '-o', 'name'), 'the Multi-Tenant Operator console');
    },
    before: (page) => mtoGo(page, '/tenants', page.getByText('No tenants found').first()),
    find: async (page) => {
      const a = page.getByRole('link', { name: 'acme', exact: true });
      const g = page.getByRole('link', { name: 'globex', exact: true });
      return (await a.isVisible()) && (await g.isVisible()) ? [a, g] : null;
    },
    // A reload shows the console's loading placeholders, so it reloads only
    // once the apply has created the tenants.
    refresh: reload,
    refreshAfter: /tenant.tenantoperator.stakater.com.globex (created|configured|unchanged)/,
  },
  {
    id: '08b', name: 'vault-namespaces', chapter: 'Step 7', title: 'Vault namespaces appear', layout: 'split', tape: '08b-vault-namespaces.tape',
    // The namespaces appear about 20 seconds after 08a's apply, so this pane
    // opens on its "before" during 08a.
    openEarly: true,
    before: async (page) => { await vaultGo(page, '', '/vault/dashboard'); await openNamespacePicker(page); },
    find: async (page) => {
      const a = namespaceEntry(page, 'acme');
      const g = namespaceEntry(page, 'globex');
      return (await a.isVisible()) && (await g.isVisible()) ? [a, g] : null;
    },
    refresh: async (page) => {
      const refresh = page.getByRole('button', { name: /refresh list/i });
      if (!(await refresh.isVisible())) await openNamespacePicker(page);
      await refresh.click();
    },
    // Their cause is 08a's apply; the picker refreshes once the terminal has
    // listed them, so the console follows the command on screen.
    refreshAfter: /acme\/[\s\S]*globex\//,
  },
  {
    id: '08c', name: 'projects', chapter: 'Step 7', title: 'Projects, by tenant', layout: 'console', sessions: ['mto'],
    run: async (pane) => {
      const { page } = pane;
      await mtoGo(page, '/namespaces', page.getByText('globex-web', { exact: true }).first());
      ready(pane); mark(pane, 'before');
      const r = (ns) => page.locator('tr').filter({ has: page.getByText(ns, { exact: true }) }).first();
      await r('acme-shop').evaluate((el) => { el.closest('table').parentElement.style.overflow = 'visible'; });
      await highlightAll(pane, [r('acme-shop'), r('globex-web')]);
    },
  },
  {
    id: '08d', name: 'tenant-label', chapter: 'Step 7', title: 'The tenant label', layout: 'console', sessions: ['openshift'],
    run: async (pane) => {
      const { page } = pane;
      await consoleGo(page, '/k8s/cluster/projects/acme-shop/details', 'stakater.com/tenant=acme');
      ready(pane); mark(pane, 'before');
      await highlightAll(pane, [page.locator('.pf-v6-c-label').filter({ hasText: 'stakater.com/tenant=acme' }).first()]);
    },
  },
  {
    id: '09a', name: 'kv-put', chapter: 'Step 8', title: 'The password, in Vault', layout: 'split', tape: '09a-kv-put.tape',
    // acme's kv engine, still empty: the put creates dev/ in it.
    before: (page) => vaultGo(page, 'acme', '/vault/secrets-engines/kv/kv/list?namespace=acme'),
    find: (page) => visible(page.getByRole('link').filter({ hasText: /^\s*dev\/\s*$/ })).then((l) => l && [l]),
    refresh: vaultRefresh,
  },
  {
    id: '09b', name: 'checkout', chapter: 'Step 8', title: 'The app gets it', layout: 'split', tape: '09b-checkout.tape', sessions: ['openshift'],
    before: (page) => consoleGo(page, '/k8s/ns/acme-shop/secrets'),
    find: (page) => visible(page.getByRole('link', { name: 'checkout-db', exact: true })).then((l) => l && [l]),
    // Then the Secret's page, to show its owner.
    after: async (pane) => {
      const { page } = pane;
      await clearHighlights(page);
      await page.getByRole('link', { name: 'checkout-db', exact: true }).first().click();
      await page.getByText('Owner', { exact: true }).first().waitFor({ timeout: 60000 });
      await page.getByText('Owner', { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      await pause(page, 1500);
      await highlightAll(pane, [page.locator('dd').filter({ has: page.getByRole('link', { name: 'checkout-db' }) }).first()], { label: 'owner' });
    },
  },
  {
    id: '09c', name: 'policy', chapter: 'Step 8', title: 'The policy nobody wrote', layout: 'console',
    run: async (pane) => {
      const { page } = pane;
      await vaultGo(page, 'acme', POLICY);
      ready(pane); mark(pane, 'before');
      await highlightAll(pane, [originalRule(page).first()]);
    },
  },
  { id: '09d', name: 'logs', chapter: 'Step 8', title: 'The app reads it', layout: 'terminal', tape: '09d-logs.tape' },
  {
    id: '10a', name: 'rotate', chapter: 'Step 9', title: 'First rotation', layout: 'split', tape: '10a-rotate.tape',
    before: reloaderCheckout,
    find: async (page) => ((await restarts(page).count()) >= 1
      ? (await openEventLog(page), [page.locator('.react-flow__node').filter({ hasText: 'checkout-db' }).first(), restarts(page).nth(0)])
      : null),
    refresh: reloaderRefresh,
  },
  {
    id: '10b', name: 'rotate-again', chapter: 'Step 9', title: 'Second rotation', layout: 'split', tape: '10b-rotate-again.tape',
    before: reloaderCheckout,
    find: async (page) => ((await restarts(page).count()) >= 2 ? (await openEventLog(page), [restarts(page).nth(0), restarts(page).nth(1)]) : null),
    refresh: reloaderRefresh,
  },
  {
    id: '10c', name: 'versions', chapter: 'Step 9', title: 'Three versions', layout: 'console',
    run: async (pane) => {
      const { page } = pane;
      await vaultGo(page, 'acme', SECRET);
      await page.getByText('Version History', { exact: true }).first().click();
      await pause(page, 2000);
      ready(pane); mark(pane, 'before');
      await highlightAll(pane, ['3', '2', '1'].map((n) => page.getByText(`Version ${n}`, { exact: true }).first()));
    },
  },
  { id: '11a', name: 'isolation', chapter: 'Step 10', title: 'Allowed, then refused', layout: 'terminal', tape: '11a-isolation.tape' },
  {
    id: '11b', name: 'put-back', chapter: 'Step 10', title: 'Put back', layout: 'split', tape: '11b-put-back.tape',
    before: (page) => vaultGo(page, 'acme', POLICY),
    find: (page) => visible(originalRule(page)).then((l) => l && [l]),
    refresh: vaultRefresh,
  },
  {
    id: '00', name: 'cold-open', chapter: 'Cold open', title: 'The end result', layout: 'console', sessions: ['mto'],
    run: async (pane) => {
      const { page } = pane;
      await vaultGo(page, '', '/vault/dashboard');
      await openNamespacePicker(page);
      ready(pane); mark(pane, 'before');
      await highlightAll(pane, [namespaceEntry(page, 'acme'), namespaceEntry(page, 'globex')]);
      await mtoGo(page, '/tenants', page.getByRole('link', { name: 'globex', exact: true }));
      mark(pane, 'mto tenants');
      await highlightAll(pane, [page.getByRole('link', { name: 'acme', exact: true }), page.getByRole('link', { name: 'globex', exact: true })]);
    },
  },
];

