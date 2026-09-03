import {chromium} from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p = await b.newPage({viewport:{width:390,height:700},deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto('http://localhost:8099/?screen=icons',{waitUntil:'networkidle'});
await p.waitForTimeout(1000);
await p.screenshot({path:'/tmp/claude-0/-home-user-BERX/94bab3a6-ee65-5885-93d6-182764a9a901/scratchpad/shots/icons.png', fullPage:true});
await b.close(); console.log(errs.length?errs.join('\n'):'ok');
