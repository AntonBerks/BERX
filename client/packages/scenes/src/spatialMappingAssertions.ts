/**
 * Executable invariants for the data → world mapping.
 *
 * These do not check that the code ran; they check the two properties
 * the mapping exists to guarantee, using rows shaped exactly as the
 * API types declare them.
 *
 * **Shared spatial identity.** The same real thing reached by two
 * different routes must be one object in the world, not two that look
 * alike. Everything below that compares ids is testing that a
 * transition can be a movement of the camera rather than a cut between
 * screens.
 *
 * **Energy is earned.** An object emits BERX Energy only when the
 * server said something is live. A place with no live moments, an
 * event that has ended: zero, measured rather than assumed.
 */
import { BerxSpatialWorld } from '@berx/spatial';
import {
	berxSpatialId,
	mapConversationToSpatial,
	mapEventToSpatial,
	mapExperienceToSpatial,
	mapFeedItemToSpatial,
	mapNearbyEventToSpatial,
	mapNearbyPlaceToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
} from './spatialMapping';

const fail = (message: string): never => {
	throw new Error(`5D mapping invariant: ${message}`);
};

const PLACE_GUID = 4211;
const EVENT_GUID = 908;
const PERSON_GUID = 77;

const place = {
	guid: PLACE_GUID,
	title: 'Дом Культуры',
	description: '',
	category: 'venue',
	address: null,
	phone: null,
	website: null,
	hours: null,
	price: null,
	lat: null,
	lng: null,
	owner_guid: PERSON_GUID,
	cover_url: 'https://berx.example/covers/4211.jpg',
	rating: 0,
	rating_count: 0,
	is_saved: false,
	is_business: false,
	business_type: null,
	verified: false,
};

const nearbyPlaceQuiet = {
	guid: PLACE_GUID,
	title: 'Дом Культуры',
	category: 'venue',
	cover_url: null,
	distance_km: 0.4,
	moments: [],
	is_open_now: null,
};

const now = 1_800_000_000_000;
const nearbyPlaceLive = {
	...nearbyPlaceQuiet,
	moments: [{id: 5, text: 'сейчас играет квартет', ends_at: Math.floor(now / 1000) + 3600}],
};

const endedEvent = {
	guid: EVENT_GUID,
	title: 'Вечер импровизации',
	description: '',
	category: null,
	starts: 1,
	ends: 2,
	location: null,
	place: {guid: PLACE_GUID, title: 'Дом Культуры'},
	capacity: null,
	seats_left: null,
	attendee_count: 12,
	owner_guid: PERSON_GUID,
	cover_url: null,
	has_ended: true,
	is_going: false,
};

