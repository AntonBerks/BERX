/**
 * One frame, built once, so two renderers can be compared on it.
 *
 * A native backend that renders *something* proves only that a GPU
 * works. What has to be true is stronger: that the native backend and
 * the web backend, given the same world from the same shared core,
 * produce the same picture. That is only checkable if both are handed
 * a frame that is identical down to the last float, which is what this
 * builds.
 *
 * The rows below are shaped exactly as `@berx/api`'s types declare
 * them and go through the real mappers into the real world
 * application — the same path the product takes. Nothing here is a
 * renderer fixture; it is the product's own pipeline, stopped one step
 * before the pixels.
 *
 * Two things are deliberately removed from the frame:
 *
 *   - labels, because the native backend has no text rasteriser. Pass
 *     `{labels: true}` to keep them when comparing the two web backends,
 *     which both draw names.
 *   - media, because the native backend has no image decoder. The media
 *     path is compared separately, web backend against web backend.
 *
 * Both are real gaps in the native backend and both are reported as
 * gaps. Leaving them in by default would make the renderers differ for
 * a reason that has nothing to do with whether they agree about the
 * world.
 */
import {Berx5DWorldApp, berxTemporalCursor, berxTransitionSpec, berxWorldLighting, type Berx5DFrame, type BerxTransitionKind, type BerxWorldLighting} from '@berx/spatial';
import {
	berxSpatialId,
	mapCommunityToSpatial,
	mapEventToSpatial,
	mapExperienceToSpatial,
	mapFeedItemToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
} from './spatialMapping';

const PERSON = 77;
const PLACE = 4211;
const EVENT = 908;
const COMMUNITY = 3300;
const EXPERIENCE = 6120;
/** A fixed instant, so the temporal dimension lands identically twice. */
const NOW_SECONDS = 1_800_000_000;

const user = {
	guid: PERSON, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0,
};
const place = {
	guid: PLACE, title: 'Дом Культуры', description: '', category: 'venue', address: null, phone: null,
	website: null, hours: null, price: null, lat: null, lng: null, owner_guid: PERSON, cover_url: null,
	rating: 0, rating_count: 0, is_saved: false, is_business: false, business_type: null, verified: false,
};
const liveEvent = {
	guid: EVENT, title: 'Вечер импровизации', description: '', category: null,
	starts: NOW_SECONDS - 600, ends: NOW_SECONDS + 3600, location: null,
	place: {guid: PLACE, title: 'Дом Культуры'}, capacity: null, seats_left: null, attendee_count: 3,
	owner_guid: PERSON, cover_url: null, has_ended: false, is_going: true,
};
const moment = {
	guid: 5150, text: 'вечер удался', owner_guid: PERSON, owner_username: 'ann', time_created: NOW_SECONDS - 300,
};
const community = {
	guid: COMMUNITY, name: 'Импровизация', description: '', owner_guid: PERSON,
	privacy: null, is_member: true,
};
const experience = {
	id: EXPERIENCE, title: 'Ночная прогулка', description: '',
	anchor: {type: 'place' as const, guid: PLACE, title: 'Дом Культуры', image_url: null},
	visibility: 'public' as const, owner_guid: PERSON, is_own: true,
	scheduled_start: NOW_SECONDS - 86_400, scheduled_end: null, my_status: 'accepted' as const,
};

/**
 * The world both renderers draw.
 *
 * Deterministic by construction: a fixed temporal cursor, a fixed
 * camera pose, and a relational layout the world gate already proves
 * lands in the same place every time.
 */
export function berxCrossRendererFrame(options: {labels?: boolean; transition?: {kind: BerxTransitionKind; progress: number}} = {}): Berx5DFrame {
	const app = new Berx5DWorldApp({
		viewerId: berxSpatialId('person', PERSON),
		cursor: berxTemporalCursor(NOW_SECONDS),
		transitionDuration: 0.01,
	});
	const mapped = [
		mapUserToSpatial(user),
		mapPlaceToSpatial(place),
		mapEventToSpatial(liveEvent),
		mapFeedItemToSpatial(moment),
		mapCommunityToSpatial(community),
		mapExperienceToSpatial(experience),
	];
	app.ingest(mapped.map((m) => ({object: m.object, relations: m.relations, media: m.media})));

	const frame = app.latestFrame;
	return {
		...frame,
		world: {
			...frame.world,
			/* By default the world pass only, with no names: the native
			   backend has no text rasteriser, and comparing it against one
			   that does would report a difference that is a known gap
			   rather than a rendering disagreement. `labels: true` keeps
			   them, for comparing the two web backends against each
			   other — both of those do draw names. */
			objects: options.labels === true
				? frame.world.objects
				: frame.world.objects.map((o) => ({...o, label: undefined})),
		},
		/**
		 * A transition, frozen at one instant.
		 *
		 * Not a second world and not an animation: the SAME world, with
		 * the transition state a real travel would have produced at that
		 * progress. That is what lets the eight effects be compared as
		 * pixels — every difference between two of these images is the
		 * effect and nothing else, because everything else is identical.
		 */
		transition: options.transition
			? {
				/* real BerxWorldState values, not a cast: the frame's
				   `world` is a snapshot of objects and is a different
				   type entirely, and casting one to the other is how a
				   fixture starts describing a shape the product does not
				   have. */
				fromWorld: {id: 'crossrender', enteredAt: NOW_SECONDS * 1000, camera: frame.camera},
				toWorld: {id: 'crossrender', enteredAt: NOW_SECONDS * 1000, camera: frame.camera},
				fromCamera: frame.camera,
				destination: frame.camera.position,
				progress: options.transition.progress,
				duration: berxTransitionSpec(options.transition.kind).durationSeconds,
				kind: options.transition.kind,
			}
			: frame.transition,
		/* a still frame: ambient motion would make two runs differ */
		reducedMotion: true,
	};
}

