/**
 * The visible focus indicator.
 *
 * Keyboard and switch users need to see where focus is, and the v9
 * accessibility contract makes `focusVisible` non-optional. The ring
 * is drawn in the scene's accent at full strength and sits outside
 * the surface, so a glass material can never wash it out.
 */

import {StyleSheet, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';

export interface BerxFocusRingProps {
	radius?: number;
	/** Inset from the focused element. Negative values draw outside it. */
	inset?: number;
}

export function BerxFocusRing({radius = 22, inset = -3}: BerxFocusRingProps) {
	const {scene} = useBerxScene();
	return (
		<View
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[
				StyleSheet.absoluteFillObject,
				{
					top: inset,
					left: inset,
					right: inset,
					bottom: inset,
					borderRadius: radius + Math.abs(inset),
					borderWidth: 2,
					borderColor: scene.accent,
					shadowColor: scene.accent,
					shadowOpacity: 1,
					shadowRadius: 8,
					shadowOffset: {width: 0, height: 0},
					backgroundColor: rgba(scene.accent, 0.06),
				},
			]}
		/>
	);
}
