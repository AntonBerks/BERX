/**
 * The BERX application shell.
 *
 * This boots the world. Not a page that contains a world, not a
 * navigation layer with a world behind it — the world is the
 * application, and there is no second one underneath it. There is no
 * router, no screen, no card list, no tab bar, and nothing in the DOM
 * that owns Feed, Profile, Places, Events, Messages, Discover, Create
 * or Notifications. The camera travels; the world stays.
 *
 * The DOM exists here for exactly four things, and `verify:5d-zero-flat`
 * fails the build if it grows a fifth:
 *
 *   the canvas the world is drawn into
 *   the accessibility bridge — a live region and a semantic outline of
 *     the world, so a screen reader receives the graph rather than
 *     nothing
 *   text input, which no GPU surface can honestly provide
 *   one boot notice, which is replaced by the world the moment the
 *     world exists, and says the truth while it does not
 *
 * Signing in is text input, so it is a real form. Everything after it
 * is space.
 */
import {Berx5DWorldApp, berxTemporalCursor, type BerxSocialAction, type BerxSpatialAudioBackend, type BerxSpatialObject, type BerxWorldIngest, type BerxWorldPersistence, type BerxWorldPosition} from '@berx/spatial';
import {createBerx5DWebHost, type Berx5DWebHost} from './runtimeHost5d';
import {createBerxWebRenderer} from './webRenderer';
import {berxMeasureLabel} from './spatialText';
import {BerxWebSpatialAudio} from './spatialAudioWeb';
import {BerxWebVoice} from './voiceWeb';
import {berxVoiceToWorld, type BerxVoiceToWorld} from './voiceToWorld';

export interface BerxAppShellOptions {
	/** Where the world is drawn. Created and appended when omitted. */
	mount?: HTMLElement;
	/**
	 * Brings back real entities. This is the only door data comes
	 * through, and it is the caller's — the shell never invents a row
	 * and never renders a placeholder for one that did not arrive.
	 */
	load: () => Promise<{entries: BerxWorldIngest[]; viewerId?: string; failures: {source: string; message: string}[]}>;
	reducedMotion?: boolean;
	textureBudget?: number;
	/**
	 * Which GPU backend to run on.
	 *
	 * The default asks for the best one this browser has — WebGPU where
	 * it grants a device, WebGL2 where it does not. Naming one is for
	 * verification, which has to be able to say which backend a
	 * measurement came from.
	 */
	renderer?: 'auto' | 'webgl2' | 'webgpu';
	/**
	 * Where the world is heard from.
	 *
	 * On by default: a real Web Audio listener that follows the camera,
	 * so a sound placed at an entity is behind you exactly when the
	 * entity is. It plays nothing by itself — BERX ships no audio assets
	 * and invents no media — so a session with no sounds is silent, and
	 * that silence is the truth rather than a broken pipeline.
	 *
	 * Browsers refuse audio before a gesture, so the context starts
	 * suspended and is resumed by the first real one on the canvas.
	 * Pass a backend to drive different hardware, or false for none.
	 */
	audio?: BerxSpatialAudioBackend | false;
	/** Told what the viewer is looking at, for the accessibility outline. */
	onPositionChange?: (position: BerxWorldPosition) => void;
	/**
	 * Where the viewer was last time, if anywhere.
	 *
	 * Restored after the entities are read back from the server, never
	 * instead of them — a stale copy of somebody's feed loaded from disk
	 * is the fake data this runtime refuses. What comes back is the
	 * place; what fills it is live.
	 */
	restore?: () => BerxWorldPersistence | undefined;
	/** Called whenever the viewer moves, so their place survives a reload. */
	remember?: (state: BerxWorldPersistence) => void;
	/**
	 * Publish what someone wrote.
	 *
	 * Must call the real API and return the entity the server created,
	 * so what enters the world is the server's row and not the text
	 * that was typed. Rejecting keeps the field open with the reason.
	 */
	publish?: (text: string) => Promise<BerxWorldIngest>;
	/**
	 * Carry out an action on an entity, through the real API.
	 *
	 * Must resolve only once the server has confirmed, and should
	 * return the server's own updated row so the world shows what
	 * actually happened rather than what was asked for.
	 */
	act?: (action: BerxSocialAction, object: BerxSpatialObject) => Promise<BerxWorldIngest | undefined>;
	/** What each action is called, in the viewer's language. */
	/** Every action's name in the viewer's language — all of them, see Berx5DWorldApp. */
	actionLabels?: Record<BerxSocialAction, string>;
	/**
	 * Bring back whatever a region needs that the first load did not.
	 *
	 * Arriving somewhere in BERX can require reading more from the
	 * server — a conversation's messages are not in the first load, and
	 * fetching every thread up front would be reading the whole account
	 * to show one world. Whatever comes back is ingested into the same
	 * world, so entities already there are updated rather than
	 * duplicated. Returning nothing is a normal answer.
	 */
	loadRegion?: (
		position: BerxWorldPosition,
		/** The entity the viewer is with, when there is one. */
		focused: BerxSpatialObject | undefined,
	) => Promise<{entries: BerxWorldIngest[]; failures: {source: string; message: string}[]} | undefined>;
	/**
	 * Keep this world live.
	 *
	 * Called once, after the first load has filled the world — the
	 * channels a session needs are derived from who is in it, so
	 * connecting before there is a world would subscribe to nothing.
	 * What comes back is closed when the session is.
	 *
	 * The shell does not know what a socket is: this is a callback
	 * because @berx/spatial-web owns the world and @berx/api owns the
	 * transport, and joining them here would make the renderer package
	 * depend on the API client. Rejecting is a real outcome — a
	 * deployment with no socket configured is not live, and that lands
	 * in `failures` under `realtime` rather than as a session that
	 * quietly never updates.
	 */
	live?: (world: Berx5DWorldApp) => Promise<{close(): void}>;
	/**
	 * Talking to BERX.
	 *
	 * berxVoiceToWorld turns a sentence into a confirmed change of the
	 * world and BerxWebVoice turns a microphone into a transcript; both
	 * were verified and neither was ever constructed by a shipped
	 * session, so a person in front of BERX could not say anything to
	 * it. This is what gives them the microphone.
	 *
	 * `client` is the real API client — a plan step's capability is a
	 * method name on it, and a name with no method behind it fails
	 * rather than being invented. Nothing here interprets a sentence;
	 * that is @berx/spatial's intent engine, once, for every platform.
	 *
	 * Voice-first, never voice-only: every capability it reaches is
	 * reachable from the keyboard and from a finger, and a browser with
	 * no synthesiser gets the silent path rather than a broken one.
	 */
	voice?: {
		client: Record<string, unknown>;
		/** Where the person is, when they have allowed it to be known. */
		location?: () => {lat: number; lng: number; atMs: number} | undefined;
		/** What the platform has actually granted. Never assumed. */
		permissions?: () => {microphone: boolean; location: boolean; notifications: boolean; presence: boolean};
		/** How long the microphone stays open. Default 8s. */
		listenMs?: number;
	} | false;
}

