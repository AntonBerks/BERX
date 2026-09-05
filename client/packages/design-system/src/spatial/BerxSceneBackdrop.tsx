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

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, StyleSheet, View, useWindowDimensions, type ImageSourcePropType, type LayoutChangeEvent} from 'react-native';
import {berxAtmospherePoolBudget, resolveAtmosphere, rgba, type BerxAtmosphereKind} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxDepthLayer} from './BerxDepthLayer';
import {BerxAtmosphereField} from './BerxAtmosphereField';
import {BerxRoomShell} from './BerxRoomShell';

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
	const {scene, scrollY, publishAtmosphere} = useBerxScene();
	const window = useWindowDimensions();
	/**
	 * The room is sized to the scene it is in, not to the window.
	 *
	 * Most scenes fill the screen and the two are the same. A bounded
	 * one is not — the profile's tabs each open their own contract's
	 * room inside a panel — and a window-sized field painted into a
	 * 160px box would put every light source outside the opening. The
	 * window is the first-paint fallback, before layout has happened.
	 */
	const [box, setBox] = useState<{width: number; height: number} | null>(null);
	const onLayout = useCallback((e: LayoutChangeEvent) => {
		const {width: w, height: h} = e.nativeEvent.layout;
		setBox((prev) => (prev && prev.width === w && prev.height === h ? prev : {width: w, height: h}));
	}, []);
	const width = box?.width ?? window.width;
	const height = box?.height ?? window.height;
	/**
	 * A room inside a room — a profile tab's panel, a card's scene —
	 * has no horizon: a ground plane is a cue about distance, and
	 * there is no distance to describe inside a 160px panel. Measured
	 * rather than declared, so a screen cannot get it wrong.
	 */
	const bounded = box !== null && box.height < window.height * 0.85;
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
				bounded,
				/* the room may not out-shine the objects standing in it */
				contentColor: scene.layers.D3.surface.effectiveColor,
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
			bounded,
			scene.layers.D3.surface.effectiveColor,
		],
	);

	/**
	 * The room, published to the objects that will stand in it.
	 *
	 * A card does not need to know how the atmosphere was resolved; it
	 * needs to know how lit its own corner of the room is. Publishing
	 * the resolved room here is what makes that possible without every
	 * component re-resolving it.
	 */
	useEffect(() => {
		publishAtmosphere(atmosphere);
		return () => publishAtmosphere(null);
	}, [atmosphere, publishAtmosphere]);

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
			<BerxDepthLayer depth="D1" absoluteFill style={{margin: -overscan}} onLayout={onLayout}>
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

			{/**
			 * D2 — the room itself.
			 *
			 * Until this layer existed, content sat directly on the
			 * atmosphere: cards on a background rather than objects in a
			 * space. This is the architecture between them, and it is
			 * deliberately not a box — a bordered container around the
			 * content is the generic-dashboard look the archive rejects.
			 *
			 * It is the two things a room has that you can see without
			 * looking at its walls: light entering at the top, where the
			 * key light of every BERX scene comes from, and a floor the
			 * content stands on. Both are the structure plane's own
			 * material and lighting, so a Crimson room and an Obsidian
			 * room are lit differently, and a family whose atmosphere has
			 * a ground plane gets a floor that agrees with it.
			 */}
			<BerxDepthLayer depth="D2" absoluteFill style={{margin: -overscan}}>
				<BerxRoomShell
					width={width + overscan * 2}
					height={height + overscan * 2}
					surface={scene.layers.D2.surface}
					lighting={scene.layers.D2.lighting}
					grounded={atmosphere.ground !== null}
					id={`berx-room-${scene.screenId}`}
				/>
			</BerxDepthLayer>
		</>
	);
}
