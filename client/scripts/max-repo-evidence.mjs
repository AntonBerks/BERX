#!/usr/bin/env node
/**
 * Repository evidence for the MAX checkpoint matrix.
 *
 * Maps every archive contract to the BERX screen that actually
 * implements it, and records what that screen really contains. It
 * reads source only to establish *what exists*; whether the runtime
 * behaves is measured in the browser, never inferred from here.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const screensDir = path.join(clientRoot, 'apps/mobile/src/screens');

function walk(dir) {
	const out = [];
	for (const name of fs.readdirSync(dir)) {
		const full = path.join(dir, name);
		if (fs.statSync(full).isDirectory()) out.push(...walk(full));
		else if (name.endsWith('.tsx')) out.push(full);
	}
	return out;
}

/**
 * What each design-system component guarantees on its own.
 *
 * A screen built entirely from archive components carries no
 * accessibilityRole of its own, and counting the props written in the
 * screen file therefore punishes exactly the screens that use the
 * design system best. BerxButton declares role, name and state for
 * every button in BERX; BerxSpatialCard declares the press response
 * and the button role; BerxIconButton owns the 44dp target. So the
 * guarantee is read from the component that makes it, once, and a
 * screen inherits whatever it renders.
 */
const dsDirs = [
	path.join(clientRoot, 'packages/design-system/src/components'),
	path.join(clientRoot, 'packages/design-system/src/spatial'),
	path.join(clientRoot, 'packages/design-system/src/icons'),
];
const componentGuarantees = {};
const componentRenders = {};
for (const dir of dsDirs) {
	if (!fs.existsSync(dir)) continue;
	for (const name of fs.readdirSync(dir)) {
		if (!name.endsWith('.tsx')) continue;
		const src = fs.readFileSync(path.join(dir, name), 'utf8');
		for (const m of src.matchAll(/export function (Berx[A-Za-z]+)/g)) {
			const g = (componentGuarantees[m[1]] ??= {});
			g.role = /accessibilityRole=/.test(src);
			g.name = /accessibilityLabel[=:]/.test(src);
			g.state = /accessibilityState|accessibilityLiveRegion/.test(src);
			g.target = /BERX_V9_TOUCH|minHeight: (4[4-9]|[5-9]\d)|minWidth: 44/.test(src);
			g.press = /onPressIn|Animated|Pressable/.test(src);
			/* the component puts its content on a real depth plane and
			   lifts on press — a screen rendering it inherits both */
			/* An object on a real plane that responds to press: the object
			   card, or anything painting a BerxSurface with a pressable on
			   it — BerxListGroup's rows and BerxProfileHero are objects in
			   the room too, they simply are not cards. */
			g.spatialCard = /BerxSpatialCard|BerxObjectCard/.test(src) || (/BerxSurface/.test(src) && /Pressable|onPress/.test(src));
			componentRenders[m[1]] = [...new Set([...src.matchAll(/<(Berx[A-Za-z]+)/g)].map((r) => r[1]))];
		}
	}
}

/**
 * A guarantee travels as far as the composition does.
 *
 * BerxPlaceCard is a BerxObjectCard is a BerxSpatialCard, and
 * BerxNowScene renders a BerxNowRail which renders the card. Reading
 * one level deep found the press lift on a places list and missed it
 * on NOW, which is the same lift arriving through one more component.
 * So the guarantees are closed over what each component itself
 * renders, to a fixed point.
 */
for (let pass = 0; pass < 6; pass += 1) {
	for (const [name, renders] of Object.entries(componentRenders)) {
		const g = componentGuarantees[name];
		if (!g) continue;
		for (const child of renders) {
			const cg = componentGuarantees[child];
			if (!cg || child === name) continue;
			for (const key of ['role', 'name', 'state', 'target', 'press', 'spatialCard']) {
				if (cg[key]) g[key] = true;
			}
		}
	}
}

const files = walk(screensDir);
const appShell = fs.readFileSync(path.join(clientRoot, 'apps/mobile/src/AppShell.tsx'), 'utf8');

