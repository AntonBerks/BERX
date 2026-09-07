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
import {Berx5DWorldApp, berxTemporalCursor, berxTransitionSpec, type Berx5DFrame, type BerxTransitionKind} from '@berx/spatial';
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