export function assertBerxSpatialMappingInvariants(): void {
	/* ---- one real thing, one identity ---- */
	const fromDetail = mapPlaceToSpatial(place).object;
	const fromNearby = mapNearbyPlaceToSpatial(nearbyPlaceQuiet, now).object;
	if (fromDetail.id !== fromNearby.id) {
		fail(`the same place is two objects: ${fromDetail.id} from its detail row, ${fromNearby.id} from NOW`);
	}
	if (fromDetail.id !== berxSpatialId('place', PLACE_GUID)) {
		fail(`place identity is not derived from the server guid (${fromDetail.id})`);
	}

	/* ---- Place ↔ Event, Place ↔ Experience, Feed → Person, Messages → Profile ---- */
	const event = mapEventToSpatial(endedEvent);
	const venue = event.relations.find((r) => r.type === 'located-at');
	if (!venue) fail('an event at a place carries no located-at relation');
	if (venue!.to !== fromDetail.id) fail(`the event's venue (${venue!.to}) is not the place object (${fromDetail.id})`);

	const nearbyEvent = mapNearbyEventToSpatial({guid: EVENT_GUID, title: 'Вечер импровизации', starts: 1, place_guid: PLACE_GUID, distance_km: 0.4});
	if (nearbyEvent.object.id !== event.object.id) fail('the same event is two objects between NOW and its detail row');
	if (nearbyEvent.relations[0]?.to !== fromDetail.id) fail("NOW's event does not point at the same place object");

	const experience = mapExperienceToSpatial({
		id: 12,
		title: 'Прогулка по крышам',
		description: '',
		anchor: {type: 'event', guid: EVENT_GUID, title: 'Вечер импровизации', image_url: null},
		visibility: 'public',
		owner_guid: PERSON_GUID,
		is_own: false,
		scheduled_start: 1,
		scheduled_end: null,
		my_status: null,
	});
	if (experience.relations[0]?.to !== event.object.id) {
		fail('an experience anchored to an event does not point at that event object');
	}

	const person = mapUserToSpatial({guid: PERSON_GUID, username: 'ann', fullname: 'Анна', email: '', icon_url: 'https://berx.example/i/77.jpg', profile_url: '', time_created: 0}).object;
	const moment = mapFeedItemToSpatial({guid: 5150, text: 'вечер удался', owner_guid: PERSON_GUID, owner_username: 'ann', time_created: 0});
	if (moment.relations[0]?.to !== person.id) fail('a moment does not point at the person who posted it');

	const conversation = mapConversationToSpatial({with_guid: PERSON_GUID, with_username: 'ann', last_message: 'до завтра', time: 0});
	if (conversation.relations[0]?.to !== person.id) fail('a conversation does not point at the person it is with');

	/* An owner the server did not name is not an edge to a person nobody
	   can see. */
	const anonymous = mapFeedItemToSpatial({guid: 5151, text: 'x', owner_guid: PERSON_GUID, owner_username: null, time_created: 0});
	if (anonymous.relations.length !== 0) fail('a moment with no named owner still claimed a created-by edge');

	/* ---- energy is earned, never decorative ---- */
	if (fromNearby.energy !== 0) fail(`a place with no live moments emits energy (${fromNearby.energy})`);
	if (mapNearbyPlaceToSpatial(nearbyPlaceLive, now).object.energy <= 0) fail('a place with a live moment emits nothing');
	/* a moment whose countdown has already run out is not live */
	if (mapNearbyPlaceToSpatial({...nearbyPlaceLive, moments: [{id: 5, text: 'x', ends_at: Math.floor(now / 1000) - 60}]}, now).object.energy !== 0) {
		fail('an expired moment still counted as live');
	}
	if (event.object.energy !== 0) fail(`an event that has ended emits energy (${event.object.energy})`);
	if (person.energy !== 0) fail('a person emits energy with no signal behind it');

	/* ---- semantic form, not one shape for everything ---- */
	const message = conversation.object.transform.scale;
	const placeScale = fromDetail.transform.scale;
	if (message.x === placeScale.x && message.y === placeScale.y && message.z === placeScale.z) {
		fail('a message and a place are the same shape');
	}

	/* ---- the world holds one of each, and its relations resolve ---- */
	const world = new BerxSpatialWorld();
	for (const mapping of [mapPlaceToSpatial(place), mapNearbyPlaceToSpatial(nearbyPlaceLive, now), event, nearbyEvent, moment, conversation, {object: person, media: [], relations: []}]) {
		world.upsertObject(mapping.object);
	}
	for (const mapping of [event, nearbyEvent, moment, conversation]) {
		for (const relation of mapping.relations) world.addRelation(relation);
	}
	const snapshot = world.snapshot();
	const ids = new Set(snapshot.objects.map((o) => o.id));
	if (ids.size !== snapshot.objects.length) fail('the world holds duplicate identities');
	/* the place was registered twice, through two different mappers */
	if (snapshot.objects.filter((o) => o.id === fromDetail.id).length !== 1) fail('registering a place twice produced two objects');
	for (const relation of snapshot.relations) {
		if (!ids.has(relation.from) || !ids.has(relation.to)) fail(`relation ${relation.id} points outside the world`);
	}
	if (world.relatedTo(fromDetail.id).every((o) => o.id !== event.object.id)) {
		fail('the place does not know about the event happening at it');
	}

	/* ---- real media only ---- */
	const withCover = mapPlaceToSpatial(place);
	if (withCover.media.length !== 1 || withCover.media[0].uri !== place.cover_url) fail('a real cover url did not become a media surface');
	if (mapNearbyPlaceToSpatial(nearbyPlaceQuiet, now).media.length !== 0) fail('a place with no cover was given media anyway');
}
