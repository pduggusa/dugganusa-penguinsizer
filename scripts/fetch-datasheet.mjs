#!/usr/bin/env node
/* READ A PENGUIN DATASHEET.
 *
 * The datasheets live on issuu, which serves a JS flipbook and 403s every asset endpoint
 * to a bare fetch — reader JSON, page images, all of it. They are readable in a browser,
 * so this drives one: open the embed reader, page through, screenshot each spread.
 *
 * WHAT THIS IS FOR. The FIGURES on these sheets are facts — a 4U height, a 5+5 PSU
 * configuration, a 36.22 inch depth. Facts are not copyrightable and citing them is the
 * whole point of the provenance system in this tool. What we do NOT do is mirror the
 * documents themselves into a public repository: the layout and artwork are Penguin's
 * expression, which is the same call this codebase already makes about vendor stencils.
 * So the images land in a scratch directory, you read the numbers, and the NUMBERS go in
 * the model with a citation.
 *
 *   node scripts/fetch-datasheet.mjs relion_xe4418gts-dtc-datasheet [--out ./scratch]
 *
 * Document slugs are listed in docs/VENDOR-DOCS.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = createRequire(process.cwd() + '/')('playwright')); }
catch { try { ({ chromium } = await import('playwright')); }
  catch { console.error('\nPlaywright not found. Run from a directory that has it.\n'); process.exit(2); } }

const slug = process.argv[2];
if (!slug) { console.error('usage: fetch-datasheet.mjs <issuu-doc-slug> [--out dir]'); process.exit(2); }
const outDir = (() => { const i = process.argv.indexOf('--out'); return i > -1 ? process.argv[i + 1] : '.'; })();
const PAGES = (() => { const i = process.argv.indexOf('--pages'); return i > -1 ? +process.argv[i + 1] : 4; })();

fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
/* deviceScaleFactor 2 — a spec table at 1x is legible to a human and marginal to OCR or a
 * vision model, and re-running this because the depth digit was ambiguous costs more than
 * the pixels do. */
const p = await b.newPage({ viewport: { width: 1500, height: 2000 }, deviceScaleFactor: 2 });
const url = `https://e.issuu.com/embed.html?u=penguinsolutions&d=${slug}`;
console.log('opening', url);
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('  nav:', e.message.slice(0, 60)));
await p.waitForTimeout(4000);

const written = [];
for (let i = 1; i <= PAGES; i++) {
  const f = path.join(outDir, `${slug}-p${i}.png`);
  await p.screenshot({ path: f, fullPage: true });
  written.push(f);
  /* The reader reports "n / m" or "n-n+1 / m" in its footer; stop when it stops moving. */
  const before = await p.evaluate(() => document.body.innerText.slice(0, 40));
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(3000);
  const after = await p.evaluate(() => document.body.innerText.slice(0, 40));
  if (before === after) { console.log(`  page ${i} — end of document`); break; }
  console.log(`  page ${i} captured`);
}
console.log(`\n${written.length} image(s) in ${path.resolve(outDir)}`);
console.log('Read the numbers, put them in the model WITH a citation, and leave the images here.');
await b.close();
