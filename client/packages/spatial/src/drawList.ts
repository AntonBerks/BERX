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
import {berxFrustumPlanes, berxLookAt, berxMultiplyMat4, berxPerspective, berxSphereInFrustum} from './frustum';
import {geometryForEntity, type BerxGeometryKind} from './geometry';
import {cameraBasis} from './spatialInteraction';
import {presentationForKind} from './spatialPresentation';
import {berxWorldMaterial} from './worldMaterials';
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
	camera: BerxVec3;
	clearColor: BerxShaderRgb3;
	/** Ambient colour already multiplied by its intensity. */
	ambient: BerxShaderRgb3;
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
	const projection = berxPerspective(c.fov, width / height, c.near, c.far);
	const view = berxLookAt(c.position, c.target);
	const planes = berxFrustumPlanes(berxMultiplyMat4(projection, view));

	const all = frame.world.objects.filter((o) => o.visible);
	const inFrustum = all.filter((o) => berxSphereInFrustum(planes, o.transform.position, radiusOf(o)));

	const focused = frame.world.activeObjectId;
	const eye = c.position;
	const opaque = inFrustum
		.filter((o) => o.material.opacity >= 1)
		.sort((a, b) => {
			if (a.id === focused) return -1;
			if (b.id === focused) return 1;
			return distanceTo(eye, a) - distanceTo(eye, b);
		});
	const blended = inFrustum
		.filter((o) => o.material.opacity < 1)
		.sort((a, b) => distanceTo(eye, b) - distanceTo(eye, a));

	const max = Math.max(1, Math.floor(options.maxObjects ?? frame.world.objects.length));
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
		const lod: 0 | 1 = distance > BERX_LOD_DISTANCE ? 1 : 0;
		if (lod === 1) lodReduced++;
		return {
			id: o.id,
			kind: o.kind,
			primitive: spec.kind,
			lod,
			model: modelMatrix(o.transform.position, o.transform.scale, o.transform.rotation),
			base: [...presentation.base] as [number, number, number],
			/* the palette decides the colour; the material decides how the
			   surface behaves. Neither is guessed from the other. */
			emissive: [
				presentation.emissive[0] + material.emission[0] * o.energy,
				presentation.emissive[1] + material.emission[1] * o.energy,
				presentation.emissive[2] + material.emission[2] * o.energy,
			],
			/* the object's own state is authoritative: a screen may have
			   changed a value since the named material was resolved */
			metalness: o.material.metalness,
			roughness: o.material.roughness,
			opacity: o.material.opacity,
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
				alpha: fade * o.material.opacity,
				distance,
			});
		}
	}

	return {
		width,
		height,
		projection: Array.from(projection),
		view: Array.from(view),
		camera: {...c.position},
		clearColor: [...BERX_WORLD_CLEAR] as BerxShaderRgb3,
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
		basis: basis ? {right: {...basis.right}, up: {...basis.up}} : undefined,
		stats: {
			visible: all.length,
			inFrustum: inFrustum.length,
			budgetCut: Math.max(0, inFrustum.length - drawn.length),
			lodReduced,
		},
	};
}
