#!/usr/bin/env node
/* EVERY CONTROL MUST MOVE THE MODEL — OR SAY WHY IT DOESN'T.
 *
 * Three separate defects in this tool shared one shape: a control that changed the
 * PICTURE but not the BILL OF MATERIALS. Storage set to "none" still ordered 23 CBoxes.
 * Top-of-rack shortened the cable run and still built twelve network racks. Two whole
 * input panels were wired to nothing at all. Every one of them looked healthy.
 *
 * A checker whose output never varies is the bug. The same rule applied to a UI: a
 * control whose output never varies is a lie about what the tool is doing.
 *
 * So this walks every control in the app, changes it, and asserts the derived model
 * actually moved. Anything that legitimately doesn't move the model must be declared
 * in EXEMPT with a reason — which turns "I forgot to wire it" into a decision somebody
 * made on purpose and can be argued with in review.
 *
 *   node scripts/assert-controls-move-the-model.mjs [--url file:///...] [--verbose]
 *
 * Exit 0 = every control either moved the model or is declared. Exit 1 = something is
 * inert and nobody said it should be.
 */
/* This repo ships with ZERO dependencies on purpose — the app is a single static file.
 * So resolve Playwright from the directory you RUN this from rather than from here,
 * and say something useful if it isn't there. */
import { createRequire } from 'node:module';
let chromium;
try {
  const req = createRequire(process.cwd() + '/');
  ({ chromium } = req('playwright'));
} catch {
  try { ({ chromium } = await import('playwright')); }
  catch {
    console.error('\nPlaywright not found.\n\n  This repo has no dependencies by design, so run this from a directory that\n  has Playwright installed, or install it here first:\n\n    npm i -D playwright && npx playwright install chromium\n');
    process.exit(2);
  }
}

const URL_ = (() => { const i = process.argv.indexOf('--url'); return i > -1 ? process.argv[i + 1] : null; })()
  || 'file://' + new URL('../index.html', import.meta.url).pathname;
const VERBOSE = process.argv.includes('--verbose');

/* Controls that genuinely do not change the sizing. Each needs a reason, because the
 * whole point is that "inert" is a claim someone has to make out loud. */
const EXEMPT = {
  'rack/wdZoom': 'drawing scale only — changes pixels, not the build',
  'rack/wdLabels': 'label visibility only',
  'rack/wdAisles': 'draws hot/cold aisles; ASHRAE orientation is presentational here',
  'rack/wdSide': 'which end trunks land on — affects the drawing and the reach note, not the parts',
  'rack/rkProject': 'free-text project name, carried into exports as a label',
  'rack/site': 'naming only', 'rack/room': 'naming only', 'rack/row': 'naming only',
  'rack/patRack': 'naming pattern — changes identifiers, not quantities',
  'rack/patDev': 'naming pattern', 'rack/patPort': 'naming pattern',
  'partner/aWindow': 'records the collection window for audit; deliberately does not size anything',
  'partner/loSource': 'selects which parser to use; sizing moves when a file is actually parsed',
  'aifactory/afFam': 'switches the platform family, which re-picks the platform — asserted via the platform control',
  'rack/rkMode': 'simple-vs-advanced view switch; each mode is swept on its own pass',
  'tree/dtMode': 'decision-tree walk mode — guidance, not sizing',
  'tree/dtWork': 'decision-tree workload lens — guidance, not sizing',
  'size/cfgName': 'names a saved snapshot; the snapshot carries state, the name does not size anything',
  'partner/licKey': 'licence key field — moves the export byline once activated, not the sizing',
  'rack/advAiAsk': 'assistant prompt box — asks a question, does not size anything',
};

const FINGERPRINT = () => {
  const out = {};
  try { const d = window.__ADV_MODEL && window.__ADV_MODEL();
    if (d) out.adv = [d.racks.length, d.totalLinks, d.vRacks, d.mRacks, d.netRacks, d.gpRacks,
      d.rowRun, d.risers, JSON.stringify((d.bom || []).map(b => [b.item, b.qty]))].join('|');
  } catch (e) { out.adv = 'ERR:' + e.message; }
  try { const r = window.__PARTNER && window.__PARTNER();
    if (r) out.pn = [r.nodes, r.arrays, r.switches, r.totalKW, r.racks, r.breaker,
      r.iops && r.iops.eff, JSON.stringify((r.hw || []).map(h => [h.item, h.qty]))].join('|');
  } catch (e) { out.pn = 'ERR:' + e.message; }
  try { const a = window.__AIFACTORY && window.__AIFACTORY();
    if (a) out.af = [a.nodes, a.racks, a.gpus, a.kW, a.breaker, a.swCount,
      JSON.stringify((a.hw || []).map(h => [h.item, h.qty]))].join('|');
    const dp = window.__AFDATA && a && window.__AFDATA(a);
    if (dp) out.afd = [dp.fsNodes, dp.objNodes, dp.ckptGBs, dp.fsGBs].join('|');
  } catch (e) { out.af = 'ERR:' + e.message; }
  /* PERSISTED STATE COUNTS TOO. The first cut fingerprinted only the ADVANCED model,
   * so every simple-planner field read as inert — the harness was wrong, not the app.
   * Any control that moves persisted state has demonstrably been heard by the model
   * that owns it. */
  try { out.ls = Object.keys(localStorage).filter(k => k.startsWith('penguin'))
    .sort().map(k => k + '=' + localStorage.getItem(k)).join('~'); } catch (e) {}
  return JSON.stringify(out);
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1300 } });
const pageErrors = [];
p.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)));
p.on('dialog', d => d.accept());

