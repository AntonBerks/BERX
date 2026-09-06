/**
 * T — time as a dimension of the world, not a field on a card.
 *
 * Every BERX entity exists somewhere in time, and the times are the
 * server's own: a moment's `time_created`, an event's `starts` and
 * `ends`, an experience's `scheduled_start`. Nothing here invents a
 * timestamp, and an entity the API gave no time for simply has none —
 * it is always present rather than being placed at an invented instant.
 *
 * The world has a cursor. Moving it is not a filter over a list: it
 * changes where entities are, how visible they are and how much energy
 * they carry, because in BERX something that already happened is
 * further away and something happening now is right here.
 */
import type {BerxSpatialObject} from './world';

export interface BerxEntityTime {
	/** When this came into being. The server's own timestamp, in unix seconds. */
	at?: number;
	/** When it begins, for things that are scheduled. */
	startsAt?: number;
	/** When it ends. Undefined means open-ended, not "never". */
	endsAt?: number;
}

export type BerxTemporalBand = 'past' | 'now' | 'future' | 'timeless';

export interface BerxTemporalCursor {
	/** Where the viewer is standing in time, in unix seconds. */
	at: number;
	/**
	 * How wide "now" is, in seconds. An event starting in ten minutes
	 * is present to someone standing here; one next month is future.
	 */
	horizonSeconds: number;
}

export const BERX_DEFAULT_HORIZON_SECONDS = 3 * 3600;

export function berxTemporalCursor(at = Math.floor(Date.now() / 1000), horizonSeconds = BERX_DEFAULT_HORIZON_SECONDS): BerxTemporalCursor {
	return {at, horizonSeconds: Math.max(1, horizonSeconds)};
}

/**
 * Which band an entity falls into, from the times the server gave.
 *
 * A scheduled thing is judged by its window: it is `now` while it is
 * running, `future` before it starts, `past` once it has ended. An
 * unscheduled thing is judged by when it was created. An entity with
 * no time at all is `timeless` — a person, a place, a community do not
 * stop existing when you move the cursor, and pretending they do would
 * be inventing a fact about them.
 */
export function berxTemporalBand(time: BerxEntityTime | undefined, cursor: BerxTemporalCursor): BerxTemporalBand {
	if (!time) return 'timeless';
	const {at, horizonSeconds} = cursor;
	if (time.startsAt !== undefined) {
		const ends = time.endsAt ?? time.startsAt;
		if (at >= time.startsAt - horizonSeconds && at <= ends + horizonSeconds) return 'now';
		return at < time.startsAt ? 'future' : 'past';
	}
	if (time.at === undefined) return 'timeless';
	if (Math.abs(at - time.at) <= horizonSeconds) return 'now';
	return time.at > at ? 'future' : 'past';
}

/**
 * How far, in seconds, an entity is from where the viewer stands.
 *
 * Zero while it is present. For a scheduled thing this is the distance
 * to the nearer edge of its window, so an event does not read as
 * distant merely because it is long.
 */
export function berxTemporalDistance(time: BerxEntityTime | undefined, cursor: BerxTemporalCursor): number {
	if (!time) return 0;
	if (time.startsAt !== undefined) {
		const ends = time.endsAt ?? time.startsAt;
		if (cursor.at < time.startsAt) return time.startsAt - cursor.at;
		if (cursor.at > ends) return cursor.at - ends;
		return 0;
	}
	if (time.at === undefined) return 0;
	return Math.abs(cursor.at - time.at);
}

export interface BerxTemporalProjection {
	band: BerxTemporalBand;
	/** Seconds from the cursor. 0 while present. */
	distanceSeconds: number;
	/**
	 * How far back along Z the entity is pushed. Present things sit at
	 * the viewer's plane; the past recedes and the future stands ahead,
	 * so time is a direction you can move through rather than a filter.
	 */
	depthOffset: number;
	/** 0..1. Distant things fade rather than vanish: they are still real. */
	presence: number;
	/** Live only while it is live. Multiplies whatever energy the entity earned. */
	energyScale: number;
}

/** A day's distance, past which further time compresses rather than scaling. */
const DAY = 86_400;

/**
 * Where a moment in time sits in space.
 *
 * Logarithmic, deliberately: a world where yesterday is 86400 units
 * away has nothing visible in it. The compression keeps a year and an
 * hour both reachable, and keeps the ordering exact — further in time
 * is always further in space, never equal.
 */
export function berxProjectTemporal(time: BerxEntityTime | undefined, cursor: BerxTemporalCursor): BerxTemporalProjection {
	const band = berxTemporalBand(time, cursor);
	const distanceSeconds = berxTemporalDistance(time, cursor);
	if (band === 'timeless') {
		return {band, distanceSeconds: 0, depthOffset: 0, presence: 1, energyScale: 1};
	}
	/* days, softened: 1 day ≈ 1 unit, 1 year ≈ 6.5 */
	const days = distanceSeconds / DAY;
	const reach = Math.log1p(days) * 4.2;
	const direction = band === 'future' ? 1 : band === 'past' ? -1 : 0;
	return {
		band,
		distanceSeconds,
		depthOffset: direction * reach,
		/* never fully gone: 0.22 is still visible, and still pickable */
		presence: Math.max(0.22, 1 / (1 + days * 0.55)),
		energyScale: band === 'now' ? 1 : 0,
	};
}

/** The object with its temporal projection applied, ready to render. */
export function berxApplyTemporal(object: BerxSpatialObject, cursor: BerxTemporalCursor): BerxSpatialObject {
	const projection = berxProjectTemporal(object.time, cursor);
	return {
		...object,
		transform: {
			...object.transform,
			position: {...object.transform.position, z: object.transform.position.z + projection.depthOffset},
		},
		material: {...object.material, opacity: object.material.opacity * projection.presence},
		/* an event that has ended stops being live; it does not stop existing */
		energy: object.energy * projection.energyScale,
	};
}
