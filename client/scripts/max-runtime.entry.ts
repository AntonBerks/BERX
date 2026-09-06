/**
 * Browser-side runtime evidence for the MAX checkpoint matrix.
 *
 * Builds a real scene for a real contract with the real runtime and
 * reports what the DOM actually shows. Nothing here reads source to
 * decide whether something works.
 */
import {createBerxCard, createBerxControl, createBerxEnergy, mountBerxScene, runBerxSharedElement, type BerxWebScene} from '@berx/spatial-web';
import {BERX_DEPTH_KEYS, type BerxColorWorldName, type BerxDepthKey} from '@berx/spatial';
import {findContract, BERX_V9_CONTRACTS} from '@berx/scenes';

let active: BerxWebScene | null = null;

function el(tag: string, className?: string): HTMLElement {
	const node = document.createElement(tag);
	if (className) node.className = className;
	return node;
}

function build(screenId: string, opts: {noBlur?: boolean; colorWorld?: BerxColorWorldName; reducedMotion?: boolean} = {}) {
	const contract = findContract(screenId);
	if (!contract) throw new Error(`unknown ${screenId}`);
	const root = document.getElementById('scene') as HTMLElement;
	active?.destroy();
	root.innerHTML = '';
	root.className = 'berx-scene';

	for (const depth of BERX_DEPTH_KEYS) {
		const wrapper = el('div', 'berx-layer');
		wrapper.dataset.berxDepth = depth;
		if (depth === 'D0' || depth === 'D1') {
			const surface = el('div', 'berx-surface');
			surface.dataset.berxDepth = depth;
			wrapper.appendChild(surface);
			root.appendChild(wrapper);
			continue;
		}
		const surface = createBerxCard({depth});
		const heading = el('h2');
		heading.textContent = `${depth} — ${contract.title}`;
		surface.appendChild(heading);
		const copy = el('p');
		copy.textContent = 'Реальный контент этого слоя.';
		surface.appendChild(copy);
		if (depth === 'D4') surface.appendChild(createBerxControl('Основное действие', () => undefined));
		if (depth === 'D5') {
			surface.appendChild(createBerxEnergy(64));
			surface.dataset.berxFocusHolder = 'true';
		}
		wrapper.appendChild(surface);
		root.appendChild(wrapper);
	}
	const filler = el('div', 'berx-filler');
	filler.style.height = '2400px';
	root.appendChild(filler);

	active = mountBerxScene(root, contract, {
		sampleFrames: false,
		colorWorld: opts.colorWorld,
		...(opts.noBlur ? {device: {supportsBackdropBlur: false}} : null),
		...(opts.reducedMotion ? {device: {prefersReducedMotion: true}} : null),
	});
	return active;
}

function surfaces(): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>('.berx-surface[data-berx-depth]'));
}