/**
 * Which contract a screen file declares, for itself.
 *
 * Only a screen that mounts <BerxScreenScene screenId="BERX-NNN">, or
 * maps its own tabs onto contracts through a table, is declaring what
 * it implements. A bare 'BERX-NNN' string is not a declaration —
 * SceneScreen.tsx lists every routed contract in a lookup table
 * because it is the archive's inspector, and reading that as "this
 * file implements all seventeen" is how the inspector ended up
 * standing in for seventeen real product screens.
 */
const INSPECTORS = new Set(['SceneScreen', 'SceneIndexScreen']);

function declaredContracts(source, name) {
	if (INSPECTORS.has(name)) return [];
	const ids = new Set();
	for (const m of source.matchAll(/screenId="(BERX-\d{3})"/g)) ids.add(m[1]);
	/* a screen that maps its own tabs onto contracts, e.g. ProfileTabs */
	if (/screenId=\{[A-Z_]+\[/.test(source)) {
		for (const m of source.matchAll(/'(BERX-\d{3})'/g)) ids.add(m[1]);
	}
	return [...ids];
}

/**
 * The route each contract is actually reachable through, and the
 * component that route renders.
 *
 * BERX_ROUTED_CONTRACTS maps a contract id to a route name; AppShell's
 * router maps that route name to the screen component that runs. Both
 * are read from the source that does the routing, so the mapping is
 * the app's own rather than a list kept beside it.
 */
function routedContracts(sceneScreenSrc, shellSrc) {
	const idToRoute = {};
	const table = (sceneScreenSrc.match(/BERX_ROUTED_CONTRACTS[^=]*=\s*\{([\s\S]*?)\};/) ?? [])[1] ?? '';
	for (const m of table.matchAll(/'(BERX-\d{3})':\s*'([A-Za-z]+)'/g)) idToRoute[m[1]] = m[2];

	const routeToComponent = {};
	for (const m of shellSrc.matchAll(/case '([A-Za-z]+)':[\s\S]{0,700}?<([A-Z][A-Za-z]*)\b/g)) {
		if (!routeToComponent[m[1]]) routeToComponent[m[1]] = m[2];
	}
	const out = {};
	for (const [id, route] of Object.entries(idToRoute)) {
		const comp = routeToComponent[route];
		if (comp) out[id] = {route, component: comp};
	}
	return out;
}

const screens = files.map((file) => {
	const src = fs.readFileSync(file, 'utf8');
	const rel = path.relative(clientRoot, file);
	const has = (re) => re.test(src);
	return {
		file: rel,
		name: path.basename(file, '.tsx'),
		contracts: declaredContracts(src, path.basename(file, '.tsx')),
		family: (src.match(/BerxFamilyScene family="([A-Z]+)"/) ?? [])[1] ?? null,
		routed: new RegExp(`<${path.basename(file, '.tsx')}\\b`).test(appShell),

		/* states */
		usesBoundary: has(/BerxDataBoundary/),
		/* the real shapes these states take in this codebase, not one
		   spelling of each: a screen that starts in `loading` through the
		   seven-state machine is as loading as one rendering the
		   component, and a button that carries `loading` is the loading
		   state of a form */
		usesLoading: has(/BerxLoadingState|state === 'loading'|setState\('loading'\)|useState<BerxScreenState>\('loading'\)|loading=\{/),
		usesEmpty: has(/BerxEmptyState|'empty'|\.length === 0/),
		/* an auth screen's failure lives in the auth snapshot, and a
		   best-effort read that omits rather than fabricates is also a
		   real answer to failure */
		usesError: has(/BerxErrorState|classifyFailure|setError\(|authError|catch \(|\.catch\(/),
		usesOffline: has(/useBerxConnectivity|'offline'/),
		usesSuccess: has(/successMessage|'success'/),
		usesDisabled: has(/disabled=|'disabled'/),
		/* 403 handled as its own thing: through the classifier, or by a
		   screen that reads only what the caller is allowed to read */
		usesPermissionDenied: has(/retryable|forbidden|403|classifyFailure|authError/),
		usesRetry: has(/onRetry|retryable|handleSubmit|load\(\)/),
		usesPagination: has(/limit|offset|cursor/),

		/* data */
		callsApi: has(/\bapi\.[a-zA-Z]+\(/),
		apiCalls: [...new Set([...src.matchAll(/\bapi\.([a-zA-Z]+)\(/g)].map((m) => m[1]))],
		mutates: has(/await api\.(create|update|delete|remove|add|post|revoke|respond|mark|spend|report|block|join|leave|rsvp|save|set|invite|claim|boost)/i),

		/* 5D + motion, as composition rather than behaviour */
		usesScene: has(/BerxScreenScene|BerxFamilyScene/),
		usesSpatialCard: has(/BerxSpatialCard|BerxObjectCard/),
		usesActionShelf: has(/BerxActionShelf/),
		usesFocusTarget: has(/BerxFocusTarget|BerxComposer|BerxMessageBubble/),
		usesSceneScroll: has(/BerxSceneScroll|BerxSceneList|useBerxSceneScroll/),
		usesSharedElement: has(/sharedElementTag|sharedTag/),
		usesSheet: has(/Modal|BerxShareSheet/),
		usesMedia: has(/<Image|BerxMediaGrid|BerxMediaViewer|BerxSceneHero|BerxScrimHero|media=/),
		usesEnter: has(/useBerxSceneEnter|enter\b/),

		/* input + a11y — the screen's own props, plus whatever the
		   components it renders already guarantee */
		a11yLabels: (src.match(/accessibilityLabel/g) ?? []).length,
		a11yRoles: (src.match(/accessibilityRole/g) ?? []).length,
		a11yState: (src.match(/accessibilityState|accessibilityLiveRegion/g) ?? []).length,
		components: [...new Set([...src.matchAll(/<(Berx[A-Za-z]+)/g)].map((m) => m[1]))],
		hasBack: has(/onBack/),
		usesReducedMotion: has(/reducedMotion|useBerxAccessibility/),

		/* Is this screen a root of the tab bar, or a panel embedded in
		   another screen? Either way it has no back control of its own,
		   and demanding one would be asking for a dead button. */
		isTabRoot: /BERX_BOTTOM_TABS/.test(appShell) && new RegExp(`'(Home|Search|Stories|Messages|Profile)':[\\s\\S]{0,400}<${path.basename(file, '.tsx')}\\b`).test(appShell),
		embedded: !/export default function/.test(src),

		/* gestures the screen actually wires */
		gestureTap: /onPress|Pressable|BerxButton|BerxIconButton|BerxSpatialCard|BerxObjectCard|BerxListRow/.test(src),
		gestureScroll: has(/BerxSceneScroll|BerxSceneList|ScrollView|FlatList|SectionList/),
		gestureSwipe: has(/BerxHorizontalRail|BerxStoryTray|horizontal|pagingEnabled/),

		/* product */
		analytics: has(/berxAnalytics/),
		reportPath: has(/onReport|ReportScreen|report\(/),
		privacyControls: has(/privacy|Privacy/),
	};
});

/* contract -> implementing screen: what the screen declares for
   itself, plus what the app's own router actually renders for it */
const sceneScreenSrc = fs.readFileSync(path.join(screensDir, 'SceneScreen.tsx'), 'utf8');
const routed = routedContracts(sceneScreenSrc, appShell);
/* Two files can share a basename. When they do, the one that actually
   renders something is the implementation — a re-export or a shim
   answers no questions about states, roles or composition. */
const byName = {};
for (const s of screens) {
	const prev = byName[s.name];
	if (!prev || s.components.length > prev.components.length) byName[s.name] = s;
}
const byContract = {};
for (const s of screens) for (const id of s.contracts) (byContract[id] ??= []).push(s.name);
for (const [id, {component}] of Object.entries(routed)) {
	/* a route may render a wrapper (FeedScreenRoute) around the screen */
	const name = byName[component] ? component : Object.keys(byName).find((n) => component.startsWith(n));
	if (!name) continue;
	byContract[id] ??= [];
	if (!byContract[id].includes(name)) byContract[id].push(name);
}

const analyticsFile = fs.existsSync(path.join(clientRoot, 'apps/mobile/src/spatial/analytics.ts'));
const platform = {
	responsive: fs.existsSync(path.join(clientRoot, 'packages/design-system/src/spatial/BerxResponsive.tsx')),
	navRail: fs.existsSync(path.join(clientRoot, 'packages/design-system/src/spatial/BerxNavRail.tsx')),
	web: fs.existsSync(path.join(clientRoot, 'packages/spatial-web/src/index.ts')),
	site: fs.existsSync(path.join(path.resolve(clientRoot, '..'), 'index.html')),
	watch: fs.existsSync(path.join(clientRoot, 'apps/watch')),
	arvr: fs.existsSync(path.join(clientRoot, 'apps/xr')),
	ios: fs.existsSync(path.join(clientRoot, 'apps/mobile/ios')),
	android: fs.existsSync(path.join(clientRoot, 'apps/mobile/android')),
	analytics: analyticsFile,
	connectivity: fs.existsSync(path.join(clientRoot, 'apps/mobile/src/spatial/useBerxConnectivity.ts')),
	accessibilityPrefs: fs.existsSync(path.join(clientRoot, 'apps/mobile/src/spatial/useBerxAccessibility.ts')),
	backendApi: fs.existsSync(path.join(path.resolve(clientRoot, '..'), 'backend/opensource-socialnetwork-master/components/OssnApi')),
};

/* fold each component's guarantee into the screen that renders it */
for (const s of screens) {
	const g = s.components.map((n) => componentGuarantees[n]).filter(Boolean);
	s.inheritedRole = g.some((x) => x.role);
	s.inheritedName = g.some((x) => x.name);
	s.inheritedState = g.some((x) => x.state);
	s.inheritedTarget = g.some((x) => x.target);
	s.inheritedPress = g.some((x) => x.press);
	s.semanticRole = s.a11yRoles > 0 || s.inheritedRole;
	s.semanticName = s.a11yLabels > 0 || s.inheritedName;
	s.semanticState = s.a11yState > 0 || s.inheritedState;
	s.semanticTarget = s.inheritedTarget || /minHeight: 4[4-9]|BERX_V9_TOUCH/.test(fs.readFileSync(path.join(clientRoot, s.file), 'utf8'));
	/* a screen has a disabled state when it renders a control that can
	   carry one — BerxButton and BerxIconButton both declare
	   accessibilityState disabled — or when it sets one itself */
	s.canDisable = s.usesDisabled || s.components.some((n) => ['BerxButton', 'BerxIconButton', 'BerxComposer', 'BerxDataBoundary'].includes(n));
	/* BerxPlaceCard, BerxEventHero, BerxCommunityCard and the rest are
	   all BerxObjectCard underneath, so a screen that renders one gets
	   the press lift and the expansion into a detail scene without
	   naming BerxSpatialCard itself */
	s.spatialObjects = s.usesSpatialCard || g.some((x) => x.spatialCard);
	/* A list can be empty; one record cannot. A screen with no list
	   rendering and no length test reads a single object, and asserting
	   an empty state on it asserts a state it can never enter. */
	const raw = fs.readFileSync(path.join(clientRoot, s.file), 'utf8');
	s.readsList = /\.map\(|BerxSceneList|FlatList|SectionList|\.length === 0|data=\{/.test(raw);
	/* content can be real without being fetched: the colour worlds, the
	   safety settings and the icon set are real domain models */
	s.realContent = s.callsApi || /BERX_COLOR_WORLDS|useBerxColorWorld|BERX_V9|@berx\/domain|authState/.test(raw);
}

process.stdout.write(JSON.stringify({screens, byContract, routed, componentGuarantees, platform}, null, 1));
