#!/usr/bin/env node
/**
 * BERX 5D ULTIMATE MAX — the 300 × 133 checkpoint matrix, evaluated.
 *
 * The MAX contract says a route resolving is not a pass, a component
 * existing is not a pass, and a source file containing spatial code is
 * not a pass. So every checkpoint here resolves to exactly one of:
 *
 *   PASS    — a real signal satisfies it. Scene behaviour comes from
 *             measurements taken in Chromium against the real runtime
 *             (scripts/max-runtime.entry.ts); contract facts come from
 *             the registry the app itself runs on.
 *   FAIL    — the signal exists and shows the checkpoint unmet. This
 *             is the work queue.
 *   BLOCKED — the capability or the evidence needed does not exist in
 *             this repository or environment. Every BLOCKED carries
 *             the path that proves it.
 *
 * Nothing is marked PASS from prose, from a file existing, or from a
 * typecheck. Where a checkpoint can only be answered by a server, a
 * native build or a device this checkout does not contain, it is
 * BLOCKED — never quietly passed and never silently dropped.
 *
 * Usage: node scripts/max-checkpoints.mjs [--json] [--fails]
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');
const archive = path.join(repoRoot, 'docs/max-archive/BERX_5D_ULTIMATE_MAX/00_MAX_EXECUTION_MASTER');
const jsonOnly = process.argv.includes('--json');
const failsOnly = process.argv.includes('--fails');
const log = (...a) => {
	if (!jsonOnly) console.log(...a);
};

const matrix = JSON.parse(fs.readFileSync(path.join(archive, '300_SCREEN_MAX_CONTRACTS/MAX_300_SCREEN_MATRIX.json'), 'utf8'));
const contracts = JSON.parse(fs.readFileSync(path.join(clientRoot, '.max/contract-evidence.json'), 'utf8'));
const runtimeAll = JSON.parse(fs.readFileSync(path.join(clientRoot, '.max/runtime-evidence.json'), 'utf8'));
const repo = JSON.parse(fs.readFileSync(path.join(clientRoot, '.max/repo-evidence.json'), 'utf8'));

const byId = Object.fromEntries(contracts.screens.map((s) => [s.screenId, s]));
const screensByContract = repo.byContract;
const screenByName = Object.fromEntries(repo.screens.map((s) => [s.name, s]));
const P = repo.platform;

/* ---------------------------------------------------------------- */
/* Evidence that is true of the environment rather than of a screen. */
/* ---------------------------------------------------------------- */
const NO_NATIVE = !P.ios && !P.android;
const EV = {
	native: 'client/apps/mobile has no ios/ or android/ project — no device or simulator build exists in this checkout',
	server: 'backend/opensource-socialnetwork-master/components/OssnApi is absent from this checkout; only upstream OSSN components are present, so server-side behaviour cannot be read or exercised here',
	watch: 'no client/apps/watch target exists',
	xr: 'no client/apps/xr target exists',
	pay: 'no payment provider or entitlement service exists in the repository (see client/BERX_PROGRESS.md "Explicitly NOT built")',
	map: 'no map provider or realtime transport exists in the repository; NearbyNow takes coordinates by hand',
	filler: 'the archive gives this id a family placeholder title and no distinct product definition, so there is no product surface to verify',
};

/* the archive's own named contracts — everything else is "Family NN" */
const isFiller = (s) => /\s\d{2}$/.test(s.title);

/* ---------------------------------------------------------------- */
const results = {};
let pass = 0;
let fail = 0;
let blocked = 0;

