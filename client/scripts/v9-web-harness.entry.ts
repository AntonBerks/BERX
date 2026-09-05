/**
 * Browser entry for the v9 web runtime probe.
 *
 * Builds a real DOM scene for a real v9 contract using the real
 * runtime — the same resolveScene the React Native app calls, the
 * same custom properties styles/berx-5d.css consumes. Nothing about
 * the scene it renders is probe-specific, which is what makes the
 * measurements in v9-web-probe.mjs meaningful.
 */
import {
	createBerxCard,
	createBerxControl,
	createBerxEnergy,
	createBerxLayer,
	mountBerxScene,
	runBerxSharedElement,
	type BerxWebScene,
} from '@berx/spatial-web';
import {BERX_DEPTH_KEYS, type BerxAtmosphereKind, type BerxDepthKey} from '@berx/spatial';
import {findContract, resolveScreen, BERX_V9_CONTRACTS} from '@berx/scenes';

interface BerxHarnessWindow extends Window {
	BERX_HARNESS: {
		mount: (screenId: string, opts?: BerxHarnessMountOptions) => void;
		contracts: () => string[];
		scene: () => BerxWebScene | null;
		sharedElement: (reducedMotion?: boolean) => Promise<Record<string, unknown>>;
		focus: (on: boolean) => Record<string, unknown> | null;
		focusBox: () => {x: number; y: number; width: number; height: number} | null;
		resolveAll: () => {resolved: number; total: number};
	};
}

export interface BerxHarnessMountOptions {
	highContrast?: boolean;
	sampleFrames?: boolean;
	/**
	 * Renders the scene as a device with no backdrop-filter at all.
	 * This is the condition the v9 visual-acceptance rule names: with
	 * the glass gone, the scene must still read as a space.
	 */
	noBlur?: boolean;
	/** Overrides the family's environment, for comparing kinds. */
	atmosphereKind?: BerxAtmosphereKind;
	/**
	 * Strips the composed environment and leaves the substrate fill —
	 * the "one generic background" BERX is not allowed to ship. The
	 * probe renders this to prove the depth in a real scene comes from
	 * composition rather than from the glass.
	 */
	flatEnvironment?: boolean;
	/** Hides D2–D5 so the environment can be measured on its own. */
	environmentOnly?: boolean;
	/** Real media URL for D1, when a page has one. */
	atmosphereMediaUrl?: string;
}

let active: BerxWebScene | null = null;

function el(tag: string, className?: string, attrs?: Record<string, string>): HTMLElement {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
	return node;
}

/* the shipped primitives, not a copy of them — so the probe measures
   what a real web client would actually render */
function layer(depth: BerxDepthKey, withSurface: boolean): HTMLElement {
	return createBerxLayer(depth, {surface: withSurface});
}

function build(screenId: string, opts: BerxHarnessMountOptions) {
	const contract = findContract(screenId);
	if (!contract) throw new Error(`unknown screen ${screenId}`);

	const root = document.getElementById('scene') as HTMLElement;
	active?.destroy();
	root.innerHTML = '';
	root.className = 'berx-scene';

	for (const depth of BERX_DEPTH_KEYS) {
		if (depth === 'D0' || depth === 'D1') {
			root.appendChild(layer(depth, true));
			continue;
		}
		const wrapper = layer(depth, false);
		const surface = createBerxCard({depth});
		surface.classList.add('berx-enter');

		const heading = el('h2');
		heading.textContent = `${depth} — ${contract.title}`;
		surface.appendChild(heading);

		const copy = el('p');
		copy.textContent =
			'Реальный контент этого слоя. Текст должен оставаться читаемым на любом материале и при любом освещении.';
		surface.appendChild(copy);

		if (depth === 'D4') {
			surface.appendChild(createBerxControl('Основное действие', () => undefined));
		}
		if (depth === 'D5') {
			surface.appendChild(createBerxEnergy(64));
			/* the object focus is given to.
			 *
			 * It is on the focus plane rather than inside the content,
			 * because the clearing is painted between the content and
			 * the controls: an object focused on the content plane sits
			 * under its own falloff and darkens with the surround it is
			 * supposed to be emerging from. Focus promotes — this is
			 * what promoted looks like in the DOM. */
			surface.classList.add('berx-focus-holder');
			surface.dataset.berxFocusHolder = 'true';
		}

		wrapper.appendChild(surface);
		root.appendChild(wrapper);
	}

	/* tall filler so scrolling — and therefore parallax — is real */
	const filler = el('div', 'berx-filler', {'aria-hidden': 'true'});
	filler.style.height = '2400px';
	root.appendChild(filler);

	active = mountBerxScene(root, contract, {
		highContrast: opts.highContrast === true,
		sampleFrames: opts.sampleFrames === true,
		atmosphereKind: opts.atmosphereKind,
		atmosphereMediaUrl: opts.atmosphereMediaUrl,
		...(opts.noBlur ? {device: {supportsBackdropBlur: false}} : null),
	});

	if (opts.flatEnvironment) {
		root.style.setProperty('--berx-d1-atmosphere', 'none');
	}
	if (opts.environmentOnly) {
		for (const depth of ['D2', 'D3', 'D4', 'D5']) {
			const el = root.querySelector<HTMLElement>(`.berx-layer[data-berx-depth="${depth}"]`);
			if (el) el.style.visibility = 'hidden';
		}
		const filler = root.querySelector<HTMLElement>('.berx-filler');
		if (filler) filler.style.visibility = 'hidden';
	}
}