export interface BerxAppShell {
	readonly host: Berx5DWebHost;
	readonly world: Berx5DWorldApp;
	/**
	 * Where the world is heard from, unless the caller turned it off.
	 *
	 * Exposed because playing is the caller's: whatever real audio URL
	 * the server hands over is played from the position of the entity it
	 * belongs to, and the panning is correct because this listener is
	 * the camera.
	 */
	readonly audio?: BerxSpatialAudioBackend;
	/**
	 * Settles once the live connection has either opened or failed.
	 *
	 * Nothing waits on it to use the world — the world is already there
	 * — but a caller that needs to know whether this session is live,
	 * verification included, has something to await instead of a
	 * timeout. Undefined when no caller asked for a live world.
	 */
	readonly connected?: Promise<void>;
	/**
	 * The voice, when this session has one.
	 *
	 * Exposed so a native bridge, a hardware button or the verification
	 * can open the microphone the same way the keyboard does. There is
	 * no on-screen control, because a microphone button is a piece of 2D
	 * interface that is always there whether or not anyone is talking.
	 */
	readonly voice?: BerxVoiceToWorld;
	/** Open the microphone and run whatever was said. Nothing when silent. */
	listen(): Promise<void>;
	/** What did not load, named. Never hidden behind a plausible world. */
	readonly failures: readonly {source: string; message: string}[];
	/**
	 * Open the creation surface at the entity in focus.
	 *
	 * Text entry is one of the few things a GPU surface cannot honestly
	 * provide, so composing is a real field — the same reason sign-in
	 * is. It is a single input that exists while you are writing and is
	 * gone the moment you are not, and what it produces is a real
	 * server entity that enters the persistent world.
	 */
	compose(): void;
	/** Re-read from the server into the same world. Identities persist. */
	refresh(): Promise<void>;
	destroy(): void;
}