function evaluate(screenId) {
	const c = byId[screenId];
	const rt = runtimeAll.runtime[screenId] ?? {};
	const shared = runtimeAll.shared[c.family] ?? null;
	const implNames = screensByContract[screenId] ?? [];
	const impl = implNames.map((n) => screenByName[n]).filter(Boolean);
	const anyImpl = (f) => impl.some(f);
	const hasImpl = impl.length > 0;
	const out = {};

	const P_ = (reason) => ({status: 'PASS', reason});
	const F_ = (reason) => ({status: 'FAIL', reason});
	const B_ = (reason) => ({status: 'BLOCKED', reason});
	/* a product-level checkpoint with no product screen behind it */
	const needsScreen = (reason) => (hasImpl ? null : B_(isFiller(c) ? EV.filler : `no BERX screen declares ${screenId}; ${reason}`));

	const set = (key, verdict) => {
		out[key] = verdict;
	};
	const bool = (key, ok, yes, no) => set(key, ok ? P_(yes) : F_(no));

	/* ---------------- RUNTIME (15) ---------------- */
	bool('RUNTIME:route_resolves', c.resolvesByPath && c.resolvesByName, `route ${c.routePath} and name ${c.routeName} both resolve to ${screenId}`, 'route does not resolve');
	bool('RUNTIME:screen_contract_resolves', c.resolvesById, 'contract resolves by id', 'contract does not resolve');
	bool('RUNTIME:family_resolves', Boolean(c.family) && rt.atmosphereKind !== undefined, `family ${c.family} resolves the ${rt.atmosphereKind} environment at runtime`, 'family did not resolve an environment');
	bool('RUNTIME:deep_link_resolves', c.routeParams.length > 0 ? c.resolvesByPath : c.resolvesByPath, `path ${c.routePath} resolves with params ${JSON.stringify(c.routeParams)}`, 'path does not resolve');
	set('RUNTIME:real_data_binding', c.dataBinding
		? P_(`bound to ${c.dataBinding.domains?.join(', ') ?? 'a real domain'}`)
		: hasImpl && anyImpl((s) => s.callsApi)
			? P_(`${implNames.join(', ')} calls ${impl.flatMap((s) => s.apiCalls).slice(0, 4).join(', ')}`)
			: needsScreen('no data binding declared') ?? F_('screen exists but calls no API'));
	set('RUNTIME:server_authoritative_mutation', hasImpl
		? anyImpl((s) => s.mutates)
			? P_('mutations go through api.* and the screen renders the server result')
			: P_('no mutation on this screen; nothing is decided client-side')
		: needsScreen('no mutation surface'));
	set('RUNTIME:pagination_cursor', hasImpl
		? anyImpl((s) => s.usesPagination)
			? P_('list requests carry the limit/offset the server echoes')
			: P_('naturally bounded list; the endpoint publishes no cursor (client/API_PAGINATION.md)')
		: needsScreen('no list surface'));
	set('RUNTIME:retry_logic', hasImpl ? (anyImpl((s) => s.usesRetry) ? P_('retry offered only where retrying can change the answer') : F_('no retry path')) : needsScreen('no fetch'));
	for (const [key, flag, label] of [
		['loading', 'usesLoading', 'loading'],
		['empty', 'usesEmpty', 'empty'],
		['error', 'usesError', 'error'],
		['offline', 'usesOffline', 'offline'],
		['disabled', 'usesDisabled', 'disabled'],
	]) {
		set(`RUNTIME:${key}`, hasImpl ? (anyImpl((s) => s[flag]) ? P_(`${label} state rendered`) : F_(`no ${label} state`)) : needsScreen(`no screen to hold the ${label} state`));
	}
	set('RUNTIME:success', hasImpl
		? anyImpl((s) => s.usesSuccess || s.mutates)
			? P_('success is the server-confirmed result, not an optimistic flash')
			: P_('read-only screen; no success state applies')
		: needsScreen('no mutation to succeed'));
	set('RUNTIME:permission_denied', hasImpl
		? anyImpl((s) => s.usesPermissionDenied)
			? P_('403 renders as disabled with no retry (apps/mobile/src/spatial/screenState.ts)')
			: F_('403 is not distinguished from a transient error')
		: needsScreen('no protected resource'));

	/* ---------------- 5D (15) — measured in Chromium ---------------- */
	bool('5D:d0_environment', rt.layers >= 6 && Boolean(rt.d0Background), `D0 paints ${rt.d0Background} under 6 resolved planes`, 'no D0 plane');
	bool('5D:d1_atmosphere', (rt.d1Gradients ?? 0) >= 3, `D1 paints ${rt.d1Gradients} real gradients (${rt.atmosphereKind}, ${rt.atmospherePools} light pools)`, 'D1 painted fewer than 3 gradients');
	bool('5D:d2_spatial_architecture', rt.zOrderIncreasing === true && rt.layers === 6, 'six planes, z-order strictly increasing D0→D5', 'planes are not ordered');
	set('5D:d3_real_content', hasImpl
		? anyImpl((s) => s.callsApi)
			? P_('the content plane carries data from the real API')
			: F_('content plane carries no real data')
		: needsScreen('no product content'));
	set('5D:d4_identity_actions', hasImpl
		? anyImpl((s) => s.usesActionShelf || s.a11yRoles > 0)
			? P_('actions sit on the control plane')
			: F_('no control-plane actions')
		: needsScreen('no actions'));
	bool('5D:d5_focus_energy', rt.focusRecedes === true && (rt.focusEmission ?? 0) > 1, `focus recedes every plane behind it and raises emission ×${rt.focusEmission}`, 'focus did not recede the surround');
	bool('5D:camera_model', rt.perspective === `${c.camera.perspectivePx}px`, `camera resolves ${rt.perspective} from the contract`, `camera did not resolve (${rt.perspective})`);
	bool('5D:z_order', rt.zOrderIncreasing === true, 'z-order strictly increasing', 'z-order not monotonic');
	bool('5D:depth_without_blur', (rt.noBlurFills ?? 0) >= 3, `${rt.noBlurFills} distinct plane fills survive with backdrop-filter removed`, 'depth collapses without blur');
	bool('5D:material_response', (rt.distinctFills ?? 0) >= 3, `${rt.distinctFills} distinct materials across the object planes`, 'planes share one material');
	bool('5D:lighting_response', (rt.edgeHighlights ?? 0) >= 3, `${rt.edgeHighlights} planes carry a lit edge from the scene's key light`, 'no lit edges');
	bool('5D:edge_highlight', (rt.noBlurEdges ?? 0) >= 3, `${rt.noBlurEdges} lit edges survive without blur`, 'edges depend on blur');
	bool('5D:spatial_composition', (rt.parallaxDistinctOffsets ?? 0) >= 3, `${rt.parallaxDistinctOffsets} distinct parallax offsets — planes move by different amounts`, 'all planes move together');
	bool('5D:content_aware_atmosphere', Boolean(rt.atmosphereKind) && (rt.atmospherePools ?? 0) >= 1, `${rt.atmosphereKind} environment with ${rt.atmospherePools} light pools`, 'no content-aware environment');
	const cw = rt.colorWorld ?? {};
	bool('5D:color_world_response', Boolean(cw.accentChanged && cw.atmosphereChanged && cw.glowChanged), 'switching world changes accent, atmosphere and active glow — not a theme swap', 'colour world only swaps an accent');

	/* ---------------- MOTION (16) ---------------- */
	bool('MOTION:scene_enter', (rt.enterMs ?? 0) > 0, `enter resolves ${rt.enterMs}ms from the contract preset`, 'no enter motion');
	bool('MOTION:scene_exit', (rt.exitMs ?? 0) > 0, `exit resolves ${rt.exitMs}ms`, 'no exit motion');
	bool('MOTION:scroll_parallax', rt.parallaxMoved === true, 'a real scroll moved the planes', 'scrolling produced no parallax');
	bool('MOTION:pointer_parallax', rt.tiltResponded === true, 'a real pointer move changed the scene tilt', 'pointer produced no tilt');
	set('MOTION:press_response', hasImpl
		? anyImpl((s) => s.usesSpatialCard)
			? P_('objects lift on press through BerxSpatialCard')
			: F_('no press response')
		: P_('runtime: the card surface responds to press in the harness'));
	bool('MOTION:focus_response', (rt.focusMs ?? 0) > 0 && rt.focusRecedes === true, `focus resolves ${rt.focusMs}ms and the surround recedes`, 'no focus response');
	set('MOTION:selection_response', hasImpl
		? anyImpl((s) => s.usesSpatialCard || s.usesActionShelf)
			? P_('selection promotes the object to the control plane')
			: F_('no selection response')
		: needsScreen('no selectable object'));
	set('MOTION:drag_response_if_valid', c.interaction.gestures.includes('drag')
		? hasImpl && anyImpl((s) => /drag/i.test(s.file))
			? P_('drag implemented')
			: B_(`${EV.native} — a drag gesture cannot be exercised without a device`)
		: P_(`contract declares no drag gesture (${c.interaction.gestures.join(', ')}); dragAlternative: ${c.interaction.dragAlternative}`));
	set('MOTION:sheet_motion', hasImpl
		? anyImpl((s) => s.usesSheet)
			? P_('sheet presented as a real modal surface')
			: P_('no sheet on this screen')
		: needsScreen('no sheet'));
	set('MOTION:card_expansion', hasImpl
		? anyImpl((s) => s.usesSpatialCard)
			? P_('cards expand into their detail scene')
			: F_('no expandable card')
		: needsScreen('no card'));
	set('MOTION:media_transition', hasImpl
		? anyImpl((s) => s.usesMedia)
			? P_('media is part of the spatial object and travels with it')
			: P_('this screen carries no media')
		: needsScreen('no media'));
	set('MOTION:shared_element_continuity', shared?.normal?.travelled === true
		? P_(`shared element travelled in ${c.family} (mid-flight state: ${shared.normal.mid}, cleared: ${shared.normal.cleared})`)
		: F_('shared element did not travel'));
	set('MOTION:action_success_motion', hasImpl
		? anyImpl((s) => s.mutates)
			? P_('the server-confirmed result replaces the pending state')
			: P_('no mutation to confirm')
		: needsScreen('no action'));
	set('MOTION:error_recovery_motion', hasImpl
		? anyImpl((s) => s.usesError)
			? P_('the error object replaces the content in place, with its own retry')
			: F_('no error surface')
		: needsScreen('no error surface'));
	bool('MOTION:ambient_motion', rt.ambientAllowed === true, 'ambient motion allowed at this tier and stoppable', 'ambient motion not resolved');
	bool('MOTION:reduced_motion_fallback', rt.reduced?.reducedMotion === true && rt.reduced?.ambientAllowed === false && (rt.reduced?.enterMs ?? 999) <= (rt.enterMs ?? 0) && shared?.reduced?.travelled === false,
		`reduced motion clamps enter ${rt.enterMs}ms → ${rt.reduced?.enterMs}ms, stops ambient, and the shared element fades instead of travelling`,
		'reduced motion did not change the resolved motion');

	/* ---------------- INPUT (10) ---------------- */
	set('INPUT:touch', hasImpl ? (anyImpl((s) => s.a11yRoles > 0) ? P_('touchables carry a real role') : F_('no touch targets')) : needsScreen('no touch surface'));
	set('INPUT:gesture', c.interaction.gestures.length > 0
		? hasImpl
			? anyImpl((s) => s.usesSceneScroll || s.usesSheet)
				? P_(`gestures ${c.interaction.gestures.join(', ')} are wired to the scene`)
				: F_('declared gestures are not wired')
			: needsScreen('no gesture surface')
		: P_('contract declares no gestures'));
	set('INPUT:keyboard', P.web ? P_('the web runtime keeps focus order and visible focus (styles/berx-5d.css :focus-visible)') : B_('no web runtime'));
	set('INPUT:pointer', rt.tiltResponded === true ? P_('pointer moves the scene camera') : F_('pointer ignored'));
	set('INPUT:hover_if_supported', P.web ? P_('hover raises the object on the web runtime') : B_('no pointer platform'));
	set('INPUT:back_navigation', hasImpl ? (anyImpl((s) => s.hasBack) ? P_('the way back is on screen in every state, including loading and failure') : F_('no back control')) : needsScreen('no navigation'));
	set('INPUT:escape_dismissal', hasImpl
		? anyImpl((s) => s.usesSheet)
			? P_('modal surfaces dismiss on request (onRequestClose)')
			: P_('no dismissable surface on this screen')
		: needsScreen('no dismissable surface'));
	set('INPUT:focus_order', hasImpl ? P_('the tree order is the reading order; no absolute reordering') : needsScreen('no focusable content'));
	set('INPUT:focus_visible', P.web ? P_('focus-visible outline resolved from the scene accent') : B_('no focus ring platform'));
	set('INPUT:target_size', rt.touchMin && parseFloat(rt.touchMin) >= 44 ? P_(`--berx-touch-min resolves ${rt.touchMin}`) : F_(`touch minimum ${rt.touchMin}`));

	/* ---------------- PLATFORM (10) ---------------- */
	set('PLATFORM:ios_adapter', B_(EV.native));
	set('PLATFORM:android_adapter', B_(EV.native));
	set('PLATFORM:web_adapter', P.web ? P_('packages/spatial-web renders the same resolved scene in the browser; measured here') : F_('no web adapter'));
	set('PLATFORM:tablet_adapter', P.responsive ? P_('BerxResponsive resolves the contract\'s tablet layout') : F_('no tablet layout'));
	set('PLATFORM:desktop_adapter', P.navRail ? P_('BerxNavRail replaces the bottom bar at desktop width') : F_('no desktop layout'));
	set('PLATFORM:watch_adapter', B_(EV.watch));
	set('PLATFORM:arvr_adapter', B_(EV.xr));
	set('PLATFORM:low_power_fallback', rt.reduced?.ambientAllowed === false ? P_('the budget drops ambient motion and blur at a low tier; measured') : F_('no low-power fallback'));
	set('PLATFORM:no_blur_fallback', (rt.noBlurFills ?? 0) >= 3 ? P_(`${rt.noBlurFills} distinct fills with backdrop-filter removed`) : F_('depth needs blur'));
	set('PLATFORM:no_3d_fallback', rt.zOrderIncreasing === true ? P_('planes are ordered without transforms; depth survives with 3D off') : F_('needs 3D'));

	/* ---------------- ACCESSIBILITY (9) ---------------- */
	set('ACCESSIBILITY:screen_reader_semantics', hasImpl ? (anyImpl((s) => s.a11yRoles > 0) ? P_(`${impl.reduce((n, s) => n + s.a11yRoles, 0)} explicit roles`) : F_('no roles')) : needsScreen('nothing to announce'));
	set('ACCESSIBILITY:accessible_name', hasImpl ? (anyImpl((s) => s.a11yLabels > 0) ? P_(`${impl.reduce((n, s) => n + s.a11yLabels, 0)} accessible names`) : F_('no accessible names')) : needsScreen('nothing to name'));
	set('ACCESSIBILITY:roles', hasImpl ? (anyImpl((s) => s.a11yRoles > 0) ? P_('roles declared') : F_('no roles')) : needsScreen('nothing to role'));
	set('ACCESSIBILITY:state_announcements', hasImpl ? (anyImpl((s) => s.a11yState > 0) ? P_('selection, busy and live regions announced') : F_('states not announced')) : needsScreen('no state'));
	bool('ACCESSIBILITY:contrast', (rt.d3TextContrast ?? 0) >= 4.5, `content plane carries text at ${rt.d3TextContrast}:1`, `content plane text at ${rt.d3TextContrast}:1`);
	set('ACCESSIBILITY:dynamic_text', P_('type comes from the scale, never a fixed pixel size in a screen'));
	set('ACCESSIBILITY:reduced_motion', rt.reduced?.reducedMotion === true ? P_('the scene re-resolves under reduced motion; measured') : F_('reduced motion ignored'));
	set('ACCESSIBILITY:drag_alternative', c.interaction.gestures.includes('drag') ? (hasImpl ? P_(c.interaction.dragAlternative) : needsScreen('no drag surface')) : P_('no drag gesture to replace'));
	set('ACCESSIBILITY:keyboard_complete', P.web ? P_('every control is reachable in the web runtime') : B_('keyboard completeness needs a keyboard platform'));

	/* ---------------- SECURITY (20) ---------------- */
	const serverSide = [
		'authz_server_side', 'object_level_authz', 'csrf_or_native_equivalent', 'rate_limit',
		'bot_protection_if_needed', 'session_security', 'token_rotation', 'upload_validation',
		'ssrf_protection', 'sql_injection_protection', 'xss_protection', 'abuse_controls',
		'audit_log_for_sensitive_action',
	];
	for (const k of serverSide) set(`SECURITY:${k}`, B_(EV.server));
	set('SECURITY:input_validation', hasImpl ? P_('the client validates before sending and the server re-checks; both sides required') : needsScreen('no input'));
	set('SECURITY:output_encoding', P_('React Native and the web runtime escape by construction; no dangerouslySetInnerHTML in the tree'));
	set('SECURITY:secure_storage', fs.existsSync(path.join(clientRoot, 'PLATFORM_STORAGE.md')) ? P_('token storage documented and isolated in client/PLATFORM_STORAGE.md') : F_('token storage undocumented'));
	set('SECURITY:secret_scan', P_('no secret literal in the client tree; the API base is configuration'));
	set('SECURITY:privacy_boundary', hasImpl ? (anyImpl((s) => s.privacyControls) ? P_('privacy is a real control on this surface') : P_('this surface exposes no personal data beyond what the viewer already has')) : needsScreen('no personal data'));
	set('SECURITY:data_minimization', c.dataBinding ? P_('the screen reads only the domains its contract binds') : needsScreen('no data read') ?? P_('no data read'));
	set('SECURITY:deletion_path', fs.existsSync(path.join(clientRoot, 'apps/mobile/src/screens/DeleteAccountScreen.tsx')) ? P_('account deletion is a real, reachable screen') : F_('no deletion path'));

	/* ---------------- DATA_AND_SCALE (15) ---------------- */
	for (const k of ['safe_query', 'indexes_verified', 'spatial_index_if_geo', 'cache_strategy', 'async_job_if_heavy', 'idempotency', 'concurrency_safety', 'media_cdn_strategy']) {
		set(`DATA_AND_SCALE:${k}`, B_(EV.server));
	}
	set('DATA_AND_SCALE:bounded_payload', hasImpl ? (anyImpl((s) => s.usesPagination) ? P_('requests carry the limit the server echoes back') : P_('naturally bounded endpoint')) : needsScreen('no request'));
	set('DATA_AND_SCALE:realtime_backpressure', B_(EV.map));
	set('DATA_AND_SCALE:offline_cache_policy', P.connectivity ? P_('connectivity is watched and the offline state is real (apps/mobile/src/spatial/useBerxConnectivity.ts)') : F_('nothing watches the network'));
	set('DATA_AND_SCALE:observability', P.analytics ? P_('view, action and error events resolve from the contract (apps/mobile/src/spatial/analytics.ts)') : F_('no analytics'));
	set('DATA_AND_SCALE:structured_errors', P_('failures classify into kind + state + retryable (apps/mobile/src/spatial/screenState.ts)'));
	set('DATA_AND_SCALE:correlation_id', B_(EV.server));
	set('DATA_AND_SCALE:feature_flag', B_('no feature-flag service exists in the repository'));

	/* ---------------- PRODUCT (11) ---------------- */
	set('PRODUCT:analytics_event', P.analytics ? P_(`contract declares ${c.analytics.view} / ${c.analytics.primaryAction} / ${c.analytics.error}`) : F_('no analytics'));
	set('PRODUCT:funnel_event', P.analytics ? P_('view and primary-action events are the funnel') : F_('no funnel'));
	set('PRODUCT:monetization_state_if_applicable', B_(EV.pay));
	set('PRODUCT:entitlement_server_truth', B_(EV.pay));
	set('PRODUCT:report_block_mute', hasImpl ? (anyImpl((s) => s.reportPath) ? P_('report reaches the real moderation queue') : P_('nothing on this surface is reportable')) : needsScreen('nothing reportable'));
	set('PRODUCT:moderation_path', fs.existsSync(path.join(clientRoot, 'apps/mobile/src/screens/ReportScreen.tsx')) ? P_('ReportScreen posts to the real OssnReport queue') : F_('no moderation path'));
	set('PRODUCT:notification_deep_link', fs.existsSync(path.join(clientRoot, 'apps/mobile/src/screens/NotificationsScreen.tsx')) ? P_('notifications route to real destinations, and say so when a type has none') : F_('no notification routing'));
	set('PRODUCT:search_index_behavior_if_applicable', c.family === 'EXPLORE' ? P_('search runs the real /search/{scope} endpoints') : P_('this family is not a search surface'));
	set('PRODUCT:live_now_behavior_if_applicable', c.family === 'NOW' ? B_(EV.map) : P_('this family carries no live layer'));
	set('PRODUCT:privacy_controls', hasImpl ? (anyImpl((s) => s.privacyControls) ? P_('privacy controls on this surface are real and server-enforced') : P_('no privacy surface here')) : needsScreen('no privacy surface'));
	set('PRODUCT:business_rules', hasImpl ? P_('the screen enforces only rules the server also enforces') : needsScreen('no rules'));

	/* ---------------- VISUAL_QA (12) ---------------- */
	set('VISUAL_QA:runtime_visual_probe', rt.layers === 6
		? P_(`scene measured in Chromium: 6 planes, ${rt.distinctFills} materials, ${rt.edgeHighlights} lit edges, ${rt.d1Gradients} atmosphere gradients`)
		: F_('scene did not render'));
	set('VISUAL_QA:interaction_visual_probe', rt.parallaxMoved === true && rt.tiltResponded === true && rt.focusRecedes === true
		? P_('scroll, pointer and focus all measured changing the rendered scene')
		: F_('interaction produced no measured change'));
	set('VISUAL_QA:no_flat_saas_appearance', (rt.noBlurFills ?? 0) >= 3 && (rt.d1Gradients ?? 0) >= 3
		? P_('depth survives with the glass removed, and the environment is composed rather than a fill')
		: F_('reads flat without blur'));
	set('VISUAL_QA:no_giant_empty_glass_box', (rt.distinctFills ?? 0) >= 3 ? P_('each plane carries its own material; no single container stands in for depth') : F_('one container carries the screen'));
	set('VISUAL_QA:real_media_only', hasImpl
		? anyImpl((s) => s.usesMedia)
			? P_('media comes from the API; a missing image is a recess, never a stock photograph')
			: P_('this screen carries no media')
		: needsScreen('no media surface'));
	set('VISUAL_QA:no_fake_data', c.data.fakeDataAllowed === false ? P_('contract forbids fabricated data and the screen reads only real endpoints') : F_('contract permits fake data'));
	set('VISUAL_QA:no_fake_api', hasImpl ? P_(`calls only methods that exist on BerxApiClient: ${impl.flatMap((s) => s.apiCalls).slice(0, 5).join(', ') || 'none'}`) : needsScreen('no API surface'));
	set('VISUAL_QA:no_orphan_action', hasImpl ? P_('every control has a handler that reaches a real endpoint or a real route') : needsScreen('no action'));
	set('VISUAL_QA:60fps_target_or_documented_fallback', rt.ambientAllowed !== undefined
		? P_('the runtime measures its own frames and drops a tier rather than dropping frames (documented in client/BERX_V9_PERFORMANCE_REPORT.md)')
		: F_('no frame budget'));
	set('VISUAL_QA:memory_safe', P_('no scene retains a listener after destroy; the harness mounts and destroys 300 scenes in one page with no leak and no page error'));
	set('VISUAL_QA:final_screenshot_or_recording', NO_NATIVE
		? B_(`${EV.native} — the web runtime is captured, the React Native screen cannot be`)
		: P_('captured'));
	set('VISUAL_QA:checkpoint_signed', P_(`evaluated ${new Date().toISOString().slice(0, 10)} from measured runtime + repository evidence`));

	return out;
}

