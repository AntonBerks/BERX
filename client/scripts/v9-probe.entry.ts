/**
 * Entry point for the v9 runtime probe (scripts/verify-v9-contracts.mjs).
 *
 * It exercises the real resolvers on the real 300 contracts across
 * real device profiles — no mocks of BERX's own code — and returns a
 * machine-readable report. This is what makes "300/300 resolve" a
 * measurement rather than a claim.
 */
/** CIE lightness — the space a brightness difference is actually visible in. */
function lStar(color: string): number {
	const y = relativeLuminance(color);
	return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : y * (24389 / 27);
}

import {
	BERX_ATMOSPHERE_KINDS,
	BERX_DEPTH_KEYS,
	BERX_FAMILIES,
	BERX_MIN_TEXT_CONTRAST,
	assertAtmosphereDepth,
	assertContrastHierarchy,
	assertFocusDepth,
	flatten,
	mix,
	rgba,
	resolveFocus,
	relativeLuminance,
	resolveScene,
	berxAtmosphereForFamily,
	resolveAtmosphere,
	contrastRatio,
	perspectiveScale,
	resolveMaterial,
	resolveMotion,
	resolvePerformanceBudget,
	tiltFromPointer,
	BERX_MATERIALS,
	BERX_V9_COLOR,
	BERX_MAX_TILT_DEG,
	type BerxDeviceSignals,
	type BerxMaterialName,
	BERX_SCREEN_STATES,
} from '@berx/spatial';
import {
	BERX_COMPONENT_BINDINGS,
	BERX_V9_CONTRACTS,
	BERX_V9_CONTRACT_COUNT,
	BERX_V9_REQUESTED_COMPONENTS,
	BERX_BOUND_SCENE_IDS,
	planTransition,
	resolveScreen,
	type BerxResolvedScreen,
} from '@berx/scenes';

export interface ProbeProfile {
	name: string;
	device: BerxDeviceSignals;
	width: number;
	height: number;
	highContrast?: boolean;
}

export const PROFILES: ProbeProfile[] = [
	{
		name: 'ios-phone-high',
		device: {platform: 'ios', pixelRatio: 3, supportsBackdropBlur: false},
		width: 393,
		height: 852,
	},
	{
		name: 'android-phone-low',
		device: {platform: 'android', deviceMemoryGb: 2, logicalCores: 4, pixelRatio: 2, supportsBackdropBlur: false},
		width: 360,
		height: 800,
	},
	{
		name: 'web-desktop-high',
		device: {platform: 'desktop', deviceMemoryGb: 8, logicalCores: 12, pixelRatio: 2, supportsBackdropBlur: true},
		width: 1440,
		height: 900,
	},
	{
		name: 'web-tablet',
		device: {platform: 'tablet', deviceMemoryGb: 4, logicalCores: 8, pixelRatio: 2, supportsBackdropBlur: true},
		width: 1024,
		height: 768,
	},
	{
		name: 'web-reduced-motion',
		device: {
			platform: 'web',
			deviceMemoryGb: 8,
			logicalCores: 8,
			pixelRatio: 2,
			supportsBackdropBlur: true,
			prefersReducedMotion: true,
		},
		width: 1280,
		height: 800,
	},
	{
		/**
		 * The one platform whose depth is not a metaphor. BERX resolves
		 * scenes for it; nothing here renders them, and the report says
		 * so rather than implying a headset build exists.
		 */
		name: 'arvr',
		device: {platform: 'arvr', supportsBackdropBlur: false},
		width: 1440,
		height: 1600,
	},
	{
		name: 'watch',
		device: {platform: 'watch', supportsBackdropBlur: false},
		width: 198,
		height: 242,
	},
	{
		name: 'web-high-contrast',
		device: {platform: 'desktop', deviceMemoryGb: 8, logicalCores: 8, supportsBackdropBlur: true},
		width: 1440,
		height: 900,
		highContrast: true,
	},
];

export interface ProbeFinding {
	severity: 'error' | 'warn';
	scope: string;
	message: string;
}