/** The accessibility outline: the world graph, as text, for anyone not looking. */
function describe(world: Berx5DWorldApp): string {
	const frame = world.latestFrame;
	const position = world.worldPosition;
	const byKind = new Map<string, number>();
	for (const object of frame.world.objects) byKind.set(object.kind, (byKind.get(object.kind) ?? 0) + 1);
	const inventory = [...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([kind, n]) => `${kind}: ${n}`).join(', ');
	const focused = frame.world.activeObjectId
		? frame.world.objects.find((o) => o.id === frame.world.activeObjectId)
		: undefined;
	const when = new Date(position.cursor.at * 1000).toISOString().slice(0, 16).replace('T', ' ');
	return [
		`Мир BERX: ${frame.world.objects.length} объектов (${inventory}).`,
		`Область: ${position.region}. Время: ${when}.`,
		focused ? `В фокусе: ${focused.label ?? focused.kind}.` : 'Ничего не в фокусе.',
	].join(' ');
}

export async function startBerxApp(options: BerxAppShellOptions): Promise<BerxAppShell> {
	const mount = options.mount ?? document.body;
	mount.style.margin = '0';
	mount.style.background = '#07080A';

	/* One notice, and it says what is actually happening. It is removed
	   the moment the world exists — it is not a loading screen the world
	   is drawn behind. */
	const notice = document.createElement('p');
	notice.setAttribute('role', 'status');
	notice.setAttribute('aria-live', 'polite');
	notice.style.cssText = 'position:fixed;inset:auto 0 24px;margin:0;text-align:center;color:#A7ADB4;font:14px/1.5 system-ui,sans-serif';
	notice.textContent = 'BERX собирает мир';
	mount.appendChild(notice);

	const canvas = document.createElement('canvas');
	canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block';
	mount.appendChild(canvas);

	const world = new Berx5DWorldApp({
		reducedMotion: options.reducedMotion,
		cursor: berxTemporalCursor(),
		onAction: options.act,
		actionLabels: options.actionLabels,
		/* How far the camera stands back depends on how wide the ring
		   is, and how wide the ring is depends on how wide the words
		   are. This is the SAME measurement the renderers' atlases
		   answer with — one text shaper, one opinion about how wide a
		   word is, so framing and layout cannot describe two rings. */
		measureLabel: (label) => berxMeasureLabel(label),
		onPositionChange: (position) => {
			outline.textContent = describe(world);
			options.onPositionChange?.(position);
			options.remember?.(world.persist());
			void enterRegion(position);
		},
	});

	/* The world graph as text. A screen reader gets the world, not a
	   silent canvas and not a parallel 2D interface pretending to be
	   the product. */
	const outline = document.createElement('div');
	outline.setAttribute('role', 'status');
	outline.setAttribute('aria-live', 'polite');
	outline.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
	mount.appendChild(outline);

	/* the best GPU this browser actually has, asked for rather than
	   assumed: requesting a WebGPU adapter is asynchronous, and guessing
	   from navigator.gpu is how a page ends up with a renderer it cannot
	   use */
	const buildRenderer = () => createBerxWebRenderer(canvas, {
		textureBudget: options.textureBudget,
		prefer: options.renderer ?? 'auto',
	});
	const renderer = await buildRenderer();

	/* Real Web Audio ears, moved to the camera by the host's frame loop.
	   Constructed here rather than in the host because the shell is what
	   owns a session's lifetime, and it is the shell that disposes it. */
	const audio = options.audio === false ? undefined : (options.audio ?? new BerxWebSpatialAudio());

	const host = createBerx5DWebHost({
		canvas,
		world,
		renderer,
		audio,
		/* a lost GPU device costs pixels and nothing else: the world, the
		   camera, the time cursor and the focus are in @berx/spatial, so
		   a new backend picks up exactly where the old one stopped */
		rendererFactory: buildRenderer,
		reducedMotion: options.reducedMotion,
		textureBudget: options.textureBudget,
	});

	const failures: {source: string; message: string}[] = [];
	/* one load per place, so travelling back and forth does not re-read
	   the same thread every time the camera moves */
	const loadedRegions = new Set<string>();
	const enterRegion = async (position: BerxWorldPosition) => {
		if (!options.loadRegion) return;
		const key = `${position.region}:${position.focusId ?? ''}`;
		if (loadedRegions.has(key)) return;
		loadedRegions.add(key);
		/* the region says where the viewer is; the focused entity says
		   what they are with. A moment focused while standing in a
		   conversation is still a moment, and asking the server for a
		   conversation with a post's guid is how that goes wrong. */
		const focused = position.focusId ? world.runtime.world.getObject(position.focusId) : undefined;
		const more = await options.loadRegion(position, focused).catch((error) => {
			failures.push({source: `region:${key}`, message: error instanceof Error ? error.message : String(error)});
			return undefined;
		});
		if (!more) return;
		failures.push(...more.failures);
		if (more.entries.length > 0) {
			host.ingest(more.entries);
			outline.textContent = describe(world);
		}
	};
	const pull = async () => {
		const loaded = await options.load();
		failures.length = 0;
		failures.push(...loaded.failures);
		if (loaded.viewerId) world.setViewer(loaded.viewerId);
		host.ingest(loaded.entries);
		outline.textContent = describe(world);
		if (loaded.entries.length === 0) {
			/* An empty world is a real state — a new account, or every
			   read failing — and it says which rather than sitting on a
			   spinner that will never resolve. */
			notice.textContent = loaded.failures.length > 0
				? `BERX не смог загрузить: ${loaded.failures.map((f) => f.source).join(', ')}`
				: 'В мире пока пусто';
			notice.hidden = false;
		} else {
			notice.hidden = true;
		}
	};

	/**
	 * Composing.
	 *
	 * One field, created when someone starts writing and removed when
	 * they stop. It does not persist as furniture: BERX has no compose
	 * bar, because a bar is a piece of 2D interface that is always
	 * there whether or not anyone is writing.
	 */
	let destroyed = false;
	let composer: HTMLFormElement | undefined;
	const compose = () => {
		if (composer || !options.publish) return;
		const form = document.createElement('form');
		composer = form;
		form.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);display:flex;gap:8px;width:min(560px,calc(100% - 48px))';
		const field = document.createElement('input');
		field.setAttribute('aria-label', 'Что происходит');
		field.placeholder = 'Что происходит';
		field.style.cssText = 'flex:1;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #1C2228;background:#0D1014;color:#F2F0EB;font:inherit';
		const send = document.createElement('button');
		send.type = 'submit';
		send.textContent = 'Опубликовать';
		send.style.cssText = 'min-height:44px;padding:0 18px;border-radius:999px;border:1px solid #1C2228;background:#15191E;color:#4FD6E8;font:inherit;cursor:pointer';
		const problem = document.createElement('p');
		problem.setAttribute('role', 'alert');
		problem.style.cssText = 'position:absolute;bottom:52px;left:0;margin:0;color:#FF5C72;font:14px/1.4 system-ui,sans-serif';
		form.append(field, send, problem);
		mount.appendChild(form);
		field.focus();
		const close = () => {
			form.remove();
			composer = undefined;
			canvas.focus();
		};
		field.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') close();
		});
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const text = field.value.trim();
			if (text.length === 0 || send.disabled) return;
			send.disabled = true;
			problem.textContent = '';
			try {
				/* the server's row, not the typed text */
				const created = await options.publish!(text);
				host.ingest([created]);
				outline.textContent = describe(world);
				close();
				/* and the camera goes to what was just made */
				world.travelTo(created.object.id);
			} catch (error) {
				problem.textContent = error instanceof Error ? error.message : 'Не удалось опубликовать';
				send.disabled = false;
			}
		});
	};

	/**
	 * THE VOICE, IN A SESSION THAT REALLY HAS ONE.
	 *
	 * Built here because this is where the host and the API client are
	 * both in scope, and one binding is the whole point: `listening` and
	 * `speaking` are two of the Core's states, and until a session
	 * constructs this nothing in the product can cause either.
	 *
	 * What is said goes into the same live region everything else says,
	 * so a person who cannot hear gets the turn as text. The world it
	 * changes is the world already on screen — there is no second world
	 * for spoken results to land in.
	 */
	const speech = options.voice ? new BerxWebVoice() : undefined;
	const voice = options.voice && speech
		? berxVoiceToWorld({
			host,
			client: options.voice.client,
			location: options.voice.location,
			permissions: options.voice.permissions,
			voice: speech,
			stopSpeaking: () => speech.stop(),
			onTurn: (turn) => {
				/* the outline first: the world changed, and the sentence
				   is about the world rather than instead of it */
				outline.textContent = describe(world);
				if (turn.say.text.length > 0) outline.textContent += ` | ${turn.say.text}`;
			},
		})
		: undefined;
	const listenMs = options.voice ? options.voice.listenMs ?? 8000 : 8000;
	const listen = async () => {
		if (!voice) return;
		/* someone talking while BERX is still working is an interruption,
		   which berxVoiceToWorld routes rather than queues */
		await voice.hear(listenMs);
	};

	/**
	 * Browsers will not make sound until someone has touched the page,
	 * and there is no way around that worth taking. The first real
	 * gesture on the world resumes the context; until then the listener
	 * still tracks the camera, so nothing has to catch up afterwards.
	 */
	const resumeAudio = () => {
		canvas.removeEventListener('pointerdown', resumeAudio);
		canvas.removeEventListener('keydown', resumeAudio);
		void (audio as {resume?: () => Promise<void>} | undefined)?.resume?.();
	};
	if (audio) {
		canvas.addEventListener('pointerdown', resumeAudio);
		canvas.addEventListener('keydown', resumeAudio);
	}

	/* Enter creation from the world, on the same keyboard everything
	   else uses. Not a button in a bar: a key, from inside the world. */
	const onCompose = (event: KeyboardEvent) => {
		if (event.key !== 'n' && event.key !== 'т') return;
		if (composer) return;
		event.preventDefault();
		compose();
	};
	canvas.addEventListener('keydown', onCompose);

	/* And talking to it, on the same keyboard, from inside the world.
	   `v` is `м` on a Russian layout: one key, whichever one is under
	   the finger. Not a microphone button — that is furniture. */
	const onSpeak = (event: KeyboardEvent) => {
		if (event.key !== 'v' && event.key !== 'м') return;
		if (composer || !voice) return;
		event.preventDefault();
		void listen();
	};
	canvas.addEventListener('keydown', onSpeak);

	await pull();

	/**
	 * And now the world stays live.
	 *
	 * After the first load, because the channels come from who is
	 * actually in the world. Not awaited into the boot: a socket that
	 * takes three seconds to refuse must not hold the world behind it,
	 * and what it does when it fails is say so, in the same list every
	 * other unreachable thing is named in.
	 */
	let liveWorld: {close(): void} | undefined;
	const connected = options.live?.(world)
		.then((connection) => {
			liveWorld = connection;
			/* destroy() may have run while the socket was opening */
			if (destroyed) connection.close();
		})
		.catch((error) => {
			failures.push({source: 'realtime', message: error instanceof Error ? error.message : String(error)});
		});

	/* the entities are live; the place is restored around them */
	const remembered = options.restore?.();
	if (remembered) {
		world.restore(remembered);
		outline.textContent = describe(world);
	}
	host.start();

	/* A named handle to the world.
	 *
	 * Not a debug hook: it is how anything outside the canvas reaches
	 * the world — the verification that drives it in a real browser, an
	 * embedder, a native bridge. There is nothing else to reach, which
	 * is the point: the world is the whole application. */
	(globalThis as unknown as {__berxWorld?: Berx5DWorldApp}).__berxWorld = world;
	/* and the host, which is where the real frame cost is measured */
	(globalThis as unknown as {__berxHost?: Berx5DWebHost}).__berxHost = host;

	const shell: BerxAppShell = {
		host,
		world,
		audio,
		connected,
		voice,
		listen,
		failures,
		refresh: pull,
		compose,
		destroy: () => {
			destroyed = true;
			liveWorld?.close();
			canvas.removeEventListener('keydown', onCompose);
			canvas.removeEventListener('keydown', onSpeak);
			speech?.stop();
			canvas.removeEventListener('pointerdown', resumeAudio);
			canvas.removeEventListener('keydown', resumeAudio);
			audio?.dispose();
			composer?.remove();
			delete (globalThis as unknown as {__berxWorld?: Berx5DWorldApp}).__berxWorld;
			delete (globalThis as unknown as {__berxHost?: Berx5DWebHost}).__berxHost;
			delete (globalThis as unknown as {__berxShell?: BerxAppShell}).__berxShell;
			host.destroy();
			notice.remove();
			outline.remove();
			canvas.remove();
		},
	};
	/* and the session itself, which is what knows whether this world is
	   live and what it could not reach */
	(globalThis as unknown as {__berxShell?: BerxAppShell}).__berxShell = shell;
	return shell;
}
