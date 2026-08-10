#!/usr/bin/env node
/* WHAT WOULD AN ORDERING SYSTEM ACTUALLY RECEIVE?
 *
 * The BOM is meant to be plumbed into an order system one day, so the test is not "does
 * a JSON file download" — it is whether every line is something a buyer could act on:
 * a stable id, a vendor, a part number or an honest null, a unit of measure, and a
 * provenance flag saying whether we read the number or computed it.
 *
 *   node scripts/probe-bom.mjs [--arch relion-xe4418] [--feed 415-3-300]
 */
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = createRequire(process.cwd() + '/')('playwright')); }
catch { try { ({ chromium } = await import('playwright')); }
  catch { console.error('\nPlaywright not found. Run from a directory that has it.\n'); process.exit(2); } }

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
const URL_ = arg('--url', null) || 'file://' + new URL('../index.html', import.meta.url).pathname;
const ARCH = arg('--arch', 'relion-xe4418'), FEED = arg('--feed', '415-3-300');

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1300 } });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 180)));
p.on('dialog', d => d.accept());
await p.goto(URL_);
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForTimeout(700);
await p.click('#tabs button[data-v="rack"]');
await p.waitForTimeout(250);
await p.click('#rkMode button[data-m="advanced"]').catch(() => {});
await p.waitForTimeout(600);
for (const [id, v] of [['advArch', ARCH], ['advFeed', FEED]]) {
  await p.evaluate(([i, val]) => { const el = document.getElementById(i);
    el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
  await p.waitForTimeout(400);
}
await p.click('#tabs button[data-v="build"]').catch(() => {});
await p.waitForTimeout(700);

const bom = await p.evaluate(() => window.__BOM && window.__BOM());
if (!bom) { console.error('__BOM() returned nothing — the build sheet has no model'); await b.close(); process.exit(1); }

console.log(`\n${bom.format} v${bom.version} — ${bom.build.label}`);
console.log(`  ${bom.build.gpus.toLocaleString()} GPU · ${bom.build.computeRacks} compute racks · ${bom.build.nodesPerRack}/rack @ ${bom.build.rackKw} kW (${bom.build.boundBy})`);
console.log(`  feed ${bom.build.feed.label} ${bom.build.feed.kw} kW · ${bom.build.feed.connector} · ${bom.build.feed.mode}`);
console.log(`  provenance ${bom.build.provenance} · fabric ${bom.build.fabric.derived ? 'DERIVED' : 'NVIDIA RA'}`);
console.log(`  consistency: ${bom.consistency.fail} FAIL, ${bom.consistency.warn} WARN — quotable: ${bom.consistency.quotable}`);
console.log(`  ${bom.lines.length} order lines, ${bom.unquotable} with no published part number\n`);

console.log('  id                              vendor                 mpn            uom   qty  spare   order  prov');
console.log('  ' + '─'.repeat(104));
for (const l of bom.lines) {
  console.log(`  ${l.id.slice(0, 30).padEnd(30)}  ${l.vendor.slice(0, 20).padEnd(20)}  ${(l.mpn || '—').slice(0, 13).padEnd(13)}  ${l.uom.padEnd(4)} ${String(l.qty).padStart(5)} ${String(l.spares).padStart(6)} ${String(l.orderQty).padStart(7)}  ${l.provenance}${l.mergedFrom > 1 ? ` (${l.mergedFrom} merged)` : ''}`);
}

// ---- assertions an order system would make -----------------------------------------
const problems = [];
const ids = bom.lines.map(l => l.id);
if (new Set(ids).size !== ids.length) problems.push('DUPLICATE ids — rationalization failed; that is two PO lines for one part');
bom.lines.forEach(l => {
  if (!l.id) problems.push('line with no id: ' + l.description);
  if (!l.vendor) problems.push('no vendor: ' + l.id);
  if (!l.uom) problems.push('no unit of measure: ' + l.id);
  if (!(l.orderQty === l.qty + l.spares)) problems.push('orderQty != qty + spares: ' + l.id);
  if (!['vendor', 'derived', 'assumed'].includes(l.provenance)) problems.push('bad provenance: ' + l.id);
  if (l.mpn === undefined) problems.push('mpn undefined rather than null: ' + l.id);
});
/* The one that matters most: nothing we computed may claim an NVIDIA reference table. */
const laundered = bom.lines.filter(l => l.provenance === 'derived' && /NVIDIA RA|RA Table/.test(l.basis));
if (laundered.length) problems.push(`PROVENANCE LAUNDERING — ${laundered.length} derived line(s) cite an NVIDIA RA table: ${laundered.map(l => l.id).join(', ')}`);
if (bom.build.provenance === 'derived' && bom.consistency.rules.every(r => r.id !== 'V2'))
  problems.push('derived build carries no V2 blessed-configuration warning');

console.log('\n  ' + '─'.repeat(104));
if (problems.length) { problems.forEach(x => console.log('  ✗ ' + x)); }
else console.log('  ✓ Every line is orderable-shaped: unique id, vendor, UoM, honest MPN, provenance intact.');
if (errs.length) console.log('\n  PAGE ERRORS:\n' + [...new Set(errs)].map(e => '    ' + e).join('\n'));
await b.close();
process.exit(problems.length || errs.length ? 1 : 0);