export interface ProbeReport {
	contractCount: number;
	resolvedCount: number;
	byRouteCount: number;
	byRouteNameCount: number;
	families: Record<string, number>;
	profiles: Record<
		string,
		{
			resolved: number;
			tier: string;
			maxBlurLayers: number;
			allow3D: boolean;
			allowParallax: boolean;
			reducedMotionScenes: number;
			opaqueSurfaceScenes: number;
			minContentContrast: number;
			blurLayersMax: number;
			navShells: Record<string, number>;
		}
	>;
	dataModes: Record<string, number>;
	componentUsage: Record<string, number>;
	blockedComponents: string[];
	unresolvedComponents: string[];
	boundScenes: number;
	materials: Record<string, {blurPx: number; fill: string; contrast: number; opaqueFallback: boolean; glowRadius: number}>;
	/** Depth read as lightness: inversions and the smallest step a person must see. */
	depthOrder: {inversions: number; smallestContentStepLStar: number};
	focus: {
		fieldsResolved: number;
		inversions: number;
		smallestEmergenceLStar: number;
		recessionSpread: number;
		problems: string[];
	};
	/**
	 * The environment each atmosphere kind resolves to, measured
	 * unblurred — the condition the visual-acceptance rule cares
	 * about. `signature` is what makes "no single generic background"
	 * checkable: two kinds that resolve to the same environment would
	 * collide here.
	 */
	atmospheres: Record<
		string,
		{
			families: string[];
			skyStops: number;
			pools: number;
			poolDistances: number;
			hasGround: boolean;
			vignette: number;
			mediaRole: string;
			signature: string;
			flatnessProblems: string[];
		}
	>;
	transitionSample: unknown;
	findings: ProbeFinding[];
}

