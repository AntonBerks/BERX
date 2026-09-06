/**
 * Executable invariants for the five dimensions.
 *
 * These run the real world application against rows shaped exactly as
 * the API types declare them, and check the properties BERX would stop
 * being BERX without.
 */
import {
	Berx5DWorldApp,
	berxProjectTemporal,
	berxRelationalLayout,
	berxStableAngle,
	berxTemporalBand,
	berxTemporalCursor,
} from '@berx/spatial';
import {
	berxSpatialId,
	mapEventToSpatial,
	mapExperienceToSpatial,
	mapFeedItemToSpatial,
	mapNearbyPlaceToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
} from './spatialMapping';

const fail = (message: string): never => {
	throw new Error(`5D world invariant: ${message}`);
};

const PERSON = 77;
const PLACE = 4211;
const EVENT = 908;
const NOW_SECONDS = 1_800_000_000;

const place = {
	guid: PLACE, title: 'Дом Культуры', description: '', category: 'venue', address: null, phone: null,
	website: null, hours: null, price: null, lat: null, lng: null, owner_guid: PERSON, cover_url: null,
	rating: 0, rating_count: 0, is_saved: false, is_business: false, business_type: null, verified: false,
};
const user = {guid: PERSON, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0};
const liveEvent = {
	guid: EVENT, title: 'Вечер импровизации', description: '', category: null,
	starts: NOW_SECONDS - 600, ends: NOW_SECONDS + 3600, location: null,
	place: {guid: PLACE, title: 'Дом Культуры'}, capacity: null, seats_left: null, attendee_count: 3,
	owner_guid: PERSON, cover_url: null, has_ended: false, is_going: true,
};

function build(): Berx5DWorldApp {
	const app = new Berx5DWorldApp({viewerId: berxSpatialId('person', PERSON), cursor: berxTemporalCursor(NOW_SECONDS), transitionDuration: 0.01});
	const person = mapUserToSpatial(user);
	const venue = mapPlaceToSpatial(place);
	const event = mapEventToSpatial(liveEvent);
	const moment = mapFeedItemToSpatial({guid: 5150, text: 'вечер удался', owner_guid: PERSON, owner_username: 'ann', time_created: NOW_SECONDS - 300});
	app.ingest([person, venue, event, moment].map((m) => ({object: m.object, relations: m.relations, media: m.media})));
	return app;
}

