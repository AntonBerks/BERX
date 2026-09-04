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
 *  - React Native has no gradients without a library, so the key
 *    light is painted as stacked translucent bands along the light's
 *    axis. That is a real approximation of the resolved gradient
 *    stops, not a decorative overlay.
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import type {BerxLightingSpec, BerxMaterialSurface} from '@berx/spatial';

export interface BerxSurfaceProps {
	surface: BerxMaterialSurface;
	lighting: BerxLightingSpec;
	radius: number;
	children?: React.ReactNode;
	style?: ViewStyle;
	/** Adds the material's emissive glow. Only D5/energy surfaces should. */
	emissive?: boolean;
	testID?: string;
}

export function BerxSurface({surface, lighting, radius, children, style, emissive, testID}: BerxSurfaceProps) {
	const glowing = emissive === true && surface.glowRadius > 0;

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
					shadowRadius: glowing ? surface.glowRadius : lighting.shadow.radius,
					shadowOffset: {width: 0, height: glowing ? 0 : lighting.shadow.offsetY},
					elevation: lighting.shadow.elevation,
				},
				style,
			]}>
			{/* ambient wash — the environment's own contribution, uniform by definition */}
			<View pointerEvents="none" style={[styles.fill, {backgroundColor: lighting.ambientColor, borderRadius: radius}]} />

			{/* key light, as bands along the 165° axis the recipe resolves to */}
			<View pointerEvents="none" style={[styles.keyTop, {backgroundColor: lighting.key.stops[0].color}]} />
			<View pointerEvents="none" style={[styles.keyMid, {backgroundColor: lighting.key.stops[1].color}]} />

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
	keyTop: {position: 'absolute', top: 0, left: 0, right: 0, height: '38%'},
	keyMid: {position: 'absolute', top: '38%', left: 0, right: 0, height: '30%'},
	edge: {position: 'absolute', top: 0, left: 0, right: 0, height: 1},
	rim: {position: 'absolute', bottom: 0, left: 0, right: 0},
	leadingRim: {position: 'absolute', top: 0, bottom: 0, left: 0},
});
