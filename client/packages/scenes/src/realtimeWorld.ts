/**
 * Realtime, as a change to the world — not as a feed of messages.
 *
 * The transport (@berx/api/realtime) is a pipe and knows nothing about
 * space. This is the only place that turns what the server said into
 * what the world does, and it does exactly one thing per event kind:
 * fetch the real entity through the real API client, map it with the
 * same mapper the initial load uses, and ingest it. There is no
 * second, realtime-shaped path into the world.
 *
 * Nothing here invents an entity from an event payload. An event says
 * WHICH thing changed; what that thing IS still comes from the server,
 * through the same endpoint a cold load would use. That is what keeps
 * a live world and a reloaded world identical.
 */
import type {BerxApiClient} from '@berx/api/client';
import type {BerxRealtimeEvent} from '@berx/api/realtime';
import type {Berx5DWorldApp} from '@berx/spatial';
import {mapFeedItemToSpatial, mapProfileToSpatial} from './spatialMapping';
import {berxPersonId} from './worldLoader';

/** Every event payload this bridge acts on. Anything else is ignored. */
export type BerxRealtimeWorldPayload =
	| {kind: 'post:created'; guid: number}
	| {kind: 'post:removed'; guid: number}
	/* `username`, not just a guid, because the real profile endpoint is
	   GET /profiles/{username} — an event that carried only a guid
	   would have to be resolved by an endpoint that does not exist. */
	| {kind: 'person:changed'; guid: number; username: string};

export interface BerxRealtimeWorldResult {
	/** What the bridge did, for a caller that wants to observe it. */
	applied: 'ingested' | 'removed' | 'ignored' | 'failed';
	objectId?: string;
	reason?: string;
}

const isPayload = (value: unknown): value is BerxRealtimeWorldPayload =>
	typeof value === 'object' && value !== null && typeof (value as {kind?: unknown}).kind === 'string';

/**
 * Apply one event to one world.
 *
 * Returns what happened rather than throwing: a single unreachable
 * entity must not take down a live session, and a caller that wants to
 * count failures can.
 */
export async function applyBerxRealtimeEvent(
	world: Berx5DWorldApp,
	api: BerxApiClient,
	event: BerxRealtimeEvent,
): Promise<BerxRealtimeWorldResult> {
	if (!isPayload(event.payload)) return {applied: 'ignored', reason: 'payload has no kind'};
	const payload = event.payload;

	try {
		switch (payload.kind) {
			case 'post:created': {
				/* The post itself, from the server. The feed is the only
				   endpoint that returns a post in the shape the spatial
				   mapper takes, so the real one is found in it rather
				   than assembled from the event. */
				const feed = await api.feed(30, 0);
				const item = feed.items.find((entry) => entry.guid === payload.guid);
				if (!item) return {applied: 'ignored', reason: `post ${payload.guid} is not visible to this viewer`};
				const mapped = mapFeedItemToSpatial(item);
				world.ingest([{object: mapped.object, relations: mapped.relations, media: mapped.media}]);
				return {applied: 'ingested', objectId: mapped.object.id};
			}

			case 'post:removed': {
				const id = `moment:${payload.guid}`;
				world.remove(id);
				return {applied: 'removed', objectId: id};
			}

			case 'person:changed': {
				const profile = await api.getProfile(payload.username);
				const mapped = mapProfileToSpatial(profile);
				world.ingest([{object: mapped.object, relations: mapped.relations, media: mapped.media}]);
				return {applied: 'ingested', objectId: berxPersonId(payload.guid)};
			}
		}
	} catch (error) {
		return {applied: 'failed', reason: error instanceof Error ? error.message : String(error)};
	}
	return {applied: 'ignored'};
}

/**
 * The channels a viewer's world actually needs: their own, and every
 * person standing in it. Derived from the world rather than from a
 * list someone has to remember to update — an entity that is not in
 * the world produces no channel, and the server refuses anything the
 * viewer is not really entitled to anyway.
 */
export function berxRealtimeChannelsFor(world: Berx5DWorldApp, viewerGuid: number): string[] {
	const channels = new Set<string>([`self:${viewerGuid}`, `person:${viewerGuid}`]);
	for (const object of world.frame(0).world.objects) {
		if (object.kind !== 'person') continue;
		const guid = Number(object.id.slice('person:'.length));
		if (Number.isFinite(guid) && guid > 0) channels.add(`person:${guid}`);
	}
	return [...channels];
}
