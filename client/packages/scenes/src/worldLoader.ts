/**
 * Filling the world from the real BERX API.
 *
 * Every read here is a method that exists on BerxApiClient, which is
 * itself one method per endpoint that exists in
 * components/OssnApi/v1/. Nothing is invented, and a read that fails
 * is recorded as a failure rather than replaced with something that
 * looks like data — a world missing the places it could not fetch is
 * honest; a world containing places nobody posted is not.
 *
 * The loads are independent on purpose. A dead conversations endpoint
 * must not empty the world of people, so each read stands or falls on
 * its own and the world gets whatever actually arrived.
 */
import type {BerxApiClient} from '@berx/api/client';
import type {BerxWorldIngest} from '@berx/spatial';
import {
	berxSpatialId,
	mapConversationToSpatial,
	mapMessageToSpatial,
	mapEventToSpatial,
	mapFeedItemToSpatial,
	mapFriendToSpatial,
	mapNearbyEventToSpatial,
	mapNearbyPlaceToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
	type BerxSpatialMapping,
} from './spatialMapping';

export interface BerxWorldLoadFailure {
	/** The api method that did not answer. */
	source: string;
	message: string;
}

export interface BerxWorldLoad {
	entries: BerxWorldIngest[];
	/** The signed-in person's spatial identity, when `me` answered. */
	viewerId?: string;
	/** What did not load, named. The world says so rather than pretending. */
	failures: BerxWorldLoadFailure[];
}

const toEntry = (mapping: BerxSpatialMapping): BerxWorldIngest => ({
	object: mapping.object,
	relations: mapping.relations,
	media: mapping.media,
});

/**
 * A relation the API states by adjacency rather than by an edge.
 *
 * The feed's items belong to their authors, the conversations belong
 * to the people in them, and the viewer's friends are related to the
 * viewer — these are real facts from real responses, expressed as the
 * edges that place them in space.
 */
const relation = (from: string, to: string, type: BerxWorldIngest['relations'] extends readonly (infer R)[] | undefined ? R extends {type: infer T} ? T : never : never, strength: number) => ({
	id: `${from}->${to}:${type}`,
	from,
	to,
	type,
	strength,
});

export interface BerxWorldLoadOptions {
	/** How much of the feed to bring in. The endpoint's own limit/offset. */
	feedLimit?: number;
	/**
	 * Real coordinates for NOW. Omitted means NOW is not loaded — BERX
	 * has no location provider, and inventing a latitude to make the
	 * world look busy is exactly what must not happen.
	 */
	near?: {lat: number; lng: number; radiusKm?: number};
}

export async function loadBerxWorld(api: BerxApiClient, options: BerxWorldLoadOptions = {}): Promise<BerxWorldLoad> {
	const entries: BerxWorldIngest[] = [];
	const failures: BerxWorldLoadFailure[] = [];
	let viewerId: string | undefined;

	const attempt = async <T>(source: string, run: () => Promise<T>, use: (value: T) => void) => {
		try {
			use(await run());
		} catch (error) {
			failures.push({source, message: error instanceof Error ? error.message : String(error)});
		}
	};

	await Promise.all([
		attempt('me', () => api.me(), (me) => {
			const mapped = mapUserToSpatial(me);
			viewerId = mapped.object.id;
			entries.push(toEntry(mapped));
		}),

		attempt('feed', () => api.feed(options.feedLimit ?? 24), (response) => {
			for (const item of response.items) entries.push(toEntry(mapFeedItemToSpatial(item)));
		}),

		attempt('friends', () => api.friends(), (response) => {
			for (const friend of response.friends) entries.push(toEntry(mapFriendToSpatial(friend)));
		}),

		attempt('conversations', () => api.conversations(), (response) => {
			for (const conversation of response.conversations) entries.push(toEntry(mapConversationToSpatial(conversation)));
		}),

		attempt('places', () => api.places(), (response) => {
			for (const place of response.places) entries.push(toEntry(mapPlaceToSpatial(place)));
		}),

		attempt('events', () => api.events(), (response) => {
			for (const event of response.events) entries.push(toEntry(mapEventToSpatial(event)));
		}),

		/* NOW only where real coordinates were given. There is no
		   location provider in this repository, so a caller that has no
		   position simply has no NOW rather than a fabricated one. */
		options.near
			? attempt('nearbyNow', () => api.nearbyNow(options.near!.lat, options.near!.lng, options.near!.radiusKm ?? 5), (now) => {
					const at = Date.now();
					for (const place of now.places) entries.push(toEntry(mapNearbyPlaceToSpatial(place, at)));
					for (const event of now.events) entries.push(toEntry(mapNearbyEventToSpatial(event)));
				})
			: Promise.resolve(),
	]);

	/* The viewer's own edges: friendship and conversation are relations
	   the responses state by being the viewer's lists, and they are what
	   put the people a person knows within reach of them. */
	if (viewerId) {
		for (const entry of entries) {
			if (entry.object.id === viewerId) continue;
			if (entry.object.kind === 'person') {
				entry.relations = [...(entry.relations ?? []), relation(viewerId, entry.object.id, 'related', 0.85)];
			} else if (entry.object.kind === 'message') {
				entry.relations = [...(entry.relations ?? []), relation(viewerId, entry.object.id, 'messages', 0.95)];
			}
		}
	}

	return {entries, viewerId, failures};
}

/** The spatial identity of a person, for callers holding only a guid. */
export const berxPersonId = (guid: number) => berxSpatialId('person', guid);

/**
 * A conversation, as the space it is.
 *
 * The thread is not fetched into a list: every message becomes an
 * entity carrying its real timestamp and related to whoever sent it,
 * so the two people stand on their own sides of it and the messages
 * extend back along the temporal axis. Walking the cursor back walks
 * the conversation back.
 *
 * Entities already in the world are updated rather than duplicated —
 * the person you are talking to is the same person the feed put there.
 */
export async function loadBerxConversation(
	api: BerxApiClient,
	otherGuid: number,
	viewerId?: string,
): Promise<BerxWorldLoad> {
	const entries: BerxWorldIngest[] = [];
	const failures: BerxWorldLoadFailure[] = [];
	try {
		const {messages} = await api.conversationWith(otherGuid);
		const otherId = berxSpatialId('person', otherGuid);
		for (const message of messages) {
			const mapped = mapMessageToSpatial(message);
			/* a message is also part of the conversation with that person,
			   which is what holds the thread together in space */
			entries.push({
				object: mapped.object,
				relations: [
					...mapped.relations,
					{
						id: `${mapped.object.id}->${otherId}:messages`,
						from: mapped.object.id,
						to: otherId,
						type: 'messages',
						strength: 0.8,
					},
				],
				media: [],
			});
		}
	} catch (error) {
		failures.push({source: 'conversationWith', message: error instanceof Error ? error.message : String(error)});
	}
	return {entries, viewerId, failures};
}
