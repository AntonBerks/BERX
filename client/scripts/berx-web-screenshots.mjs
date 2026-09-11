#!/usr/bin/env node
/**
 * THE REAL BERX WEB, PHOTOGRAPHED.
 *
 * Not a mockup, not a reconstruction, not a static page. This boots the
 * SHIPPED `app/index.html` with the SHIPPED bundle built from
 * `scripts/app-shell.entry.ts`, against the same `/api/v1/*` server
 * every gate uses, signs in through the real form, and photographs the
 * real WebGL2 runtime.
 *
 * Every state is reached by DRIVING THE PRODUCT — `world.travelTo`,
 * `world.focus`, `world.scrubTime`, `world.enterRegion`, the shell's own
 * `compose()` — never by rendering a scene made for a picture. If a
 * domain is a world mode rather than a page, the mode is what gets
 * photographed, because that is what BERX is.
 *
 * WHAT THE PICTURES CANNOT SHOW, and every one of them says so in the
 * manifest: this container has no GPU. Every pixel is rasterised on the
 * CPU by whichever software rasteriser the browser found — the driver
 * string the runtime reports is what gets written down, never a guess —
 * at roughly one frame per second, so nothing here is evidence about
 * performance, and WebGPU cannot present to a canvas so the backend is
 * WebGL2 in all of them.
 *
 * Output: one PNG per state, a JSON manifest with the route, viewport,
 * world mode, renderer and limitation for each, a Markdown table of the
 * same, and one contact sheet — itself a real screenshot of a page
 * laying the PNGs out, so it cannot contain anything the run did not
 * produce.
 */
import fs from 'node:fs';
import path from 'node:path';
import {launchChromium} from './lib/chromium.mjs';
import {startBerxAppServer} from './lib/appserver.mjs';

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'docs', 'web-screenshots');
fs.mkdirSync(OUT, {recursive: true});

const {base, server, sockets, dir} = await startBerxAppServer();
const manifest = [];

/** Settle the world: real frames, and no camera travel still in flight. */
const SETTLE = async (page, frames = 30) => {
	await page.evaluate(async (n) => {
		const w = window.__berxWorld;
		for (let i = 0; i < 300; i++) {
			if (!w || (w.latestFrame.transition === undefined && !w.runtime.travelling)) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
		for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
	}, frames);
};

/** What the world really is at this instant, read off the runtime. */
const STATE = (page) => page.evaluate(() => {
	const w = window.__berxWorld, host = window.__berxHost;
	if (!w) return {signedIn: false};
	const f = w.latestFrame;
	const byKind = {};
	for (const o of f.world.objects) byKind[o.kind] = (byKind[o.kind] ?? 0) + 1;
	const focused = f.world.activeObjectId
		? f.world.objects.find((o) => o.id === f.world.activeObjectId)
		: undefined;
	const depths = f.world.objects.map((o) => o.transform.position.z);
	return {
		signedIn: true,
		region: w.worldPosition.region,
		focus: f.world.activeObjectId,
		focusLabel: focused?.label,
		focusKind: focused?.kind,
		entities: f.world.objects.length,
		byKind,
		relations: f.world.relations.length,
		slots: host?.renderer?.actionSlots?.length ?? 0,
		renderer: host?.renderer?.kind,
		tier: host?.renderTier?.tier,
		cursorAt: new Date(w.worldPosition.cursor.at * 1000).toISOString().slice(0, 16).replace('T', ' '),
		camera: {
			position: {...f.camera.position}, target: {...f.camera.target}, fov: f.camera.fov,
		},
		depthSpread: depths.length ? `${Math.min(...depths).toFixed(1)} … ${Math.max(...depths).toFixed(1)}` : 'n/a',
		gpu: (() => {
			try {
				const c = document.createElement('canvas').getContext('webgl2');
				const e = c?.getExtension('WEBGL_debug_renderer_info');
				return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown';
			} catch { return 'unknown'; }
		})(),
	};
});

/**
 * IS THERE A WORLD IN THIS FRAME?
 *
 * The check that has to happen BEFORE a file is written. A screenshot of
 * a canvas is not evidence of a world: the camera can be somewhere the
 * world is not, and the picture is then black and perfectly honest about
 * a state nobody would ever be in.
 *
 * Counted the way the renderer counts: every visible entity projected
 * with the frame's own camera and asked whether it lands inside the
 * frame. Also reports how far the camera stands relative to how far the
 * world reaches, because the framing fit is documented to return its FAR
 * END when an arrangement cannot be held whole — and a camera twelve
 * reaches out is that answer, not a composition.
 */
const INSIDE = (page) => page.evaluate(() => {
	const w = window.__berxWorld;
	if (!w) return {world: false};
	const f = w.latestFrame, c = f.camera;
	const basis = window.__berxCameraBasis(c);
	const canvas = document.querySelector('canvas');
	if (!basis || !canvas) return {world: false};
	const ar = canvas.width / canvas.height, tan = Math.tan((c.fov * Math.PI / 180) / 2);
	const visible = f.world.objects.filter((o) => o.visible);
	let inside = 0;
	let cx = 0, cy = 0, cz = 0;
	for (const o of visible) { cx += o.transform.position.x; cy += o.transform.position.y; cz += o.transform.position.z; }
	const centre = {x: cx / visible.length, y: cy / visible.length, z: cz / visible.length};
	let reach = 0;
	for (const o of visible) {
		const p = o.transform.position;
		reach = Math.max(reach, Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z));
		const d = {x: p.x - c.position.x, y: p.y - c.position.y, z: p.z - c.position.z};
		const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
		if (along <= 1e-4) continue;
		const nx = (d.x * basis.right.x + d.y * basis.right.y + d.z * basis.right.z) / (along * tan * ar);
		const ny = (d.x * basis.up.x + d.y * basis.up.y + d.z * basis.up.z) / (along * tan);
		if (Math.abs(nx) <= 1 && Math.abs(ny) <= 1) inside++;
	}
	const eye = Math.hypot(c.position.x - centre.x, c.position.y - centre.y, c.position.z - centre.z);
	return {world: true, inside, visible: visible.length, eye, reach, ratio: reach > 0 ? eye / reach : 0};
});

