/**
 * What to draw this frame, decided once for every platform.
 *
 * The WebGL2 backend used to work this out for itself: which objects
 * the camera can see, which order they go in, which level of detail
 * each gets, which lights reach it, and what its surface is made of.
 * That was fine while there was one renderer. It stops being fine the
 * moment a second one exists, because then "what BERX shows" has two
 * definitions and they drift — a native build could cull differently,
 * light differently, or pick a different LOD, and nothing would catch
 * it.
 *
 * So the decision moves here, into the shared core, and a renderer's
 * job shrinks to what is genuinely per-platform: turning primitives
 * into buffers and issuing draws. Web and native consume the same
 * list, from the same frame, and can be compared pixel for pixel.
 *
 * This module decides nothing new. It is the existing behaviour, in
 * one place: the same culler, the same sort, the same budget, the same
 * LOD distance, the same material and light resolution.
 */
import {berxActionRing, type BerxActionSlot} from './actionRing';
import {berxFrustumPlanes, berxInvertMat4, berxLookAt, berxMultiplyMat4, berxPerspective, berxSphereInFrustum} from './frustum';
import {geometryForEntity, geometryScale, type BerxGeometryKind} from './geometry';
import {cameraBasis} from './spatialInteraction';
import {presentationForKind} from './spatialPresentation';
import {berxWorldMaterial} from './worldMaterials';
import {berxEnvironmentUniform} from './lighting/berxEnvironment';
import {
	berxEnergyLight,
	berxResolvePointLights,
	berxWorldLighting,
	type BerxPointLight,
	type BerxShaderRgb3,
	type BerxWorldLighting,
} from './worldLighting';
import type {Berx5DFrame} from './runtime5d';
import type {BerxSpatialCameraState} from './spatialCamera';
import {berxTransitionModulation} from './transitions';
import {berxShadowCamera, type BerxShadowCamera} from './shadowMap';
import {berxVolumetricUniform} from './lighting/berxVolumetric';
import {berxParticleOrigin, berxParticleUniform, BERX_PARTICLE_KINDS} from './lighting/berxParticles';
import {berxRenderQuality, berxParticleCountFor, berxSSAOKernelFor, type BerxRenderQuality} from './lighting/berxRenderQuality';
import {berxStableLod, berxBudgetDistance, berxRememberFrame, BERX_NO_MEMORY, type BerxFrameMemory} from './stability';
import type {BerxSpatialAffordance} from './socialActions';
import type {BerxSpatialEntityKind, BerxSpatialObject, BerxVec3} from './world';

/**
 * Metres past which an entity is drawn at reduced detail.
 *
 * It stays the same entity — same id, same relations, same pickable
 * volume — with fewer segments in its mesh, because at that distance
 * the extra ones are smaller than a pixel.
 */
export const BERX_LOD_DISTANCE = 18;

/**
 * The ground the world sits on: #07080A, the first colour of the DNA
 * ladder. Every backend clears to this exact value, which is also what
 * makes a cross-renderer pixel comparison meaningful.
 */
export const BERX_WORLD_CLEAR: BerxShaderRgb3 = [7 / 255, 8 / 255, 10 / 255];

export interface BerxDrawItem {
	/** The entity's spatial id. The same object in every renderer. */
	id: string;
	kind: BerxSpatialEntityKind;
	/** Which primitive form this kind takes. */
	primitive: BerxGeometryKind;
	/** 0 full detail, 1 the same form with fewer segments. */
	lod: 0 | 1;
	/** Column-major model matrix, translation-rotation-scale applied. */
	model: number[];
	base: [number, number, number];
	emissive: [number, number, number];
	metalness: number;
	roughness: number;
	opacity: number;
	transmission: number;
	/** Only the lights that reach this object, nearest first, capped. */
	pointLights: BerxPointLight[];
	/** The one media surface drawn on its front face, when it has one. */
	media?: string;
	/** Its name, for the label pass and for anyone not looking. */
	label?: string;
	/**
	 * The bounding radius this object occupies in world units.
	 *
	 * The core has always computed this (it is what the frustum cull and
	 * the shadow-camera fit are built on) and simply did not pass it on,
	 * so anything downstream that needed an object's size had to
	 * reconstruct it from the model matrix — which gives the TRANSFORM
	 * scale, not the geometry's own extent, and those differ by the
	 * primitive's radius. Carrying the real number removes that whole
	 * class of near-miss.
	 */
	radius: number;
	/** Metres from the eye. Renderers may not reorder by it; it is evidence. */
	distance: number;
}

