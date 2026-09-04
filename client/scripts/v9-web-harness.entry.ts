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
	type BerxWebScene,
} from '@berx/spatial-web';
import {BERX_DEPTH_KEYS, type BerxAtmosphereKind, type BerxDepthKey} from '@berx/spatial';
import {findContract, resolveScreen, BERX_V9_CONTRACTS} from '@berx/scenes';

interface BerxHarnessWindow extends Window {
	BERX_HARNESS: {
		mount: (screenId: string, opts?: BerxHarnessMountOptions) => void;
		contracts: () => string[];
		scene: () => BerxWebScene | null;
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
