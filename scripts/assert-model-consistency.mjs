#!/usr/bin/env node
/* EVERY RULE MUST BE ABLE TO FAIL — OR IT IS DECORATION.
 *
 * The consistency rules in index.html check the things arithmetic will happily get
 * wrong: a rack the feed cannot energise, a DAC that does not reach, a fabric with more
 * links than the leaf has ports, our own numbers wearing NVIDIA's label.
 *
 * A rule that always returns PASS is indistinguishable from one that is not wired up.
 * That is the same defect scripts/assert-controls-move-the-model.mjs exists for, one
 * layer up — so this file does two jobs:
 *
 *   1. SWEEP    every architecture across the whole feed ladder, and assert the model
 *               stays coherent (no crashes, no NaN, no undefined verdicts).
 *   2. PROVOKE  drive inputs chosen to break a specific rule, and assert that rule
 *               actually reports it. If a provocation comes back PASS, the check is
 *               asleep and this exits non-zero.
 *
 *   node scripts/assert-model-consistency.mjs [--url file:///...] [--verbose]
 *
 * Exit 0 = the sweep is coherent AND every provocation fired.
 */
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = createRequire(process.cwd() + '/')('playwright')); }
catch { try { ({ chromium } = await import('playwright')); }
  catch { console.error('\nPlaywright not found. Run from a directory that has it installed.\n'); process.exit(2); } }

const URL_ = (() => { const i = process.argv.indexOf('--url'); return i > -1 ? process.argv[i + 1] : null; })()
  || 'file://' + new URL('../index.html', import.meta.url).pathname;
const VERBOSE = process.argv.includes('--verbose');

const ARCHES = ['relion-xe4418', 'altus-xe4318', 'altus-xe4318v2', 'gb300-nvl72', 'dgx-b300'];
const LADDER = ['60', '100', '200', '250', '300', '400', '48dc-orv3'];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1300 } });
const pageErrors = [];
p.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
p.on('dialog', d => d.accept());
await p.goto(URL_);

/* Drive the real controls. Poking localStorage replaces the planner's whole default
 * object, so a "change one field" override silently changes fifteen — and then the
 * harness is testing a configuration nobody could reach through the UI. */
async function configure(state) {
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(600);
  await p.click('#tabs button[data-v="rack"]');
  await p.waitForTimeout(200);
  await p.click('#rkMode button[data-m="advanced"]').catch(() => {});
  await p.waitForTimeout(600);
  for (const [id, val] of Object.entries(state)) {
    const ok = await p.evaluate(([i, v]) => {
      /* A segmented control is a <div id="rkPlace"> of buttons. The first cut called
       * getElementById first, matched that DIV, set .value on it — which is a no-op on a
       * div — dispatched events nobody listens for, and returned true. So every seg-based
       * provocation silently tested the DEFAULT configuration and passed. The harness was
       * lying, not the app. Only real form controls take .value. */
      const el = document.getElementById(i);
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
        el.value = v;
        /* A <select> given a value it has no <option> for sets itself to "" and reports no
         * error. That is how this harness swept 48 "configurations" that were all the same
         * one: the feed keys changed under it, every assignment silently no-opped, and it
         * reported the default as coherent 48 times over. Assert the value STUCK. */
        if (el.tagName === 'SELECT' && String(el.value) !== String(v)) return 'rejected:' + v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'field';
      }
      if (el && el.classList.contains('seg')) {
        const btn = [...el.querySelectorAll('button')]
          .find(b => Object.values(b.dataset).includes(v));
        if (!btn) return false;
        btn.click();
        return 'seg';
      }
      const any = document.querySelector(`[data-ak="${i}"]`);
      if (any) { any.value = v;
        any.dispatchEvent(new Event('input', { bubbles: true })); return 'ak'; }
      return false;
    }, [id, val]);
    if (!ok || String(ok).startsWith('rejected:'))
      throw new Error(`control "${id}" did not accept "${val}" — it would silently test the default instead`);
    await p.waitForTimeout(320);
  }
  return p.evaluate(() => {
    const d = window.__ADV_MODEL && window.__ADV_MODEL();
    if (!d) return null;
    return { rules: d.rules, arch: d.arch.key, label: d.arch.label,
      nodesPerRack: d.arch.nodesPerRack, gpusPerRack: d.arch.gpusPerRack,
      rackKw: d.arch.rackKw, feedKw: d.arch.feedKw, bound: d.arch.bound,
      racks: d.computeRacks, totalRacks: d.racks.length, links: d.totalLinks,
      derived: !!d.f.derived,
      gpus: d.realGpus, rackScale: d.arch.rackScale,
      gpusPerSU: d.arch.gpusPerSU, nodeGpus: d.arch.nodeGpus,
      bomLines: d.bom.length, unquotable: d.bom.filter(x => !x.mpn).length };
  });
}
const verdict = (m, id) => (m.rules.find(r => r.id === id) || {}).v;