/**
 * Where a name stands, decided once for every backend.
 *
 * A label is not a HUD element: it has a real height in metres, stands
 * at its entity's own top so a larger object carries its name higher,
 * is occluded by anything in front of it, and fades out with distance
 * rather than growing to stay legible. All of that is a property of the
 * world, so it is settled here — a backend only rasterises the glyphs
 * and draws the quad.
 */
export interface BerxLabelPlacement {
	/** The entity this name belongs to. */
	id: string;
	text: string;
	/** Centre of the quad, already lifted above the object. */
	position: BerxVec3;
	/** Half-height in metres. The width comes from the rasterised aspect. */
	halfHeight: number;
	/** Distance fade, already multiplied by the object's own opacity. */
	alpha: number;
	distance: number;
}

/** A name's height in the world, in metres. */
export const BERX_LABEL_HEIGHT = 0.34;
/** Metres at which names begin to fade, and at which they are gone. */
export const BERX_LABEL_FADE_START = 14;
export const BERX_LABEL_FADE_END = 26;

export interface BerxDrawStats {
	/** Entities the world holds and that are marked visible. */
	visible: number;
	/** Survived the frustum test. */
	inFrustum: number;
	/** Cut by the quality budget after culling, not before. */
	budgetCut: number;
	/** Drawn at reduced detail because of distance. */
	lodReduced: number;
}

export interface BerxDrawList {
	width: number;
	height: number;
	/** Column-major, as every GPU API wants them. */
	projection: number[];
	view: number[];
	/**
	 * The inverse of projection * view — a pixel back into a world ray.
	 *
	 * Here rather than in each backend because any pass that marches
	 * through the scene needs it, and a matrix inverted three times in
	 * three languages is three matrices the moment one of them rounds
	 * differently.
	 */
	invViewProjection: number[];
	camera: BerxVec3;
	clearColor: BerxShaderRgb3;
	/** Ambient colour already multiplied by its intensity. */
	ambient: BerxShaderRgb3;
	/**
	 * The room, packed exactly as the shaders' uniform block declares it
	 * (see berxEnvironmentUniform). Every backend uploads this array
	 * verbatim rather than re-deriving the packing, because three
	 * hand-written packings is three chances to put the ground colour in
	 * the sun slot.
	 */
	environment: number[];
	key: {direction: BerxVec3; colour: BerxShaderRgb3; intensity: number};
	/** In draw order: opaque focus-first and near-to-far, then blended far-to-near. */
	items: BerxDrawItem[];
	/**
	 * The names, far to near, so the ones in front composite over the
	 * ones behind. Empty when the camera looks straight up or down and
	 * has no usable right vector — a degenerate basis is reported as no
	 * labels rather than as labels in the wrong place.
	 */
	labels: BerxLabelPlacement[];
	/**
	 * The ring of actions around whatever is focused, if anything is.
	 *
	 * Drawn as the same kind of quad as a name, because it is the same
	 * kind of thing — a word standing in the world beside the object it
	 * belongs to. Empty when nothing is focused or nothing is offered.
	 */
	actionSlots: BerxActionSlot[];
	/**
	 * The march's own parameters, packed by berxVolumetricUniform, plus
	 * the step count. Packed rather than structured for the same reason
	 * the environment is: a backend forwards it to a uniform without
	 * interpreting it, so there is exactly one opinion about the order.
	 *
	 * x = density, y = phase g, z = max distance, w = intensity,
	 * then [steps, 0, 0, 0].
	 */
	/**
	 * What this frame decided, to hand to the next one.
	 *
	 * A caller that renders continuously should pass this back in as
	 * `memory`; one rendering a single frame can ignore it. See
	 * stability.ts for what flickers without it.
	 */
	memory: BerxFrameMemory;
	volumetric: number[];
	/** The live part of the occlusion kernel, as vec4s. See the emitter. */
	ssao: number[];
	/** How many of those vec4s the shaders should read. */
	ssaoSamples: number;
	/**
	 * The world's own clock, in seconds — ticked by Berx5DRuntime, not
	 * read from a wall clock.
	 *
	 * Anything that animates reads this. A pass driven by
	 * performance.now() cannot be compared between two backends, cannot
	 * be predicted by a CPU twin, and produces a different picture on
	 * every run — which is the same reason nothing here calls
	 * Math.random.
	 */
	worldTime: number;
	/**
	 * One packed spec per particle field, from berxParticleUniform.
	 *
	 * Packed rather than structured for the same reason the environment
	 * and the march are: a backend forwards it to a uniform without
	 * interpreting it, so there is exactly one opinion about the order.
	 */
	particles: number[][];
	/**
	 * The key light's own camera, fitted to what is being drawn.
	 *
	 * Decided here so all three backends put the light in exactly the
	 * same place: three renderers that agree on the world would
	 * otherwise disagree on where its shadows fall, and the pixel
	 * comparison between them would report a maths disagreement as a
	 * rendering one. Absent when there is nothing to cast.
	 */
	shadow?: BerxShadowCamera;
	/** The camera's right and up, for the quads that face it. */
	basis?: {right: BerxVec3; up: BerxVec3};
	stats: BerxDrawStats;
}

