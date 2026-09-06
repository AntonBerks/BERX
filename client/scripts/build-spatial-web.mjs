#!/usr/bin/env node
/**
 * Bundles the complete BERX MAX 5D web runtime: shared spatial resolver,
 * DOM scene tools and the authoritative WebGL2 spatial host.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const clientRoot=path.resolve(here,'..');
const repoRoot=path.resolve(clientRoot,'..');
const outFile=path.join(repoRoot,'scripts','berx-5d.runtime.js');
execFileSync(path.join(clientRoot,'node_modules/.bin/esbuild'),[
 path.join(clientRoot,'packages/spatial-web/src/runtimeEntry.ts'),'--bundle','--format=esm','--target=es2020','--platform=browser','--log-level=error',
 '--banner:js=/* BERX MAX 5D runtime — GENERATED. Do not edit by hand. */',`--outfile=${outFile}`],{cwd:clientRoot,stdio:'inherit'});
console.log(`built ${path.relative(repoRoot,outFile)} (${(fs.statSync(outFile).size/1024).toFixed(1)} kB)`);
const SITE_SCREENS=['BERX-001','BERX-061','BERX-176','BERX-201','BERX-226','BERX-266','BERX-031','BERX-291'];
const scenesEntry=path.join(clientRoot,'scripts','.site-scenes.entry.ts');
fs.writeFileSync(scenesEntry,`import {findContract} from '@berx/scenes';\nconst IDS=${JSON.stringify(SITE_SCREENS)};\nconst out=Object.fromEntries(IDS.map((id)=>[id,findContract(id)]).filter(([,c])=>c));\nprocess.stdout.write(JSON.stringify(out));\n`);
const resolvedFile=path.join(clientRoot,'scripts','.site-scenes.bundle.mjs');
execFileSync(path.join(clientRoot,'node_modules/.bin/esbuild'),[scenesEntry,'--bundle','--format=esm','--platform=node','--log-level=error',`--outfile=${resolvedFile}`],{cwd:clientRoot,stdio:'inherit'});
const resolved=execFileSync(process.execPath,[resolvedFile],{cwd:clientRoot}).toString();
const scenesOut=path.join(repoRoot,'scripts','berx-5d.scenes.js');
fs.writeFileSync(scenesOut,'/* BERX MAX 5D — GENERATED scene contracts. */\nexport const BERX_SITE_CONTRACTS='+JSON.stringify(JSON.parse(resolved),null,1)+';\n');
fs.rmSync(scenesEntry,{force:true});fs.rmSync(resolvedFile,{force:true});
console.log(`built ${path.relative(repoRoot,scenesOut)} (${(fs.statSync(scenesOut).size/1024).toFixed(1)} kB, ${SITE_SCREENS.length} contracts)`);
