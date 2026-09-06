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
import {Berx5DWorldApp, berxTemporalCursor, type BerxWorldIngest, type BerxWorldPosition} from '@berx/spatial';
import {createBerx5DWebHost, type Berx5DWebHost} from './runtimeHost5d';

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
	/** Told what the viewer is looking at, for the accessibility outline. */
	onPositionChange?: (position: BerxWorldPosition) => void;
}

export interface BerxAppShell {
	readonly host: Berx5DWebHost;
	readonly world: Berx5DWorldApp;
	/** What did not load, named. Never hidden behind a plausible world. */
	readonly failures: readonly {source: string; message: string}[];
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
		onPositionChange: (position) => {
			outline.textContent = describe(world);
			options.onPositionChange?.(position);
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

	const host = createBerx5DWebHost({
		canvas,
		world,
		reducedMotion: options.reducedMotion,
		textureBudget: options.textureBudget,
	});

	const failures: {source: string; message: string}[] = [];
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

	await pull();
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

	return {
		host,
		world,
		failures,
		refresh: pull,
		destroy: () => {
			delete (globalThis as unknown as {__berxWorld?: Berx5DWorldApp}).__berxWorld;
			delete (globalThis as unknown as {__berxHost?: Berx5DWebHost}).__berxHost;
			host.destroy();
			notice.remove();
			outline.remove();
			canvas.remove();
		},
	};
}
