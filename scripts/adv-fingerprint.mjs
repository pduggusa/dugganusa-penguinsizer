#!/usr/bin/env node
/* NON-REGRESSION ANCHOR FOR THE NVL72 PATH.
 *
 * The architecture rewrite replaces every NVL72 constant in derive() with a value read
 * from the architecture. For gb300-nvl72 the new derivation must reproduce the old
 * constants EXACTLY — 18 trays, 72 GPU, 142 kW, 8 racks/SU, 4 rails, and a perRack of
 * {compute:72, storage:36, bmc:27, mgmt:18}. If the default build moves at all, the
 * change is wrong and this is how you find that out in one command instead of in front
 * of a customer.
 *
 *   node scripts/adv-fingerprint.mjs > /tmp/before.json     # before the change
 *   node scripts/adv-fingerprint.mjs > /tmp/after.json      # after
 *   diff /tmp/before.json /tmp/after.json                   # must be empty
 *
 * Same zero-dependency posture as the other scripts: resolve Playwright from the
 * directory you RUN this from, not from here.
 */
import { createRequire } from 'node:module';
let chromium;
try {
  const req = createRequire(process.cwd() + '/');
  ({ chromium } = req('playwright'));
} catch {
  try { ({ chromium } = await import('playwright')); }
  catch {
    console.error('\nPlaywright not found. Run this from a directory that has it installed.\n');
    process.exit(2);
  }
}

const URL_ = (() => { const i = process.argv.indexOf('--url'); return i > -1 ? process.argv[i + 1] : null; })()
  || 'file://' + new URL('../index.html', import.meta.url).pathname;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1300 } });
const pageErrors = [];
p.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
p.on('dialog', d => d.accept());

/* --set advVastMode=auto  drives a real SELECT, it does not poke localStorage.
 *
 * The first cut wrote a state object straight into storage and it silently replaced every
 * default the planner ships with — racks-per-row, spares, tray rise — so a comparison
 * meant to isolate one field moved fifteen. Driving the control the user drives is both
 * more honest and the only way the override cannot lie about what it changed.
 *
 * Needed because this change moves a DEFAULT: storage is off by default now, so proving
 * the NVL72 composition did not move means switching storage back on through the UI
 * rather than letting a deliberate default change masquerade as drift. */
const SETS = process.argv.reduce((a, v, i) =>
  (process.argv[i - 1] === '--set' ? a.concat([v.split('=')]) : a), []);

await p.goto(URL_);
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForTimeout(900);
await p.click('#tabs button[data-v="rack"]');
await p.waitForTimeout(400);
await p.click('#rkMode button[data-m="advanced"]').catch(() => {});
await p.waitForTimeout(900);
for (const [id, val] of SETS) {
  await p.evaluate(([i, v]) => {
    const el = document.getElementById(i); if (!el) throw new Error('no control #' + i);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [id, val]);
  await p.waitForTimeout(500);
}

const fp = await p.evaluate(() => {
  const d = window.__ADV_MODEL && window.__ADV_MODEL();
  if (!d) return { error: 'no advanced model' };
  /* Everything the composition rewrite could plausibly move. Deliberately includes the
   * BOM line-for-line: a rack count that holds while the parts list shifts underneath
   * is the exact failure this file exists to catch. */
  return {
    gpus: d.gpus, realGpus: d.realGpus, suNeeded: d.suNeeded,
    computeRacks: d.computeRacks, netRacks: d.netRacks, vRacks: d.vRacks, mRacks: d.mRacks,
    totalRacks: d.racks.length,
    perRack: d.perRack,
    ibDown: d.ibDown, ibUp: d.ibUp, ethDown: d.ethDown, ethUp: d.ethUp,
    bmc: d.bmc, oobUp: d.oobUp, totalLinks: d.totalLinks, spares: d.spares,
    swU: d.swU, rails: d.rails, portsPerRack: d.portsPerRack,
    rowRun: d.rowRun, risers: d.risers, trunkPanels: d.trunkPanels, rowTrunks: d.rowTrunks,
    floorAreaM2: d.floorAreaM2, gridSlots: d.gridSlots, emptySlots: d.emptySlots,
    fabric: { ibLeaf: d.f.ibLeaf, ibSpine: d.f.ibSpine, ethComputeLeaf: d.f.ethComputeLeaf,
              ethStorageLeaf: d.f.ethStorageLeaf, ethSpine: d.f.ethSpine, basis: d.f.basis },
    links: d.L.map(l => [l.cls, l.n, l.speed, l.reach]),
    /* BOM shape changes in Phase E (line items gain ids and provenance), so compare on
     * the fields that must NOT move: what you order and how many. */
    bom: (d.bom || []).map(x => [x.cat, x.item, x.qty, x.sp]),
    rackKinds: d.racks.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {}),
  };
});

if (pageErrors.length) fp.pageErrors = [...new Set(pageErrors)];
console.log(JSON.stringify(fp, null, 1));
await b.close();
process.exit(pageErrors.length ? 1 : 0);