// ───────────────────────────── 1. SWEEP ──────────────────────────────────────────
console.log('\n' + '─'.repeat(76));
console.log('SWEEP — every architecture across the feed ladder');
console.log('─'.repeat(76));
const bad = [];
let cells = 0;
for (const arch of ARCHES) {
  const line = [];
  for (const feed of LADDER) {
    const m = await configure({ advArch: arch, advFeed: feed, gpus: 1152 });
    cells++;
    if (!m) { bad.push(`${arch}/${feed}: no model`); line.push('  ERR'); continue; }
    const nums = [m.nodesPerRack, m.gpusPerRack, m.rackKw, m.racks, m.links];
    if (nums.some(n => !Number.isFinite(n) || n <= 0)) bad.push(`${arch}/${feed}: non-finite ${JSON.stringify(nums)}`);
    /* YOU GET WHAT YOU ASKED FOR, ROUNDED TO THE PURCHASABLE BLOCK AND NO FURTHER.
     * Every harness was green while the planner turned a 512-GPU target into 560, because
     * nothing checked the delivered count against the requested one. A rack-scale SKU may
     * round up to a whole scalable unit — that rounding is real and E3 quantifies it. A
     * node build may only round up to a whole NODE. Anything beyond that is silicon
     * nobody ordered. */
    const block = m.rackScale ? m.gpusPerSU : m.nodeGpus;
    const owed = Math.max(block, Math.ceil(1152 / block) * block);
    if (m.gpus !== owed)
      bad.push(`${arch}/${feed}: asked 1152, delivered ${m.gpus}, should be ${owed} (block ${block})`);
    if (m.rules.some(r => !['PASS', 'WARN', 'FAIL'].includes(r.v))) bad.push(`${arch}/${feed}: bad verdict`);
    const f = m.rules.filter(r => r.v === 'FAIL').length;
    line.push(String(m.nodesPerRack).padStart(3) + (f ? `!${f}` : '  '));
  }
  console.log(`  ${arch.padEnd(15)} nodes/rack by feed: ${line.join(' ')}`);
}
console.log(`  ${cells} configurations swept · ${bad.length ? bad.length + ' PROBLEMS' : 'all coherent'}`);
bad.slice(0, 8).forEach(x => console.log('    ✗ ' + x));

// ─────────────────────────── 2. PROVOCATIONS ─────────────────────────────────────
/* Each entry: a configuration chosen so ONE named rule must not come back PASS, and
 * why that is the right answer. If it passes, the rule is asleep. */
