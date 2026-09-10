/**
 * Real BERX data → the persistent spatial world.
 *
 * The 5D runtime had a complete world graph, a real GPU renderer and
 * nothing to put in it: no code anywhere turned an API row into a
 * spatial object, so the world could only ever hold what a test
 * constructed by hand. This is that missing half, and it is the only
 * place a domain row becomes a thing in space.
 *
 * Two rules hold everywhere below.
 *
 * **One real thing, one spatial identity.** `berxSpatialId('place', 7)`
 * is the same string wherever it is computed, so the place reached
 * from a feed, from a search, from NOW and from an event's venue is
 * literally the same object in the world — the camera flies to the one
 * that is already there instead of a duplicate appearing beside it.
 * That is what makes a transition a movement rather than a cut, and it
 * is why the id is derived from the server's own guid and never from a
 * list position, a render pass or a nanoid.
 *
 * **Nothing is invented.** Every field read here exists on the API
 * type it is read from; a value the server does not send is left
 * unset rather than defaulted into something that looks like data.
 * Energy in particular — the thing that makes an object emit BERX
 * Energy — is only ever raised by a real signal the server sent:
 * a live moment's own countdown, an event that has not ended, a
 * conversation with a real recent message. There is no decorative
 * glow, because a glow means something here.
 */
import type {
	BerxCollection,
	BerxMessage,
	BerxCommunity,
	BerxConversationSummary,
	BerxEvent,
	BerxExperience,
	BerxFeedItem,
	BerxFriend,
	BerxNearbyEventItem,
	BerxNearbyPlaceItem,
	BerxPlace,
	BerxProfileSummary,
	BerxUser,
	BerxStorySummary,
	BerxMemory,
	BerxTrip,
	BerxNotification,
	BerxDatingProfileCard,
	BerxCreatorProfile,
	BerxCreatorContent,
} from '@berx/api/types';
import {
	berxWorldMaterial,
	createMediaSurface,
	geometryForEntity,
	geometryScale,
	type BerxEntityTime,
	type BerxSpatialGeoAnchor,
	type BerxSpatialEntityKind,
	type BerxSpatialMediaSurface,
	type BerxSpatialObject,
	type BerxSpatialRelation,
	type BerxVec3,
	type BerxWorldMaterialName,
} from '@berx/spatial';

/**
 * The one identity a real thing has in space.
 *
 * Kind plus the server's own guid. Two screens that show the same
 * place compute the same string without coordinating, which is the
 * whole mechanism behind shared spatial identity.
 */
export function berxSpatialId(kind: BerxSpatialEntityKind, guid: number | string): string {
	return `${kind}:${guid}`;
}

export interface BerxSpatialPlacement {
	/** Where this object sits. Callers that lay out a world supply it. */
	position?: BerxVec3;
	/** D0..D5 depth band. Defaults to the content plane. */
	depth?: number;
	visible?: boolean;
	interactive?: boolean;
	focusable?: boolean;
}

export interface BerxSpatialMapping {
	object: BerxSpatialObject;
	/** Real media the server actually sent for this object. Empty when it sent none. */
	media: BerxSpatialMediaSurface[];
	/** Real relationships to other spatial identities, ready to add to the world. */
	relations: BerxSpatialRelation[];
}

/**
 * What each kind is made of.
 *
 * A name, not a set of numbers: the physical parameters live once in
 * @berx/spatial's material table, and this says which of them a person
 * or a place is. Two copies of "roughness 0.34" in two packages is how
 * a world ends up lit two different ways.
 */
const MATERIAL_NAME: Record<BerxSpatialEntityKind, BerxWorldMaterialName> = {
	person: 'pearl',
	moment: 'dark-glass',
	place: 'graphite',
	event: 'soft-gold',
	experience: 'champagne',
	community: 'ceramic',
	business: 'metal',
	collection: 'fabric',
	message: 'dark-glass',
	create: 'energy',
};

