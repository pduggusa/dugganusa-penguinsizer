import { chromium } from 'playwright';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1100}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
p.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text())});
await p.goto('file:///Users/patrickduggan/claude/dugganusa-penguinsizer/index.html');
await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(500);
await p.click('#tabs button[data-v="rack"]');await p.waitForTimeout(200);
await p.click('#rkMode button[data-m="advanced"]');await p.waitForTimeout(800);
await p.fill('input[data-ak="phases"]','3');await p.fill('input[data-ak="floors"]','2');await p.waitForTimeout(700);
await p.click('#tabs button[data-v="sheet"]');await p.waitForTimeout(800);
const out=await p.evaluate(()=>{let name=null,blob=null;
 const c=HTMLAnchorElement.prototype.click, co=URL.createObjectURL;
 URL.createObjectURL=function(b2){blob=b2;return 'blob:x';};
 HTMLAnchorElement.prototype.click=function(){name=this.download;};
 document.getElementById('bsJson').click();
 HTMLAnchorElement.prototype.click=c; URL.createObjectURL=co;
 return {name, size:blob?blob.size:0};});
console.log('JSON export:',JSON.stringify(out));
const csv=await p.evaluate(()=>{let name=null;const c=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){name=this.download;};
 document.getElementById('bsCsv').click();HTMLAnchorElement.prototype.click=c;return name;});
console.log('CSV export :',csv);
// read the actual JSON content
const j=await p.evaluate(async()=>{
 const d=window.__ADV_MODEL();const perRow=Math.max(1,d.racksPerRow);
 return {site:!!d.floors,phases:d.phases,colourKeys:Object.keys(d.colourMap).length,
  bomRows:d.bom.length,rackFields:Object.keys(d.racks[0]),uplinks:d.upPerLeaf,risers:d.risers};});
console.log('payload check:',JSON.stringify(j));
console.log('errors:',errs.length?errs.slice(0,3):'none');
await b.close();
