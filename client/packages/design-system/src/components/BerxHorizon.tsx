/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX HORIZON — original silhouette geometry that gives an
 * unphotographed screen a place to be.
 *
 * WHY THIS EXISTS. BERX is about where people go, but the screens that
 * run before there is any account — splash, welcome, the first
 * onboarding steps — have no user media and no server data to show,
 * and the stock-photo hosts this environment can reach are none. The
 * two dishonest answers were a grey placeholder box (ships an unfinished
 * screen as the design) and a fake photograph (ships someone else's
 * image, unlicensed). This is the third: real, original artwork, drawn
 * as vector geometry at runtime.
 *
 * It is NOT decoration and NOT a texture. Three receding ridges plus a
 * skyline read as distance, which is the one thing a gradient alone
 * cannot do: each band sits further back, lighter in contrast and more
 * washed out by the air in front of it — the same aerial perspective a
 * real photograph of a real horizon has. That is what makes the light
 * field above it read as a sky rather than as a coloured rectangle.
 *
 * Deterministic by seed: the same screen draws the same horizon on
 * every render, so nothing shimmers between frames or between mounts.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {G, Path, Rect, Defs, LinearGradient, Stop} from 'react-native-svg';

/** Viewbox the paths are authored in; scaled to the host by preserveAspectRatio. */
const VB_W = 100;
const VB_H = 60;

/** Small deterministic PRNG — same seed, same ridge, every time. */
function rng(seed: number): () => number {
	let s = seed >>> 0 || 1;
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return ((s >>> 0) % 100000) / 100000;
	};
}

/**
 * One ridge: a run of peaks across the full width, closed to the
 * bottom of the viewbox so it fills as a solid silhouette.
 */
function ridgePath(seed: number, baseY: number, amplitude: number, peaks: number): string {
	const rand = rng(seed);
	const step = VB_W / peaks;
	let d = `M -5 ${VB_H} L -5 ${baseY.toFixed(2)}`;
	let x = -5;
	for (let i = 0; i <= peaks; i++) {
		const nextX = -5 + (i + 1) * step * 1.1;
		const peakX = x + (nextX - x) * (0.3 + rand() * 0.4);
		const peakY = baseY - amplitude * (0.35 + rand() * 0.65);
		// Quadratic through the peak keeps the ridge soft and readable at
		// phone scale; sharp polylines read as a chart, not as terrain.
		// Cubic, not quadratic: a Q between two close low points pulls into
		// a circle, and a row of circles reads as bubbles rather than as
		// land. Two control points let each hill have a shoulder.
		const c1x = x + (peakX - x) * 0.55;
		const c2x = peakX + (nextX - peakX) * 0.45;
		const endY = baseY - amplitude * 0.12 * rand();
		d += ` C ${c1x.toFixed(2)} ${peakY.toFixed(2)} ${c2x.toFixed(2)} ${peakY.toFixed(2)} ${nextX.toFixed(2)} ${endY.toFixed(2)}`;
		x = nextX;
	}
	d += ` L 105 ${VB_H} Z`;
	return d;
}

/**
 * A skyline: flat-topped blocks of varying height, the built horizon
 * that sits in front of the natural one.
 */
interface Block {
	x: number;
	w: number;
	top: number;
}

/**
 * A skyline: flat-topped blocks of varying height, the built horizon
 * that sits in front of the natural one. Returns the blocks themselves
 * rather than only a path, so the lit windows can be placed on the
 * real geometry instead of scattered over the silhouette's bounding
 * box — a window outside a building is the tell that a skyline was
 * faked.
 */
function skylineBlocks(seed: number, baseY: number, amplitude: number, blocks: number): Block[] {
	const rand = rng(seed);
	const step = (VB_W + 10) / blocks;
	const out: Block[] = [];
	for (let i = 0; i < blocks; i++) {
		const x = -5 + i * step;
		out.push({x, w: step, top: baseY - amplitude * (0.18 + rand() * 0.82)});
	}
	return out;
}

function blocksToPath(items: Block[], baseY: number): string {
	let d = `M -5 ${VB_H} L -5 ${baseY.toFixed(2)}`;
	for (const b of items) {
		d += ` L ${b.x.toFixed(2)} ${b.top.toFixed(2)} L ${(b.x + b.w).toFixed(2)} ${b.top.toFixed(2)} L ${(b.x + b.w).toFixed(2)} ${baseY.toFixed(2)}`;
	}
	d += ` L 105 ${VB_H} Z`;
	return d;
}

/**
 * Lit windows, placed inside real blocks. This is the detail that makes
 * a night skyline read as a city with people in it rather than as a
 * black comb — and it is the only thing on this layer that is not the
 * ground colour, so it also carries the key light's own hue down into
 * the darkest mass of the frame.
 */
