import {chromium} from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const s of process.argv.slice(2)) {
  const p = await b.newPage({viewport:{width:390,height:900},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
  await p.goto(`http://localhost:8099/?screen=${s}`,{waitUntil:'networkidle'});
  await p.waitForTimeout(1500);
  await p.screenshot({path:`/tmp/claude-0/-home-user-BERX/94bab3a6-ee65-5885-93d6-182764a9a901/scratchpad/shots/${s}.png`});
  console.log(errs.length?`[${s}] ${errs.join('; ')}`:`[${s}] ok`);
  await p.close();
}
await b.close();