export interface BerxDrawListOptions {
	width: number;
	height: number;
	/** The quality budget, in objects. Applied after culling, never before. */
	maxObjects?: number;
	/** Ambient motion off dims the key rather than removing the world. */
	ambientMotion?: boolean;
	/** The world's standing light. Defaults to `berxWorldLighting()`. */
	lighting?: BerxWorldLighting;
	/** The media surface an object carries, resolved by the host. */
	mediaFor?: (objectId: string) => string | undefined;
	/** What can be done to the focused entity, from the world application. */
	affordances?: readonly BerxSpatialAffordance[];
	/** Whether the air carries dust, energy and the far field. */
	particles?: boolean;
	/**
	 * What this device can afford.
	 *
	 * The one place a quality tier becomes numbers. Every backend reads
	 * the step count, the march resolution, the shadow map size and the
	 * particle counts out of the list rather than deciding any of them,
	 * for the same reason they read the cull and the LOD out of it: a
	 * backend that picked its own would be a second opinion about what
	 * the world looks like, and the three would drift.
	 *
	 * Defaults to HIGH — the reference picture the gates measure.
	 */
	quality?: BerxRenderQuality;
	/**
	 * What the previous frame decided, so this one does not decide it
	 * again from scratch and come out differently.
	 *
	 * Only the decisions that WOBBLE are carried: which object had which
	 * geometry, and which ones were on screen. Not the frame — a renderer
	 * that remembered its pixels would be a renderer with a history, and
	 * this world is a function of its state. Omit it and every decision
	 * uses a bare threshold, which is correct for a first frame and is
	 * flicker on every one after it.
	 */
	memory?: BerxFrameMemory;
	/**
	 * Whether the key light casts.
	 *
	 * A real switch, in the core, so every backend turns shadows off the
	 * same way and a low-tier device drops a whole pass rather than a
	 * backend inventing its own cheaper approximation. Off means the
	 * light casts nothing — never a fake darkening under objects.
	 */
	shadows?: boolean;
}

const modelMatrix = (p: BerxVec3, s: BerxVec3, r: {x: number; y: number; z: number}): number[] => {
	const cx = Math.cos(r.x);
	const sx = Math.sin(r.x);
	const cy = Math.cos(r.y);
	const sy = Math.sin(r.y);
	const cz = Math.cos(r.z);
	const sz = Math.sin(r.z);
	const m = new Array<number>(16).fill(0);
	m[0] = cy * cz * s.x;
	m[1] = cy * sz * s.x;
	m[2] = -sy * s.x;
	m[4] = (sx * sy * cz - cx * sz) * s.y;
	m[5] = (sx * sy * sz + cx * cz) * s.y;
	m[6] = sx * cy * s.y;
	m[8] = (cx * sy * cz + sx * sz) * s.z;
	m[9] = (cx * sy * sz - sx * cz) * s.z;
	m[10] = cx * cy * s.z;
	m[12] = p.x;
	m[13] = p.y;
	m[14] = p.z;
	m[15] = 1;
	return m;
};

/** The bounding radius an object's geometry actually occupies. */
const radiusOf = (o: BerxSpatialObject): number =>
	Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z) * 0.75;