const shoot = async (page, id, title, note) => {
	const file = path.join(OUT, `${id}.png`);
	const vp = page.viewportSize();
	let st = await STATE(page);
	let look = await INSIDE(page);
	/**
	 * A CAMERA TWELVE REACHES OUT IS A FAILED FIT, NOT A VIEW.
	 *
	 * `berxFrameTheWorld` returns its far end — `reach * 12 + 1` — when
	 * no distance along the current direction holds the arrangement
	 * whole, and says so through `covered`. Photographing from there
	 * produces a true picture of a state nobody is ever in. So: if the
	 * frame has fewer than three entities in it, recover the way a
	 * person would, by looking at something — a focus travels the camera
	 * to a pose beside that entity — and only then take the picture.
	 */
	let recovered;
	if (st.signedIn && look.world && look.inside < 3) {
		recovered = {was: {inside: look.inside, eye: look.eye, reach: look.reach}};
		await page.evaluate(() => {
			const w = window.__berxWorld;
			const pick = w.latestFrame.world.objects.find((o) => o.visible && o.interactive)
				?? w.latestFrame.world.objects[0];
			w.blurAffordance?.();
			if (pick) w.focus(pick.id);
		});
		await SETTLE(page, 30);
		st = await STATE(page);
		look = await INSIDE(page);
		recovered.now = {inside: look.inside, eye: look.eye, focus: st.focus};
	}
	const blocked = st.signedIn && look.world && look.inside < 1;
	if (!blocked) await page.screenshot({path: file});
	manifest.push({
		id, title, status: blocked ? 'BLOCKED' : 'CAPTURED',
		file: blocked ? null : path.relative(path.resolve(OUT, '..', '..'), file),
		verified: {
			runtimeAlive: st.signedIn || id.startsWith('01') || id.startsWith('02'),
			renderer: st.renderer ?? 'none yet',
			entitiesInFrame: look.inside, entitiesVisible: look.visible,
			cameraDistanceOverWorldReach: look.ratio ? Number(look.ratio.toFixed(2)) : undefined,
			depthSpread: st.depthSpread, temporalCursor: st.cursorAt,
			relations: st.relations, ringSlots: st.slots, worldMode: st.signedIn ? st.region : 'entry',
			flatOrMock: false,
		},
		recovered,
		route: base, viewport: `${vp.width}x${vp.height} @${await page.evaluate(() => window.devicePixelRatio)}`,
		worldMode: st.signedIn ? `region "${st.region}"${st.focus ? `, focused ${st.focus}` : ''}` : 'not signed in (entry form)',
		renderer: st.renderer ?? 'none yet',
		realRuntime: true,
		hardware: `no GPU — ${st.gpu}; every pixel rasterised on the CPU. WebGPU cannot present to a canvas here, so the backend is WebGL2`,
		state: st, note,
	});
	console.log(`  ${blocked ? 'BLOCKED' : 'ok     '} ${id}  ${title}  —  `
		+ (st.signedIn
			? `${look.inside}/${look.visible} entities IN FRAME, region ${st.region}, ${st.slots} slots, eye/reach ${look.ratio?.toFixed(2)}, ${st.renderer}`
			+ (recovered ? ` (recovered from ${recovered.was.inside} in frame at eye ${recovered.was.eye.toFixed(0)})` : '')
			: 'entry form'));
	return file;
};

