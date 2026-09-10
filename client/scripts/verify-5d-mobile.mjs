#!/usr/bin/env node
/**
 * BERX ON A PHONE, which is not a small desktop.
 *
 * A desktop WebGL2 pass proves the renderer. It proves nothing about
 * the four things that only exist on a phone, and every one of them was
 * broken here until this gate went looking:
 *
 *   THE BROWSER'S OWN GESTURES. A canvas with no `touch-action` hands
 *   every drag and every second finger to the browser to disambiguate
 *   against scrolling and zooming. The pan arrives as pointerdown, one
 *   move and then POINTERCANCEL; the pinch never reaches the world
 *   because the page zoomed instead; a tap waits 300ms for a
 *   double-tap that never comes; and a pull downward reloads the world
 *   mid-gesture, because that is Chrome's pull-to-refresh.
 *
 *   THE PARTS OF THE SCREEN THAT ARE NOT THE SCREEN. viewport-fit=cover
 *   is what lets the world reach the glass, and it also puts the sign-in
 *   form under the notch and the world's status line behind the home
 *   indicator. env(safe-area-inset-*) is the only real answer, and this
 *   gate emulates REAL insets over CDP and measures that the elements
 *   actually moved by them.
 *
 *   THE KEYBOARD. The one field in BERX that someone types into is
 *   bottom-anchored. Chrome honours `interactive-widget=resizes-content`;
 *   iOS Safari does not implement it and shrinks only the VISUAL
 *   viewport, so the field sits behind the keyboard and what you are
 *   writing cannot be seen while you write it.
 *
 *   THE GESTURES THE PRODUCT NEEDS AND A PHONE DOES NOT HAVE. Voice is
 *   what BERX is, and it started from the `v` key. A phone has no `v`.
 *
 * WHAT THIS GATE IS AND IS NOT. Both profiles run the real Chromium
 * engine at a real device's viewport, density, user agent, touch
 * capability and safe-area insets, against the shipped page and the
 * shipped bundle. Android Chrome IS Chromium, so that half is the
 * production engine. iPhone Safari is WebKit and NO WEBKIT IS INSTALLED
 * in this container: the iPhone profile measures the shipped code at an
 * iPhone's geometry, and every gate that depends on WebKit's own
 * behaviour rather than on BERX's says so in its own words. That is
 * reported as an engine limitation, never as an iOS pass.
 */
import fs from 'node:fs';
import {launchChromium} from './lib/chromium.mjs';
import {startBerxAppServer} from './lib/appserver.mjs';

const {base, server, sockets, dir} = await startBerxAppServer();

