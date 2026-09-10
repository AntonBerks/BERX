/**
 * BERX Realtime — the client half of the transport.
 *
 * A WebSocket cannot carry an Authorization header, so this never
 * sends the bearer token to one. It asks the HTTP API for a
 * short-lived, single-use credential (POST /api/v1/realtime/token),
 * spends it on the handshake, and throws it away. A reconnect mints a
 * fresh one, because the server burns each on first use.
 *
 * What it deliberately does NOT do: hold world state, decide what a
 * channel means, or retry a publish. It is a pipe. Everything about
 * what an event does to the world lives in the 5D core, reached
 * through onEvent.
 *
 * Works anywhere `WebSocket` is a global — browsers, React Native, and
 * Node 22+ — and takes a `socketFactory` for anywhere it is not.
 */
import type {BerxApiClient} from './client';

export interface BerxRealtimeEvent {
	channel: string;
	payload: unknown;
	/** The guid that caused it. 0 when the server itself did. */
	from: number;
	/** 'server' when this came from a real write on the server. */
	origin?: 'server';
	ts: number;
}

export type BerxRealtimeState = 'idle' | 'connecting' | 'open' | 'closed';

/** The part of WebSocket this uses, so a non-DOM host can supply one. */
export interface BerxRealtimeSocket {
	send(data: string): void;
	close(): void;
	onopen: ((event: unknown) => void) | null;
	onmessage: ((event: {data: unknown}) => void) | null;
	onclose: ((event: unknown) => void) | null;
	onerror: ((event: unknown) => void) | null;
}

export interface BerxRealtimeOptions {
	/**
	 * Where the socket lives. Omit to use the `url` the server returns
	 * with the token — which is null unless the deployment configured
	 * one, in which case connect() rejects rather than dialling a
	 * guessed address.
	 */
	url?: string;
	onEvent?: (event: BerxRealtimeEvent) => void;
	onState?: (state: BerxRealtimeState) => void;
	/** Told what the server refused, so a client never infers it from silence. */
	onRefused?: (channels: readonly string[]) => void;
	socketFactory?: (url: string, protocol: string) => BerxRealtimeSocket;
	/** Reconnect backoff in ms. Defaults double from 500 to 15000. */
	backoffMs?: readonly number[];
	/** Off by default: a verification must not reconnect behind its own back. */
	autoReconnect?: boolean;
}

const DEFAULT_BACKOFF = [500, 1000, 2000, 4000, 8000, 15000] as const;
export const BERX_REALTIME_PROTOCOL = 'berx-realtime-1';

export class BerxRealtimeClient {
	private readonly api: BerxApiClient;
	private readonly options: BerxRealtimeOptions;
	private socket?: BerxRealtimeSocket;
	private channels: string[] = [];
	private attempt = 0;
	private closing = false;
	private currentState: BerxRealtimeState = 'idle';
	private userGuid = 0;
	/**
	 * When this socket last authenticated.
	 *
	 * Kept so the backoff can tell a connection that WORKED from one
	 * that merely opened — see the close handler. Undefined until a
	 * socket has been authenticated at least once.
	 */
	private openedAt?: number;
	/** Waiting for the server's answer to a subscribe sent after connect. */
	private pendingSubscribe?: (result: {granted: string[]; refused: string[]}) => void;
	/**
	 * The ONE reconnect that is allowed to be pending.
	 *
	 * A failed attempt used to schedule two: `socket.onclose` fires after
	 * `onerror` has already rejected, and the rejected promise's own
	 * `.catch` in scheduleReconnect schedules another. Two chains from
	 * one failure, each of which fails and becomes two — 2^n sockets
	 * against the server, measured at 4 462 open connections from a
	 * single browser session in twenty minutes. A client that answers a
	 * server's bad minute by doubling its load every round is a denial
	 * of service with a friendly name.
	 */
	private reconnectTimer?: ReturnType<typeof setTimeout>;

	constructor(api: BerxApiClient, options: BerxRealtimeOptions = {}) {
		this.api = api;
		this.options = options;
	}

	get state(): BerxRealtimeState {
		return this.currentState;
	}

	/** The guid the server said this socket is. 0 until authenticated. */
	get guid(): number {
		return this.userGuid;
	}

	get subscribed(): readonly string[] {
		return this.channels;
	}

	private setState(state: BerxRealtimeState): void {
		if (this.currentState === state) return;
		this.currentState = state;
		this.options.onState?.(state);
	}