export function assertBerx5DWorldInvariants(): void {
	/* ---- X/Y/Z come from R, and are the same every time ---- */
	const a = build().latestFrame.world.objects;
	const b = build().latestFrame.world.objects;
	const at = (objects: typeof a, id: string) => objects.find((o) => o.id === id)?.transform.position;
	for (const object of a) {
		const other = at(b, object.id);
		if (!other) fail(`${object.id} exists in one build of the same world and not the other`);
		const p = object.transform.position;
		if (p.x !== other!.x || p.y !== other!.y || p.z !== other!.z) {
			fail(`${object.id} landed in two different places from the same graph — the layout is not deterministic`);
		}
	}
	if (berxStableAngle('person:77') !== berxStableAngle('person:77')) fail('the stable angle is not stable');
	if (berxStableAngle('person:77') === berxStableAngle('person:78')) fail('two entities share one direction from their anchor');

	/* Nothing sits at the origin except the viewer, and nothing is
	   stacked on anything else: a world where two entities occupy one
	   point cannot be navigated. */
	const seen = new Map<string, string>();
	for (const object of a) {
		const key = `${object.transform.position.x.toFixed(3)},${object.transform.position.y.toFixed(3)},${object.transform.position.z.toFixed(3)}`;
		const already = seen.get(key);
		if (already) fail(`${object.id} and ${already} occupy the same point in the world`);
		seen.set(key, object.id);
	}

	/* The arrangement is derived: an event at a place must be nearer to
	   that place than an unrelated moment is. */
	const venuePos = at(a, berxSpatialId('place', PLACE))!;
	const eventPos = at(a, berxSpatialId('event', EVENT))!;
	const momentPos = at(a, berxSpatialId('moment', 5150))!;
	const distance = (p: typeof venuePos, q: typeof venuePos) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
	if (distance(eventPos, venuePos) >= distance(momentPos, venuePos)) {
		fail('an event at a place is not nearer to it than an unrelated moment — the layout is not derived from relations');
	}

	/* A relation with an end that is not in the world places nothing. */
	const dangling = berxRelationalLayout(
		[{...a[0]}],
		[{id: 'r', from: a[0].id, to: 'person:does-not-exist', type: 'created-by', strength: 1}],
		{rootId: a[0].id},
	);
	if (dangling.size !== 1) fail('a relation to an entity outside the world placed something');

	/* ---- T is a dimension, not a filter ---- */
	const cursor = berxTemporalCursor(NOW_SECONDS);
	if (berxTemporalBand(undefined, cursor) !== 'timeless') fail('an entity with no time was given one');
	if (berxTemporalBand({startsAt: NOW_SECONDS - 60, endsAt: NOW_SECONDS + 60}, cursor) !== 'now') fail('a running event is not now');
	if (berxTemporalBand({startsAt: NOW_SECONDS + 40 * 86400}, cursor) !== 'future') fail('an event next month is not future');
	if (berxTemporalBand({startsAt: NOW_SECONDS - 40 * 86400, endsAt: NOW_SECONDS - 39 * 86400}, cursor) !== 'past') fail('an event last month is not past');

	const past = berxProjectTemporal({at: NOW_SECONDS - 7 * 86400}, cursor);
	const future = berxProjectTemporal({at: NOW_SECONDS + 7 * 86400}, cursor);
	const present = berxProjectTemporal({at: NOW_SECONDS}, cursor);
	if (!(past.depthOffset < present.depthOffset && present.depthOffset < future.depthOffset)) {
		fail(`time is not a direction: past ${past.depthOffset}, now ${present.depthOffset}, future ${future.depthOffset}`);
	}
	/* further in time is always further in space — never equal */
	const near = berxProjectTemporal({at: NOW_SECONDS - 3600}, cursor);
	const far = berxProjectTemporal({at: NOW_SECONDS - 365 * 86400}, cursor);
	if (!(far.depthOffset < near.depthOffset)) fail('a year ago is not further than an hour ago');
	if (far.presence <= 0) fail('the distant past vanished instead of receding');
	if (present.energyScale !== 1 || past.energyScale !== 0) fail('energy is not gated on being live');

	/* Moving the cursor moves entities. It does not remove them. */
	const app = build();
	const before = app.latestFrame.world.objects;
	app.scrubTime(30 * 86400);
	const after = app.latestFrame.world.objects;
	if (after.length !== before.length) fail(`scrubbing time changed how many entities exist (${before.length} → ${after.length})`);
	const momentBefore = before.find((o) => o.id === berxSpatialId('moment', 5150))!;
	const momentAfter = after.find((o) => o.id === berxSpatialId('moment', 5150))!;
	if (momentAfter.transform.position.z === momentBefore.transform.position.z) {
		fail('scrubbing a month forward did not move a moment in depth');
	}
	if (momentAfter.energy !== 0 && momentBefore.energy !== 0) fail('an entity a month in the past is still live');
	/* the person is timeless and must not have moved with the cursor */
	const personBefore = before.find((o) => o.id === berxSpatialId('person', PERSON))!;
	const personAfter = after.find((o) => o.id === berxSpatialId('person', PERSON))!;
	if (personAfter.transform.position.z !== personBefore.transform.position.z) fail('a person drifted when the clock moved');

	/* ---- one world, and travelling does not replace it ---- */
	const nav = build();
	const total = nav.latestFrame.world.objects.length;
	if (!nav.travelTo(berxSpatialId('place', PLACE))) fail('travelling to a real place failed');
	if (nav.worldPosition.region !== 'place') fail('arriving at a place did not put the viewer in a place');
	if (nav.latestFrame.world.objects.length !== total) fail('travelling destroyed part of the world');
	/* let the journey finish before reading where it arrived: the pose
	   halfway through a flight is not where the viewer was standing */
	const settle = () => {
		for (let i = 0; i < 40; i++) nav.frame(0.05);
	};
	settle();
	const cameraAtPlace = {...nav.latestFrame.camera.position};
	if (!nav.travelTo(berxSpatialId('person', PERSON))) fail('travelling to a person failed');
	settle();
	if (nav.latestFrame.world.objects.length !== total) fail('a second journey destroyed part of the world');
	const cameraAtPerson = {...nav.latestFrame.camera.position};
	if (Math.hypot(cameraAtPerson.x - cameraAtPlace.x, cameraAtPerson.y - cameraAtPlace.y, cameraAtPerson.z - cameraAtPlace.z) < 0.5) {
		fail('travelling to a different entity did not move the camera');
	}
	if (!nav.back()) fail('there was nowhere to go back to');
	settle();
	const restored = nav.latestFrame.camera.position;
	if (Math.hypot(restored.x - cameraAtPlace.x, restored.y - cameraAtPlace.y, restored.z - cameraAtPlace.z) > 0.5) {
		fail(`going back did not restore where the viewer was standing (${JSON.stringify(restored)} vs ${JSON.stringify(cameraAtPlace)})`);
	}
	if (nav.worldPosition.region !== 'place' || nav.worldPosition.focusId !== berxSpatialId('place', PLACE)) {
		fail(`going back restored the camera but not the context (${nav.worldPosition.region}/${nav.worldPosition.focusId})`);
	}

	/* ---- Feed → Moment → Person → Place → Event → Experience is one graph ----
	   Not six domains in one scene: a path must exist through the
	   relations from a moment in the feed to an experience anchored at
	   the event at the place the person who posted it made. */
	const chain = build();
	chain.ingest([(() => {
		const mapped = mapExperienceToSpatial({
			id: 12, title: 'Прогулка по крышам', description: '',
			anchor: {type: 'event', guid: EVENT, title: 'Вечер импровизации', image_url: null},
			visibility: 'public', owner_guid: PERSON, is_own: false,
			scheduled_start: NOW_SECONDS, scheduled_end: null, my_status: null,
		});
		return {object: mapped.object, relations: mapped.relations};
	})()]);
	const graph = new Map<string, string[]>();
	for (const relation of chain.allRelations) {
		graph.set(relation.from, [...(graph.get(relation.from) ?? []), relation.to]);
		graph.set(relation.to, [...(graph.get(relation.to) ?? []), relation.from]);
	}
	const reach = (from: string, to: string): boolean => {
		const seen = new Set([from]);
		const queue = [from];
		while (queue.length > 0) {
			const at = queue.shift()!;
			if (at === to) return true;
			for (const next of graph.get(at) ?? []) {
				if (!seen.has(next)) {
					seen.add(next);
					queue.push(next);
				}
			}
		}
		return false;
	};
	const links: [string, string][] = [
		[berxSpatialId('moment', 5150), berxSpatialId('person', PERSON)],
		[berxSpatialId('person', PERSON), berxSpatialId('place', PLACE)],
		[berxSpatialId('place', PLACE), berxSpatialId('event', EVENT)],
		[berxSpatialId('event', EVENT), berxSpatialId('experience', 12)],
		/* and end to end, which is the point */
		[berxSpatialId('moment', 5150), berxSpatialId('experience', 12)],
	];
	for (const [from, to] of links) {
		if (!reach(from, to)) fail(`${from} and ${to} are in the same world but not in the same graph`);
	}

	/* ---- the world has a size and an edge ---- */
	const bounded = build();
	bounded.frame(0.02);
	const bounds = bounded.bounds;
	if (!(bounds.radius > 0)) fail('a world with entities in it has no size');
	/* fly straight out and keep going */
	for (let i = 0; i < 400; i++) {
		bounded.dispatch({kind: 'depth', amount: 12});
		bounded.frame(0.05);
	}
	const flown = bounded.latestFrame.camera.position;
	const outFrom = Math.hypot(flown.x - bounds.centre.x, flown.y - bounds.centre.y, flown.z - bounds.centre.z);
	if (outFrom > bounds.radius + 13) {
		fail(`the camera left the world behind (${outFrom.toFixed(1)} units out of a ${bounds.radius.toFixed(1)}-unit world)`);
	}
	if (bounded.latestFrame.world.objects.length !== a.length) fail('flying to the edge changed what the world contains');

	/* ---- being near something is a real measurement ---- */
	const proximity = build();
	proximity.frame(0.02);
	proximity.focus(berxSpatialId('place', PLACE));
	const withinReach = proximity.nearFocus(4).map((o) => o.id);
	const wide = proximity.nearFocus(100).map((o) => o.id);
	if (withinReach.includes(berxSpatialId('place', PLACE))) fail('an entity is near itself');
	if (wide.length <= withinReach.length) fail('a wider radius did not reach further');
	if (wide.length !== a.length - 1) fail(`a radius covering the whole world missed something (${wide.length} of ${a.length - 1})`);
	/* and it is ordered by real distance */
	const positions = new Map(proximity.latestFrame.world.objects.map((o) => [o.id, o.transform.position]));
	const from = positions.get(berxSpatialId('place', PLACE))!;
	let previous = -1;
	for (const id of wide) {
		const p = positions.get(id)!;
		const d = Math.hypot(p.x - from.x, p.y - from.y, p.z - from.z);
		if (d < previous - 1e-6) fail('what is near is not ordered by distance');
		previous = d;
	}

	/* ---- ingesting the same thing twice is one entity ---- */
	const dupe = build();
	const countBefore = dupe.latestFrame.world.objects.length;
	const again = mapNearbyPlaceToSpatial(
		{guid: PLACE, title: 'Дом Культуры', category: null, cover_url: null, distance_km: 0.2, moments: [], is_open_now: null},
		NOW_SECONDS * 1000,
	);
	dupe.ingest([{object: again.object, relations: again.relations, media: again.media}]);
	if (dupe.latestFrame.world.objects.length !== countBefore) {
		fail('the same place arriving from NOW created a second object');
	}
}