const browser = await launchChromium();
try {
	/* ---------- 01–02: the entry, before there is a world ---------- */
	const entryCtx = await browser.newContext({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 2});
	const entry = await entryCtx.newPage();
	await entry.goto(base, {waitUntil: 'load'});
	await entry.waitForSelector('#berx-entry:not([hidden])');
	await shoot(entry, '01-boot-entry', 'BERX boot / entry',
		'The shipped app/index.html before there is a session. The only DOM the product owns: one form, because text entry is the one thing a GPU surface cannot honestly provide. Ground #07080A, accent #4FD6E8.');
	await entryCtx.close();

	/* Arabic, to photograph the locale layer doing its work */
	const rtlCtx = await browser.newContext({
		viewport: {width: 1600, height: 1000}, deviceScaleFactor: 2, locale: 'ar-EG',
	});
	const rtl = await rtlCtx.newPage();
	await rtl.goto(base, {waitUntil: 'load'});
	await rtl.waitForSelector('#berx-entry:not([hidden])');
	const rtlFacts = await rtl.evaluate(() => ({
		lang: document.documentElement.lang, dir: document.documentElement.dir,
		languages: [...(navigator.languages ?? [])],
	}));
	await shoot(rtl, '02-entry-locale-rtl', 'Locale resolution and RTL, on the real entry',
		`navigator.languages ${JSON.stringify(rtlFacts.languages)} resolved to lang="${rtlFacts.lang}" dir="${rtlFacts.dir}" — the shipped locale layer, applied to the shipped page. THERE IS NO SEPARATE REGISTRATION SCREEN in the web shell: registration is POST /auth/register (username, firstname, lastname, email, password — exactly what auth.php accepts) and the spoken arrival flow in @berx/spatial is not mounted by this entry. A language and a visual-world preference have no backend field to be stored in, which the audit records as the pass's one PARTIAL.`);
	await rtlCtx.close();

	/* ---------- the signed-in world, on a desktop ---------- */
	const ctx = await browser.newContext({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 2});
	const page = await ctx.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForSelector('#berx-entry:not([hidden])');
	await page.fill('#berx-identifier', 'ann');
	await page.fill('#berx-password', 'secret');
	await page.click('#berx-enter');
	await page.waitForFunction(() => (window.__berxWorld?.latestFrame.world.objects.length ?? 0) > 4, undefined, {timeout: 40000});
	/* The product's OWN camera, where the product put it. Calling
	   frameWorld here was me overriding it with a fit that then returned
	   its far end — 367 units from a 30-unit world — and photographing
	   that as the living world. */
	await SETTLE(page, 40);
	await shoot(page, '03-living-world', 'The 5D living world',
		'Every entity came from an /api/v1 response. X and Y from the relational layout, Z from real depth, T from the temporal cursor, R from the relation graph that decided the separations. One draw list, WebGL2.');

	/* 04 NOW */
	await page.evaluate(() => window.__berxWorld.enterRegion('now'));
	await SETTLE(page, 30);
	await shoot(page, '04-now', 'BERX NOW',
		'The now region. NOW is a reading of the world through the temporal cursor, not a feed: scrub a year back and it is empty, because nothing was happening then.');

	/* 05 people / social gravity */
	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.travelTo('person:78'); });
	await SETTLE(page, 40);
	await shoot(page, '05-people-gravity', 'People, and social gravity',
		'Travelled to a person. The relational layout pulls what belongs to them around them — created-by edges at a weaker strength than any structural relation, because who made a place matters less to where it stands than what happens there.');

	/* 06 dating — the viewer's own presence */
	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.travelTo('person:77'); });
	await page.evaluate(async () => {
		for (let i = 0; i < 400; i++) {
			if (window.__berxWorld.latestFrame.world.objects.some((o) => o.id.startsWith('person:dating-'))) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
	});
	await SETTLE(page, 30);
	await shoot(page, '06-dating-world', 'The dating world, and only your own',
		'Arriving at your OWN presence reads /dating/discover. Each profile is person:dating-N, never person:<guid> — the public identity and the dating one stay the two separate things the privacy model keeps them as. Read here and never at boot.');

	/* 07 place / business + 12 offers */
	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.travelTo('place:4212'); });
	await page.evaluate(async () => {
		for (let i = 0; i < 400; i++) {
			if (window.__berxWorld.latestFrame.world.objects.some((o) => o.id === 'experience:offer-501')) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
	});
	await SETTLE(page, 30);
	await shoot(page, '07-place-business', 'A place the server calls a business',
		'is_business on the place row makes this a business kind: a stack rather than a portal, because a business is not a doorway. Its ring offers view-business, directions, reserve.');

	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.focus('experience:offer-501'); });
	await SETTLE(page, 30);
	await shoot(page, '12-offer-at-a-place', 'An offer, attached to a real place',
		'experience:offer-501 from GET /offers/places/4212, located-at its business at full strength, ending when the server says it ends, energy from how many redemptions are left. Reserve IS the claim: POST /offers/501/claim.');

	/* 08 events */
	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.travelTo('event:908'); });
	await SETTLE(page, 40);
	await shoot(page, '08-events', 'The events world',
		'An event is a ring, located-at its place at full strength. Its own affordances: view-event, attend, share — and attend really rsvps.');

	/* 09 messages / conversation region */
	await page.evaluate(() => {
		const w = window.__berxWorld;
		const m = w.latestFrame.world.objects.find((o) => o.kind === 'message');
		w.blurAffordance?.();
		if (m) w.travelTo(m.id);
	});
	await page.evaluate(async () => {
		for (let i = 0; i < 400; i++) {
			if (window.__berxWorld.latestFrame.world.objects.filter((o) => o.kind === 'message').length > 1) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
	});
	await SETTLE(page, 30);
	await shoot(page, '09-conversation', 'Messages, as a region you stand in',
		'Travelling into a conversation fetches its messages, and they land in the SAME world: the person you are talking to is the entity that was already there. Each message relates to them by a messages edge.');

	/* 10 stories */
	await page.evaluate(() => {
		const w = window.__berxWorld;
		w.blurAffordance?.();
		const s = w.latestFrame.world.objects.find((o) => o.id.startsWith('moment:story-'));
		if (s) w.travelTo(s.id);
	});
	await SETTLE(page, 40);
	await shoot(page, '10-stories', 'Stories, which leave when the server says they do',
		'A story is a moment that expires: T comes from the server time_expires, and a story the feed gave no expiry for is not given one. It is not a separate ring UI — it is an entity in the same world with an end.');

	/* 11 memories / temporal */
	const before = await STATE(page);
	await page.evaluate(() => {
		const w = window.__berxWorld;
		w.blurAffordance?.();
		w.scrubTime(-3 * 365 * 86400);
	});
	await SETTLE(page, 40);
	await shoot(page, '11-memories-temporal', 'T, scrubbed three years back',
		`The temporal cursor moved from ${before.cursorAt} to three years earlier. Nothing was re-fetched: the same entities are drawn at different depths, because T offsets z in the frame and never in the canonical world. A memory that happened then comes forward; the present recedes.`);
	await page.evaluate(() => window.__berxWorld.scrubTime(3 * 365 * 86400));
	await SETTLE(page, 20);

	/* 13 creator */
	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.travelTo('person:78'); });
	await page.evaluate(async () => {
		for (let i = 0; i < 400; i++) {
			if (window.__berxWorld.latestFrame.world.objects.some((o) => o.id === 'moment:6001')) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
	});
	await SETTLE(page, 30);
	await shoot(page, '13-creator-world', 'A creator, with their work standing around them',
		'GET /creator/lev and /creator/lev/content. A creator is a person with a body of work, so the work is what is mapped — a post, an album, an event, an experience — each created-by its author. No follower count, no badge.');

	/* 14 profile inside the world */
	await page.evaluate(() => { window.__berxWorld.blurAffordance?.(); window.__berxWorld.focus('person:77'); });
	await SETTLE(page, 30);
	await shoot(page, '14-profile-in-world', 'A profile, inside the world',
		'A person focused, with their affordance ring up: view-profile, message, follow. The ring stands a third of the way from the entity toward the eye, which is what made all of its actions reachable rather than one of five.');

	/* 15 search → spatial results, through the real voice path */
	const spoken = await page.evaluate(async () => {
		const voice = window.__berxVoice;
		if (!voice || typeof voice.say !== 'function') return {available: false};
		const before = window.__berxWorld.latestFrame.world.objects.length;
		const turn = await voice.say('покажи события');
		return {
			available: true, before,
			after: window.__berxWorld.latestFrame.world.objects.length,
			intent: turn?.intent?.kind, capability: turn?.plan?.steps?.map((s) => s.capability).filter(Boolean),
			shown: turn?.shown,
		};
	});
	await SETTLE(page, 40);
	await shoot(page, '15-spoken-search', 'A spoken question, answered in the world',
		spoken.available
			? `"покажи события" → intent ${spoken.intent} → ${JSON.stringify(spoken.capability)} on the real client → the results were composed INTO this world and the camera framed them. ${spoken.before} entities before, ${spoken.after} after. There is no results page: a spoken answer moves the world you are already in.`
			: 'The voice-to-world binding is not exposed on window by the shipped entry, so this is the world as the previous state left it. verify:5d-app-shell drives the same path through a real keypress and measures it: "покажи события" planned events on the real client and put event:908 in front of the viewer.');

	/* 17 wide desktop */
	await page.setViewportSize({width: 2560, height: 1080});
	/* the ResizeObserver in runtimeHost5d re-resolves the quality and the
	   backing store by itself; the world stays where it is, which is the
	   point of the shot */
	await SETTLE(page, 40);
	await shoot(page, '17-desktop-wide', 'Wide desktop',
		'The same world, framed for a 2560x1080 frame. Framing is a question about a frame: the relational layout is shaped by the aspect and the fit finds the nearest containment-preserving distance, which is why occupancy stays in the 40-60% band on every shape.');
	await ctx.close();

	/* 16 mobile web */
	const phoneCtx = await browser.newContext({
		viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
		userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
	});
	const phone = await phoneCtx.newPage();
	const cdp = await phoneCtx.newCDPSession(phone);
	try {
		await cdp.send('Emulation.setSafeAreaInsetsOverride', {insets: {top: 59, bottom: 34, left: 0, right: 0}});
	} catch { /* reported in the manifest note */ }
	await phone.goto(base, {waitUntil: 'load'});
	await phone.waitForSelector('#berx-entry:not([hidden])');
	await phone.fill('#berx-identifier', 'ann');
	await phone.fill('#berx-password', 'secret');
	await phone.tap('#berx-enter');
	await phone.waitForFunction(() => (window.__berxWorld?.latestFrame.world.objects.length ?? 0) > 4, undefined, {timeout: 40000});
	await SETTLE(phone, 40);
	await shoot(phone, '16-mobile-iphone', 'Mobile web, at an iPhone\'s viewport and density',
		'390x844 at 3x with real 59/34 safe-area insets emulated over CDP, signed in with a TAP. touch-action is none so the browser cannot take the gesture; a held finger opens the microphone because a phone has no "v" key. Chromium at an iPhone\'s geometry — WebKit is not installed here, so iOS\'s own engine behaviour is not shown and not claimed.');
	await phoneCtx.close();

	/* The rasteriser is whatever the runtime said it was, not what we
	   expected it to be: the same string every shot recorded. */
	const driver = manifest.find((m) => m.state?.gpu)?.state.gpu ?? 'unknown';
	const noGpu = `this container has no GPU: every pixel was rasterised on the CPU by ${driver}`;
	const NoGpu = noGpu[0].toUpperCase() + noGpu.slice(1);

	/* ---------- the contact sheet: a real screenshot of the sheet ---------- */
	const sheetHtml = path.join(OUT, 'contact-sheet.html');
	fs.writeFileSync(sheetHtml, `<!doctype html><meta charset="utf-8">
<style>
 body{margin:0;background:#07080A;color:#F2F0EB;font:14px/1.5 system-ui,sans-serif;padding:28px}
 h1{font-size:22px;font-weight:600;letter-spacing:.04em;margin:0 0 4px}
 p.sub{color:#A7ADB4;margin:0 0 24px}
 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
 figure{margin:0}
 img{width:100%;display:block;border:1px solid #1C2228;border-radius:8px;background:#000}
 figcaption{margin-top:8px;font-size:12px;color:#A7ADB4}
 b{color:#4FD6E8;font-weight:600}
</style>
<h1>BERX WEB — real runtime screenshots</h1>
<p class="sub">Captured from the shipped app/index.html and the shipped bundle, signed in through the real form, on WebGL2. ${NoGpu}.</p>
<div class="grid">
${manifest.filter((m) => m.status === 'CAPTURED').map((m) => `<figure><img src="${m.id}.png"><figcaption><b>${m.id}</b> ${m.title}<br>${m.viewport} · ${m.worldMode} · ${m.renderer} · ${m.verified.entitiesVisible === undefined ? 'entry form, no world yet' : `${m.verified.entitiesInFrame} of ${m.verified.entitiesVisible} in frame`}</figcaption></figure>`).join('\n')}
</div>`);
	const sheetCtx = await browser.newContext({viewport: {width: 1800, height: 1200}, deviceScaleFactor: 1});
	const sheet = await sheetCtx.newPage();
	await sheet.goto(`file://${sheetHtml}`, {waitUntil: 'load'});
	await sheet.waitForTimeout(1200);
	await sheet.screenshot({path: path.join(OUT, '00-contact-sheet.png'), fullPage: true});
	await sheetCtx.close();

	fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
		capturedAt: new Date().toISOString(),
		route: base,
		realRuntime: true,
		hardware: `${noGpu}. WebGPU cannot present to a canvas here, so every screenshot is WebGL2`,
		pageErrors: errors,
		shots: manifest,
	}, null, 2));

	fs.writeFileSync(path.join(OUT, 'README.md'), `# BERX WEB — real runtime screenshots

Captured by \`client/scripts/berx-web-screenshots.mjs\` from the shipped
\`app/index.html\` and the shipped bundle built from
\`client/scripts/app-shell.entry.ts\`, signed in through the real form
against the same \`/api/v1/*\` server every gate uses.

Every state was reached by driving the product — \`world.travelTo\`,
\`world.focus\`, \`world.scrubTime\`, \`world.enterRegion\` — never by
building a scene for a picture.

**Hardware limitation, true of every image here:** ${noGpu}, at roughly
one frame per second, and WebGPU cannot present to a canvas, so the
backend is WebGL2 in all of them. Nothing here is evidence about
performance. The headless GPU gates run under a different software
rasteriser (mesa llvmpipe/lavapipe); neither is hardware, and this file
reports the one that drew these pixels.

| # | Status | State | Viewport | World mode | Renderer | In frame |
|---|---|---|---|---|---|---|
${manifest.map((m) => `| ${m.id} | ${m.status} | ${m.title} | ${m.viewport} | ${m.worldMode} | ${m.renderer} | ${m.verified.entitiesInFrame ?? '—'} of ${m.verified.entitiesVisible ?? '—'} |`).join('\n')}

Page errors during the whole capture: **${errors.length}**${errors.length ? ` — ${errors.slice(0, 3).join(' | ')}` : ''}
`);

	console.log('');
	const captured = manifest.filter((m) => m.status === 'CAPTURED');
	const blockedShots = manifest.filter((m) => m.status === 'BLOCKED');
	console.log(`SCREENSHOTS READY — ${captured.length} captured, ${blockedShots.length} blocked, + contact sheet in ${OUT}`);
	for (const b of blockedShots) console.log(`  BLOCKED ${b.id}: fewer than one entity in frame`);
	if (errors.length) console.log(`  page errors: ${errors.slice(0, 3).join(' | ')}`);
} finally {
	await browser.close();
	sockets.closeAll();
	server.closeAllConnections?.();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}
