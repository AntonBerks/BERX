/**
 * D0 + D1 — the environment the scene sits in.
 *
 * D0 is the substrate: the deepest plane, effectively the room.
 * D1 is atmosphere, and atmosphere in v9 is content-aware: a profile
 * is lit like one person, a place has a floor and a horizon, a
 * conversation is a lit corridor, a wallet is a display case. The
 * character comes from @berx/spatial's atmosphere resolver, keyed by
 * the scene's family or by an explicit kind when a screen's content
 * is more specific than its family.
 *
 * Real media, when the screen has it, is composited *into* that room:
 * the sky is behind it, the pools of light and the vignette fall in
 * front of it. That is the difference between a photograph in a
 * space and a photograph used as wallpaper. A screen with no real
 * media gets the lit room and nothing invented to fill it.
 *
 * Both planes are decorative by contract — they carry no semantic
 * content, are hidden from assistive technology, and are dimmed by
 * the scene so they can never out-shine the content plane.
 */

import {useMemo} from 'react';
import {Image, StyleSheet, View, useWindowDimensions, type ImageSourcePropType} from 'react-native';
import {berxAtmospherePoolBudget, resolveAtmosphere, rgba, type BerxAtmosphereKind} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxDepthLayer} from './BerxDepthLayer';
import {BerxAtmosphereField} from './BerxAtmosphereField';

export interface BerxSceneBackdropProps {
	/**
	 * Real environmental media. Omitted when the screen has none —
	 * BERX does not ship a stock image to fill the gap.
	 */
	media?: ImageSourcePropType;
	/** Overrides the family default when a screen's content is more specific. */
	kind: BerxAtmosphereKind;
	/** Extra darkening on top of what the atmosphere already asks for. 0..1. */
	scrim?: number;
}

export function BerxSceneBackdrop({media, kind, scrim = 0}: BerxSceneBackdropProps) {
	const {scene, scrollY} = useBerxScene();
	const {width, height} = useWindowDimensions();
	const d1 = scene.layers.D1;

	const atmosphere = useMemo(
		() =>
			resolveAtmosphere({
				kind,
				accent: scene.accent,
				background: scene.background,
				hasMedia: media !== undefined,
				intensity: d1.contentOpacity,
				reducedMotion: scene.reducedMotion,
				allowParallax: scene.budget.allowParallax,
				/**
				 * The honest signal, not an optimistic one. React Native
				 * has no backdrop filter without a native module, so D1
				 * is almost always unblurred here — which is precisely
				 * when the composition has to carry the depth, and the
				 * resolver strengthens it.
				 */
				blurred: d1.blurred,
				/* graduated quality: fewer lamps on a weaker device, same room */
				maxPools: berxAtmospherePoolBudget(scene.budget.tier),
			}),
		[
			kind,
			scene.accent,
			scene.background,
			scene.reducedMotion,
			scene.budget.allowParallax,
			scene.budget.tier,
			media,
			d1.contentOpacity,
			d1.blurred,
		],
	);

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
	const hasMedia = media !== undefined && atmosphere.mediaRole !== 'none';
	const overscan = scene.budget.allowParallax ? 140 : 40;
	const totalScrim = Math.min(1, (hasMedia ? atmosphere.mediaScrim : atmosphere.baseScrim) + scrim);

	return (
		<>
			<BerxDepthLayer depth="D0" absoluteFill surface radius={0} style={{margin: -overscan}} />
			<BerxDepthLayer depth="D1" absoluteFill style={{margin: -overscan}}>
				{/**
				 * Order is the whole point. Sky, then media, then the
				 * light that falls on it, then the walls, then the
				 * scrim the text needs. Painting the media last would
				 * put a flat rectangle in front of the room.
				 */}
				<BerxAtmosphereField
					atmosphere={atmosphere}
					width={width + overscan * 2}
					height={height + overscan * 2}
					scrollY={scrollY}
					pass={hasMedia ? 'back' : 'all'}
				/>
				{hasMedia ? (
					<Image
						source={media}
						resizeMode="cover"
						/* decorative: the parent layer is already hidden from assistive tech */
						accessibilityRole="image"
						accessible={false}
						style={[StyleSheet.absoluteFillObject, {opacity: atmosphere.mediaOpacity}]}
					/>
				) : null}
				{hasMedia ? (
					/* the room's light falls in front of the media, so the
					   photograph is lit by the scene instead of ignoring it */
					<BerxAtmosphereField
						atmosphere={atmosphere}
						width={width + overscan * 2}
						height={height + overscan * 2}
						scrollY={scrollY}
						pass="front"
					/>
				) : null}
				{/* accent energy from the light recipe, at the atmosphere layer's own intensity */}
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: d1.lighting.accentGlow}]} />
				{totalScrim > 0 ? (
					<View style={[StyleSheet.absoluteFillObject, {backgroundColor: rgba(scene.background, totalScrim)}]} />
				) : null}
			</BerxDepthLayer>
		</>
	);
}