const PROVOCATIONS = [
  { id: 'E1', want: 'FAIL', state: { advArch: 'gb300-nvl72', advFeed: '250' },
    why: 'GB300 draws 142 kW; 415 V 3ph 250 A derates to 140.9 kW. 1.1 kW short is still short.' },
  { id: 'E4', want: 'WARN', state: { advArch: 'dgx-b300', advFeed: '400', advRackU: '52' },
    why: 'DGX B300 ships air OR liquid; above the air envelope the build commits to the DTC variant.' },
  { id: 'E4', want: 'PASS', state: { advArch: 'gb300-nvl72', advFeed: '400' },
    why: 'CONTROL: NVL72 is pure direct-to-chip liquid, so 142 kW is what it is built for.' },
  { id: 'N2', want: 'FAIL', state: { advArch: 'relion-xe4418', advFeed: '300', rkPlace: 'tor' },
    why: 'Top-of-rack with 8 rails needs 8 leaf switches in every rack, or rail optimisation is gone.' },
  { id: 'N3', want: 'WARN', state: { advArch: 'gb300-nvl72', advFeed: '300', ibUplinksPerLeaf: '24' },
    why: '24 uplinks against 72 downlinks is 1:3 oversubscription — legal, and a decision.' },
  { id: 'N9', want: 'WARN', state: { advArch: 'relion-xe4418', advFeed: '200', cableRunM: '200' },
    why: 'Past 92 m one-way the fibre costs more than a switch hop — moving gear beats removing a hop.' },
  { id: 'N9', want: 'PASS', state: { advArch: 'relion-xe4418', advFeed: '200', cableRunM: '10' },
    why: 'CONTROL: at pod scale the switch dominates 9:1 and hop count is the lever.' },
  { id: 'C3', want: 'FAIL', state: { advArch: 'gb300-nvl72', advFeed: '300', cableRunM: '600' },
    why: 'A 600 m run exceeds the 500 m DR8 optical budget. (floors/risers are gone with the floor planner.)' },
  { id: 'C5', want: 'FAIL', state: { advArch: 'gb300-nvl72', advFeed: '300', cableRunM: '200' },
    why: 'A 200 m run puts the OOB uplink past DAC and past AOC — the BOM part is wrong at that reach.' },
  { id: 'V2', want: 'WARN', state: { advArch: 'relion-xe4418', advFeed: '300' },
    why: 'A derived composition is our arithmetic, not a vendor-blessed validated configuration.' },
  { id: 'S1', want: 'FAIL', state: { advArch: 'gb300-nvl72', advFeed: '300', gpus: '4608', siteKw: '500' },
    why: 'A 4,608-GPU NVL72 build draws far more than a 500 kW room can deliver.' },
  { id: 'S1', want: 'WARN', state: { advArch: 'relion-xe4418', advFeed: '200', gpus: '512', siteKw: '1000' },
    why: 'Fits, but over 90% of the site budget — no room for a phase 2 or a hot day.' },
  { id: 'S1', want: 'PASS', state: { advArch: 'relion-xe4418', advFeed: '200', gpus: '512', siteKw: '1200' },
    why: 'CONTROL: the RFQ case — 512 B300 in a 1.2 MW room, comfortably inside budget.' },
  { id: 'E1', want: 'PASS', state: { advArch: 'gb300-nvl72', advFeed: '300' },
    why: 'CONTROL: the same rule must PASS on the 300 A feed, or it is stuck-on-fail.' },
  { id: 'V2', want: null, state: { advArch: 'gb300-nvl72', advFeed: '300' },
    why: 'CONTROL: no blessed-config warning on a vendor-published architecture.' },
];

console.log('\n' + '─'.repeat(76));
console.log('PROVOCATIONS — drive each rule to the verdict it must reach');
console.log('─'.repeat(76));
const misfires = [];
for (const t of PROVOCATIONS) {
  const m = await configure(t.state);
  const got = m ? verdict(m, t.id) : 'NO-MODEL';
  const ok = t.want === null ? got === undefined : got === t.want;
  if (!ok) misfires.push(`${t.id} wanted ${t.want ?? 'absent'}, got ${got ?? 'absent'} — ${JSON.stringify(t.state)}`);
  console.log(`  ${ok ? '✓' : '✗'} ${t.id.padEnd(3)} ${String(t.want ?? 'absent').padEnd(6)} ${ok ? '' : `GOT ${got ?? 'absent'} `}${t.why}`);
  if (VERBOSE && m) {
    const r = m.rules.find(x => x.id === t.id);
    if (r) console.log(`        ${r.title}\n        ${r.detail.slice(0, 150)}`);
  }
}

const line = '─'.repeat(76);
console.log('\n' + line);
console.log(`  swept          : ${cells} configurations`);
console.log(`  sweep problems : ${bad.length}`);
console.log(`  provocations   : ${PROVOCATIONS.length - misfires.length}/${PROVOCATIONS.length} fired`);
if (pageErrors.length) console.log('\n  PAGE ERRORS:\n' + [...new Set(pageErrors)].slice(0, 6).map(x => '    ' + x).join('\n'));
if (misfires.length) {
  console.log('\n  ✗ These rules did not reach their verdict:\n');
  misfires.forEach(x => console.log('      ' + x));
  console.log('\n  A rule that cannot be driven to FAIL is not checking anything. Either the');
  console.log('  rule is wrong, or the provocation no longer provokes — both need a human.\n');
}
const fail = bad.length || misfires.length || pageErrors.length;
console.log(fail ? '' : '\n  ✓ Sweep coherent, and every rule proved it can fail.\n');
await b.close();
process.exit(fail ? 1 : 0);
