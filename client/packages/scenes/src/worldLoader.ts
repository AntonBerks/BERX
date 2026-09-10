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
	mapCollectionToSpatial,
	mapCreatorToSpatial,
	mapDatingProfileToSpatial,
	mapOfferToSpatial,
	mapStoryToSpatial,
	mapMemoryToSpatial,
	mapTripToSpatial,
	mapNotificationToSpatial,
	mapCommunityToSpatial,
	mapConversationToSpatial,
	mapExperienceToSpatial,
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

		attempt('experiences', () => api.experiences(), (response) => {
			for (const experience of response.experiences) entries.push(toEntry(mapExperienceToSpatial(experience)));
		}),

		attempt('communities', () => api.communities(), (response) => {
			for (const community of response.communities) entries.push(toEntry(mapCommunityToSpatial(community)));
		}),

		attempt('collections', () => api.collections(), (response) => {
			for (const collection of response.collections) entries.push(toEntry(mapCollectionToSpatial(collection)));
		}),

		/**
		 * FOUR DOMAINS THAT HAD AN ENDPOINT AND NO PLACE IN THE WORLD.
		 *
		 * Every one of these was a real API method nothing spatial read:
		 * BERX could fetch its stories and a person could not stand next
		 * to one. Each fails on its own, like everything else here — a
		 * deployment whose stories plugin is off loses its stories and
		 * keeps its world.
		 */
		attempt('stories', () => api.storiesFeed(), (response) => {
			for (const group of response.feed) {
				for (const story of group.stories) {
					entries.push(toEntry(mapStoryToSpatial(story, group.owner_guid)));
				}
			}
		}),

		attempt('trips', () => api.trips(), (response) => {
			for (const trip of response.trips) entries.push(toEntry(mapTripToSpatial(trip)));
		}),

		attempt('notifications', () => api.notifications(), (response) => {
			for (const notification of response.notifications) entries.push(toEntry(mapNotificationToSpatial(notification)));
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
	/**
	 * Memories are the VIEWER'S OWN, so they need to know who that is.
	 *
	 * Which is why they are not in the batch above: `me` resolves the
	 * viewer, and a memory attributed to a guid that had not come back
	 * yet would belong to nobody. Read here, from the guid the server
	 * actually returned, and skipped entirely when it did not.
	 */
	if (viewerId) {
		const viewerGuid = Number(viewerId.slice('person:'.length));
		if (Number.isFinite(viewerGuid)) {
			await attempt('memories', () => api.memories(), (response) => {
				for (const memory of response.memories) entries.push(toEntry(mapMemoryToSpatial(memory, viewerGuid)));
			});
		}
	}
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
/**
 * WHAT IS ON OFFER AT A PLACE, read on arriving there.
 *
 * `offers.php` is a complete backend — list, claim, fulfil, redemptions,
 * with viewer-scoped claimed state — and the client had no method for
 * any of it, which is how offers came to be recorded as a provider
 * blocker. It was never a provider blocker; it was an unwired endpoint.
 *
 * Read per place rather than at boot, for the same reason a
 * conversation is: it is a deliberate act about one place, and asking
 * every place in a world for its offers would be reading a city to show
 * a street.
 *
 * A place with no offers is not a failure and not an empty state: the
 * endpoint answers with an empty list and the world gains nothing,
 * which is the truth about that place today.
 */
export async function loadBerxPlaceOffers(
	api: BerxApiClient,
	placeGuid: number,
	viewerId?: string,
): Promise<BerxWorldLoad> {
	const entries: BerxWorldIngest[] = [];
	const failures: BerxWorldLoadFailure[] = [];
	try {
		const {offers} = await api.placeOffers(placeGuid);
		for (const offer of offers) {
			const mapped = mapOfferToSpatial(offer);
			entries.push({object: mapped.object, relations: mapped.relations, media: mapped.media});
		}
	} catch (error) {
		failures.push({source: `offers:${placeGuid}`, message: error instanceof Error ? error.message : String(error)});
	}
	return {entries, viewerId, failures};
}

/**
 * WHAT SOMEONE HAS MADE, brought into the world beside them.
 *
 * Read when a viewer travels TO a person, for the same reason a
 * conversation is read when they travel to one: it is a deliberate act
 * about one person, and reading every account's creator content at boot
 * would be reading the whole site to show one world.
 *
 * A person who is not a creator is not an error and not an empty state.
 * `getCreatorProfile` answers 404 for them, which arrives here as a
 * named failure the shell reports and the world simply does not gain
 * anything — which is the truth about them.
 */
export async function loadBerxCreator(
	api: BerxApiClient,
	username: string,
	userGuid: number,
	viewerId?: string,
): Promise<BerxWorldLoad> {
	const entries: BerxWorldIngest[] = [];
	const failures: BerxWorldLoadFailure[] = [];
	try {
		const [profile, content] = await Promise.all([
			api.getCreatorProfile(username),
			api.getCreatorContent(username),
		]);
		const {work} = mapCreatorToSpatial(userGuid, profile, content);
		for (const mapped of work) {
			entries.push({object: mapped.object, relations: mapped.relations, media: mapped.media});
		}
	} catch (error) {
		failures.push({source: `creator:${username}`, message: error instanceof Error ? error.message : String(error)});
	}
	return {entries, viewerId, failures};
}

/**
 * THE VIEWER'S OWN DATING WORLD, and only ever theirs.
 *
 * Read when someone travels to their OWN presence — the one region that
 * is their own life rather than somebody else's — and never at boot.
 * That is not a performance choice: a world that pulled other people's
 * dating profiles into every session would have decided, on their
 * behalf, that being discoverable and being displayed are the same
 * thing.
 *
 * Each profile arrives as its own pseudonymous entity, never as
 * `person:<guid>`: `mapDatingProfileToSpatial` builds `person:dating-N`
 * precisely so the public identity and the dating one stay the two
 * separate things the privacy model keeps them as.
 */
export async function loadBerxDating(
	api: BerxApiClient,
	viewerId?: string,
): Promise<BerxWorldLoad> {
	const entries: BerxWorldIngest[] = [];
	const failures: BerxWorldLoadFailure[] = [];
	try {
		const {profiles} = await api.datingDiscover(12, 0);
		for (const card of profiles) {
			const mapped = mapDatingProfileToSpatial(card);
			entries.push({object: mapped.object, relations: mapped.relations, media: mapped.media});
		}
	} catch (error) {
		failures.push({source: 'datingDiscover', message: error instanceof Error ? error.message : String(error)});
	}
	return {entries, viewerId, failures};
}

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
