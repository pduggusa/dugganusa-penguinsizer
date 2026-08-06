import { chromium } from 'playwright';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('file:///Users/patrickduggan/claude/dugganusa-penguinsizer/index.html');
await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(400);
await p.click('#tabs button[data-v="sheet"]');await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const w=innerWidth,o=[];
 document.querySelectorAll('#v-sheet *').forEach(el=>{const b=el.getBoundingClientRect();
  if(b.right>w+1){let a=el.parentElement,sc=false;
   while(a){const cs=getComputedStyle(a);if(['auto','scroll','hidden'].includes(cs.overflowX)){sc=true;break;}a=a.parentElement;}
   if(!sc)o.push({t:el.tagName,c:(el.className||'').toString().slice(0,26),w:Math.round(b.width)});}});
 return {ov:document.documentElement.scrollWidth-w,list:o.slice(0,6)};});
console.log(JSON.stringify(r,null,1));
await b.close();