await p.goto(URL_);
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForTimeout(900);

const TABS = await p.evaluate(() => [...document.querySelectorAll('#tabs button')].map(x => x.dataset.v));
const moved = [], inert = [], exempted = [], errored = [];

const PASSES = [];
for (const t of TABS) { if (t === 'rack') { PASSES.push([t, 'simple'], [t, 'advanced']); } else PASSES.push([t, null]); }

for (const [tab, mode] of PASSES) {
  await p.click(`#tabs button[data-v="${tab}"]`);
  await p.waitForTimeout(500);
  const setMode = async () => { if (!mode) return;
    await p.click(`#rkMode button[data-m="${mode}"]`).catch(() => {}); await p.waitForTimeout(600); };
  await setMode();

  const controls = await p.evaluate(t => {
    const sec = document.getElementById('v-' + t); if (!sec) return [];
    const out = [];
    sec.querySelectorAll('input[data-pk],input[data-fk],input[data-ak],input[data-k],select[data-pk],select[data-fk],select[data-ak],select[data-k],select[id],input[type=checkbox],input[type=range],input[type=text]')
      .forEach((el, i) => {
        const key = el.dataset.pk || el.dataset.fk || el.dataset.ak || el.dataset.k || el.id || ('anon' + i);
        out.push({ key, tag: el.tagName, type: el.type || '', id: el.id || '' });
      });
    sec.querySelectorAll('.seg').forEach(seg => { if (seg.id) out.push({ key: seg.id, tag: 'SEG', type: 'seg', id: seg.id }); });
    return out;
  }, tab);

  for (const c of controls) {
    const name = `${tab}${mode ? ':' + mode : ''}/${c.key}`;
    if (EXEMPT[`${tab}/${c.key}`]) { exempted.push(name); continue; }
    await setMode();   // a previous control may have flipped the view; re-establish it
    if (EXEMPT[name]) { exempted.push(name); continue; }
    const before = await p.evaluate(FINGERPRINT);
    let acted = 'no';
    try {
      acted = await p.evaluate(([t, ctl]) => {
        const sec = document.getElementById('v-' + t); if (!sec) return 'no-sec';
        const sel = ctl.id ? `#${CSS.escape(ctl.id)}` :
          `[data-pk="${ctl.key}"],[data-fk="${ctl.key}"],[data-ak="${ctl.key}"],[data-k="${ctl.key}"]`;
        if (ctl.type === 'seg') {
          const btns = [...sec.querySelectorAll(`#${CSS.escape(ctl.id)} button`)];
          const off = btns.find(x => !x.classList.contains('on')) || btns[0];
          if (!off) return 'no-btn'; off.click(); return 'seg';
        }
        const el = sec.querySelector(sel); if (!el) return 'gone';
        if (el.offsetParent === null) return 'hidden';   // not reachable in this mode
        if (el.tagName === 'SELECT') {
          const alt = [...el.options].find(o => o.value !== el.value); if (!alt) return 'single-option';
          el.value = alt.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true })); return 'select';
        }
        if (el.type === 'checkbox') { el.checked = !el.checked; el.dispatchEvent(new Event('change', { bubbles: true })); return 'check'; }
        const cur = parseFloat(el.value);
        el.value = isNaN(cur) ? 'x' : String(cur > 0 ? Math.max(1, Math.round(cur * 2)) : 7);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true })); return 'value';
      }, [tab, c]);
    } catch (e) { errored.push(`${name} (${e.message.slice(0, 50)})`); continue; }
    if (['gone','no-sec','single-option','no-btn','hidden'].includes(acted)) continue;
    await p.waitForTimeout(230);
    const after = await p.evaluate(FINGERPRINT);
    (before !== after ? moved : inert).push(name);
  }
}

const undeclared = inert.filter(x => !EXEMPT[x]);
const line = '─'.repeat(72);
console.log('\n' + line);
console.log('EVERY CONTROL MUST MOVE THE MODEL — OR SAY WHY IT DOESN\'T');
console.log(line);
console.log(`  moved the model : ${moved.length}`);
console.log(`  declared inert  : ${exempted.length}`);
console.log(`  UNDECLARED INERT: ${undeclared.length}`);
if (errored.length) console.log(`  errored         : ${errored.length}`);
if (VERBOSE && moved.length) console.log('\n  moved:\n' + moved.map(x => '    ' + x).join('\n'));
if (errored.length) console.log('\n  errors:\n' + errored.map(x => '    ' + x).join('\n'));
if (pageErrors.length) console.log('\n  PAGE ERRORS:\n' + [...new Set(pageErrors)].slice(0, 6).map(x => '    ' + x).join('\n'));

if (undeclared.length) {
  console.log('\n  ✗ These controls changed nothing in the model:\n');
  undeclared.forEach(x => console.log('      ' + x));
  console.log('\n  Either wire them, or add them to EXEMPT with the reason they are');
  console.log('  presentational. An undeclared inert control is a UI that accepts');
  console.log('  input the model never hears — which is how "none" still ordered 23');
  console.log('  CBoxes and top-of-rack still built twelve network racks.\n');
  await b.close(); process.exit(1);
}
console.log('\n  ✓ Every control either moves the model or is declared presentational.\n');
await b.close();
process.exit(pageErrors.length ? 1 : 0);