/** The viewport both renderers use. Small enough to compare quickly, large enough to hold form. */
export const BERX_CROSS_RENDERER_VIEWPORT = {width: 480, height: 360} as const;

/**
 * A world built so a shadow either happens or visibly does not.
 *
 * The cross-renderer fixture is a real BERX world and is exactly the
 * wrong shape for this question: its entities stand in a relational
 * ring, so nothing is reliably above anything else and a shadow could
 * land anywhere. This one answers one question — does an occluder
 * darken what is under it — and answers it where the answer is
 * unambiguous: a wide flat surface, one orb directly above its centre,
 * and a key light straight down.
 *
 * Still a real world: real BerxSpatialObjects, the real material and
 * palette resolution, the real camera, the real draw list. The only
 * thing arranged by hand is the geometry, because a question about
 * where light falls needs known geometry to have an answer at all.
 */
export function berxShadowFixtureFrame(): Berx5DFrame {
	const app = new Berx5DWorldApp({
		viewerId: berxSpatialId('person', PERSON),
		cursor: berxTemporalCursor(NOW_SECONDS),
		transitionDuration: 0.01,
	});
	/* A moment, not a place: `place` resolves to the `portal` primitive,
	   which is a FRAME — hollow in the middle, so a "floor" made from one
	   has a hole exactly where the shadow would land. Found by rendering
	   it, not by reading the geometry table. `moment` resolves to
	   `surface`, a solid slab, which is what a floor is. */
	const ground = mapFeedItemToSpatial(moment);
	const caster = mapUserToSpatial(user);
	app.ingest([
		{object: ground.object, relations: [], media: []},
		{object: caster.object, relations: [], media: []},
	]);

	const frame = app.latestFrame;
	const objects = frame.world.objects.map((o) => {
		if (o.id === ground.object.id) {
			/* the floor: wide, thin, flat, at the origin */
			return {
				...o,
				label: undefined,
				transform: {position: {x: 0, y: -1.2, z: 0}, rotation: {x: -Math.PI / 2, y: 0, z: 0}, scale: {x: 9, y: 9, z: 0.2}},
			};
		}
		if (o.id === caster.object.id) {
			/* the occluder: directly above the floor's centre */
			return {
				...o,
				label: undefined,
				transform: {position: {x: 0, y: 1.4, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 1.6, y: 1.6, z: 1.6}},
			};
		}
		return {...o, label: undefined};
	});

	return {
		...frame,
		world: {...frame.world, objects, activeObjectId: undefined},
		/* looking down the floor at a shallow angle, so both the orb and
		   the ground under it are in frame */
		camera: {
			position: {x: 0, y: 3.4, z: 7.2},
			target: {x: 0, y: -0.4, z: 0},
			rotation: {x: 0, y: 0, z: 0},
			fov: 55,
			near: 0.1,
			far: 100,
		},
		transition: undefined,
		reducedMotion: true,
	};
}

/**
 * A key light pointing straight down, so the orb's shadow lands under
 * the orb and nowhere else. Everything else is the world's own
 * standing light.
 */
export function berxShadowFixtureLighting(): BerxWorldLighting {
	const lighting = berxWorldLighting();
	return {
		...lighting,
		/* (0, 1, 0) means the light is straight overhead: the field points
		   TOWARD the light, which is what the BRDF and the shadow camera
		   both read it as. */
		key: {...lighting.key, direction: {x: 0, y: 1, z: 0}, intensity: Math.max(lighting.key.intensity, 1.6)},
	};
}

/**
 * The lighting the environment gate measures: the room, alone.
 *
 * The key is turned OFF and the shadow pass with it, so every photon in
 * the resulting frame came from the analytic environment. That is what
 * makes the readback comparable against berxEnvironmentRadiance
 * directly: with a key light in the frame the gate would be checking a
 * sum, and a sum can be right for the wrong reasons.
 *
 * `environment` is untouched — the room under test is the real one the
 * product ships, not a fixture-only room.
 */
export function berxEnvironmentFixtureLighting(): BerxWorldLighting {
	const lighting = berxWorldLighting();
	return {
		...lighting,
		key: {...lighting.key, intensity: 0},
		points: [],
	};
}

/**
 * The same lighting with the sun's contribution scaled.
 *
 * Used to prove the shaders read the environment the shared core sends
 * rather than constants of their own: change one number here, and every
 * backend's pixels must move by the amount the core predicts. A shader
 * with the room baked in would not move at all.
 */
export function berxEnvironmentFixtureLightingScaled(sunIntensity: number): BerxWorldLighting {
	const lighting = berxEnvironmentFixtureLighting();
	return {...lighting, environment: {...lighting.environment, sunIntensity}};
}