const distanceTo = (eye: BerxVec3, o: BerxSpatialObject): number =>
	Math.hypot(o.transform.position.x - eye.x, o.transform.position.y - eye.y, o.transform.position.z - eye.z);

/**
 * Move a camera sideways by half an interpupillary distance.
 *
 * A headset is BERX with two of these, not a second product, so the
 * offset belongs next to the draw list both eyes are built from.
 */
export function berxEyeCamera(camera: BerxSpatialCameraState, ipd: number, sign: -1 | 1): BerxSpatialCameraState {
	const basis = cameraBasis(camera);
	if (!basis) return camera;
	const o = ipd * 0.5 * sign;
	return {
		...camera,
		position: {
			x: camera.position.x + basis.right.x * o,
			y: camera.position.y + basis.right.y * o,
			z: camera.position.z + basis.right.z * o,
		},
		target: {
			x: camera.target.x + basis.right.x * o,
			y: camera.target.y + basis.right.y * o,
			z: camera.target.z + basis.right.z * o,
		},
	};
}

/**
 * The frame, resolved into draws.
 *
 * Order matters and is decided here rather than by whoever draws:
 *
 *   - Culling comes before the budget. Spending the budget on objects
 *     behind the camera is how a world with a hundred entities draws
 *     nothing in front of you.
 *   - Opaque objects lead, focus first, then near to far, so the depth
 *     buffer rejects what is behind before it is ever shaded.
 *   - Transparent objects go strictly far to near, because alpha
 *     blending is order-dependent and a near pane drawn first
 *     composites away the far one behind it.
 */