function gradientCount(node: HTMLElement): number {
	const bg = getComputedStyle(node).backgroundImage;
	return bg && bg !== 'none' ? bg.split(/gradient\(/).length - 1 : 0;
}

/** Distinct painted fills across the object planes — depth you can see. */
function distinctFills(): number {
	const seen = new Set<string>();
	for (const s of surfaces()) {
		const d = s.dataset.berxDepth as BerxDepthKey;
		if (d === 'D0' || d === 'D1') continue;
		seen.add(getComputedStyle(s).backgroundColor);
	}
	return seen.size;
}

function zOrderIncreasing(): boolean {
	const zs = Array.from(document.querySelectorAll<HTMLElement>('.berx-layer[data-berx-depth]')).map((n) =>
		Number(getComputedStyle(n).zIndex),
	);
	return zs.every((z, i) => i === 0 || z > zs[i - 1]);
}

/** Anything painting an edge: a lit top edge, a rim, or a real border. */
function edgeHighlights(): number {
	let n = 0;
	for (const s of surfaces()) {
		const d = s.dataset.berxDepth as BerxDepthKey;
		if (d === 'D0' || d === 'D1') continue;
		const before = getComputedStyle(s, '::before').backgroundImage;
		const cs = getComputedStyle(s);
		const bordered = cs.borderTopWidth !== '0px' && cs.borderTopColor !== 'rgba(0, 0, 0, 0)';
		if ((before && before !== 'none') || bordered) n += 1;
	}
	return n;
}

interface MaxRuntimeWindow extends Window {
	BERX_MAX: {
		contracts: () => string[];
		measure: (screenId: string) => Promise<Record<string, unknown>>;
		sharedElement: (screenId: string, reducedMotion?: boolean) => Promise<Record<string, unknown>>;
	};
}

(window as unknown as MaxRuntimeWindow).BERX_MAX = {
	contracts: () => BERX_V9_CONTRACTS.map((c) => c.screenId),

	measure: async (screenId) => {
		const scene = build(screenId);
		const root = document.getElementById('scene') as HTMLElement;
		const rootStyle = getComputedStyle(root);

		const d0 = document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D0"]')!;
		const d1 = document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D1"]')!;
		const d3 = document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D3"]')!;
		/* read now: the colour-world and no-blur builds below replace
		   the tree, and a reference into a replaced tree reads empty */
		const d3Color = getComputedStyle(d3).color;

		/* Parallax is real only if a real scroll actually moves the
		   planes, and by different amounts — one offset applied to
		   everything is a translation, not depth. The runtime writes it
		   per layer on its own frame, so this waits for one. */
		const readParallax = () =>
			Array.from(document.querySelectorAll<HTMLElement>('.berx-layer')).map((n) =>
				getComputedStyle(n).getPropertyValue('--berx-parallax-y').trim(),
			);
		window.scrollTo(0, 0);
		await new Promise((r) => requestAnimationFrame(r));
		const parallaxBefore = readParallax();
		window.scrollTo(0, 900);
		await new Promise((r) => setTimeout(r, 120));
		const parallaxAfter = readParallax();
		window.scrollTo(0, 0);

		/* pointer parallax: the runtime writes a tilt from a real pointer move */
		root.dispatchEvent(new PointerEvent('pointermove', {clientX: 100, clientY: 100, bubbles: true}));
		const tiltA = getComputedStyle(root).getPropertyValue('--berx-tilt-x');
		root.dispatchEvent(new PointerEvent('pointermove', {clientX: 900, clientY: 700, bubbles: true}));
		const tiltB = getComputedStyle(root).getPropertyValue('--berx-tilt-x');

		const focusField = scene.setFocus(document.querySelector<HTMLElement>('[data-berx-focus-holder="true"]'));
		const recessions = focusField ? focusField.recession : null;
		scene.setFocus(null);

		const measured = {
			layers: document.querySelectorAll('.berx-layer[data-berx-depth]').length,
			zOrderIncreasing: zOrderIncreasing(),
			distinctFills: distinctFills(),
			d0Gradients: gradientCount(d0),
			d1Gradients: gradientCount(d1),
			d0Background: getComputedStyle(d0).backgroundColor,
			edgeHighlights: edgeHighlights(),
			perspective: rootStyle.perspective,
			accent: rootStyle.getPropertyValue('--berx-accent').trim(),
			background: rootStyle.getPropertyValue('--berx-bg').trim(),
			atmosphereKind: scene.atmosphere.kind,
			atmospherePools: scene.atmosphere.pools.length,
			atmosphereSkyStops: scene.atmosphere.sky.stops.length,
			parallaxMoved: parallaxAfter.some((v, i) => v !== parallaxBefore[i] && v !== '' && v !== '0px'),
			parallaxDistinctOffsets: new Set(parallaxAfter.filter(Boolean)).size,
			tiltResponded: tiltA !== tiltB,
			focusRecedes: recessions ? recessions.D0 < 1 && recessions.D3 < 1 && recessions.D5 === 1 : false,
			focusEmission: focusField ? focusField.emissionGain : 0,
			enterMs: scene.scene.motion.enter.durationMs,
			exitMs: scene.scene.motion.exit.durationMs,
			focusMs: scene.scene.motion.focus.durationMs,
			ambientAllowed: scene.scene.budget.allowAmbientMotion,
			d3TextContrast: scene.scene.layers.D3.surface.textContrast,
			d3Blurred: scene.scene.layers.D3.blurred,
			touchMin: rootStyle.getPropertyValue('--berx-touch-min').trim(),
			/**
			 * The control as painted, not as laid out.
			 *
			 * `--berx-touch-min` is a *layout* minimum: the control plane
			 * is nearer the camera, so the runtime divides 44 by that
			 * projection and a smaller box paints at the right size. On
			 * the MESSAGES family that layout number is 43, which looks
			 * like a violation and is not one — the camera magnifies it
			 * past 44 before anyone can touch it. getBoundingClientRect
			 * includes the transform, so this measures what the finger
			 * actually gets.
			 */
			controlPaintedPx: (() => {
				const control = document.querySelector<HTMLElement>('.berx-control');
				if (!control) return 0;
				const box = control.getBoundingClientRect();
				return Math.round(Math.min(box.width, box.height) * 100) / 100;
			})(),
		};

		/* the same scene with the glass taken away: depth that survives
		   is composed depth, which is what the archive requires */
		build(screenId, {noBlur: true});
		const noBlurFills = distinctFills();
		const noBlurEdges = edgeHighlights();

		/* two colour worlds, same contract: an environment identity
		   rather than a swapped accent */
		build(screenId, {colorWorld: 'Turquoise'});
		const t = {
			accent: getComputedStyle(root).getPropertyValue('--berx-accent').trim(),
			bg: getComputedStyle(root).getPropertyValue('--berx-bg').trim(),
			d1: gradientCount(document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D1"]')!),
			atmosphere: active!.atmosphere.sky.stops.map((s) => s.color).join(','),
			glow: getComputedStyle(root).getPropertyValue('--berx-d5-glow').trim(),
		};
		build(screenId, {colorWorld: 'Crimson'});
		const c = {
			accent: getComputedStyle(root).getPropertyValue('--berx-accent').trim(),
			bg: getComputedStyle(root).getPropertyValue('--berx-bg').trim(),
			d1: gradientCount(document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D1"]')!),
			atmosphere: active!.atmosphere.sky.stops.map((s) => s.color).join(','),
			glow: getComputedStyle(root).getPropertyValue('--berx-d5-glow').trim(),
		};

		/* reduced motion: the scene must resolve shorter, calmer motion */
		build(screenId, {reducedMotion: true});
		const reduced = {
			enterMs: active!.scene.motion.enter.durationMs,
			ambientAllowed: active!.scene.budget.allowAmbientMotion,
			reducedMotion: active!.scene.reducedMotion,
		};

		return {
			...measured,
			d3Color: d3Color,
			noBlurFills,
			noBlurEdges,
			colorWorld: {
				accentChanged: t.accent !== c.accent,
				backgroundChanged: t.bg !== c.bg,
				atmosphereChanged: t.atmosphere !== c.atmosphere,
				glowChanged: t.glow !== c.glow,
			},
			reduced,
		};
	},

	sharedElement: async (screenId, reducedMotion) => {
		build(screenId);
		const source = document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D3"]');
		const destination = document.querySelector<HTMLElement>('.berx-surface[data-berx-depth="D2"]');
		if (!source || !destination) return {ran: false};
		const run = runBerxSharedElement(source, destination, {reducedMotion});
		const mid = destination.dataset.berxSharedElement ?? null;
		await run.finished;
		return {ran: true, travelled: run.travelled, mid, cleared: destination.dataset.berxSharedElement === undefined};
	},
};
