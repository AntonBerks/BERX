import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const dir = '/tmp/claude-0/maxrt';
fs.copyFileSync('/home/user/BERX/styles/berx-5d.css', path.join(dir, 'berx-5d.css'));
fs.writeFileSync(path.join(dir, 'index.html'),
`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX MAX runtime</title>
<link rel="stylesheet" href="./berx-5d.css">
<style>html,body{margin:0;background:#07080A;color:#F5F8FA;font:15px/1.45 system-ui,sans-serif}
#scene{min-height:100vh;padding:24px;display:flex;flex-direction:column;gap:20px}
.berx-surface{padding:20px}h2{margin:0 0 8px;font-size:18px}p{margin:0;color:#A7B0B7}</style>
</head><body><main id="scene"></main><script type="module" src="./harness.js"></script></body></html>`);

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server = http.createServer((req,res)=>{
  const name=(req.url??'/').split('?')[0];
  if(name==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=path.join(dir, name==='/'?'index.html':path.normalize(name).replace(/^(\.\.[/\\])+/,''));
  if(!file.startsWith(dir)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':types[path.extname(file)]??'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise((r)=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = await browser.newPage({viewport:{width:1200,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(base,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.BERX_MAX);

const ids = await page.evaluate(()=>window.BERX_MAX.contracts());
const t0=Date.now();
const runtime = await page.evaluate(async (list)=>{
  const out={};
  for (const id of list) { try { out[id]=await window.BERX_MAX.measure(id); } catch(e){ out[id]={error:String(e)}; } }
  return out;
}, ids);
console.error('measured', Object.keys(runtime).length, 'contracts in', ((Date.now()-t0)/1000).toFixed(1)+'s');

/* shared-element continuity, once per family: the transition is the
   runtime's, not the contract's, so one real run per family is the
   evidence its members share */
const families = {};
const meta = JSON.parse(fs.readFileSync('/tmp/claude-0/max-evidence.json','utf8'));
for (const s of meta.screens) if (!families[s.family]) families[s.family]=s.screenId;
const shared={};
for (const [fam,id] of Object.entries(families)) {
  shared[fam]={normal: await page.evaluate((i)=>window.BERX_MAX.sharedElement(i,false), id),
               reduced: await page.evaluate((i)=>window.BERX_MAX.sharedElement(i,true), id)};
}
fs.writeFileSync('/tmp/claude-0/max-runtime.json', JSON.stringify({runtime, shared, pageErrors: errors}, null, 1));
console.error('page errors:', errors.length);
await browser.close(); server.close();
