/**
 * BERX LOGO — a drawn logotype and a drawn symbol.
 *
 * Everything before this rendered the word "BERX" as a <Text> with
 * letter-spacing on it. That is not a logo, it is a label: it inherits
 * whatever font the device happens to have, its proportions change
 * between iOS and Android, and it has no relationship to any other
 * BERX form. This is real geometry instead — constructed on one grid,
 * one stroke weight, one set of radii — so the mark is the same object
 * everywhere and can be scaled, cropped, animated and lit like an
 * object rather than reflowed like text.
 *
 * CONSTRUCTION. Cap height 100, stroke 15, letter width 62, round
 * joins throughout. The bowls of B and R are true semicircular arcs on
 * that same grid, so the curves agree with each other instead of being
 * eyeballed. The X is two straight diagonals at the letter's full
 * width, which makes it the widest, most open letter in the word — it
 * is the one BERX is named for, so it is allowed to be the loud one.
 *
 * THE SYMBOL is that X taken off the baseline and turned into an
 * aperture: four tapered blades meeting at a centre they never quite
 * touch. Closed, it is a monogram; open, it is a lens — which is what
 * the product does. It carries the light on its leading edges the same
 * way every other BERX object does, so the symbol, the lens and the
 * emblem are visibly one family.
 */
import {useMemo} from 'react';
import {View, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, RadialGradient, Stop, Path, G} from 'react-native-svg';

/* ------------------------------------------------------------------ */
/* The logotype                                                        */
/* ------------------------------------------------------------------ */

const CAP = 100;
const STROKE = 15;
const ADVANCE = 78; // letter width 62 + 16 sidebearing

/** Geometry for each glyph, authored on the shared 62 × 100 grid. */
const GLYPHS: Record<string, string[]> = {
	// Stem, then two true semicircular bowls sharing the stem.
	B: [
		'M0 0 L0 100',
		'M0 0 L26 0 A25 25 0 0 1 26 50 L0 50',
		'M0 50 L30 50 A25 25 0 0 1 30 100 L0 100',
	],
	// Stem and three bars. The middle bar is short, as it is on every
	// geometric sans worth copying — a full-width middle bar makes an E
	// look like a stack of shelves.
	E: ['M0 0 L0 100', 'M0 0 L56 0', 'M0 50 L44 50', 'M0 100 L56 100'],
	// Stem, one bowl, one straight leg leaving the bowl's shoulder.
	R: ['M0 0 L0 100', 'M0 0 L28 0 A26 26 0 0 1 28 52 L0 52', 'M26 52 L58 100'],
	// Full width, both diagonals. The widest letter in the word.
	X: ['M0 0 L62 100', 'M62 0 L0 100'],
};

const WORD = ['B', 'E', 'R', 'X'];
const WORD_W = ADVANCE * (WORD.length - 1) + 62;

export interface BerxWordmarkProps {
	/** Rendered width; height follows the logotype's own proportion. */
	width?: number;
	color?: string;
	/** Colour for the X, when it should carry the accent. */
	accent?: string;
	style?: ViewStyle;
}

export function BerxWordmark({width = 220, color = '#FFFFFF', accent, style}: BerxWordmarkProps) {
	// The stroke is centred on the path, so the drawn mark overhangs the
	// grid by half a stroke on every side. The viewBox is padded by
	// exactly that, or the caps are clipped.
	const pad = STROKE / 2;
	const vbW = WORD_W + STROKE;
	const vbH = CAP + STROKE;
	const height = (width * vbH) / vbW;
	return (
		<View pointerEvents="none" style={[{width, height}, style]}>
			<Svg width={width} height={height} viewBox={`0 0 ${vbW} ${vbH}`}>
				<G transform={`translate(${pad} ${pad})`}>
					{WORD.map((letter: string, i: number) => (
						<G key={letter} transform={`translate(${i * ADVANCE} 0)`}>
							{GLYPHS[letter].map((d: string, j: number) => (
								<Path
									key={j}
									d={d}
									fill="none"
									stroke={letter === 'X' && accent ? accent : color}
									strokeWidth={STROKE}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							))}
						</G>
					))}
				</G>
			</Svg>
		</View>
	);
}

/* ------------------------------------------------------------------ */
/* The symbol                                                          */
/* ------------------------------------------------------------------ */

