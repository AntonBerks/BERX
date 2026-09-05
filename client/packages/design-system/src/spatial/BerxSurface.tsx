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
import {flatten, type BerxLightingSpec, type BerxMaterialSurface} from '@berx/spatial';

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
	/**
	 * How lit this surface's own position in the room is, 0..1, from
	 * berxIlluminationAt. 0.5 is an even wash, so the default leaves a
	 * surface exactly as it was.
	 *
	 * It scales the key light and the lit edge, and nothing else: an
	 * object further from the window catches less of the light on its
	 * face and less of it along its top edge. It does not change the
	 * material — a glass card in the corner is still glass, it is just
	 * not in the light.
	 */
	illumination?: number;
	/**
	 * The room's own colour where this surface stands.
	 *
	 * An opaque surface is flattened against this rather than against
	 * the substrate, so an object standing in the light is lighter than
	 * the wall behind it — which is what standing in the light means.
	 * Omitted, the surface keeps the colour the material resolved,
	 * which is the honest answer when nothing has measured the room.
	 */
	behind?: string | null;
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

export function BerxSurface({surface, lighting, radius, children, style, emissive, emissiveGain = 1, illumination = 0.5, behind, testID}: BerxSurfaceProps) {
	const glowing = emissive === true && surface.glowRadius > 0;
	const glowRadius = surface.glowRadius * Math.max(1, emissiveGain);
	const axis = useMemo(() => keyAxis(lighting.key.angleDeg), [lighting.key.angleDeg]);
	/* one gradient id per recipe+depth, so two surfaces in one tree
	   cannot pick up each other's definitions */
	/**
	 * Quantised to sixteenths: the gradient id has to change when the
	 * light does, and a per-pixel id would put a new <Defs> in the
	 * document for every object on the screen.
	 */
	const lit = Math.round(Math.max(0, Math.min(1, illumination)) * 16) / 16;
	const fill =
		behind && surface.opaqueFallback ? flatten(surface.translucentColor, behind) : surface.backgroundColor;
	const litGain = 0.45 + lit;
	const gradientId = `berx-key-${lighting.recipe}-${Math.round(lighting.shadow.radius)}-${Math.round(lit * 16)}`;

	return (
		<View
			testID={testID}
			style={[
				styles.base,
				{
					backgroundColor: fill,
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
								<Stop
									key={i}
									offset={`${stop.position * 100}%`}
									stopColor={stop.color}
									stopOpacity={litGain}
								/>
							))}
						</LinearGradient>
					</Defs>
					<Rect x={0} y={0} width="100%" height="100%" fill={`url(#${gradientId})`} />
				</Svg>
			</View>

			{/* specular top edge — the lit edge of a real pane, and it
			    catches only as much light as reaches this corner of the
			    room */}
			<View pointerEvents="none" style={[styles.edge, {backgroundColor: surface.edgeHighlightColor, opacity: litGain}]} />

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
