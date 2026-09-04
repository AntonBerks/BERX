/**
 * D0 + D1 — the environment the scene sits in.
 *
 * D0 is the substrate: the deepest plane, effectively the room.
 * D1 is atmosphere: the environmental media (a hero image, a place
 * photo) that gives the room a place and a time of day.
 *
 * Both are decorative by contract — they carry no semantic content
 * and are hidden from assistive technology — and both are dimmed by
 * the scene so they can never out-shine the content plane.
 */

import {Image, StyleSheet, View, type ImageSourcePropType} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxDepthLayer} from './BerxDepthLayer';

export interface BerxSceneBackdropProps {
	/**
	 * Real environmental media. Omitted when the screen has none —
	 * BERX does not ship a stock image to fill the gap.
	 */
	media?: ImageSourcePropType;
	/** Extra darkening under text-heavy scenes. 0..1. */
	scrim?: number;
}

export function BerxSceneBackdrop({media, scrim = 0}: BerxSceneBackdropProps) {
	const {scene} = useBerxScene();
	const d1 = scene.layers.D1;

	/**
	 * Overscan.
	 *
	 * The environment layers move under parallax and are projected
	 * smaller by the camera, so a backdrop sized exactly to the
	 * viewport shows its own edge the moment either happens. They are
	 * inset negatively by enough to cover the largest offset parallax
	 * can produce plus the projection gap — which is why the
	 * atmosphere reads as a room the content moves through rather than
	 * a picture sliding behind it.
	 */
	const overscan = scene.budget.allowParallax ? 140 : 40;

	return (
		<>
			<BerxDepthLayer depth="D0" absoluteFill surface radius={0} style={{margin: -overscan}} />
			<BerxDepthLayer depth="D1" absoluteFill style={{margin: -overscan}}>
				{media ? (
					<Image
						source={media}
						resizeMode="cover"
						/* decorative: the parent layer is already hidden from assistive tech */
						accessibilityRole="image"
						accessible={false}
						style={StyleSheet.absoluteFillObject}
					/>
				) : null}
				{/* accent energy from the light recipe, at the atmosphere layer's own intensity */}
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: d1.lighting.accentGlow}]} />
				{scrim > 0 ? (
					<View style={[StyleSheet.absoluteFillObject, {backgroundColor: rgba(scene.background, Math.min(1, scrim))}]} />
				) : null}
			</BerxDepthLayer>
		</>
	);
}