const w = window as unknown as BerxHarnessWindow;
w.BERX_HARNESS = {
	mount: (screenId, opts) => build(screenId, opts ?? {}),
	contracts: () => BERX_V9_CONTRACTS.map((c) => c.screenId),
	scene: () => active,
	/**
	 * Runs the archive's shared-element transition between two real
	 * elements in the page — a card on the list plane and the hero it
	 * opens into — and reports what actually happened, so the probe
	 * measures the transition rather than the intention.
	 */
	sharedElement: async (reducedMotion?: boolean) => {
		const root = document.getElementById('scene') as HTMLElement;
		const source = root.querySelector('.berx-surface[data-berx-depth="D3"]') as HTMLElement | null;
		const destination = root.querySelector('.berx-surface[data-berx-depth="D2"]') as HTMLElement | null;
		if (!source || !destination) return {ran: false};
		const run = runBerxSharedElement(source, destination, {reducedMotion});
		const mid = destination.dataset.berxSharedElement ?? null;
		const midTransform = getComputedStyle(destination).transform;
		await run.finished;
		return {
			ran: true,
			travelled: run.travelled,
			mid,
			midTransform,
			endTransform: getComputedStyle(destination).transform,
			cleared: destination.dataset.berxSharedElement === undefined,
		};
	},

/**
	 * Gives the scene's focus to the promoted object, or takes it
	 * back. Returns the field the runtime actually resolved plus the
	 * recessions it wrote onto the real layer elements, so the probe
	 * reads the DOM's state rather than the runtime's intention.
	 */
	focus: (on: boolean) => {
		if (!active) return null;
		const root = document.getElementById('scene') as HTMLElement;
		const holder = root.querySelector<HTMLElement>('[data-berx-focus-holder="true"]');
		if (!holder) return null;
		const field = active.setFocus(on ? holder : null);
		const applied: Record<string, string> = {};
		for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-berx-depth]'))) {
			applied[el.dataset.berxDepth as string] = el.style.getPropertyValue('--berx-focus-recession');
		}
		return {
			field: field as unknown as Record<string, unknown> | null,
			applied,
			focused: root.dataset.berxFocused,
			clearingPresent: root.querySelector('.berx-focus-clearing') !== null,
			clearingBackground: (() => {
				const c = root.querySelector<HTMLElement>('.berx-focus-clearing');
				return c ? getComputedStyle(c).backgroundImage.slice(0, 90) : null;
			})(),
		};
	},

	focusBox: () => {
		const root = document.getElementById('scene') as HTMLElement;
		const holder = root.querySelector<HTMLElement>('[data-berx-focus-holder="true"]');
		if (!holder) return null;
		const r = holder.getBoundingClientRect();
		return {x: r.left, y: r.top, width: r.width, height: r.height};
	},

	/**
	 * Resolves all 300 in the browser, not just in Node — a contract
	 * that resolves under Node's module graph but fails in a real
	 * browser is not resolved.
	 */
	resolveAll: () => {
		let resolved = 0;
		for (const c of BERX_V9_CONTRACTS) {
			const screen = resolveScreen({
				screen: c.screenId,
				device: {platform: 'desktop', supportsBackdropBlur: true},
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
			});
			if (screen) resolved += 1;
		}
		return {resolved, total: BERX_V9_CONTRACTS.length};
	},
};