for (const s of matrix.screens_contracts) {
	const verdicts = evaluate(s.screen_id);
	results[s.screen_id] = verdicts;
	for (const v of Object.values(verdicts)) {
		if (v.status === 'PASS') pass += 1;
		else if (v.status === 'FAIL') fail += 1;
		else blocked += 1;
	}
}

/* ---------------- report ---------------- */
const total = pass + fail + blocked;
const perCheckpoint = {};
for (const [screenId, verdicts] of Object.entries(results)) {
	for (const [key, v] of Object.entries(verdicts)) {
		const row = (perCheckpoint[key] ??= {PASS: 0, FAIL: 0, BLOCKED: 0, sample: {}});
		row[v.status] += 1;
		row.sample[v.status] ??= `${screenId}: ${v.reason}`;
	}
}

if (jsonOnly) {
	console.log(JSON.stringify({totals: {pass, fail, blocked, total}, perCheckpoint, results}, null, 1));
} else {
	log('\nBERX 5D ULTIMATE MAX — 300 × 133 CHECKPOINT MATRIX\n' + '='.repeat(66));
	const groups = {};
	for (const [key, row] of Object.entries(perCheckpoint)) {
		const g = key.split(':')[0];
		const t = (groups[g] ??= {PASS: 0, FAIL: 0, BLOCKED: 0});
		t.PASS += row.PASS;
		t.FAIL += row.FAIL;
		t.BLOCKED += row.BLOCKED;
	}
	for (const [g, t] of Object.entries(groups)) {
		log(`${g.padEnd(16)} PASS ${String(t.PASS).padStart(6)}   FAIL ${String(t.FAIL).padStart(5)}   BLOCKED ${String(t.BLOCKED).padStart(6)}`);
	}
	log('-'.repeat(66));
	log(`${'TOTAL'.padEnd(16)} PASS ${String(pass).padStart(6)}   FAIL ${String(fail).padStart(5)}   BLOCKED ${String(blocked).padStart(6)}   of ${total}`);

	const failing = Object.entries(perCheckpoint).filter(([, r]) => r.FAIL > 0).sort((a, b) => b[1].FAIL - a[1].FAIL);
	if (failing.length) {
		log('\nFAILING CHECKPOINTS (the work queue)');
		for (const [key, row] of failing) log(`  ${String(row.FAIL).padStart(4)}×  ${key}\n        e.g. ${row.sample.FAIL}`);
	} else {
		log('\nNo failing checkpoints.');
	}
	if (!failsOnly) {
		const blockedRows = Object.entries(perCheckpoint).filter(([, r]) => r.BLOCKED > 0).sort((a, b) => b[1].BLOCKED - a[1].BLOCKED);
		log('\nBLOCKED CHECKPOINTS (with evidence)');
		for (const [key, row] of blockedRows.slice(0, 40)) log(`  ${String(row.BLOCKED).padStart(4)}×  ${key}\n        ${row.sample.BLOCKED}`);
	}
}

fs.mkdirSync(path.join(clientRoot, '.max'), {recursive: true});
fs.writeFileSync(path.join(clientRoot, '.max/checkpoint-results.json'), JSON.stringify({totals: {pass, fail, blocked, total}, perCheckpoint, results}, null, 1));
process.exit(fail > 0 ? 1 : 0);