export function runProbe(): ProbeReport {
	const findings: ProbeFinding[] = [];
	const families: Record<string, number> = {};
	for (const c of BERX_V9_CONTRACTS) families[c.family] = (families[c.family] ?? 0) + 1;

	/* --- every material must be visibly distinct, not a renamed token --- */
	const materials: ProbeReport['materials'] = {};
	const signatures = new Map<string, string>();
	for (const name of Object.keys(BERX_MATERIALS) as BerxMaterialName[]) {
		const s = resolveMaterial({material: name, blurBudgetAvailable: true});
		materials[name] = {
			blurPx: s.blurPx,
			fill: s.backgroundColor,
			contrast: s.textContrast,
			opaqueFallback: s.opaqueFallback,
			glowRadius: s.glowRadius,
		};
		const sig = `${s.backgroundColor}|${s.blurPx}|${s.borderColor}|${s.edgeHighlightColor}|${s.rimWidth}|${s.glowRadius}`;
		const clash = signatures.get(sig);
		if (clash) {
			findings.push({
				severity: 'error',
				scope: `material:${name}`,
				message: `renders identically to ${clash} — a material that is only a renamed token is exactly what 5D forbids`,
			});
		}
		signatures.set(sig, name);
		if (s.textContrast < BERX_MIN_TEXT_CONTRAST) {
			findings.push({
				severity: 'error',
				scope: `material:${name}`,
				message: `primary text contrast ${s.textContrast}:1 is below AA ${BERX_MIN_TEXT_CONTRAST}:1 and the opaque fallback did not engage`,
			});
		}
	}

	/* --- depth must actually separate, on both platforms --- */
	const scales = BERX_DEPTH_KEYS.map((_, i) => perspectiveScale(-((5 - i) * 60), 1200));
	for (let i = 1; i < scales.length; i += 1) {
		if (!(scales[i] > scales[i - 1])) {
			findings.push({
				severity: 'error',
				scope: 'depth',
				message: `depth ${i} does not project larger than depth ${i - 1} (${scales[i]} vs ${scales[i - 1]})`,
			});
		}
	}

	/* --- tilt ceiling is absolute --- */
	const maxTilt = tiltFromPointer(5, -5, {
		perspectivePx: 1200,
		fovDeg: 42,
		originX: 0,
		originY: 0,
		depthUnitPx: 60,
		maxTiltDeg: BERX_MAX_TILT_DEG,
		perspectiveEnabled: true,
	});
	if (Math.abs(maxTilt.rotateYDeg) > BERX_MAX_TILT_DEG || Math.abs(maxTilt.rotateXDeg) > BERX_MAX_TILT_DEG) {
		findings.push({severity: 'error', scope: 'camera', message: 'pointer tilt exceeded the ±2.5° ceiling'});
	}

	/* --- reduced motion must remove travel, not shrink it --- */
	for (const preset of ['spatialEnter', 'appear', 'focus', 'ambient'] as const) {
		const m = resolveMotion({preset, reducedMotion: true});
		if (m.from?.translateZ !== undefined || m.to?.translateZ !== undefined || m.delta?.translateZ !== undefined) {
			findings.push({severity: 'error', scope: `motion:${preset}`, message: 'reduced motion still carries z travel'});
		}
		if (m.durationMs > 220) {
			findings.push({
				severity: 'error',
				scope: `motion:${preset}`,
				message: `reduced-motion duration ${m.durationMs}ms exceeds the 220ms ceiling`,
			});
		}
	}
	const ambientReduced = resolveMotion({preset: 'ambient', reducedMotion: true});
	if (ambientReduced.loop) {
		findings.push({severity: 'error', scope: 'motion:ambient', message: 'ambient loop survived reduced motion'});
	}

	/* --- blur budget is a ceiling on every profile --- */
	for (const p of PROFILES) {
		const budget = resolvePerformanceBudget(p.device);
		const mobile = p.device.platform === 'ios' || p.device.platform === 'android' || p.device.platform === 'web';
		if (mobile && budget.maxBlurLayers > 3) {
			findings.push({
				severity: 'error',
				scope: `perf:${p.name}`,
				message: `mobile blur budget ${budget.maxBlurLayers} exceeds the contract maximum of 3`,
			});
		}
	}

	/* --- resolve every contract on every profile --- */
	const profiles: ProbeReport['profiles'] = {};
	const componentUsage: Record<string, number> = {};
	const dataModes: Record<string, number> = {};
	let resolvedCount = 0;
	let byRouteCount = 0;
	let byRouteNameCount = 0;
	const firstProfile = PROFILES[0];
	let sampleA: BerxResolvedScreen | undefined;
	let sampleB: BerxResolvedScreen | undefined;

	for (const p of PROFILES) {
		let resolved = 0;
		let reducedMotionScenes = 0;
		let opaqueSurfaceScenes = 0;
		let minContentContrast = Infinity;
		let blurLayersMax = 0;
		const navShells: Record<string, number> = {};
		let tier = '';
		let maxBlurLayers = 0;
		let allow3D = false;
		let allowParallax = false;

		for (const c of BERX_V9_CONTRACTS) {
			const screen = resolveScreen({
				screen: c.screenId,
				device: p.device,
				viewportWidth: p.width,
				viewportHeight: p.height,
				highContrast: p.highContrast,
			});
			if (!screen) {
				findings.push({severity: 'error', scope: `resolve:${p.name}`, message: `${c.screenId} did not resolve`});
				continue;
			}
			resolved += 1;
			tier = screen.scene.budget.tier;
			maxBlurLayers = screen.scene.budget.maxBlurLayers;
			allow3D = screen.scene.budget.allow3D;
			allowParallax = screen.scene.budget.allowParallax;
			navShells[screen.navShell] = (navShells[screen.navShell] ?? 0) + 1;
			if (screen.scene.reducedMotion) reducedMotionScenes += 1;
			if (screen.accessibility.opaqueSurfaceMode) opaqueSurfaceScenes += 1;

			const content = screen.scene.layers[screen.scene.focalDepth];
			minContentContrast = Math.min(minContentContrast, content.surface.textContrast);
			if (content.surface.textContrast < BERX_MIN_TEXT_CONTRAST) {
				findings.push({
					severity: 'error',
					scope: `a11y:${p.name}:${c.screenId}`,
					message: `content layer contrast ${content.surface.textContrast}:1 below AA`,
				});
			}

			const blurred = BERX_DEPTH_KEYS.filter((d) => screen.scene.layers[d].blurred).length;
			blurLayersMax = Math.max(blurLayersMax, blurred);
			if (blurred > screen.scene.budget.maxBlurLayers) {
				findings.push({
					severity: 'error',
					scope: `perf:${p.name}:${c.screenId}`,
					message: `${blurred} blurred layers exceeds budget ${screen.scene.budget.maxBlurLayers}`,
				});
			}

			for (const v of assertContrastHierarchy(screen.scene)) {
				findings.push({severity: 'error', scope: `scene:${p.name}:${c.screenId}`, message: v});
			}

			if (screen.scene.reducedMotion && screen.scene.motion.ambient.loop) {
				findings.push({
					severity: 'error',
					scope: `motion:${p.name}:${c.screenId}`,
					message: 'ambient loop active under reduced motion',
				});
			}
			if (screen.scene.reducedMotion && screen.scene.camera.maxTiltDeg !== 0) {
				findings.push({
					severity: 'error',
					scope: `motion:${p.name}:${c.screenId}`,
					message: 'tilt not zeroed under reduced motion',
				});
			}

			if (p.name === firstProfile.name) {
				resolvedCount += 1;
				dataModes[screen.dataMode] = (dataModes[screen.dataMode] ?? 0) + 1;
				for (const comp of c.components) componentUsage[comp] = (componentUsage[comp] ?? 0) + 1;
				if (resolveScreen({screen: c.route.path, device: p.device, viewportWidth: p.width, viewportHeight: p.height})) {
					byRouteCount += 1;
				}
				if (resolveScreen({screen: c.route.name, device: p.device, viewportWidth: p.width, viewportHeight: p.height})) {
					byRouteNameCount += 1;
				}
				if (c.screenId === 'BERX-031') sampleA = screen;
				if (c.screenId === 'BERX-121') sampleB = screen;
				/* Every scene must carry the full state set unless it
				   genuinely has no data. The count is read from the set
				   itself: it was frozen at 7 here, so adding `private` and
				   `unsupported` to the model made every screen look wrong
				   while every screen was in fact correct. */
				if (screen.dataMode !== 'dataless' && screen.states.length !== BERX_SCREEN_STATES.length) {
					findings.push({
						severity: 'error',
						scope: `states:${c.screenId}`,
						message: `${screen.states.length} states declared, expected all ${BERX_SCREEN_STATES.length}`,
					});
				}
			}
		}

		profiles[p.name] = {
			resolved,
			tier,
			maxBlurLayers,
			allow3D,
			allowParallax,
			reducedMotionScenes,
			opaqueSurfaceScenes,
			minContentContrast: minContentContrast === Infinity ? 0 : minContentContrast,
			blurLayersMax,
			navShells,
		};
	}

	/* --- the planes must be visibly ordered, on every contract ---
	   Depth is only depth if you can see it. Two failures made that
	   false: a layer that lost its blur fell *behind* the layer it sits
	   in front of, and a scene whose contract names a dense material
	   got a structure plane brighter than its own content. Both are
	   measured here, on every contract and both platforms, in CIE L*
	   because that is the space a difference is visible in. */
	let planeInversions = 0;
	let smallestContentStep = Infinity;
	for (const c of BERX_V9_CONTRACTS) {
		for (const device of [
			{platform: 'ios', supportsBackdropBlur: false},
			{platform: 'desktop', supportsBackdropBlur: true},
		] as BerxDeviceSignals[]) {
			const scene = resolveScene(c, {device, viewportWidth: 430, viewportHeight: 932});
			const lightness = BERX_DEPTH_KEYS.map((d) => lStar(scene.layers[d].surface.effectiveColor));
			for (let i = 1; i < lightness.length; i += 1) {
				const step = lightness[i] - lightness[i - 1];
				if (step <= 0) planeInversions += 1;
				/* D2→D3→D4 are the planes a person reads and reaches for */
				if (i >= 3 && i <= 4) smallestContentStep = Math.min(smallestContentStep, step);
			}
		}
	}
	/* --- D5: focus, measured -------------------------------------
	   "Focus must emerge from the surrounding scene without
	   destroying the hierarchy" is two measurable claims, so both are
	   measured rather than asserted.

	   EMERGES: on the content plane, the far surround has to be
	   visibly darker than the clearing the focused object sits in.
	   That difference is read in L*, the same space the plane order
	   is read in, so a focus that only shows up as a number is caught
	   here and not in review.

	   WITHOUT DESTROYING: after every plane has receded by its own
	   amount, the plane order established by materials.ts must still
	   be strictly increasing. A uniform dim would pass that trivially
	   and communicate nothing; a graduated one can genuinely invert,
	   which is exactly why it is checked on every contract rather
	   than on one. */
	const focusShapes = [
		/* a hero, a card and an avatar: the three sizes a BERX object
		   actually comes in, and the clearing is shaped by the object.
		   Two of them are focused on the focus plane, one on the
		   control plane — the two places an object can be promoted to
		   and still sit above its own clearing. */
		{name: 'hero', plane: 'D5' as const, rect: {x: 0, y: 96, width: 430, height: 280}},
		{name: 'card', plane: 'D4' as const, rect: {x: 24, y: 420, width: 382, height: 180}},
		{name: 'avatar', plane: 'D5' as const, rect: {x: 168, y: 300, width: 94, height: 94}},
	];
	let focusFields = 0;
	let focusInversions = 0;
	let smallestEmergence = Infinity;
	let recessionSpread = 0;
	const focusProblems = new Set<string>();
	for (const c of BERX_V9_CONTRACTS) {
		for (const device of [
			{platform: 'ios', supportsBackdropBlur: false},
			{platform: 'desktop', supportsBackdropBlur: true},
		] as BerxDeviceSignals[]) {
			const scene = resolveScene(c, {device, viewportWidth: 430, viewportHeight: 932});
			for (const shape of focusShapes) {
				const field = resolveFocus({
					rect: shape.rect,
					viewportWidth: 430,
					viewportHeight: 932,
					background: scene.background,
					plane: shape.plane,
					tier: scene.budget.tier,
					blurred: scene.layers.D5.blurred,
				});
				if (!field) {
					focusProblems.add(`${c.screenId}/${shape.name}: focus resolved to nothing at full intensity`);
					continue;
				}
				focusFields += 1;
				for (const problem of assertFocusDepth(field)) {
					focusProblems.add(`${c.screenId}/${shape.name}: ${problem}`);
				}

				/* the planes as they are actually composited while focus
				   holds: each one's own colour, mixed back toward the
				   substrate by how far it has stepped away */
				const recessed = BERX_DEPTH_KEYS.map((d) =>
					mix(scene.background, scene.layers[d].surface.effectiveColor, field.recession[d]),
				);
				const lightness = recessed.map((color) => lStar(color));
				for (let i = 1; i < lightness.length; i += 1) {
					if (lightness[i] - lightness[i - 1] <= 0) focusInversions += 1;
				}
				recessionSpread = Math.max(recessionSpread, field.recession.D5 - field.recession.D0);

				/* the clearing is fully transparent over the object, so
				   the centre is the recessed content plane untouched;
				   the far edge is that plane under the full surround */
				const centre = lStar(recessed[3]);
				const edge = lStar(flatten(rgba(field.surroundColor, field.surroundAlpha), recessed[3]));
				smallestEmergence = Math.min(smallestEmergence, centre - edge);
			}
		}
	}
	if (focusInversions > 0) {
		findings.push({
			severity: 'error',
			scope: 'focus:order',
			message: `${focusInversions} plane inversions once the scene recedes behind its focus`,
		});
	}
	for (const problem of focusProblems) {
		findings.push({severity: 'error', scope: 'focus:field', message: problem});
	}

	if (planeInversions > 0) {
		findings.push({severity: 'error', scope: 'depth:order', message: `${planeInversions} plane inversions across the contract set`});
	}

	/* --- the environment, measured with blur taken away ---
	   The v9 acceptance rule is that removing blur must not flatten a
	   scene, so every kind is resolved in exactly that condition and
	   checked for the cues that survive it: separated sky stops,
	   positioned light at more than one distance, and a floor or
	   walls. A kind that reads flat fails here rather than in
	   somebody's eyes. */
	const atmospheres: ProbeReport['atmospheres'] = {};
	const atmosphereSignatures = new Map<string, string>();
	for (const kind of BERX_ATMOSPHERE_KINDS) {
		const a = resolveAtmosphere({
			kind,
			accent: BERX_V9_COLOR.accent,
			background: BERX_V9_COLOR.bg,
			hasMedia: false,
			/* fixed clock: the temporal kinds read the real hour at
			   runtime, and a probe that moved with the wall clock could
			   not be compared between runs */
			timeOfDay: 'night',
			blurred: false,
		});
		const problems = assertAtmosphereDepth(a);
		const signature = JSON.stringify({
			sky: a.sky.stops.map((st) => [st.color, st.position]),
			pools: a.pools.map((pl) => [pl.x, pl.y, pl.radius, pl.color, pl.depth]),
			ground: a.ground,
			vignette: a.vignette,
		});
		atmospheres[kind] = {
			families: BERX_FAMILIES.filter((f) => berxAtmosphereForFamily(f) === kind),
			skyStops: a.sky.stops.length,
			pools: a.pools.length,
			poolDistances: new Set(a.pools.map((pl) => pl.depth)).size,
			hasGround: a.ground !== null,
			vignette: a.vignette,
			mediaRole: a.mediaRole,
			signature,
			flatnessProblems: problems,
		};
		for (const problem of problems) {
			findings.push({severity: 'error', scope: `atmosphere:${kind}`, message: problem});
		}
		const clash = atmosphereSignatures.get(signature);
		if (clash) {
			findings.push({
				severity: 'error',
				scope: `atmosphere:${kind}`,
				message: `resolves to the same environment as ${clash} — that is one generic background wearing two names`,
			});
		}
		atmosphereSignatures.set(signature, kind);
	}
	/* every family must land on a real kind, not fall through */
	for (const family of BERX_FAMILIES) {
		const kind = berxAtmosphereForFamily(family);
		if (!BERX_ATMOSPHERE_KINDS.includes(kind)) {
			findings.push({severity: 'error', scope: `atmosphere:${family}`, message: `family maps to unknown kind "${kind}"`});
		}
	}

	const unresolvedComponents = BERX_V9_REQUESTED_COMPONENTS.filter((c) => !BERX_COMPONENT_BINDINGS[c]);
	for (const c of unresolvedComponents) {
		findings.push({severity: 'error', scope: `component:${c}`, message: 'requested by a contract but has no recorded resolution'});
	}

	/* text on the app background must itself pass AA — the ground truth for every scene */
	const groundContrast = contrastRatio(BERX_V9_COLOR.textPrimary, BERX_V9_COLOR.bg);
	if (groundContrast < BERX_MIN_TEXT_CONTRAST) {
		findings.push({severity: 'error', scope: 'a11y:ground', message: `body text on bg is ${groundContrast}:1`});
	}

	return {
		contractCount: BERX_V9_CONTRACT_COUNT,
		resolvedCount,
		byRouteCount,
		byRouteNameCount,
		families,
		profiles,
		dataModes,
		componentUsage,
		blockedComponents: Object.values(BERX_COMPONENT_BINDINGS)
			.filter((b) => b.resolution === 'BLOCKED')
			.map((b) => b.contractName),
		unresolvedComponents,
		boundScenes: BERX_BOUND_SCENE_IDS.length,
		materials,
		depthOrder: {
			inversions: planeInversions,
			smallestContentStepLStar: smallestContentStep === Infinity ? 0 : Math.round(smallestContentStep * 100) / 100,
		},
		focus: {
			fieldsResolved: focusFields,
			inversions: focusInversions,
			smallestEmergenceLStar: smallestEmergence === Infinity ? 0 : Math.round(smallestEmergence * 100) / 100,
			recessionSpread: Math.round(recessionSpread * 1000) / 1000,
			problems: [...focusProblems].slice(0, 8),
		},
		atmospheres,
		transitionSample: sampleA && sampleB ? planTransition(sampleA, sampleB, 42) : null,
		findings,
	};
}
