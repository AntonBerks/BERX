import {chromium} from 'playwright';
const OUT='/tmp/claude-0/-home-user-BERX/94bab3a6-ee65-5885-93d6-182764a9a901/scratchpad/shots';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const mode of ['night','day']) for (const [s,w] of [['feed',3000],['profile',2600],['cinematic',1600]]) {
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  const e=[];p.on('pageerror',x=>e.push(String(x).slice(0,120)));
  await p.addInitScript(m=>{try{localStorage.setItem('berx.themeMode',m)}catch{}},mode);
  await p.goto(`http://localhost:8099/?screen=${s}`,{waitUntil:'networkidle'});
  await p.waitForTimeout(w); await p.screenshot({path:`${OUT}/v9_${mode}_${s}.png`});
  console.log(`[${mode}/${s}] ${e.length?e.join('; '):'ok'}`); await p.close();
}
await b.close();