const failures = [];
const blocked = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocker = (name, kind, detail) => {
	console.log(`${kind}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	blocked.push(name);
};

/**
 * The two phones, as the devices really are.
 *
 * The insets are the ones the platforms actually report: 59/34 is an
 * iPhone with a Dynamic Island in portrait, 24/24 is an Android drawn
 * edge-to-edge under its status and navigation bars.
 */
const DEVICES = [
	{
		id: 'iphone', name: 'iPhone (390x844 @3, iOS user agent)',
		viewport: {width: 390, height: 844}, deviceScaleFactor: 3,
		userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
		insets: {top: 59, bottom: 34, left: 0, right: 0},
		landscape: {width: 844, height: 390},
		engine: 'chromium-at-iphone-geometry',
	},
	{
		id: 'android', name: 'Android Chrome (412x915 @2.625, Android user agent)',
		viewport: {width: 412, height: 915}, deviceScaleFactor: 2.625,
		userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
		insets: {top: 24, bottom: 24, left: 0, right: 0},
		landscape: {width: 915, height: 412},
		engine: 'chromium',
	},
];

const browser = await launchChromium();
const results = [];
try {
	for (const device of DEVICES) {
		const context = await browser.newContext({
			viewport: device.viewport,
			deviceScaleFactor: device.deviceScaleFactor,
			userAgent: device.userAgent,
			isMobile: true,
			hasTouch: true,
		});
		const pageErrors = [];
		const page = await context.newPage();
		page.on('pageerror', (e) => pageErrors.push(e.message));
		page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });
		/* A renderer that dies takes its page with it, and every await
		   after that fails with "target closed" — which says nothing
		   about WHERE. Named, and printed as it happens. */
		page.on('crash', () => { pageErrors.push('the renderer process crashed'); console.log(`      ${device.id}: RENDERER CRASHED`); });
		const step = (what) => console.log(`      ${device.id}: ${what}`);

		/* real safe-area insets, over the protocol, BEFORE the page loads —
		   so what is measured is the page laying itself out with them, not
		   a reflow after the fact */
		const cdp = await context.newCDPSession(page);
		let insetsEmulated = true;
		try {
			await cdp.send('Emulation.setSafeAreaInsetsOverride', {insets: device.insets});
		} catch (error) {
			insetsEmulated = false;
			console.log(`      ${device.id}: safe-area emulation unavailable — ${String(error).slice(0, 120)}`);
		}

		/**
		 * NOTHING MAY REACH THE MICROPHONE OR THE CAMERA BY ITSELF.
		 *
		 * Recorded before the page runs a line: every getUserMedia call
		 * with the stack it came from, and the permission state at boot.
		 * The rule is not "ask nicely" — it is that a load with no
		 * gesture in it must not reach a capture device at all.
		 */
		await page.addInitScript(() => {
			window.__berxCapture = [];
			const md = navigator.mediaDevices;
			if (md && typeof md.getUserMedia === 'function') {
				const real = md.getUserMedia.bind(md);
				md.getUserMedia = (constraints) => {
					window.__berxCapture.push({constraints: JSON.stringify(constraints ?? {}), at: new Error().stack ?? ''});
					return real(constraints);
				};
			}
		});

		const startedAt = Date.now();
		await page.goto(base, {waitUntil: 'load'});
		await page.waitForSelector('#berx-entry:not([hidden])', {timeout: 15000});

		/* the sign-in form, on a phone, inside the parts of the screen a
		   phone actually shows */
		step('loaded, sign-in showing');
		const entry = await page.evaluate(() => {
			const form = document.getElementById('berx-entry');
			const cs = getComputedStyle(form);
			const first = document.getElementById('berx-identifier').getBoundingClientRect();
			const button = document.getElementById('berx-enter').getBoundingClientRect();
			return {
				paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
				fieldTop: first.top, fieldHeight: first.height,
				buttonBottom: button.bottom, buttonHeight: button.height,
				innerHeight: window.innerHeight, innerWidth: window.innerWidth,
				scrollWidth: document.documentElement.scrollWidth,
				overscroll: getComputedStyle(document.body).overscrollBehaviorY,
				viewportMeta: document.querySelector('meta[name=viewport]')?.content ?? '',
			};
		});

		/* sign in with a touch, not a click: this is the first real user
		   gesture of the session, and everything gated on one hangs off it */
		await page.fill('#berx-identifier', 'ann');
		await page.fill('#berx-password', 'secret');
		const audioBeforeGesture = await page.evaluate(() => {
			const a = window.__berxHost?.audio;
			return a ? a.running : undefined;
		});
		await page.tap('#berx-enter');
		await page.waitForFunction(
			() => document.querySelector('canvas') !== null && document.querySelector('#berx-entry') === null,
			undefined, {timeout: 20000},
		);
		await page.waitForFunction(() => (window.__berxWorld?.latestFrame.world.objects.length ?? 0) > 4, undefined, {timeout: 20000});
		const bootMs = Date.now() - startedAt;

		/* let the world settle: the fit, the first relational layout and
		   the focus travel all have to finish before anything is measured */
		await page.evaluate(async () => {
			for (let i = 0; i < 90; i++) await new Promise((r) => requestAnimationFrame(r));
		});

		step('signed in, world settling');
		const shell = await page.evaluate(() => {
			const canvas = document.querySelector('canvas');
			const cs = getComputedStyle(canvas);
			const rect = canvas.getBoundingClientRect();
			const host = window.__berxHost;
			const world = window.__berxWorld;
			const vv = window.visualViewport;
			return {
				/* the renderer's own name for itself — `host.backend`
				   does not exist, and `undefined` failed a gate against a
				   world that was drawing perfectly */
				backend: host?.renderer?.kind,
				tier: host?.renderTier?.tier,
				tierReason: host?.renderTier?.reason,
				objects: world?.latestFrame.world.objects.length ?? 0,
				canvas: {
					cssWidth: rect.width, cssHeight: rect.height,
					bufferWidth: canvas.width, bufferHeight: canvas.height,
					touchAction: cs.touchAction,
					userSelect: cs.userSelect || cs.webkitUserSelect,
					callout: cs.webkitTouchCallout ?? '',
					tapHighlight: cs.webkitTapHighlightColor ?? '',
				},
				dpr: window.devicePixelRatio,
				quality: host?.quality?.quality,
				pixelRatio: host?.quality?.pixelRatio,
				visual: vv ? {width: vv.width, height: vv.height, scale: vv.scale} : undefined,
				scrollWidth: document.documentElement.scrollWidth,
				innerWidth: window.innerWidth,
				/* the world's status line, which viewport-fit=cover puts on
				   the home indicator unless the inset is respected */
				notice: (() => {
					const p = [...document.querySelectorAll('p[role=status]')][0];
					if (!p) return undefined;
					const r = p.getBoundingClientRect();
					return {bottom: r.bottom, hidden: p.hidden, style: p.style.bottom};
				})(),
				audio: window.__berxHost?.audio ? {running: window.__berxHost.audio.running, spatial: window.__berxHost.audio.spatial} : undefined,
				captured: window.__berxCapture?.length ?? 0,
				/**
				 * WHAT IS ACTUALLY DRAWING, as the driver names itself.
				 *
				 * A frame budget is a claim about hardware. On a software
				 * rasteriser the number is real and means nothing about a
				 * phone, so the gate has to know which it is measuring —
				 * asked of WEBGL_debug_renderer_info rather than assumed
				 * from the environment.
				 */
				gpu: (() => {
					try {
						const probe = document.createElement('canvas').getContext('webgl2');
						const ext = probe?.getExtension('WEBGL_debug_renderer_info');
						return ext ? probe.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (probe?.getParameter(probe.RENDERER) ?? 'unknown');
					} catch { return 'unknown'; }
				})(),
			};
		});

		step('measuring touch');
		/**
		 * TOUCH, ONE GESTURE PER ROUND TRIP.
		 *
		 * All four were in a single page.evaluate and a renderer that
		 * died somewhere inside it reported only "target closed" — true,
		 * useless, and identical whichever gesture had done it. The
		 * helpers are installed once and each gesture is its own call,
		 * so a crash names the gesture that caused it.
		 */
		await page.evaluate(() => {
			const canvas = document.querySelector('canvas');
			const rect = canvas.getBoundingClientRect();
			const dpr = canvas.width / Math.max(1, rect.width);
			window.__t = {
				canvas, rect, dpr,
				settle: async (n = 40) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); },
				/**
				 * A TRANSITION OWNS THE CAMERA EVERY FRAME IT RUNS.
				 *
				 * `Berx5DRuntime.input` returns immediately while one is
				 * in flight — deliberately: a travel is the camera's, and
				 * a pan arriving mid-flight would fight it. A probe that
				 * swipes during the focus travel therefore measures the
				 * tail of the travel and almost none of its own gesture:
				 * a 120px drag moved the camera 0.067 units, which looked
				 * like a phone that does not respond to a swipe and was a
				 * gate that swiped too early.
				 */
				still: async (tries = 240) => {
					for (let i = 0; i < tries; i++) {
						const w = window.__berxWorld;
						if (w.latestFrame.transition === undefined && !w.runtime.travelling) return true;
						await new Promise((r) => requestAnimationFrame(r));
					}
					return false;
				},
				/* a real touch pointer, not a mouse: pointerType is what
				   decides how the shell's own handlers see it */
				at: (px, py, extra = {}) => ({
					pointerType: 'touch', pointerId: 1, isPrimary: true, bubbles: true, cancelable: true,
					clientX: rect.left + px / dpr, clientY: rect.top + py / dpr, pressure: 0.5, ...extra,
				}),
				send: (type, opts) => canvas.dispatchEvent(new PointerEvent(type, opts)),
				project: (p) => {
					const w = window.__berxWorld;
					const c = w.latestFrame.camera;
					const basis = window.__berxCameraBasis(c);
					if (!basis) return undefined;
					const d = {x: p.x - c.position.x, y: p.y - c.position.y, z: p.z - c.position.z};
					const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
					if (along <= 1e-4) return undefined;
					const aspect = canvas.width / canvas.height;
					const tan = Math.tan((c.fov * Math.PI / 180) / 2);
					const ndcX = (d.x * basis.right.x + d.y * basis.right.y + d.z * basis.right.z) / (along * tan * aspect);
					const ndcY = (d.x * basis.up.x + d.y * basis.up.y + d.z * basis.up.z) / (along * tan);
					return {
						along, ndcX, ndcY,
						px: (ndcX * 0.5 + 0.5) * canvas.width, py: (0.5 - ndcY * 0.5) * canvas.height,
						onScreen: Math.abs(ndcX) <= 1 && Math.abs(ndcY) <= 1,
					};
				},
			};
		});

		/* --- TAP: on an entity the world really drew at that pixel --- */
		const tap = await page.evaluate(async () => {
			const t = window.__t, w = window.__berxWorld, host = window.__berxHost;
			w.blurAffordance?.();
			w.frameWorld(t.canvas.width, t.canvas.height);
			await t.settle();
			const from = w.latestFrame.world.objects.find((o) => o.kind === 'moment') ?? w.latestFrame.world.objects[0];
			w.focus(from.id);
			await t.still();
			await t.settle(8);
			host.renderer.render(w.latestFrame, {});
			const frame = w.latestFrame;
			const aspect = t.canvas.width / t.canvas.height;
			/**
			 * A PIXEL THAT BELONGS TO EXACTLY ONE ENTITY.
			 *
			 * "the world drew this entity here" is necessary and not
			 * sufficient. A box is not a mesh: at a pixel where TWO
			 * boxes contain the drawn depth the picker resolves by
			 * nearest entry, and either answer is defensible — the
			 * information that would settle it is in the mesh, which the
			 * shared core cannot see. A portrait phone is a narrow frame
			 * and those ties are common in it: this probe aimed at one
			 * and then reported the picker wrong for choosing the other
			 * entity whose box also contained that surface.
			 *
			 * So the target is a pixel where the drawn depth lies inside
			 * ONE entity's box and no other's. There the right answer
			 * exists, and the shell has to give it.
			 */
			let target;
			let ambiguous = 0;
			for (const o of frame.world.objects) {
				if (o.id === from.id || !o.visible || !o.interactive) continue;
				const p = t.project(o.transform.position);
				if (!p || !p.onScreen) continue;
				const drawn = host.renderer.depthAt?.(p.px, p.py);
				if (drawn === undefined) continue;
				const aim = window.__berxRayFromNdc(frame.camera, p.ndcX, p.ndcY, aspect);
				if (!aim) continue;
				const holds = (c) => {
					const cos = p.along / Math.max(1e-6, c.distance);
					return drawn >= c.distance * cos - 0.12 && drawn <= c.exit * cos + 0.12;
				};
				const own = window.__berxCandidates(aim, [o])[0];
				if (!own || !holds(own)) continue;
				const others = window.__berxCandidates(
					aim, frame.world.objects.filter((x) => x.id !== o.id && x.visible && x.interactive),
				).filter(holds);
				if (others.length > 0) { ambiguous++; continue; }
				target = {id: o.id, p};
				break;
			}
			const out = {aimedAt: target?.id, from: from.id, ambiguous};
			if (target) {
				t.send('pointerdown', t.at(target.p.px, target.p.py));
				t.send('pointerup', t.at(target.p.px, target.p.py));
				await t.settle();
				out.focused = w.latestFrame.world.activeObjectId;
			}
			return out;
		});
		step(`tap → ${tap.aimedAt ?? 'nothing fair to aim at'} → ${tap.focused ?? '-'}`);

		/* --- SWIPE: the camera moves, and nothing is selected --- */
		const swipe = await page.evaluate(async () => {
			const t = window.__t, w = window.__berxWorld;
			/* the tap above focused something, and focusing travels */
			const settledBefore = await t.still();
			await t.settle(8);
			const before = {...w.latestFrame.camera.position};
			const focusBefore = w.latestFrame.world.activeObjectId;
			const midX = t.canvas.width / 2, midY = t.canvas.height / 2;
			t.send('pointerdown', t.at(midX, midY, {pointerId: 2}));
			for (let i = 1; i <= 10; i++) {
				t.send('pointermove', t.at(midX - i * 12 * t.dpr, midY, {pointerId: 2}));
				await new Promise((r) => requestAnimationFrame(r));
			}
			t.send('pointerup', t.at(midX - 120 * t.dpr, midY, {pointerId: 2}));
			await t.settle();
			const after = w.latestFrame.camera.position;
			/**
			 * HOW FAR IT SHOULD HAVE GONE, from the frame itself.
			 *
			 * A drag is direct manipulation or it is nothing: the world
			 * under the finger has to travel with the finger. A vertical
			 * field of view of `fov` at a focal distance `d` spans
			 * 2 d tan(fov/2) world units across the canvas's CSS height,
			 * so 120 CSS pixels of drag is a known world distance — and
			 * "the camera moved a bit" is not the assertion. This is.
			 */
			const c = w.latestFrame.camera;
			const focal = Math.hypot(c.target.x - c.position.x, c.target.y - c.position.y, c.target.z - c.position.z);
			const expected = 120 * 2 * Math.tan((c.fov * Math.PI / 180) / 2) * focal / t.rect.height;
			return {
				settledBefore, expected,
				moved: Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z),
				focusUnchanged: w.latestFrame.world.activeObjectId === focusBefore,
			};
		});
		step(`swipe → camera moved ${swipe.moved.toFixed(3)}`);

		/* --- PINCH: two fingers change depth --- */
		const pinch = await page.evaluate(async () => {
			const t = window.__t, w = window.__berxWorld;
			await t.still();
			await t.settle(8);
			const midX = t.canvas.width / 2, midY = t.canvas.height / 2;
			/**
			 * A PINCH IS THE FIELD OF VIEW, not the eye's distance.
			 *
			 * `BerxSpatialCamera.applyInput` is explicit: `pinch` moves
			 * `state.fov`, clamped to the camera's own limits, and
			 * `depthDelta` is what moves the eye along its z. Measuring
			 * the eye-to-target distance reported "the pinch did
			 * nothing" for a pinch that had worked.
			 */
			const eye = () => w.latestFrame.camera.fov;
			const distBefore = eye();
			const list = (points) => points.map((pt, i) => new Touch({
				identifier: 10 + i, target: t.canvas,
				clientX: t.rect.left + pt.x / t.dpr, clientY: t.rect.top + pt.y / t.dpr,
			}));
			const fire = (type, points) => t.canvas.dispatchEvent(new TouchEvent(type, {
				bubbles: true, cancelable: true,
				touches: list(points), targetTouches: list(points), changedTouches: list(points),
			}));
			let supported = true;
			try {
				fire('touchstart', [{x: midX - 60 * t.dpr, y: midY}, {x: midX + 60 * t.dpr, y: midY}]);
				for (let i = 1; i <= 12; i++) {
					fire('touchmove', [{x: midX - (60 + i * 10) * t.dpr, y: midY}, {x: midX + (60 + i * 10) * t.dpr, y: midY}]);
					await new Promise((r) => requestAnimationFrame(r));
				}
				fire('touchend', []);
			} catch (error) {
				supported = String(error);
			}
			await t.settle();
			const distAfter = eye();
			return {supported, distBefore, distAfter, changed: Math.abs(distAfter - distBefore)};
		});
		step(`pinch → fov ${pinch.distBefore.toFixed(2)}° → ${pinch.distAfter.toFixed(2)}°`);

		/* --- HOLD: BERX listens, and only because a hand asked it to --- */
		const hold = await page.evaluate(async () => {
			const t = window.__t, host = window.__berxHost, w = window.__berxWorld;
			const midX = t.canvas.width / 2, midY = t.canvas.height / 2;
			const before = host.core?.state;
			const focusBefore = w.latestFrame.world.activeObjectId;
			t.send('pointerdown', t.at(midX, midY, {pointerId: 3}));
			/* longer than BERX_HOLD_MS, and the finger does not move */
			await new Promise((r) => setTimeout(r, 900));
			const during = host.core?.state;
			const captured = window.__berxCapture?.length ?? 0;
			t.send('pointerup', t.at(midX, midY, {pointerId: 3}));
			await t.settle();
			return {
				before, during, captured, after: host.core?.state,
				focusBefore, focusAfter: w.latestFrame.world.activeObjectId,
			};
		});
		step(`hold → core ${hold.before} → ${hold.during}`);

		const audioAfterGesture = await page.evaluate(() => window.__berxHost?.audio ? window.__berxHost.audio.running : undefined);
		const touch = {tap, swipe, pinch, hold, audioAfterGesture};

		step('measuring the virtual keyboard');
		/* ---- the virtual keyboard, driven through the production handler ---- */
		const keyboard = await page.evaluate(async () => {
			const shell = window.__berxShell;
			if (!shell || typeof shell.compose !== 'function') return {composed: false};
			shell.compose();
			await new Promise((r) => requestAnimationFrame(r));
			const form = [...document.querySelectorAll('form')].find((f) => f !== document.getElementById('berx-entry'));
			if (!form) return {composed: false};
			const resting = getComputedStyle(form).transform;
			const restingBottom = form.getBoundingClientRect().bottom;
			/**
			 * A KEYBOARD, AS THE ONLY THING THAT REPORTS ONE.
			 *
			 * No protocol raises the OS keyboard, so the visual viewport
			 * is given the geometry a keyboard produces — shorter than
			 * the window, offset unchanged — and the SHIPPED listener is
			 * left to do what it does with it. What is measured is the
			 * transform production code computed, not a transform this
			 * gate worked out.
			 */
			const height = window.innerHeight;
			const keyboardPx = 336;
			Object.defineProperty(window.visualViewport, 'height', {configurable: true, get: () => height - keyboardPx});
			window.visualViewport.dispatchEvent(new Event('resize'));
			await new Promise((r) => requestAnimationFrame(r));
			const lifted = getComputedStyle(form).transform;
			const liftedBottom = form.getBoundingClientRect().bottom;
			const field = form.querySelector('input');
			const fieldBottom = field ? field.getBoundingClientRect().bottom : undefined;
			delete window.visualViewport.height;
			window.visualViewport.dispatchEvent(new Event('resize'));
			await new Promise((r) => requestAnimationFrame(r));
			return {
				composed: true, resting, lifted, restingBottom, liftedBottom, fieldBottom,
				keyboardTop: height - keyboardPx,
				restored: getComputedStyle(form).transform,
				styleBottom: form.style.bottom,
				width: form.getBoundingClientRect().width,
				windowWidth: window.innerWidth,
			};
		});
		await page.keyboard.press('Escape');

		/* ---- orientation: the same world, framed for a wider frame ---- */
		step('rotating');
		const before = await page.evaluate(() => ({
			objects: window.__berxWorld.latestFrame.world.objects.length,
			focus: window.__berxWorld.latestFrame.world.activeObjectId,
			ids: window.__berxWorld.latestFrame.world.objects.map((o) => o.id).sort().join(','),
		}));
		await page.setViewportSize(device.landscape);
		try {
			await cdp.send('Emulation.setSafeAreaInsetsOverride', {
				insets: {top: 0, bottom: 21, left: device.insets.top, right: device.insets.top},
			});
		} catch { /* already reported above */ }
		await page.evaluate(async () => { for (let i = 0; i < 90; i++) await new Promise((r) => requestAnimationFrame(r)); });
		const rotated = await page.evaluate(() => {
			const canvas = document.querySelector('canvas');
			const rect = canvas.getBoundingClientRect();
			const w = window.__berxWorld;
			return {
				objects: w.latestFrame.world.objects.length,
				focus: w.latestFrame.world.activeObjectId,
				ids: w.latestFrame.world.objects.map((o) => o.id).sort().join(','),
				cssWidth: rect.width, cssHeight: rect.height,
				bufferWidth: canvas.width, bufferHeight: canvas.height,
				aspect: canvas.width / canvas.height,
				scrollWidth: document.documentElement.scrollWidth,
				innerWidth: window.innerWidth,
				onScreen: w.latestFrame.world.objects.filter((o) => {
					const c = w.latestFrame.camera;
					const basis = window.__berxCameraBasis(c);
					if (!basis) return false;
					const d = {x: o.transform.position.x - c.position.x, y: o.transform.position.y - c.position.y, z: o.transform.position.z - c.position.z};
					const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
					if (along <= 1e-4) return false;
					const tan = Math.tan((c.fov * Math.PI / 180) / 2);
					const ar = canvas.width / canvas.height;
					const ndcX = (d.x * basis.right.x + d.y * basis.right.y + d.z * basis.right.z) / (along * tan * ar);
					const ndcY = (d.x * basis.up.x + d.y * basis.up.y + d.z * basis.up.z) / (along * tan);
					return Math.abs(ndcX) <= 1 && Math.abs(ndcY) <= 1;
				}).length,
			};
		});

		step('measuring frame cost');
		/* ---- what a frame costs on this device ---- */
		await page.setViewportSize(device.viewport);
		await page.evaluate(async () => { for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r)); });
		const perf = await page.evaluate(async () => {
			const host = window.__berxHost;
			const times = [];
			let last = performance.now();
			for (let i = 0; i < 180; i++) {
				await new Promise((r) => requestAnimationFrame(r));
				const now = performance.now();
				times.push(now - last);
				last = now;
			}
			times.sort((a, b) => a - b);
			const median = times[Math.floor(times.length / 2)];
			return {
				p50: times[Math.floor(times.length * 0.5)],
				p95: times[Math.floor(times.length * 0.95)],
				medianMs: median,
				fps: median > 0 ? 1000 / median : 0,
				tier: host?.renderTier?.tier,
				tierReason: host?.renderTier?.reason,
				frames: times.length,
				quality: host?.quality?.quality,
				pixelRatio: host?.quality?.pixelRatio,
				objects: window.__berxWorld.latestFrame.world.objects.length,
				drawn: window.__berxWorld.latestFrame.world.objects.filter((o) => o.visible).length,
			};
		});

		results.push({device, entry, shell, touch, keyboard, before, rotated, perf, bootMs, pageErrors,
			insetsEmulated, audioBeforeGesture});
		await context.close();
	}

	/* ================= the gates ================= */
	for (const r of results) {
		const d = r.device;
		console.log('');
		console.log(`— ${d.name} —`);

		gate(`${d.id}: the shipped page boots a real GPU world at this device's size`,
			r.shell.objects > 4 && (r.shell.backend === 'webgl2' || r.shell.backend === 'webgpu')
				&& r.shell.canvas.bufferWidth > 0,
			`${r.shell.objects} entities on ${r.shell.backend}, canvas ${r.shell.canvas.cssWidth}x${r.shell.canvas.cssHeight} CSS px`
			+ ` backed by ${r.shell.canvas.bufferWidth}x${r.shell.canvas.bufferHeight} device px at devicePixelRatio ${r.shell.dpr}`
			+ ` — quality "${r.shell.quality}" resolved a pixel ratio of ${r.shell.pixelRatio}, render tier "${r.shell.tier}" (${r.shell.tierReason}),`
			+ ` drawn by ${r.shell.gpu}. The world boots signed in with a TAP, not a click`);

		gate(`${d.id}: the browser is not allowed to take the gesture`,
			r.shell.canvas.touchAction === 'none',
			`canvas touch-action is "${r.shell.canvas.touchAction}", user-select "${r.shell.canvas.userSelect}", -webkit-touch-callout "${r.shell.canvas.callout}", tap highlight "${r.shell.canvas.tapHighlight}"`
			+ `; body overscroll-behavior-y is "${r.entry.overscroll}". Anything but none on touch-action means a pan arrives as pointercancel, a second finger zooms the page instead of the world, and a tap waits for a double-tap — and anything but none on overscroll means a downward drag reloads the world`);

		gate(`${d.id}: nothing on this page can scroll sideways`,
			r.shell.scrollWidth <= r.shell.innerWidth,
			`document scrollWidth ${r.shell.scrollWidth} against an inner width of ${r.shell.innerWidth}`);

		gate(`${d.id}: the world's backing store is this device's own pixels`,
			Math.abs(r.shell.canvas.bufferWidth - Math.round(r.shell.canvas.cssWidth * Math.min(r.shell.dpr, r.shell.pixelRatio))) <= 1
			&& r.shell.canvas.bufferWidth >= r.shell.canvas.cssWidth,
			`${r.shell.canvas.cssWidth} CSS px x ${Math.min(r.shell.dpr, r.shell.pixelRatio)} = ${r.shell.canvas.bufferWidth} device px.`
			+ ` The device reports ${r.shell.dpr} and the quality resolver capped it at ${r.shell.pixelRatio}: a phone that rendered at 1x would be soft, and one that rendered at 3x of everything would drop frames`);

		if (r.insetsEmulated) {
			const noticeGap = r.shell.notice ? r.shell.innerHeight - r.shell.notice.bottom : undefined;
			gate(`${d.id}: the world's status line clears the home indicator`,
				r.shell.notice === undefined || r.shell.notice.hidden === true
					|| (r.shell.notice.style.includes('safe-area-inset-bottom')
						&& noticeGap !== undefined && noticeGap >= d.insets.bottom),
				r.shell.notice === undefined
					? 'the notice was already removed — the world exists, which is what removes it'
					: r.shell.notice.hidden
						? 'the notice is hidden because the world loaded; it is not a loading screen the world is drawn behind'
						: `it sits ${noticeGap?.toFixed(0)}px above the bottom of the window with a real ${d.insets.bottom}px inset emulated, from bottom:${r.shell.notice.style}`);

			gate(`${d.id}: sign-in is inside the part of the screen the phone shows`,
				parseFloat(r.entry.paddingTop) >= d.insets.top && parseFloat(r.entry.paddingBottom) >= d.insets.bottom
				&& r.entry.fieldTop >= d.insets.top,
				`with ${d.insets.top}/${d.insets.bottom}px insets emulated over CDP, the form padded itself ${r.entry.paddingTop} at the top and ${r.entry.paddingBottom} at the bottom`
				+ `; the first field starts at y=${r.entry.fieldTop.toFixed(0)} and the button ends at y=${r.entry.buttonBottom.toFixed(0)} of ${r.entry.innerHeight}.`
				+ ` viewport-fit=cover is what lets the world reach the glass, and it is also what puts a form under the notch`);

			gate(`${d.id}: the button a thumb has to hit is big enough to hit`,
				r.entry.buttonHeight >= 44 && r.entry.fieldHeight >= 44,
				`the enter button is ${r.entry.buttonHeight.toFixed(0)}px tall and the fields ${r.entry.fieldHeight.toFixed(0)}px — 44 is the floor both platforms publish`);
		} else {
			blocker(`${d.id}: safe areas`, 'BLOCKED',
				'Emulation.setSafeAreaInsetsOverride is not available in this Chromium, so no real inset could be applied. The insets are not measurable here and are NOT reported as passing');
		}

		gate(`${d.id}: the page declares the viewport a world needs`,
			r.entry.viewportMeta.includes('width=device-width')
			&& r.entry.viewportMeta.includes('viewport-fit=cover')
			&& r.entry.viewportMeta.includes('interactive-widget=resizes-content'),
			`"${r.entry.viewportMeta}" — device width so nothing is scaled, viewport-fit=cover so the world reaches the glass, and interactive-widget=resizes-content so the keyboard shortens the layout viewport instead of covering it. initial-scale is 1 and user scaling is NOT disabled: pinch-zoom on the sign-in text is an accessibility right`);

		gate(`${d.id}: a tap selects the entity under the finger`,
			r.touch.tap.aimedAt !== undefined && r.touch.tap.focused === r.touch.tap.aimedAt,
			r.touch.tap.aimedAt === undefined
				? `standing at ${r.touch.tap.from}, no pixel belonged to exactly one entity — ${r.touch.tap.ambiguous} were drawn where a second entity's box held the same surface, and there the box test cannot say which mesh it is`
				: `a real touch PointerEvent at ${r.touch.tap.aimedAt}'s own pixel focused ${r.touch.tap.focused} — the shell's own pointerup path, with pointerType "touch" rather than a mouse.`
				+ ` The pixel belongs to it alone: the drawn depth is inside its box and no other entity's (${r.touch.tap.ambiguous} candidate pixel(s) were rejected as shared)`);

		gate(`${d.id}: a swipe moves the world and chooses nothing in it`,
			r.touch.swipe.moved > r.touch.swipe.expected * 0.8
			&& r.touch.swipe.moved < r.touch.swipe.expected * 1.25
			&& r.touch.swipe.focusUnchanged,
			`the camera moved ${r.touch.swipe.moved.toFixed(3)} world units across a 120 CSS px drag, against ${r.touch.swipe.expected.toFixed(3)} that those pixels subtend at the focal depth — the world followed the finger.`
			+ ` It used to move 0.067 for the same drag, because the pan was an uncalibrated impulse into a damped velocity: crossing a twenty-unit world seen from twelve units away needed a two-thousand-pixel drag, and on a phone a drag is the only way to move.`
			+ ` The focus stayed ${r.touch.swipe.focusUnchanged ? 'where it was' : 'CHANGED'} — a pick after panning would select whatever happened to be under the finger when it lifted`);

		gate(`${d.id}: two fingers change how deep into the world you are`,
			r.touch.pinch.supported === true && r.touch.pinch.changed > 0.5,
			r.touch.pinch.supported === true
				? `real TouchEvents carrying two Touch points opened the field of view from ${r.touch.pinch.distBefore.toFixed(2)}° to ${r.touch.pinch.distAfter.toFixed(2)}° (${r.touch.pinch.changed.toFixed(2)}°), clamped by the camera's own limits — two fingers spreading is the world opening up around you`
				: `TouchEvent construction failed: ${r.touch.pinch.supported}`);

		gate(`${d.id}: a held finger is how a phone asks BERX to listen`,
			r.touch.hold.during === 'listening',
			`the drawn Core went ${r.touch.hold.before} -> ${r.touch.hold.during} while a finger stayed on the world for 900ms without moving.`
			+ ` "aware" would not do: a pointerdown ALONE reports presence and reaches aware, so only a state a plain tap cannot produce is evidence the hold did anything.`
			+ ` "v" does this from a keyboard and a phone has no "v", so voice — and the fifteen intents behind it — was unreachable on mobile web.`
			+ ` It is the gesture the Core already modelled: berxTouchField, berxGestureCause and berxTouchHaptic all handle 'hold', and nothing had ever produced one`);

		gate(`${d.id}: and the same gesture does not also choose something`,
			r.touch.hold.focusAfter === r.touch.hold.focusBefore,
			`the focus was ${r.touch.hold.focusBefore ?? 'nothing'} before the hold and ${r.touch.hold.focusAfter ?? 'nothing'} after it.`
			+ ` The release after a hold is inside the tap threshold — the finger did not move, which is what made it a hold — so without a rule the lift ALSO ran the pick,`
			+ ` and asking BERX to listen re-focused whatever was under the thumb at the same moment. One gesture, one meaning`);

		gate(`${d.id}: nothing reached the microphone or the camera without a gesture`,
			r.shell.captured === 0,
			`${r.shell.captured} getUserMedia call(s) between page load and the world existing, and ${r.touch.hold.captured} up to the end of the hold.`
			+ ` navigator.mediaDevices.getUserMedia is wrapped before the page runs a line, so a covert open would be recorded with its stack.`
			+ ` A hold asks BERX to listen; the browser then asks the person, and its recording indicator is left entirely alone`);

		gate(`${d.id}: sound waits for the hand, and then follows the camera`,
			r.audioBeforeGesture !== true && r.shell.audio?.spatial === true,
			`the audio context was ${r.audioBeforeGesture === undefined ? 'not yet built' : `running=${r.audioBeforeGesture}`} before any gesture and running=${r.touch.audioAfterGesture} after the world had been touched`
			+ `; the backend reports spatial=${r.shell.audio?.spatial} — real HRTF panning tied to world coordinates, not stereo gain. Nothing plays: BERX ships no audio assets and invents none`);

		gate(`${d.id}: what someone is typing stays above the keyboard`,
			r.keyboard.composed === true
			&& r.keyboard.styleBottom.includes('safe-area-inset-bottom')
			&& r.keyboard.lifted !== r.keyboard.resting
			&& r.keyboard.fieldBottom <= r.keyboard.keyboardTop + 1
			&& r.keyboard.restored === r.keyboard.resting,
			r.keyboard.composed !== true
				? 'the shell exposed no composer to open'
				: `at rest the field is anchored at bottom:${r.keyboard.styleBottom} with transform ${r.keyboard.resting}.`
				+ ` Given a visual viewport 336px shorter — the geometry a keyboard produces — the SHIPPED listener moved it to ${r.keyboard.lifted},`
				+ ` putting the field's bottom at ${r.keyboard.fieldBottom?.toFixed(0)}px against a keyboard starting at ${r.keyboard.keyboardTop}px, and it returned to ${r.keyboard.restored} when the viewport came back.`
				+ ` Chrome honours interactive-widget=resizes-content; iOS Safari does not implement it, and this is the path that carries iOS`);

		gate(`${d.id}: the composer fits between the phone's own edges`,
			r.keyboard.composed !== true || r.keyboard.width <= r.keyboard.windowWidth - 24,
			`${r.keyboard.width?.toFixed(0)}px wide in a ${r.keyboard.windowWidth}px window — width:min(560px, 100% - 48px - the left and right insets), so a landscape phone with a notch does not put the field under it`);

		gate(`${d.id}: turning the phone keeps the same world and re-frames it`,
			r.rotated.ids === r.before.ids && r.rotated.focus === r.before.focus
			&& r.rotated.aspect > 1 && r.rotated.onScreen >= 3
			&& r.rotated.scrollWidth <= r.rotated.innerWidth,
			`portrait held ${r.before.objects} entities focused on ${r.before.focus}; landscape (${d.landscape.width}x${d.landscape.height}) holds the same ${r.rotated.objects}`
			+ ` at aspect ${r.rotated.aspect.toFixed(2)} with ${r.rotated.onScreen} of them in frame, canvas ${r.rotated.bufferWidth}x${r.rotated.bufferHeight}.`
			+ ` The ResizeObserver in runtimeHost5d re-resolves quality and the backing store; the world itself is untouched, because a rotation is a fact about a window and not about a world`);

		gate(`${d.id}: the world is on the screen within a phone's patience`,
			r.bootMs < 20000,
			`${r.bootMs}ms from navigation to a world holding more than four entities: the sign-in tap, the token, /me, and the world loader's twelve domain endpoints, on this ${d.viewport.width}x${d.viewport.height} device.`
			+ ` Every pixel of it rasterised on the CPU by mesa's lavapipe, so this is a ceiling on a phone's real number rather than a prediction of it`);

		/**
		 * A FRAME BUDGET IS A CLAIM ABOUT HARDWARE.
		 *
		 * 60ms is the right budget for a phone and it is not a
		 * measurable claim on a machine with no GPU: here every fragment
		 * is rasterised on the CPU by mesa's lavapipe, and the number is
		 * real but says nothing about a phone. So the software case is
		 * reported as a HARDWARE BLOCKER carrying the measurement, and
		 * the budget is asserted wherever there is hardware to assert it
		 * against. The driver is asked which it is; nothing is assumed
		 * from the environment.
		 *
		 * What IS asserted here regardless: the runtime has to NOTICE.
		 * A machine drawing at 1fps must step its render tier down —
		 * that is what an adaptive tier is for, and it was measuring a
		 * rolling p95 and never feeding it back.
		 */
		const software = /llvmpipe|lavapipe|softpipe|swiftshader|software/i.test(String(r.shell.gpu));
		const cost = `p50 ${r.perf.p50.toFixed(1)}ms, p95 ${r.perf.p95.toFixed(1)}ms over ${r.perf.frames} frames`
			+ ` with ${r.perf.drawn} entities at ${(r.shell.canvas.bufferWidth * r.shell.canvas.bufferHeight / 1e6).toFixed(2)} megapixels,`
			+ ` quality "${r.perf.quality}", pixel ratio ${r.perf.pixelRatio}, render tier "${r.perf.tier}" (${r.perf.tierReason})`;
		if (software) {
			blocker(`${d.id}: a frame costs what a phone can pay`, 'HARDWARE BLOCKER',
				`${cost}. The driver names itself "${r.shell.gpu}" — a software rasteriser, so the 60ms budget cannot be measured here and is NOT reported as passing.`
				+ ' What is measured below is the thing that does not need a GPU: whether the runtime notices.');
		} else {
			gate(`${d.id}: a frame costs what a phone can pay`, r.perf.p95 < 60,
				`${cost}, drawn by ${r.shell.gpu}`);
		}

		gate(`${d.id}: a runtime that is behind steps down instead of insisting`,
			r.perf.fps >= 50 ? r.perf.tier === r.shell.tier : r.perf.tier === 'low' || r.perf.tier === 'medium',
			`the median frame was ${r.perf.medianMs.toFixed(1)}ms — ${r.perf.fps.toFixed(1)}fps — and the render tier is "${r.perf.tier}" because ${r.perf.tierReason}.`
			+ ` It booted at "${r.shell.tier}" from static signals (${r.shell.tierReason}).`
			+ ` berxResolveRenderTier says a real measurement outranks memory and core count; the host was measuring a rolling p95, exposing it on host.performance, and never feeding it back,`
			+ ` so a machine that turned out to be behind kept the tier its RAM had suggested. It now re-resolves at most every two seconds off a full window's MEDIAN, with 56fps sustained for four seconds required to climb back`);

		gate(`${d.id}: no page or console errors anywhere in that`,
			r.pageErrors.length === 0,
			r.pageErrors.length === 0 ? 'clean' : r.pageErrors.slice(0, 4).join(' | '));
	}

	console.log('');
	blocker('iPhone Safari runs WebKit, and no WebKit is installed here', 'ENGINE BLOCKER',
		'The iPhone profile above is the real Chromium engine at an iPhone\'s viewport, density, user agent, touch capability and safe-area insets — so everything it measures about BERX\'s own code is real. What it cannot measure is WebKit\'s own behaviour: iOS\'s WebGL2 limits, its lack of interactive-widget, its own touch-action implementation, and that iOS has no WebXR at all. Installing WebKit (playwright install webkit) would close this; it is not a code defect and is not reported as an iOS pass.');
} finally {
	await browser.close();
	sockets.closeAll();
	server.closeAllConnections?.();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} MOBILE WEB GATES FAILED`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
}
console.log(`ALL MOBILE WEB GATES PASS${blocked.length ? ` (${blocked.length} blocked: ${blocked.join(', ')})` : ''}`);