/**
 * THE SYMBOL — one solid monogram X, and nothing else.
 *
 * Two earlier constructions were thrown away on sight. The first
 * rotated a blade by 0/90/180/270 and produced a plus sign. The second
 * put four faceted blades on the diagonals around an open centre and
 * read as scattered shards — four shapes where a mark needs one.
 *
 * This is the X from the logotype itself, at the same stroke weight
 * and the same round caps, so the symbol and the word are literally
 * the same letter. It is drawn as two crossing strokes rather than one
 * shape, and the two carry different light: the stroke running with
 * the key is bright along its length, the one running across it is in
 * shadow, and a short highlight sits where the lit stroke passes over
 * the other. That single fold is what makes it read as two planes
 * crossing in space instead of as a flat glyph — and it survives being
 * shrunk to a 16pt tab icon, which the shards never would.
 */

/** The logotype's own X, on its 62 × 100 grid, centred on the origin. */
const X_LIT = 'M-31 -50 L31 50';
const X_SHADE = 'M31 -50 L-31 50';

export interface BerxMarkProps {
	size?: number;
	/** The light along the lit stroke. */
	light?: string;
	/** The stroke lying in shadow. Normally a hair above the ground. */
	body?: string;
	/** Draw the soft spill the object throws into the air around it. */
	spill?: boolean;
	/** Flat two-tone, no gradients — for tab bars and other small sizes. */
	flat?: boolean;
	style?: ViewStyle;
}

export function BerxMark({size = 96, light = '#FF6A45', body = '#5A3A34', spill = true, flat = false, style}: BerxMarkProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	// The stroke is centred on the path, so the drawn mark overhangs its
	// grid by half a stroke; the viewBox is padded to match.
	const W = 15;
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="-58 -58 116 116">
				<Defs>
					{/* The lit stroke stays in the accent's own hue for its whole
					    length. An earlier version ramped from white, which bleached
					    the tip and made the mark look like a highlight rather than
					    like a coloured object. */}
					<LinearGradient id={`${uid}-lit`} x1="0" y1="0" x2="1" y2="1">
						<Stop offset="0%" stopColor={light} stopOpacity={1} />
						<Stop offset="52%" stopColor={light} stopOpacity={0.94} />
						<Stop offset="100%" stopColor={light} stopOpacity={0.7} />
					</LinearGradient>
					<LinearGradient id={`${uid}-shade`} x1="1" y1="0" x2="0" y2="1">
						<Stop offset="0%" stopColor={body} stopOpacity={0.92} />
						<Stop offset="100%" stopColor={body} stopOpacity={0.62} />
					</LinearGradient>
					<RadialGradient id={`${uid}-spill`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor={light} stopOpacity={0.2} />
						<Stop offset="40%" stopColor={light} stopOpacity={0.06} />
						<Stop offset="100%" stopColor={light} stopOpacity={0} />
					</RadialGradient>
				</Defs>
				{spill && !flat ? <Path d="M-58 -58 H58 V58 H-58 Z" fill={`url(#${uid}-spill)`} /> : null}
				{/* Shadow stroke first: the lit one crosses OVER it. */}
				<Path
					d={X_SHADE}
					fill="none"
					stroke={flat ? body : `url(#${uid}-shade)`}
					strokeWidth={W}
					strokeLinecap="round"
				/>
				<Path
					d={X_LIT}
					fill="none"
					stroke={flat ? light : `url(#${uid}-lit)`}
					strokeWidth={W}
					strokeLinecap="round"
				/>
				{/* The crossing highlight — a short bright run right where the
				    lit plane passes over the other. Without it the two strokes
				    read as printed on one another rather than stacked. */}
				{!flat ? (
					<Path
						d="M-9 -14 L9 14"
						fill="none"
						stroke="#FFFFFF"
						strokeOpacity={0.3}
						strokeWidth={W - 5}
						strokeLinecap="round"
					/>
				) : null}
			</Svg>
		</View>
	);
}

/* ------------------------------------------------------------------ */
/* The lockup                                                          */
/* ------------------------------------------------------------------ */

export function BerxLockup({
	width = 200,
	light = '#FF6A45',
	color = '#FFFFFF',
	body = '#5A3A34',
	style,
}: {
	width?: number;
	light?: string;
	color?: string;
	body?: string;
	style?: ViewStyle;
}) {
	// The symbol is set to the logotype's cap height, and the gap is one
	// stem width — the same relationship the letters have to each other.
	const markSize = width * 0.3;
	return (
		<View style={[{alignItems: 'center'}, style]}>
			<BerxMark size={markSize} light={light} body={body} />
			<BerxWordmark width={width} color={color} style={{marginTop: width * 0.075}} />
		</View>
	);
}
