/**
 * Node-side evidence for the MAX checkpoint matrix.
 *
 * Emits what the archive's contracts actually resolve to, from the
 * same registry the app runs on — not from a copy written for the
 * report.
 */
import {BERX_V9_CONTRACTS, findContract, getSceneDataBinding} from '@berx/scenes';
import {resolveScene, berxAtmosphereForFamily, BERX_COLOR_WORLDS, type BerxDeviceSignals} from '@berx/spatial';

/* a capable desktop browser: the reference conditions the contract
   facts are read under, stated rather than assumed */
const device: BerxDeviceSignals = {
	platform: 'web',
	supportsBackdropBlur: true,
	prefersReducedMotion: false,
	deviceMemoryGb: 8,
	logicalCores: 8,
	pixelRatio: 2,
	saveData: false,
};

const out = BERX_V9_CONTRACTS.map((c) => {
	const contract = findContract(c.screenId)!;
	const scene = resolveScene(contract, {device, viewportWidth: 1200, viewportHeight: 900});
	/* findContract resolves by id, by route path and by route name —
	   the three ways a route can arrive at a scene */
	const byPath = findContract(contract.route.path);
	const byName = findContract(contract.route.name);
	return {
		screenId: c.screenId,
		title: contract.title,
		family: contract.family,
		routeName: contract.route.name,
		routePath: contract.route.path,
		routeParams: contract.route.params,
		material: contract.scene.material,
		lightRecipe: contract.scene.lightRecipe,
		layerOrder: contract.scene.layerOrder,
		camera: contract.scene.camera,
		layout: contract.layout,
		components: contract.components,
		states: contract.states,
		interaction: contract.interaction,
		motion: contract.motion,
		data: contract.data,
		analytics: contract.analytics,
		accessibility: contract.accessibility,
		dataBinding: getSceneDataBinding(c.screenId) ?? null,
		resolvesById: findContract(c.screenId) !== undefined,
		resolvesByPath: byPath?.screenId === c.screenId,
		resolvesByName: byName?.screenId === c.screenId,
		atmosphereKind: berxAtmosphereForFamily(contract.family),
		depthKeys: Object.keys(scene.layers),
		accent: scene.accent,
		background: scene.background,
	};
});

process.stdout.write(JSON.stringify({colorWorlds: Object.keys(BERX_COLOR_WORLDS), screens: out}));
