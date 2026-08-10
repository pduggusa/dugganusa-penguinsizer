#!/usr/bin/env node
/* WHAT DOES EACH ARCHITECTURE ACTUALLY BUILD?
 *
 * Issue #1 in one table. Before the fix every row of this would have been identical —
 * 8 racks per SU, 72 GPU and 142 kW a rack, {72,36,27,18} ports — because derive() read
 * the architecture for a label and nothing else. If any two rows below match when their
 * architectures differ, the composition is not being read and the bug is back.
 *
 *   node scripts/probe-arch.mjs [--gpus 1096] [--feed 415-3-300]
 */
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = createRequire(process.cwd() + '/')('playwright')); }
catch { try { ({ chromium } = await import('playwright')); }
  catch { console.error('\nPlaywright not found. Run from a directory that has it.\n'); process.exit(2); } }

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
const URL_ = arg('--url', null) || 'file://' + new URL('../index.html', import.meta.url).pathname;
const GPUS = +arg('--gpus', 1096);
const FEEDS = arg('--feed', null) ? [arg('--feed')] : ['415-3-300', '415-3-250', '415-3-200', '415-3-100'];
const ARCHES = ['gb300-nvl72', 'dell-xe9712', 'relion-xe4418', 'altus-xe4318', 'dgx-b300', 'dell-xe9680l'];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1300 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 180)));
p.on('dialog', d => d.accept());
await p.goto(URL_);

const probe = async (arch, feed) => {
  await p.evaluate(([a, f, g]) => {
    const k = 'penguin-adv-planner-v1';
    let s = {}; try { s = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) {}
    localStorage.setItem(k, JSON.stringify({ ...s, arch: a, feed: f, gpus: g }));
  }, [arch, feed, GPUS]);
  await p.reload();
  await p.waitForTimeout(500);
  await p.click('#tabs button[data-v="rack"]');
  await p.waitForTimeout(250);
  await p.click('#rkMode button[data-m="advanced"]').catch(() => {});
  await p.waitForTimeout(600);
  return p.evaluate(() => {
    const d = window.__ADV_MODEL && window.__ADV_MODEL(); if (!d) return null;
    const a = d.arch;
    return { label: a.label, nodes: a.nodesPerRack, unit: a.grainLabel || 'node',
      gpuR: a.gpusPerRack, kwR: a.rackKw, bound: a.bound, feedKw: a.feedKw,
      racks: d.computeRacks, gpus: d.realGpus, su: d.arch.rackScale ? d.blockTotal : null,
      rails: a.rails, perRack: d.perRack, prov: a.provenance,
      ibLeaf: d.f.ibLeaf, ibSpine: d.f.ibSpine, derived: !!d.f.derived,
      links: d.totalLinks };
  });
};

for (const feed of FEEDS) {
  const rows = [];
  for (const a of ARCHES) rows.push([a, await probe(a, feed)]);
  const fkw = rows.find(r => r[1])?.[1].feedKw;
  console.log(`\n══ feed ${feed} (${fkw} kW) · target ${GPUS.toLocaleString()} GPU ${'═'.repeat(28)}`);
  console.log('  arch              nodes/rk  GPU/rk   kW/rk  bound          racks   GPUs  rails  ports/rack (c/s/b/m)   fabric');
  for (const [k, r] of rows) {
    if (!r) { console.log(`  ${k.padEnd(16)} MODEL UNAVAILABLE`); continue; }
    const pr = `${r.perRack.compute}/${r.perRack.storage}/${r.perRack.bmc}/${r.perRack.mgmt}`;
    console.log(`  ${k.padEnd(16)} ${String(r.nodes).padStart(6)}  ${String(r.gpuR).padStart(6)} ${String(r.kwR).padStart(7)}  ${r.bound.padEnd(13)} ${String(r.racks).padStart(5)} ${String(r.gpus).padStart(6)} ${String(r.rails).padStart(6)}  ${pr.padEnd(20)}  ${r.ibLeaf}L/${r.ibSpine}S ${r.derived ? '[DERIVED]' : '[RA]'}`);
  }
  const sig = new Set(rows.filter(r => r[1]).map(r => JSON.stringify([r[1].nodes, r[1].gpuR, r[1].kwR, r[1].perRack])));
  console.log(`  -> ${sig.size} distinct compositions across ${rows.length} architectures` + (sig.size === 1 ? '   *** ALL IDENTICAL — arch is being ignored ***' : ''));
}
if (errs.length) { console.log('\n  PAGE ERRORS:'); [...new Set(errs)].slice(0, 8).forEach(e => console.log('    ' + e)); }
await b.close();
process.exit(errs.length ? 1 : 0);
