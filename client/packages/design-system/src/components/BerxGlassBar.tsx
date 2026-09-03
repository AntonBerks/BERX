/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX GLASS BAR — a full-bleed strip of real glass.
 *
 * BerxGlassSurface's own base style draws a border on all four edges,
 * which is correct for a floating PANEL and wrong for a bar meant to
 * run edge-to-edge: it would draw a visible hairline down the screen's
 * own left and right sides. A bar needs exactly one edge — the one
 * separating it from whatever content it sits above. This composes the
 * SAME real recipe BerxGlassSurface uses (a genuine BlurView backdrop,
 * see that component's own header for what "real" means there, plus
 * the level's own fill on top of it) for that different shape, so both
 * primitives stay visually identical without either reimplementing the
 * other's border logic.
 *
 * Written after the same four or so lines were about to be composed by
 * hand a second time (FeedScreen's floating header, then BerxHeader's
 * own floating mode) — factored out before a third copy could drift
 * from the other two.
 */
import type {ReactNode} from 'react';
import {View, StyleSheet, StyleProp, ViewStyle, LayoutChangeEvent} from 'react-native';
import {BlurView} from 'expo-blur';
import {useBerxGlass} from '../theme';
import type {BerxGlassLevel} from '../tokens';

export interface BerxGlassBarProps {
	/** BERX Glass level 1-4 — same ladder BerxGlassSurface uses. Defaults to 2. */
	level?: BerxGlassLevel;
	/** Which edge carries the hairline — the edge facing the content it sits above. */
	edge?: 'top' | 'bottom';
	children?: ReactNode;
	/** Accepts an array — callers commonly compose a base style with a computed size/position. */
	style?: StyleProp<ViewStyle>;
	/** Real measured size — a floating bar's own height is not always known upfront by whatever needs to clear it. */
	onLayout?: (e: LayoutChangeEvent) => void;
}

export function BerxGlassBar({level = 2, edge = 'bottom', children, style, onLayout}: BerxGlassBarProps) {
	const glass = useBerxGlass();
	const g = glass[level];
	return (
		<View style={[styles.base, style]} onLayout={onLayout}>
			{/* See BerxGlassSurface's own header for the real bug this
			    `behind` zIndex fixes: on web, these absolute decorative
			    layers otherwise paint ABOVE a plain <Svg> child regardless
			    of DOM order (react-native-svg's <Svg> stays CSS
			    `position: static`, unlike RNW's own <View>). */}
			<BlurView pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind]} intensity={g.blurRadius} tint="dark" />
			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind, {backgroundColor: g.fill}]} />
			<View pointerEvents="none" style={[styles.hairline, styles.behind, edge === 'top' ? {top: 0} : {bottom: 0}, {backgroundColor: g.border}]} />
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {overflow: 'hidden'},
	behind: {zIndex: -1},
	hairline: {position: 'absolute', left: 0, right: 0, height: 1},
});
