/**
 * The one place a BERX material is actually painted on React Native.
 *
 * Every spatial component renders through this, so a material change
 * lands everywhere at once and no screen can hand-roll its own idea
 * of what glass looks like.
 *
 * Two platform truths are handled honestly rather than pretended
 * away:
 *
 *  - React Native has no backdrop filter without a native module, so
 *    `surface.blurPx` is 0 on mobile and the material resolver has
 *    already substituted an opaque surface at the same elevation.
 *    Nothing is blurred badly; it is simply solid, and it says so via
 *    `surface.opaqueFallback`.
 *  - The key light is a real gradient. It used to be two stacked
 *    translucent bands at 38% and 30% height, which put two visible
 *    horizontal steps across every surface in the app — a light that
 *    arrives in stripes is not a light. react-native-svg is a real
 *    dependency (the icon system and the atmosphere field both use
 *    it), so the recipe's own gradient stops are painted along the
 *    recipe's own 165° axis, which is what makes a surface read as
 *    lit rather than as tinted.
 */
import React, {useMemo} from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import type {BerxLightingSpec, BerxMaterialSurface} from '@berx/spatial';

export interface BerxSurfaceProps {
	surface: BerxMaterialSurface;
	lighting: BerxLightingSpec;
	radius: number;
	children?: React.ReactNode;
	style?: ViewStyle;
	/** Adds the material's emissive glow. Only D5/energy surfaces should. */
	emissive?: boolean;
	/**
	 * Multiplier on that glow while the object holds the scene's
	 * focus. The material's declared emission is what is amplified —
	 * a surface with no emissive term stays unlit, because focus does
	 * not repaint a material, it turns its own light up.
	 */
	emissiveGain?: number;
	testID?: string;
}

/**
 * The recipe's CSS-convention angle (0° = to top, 180° = to bottom)
 * as SVG's two-point form.
 */
function keyAxis(angleDeg: number) {
	const rad = (angleDeg * Math.PI) / 180;
	const dx = Math.sin(rad);
	const dy = -Math.cos(rad);
	return {
		x1: `${(0.5 - dx / 2) * 100}%`,
		y1: `${(0.5 - dy / 2) * 100}%`,
		x2: `${(0.5 + dx / 2) * 100}%`,
		y2: `${(0.5 + dy / 2) * 100}%`,
	};
}

export function BerxSurface({surface, lighting, radius, children, style, emissive, emissiveGain = 1, testID}: BerxSurfaceProps) {
	const glowing = emissive === true && surface.glowRadius > 0;
	const glowRadius = surface.glowRadius * Math.max(1, emissiveGain);
	const axis = useMemo(() => keyAxis(lighting.key.angleDeg), [lighting.key.angleDeg]);
	/* one gradient id per recipe+depth, so two surfaces in one tree
	   cannot pick up each other's definitions */
	const gradientId = `berx-key-${lighting.recipe}-${Math.round(lighting.shadow.radius)}`;

	return (
		<View
			testID={testID}
			style={[
				styles.base,
				{
					backgroundColor: surface.backgroundColor,
					borderRadius: radius,
					borderWidth: surface.borderWidth,
					borderColor: surface.borderColor,
					shadowColor: glowing ? surface.glowColor : lighting.shadow.color,
					shadowOpacity: 1,
					shadowRadius: glowing ? glowRadius : lighting.shadow.radius,
					shadowOffset: {width: 0, height: glowing ? 0 : lighting.shadow.offsetY},
					elevation: lighting.shadow.elevation,
				},
				style,
			]}>
			{/* ambient wash — the environment's own contribution, uniform by definition */}
			<View pointerEvents="none" style={[styles.fill, {backgroundColor: lighting.ambientColor, borderRadius: radius}]} />

			{/* key light — the recipe's own gradient, along the recipe's own axis */}
			<View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
				<Svg width="100%" height="100%">
					<Defs>
						<LinearGradient id={gradientId} x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2}>
							{lighting.key.stops.map((stop, i) => (
								<Stop key={i} offset={`${stop.position * 100}%`} stopColor={stop.color} />
							))}
						</LinearGradient>
					</Defs>
					<Rect x={0} y={0} width="100%" height="100%" fill={`url(#${gradientId})`} />
				</Svg>
			</View>

			{/* specular top edge — the lit edge of a real pane */}
			<View pointerEvents="none" style={[styles.edge, {backgroundColor: surface.edgeHighlightColor}]} />

			{/* refractive rim, only for materials whose ior actually bends light */}
			{surface.rimWidth > 0 ? (
				<View pointerEvents="none" style={[styles.rim, {height: surface.rimWidth, backgroundColor: surface.rimColor}]} />
			) : null}

			{/* separation rim from the light recipe, along the leading edge */}
			<View
				pointerEvents="none"
				style={[
					styles.leadingRim,
					{
						width: lighting.rimWidth,
						backgroundColor: lighting.rimColor,
						borderTopLeftRadius: radius,
						borderBottomLeftRadius: radius,
					},
				]}
			/>

			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {overflow: 'hidden'},
	fill: {...StyleSheet.absoluteFillObject},
	edge: {position: 'absolute', top: 0, left: 0, right: 0, height: 1},
	rim: {position: 'absolute', bottom: 0, left: 0, right: 0},
	leadingRim: {position: 'absolute', top: 0, bottom: 0, left: 0},
});
