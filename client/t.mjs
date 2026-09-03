import {chromium} from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const s of process.argv.slice(2)) {
  const p = await b.newPage({viewport:{width:390,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,150)));
  await p.goto(`http://localhost:8099/?screen=${s}`,{waitUntil:'networkidle'});
  await p.waitForTimeout(1300);
  console.log(`[${s}]`, (await p.locator('body').innerText()).split('\n').filter(Boolean).slice(0,8).join(' | '));
  if(errs.length) console.log('  ERR', errs.join('; '));
  await p.close();
}
await b.close();
