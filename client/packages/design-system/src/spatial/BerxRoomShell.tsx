/**
 * BerxRoomShell — D2, the architecture between the atmosphere and the
 * content.
 *
 * Every BERX screen had an environment and objects, and nothing in
 * between: cards sat directly on the atmosphere, which is the archive's
 * "content placed on top of a background" rather than content standing
 * in a room.
 *
 * This is the room, and it is deliberately not a box. A bordered
 * container drawn around the content is the generic dashboard the
 * archive rejects, and it would fight the cards for the same edge. A
 * room is legible from two things instead:
 *
 *   the light coming in at the top, along the same axis every BERX
 *   surface is lit from, so the scene has a direction before anything
 *   is placed in it;
 *
 *   the floor — a soft rise at the bottom of the frame that the
 *   content stands on, brighter for a family whose atmosphere already
 *   has a ground plane, because those are the scenes that are about
 *   being somewhere;
 *
 *   and the walls the room is between. Two gradients falling inward
 *   from the left and right edges, which is what gives the scene a
 *   width to be inside of rather than a flat plane with a lit top and
 *   a lit bottom. They are asymmetric on purpose: the wall the key
 *   light falls on is lighter than the one opposite it, because that
 *   is what a lit room does, and two identical walls read as a
 *   vignette rather than as architecture.
 *
 * Both come from the structure plane's own resolved material and
 * lighting, so the room changes with the colour world and the scene's
 * contract rather than being a fixed wash.
 */
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import type {BerxLightingSpec, BerxMaterialSurface} from '@berx/spatial';

export interface BerxRoomShellProps {
	width: number;
	height: number;
	surface: BerxMaterialSurface;
	lighting: BerxLightingSpec;
	/** True when this family's atmosphere already has a ground plane. */
	grounded?: boolean;
	id: string;
}

export function BerxRoomShell({width, height, surface, lighting, grounded, id}: BerxRoomShellProps) {
	if (width <= 0 || height <= 0) return null;

	/* the floor is the part of the room the content rests on; a scene
	   about being somewhere gets more of it */
	const floorStop = grounded ? 0.62 : 0.76;

	/**
	 * How far the walls reach in.
	 *
	 * A narrow frame has narrower walls — on a phone, walls at the
	 * proportion a tablet wants would meet in the middle and become a
	 * vignette. Bounded to a share of the frame either way.
	 */
	const wall = Math.max(0.08, Math.min(0.2, 96 / Math.max(1, width)));

	return (
		<View
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={StyleSheet.absoluteFillObject}>
			<Svg width={width} height={height} pointerEvents="none">
				<Defs>
					{/* light entering the room, along the key's own axis */}
					<LinearGradient id={`${id}-ceiling`} x1="0%" y1="0%" x2="12%" y2="100%">
						<Stop offset="0%" stopColor={lighting.key.stops[0].color} />
						<Stop offset="34%" stopColor={lighting.key.stops[1].color} />
						<Stop offset="100%" stopColor={surface.edgeHighlightColor} stopOpacity={0} />
					</LinearGradient>
					{/* the floor: the surface the content stands on */}
					<LinearGradient id={`${id}-floor`} x1="0%" y1="0%" x2="0%" y2="100%">
						<Stop offset={`${floorStop * 100}%`} stopColor={surface.backgroundColor} stopOpacity={0} />
						<Stop offset="100%" stopColor={surface.backgroundColor} />
					</LinearGradient>
					{/* the wall the light falls on */}
					<LinearGradient id={`${id}-wall-lit`} x1="0%" y1="0%" x2="100%" y2="0%">
						<Stop offset="0%" stopColor={surface.edgeHighlightColor} stopOpacity={0.5} />
						<Stop offset={`${wall * 100}%`} stopColor={surface.edgeHighlightColor} stopOpacity={0} />
					</LinearGradient>
					{/* and the one opposite it, which is in its shadow */}
					<LinearGradient id={`${id}-wall-shade`} x1="100%" y1="0%" x2="0%" y2="0%">
						<Stop offset="0%" stopColor={surface.backgroundColor} stopOpacity={0.9} />
						<Stop offset={`${wall * 100}%`} stopColor={surface.backgroundColor} stopOpacity={0} />
					</LinearGradient>
				</Defs>
				<Rect x={0} y={0} width={width} height={height} fill={`url(#${id}-ceiling)`} />
				<Rect x={0} y={0} width={width} height={height} fill={`url(#${id}-wall-lit)`} />
				<Rect x={0} y={0} width={width} height={height} fill={`url(#${id}-wall-shade)`} />
				<Rect x={0} y={0} width={width} height={height} fill={`url(#${id}-floor)`} />
			</Svg>
		</View>
	);
}
