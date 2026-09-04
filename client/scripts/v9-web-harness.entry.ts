/**
 * Browser entry for the v9 web runtime probe.
 *
 * Builds a real DOM scene for a real v9 contract using the real
 * runtime — the same resolveScene the React Native app calls, the
 * same custom properties styles/berx-5d.css consumes. Nothing about
 * the scene it renders is probe-specific, which is what makes the
 * measurements in v9-web-probe.mjs meaningful.
 */
import {mountBerxScene, type BerxWebScene} from '@berx/spatial-web';
import {BERX_DEPTH_KEYS, type BerxDepthKey} from '@berx/spatial';
import {findContract, resolveScreen, BERX_V9_CONTRACTS} from '@berx/scenes';

interface BerxHarnessWindow extends Window {
	BERX_HARNESS: {
		mount: (screenId: string, opts?: {highContrast?: boolean; sampleFrames?: boolean}) => void;
		contracts: () => string[];
		scene: () => BerxWebScene | null;
		resolveAll: () => {resolved: number; total: number};
	};
}

let active: BerxWebScene | null = null;

function el(tag: string, className?: string, attrs?: Record<string, string>): HTMLElement {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
	return node;
}

function layer(depth: BerxDepthKey, withSurface: boolean): HTMLElement {
	const node = el('div', 'berx-layer', {'data-berx-depth': depth});
	/* D0/D1 are the room: decorative, and hidden from assistive technology */
	if (depth === 'D0' || depth === 'D1') node.setAttribute('aria-hidden', 'true');
	if (withSurface) {
		const surface = el('div', 'berx-surface', {'data-berx-depth': depth});
		node.appendChild(surface);
		return node;
	}
	return node;
}

function build(screenId: string, highContrast: boolean, sampleFrames: boolean) {
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
		const surface = el('div', 'berx-surface berx-enter', {'data-berx-depth': depth});

		const heading = el('h2');
		heading.textContent = `${depth} — ${contract.title}`;
		surface.appendChild(heading);

		const copy = el('p');
		copy.textContent =
			'Реальный контент этого слоя. Текст должен оставаться читаемым на любом материале и при любом освещении.';
		surface.appendChild(copy);

		if (depth === 'D4') {
			const button = el('button', 'berx-focusable berx-control', {type: 'button'});
			button.textContent = 'Основное действие';
			surface.appendChild(button);
		}
		if (depth === 'D5') {
			const halo = el('div', 'berx-energy', {'aria-hidden': 'true'});
			halo.style.width = '64px';
			halo.style.height = '64px';
			surface.appendChild(halo);
		}

		wrapper.appendChild(surface);
		root.appendChild(wrapper);
	}

	/* tall filler so scrolling — and therefore parallax — is real */
	const filler = el('div', 'berx-filler', {'aria-hidden': 'true'});
	filler.style.height = '2400px';
	root.appendChild(filler);

	active = mountBerxScene(root, contract, {highContrast, sampleFrames});
}

const w = window as unknown as BerxHarnessWindow;
w.BERX_HARNESS = {
	mount: (screenId, opts) => build(screenId, opts?.highContrast === true, opts?.sampleFrames === true),
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