	/**
	 * Open a socket and subscribe. Resolves with what the server
	 * actually granted — never with what was asked for.
	 */
	async connect(channels: readonly string[]): Promise<{granted: string[]; refused: string[]}> {
		this.closing = false;
		this.setState('connecting');
		const minted = await this.api.mintRealtimeToken();
		const url = this.options.url ?? minted.url;
		if (!url) {
			this.setState('closed');
			throw new Error(
				'BERX realtime: no socket URL. The server returned none (site setting berx_realtime_url is unset) and none was passed — refusing to dial a guessed address.',
			);
		}
		const socket = this.open(url);
		this.socket = socket;

		return new Promise((resolve, reject) => {
			let settled = false;
			socket.onopen = () => {
				socket.send(JSON.stringify({type: 'auth', token: minted.token}));
			};
			socket.onmessage = (event) => {
				let message: Record<string, unknown>;
				try {
					message = JSON.parse(String(event.data)) as Record<string, unknown>;
				} catch {
					return;
				}
				switch (message.type) {
					case 'auth:ok':
						this.userGuid = Number(message.user_guid ?? 0);
						this.setState('open');
						/* The backoff is NOT reset here. A socket that
						   authenticates and then dies immediately is
						   exactly the case that made this hammer the
						   server: `attempt` went back to zero on every
						   auth:ok, so a connection failing just after
						   authentication reconnected twice a second
						   forever. It is reset in the close handler, and
						   only for a connection that lasted. */
						this.openedAt = Date.now();
						socket.send(JSON.stringify({type: 'subscribe', channels}));
						break;
					case 'auth:error':
						if (!settled) {
							settled = true;
							reject(new Error(`BERX realtime: ${String(message.error ?? 'authentication refused')}`));
						}
						break;
					case 'subscribe:ok': {
						const granted = (message.granted as string[]) ?? [];
						const refused = (message.refused as string[]) ?? [];
						this.channels = granted;
						if (refused.length > 0) this.options.onRefused?.(refused);
						if (!settled) {
							settled = true;
							resolve({granted, refused});
						} else {
							/* a later subscribe on the same socket — see
							   subscribe(), which is how a world that grew
							   asks for the channels it now needs */
							const waiting = this.pendingSubscribe;
							this.pendingSubscribe = undefined;
							waiting?.({granted, refused});
						}
						break;
					}
					case 'event':
						this.options.onEvent?.({
							channel: String(message.channel),
							payload: message.payload,
							from: Number(message.from ?? 0),
							origin: message.origin === 'server' ? 'server' : undefined,
							ts: Number(message.ts ?? 0),
						});
						break;
					default:
						break;
				}
			};
			socket.onerror = () => {
				if (!settled) {
					settled = true;
					reject(new Error('BERX realtime: the socket failed to open'));
				}
			};
			socket.onclose = () => {
				this.setState('closed');
				this.socket = undefined;
				/**
				 * A connection that LASTED is proof the backoff had
				 * already waited long enough; one that died as soon as it
				 * came up is not, and starting over from half a second
				 * because it got as far as auth is how a client turns a
				 * server's bad minute into a denial of service against
				 * it. So the ladder only resets for a session that
				 * outlived the longest rung.
				 */
				const backoff = this.options.backoffMs ?? DEFAULT_BACKOFF;
				const lasted = this.openedAt !== undefined && Date.now() - this.openedAt >= backoff[backoff.length - 1];
				if (lasted) this.attempt = 0;
				this.openedAt = undefined;
				if (!settled) {
					settled = true;
					reject(new Error('BERX realtime: the socket closed before it was ready'));
				} else if (!this.closing && this.options.autoReconnect) {
					this.scheduleReconnect(channels);
				}
			};
		});
	}

	/**
	 * Ask for channels on a socket that is already open.
	 *
	 * A world grows: someone arrives through an event or through
	 * travelling into a conversation, and they are a person this
	 * session is now looking at and not listening to. Reconnecting to
	 * pick them up would burn a fresh credential and drop every event in
	 * between, so the protocol takes `subscribe` at any time and the
	 * server accumulates what it grants.
	 *
	 * Send the WHOLE set each time, not the difference: the answer is
	 * the server's decision about exactly what was asked for, and a
	 * caller that sent only the new ones would read back a channel list
	 * missing everything it already had.
	 */
	async subscribe(channels: readonly string[]): Promise<{granted: string[]; refused: string[]}> {
		const socket = this.socket;
		if (!socket || this.currentState !== 'open') {
			throw new Error('BERX realtime: subscribe on a socket that is not open');
		}
		if (this.pendingSubscribe) {
			throw new Error('BERX realtime: a subscribe is already in flight on this socket');
		}
		const answered = new Promise<{granted: string[]; refused: string[]}>((resolve) => {
			this.pendingSubscribe = resolve;
		});
		socket.send(JSON.stringify({type: 'subscribe', channels}));
		return answered;
	}

	/**
	 * Publish on a channel. Returns immediately: the server answers
	 * with publish:ok/publish:refused, which arrives through the same
	 * message path as everything else rather than as a fake promise
	 * this client would have to invent a timeout for.
	 */
	publish(channel: string, payload: unknown): boolean {
		if (!this.socket || this.currentState !== 'open') return false;
		this.socket.send(JSON.stringify({type: 'publish', channel, payload}));
		return true;
	}

	ping(): boolean {
		if (!this.socket || this.currentState !== 'open') return false;
		this.socket.send(JSON.stringify({type: 'ping'}));
		return true;
	}

	close(): void {
		this.closing = true;
		this.openedAt = undefined;
		this.pendingSubscribe = undefined;
		if (this.reconnectTimer !== undefined) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = undefined;
		}
		this.socket?.close();
		this.socket = undefined;
		this.channels = [];
		this.setState('closed');
	}

	private open(url: string): BerxRealtimeSocket {
		if (this.options.socketFactory) return this.options.socketFactory(url, BERX_REALTIME_PROTOCOL);
		const Ctor = (globalThis as {WebSocket?: new (url: string, protocol?: string) => BerxRealtimeSocket}).WebSocket;
		if (!Ctor) {
			throw new Error('BERX realtime: this runtime has no WebSocket and no socketFactory was given');
		}
		return new Ctor(url, BERX_REALTIME_PROTOCOL);
	}

	private scheduleReconnect(channels: readonly string[]): void {
		/* one chain, whichever path asked for it */
		if (this.reconnectTimer !== undefined) return;
		const backoff = this.options.backoffMs ?? DEFAULT_BACKOFF;
		const delay = backoff[Math.min(this.attempt, backoff.length - 1)];
		this.attempt++;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined;
			if (this.closing) return;
			/* A fresh token every time: the server burns each on use, so
			   a reconnect that reused one would be refused. */
			this.connect(channels).catch(() => {
				if (!this.closing) this.scheduleReconnect(channels);
			});
		}, delay);
	}
}
