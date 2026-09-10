/**
 * Browser entry for the live-world wiring gate.
 *
 * `applyBerxRealtimeEvent` had a gate. `BerxRealtimeClient` had a gate
 * against the real PHP socket server. Nothing joined them, so a shipped
 * session opened no socket at all — and neither gate could see that,
 * because each supplied its own caller.
 *
 * This drives the REAL join — berxKeepWorldLive — with the REAL client,
 * against a socket that speaks the protocol berx-realtime-server.php
 * really speaks, message for message. What is exercised is the path
 * from a frame the server sent to an entity standing in the world.
 */
import {Berx5DWorldApp} from '@berx/spatial';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxRealtimeSocket} from '@berx/api/realtime';
import {berxKeepWorldLive, mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_LIVE_WIRE: unknown }
}

const NOW_S = () => Math.floor(Date.now() / 1000);

/**
 * A SOCKET THAT ANSWERS THE WAY berx-realtime-server.php ANSWERS.
 *
 * Not a stand-in for the transport — verify:5d-realtime drives the real
 * PHP server over a real TCP socket and proves the wire. This is here
 * so the JOIN can be exercised in a browser: same JSON frames, same
 * order, same authorization rule (a viewer hears their own channels and
 * the people in their world, and nothing else).
 *
 * Every reply is delivered asynchronously, because a real socket cannot
 * answer inside the call that sent the message — and a fake that did
 * would hide ordering bugs the real one would produce.
 */
class ProtocolSocket implements BerxRealtimeSocket {
	onopen: ((event: unknown) => void) | null = null;
	onmessage: ((event: {data: unknown}) => void) | null = null;
	onclose: ((event: unknown) => void) | null = null;
	onerror: ((event: unknown) => void) | null = null;
	readonly sent: unknown[] = [];
	/** Everything this connection was granted, accumulated as the server does. */
	readonly channels = new Set<string>();
	closed = false;
	private guid = 0;

	constructor(readonly url: string, readonly protocol: string, private readonly authorized: (guid: number, channel: string) => boolean, private readonly token: string) {
		setTimeout(() => this.onopen?.({}), 0);
	}

	private reply(message: unknown): void {
		setTimeout(() => this.onmessage?.({data: JSON.stringify(message)}), 0);
	}

	send(data: string): void {
		const message = JSON.parse(data) as Record<string, unknown>;
		this.sent.push(message);
		switch (message.type) {
			case 'auth':
				/* the server burns the credential it was handed; a wrong
				   one is refused rather than tolerated */
				if (message.token !== this.token) return this.reply({type: 'auth:error', error: 'unknown or spent credential'});
				this.guid = 77;
				return this.reply({type: 'auth:ok', user_guid: 77});
			case 'subscribe': {
				const asked = (message.channels as string[]) ?? [];
				const granted = asked.filter((c) => this.authorized(this.guid, c));
				const refused = asked.filter((c) => !this.authorized(this.guid, c));
				for (const c of granted) this.channels.add(c);
				return this.reply({type: 'subscribe:ok', granted, refused});
			}
			default:
				return;
		}
	}

	/** What the server does when a real write happened somewhere else. */
	deliver(channel: string, payload: unknown): boolean {
		if (!this.channels.has(channel)) return false;
		this.reply({type: 'event', channel, payload, from: 0, origin: 'server', ts: NOW_S()});
		return true;
	}

	close(): void {
		this.closed = true;
		setTimeout(() => this.onclose?.({}), 0);
	}
}

/** A client that answers the way the real one does, shape for shape. */
const answering = (url: string | null) => {
	const calls: string[] = [];
	return {
		calls,
		async mintRealtimeToken() {
			calls.push('mintRealtimeToken');
			/* a fresh credential each time, as the server mints one */
			return {token: `tok-${calls.length}`, expires_at: NOW_S() + 60, url, protocol: 'berx-realtime-1'};
		},
		async feed(limit: number) {
			calls.push(`feed(${limit})`);
			return {
				items: [{
					guid: 5150, text: 'реальный пост с сервера', owner_guid: 78,
					owner_username: 'boris', time_created: NOW_S(),
				}],
				total: 1,
			};
		},
		async getProfile(username: string) {
			calls.push(`getProfile(${username})`);
			return {
				guid: 79, username, fullname: 'Вера Живая', email: '', icon_url: '',
				profile_url: '', time_created: NOW_S(),
			};
		},
	};
};

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 40));

