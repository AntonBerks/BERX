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
 * One blade of the mark, drawn as TWO faces of a single folded plane:
 * a lit face and a shadow face meeting on the blade's spine. That fold
 * is the whole reason the symbol reads as an object rather than as a
 * flat glyph — a blade painted in one tone is a shape, a blade with
 * two is a surface catching light.
 *
 * The wedge is narrow at the centre and wide at the tip, so four of
 * them open outward like an aperture instead of closing into a star.
 * A small inner radius keeps them from meeting: the gap at the centre
 * is where the light comes through, and it is what stops the mark
 * turning into a solid blob at small sizes.
 */
const BLADE_LIT = 'M0 -21 L-12 -88 L0 -92 Z';
const BLADE_SHADE = 'M0 -21 L0 -92 L12 -88 Z';

export interface BerxMarkProps {
	size?: number;
	/** The light on the leading faces. */
	light?: string;
	/** The body of the shadow faces. */
	body?: string;
	/** Draw the soft spill the object throws into the air around it. */
	spill?: boolean;
	style?: ViewStyle;
}

export function BerxMark({size = 96, light = '#00E5CC', body = '#0E141C', spill = true, style}: BerxMarkProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	// DIAGONALS, not axes. Rotating a vertical blade by 0/90/180/270
	// makes a plus sign; BERX's mark is an X, so the blades sit at 45°.
	// Brightness runs around the mark from the key at the upper left.
	const blades = [
		{deg: -45, lit: 1, shade: 0.5},
		{deg: 45, lit: 0.62, shade: 0.26},
		{deg: 135, lit: 0.3, shade: 0.14},
		{deg: 225, lit: 0.72, shade: 0.34},
	];
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="-100 -100 200 200">
				<Defs>
					{blades.map((b, i: number) => (
						<LinearGradient key={i} id={`${uid}-l${i}`} x1="0.5" y1="1" x2="0.5" y2="0">
							<Stop offset="0%" stopColor={light} stopOpacity={b.lit * 0.45} />
							<Stop offset="70%" stopColor={light} stopOpacity={b.lit * 0.92} />
							<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={b.lit} />
						</LinearGradient>
					))}
					{blades.map((b, i: number) => (
						<LinearGradient key={`s${i}`} id={`${uid}-s${i}`} x1="0.5" y1="1" x2="0.5" y2="0">
							<Stop offset="0%" stopColor={body} stopOpacity={0.95} />
							<Stop offset="100%" stopColor={light} stopOpacity={b.shade} />
						</LinearGradient>
					))}
					<RadialGradient id={`${uid}-spill`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor={light} stopOpacity={0.22} />
						<Stop offset="34%" stopColor={light} stopOpacity={0.08} />
						<Stop offset="100%" stopColor={light} stopOpacity={0} />
					</RadialGradient>
				</Defs>
				{spill ? <Path d="M-100 -100 H100 V100 H-100 Z" fill={`url(#${uid}-spill)`} /> : null}
				{blades.map((b, i: number) => (
					<G key={b.deg} transform={`rotate(${b.deg})`}>
						<Path d={BLADE_SHADE} fill={`url(#${uid}-s${i})`} />
						<Path d={BLADE_LIT} fill={`url(#${uid}-l${i})`} />
					</G>
				))}
			</Svg>
		</View>
	);
}

/* ------------------------------------------------------------------ */
/* The lockup                                                          */
/* ------------------------------------------------------------------ */

export function BerxLockup({
	width = 200,
	light = '#00E5CC',
	color = '#FFFFFF',
	body = '#0E141C',
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
