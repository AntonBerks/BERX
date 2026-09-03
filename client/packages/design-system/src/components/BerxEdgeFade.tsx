/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX EDGE FADE — the affordance every horizontal rail in this product
 * was missing.
 *
 * THE PROBLEM. BERX has a dozen-plus horizontally scrolling rails
 * (profile reputation, story rail, trending tags, discover shelves,
 * trip stops, now, memories, communities…). Every one of them cuts off
 * hard at the viewport edge, so the last thing the user sees is a word
 * sliced mid-letter — "9 отметок  2 ог". A hard cut does not read as
 * "there is more this way", it reads as broken text or a layout bug,
 * and it is the single most repeated visual defect in the product.
 *
 * THE FIX. A short gradient at the edge, from transparent to the colour
 * the rail sits on. It does two things at once: it makes the clipped
 * item dissolve instead of snapping off, and the dissolve itself is the
 * universally-read signal that content continues past the edge. This is
 * what the affordance IS in every well-made scrolling interface — not a
 * scrollbar, which mobile hides, and not an arrow, which is a control
 * the user cannot press.
 *
 * WHY IT TAKES A `color` RATHER THAN READING THE THEME. A fade only
 * works if it lands exactly on the colour behind it; a fade to
 * colors.bg over a photo scrim is a visible dark smear. The caller
 * knows what its rail is sitting on, so the caller says.
 *
 * Renders nothing but a gradient and never takes touches, so it cannot
 * eat a scroll gesture on the rail it belongs to.
 */
import {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';

export interface BerxEdgeFadeProps {
	/** The colour the rail sits on — what the fade resolves to. */
	color: string;
	/** Which edge. 'right' is the common case: content continues rightward. */
	side?: 'left' | 'right';
	/** Fade length in px. Long enough to read as a dissolve, short enough not to hide an item. */
	width?: number;
	/** Full opacity of the covered edge. Lower it over busy media. */
	opacity?: number;
}

export function BerxEdgeFade({color, side = 'right', width = 40, opacity = 1}: BerxEdgeFadeProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	// The solid end is always the OUTER edge — the screen border — and the
	// transparent end always faces the content.
	const solidFirst = side === 'right';
	return (
		<View
			pointerEvents="none"
			style={[styles.base, side === 'right' ? styles.right : styles.left, {width, opacity}]}>
			<Svg width="100%" height="100%">
				<Defs>
					<LinearGradient id={`${uid}-fade`} x1="0" y1="0" x2="1" y2="0">
						<Stop offset="0%" stopColor={color} stopOpacity={solidFirst ? 0 : 1} />
						<Stop offset="100%" stopColor={color} stopOpacity={solidFirst ? 1 : 0} />
					</LinearGradient>
				</Defs>
				<Rect x="0" y="0" width="100%" height="100%" fill={`url(#${uid}-fade)`} />
			</Svg>
		</View>
	);
}

const styles = StyleSheet.create({
	base: {position: 'absolute', top: 0, bottom: 0},
	right: {right: 0},
	left: {left: 0},
});
