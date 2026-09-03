import {chromium} from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const errs=[];
for (const s of process.argv.slice(2)) {
  const p = await b.newPage({viewport:{width:390,height:900},deviceScaleFactor:2});
  p.on('pageerror',e=>errs.push(`[${s}] ${String(e).slice(0,180)}`));
  await p.goto(`http://localhost:8099/?screen=${s}`,{waitUntil:'networkidle'});
  await p.waitForTimeout(1400);
  await p.screenshot({path:`/tmp/claude-0/-home-user-BERX/94bab3a6-ee65-5885-93d6-182764a9a901/scratchpad/shots/${s}.png`});
  await p.close();
}
await b.close(); console.log(errs.length?errs.join('\n'):'no page errors');