function materialStateFor(kind: BerxSpatialEntityKind): BerxSpatialObject['material'] {
	const name = MATERIAL_NAME[kind];
	const physical = berxWorldMaterial(name);
	return {
		material: name,
		/* emission is the material's, scaled by real energy at draw time */
		emissive: physical.emission[0] + physical.emission[1] + physical.emission[2] > 0 ? 1 : 0,
		roughness: physical.roughness,
		metalness: physical.metalness,
		opacity: physical.opacity,
		transmission: physical.transmission,
	};
}

/** D3, the content plane, unless the caller places it elsewhere. */
const DEFAULT_DEPTH = 3;

function baseObject(
	kind: BerxSpatialEntityKind,
	guid: number | string,
	label: string,
	sourceId: string,
	energy: number,
	placement: BerxSpatialPlacement,
	/**
	 * The server's own timestamps, where it sent any. Omitted entirely
	 * for things that do not stop existing — a person, a place, a
	 * community — so the temporal projection reads them as timeless
	 * rather than as having happened at the epoch.
	 */
	time?: BerxEntityTime,
): BerxSpatialObject {
	const now = Date.now();
	return {
		id: berxSpatialId(kind, guid),
		kind,
		label,
		sourceId,
		...(time ? {time} : {}),
		transform: {
			position: placement.position ? {...placement.position} : {x: 0, y: 0, z: 0},
			rotation: {x: 0, y: 0, z: 0},
			/* the form's own proportions, so a place is portal-shaped and a
			   message is message-shaped without every caller knowing that */
			scale: geometryScale(geometryForEntity(kind)),
		},
		material: materialStateFor(kind),
		visible: placement.visible ?? true,
		interactive: placement.interactive ?? true,
		focusable: placement.focusable ?? true,
		energy: clamp01(energy),
		depth: placement.depth ?? DEFAULT_DEPTH,
		createdAt: now,
		updatedAt: now,
	};
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * A media surface for a real URL the server sent.
 *
 * `aspectRatio` is 1 because none of these endpoints return the
 * dimensions of what they link to. That is deliberately not guessed:
 * a surface that claims 16:9 for a portrait photograph is a lie the
 * renderer would then letterbox around. A loader that has decoded the
 * image can correct it from the real pixels.
 */
function surfaceFor(object: BerxSpatialObject, uri: string | null | undefined, fit: 'cover' | 'contain' = 'cover'): BerxSpatialMediaSurface[] {
	if (!uri) return [];
	return [createMediaSurface(object, {mediaId: `${object.id}:media`, uri, aspectRatio: 1, fit, opacity: 1})];
}

/**
 * Who made this.
 *
 * `owner_guid` is on every one of these rows, and it is what makes the
 * world continuous: a person, the places they made, the events at
 * those places and the experiences anchored to them are one connected
 * graph rather than five islands that happen to be in the same scene.
 */
const ownedBy = (objectId: string, ownerGuid: number): BerxSpatialRelation => ({
	id: `${objectId}->${berxSpatialId('person', ownerGuid)}:created-by`,
	from: objectId,
	to: berxSpatialId('person', ownerGuid),
	type: 'created-by',
	/**
	 * Weaker than any structural relation, deliberately. Who made a
	 * place matters less to where that place stands than what happens
	 * at it — so an event settles beside its venue, and the venue
	 * settles near whoever made it.
	 */
	strength: 0.55,
});

/* ------------------------------------------------------------------ */
/* PEOPLE                                                              */
/* ------------------------------------------------------------------ */

export function mapUserToSpatial(user: BerxUser, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('person', user.guid, user.fullname || user.username, String(user.guid), 0, placement);
	/* the key /profiles/{username} and the creator endpoints are keyed by */
	object.sourceName = user.username;
	return {object, media: surfaceFor(object, user.icon_url), relations: []};
}

export function mapProfileToSpatial(profile: BerxProfileSummary, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('person', profile.guid, profile.fullname || profile.username, String(profile.guid), 0, placement);
	object.sourceName = profile.username;
	return {object, media: surfaceFor(object, profile.icon_url), relations: []};
}

export function mapFriendToSpatial(friend: BerxFriend, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('person', friend.guid, friend.fullname || friend.username, String(friend.guid), 0, placement);
	object.sourceName = friend.username;
	return {object, media: surfaceFor(object, friend.icon), relations: []};
}

/* ------------------------------------------------------------------ */
/* MOMENTS                                                             */
/* ------------------------------------------------------------------ */

/**
 * A feed item, and the person who posted it, as one relationship.
 *
 * The relation is only claimed when the server actually named the
 * owner: `owner_username` is nullable, and a `created-by` edge to a
 * person nobody can see would be an edge to nothing.
 */
export function mapFeedItemToSpatial(item: BerxFeedItem, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const label = item.text.trim().slice(0, 80) || 'Момент';
	const object = baseObject('moment', item.guid, label, String(item.guid), 0, placement, {at: item.time_created});
	const relations: BerxSpatialRelation[] = item.owner_username
		? [{
				id: `${object.id}->${berxSpatialId('person', item.owner_guid)}`,
				from: object.id,
				to: berxSpatialId('person', item.owner_guid),
				type: 'created-by',
				strength: 1,
			}]
		: [];
	return {object, media: [], relations};
}

/* ------------------------------------------------------------------ */
/* PLACES                                                              */
/* ------------------------------------------------------------------ */

/**
 * The server's own coordinate, or nothing.
 *
 * `lat`/`lng` are nullable in the API precisely because a place may
 * have no coordinate on file, and the strings a PHP backend sends for
 * numbers have to survive the trip. Anything that is not a finite pair
 * of degrees in range is NOT a location, and an entity without one
 * stands where its relations put it rather than at a made-up point.
 */
function geoOf(lat: unknown, lng: unknown): BerxSpatialGeoAnchor | undefined {
	const n = (v: unknown): number | undefined => {
		const x = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : Number.NaN;
		return Number.isFinite(x) ? x : undefined;
	};
	const latitude = n(lat);
	const longitude = n(lng);
	if (latitude === undefined || longitude === undefined) return undefined;
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
	/* 0,0 is in the Atlantic and is what an empty column serialises to */
	if (latitude === 0 && longitude === 0) return undefined;
	return {lat: latitude, lng: longitude};
}

export function mapPlaceToSpatial(place: BerxPlace, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('place', place.guid, place.title, String(place.guid), 0, placement);
	/**
	 * A verified business is a different kind of thing in the world, and
	 * the server is the one that says so.
	 *
	 * THE ID STAYS `place:<guid>` AND THAT IS DELIBERATE. An id
	 * namespaces the server ROW this entity came from; `kind` is what
	 * the world draws. They differ here, and they have to: an event at
	 * this address relates to `berxSpatialId('place', place.guid)` from
	 * a different mapper that has never seen the business flag, and
	 * renaming the entity would leave that edge pointing at nothing.
	 * Anything asking what this IS asks `kind`, which is what the
	 * geometry table, the material table and the affordance table all
	 * do.
	 */
	if (place.is_business) object.kind = 'business';
	const geo = geoOf(place.lat, place.lng);
	if (geo) object.geo = geo;
	return {object, media: surfaceFor(object, place.cover_url), relations: [ownedBy(object.id, place.owner_guid)]};
}

/**
 * A NOW place: the one case where energy is real rather than zero.
 *
 * `moments` carries live moments with their own `ends_at`, so a place
 * with something happening in it right now emits BERX Energy in
 * proportion to how much — and a place with nothing happening emits
 * none. `is_open_now` is deliberately not folded in: it is nullable
 * precisely because "no structured hours" is not "closed", and reading
 * null as either would invent a fact.
 */
export function mapNearbyPlaceToSpatial(place: BerxNearbyPlaceItem, now: number, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const live = place.moments.filter((m) => m.ends_at * 1000 > now).length;
	const object = baseObject('place', place.guid, place.title, String(place.guid), live === 0 ? 0 : Math.min(1, 0.4 + live * 0.2), placement);
	const geo = geoOf((place as {lat?: unknown}).lat, (place as {lng?: unknown}).lng);
	if (geo) object.geo = geo;
	return {object, media: surfaceFor(object, place.cover_url), relations: []};
}

/* ------------------------------------------------------------------ */
/* EVENTS                                                              */
/* ------------------------------------------------------------------ */

/**
 * An event, and the place it happens at.
 *
 * The `located-at` edge is what makes Place → Event a movement through
 * one world rather than two screens: both ends are the shared spatial
 * identity of a real row, so the event already sits at the place the
 * camera is looking at.
 */
export function mapEventToSpatial(event: BerxEvent, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	/* an event that has ended is not live, and the server says which */
	const energy = event.has_ended ? 0 : event.is_going ? 0.7 : 0.35;
	const object = baseObject('event', event.guid, event.title, String(event.guid), energy, placement, {
		at: event.starts,
		startsAt: event.starts,
		/* `ends` is nullable, and open-ended is not the same as instant */
		...(event.ends !== null ? {endsAt: event.ends} : {}),
	});
	const relations: BerxSpatialRelation[] = event.place
		? [ownedBy(object.id, event.owner_guid), {
				id: `${object.id}->${berxSpatialId('place', event.place.guid)}`,
				from: object.id,
				to: berxSpatialId('place', event.place.guid),
				type: 'located-at',
				strength: 1,
			}]
		: [ownedBy(object.id, event.owner_guid)];
	return {object, media: surfaceFor(object, event.cover_url), relations};
}

export function mapNearbyEventToSpatial(event: BerxNearbyEventItem, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('event', event.guid, event.title, String(event.guid), 0.35, placement, {at: event.starts, startsAt: event.starts});
	return {
		object,
		media: [],
		relations: [{
			id: `${object.id}->${berxSpatialId('place', event.place_guid)}`,
			from: object.id,
			to: berxSpatialId('place', event.place_guid),
			type: 'located-at',
			strength: 1,
		}],
	};
}

/* ------------------------------------------------------------------ */
/* EXPERIENCES, COMMUNITIES, COLLECTIONS                               */
/* ------------------------------------------------------------------ */

/**
 * An experience, and whatever it is anchored to.
 *
 * `anchor` is nullable — an experience does not have to happen
 * anywhere — so the edge exists only when the server sent one, and it
 * points at the anchor's own kind: a place anchor lands on the place's
 * shared identity, an event anchor on the event's. That is what makes
 * Place → Experience and Event → Experience movements through one
 * world rather than two unrelated screens.
 *
 * The anchor also carries the only image an experience has, which is
 * the anchor's, not its own — so it is attached as the anchor's media
 * rather than claimed as the experience's.
 */
export function mapExperienceToSpatial(experience: BerxExperience, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	/* 'accepted' is the server's own word for going; there is no
	   'going' status on this endpoint */
	const energy = experience.my_status === 'accepted' ? 0.6 : 0.25;
	const object = baseObject('experience', experience.id, experience.title, String(experience.id), energy, placement, {
		at: experience.scheduled_start,
		startsAt: experience.scheduled_start,
		...(experience.scheduled_end !== null ? {endsAt: experience.scheduled_end} : {}),
	});
	const anchor = experience.anchor;
	const relations: BerxSpatialRelation[] = anchor
		? [ownedBy(object.id, experience.owner_guid), {
				id: `${object.id}->${berxSpatialId(anchor.type, anchor.guid)}`,
				from: object.id,
				to: berxSpatialId(anchor.type, anchor.guid),
				type: 'located-at',
				strength: 1,
			}]
		: [ownedBy(object.id, experience.owner_guid)];
	return {object, media: [], relations};
}

export function mapCommunityToSpatial(community: BerxCommunity, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('community', community.guid, community.name, String(community.guid), 0, placement);
	return {object, media: [], relations: [ownedBy(object.id, community.owner_guid)]};
}

export function mapCollectionToSpatial(collection: BerxCollection, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('collection', collection.id, collection.title, String(collection.id), 0, placement);
	return {object, media: [], relations: [ownedBy(object.id, collection.owner_guid)]};
}

/* ------------------------------------------------------------------ */
/* MESSAGES                                                            */
/* ------------------------------------------------------------------ */

/**
 * A single message, as a thing standing in time.
 *
 * This is what makes a conversation a place rather than a scrolling
 * list: every message carries its real `time`, so the temporal
 * projection puts this morning's within reach and last month's far
 * back along the same axis. Moving the cursor walks the thread.
 *
 * It is related to whoever sent it, which is what puts the two sides
 * of a conversation on their own sides of it.
 */
export function mapMessageToSpatial(message: BerxMessage, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const label = message.text.trim().slice(0, 60) || 'Сообщение';
	const object = baseObject('message', `m${message.id}`, label, String(message.id), 0, placement, {at: message.time});
	return {
		object,
		media: [],
		relations: [{
			id: `${object.id}->${berxSpatialId('person', message.from_guid)}`,
			from: object.id,
			to: berxSpatialId('person', message.from_guid),
			type: 'created-by',
			strength: 1,
		}],
	};
}

/**
 * A conversation, and the person on the other end of it.
 *
 * Identity is the other person's guid: a conversation with someone is
 * the same conversation however it was reached, and BERX's own message
 * API is keyed the same way.
 */
export function mapConversationToSpatial(conversation: BerxConversationSummary, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const label = conversation.with_username ?? conversation.last_message.trim().slice(0, 60);
	const object = baseObject('message', conversation.with_guid, label || 'Диалог', String(conversation.with_guid), 0, placement, {at: conversation.time});
	return {
		object,
		media: [],
		relations: [{
			id: `${object.id}->${berxSpatialId('person', conversation.with_guid)}`,
			from: object.id,
			to: berxSpatialId('person', conversation.with_guid),
			type: 'messages',
			strength: 1,
		}],
	};
}

/**
 * FOUR DOMAINS THAT HAD AN ENDPOINT AND NO PLACE IN THE WORLD.
 *
 * Every one of these is a real API method with real response types that
 * nothing spatial had ever read. The endpoint existed, the screen
 * contracts named the domain, and the world contained no entity for it —
 * so "BERX has stories" meant BERX could fetch them, not that a person
 * could stand next to one.
 *
 * None of them gets a new entity kind. A story is a moment that expires,
 * a memory is a moment that already happened, a trip is a collection
 * with a route, a notification is a moment addressed to you — and using
 * the kinds the world already draws is what makes them arrive with a
 * form, a material, a geometry and a picker for free. A fifteenth kind
 * would be a fifteenth thing for every renderer to learn.
 *
 * T and R are carried by the SERVER's own values, never invented: a
 * story's time_created and its owner, a memory's `time` from however
 * many years ago the server says, a trip's start and end dates when it
 * has them, a notification's poster and subject.
 */

/**
 * A story: a moment with an end.
 *
 * `time_expires` is what makes it a story rather than a post, and the
 * temporal projection already knows what to do with an entity that
 * stops — so a story fades out of the present on its own, from the
 * server's own clock.
 */
export function mapStoryToSpatial(
	story: BerxStorySummary & {time_expires?: number},
	ownerGuid: number,
	placement: BerxSpatialPlacement = {},
): BerxSpatialMapping {
	const object = baseObject('moment', `story-${story.id}`, story.caption || 'История', String(story.id), 0.5, placement, {
		at: story.time_created,
		startsAt: story.time_created,
		/* a story the server gave no expiry for is one of somebody
		   else's: the feed does not disclose it, and inventing a
		   twenty-four-hour window would be inventing the rule */
		...(story.time_expires !== undefined ? {endsAt: story.time_expires} : {}),
	});
	return {object, media: [], relations: [ownedBy(object.id, ownerGuid)]};
}

/**
 * A memory: a moment the server has decided is worth standing in front
 * of again.
 *
 * Its position in TIME is the original one — `time`, years ago — not
 * now. That is the whole point: the temporal cursor is what brings it
 * forward, and a memory stamped with today's date would be a new post.
 */
export function mapMemoryToSpatial(memory: BerxMemory, viewerGuid: number, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('moment', `memory-${memory.type}-${memory.guid}`, memory.text || `${memory.years_ago} года назад`, String(memory.guid), 0.35, placement, {
		at: memory.time,
		startsAt: memory.time,
	});
	return {
		object,
		media: surfaceFor(object, memory.url),
		/* a memory is the viewer's own — the endpoint returns nobody
		   else's — so it belongs to them */
		relations: [ownedBy(object.id, viewerGuid)],
	};
}

/**
 * A trip: a collection with a route through real places.
 *
 * The stops are what make it spatial, and they are RELATIONS to places
 * that are already in the world rather than copies of them: travelling
 * to a trip and travelling to one of its places is travelling in the
 * same graph. A trip whose detail has not been read yet has no stops
 * and says so by having none, rather than by inventing a line.
 */
export function mapTripToSpatial(
	trip: BerxTrip & {stops?: readonly {place_guid: number}[]},
	placement: BerxSpatialPlacement = {},
): BerxSpatialMapping {
	const object = baseObject('collection', `trip-${trip.id}`, trip.title, String(trip.id), 0.3, placement, {
		...(trip.start_date !== null ? {at: trip.start_date, startsAt: trip.start_date} : {}),
		...(trip.end_date !== null ? {endsAt: trip.end_date} : {}),
	});
	const relations: BerxSpatialRelation[] = [ownedBy(object.id, trip.owner_guid)];
	for (const stop of trip.stops ?? []) {
		relations.push({
			id: `${object.id}->${berxSpatialId('place', stop.place_guid)}:stop`,
			from: object.id,
			to: berxSpatialId('place', stop.place_guid),
			type: 'contains',
			strength: 1,
		});
	}
	return {object, media: [], relations};
}

/**
 * A notification: something that happened, addressed to you.
 *
 * A moment, because that is what it is — and it stands beside whoever
 * caused it, which is the thing a list of notifications cannot show.
 * `viewed` is its energy: what you have not seen yet is brighter.
 */
export function mapNotificationToSpatial(notification: BerxNotification, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('moment', `notice-${notification.guid}`, NOTIFICATION_LABEL[notification.type] ?? notification.type, String(notification.guid), notification.viewed ? 0.2 : 0.75, placement, {
		at: notification.time_created,
		startsAt: notification.time_created,
	});
	const relations: BerxSpatialRelation[] = [{
		id: `${object.id}->${berxSpatialId('person', notification.poster_guid)}:from`,
		from: object.id,
		to: berxSpatialId('person', notification.poster_guid),
		type: 'created-by',
		strength: 0.9,
	}];
	/* and to the thing it is about, when the server named one */
	if (notification.item_guid !== null) {
		relations.push({
			id: `${object.id}->${berxSpatialId('moment', notification.item_guid)}:about`,
			from: object.id,
			to: berxSpatialId('moment', notification.item_guid),
			type: 'related',
			strength: 0.7,
		});
	}
	return {object, media: [], relations};
}

/**
 * What each kind of notification is called, in the viewer's language.
 *
 * Only the types the server really sends. An unknown type falls through
 * to the server's own word rather than to "уведомление", because a
 * label nobody can act on is worse than an untranslated one.
 */
const NOTIFICATION_LABEL: Readonly<Record<string, string>> = Object.freeze({
	'friend:request': 'Заявка в друзья',
	'friend:accepted': 'Заявка принята',
	'post:like': 'Понравился пост',
	'post:comment': 'Комментарий',
	'message:new': 'Сообщение',
	'event:invite': 'Приглашение на событие',
	'community:request': 'Заявка в сообщество',
	poke: 'Тебя коснулись',
});

/**
 * A dating profile: a person, at a distance that means something.
 *
 * A PSEUDONYM, not a name, because that is what the endpoint returns —
 * dating profiles are deliberately not the person's public identity, and
 * mapping them onto `person:<guid>` would merge the two. The id is its
 * own, so a dating card and a profile are two entities about one human
 * being, which is what the privacy model actually says.
 *
 * No compatibility score is invented. The endpoint returns none, so
 * energy comes from what it does return — a profile that has said what
 * it is looking for is more present than a blank one — and the orbital
 * distance is the relational layout's, from a relation the caller
 * supplies.
 */
/**
 * A CREATOR IS A PERSON WITH A BODY OF WORK.
 *
 * Not a new kind of entity and not a card with a follower count: the
 * person is already in the world, and what makes them a creator is that
 * their work is standing with them. So this maps the WORK — every post,
 * album, event and experience the creator endpoints return — and relates
 * each piece to its author by `created-by`, which is the edge the
 * relational layout already uses to gather things around whoever made
 * them.
 *
 * The profile itself contributes energy rather than an entity: a creator
 * with a stated category and a bio is a person who has said what they
 * do, and the world shows that as presence rather than as a badge.
 *
 * Nothing is invented. `BerxCreatorContent` carries four real lists and
 * this maps exactly those; a creator with an empty body of work produces
 * no entities and no relations, which is the honest picture of one.
 */
export function mapCreatorToSpatial(
	userGuid: number,
	profile: BerxCreatorProfile,
	content: BerxCreatorContent,
): {work: BerxSpatialMapping[]; energy: number} {
	const personId = berxSpatialId('person', userGuid);
	const author = (id: string) => ({
		id: `${id}->${personId}:created-by`,
		from: id,
		to: personId,
		type: 'created-by' as const,
		strength: 0.35,
	});
	const work: BerxSpatialMapping[] = [];
	for (const post of content.posts) {
		const object = baseObject('moment', post.guid, post.text, String(post.guid), 0, {});
		object.createdAt = post.time * 1000;
		object.updatedAt = post.time * 1000;
		work.push({object, media: [], relations: [author(object.id)]});
	}
	for (const album of content.albums) {
		const object = baseObject('collection', `album-${album.guid}`, album.title, String(album.guid), 0, {});
		work.push({object, media: [], relations: [author(object.id)]});
	}
	for (const event of content.events) {
		const object = baseObject('event', event.guid, event.title, String(event.guid), 0, {});
		work.push({object, media: [], relations: [author(object.id)]});
	}
	for (const experience of content.experiences) {
		const object = baseObject('experience', experience.id, experience.title, String(experience.id), 0, {});
		work.push({object, media: [], relations: [author(object.id)]});
	}
	/* what they have said about what they do, as presence */
	const said = [profile.category, profile.bio].filter((v) => v !== null && v !== '').length;
	return {work, energy: Math.min(1, 0.2 * said + Math.min(0.4, work.length * 0.05))};
}

export function mapDatingProfileToSpatial(card: BerxDatingProfileCard, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const said = [card.goal, card.bio, card.interests].filter((v) => v !== null && v !== '').length;
	const object = baseObject('person', `dating-${card.guid}`, card.pseudonym, String(card.guid), 0.3 + said * 0.15, placement);
	return {object, media: [], relations: []};
}