export function berxBuildDrawList(frame: Berx5DFrame, options: BerxDrawListOptions): BerxDrawList {
	const c = frame.camera;
	const width = Math.max(1, Math.floor(options.width));
	const height = Math.max(1, Math.floor(options.height));
	/**
	 * The transition's field of view is applied HERE, not on the camera.
	 *
	 * A dolly-zoom is a property of how the world is being LOOKED at for
	 * the duration of a move, not of where the viewer is — and the
	 * camera state is read by picking, by XR and by anything that asks
	 * where the viewer stands, none of which should see a transient
	 * effect. Putting it in the projection also means every backend and
	 * every frozen frame gets it from the same place, so an effect
	 * cannot exist in a live session and vanish in a comparison.
	 */
	const modulation = berxTransitionModulation(frame.transition?.kind, frame.transition?.progress ?? 0);
	const projection = berxPerspective(c.fov * modulation.fov, width / height, c.near, c.far);
	const view = berxLookAt(c.position, c.target);
	const planes = berxFrustumPlanes(berxMultiplyMat4(projection, view));

	const all = frame.world.objects.filter((o) => o.visible);
	const inFrustum = all.filter((o) => berxSphereInFrustum(planes, o.transform.position, radiusOf(o)));

	const focused = frame.world.activeObjectId;
	const eye = c.position;
	/* The modulation resolved above is applied to every item below — which
	   is what makes the eight effects real rather than named: WebGL2,
	   WebGPU and the native backend all consume this same list, so a
	   dissolve looks identical in all three and the cross-renderer pixel
	   comparison still means something.

	   Note the sort above deliberately runs on the object's OWN opacity,
	   before modulation: a dissolve must not reshuffle the draw order
	   halfway through and make the world pop. */
	/**
	 * What the previous frame drew, and with what geometry.
	 *
	 * The budget keeps the nearest N and the LOD switches at a distance,
	 * and both of those are bare thresholds applied to a quantity that
	 * WOBBLES — so an object at rank N, or standing at exactly the LOD
	 * distance, changes state every frame while the camera breathes. That
	 * is what flicker is: not a rendering artefact, a decision boundary.
	 * See stability.ts.
	 */
	/* HIGH is the reference picture every gate in this repository
	   measures, so it is what a caller that says nothing gets. Resolved
	   here rather than further down because the budget below reads its
	   object count. */
	const quality = options.quality ?? berxRenderQuality('high');
	const memory = options.memory ?? BERX_NO_MEMORY;
	const wasDrawn = new Set(memory.drawn);
	/* The distance an object COMPETES at, which is not the distance it is
	   at: one already on screen competes as though slightly nearer, so a
	   tie at the budget's edge does not flip on noise. */
	const rank = (o: typeof inFrustum[number]) => berxBudgetDistance(distanceTo(eye, o), wasDrawn.has(o.id));
	const opaque = inFrustum
		.filter((o) => o.material.opacity >= 1)
		.sort((a, b) => {
			if (a.id === focused) return -1;
			if (b.id === focused) return 1;
			return rank(a) - rank(b);
		});
	const blended = inFrustum
		.filter((o) => o.material.opacity < 1)
		.sort((a, b) => rank(b) - rank(a));

	const max = Math.max(1, Math.floor(options.maxObjects ?? quality.maxObjects ?? frame.world.objects.length));
	const drawn = [...opaque, ...blended].slice(0, max);

	/* the world's standing light, plus whatever in it is live */
	const lighting = options.lighting ?? berxWorldLighting();
	const energyLights: BerxPointLight[] = [];
	for (const o of inFrustum) {
		const light = berxEnergyLight(o.transform.position, o.energy);
		if (light) energyLights.push(light);
	}
	const litWorld: BerxWorldLighting = {...lighting, points: [...lighting.points, ...energyLights]};

	let lodReduced = 0;
	const items: BerxDrawItem[] = drawn.map((o) => {
		const spec = geometryForEntity(o.kind);
		const presentation = presentationForKind(o.kind, o);
		const material = berxWorldMaterial(o.material.material);
		const distance = distanceTo(eye, o);
		/* The geometry's OWN extent times the transform's, which is not
		   what radiusOf() gives: that one is the cull sphere, deliberately
		   a rough over-estimate of the transform scale alone. A caller
		   that needs to land a point on this object's surface needs the
		   real one. */
		const geo = geometryScale(spec);
		const radius =
			Math.max(geo.x, geo.y, geo.z) *
			Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z);
		/* Sticky: an object that already had reduced geometry keeps it
		   until it comes well inside, and one that had full geometry keeps
		   that until it goes well outside. A bare threshold here swaps an
		   object's mesh sixty times a second when it stands at exactly the
		   LOD distance and the camera breathes. */
		const lod: 0 | 1 = berxStableLod(distance, BERX_LOD_DISTANCE, memory.lod[o.id]);
		if (lod === 1) lodReduced++;
		return {
			id: o.id,
			kind: o.kind,
			primitive: spec.kind,
			lod,
			radius,
			/* The transition's own scale is folded into the model matrix
			   here rather than into the object, so a transition never
			   mutates the world: the same world, mid-collapse, is still
			   the world it was when the transition ends. */
			model: modelMatrix(
				o.transform.position,
				modulation.scale === 1
					? o.transform.scale
					: {x: o.transform.scale.x * modulation.scale, y: o.transform.scale.y * modulation.scale, z: o.transform.scale.z * modulation.scale},
				o.transform.rotation,
			),
			base: [...presentation.base] as [number, number, number],
			/* the palette decides the colour; the material decides how the
			   surface behaves. Neither is guessed from the other. */
			emissive: [
				presentation.emissive[0] + material.emission[0] * o.energy + modulation.emissive,
				presentation.emissive[1] + material.emission[1] * o.energy + modulation.emissive,
				presentation.emissive[2] + material.emission[2] * o.energy + modulation.emissive,
			],
			/* the object's own state is authoritative: a screen may have
			   changed a value since the named material was resolved */
			metalness: o.material.metalness,
			roughness: o.material.roughness,
			opacity: o.material.opacity * modulation.opacity,
			transmission: o.material.transmission,
			pointLights: berxResolvePointLights(litWorld, o.transform.position),
			media: options.mediaFor?.(o.id),
			label: o.label,
			distance,
		};
	});

	/* the names, decided here so both backends put them in the same place */
	const basis = cameraBasis(c);
	const labels: BerxLabelPlacement[] = [];
	if (basis) {
		const named = drawn.filter((o) => o.label !== undefined && o.label.trim().length > 0);
		for (const o of named.sort((a, b) => distanceTo(eye, b) - distanceTo(eye, a))) {
			const distance = distanceTo(eye, o);
			/* out of reading range: not placed at all, rather than placed as
			   an unreadable smear that still costs a draw call */
			if (distance > BERX_LABEL_FADE_END) continue;
			const halfHeight = BERX_LABEL_HEIGHT * 0.5;
			/* the entity's own top, so a name belongs to its object */
			const above = o.transform.scale.y * 0.5 + halfHeight * 1.6;
			const fade = distance <= BERX_LABEL_FADE_START
				? 1
				: 1 - (distance - BERX_LABEL_FADE_START) / (BERX_LABEL_FADE_END - BERX_LABEL_FADE_START);
			labels.push({
				id: o.id,
				text: o.label!,
				position: {
					x: o.transform.position.x + basis.up.x * above,
					y: o.transform.position.y + basis.up.y * above,
					z: o.transform.position.z + basis.up.z * above,
				},
				halfHeight,
				/* names thin out with the world they belong to, or a
				   dissolve would leave a field of floating text */
				alpha: fade * o.material.opacity * modulation.opacity,
				distance,
			});
		}
	}

	/**
	 * The particle fields, and where each one sits.
	 *
	 * Decided here, once, from what the world is doing: the brightest
	 * emissive entity is what "live" means, and it is the same reading
	 * every backend would otherwise have to make for itself.
	 */
	const forward = {
		x: c.target.x - c.position.x,
		y: c.target.y - c.position.y,
		z: c.target.z - c.position.z,
	};
	const forwardLength = Math.hypot(forward.x, forward.y, forward.z) || 1;
	const viewAhead = {x: forward.x / forwardLength, y: forward.y / forwardLength, z: forward.z / forwardLength};
	let live: {position: BerxVec3; energy: number} | undefined;
	for (const item of items) {
		const energy = item.emissive[0] + item.emissive[1] + item.emissive[2];
		if (energy > 0.35 && (!live || energy > live.energy)) {
			live = {position: {x: item.model[12], y: item.model[13], z: item.model[14]}, energy};
		}
	}
	const particleFields: number[][] = [];
	for (const kind of BERX_PARTICLE_KINDS) {
		const origin = berxParticleOrigin(kind, c.position, viewAhead, live?.position);
		if (!origin) continue;
		particleFields.push(berxParticleUniform(kind, origin, berxParticleCountFor(kind, quality)));
	}

	return {
		width,
		height,
		projection: Array.from(projection),
		view: Array.from(view),
		invViewProjection: Array.from(berxInvertMat4(berxMultiplyMat4(projection, view))),
		camera: {...c.position},
		clearColor: [...BERX_WORLD_CLEAR] as BerxShaderRgb3,
		environment: berxEnvironmentUniform(lighting.environment),
		ambient: [
			lighting.ambient[0] * lighting.ambientIntensity,
			lighting.ambient[1] * lighting.ambientIntensity,
			lighting.ambient[2] * lighting.ambientIntensity,
		],
		key: {
			direction: {...lighting.key.direction},
			colour: [...lighting.key.colour] as BerxShaderRgb3,
			intensity: lighting.key.intensity * (options.ambientMotion === false ? 0.85 : 1),
		},
		items,
		labels,
		actionSlots: berxActionRing(
			frame.world.objects.find((o) => o.id === frame.world.activeObjectId),
			c,
			options.affordances ?? [],
		),
		/**
		 * Everything drawn casts and receives. Not a per-object flag:
		 * a world where some things cast shadows and others do not is a
		 * world where a viewer learns the rendering rather than the
		 * place. The cost is bounded by the same budget the main pass
		 * already has, since it is the same list.
		 */
		memory: berxRememberFrame(items),
		volumetric: [...berxVolumetricUniform(), quality.volumetricSteps, quality.volumetricScale, 0, 0],
		/**
		 * The occlusion kernel and how many of it are live.
		 *
		 * In the list for the same reason the march's steps are: the tier
		 * decides it, and a backend that generated its own would be asking
		 * a different question from the one the oracle predicts.
		 */
		ssao: [...berxSSAOKernelFor(quality).flatMap((k) => [k.x, k.y, k.z, 0])],
		ssaoSamples: quality.ssaoSamples,
		worldTime: frame.world.worldTime,
		particles: options.particles === false ? [] : particleFields,
		shadow: options.shadows === false
			? undefined
			: berxShadowCamera(
				drawn.map((o) => ({position: o.transform.position, radius: radiusOf(o)})),
				lighting.key.direction,
				quality.shadowMapSize,
			),
		basis: basis ? {right: {...basis.right}, up: {...basis.up}} : undefined,
		stats: {
			visible: all.length,
			inFrustum: inFrustum.length,
			budgetCut: Math.max(0, inFrustum.length - drawn.length),
			lodReduced,
		},
	};
}