interface Window {
	x: number;
	y: number;
	w: number;
	h: number;
	o: number;
}

function windowsFor(items: Block[], seed: number, baseY: number): Window[] {
	const rand = rng(seed);
	const out: Window[] = [];
	for (const b of items) {
		const height = baseY - b.top;
		if (height < 3) {
			continue; // too low to hold a readable window
		}
		const cols = Math.max(1, Math.floor(b.w / 1.5));
		const rows = Math.max(1, Math.floor(height / 1.6));
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				// Most windows are dark. A fully-lit facade reads as a
				// checkerboard, not as a building at night.
				if (rand() > 0.24) {
					continue;
				}
				out.push({
					x: b.x + 0.55 + c * 1.5,
					y: b.top + 0.9 + r * 1.6,
					w: 0.42,
					h: 0.5,
					o: 0.22 + rand() * 0.5,
				});
			}
		}
	}
	return out;
}

export interface BerxHorizonProps {
	/** Silhouette colour — normally the screen's own ground. */
	color: string;
	/** Rim colour picked up along each ridge's lit edge. */
	rim?: string;
	/** Changes the terrain without changing the composition. */
	seed?: number;
	/** Draw the built skyline in front of the natural ridges. */
	skyline?: boolean;
	/**
	 * Height of the fade to `color` at the base, as a fraction of the
	 * field. Without it the layer ends on a hard horizontal cut wherever
	 * its container does, which is the one thing that gives away that a
	 * skyline is a drawn layer rather than a photographed distance.
	 */
	fade?: number;
	style?: ViewStyle;
}

export function BerxHorizon({color, rim, seed = 7, skyline = true, fade = 0.22, style}: BerxHorizonProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	// THREE CITY BANDS, far to near. The first version put rolling hills
	// in front, which at phone scale read as smooth domes — bubbles, not
	// land — and buried the one shape that says what BERX is about. A
	// city seen from a distance IS the subject, so it gets all three
	// depth planes: each nearer band is darker, taller, coarser-grained
	// and closer to solid, exactly as aerial perspective works.
	const layers = useMemo(
		() => [
			{blocks: skylineBlocks(seed * 71 + 11, 30, 9, 26), baseY: 30, opacity: 0.34, lit: 0.5},
			{blocks: skylineBlocks(seed * 131 + 5, 43, 13, 18), baseY: 43, opacity: 0.7, lit: 0.75},
			{blocks: skylineBlocks(seed * 199 + 3, 60, 18, 11), baseY: 60, opacity: 0.99, lit: 1},
		],
		[seed],
	);
	// One low, very faint ridge behind everything: the land the city
	// stands on. Kept far back and nearly dissolved so it reads as
	// distance rather than as a shape of its own.
	const land = useMemo(() => ridgePath(seed * 13 + 1, 26, 6, 3), [seed]);

	return (
		<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
			<Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
				{rim ? (
					<Defs>
						{/* The rim lives only in the top sliver of the band, so an
						    edge catches the key light and the mass below stays dark —
						    the same way a real roofline is lit from behind. */}
						<LinearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
							<Stop offset="0%" stopColor={rim} stopOpacity={0.45} />
							<Stop offset="8%" stopColor={rim} stopOpacity={0.1} />
							<Stop offset="22%" stopColor={rim} stopOpacity={0} />
						</LinearGradient>
					</Defs>
				) : null}
				{fade > 0 ? (
					<Defs>
						<LinearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
							<Stop offset="0%" stopColor={color} stopOpacity={0} />
							<Stop offset="60%" stopColor={color} stopOpacity={0.86} />
							<Stop offset="100%" stopColor={color} stopOpacity={1} />
						</LinearGradient>
					</Defs>
				) : null}
				<Path d={land} fill={color} fillOpacity={0.22} />
				{skyline
					? layers.map((layer, i: number) => {
							const d = blocksToPath(layer.blocks, layer.baseY);
							const lights = windowsFor(layer.blocks, seed * 97 + i * 17 + 5, layer.baseY);
							return (
								<G key={i}>
									<Path d={d} fill={color} fillOpacity={layer.opacity} />
									{rim ? <Path d={d} fill={`url(#${uid}-rim)`} /> : null}
									{rim
										? lights.map((w: Window, j: number) => (
												<Rect
													key={`w${j}`}
													x={w.x}
													y={w.y}
													width={w.w}
													height={w.h}
													fill={rim}
													fillOpacity={w.o * layer.lit}
												/>
										  ))
										: null}
								</G>
							);
					  })
					: null}
				{fade > 0 ? (
					<Rect x="0" y={VB_H - fade * VB_H} width={VB_W} height={fade * VB_H} fill={`url(#${uid}-fade)`} />
				) : null}
			</Svg>
		</View>
	);
}
