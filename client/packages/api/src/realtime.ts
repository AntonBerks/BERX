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
						this.attempt = 0;
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
		const backoff = this.options.backoffMs ?? DEFAULT_BACKOFF;
		const delay = backoff[Math.min(this.attempt, backoff.length - 1)];
		this.attempt++;
		setTimeout(() => {
			if (this.closing) return;
			/* A fresh token every time: the server burns each on use, so
			   a reconnect that reused one would be refused. */
			this.connect(channels).catch(() => {
				if (!this.closing) this.scheduleReconnect(channels);
			});
		}, delay);
	}
}