window.BERX_LIVE_WIRE = {
	async run() {
		const out: Record<string, unknown> = {};

		/* ---- a deployment with no socket configured ---- */
		{
			const world = new Berx5DWorldApp({viewerId: 'person:77'});
			world.ingest([{object: mapUserToSpatial({guid: 77, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0}).object, relations: [], media: []}]);
			const api = answering(null);
			let refused = '';
			try {
				await berxKeepWorldLive(world, api as unknown as BerxApiClient);
			} catch (error) {
				refused = error instanceof Error ? error.message : String(error);
			}
			out.noUrl = {refused, called: [...api.calls]};
		}

		/* ---- a world with no signed-in viewer ---- */
		{
			const world = new Berx5DWorldApp({});
			const api = answering('ws://berx.invalid/socket');
			let refused = '';
			try {
				await berxKeepWorldLive(world, api as unknown as BerxApiClient);
			} catch (error) {
				refused = error instanceof Error ? error.message : String(error);
			}
			out.noViewer = {refused, dialled: api.calls.length};
		}

		/* ---- a real live session ---- */
		const world = new Berx5DWorldApp({viewerId: 'person:77'});
		const ann = mapUserToSpatial({guid: 77, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0});
		const boris = mapUserToSpatial({guid: 78, username: 'boris', fullname: 'Борис', email: '', icon_url: '', profile_url: '', time_created: 0});
		world.ingest([
			{object: ann.object, relations: [], media: []},
			{object: boris.object, relations: [], media: []},
		]);
		const api = answering('ws://berx.invalid/socket');
		let socket: ProtocolSocket | undefined;
		const applied: {applied: string; objectId?: string; reason?: string}[] = [];
		const refusedChannels: string[] = [];

		const live = await berxKeepWorldLive(world, api as unknown as BerxApiClient, {
			onApplied: (result) => applied.push({applied: result.applied, objectId: result.objectId, reason: result.reason}),
			realtime: {
				onRefused: (channels) => refusedChannels.push(...channels),
				socketFactory: (url, protocol) => {
					/* the server's rule: your own channels, and the people
					   who are really in your world */
					socket = new ProtocolSocket(url, protocol, (guid, channel) => {
						if (channel === `self:${guid}`) return true;
						if (!channel.startsWith('person:')) return false;
						const who = Number(channel.slice('person:'.length));
						return who === guid || world.latestFrame.world.objects.some((o) => o.id === `person:${who}`);
					}, 'tok-1');
					return socket;
				},
			},
		});

		const before = world.latestFrame.world.objects.map((o) => o.id).sort();
		out.opened = {
			protocol: socket?.protocol,
			channels: [...live.channels].sort(),
			refused: [...live.refused, ...refusedChannels].sort(),
			/* the socket asked with a credential the server minted */
			handshake: socket?.sent.map((m) => (m as {type: string}).type),
		};

		/* ---- a real write somewhere else reaches this world ---- */
		const heardPost = socket?.deliver('person:78', {kind: 'post:created', guid: 5150});
		await settle();
		await settle();
		const afterPost = world.latestFrame.world.objects.map((o) => o.id).sort();
		out.post = {
			heard: heardPost,
			before, after: afterPost,
			gained: afterPost.filter((id) => !before.includes(id)),
			/* the entity came from the server, not from the payload */
			calls: [...api.calls],
			label: world.latestFrame.world.objects.find((o) => o.id === 'moment:5150')?.label,
			applied: [...applied],
		};

		/* ---- a channel this session was never entitled to ---- */
		const unentitled = socket?.deliver('person:999', {kind: 'post:created', guid: 5150});
		out.unentitled = {delivered: unentitled};

		/* ---- someone new arrives, and the session starts listening ---- */
		const channelsBefore = [...live.channels].sort();
		const heardPerson = socket?.deliver('self:77', {kind: 'person:changed', guid: 79, username: 'vera'});
		await settle();
		await settle();
		await settle();
		const objects = world.latestFrame.world.objects.map((o) => o.id).sort();
		out.grew = {
			heard: heardPerson,
			objects,
			channelsBefore,
			channelsAfter: [...live.channels].sort(),
			socketHas: [...(socket?.channels ?? [])].sort(),
			subscribes: (socket?.sent ?? []).filter((m) => (m as {type: string}).type === 'subscribe').length,
		};

		/* ---- an unreachable entity does not take the session down ---- */
		const failing = answering('ws://berx.invalid/socket');
		failing.feed = async () => {
			throw new Error('сеть не ответила');
		};
		const brokenWorld = new Berx5DWorldApp({viewerId: 'person:77'});
		brokenWorld.ingest([{object: ann.object, relations: [], media: []}]);
		let brokenSocket: ProtocolSocket | undefined;
		const brokenApplied: string[] = [];
		const brokenLive = await berxKeepWorldLive(brokenWorld, failing as unknown as BerxApiClient, {
			onApplied: (result) => brokenApplied.push(`${result.applied}:${result.reason ?? ''}`),
			realtime: {
				socketFactory: (url, protocol) => {
					brokenSocket = new ProtocolSocket(url, protocol, () => true, 'tok-1');
					return brokenSocket;
				},
			},
		});
		const brokenBefore = brokenWorld.latestFrame.world.objects.length;
		brokenSocket?.deliver('self:77', {kind: 'post:created', guid: 5150});
		await settle();
		await settle();
		out.broken = {
			applied: brokenApplied,
			before: brokenBefore,
			after: brokenWorld.latestFrame.world.objects.length,
			state: brokenLive.client.state,
		};
		brokenLive.close();

		live.close();
		out.closed = {socketClosed: socket?.closed === true, state: live.client.state};
		return out;
	},
};
