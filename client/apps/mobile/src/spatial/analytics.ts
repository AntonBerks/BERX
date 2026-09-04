/**
 * BERX analytics — the v9 event contract, with an honest destination.
 *
 * The archive specifies event names, required events and forbidden
 * properties. BERX has no analytics endpoint: there is nothing under
 * /api/v1/ that accepts an event, and inventing one is exactly what
 * the constitution forbids. So this records events into a bounded
 * in-memory buffer and hands them to whatever sink the host app
 * attaches — nothing more is claimed.
 *
 * The buffer is not decoration: the QA probe reads it to check that
 * screens actually emit their contracted events, which is more than a
 * silent no-op would allow.
 */
import type {BerxResolvedScreen} from '@berx/scenes';

export interface BerxAnalyticsEvent {
	name: string;
	screenId: string;
	route: string;
	platform: string;
	sessionId: string;
	at: number;
	objectId?: string | number;
	source?: string;
	latencyMs?: number;
	offline?: boolean;
}

export type BerxAnalyticsSink = (event: BerxAnalyticsEvent) => void;

/**
 * Property names the privacy clause forbids. Enforced rather than
 * documented: a caller that passes one gets it stripped, because a
 * message body reaching an analytics buffer is a real privacy
 * incident regardless of intent.
 */
const FORBIDDEN = new Set([
	'body',
	'message',
	'text',
	'content',
	'password',
	'token',
	'email',
	'phone',
	'lat',
	'lng',
	'coords',
]);

const MAX_BUFFERED = 200;

export class BerxAnalytics {
	private buffer: BerxAnalyticsEvent[] = [];
	private sink: BerxAnalyticsSink | null = null;
	private sessionId: string;

	constructor(sessionId?: string) {
		/* not a user identifier: a per-run value, never persisted */
		this.sessionId = sessionId ?? `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
	}

	/** Attach a real destination when one exists. Until then, events stay local. */
	setSink(sink: BerxAnalyticsSink | null) {
		this.sink = sink;
	}

	private emit(name: string, screen: BerxResolvedScreen, extra?: Partial<BerxAnalyticsEvent>) {
		const clean: Partial<BerxAnalyticsEvent> = {};
		for (const [k, v] of Object.entries(extra ?? {})) {
			if (FORBIDDEN.has(k.toLowerCase())) continue;
			(clean as Record<string, unknown>)[k] = v;
		}
		const event: BerxAnalyticsEvent = {
			name,
			screenId: screen.screenId,
			route: screen.route.path,
			platform: screen.platform,
			sessionId: this.sessionId,
			at: Date.now(),
			...clean,
		};
		this.buffer.push(event);
		if (this.buffer.length > MAX_BUFFERED) this.buffer.shift();
		this.sink?.(event);
	}

	screenView(screen: BerxResolvedScreen) {
		this.emit(screen.analytics.view, screen);
	}

	primaryAction(screen: BerxResolvedScreen, objectId?: string | number) {
		this.emit(screen.analytics.primaryAction, screen, {objectId});
	}

	error(screen: BerxResolvedScreen, source?: string) {
		this.emit(screen.analytics.error, screen, {source});
	}

	mutationStart(screen: BerxResolvedScreen, objectId?: string | number) {
		this.emit(screen.analytics.mutationStart, screen, {objectId});
	}

	/** Emitted only after the server has confirmed — see BerxDataBoundary. */
	mutationSuccess(screen: BerxResolvedScreen, latencyMs?: number, objectId?: string | number) {
		this.emit(screen.analytics.mutationSuccess, screen, {latencyMs, objectId});
	}

	mutationError(screen: BerxResolvedScreen, source?: string) {
		this.emit(screen.analytics.mutationError, screen, {source});
	}

	/** Read-only view, for QA and for a sink attaching late. */
	recent(): readonly BerxAnalyticsEvent[] {
		return this.buffer;
	}
}

export const berxAnalytics = new BerxAnalytics();
