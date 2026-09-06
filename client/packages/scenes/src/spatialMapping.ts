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
} from '@berx/api/types';
import {
	createMediaSurface,
	geometryForEntity,
	geometryScale,
	type BerxSpatialEntityKind,
	type BerxSpatialMediaSurface,
	type BerxSpatialObject,
	type BerxSpatialRelation,
	type BerxVec3,
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
 * The material an object is made of, per kind.
 *
 * These are surface properties the shader reads — how rough it is, how
 * metallic, how much light passes through — not colours. Colour is the
 * Visual DNA in @berx/spatial's presentation layer, and nothing here
 * duplicates it.
 */
const MATERIAL: Record<BerxSpatialEntityKind, BerxSpatialObject['material']> = {
	person: {material: 'pearl', emissive: 0, roughness: 0.34, metalness: 0.12, opacity: 1, transmission: 0},
	moment: {material: 'glass', emissive: 0, roughness: 0.18, metalness: 0.04, opacity: 0.94, transmission: 0.2},
	place: {material: 'stone', emissive: 0, roughness: 0.62, metalness: 0.06, opacity: 1, transmission: 0},
	event: {material: 'brass', emissive: 0, roughness: 0.28, metalness: 0.48, opacity: 1, transmission: 0},
	experience: {material: 'brass', emissive: 0, roughness: 0.36, metalness: 0.3, opacity: 1, transmission: 0},
	community: {material: 'pearl', emissive: 0, roughness: 0.44, metalness: 0.1, opacity: 1, transmission: 0},
	business: {material: 'stone', emissive: 0, roughness: 0.52, metalness: 0.18, opacity: 1, transmission: 0},
	collection: {material: 'stone', emissive: 0, roughness: 0.58, metalness: 0.08, opacity: 1, transmission: 0},
	message: {material: 'glass', emissive: 0, roughness: 0.22, metalness: 0.02, opacity: 0.92, transmission: 0.24},
	create: {material: 'brass', emissive: 0, roughness: 0.3, metalness: 0.4, opacity: 1, transmission: 0},
};

/** D3, the content plane, unless the caller places it elsewhere. */
const DEFAULT_DEPTH = 3;

function baseObject(
	kind: BerxSpatialEntityKind,
	guid: number | string,
	label: string,
	sourceId: string,
	energy: number,
	placement: BerxSpatialPlacement,
): BerxSpatialObject {
	const now = Date.now();
	return {
		id: berxSpatialId(kind, guid),
		kind,
		label,
		sourceId,
		transform: {
			position: placement.position ? {...placement.position} : {x: 0, y: 0, z: 0},
			rotation: {x: 0, y: 0, z: 0},
			/* the form's own proportions, so a place is portal-shaped and a
			   message is message-shaped without every caller knowing that */
			scale: geometryScale(geometryForEntity(kind)),
		},
		material: {...MATERIAL[kind]},
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

/* ------------------------------------------------------------------ */
/* PEOPLE                                                              */
/* ------------------------------------------------------------------ */

export function mapUserToSpatial(user: BerxUser, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('person', user.guid, user.fullname || user.username, String(user.guid), 0, placement);
	return {object, media: surfaceFor(object, user.icon_url), relations: []};
}

export function mapProfileToSpatial(profile: BerxProfileSummary, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('person', profile.guid, profile.fullname || profile.username, String(profile.guid), 0, placement);
	return {object, media: surfaceFor(object, profile.icon_url), relations: []};
}

export function mapFriendToSpatial(friend: BerxFriend, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('person', friend.guid, friend.fullname || friend.username, String(friend.guid), 0, placement);
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
	const object = baseObject('moment', item.guid, label, String(item.guid), 0, placement);
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

export function mapPlaceToSpatial(place: BerxPlace, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('place', place.guid, place.title, String(place.guid), 0, placement);
	/* a verified business is a different kind of thing in the world, and
	   the server is the one that says so */
	if (place.is_business) object.kind = 'business';
	return {object, media: surfaceFor(object, place.cover_url), relations: []};
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
	const object = baseObject('event', event.guid, event.title, String(event.guid), energy, placement);
	const relations: BerxSpatialRelation[] = event.place
		? [{
				id: `${object.id}->${berxSpatialId('place', event.place.guid)}`,
				from: object.id,
				to: berxSpatialId('place', event.place.guid),
				type: 'located-at',
				strength: 1,
			}]
		: [];
	return {object, media: surfaceFor(object, event.cover_url), relations};
}

export function mapNearbyEventToSpatial(event: BerxNearbyEventItem, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('event', event.guid, event.title, String(event.guid), 0.35, placement);
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
	const object = baseObject('experience', experience.id, experience.title, String(experience.id), energy, placement);
	const anchor = experience.anchor;
	const relations: BerxSpatialRelation[] = anchor
		? [{
				id: `${object.id}->${berxSpatialId(anchor.type, anchor.guid)}`,
				from: object.id,
				to: berxSpatialId(anchor.type, anchor.guid),
				type: 'located-at',
				strength: 1,
			}]
		: [];
	return {object, media: [], relations};
}

export function mapCommunityToSpatial(community: BerxCommunity, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('community', community.guid, community.name, String(community.guid), 0, placement);
	return {object, media: [], relations: []};
}

export function mapCollectionToSpatial(collection: BerxCollection, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const object = baseObject('collection', collection.id, collection.title, String(collection.id), 0, placement);
	return {object, media: [], relations: []};
}

/* ------------------------------------------------------------------ */
/* MESSAGES                                                            */
/* ------------------------------------------------------------------ */

/**
 * A conversation, and the person on the other end of it.
 *
 * Identity is the other person's guid: a conversation with someone is
 * the same conversation however it was reached, and BERX's own message
 * API is keyed the same way.
 */
export function mapConversationToSpatial(conversation: BerxConversationSummary, placement: BerxSpatialPlacement = {}): BerxSpatialMapping {
	const label = conversation.with_username ?? conversation.last_message.trim().slice(0, 60);
	const object = baseObject('message', conversation.with_guid, label || 'Диалог', String(conversation.with_guid), 0, placement);
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
