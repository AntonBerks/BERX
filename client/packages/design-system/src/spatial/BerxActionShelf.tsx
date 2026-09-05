/**
 * BerxActionShelf — D4, made visible.
 *
 * The archive puts controls on their own plane, one step in front of
 * the content they act on. Printing a row of buttons onto the content
 * pane satisfies the layout and loses the depth: the actions read as
 * part of the text rather than as things you can operate.
 *
 * A shelf is the answer to the other half of that problem. Controls
 * are promoted — D4's material, its lit leading edge, its separation
 * rim, and a shadow cast *upward* onto the content behind, which is
 * what a surface in front of another surface actually does — but they
 * are still attached to the object they belong to. Nothing floats.
 * That is deliberate: a scene full of unanchored controls is not
 * depth, it is confetti.
 *
 * Two anchorings, both real:
 *   `attached` — flush to the bottom edge of a card, bleeding to its
 *                sides, so the card ends in its controls.
 *   `anchored` — a shelf of its own under a hero or a section, with
 *                its own radius, sitting on the content it follows.
 *
 * Legibility is not left to chance: the shelf takes D4's resolved
 * surface, which the material resolver has already guaranteed to
 * carry text at 4.5:1 or better — including over a photograph, where
 * it falls back to opaque rather than staying transparent and hoping.
 *
 * An anchored shelf is also physically nearer, not merely lighter. It
 * is projected at the control plane's own distance — the same
 * `p/(p−z)` the depth layers use — so a shelf standing on its own in
 * a scene is about 4% larger than the content behind it, which is the
 * size difference the eye reads as "in front of" without anything
 * having to be outlined or floated. An attached shelf is not scaled:
 * it is part of the card it ends, and a card whose own footer was
 * bigger than the card would be a mistake, not a plane.
 *
 * Both variants are painted through the same surface every other BERX
 * object uses, so the shelf catches the scene's key light along its
 * face and its lit edge, and catches only as much of it as reaches
 * the corner of the room the shelf is standing in.
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import {perspectiveScale} from '@berx/spatial';
import {spacing} from '../tokens';
import {useBerxScene} from './BerxSpatialScene';
import {useBerxRoomLight} from './useBerxRoomLight';
import {BerxSurface} from './BerxSurface';

export interface BerxActionShelfProps {
	children: React.ReactNode;
	/** How the shelf attaches to what it acts on. */
	variant?: 'attached' | 'anchored';
	/**
	 * How the actions sit on the shelf. `spread` pushes the primary
	 * action to the end; `stack` is for a single full-width commit
	 * action, which is what a form ends in.
	 */
	align?: 'start' | 'spread' | 'stack';
	/** The card padding the shelf must bleed past, for `attached`. */
	inset?: number;
	radius?: number;
	style?: ViewStyle;
	testID?: string;
}

export function BerxActionShelf({
	children,
	variant = 'attached',
	align = 'start',
	inset = spacing.lg,
	radius = 18,
	style,
	testID,
}: BerxActionShelfProps) {
	const {scene} = useBerxScene();
	const controls = scene.layers.D4;
	const light = useBerxRoomLight();

	/* the control plane's own projected distance — the same p/(p−z)
	   the depth layers apply, so a shelf is nearer rather than paler */
	const lift =
		variant === 'anchored' && scene.camera.perspectiveEnabled
			? perspectiveScale(controls.translateZ, scene.camera.perspectivePx)
			: 1;

	return (
		<View
			ref={light.measure}
			onLayout={light.onLayout}
			testID={testID}
			style={[
				variant === 'attached'
					? {marginTop: spacing.md, marginHorizontal: -inset, marginBottom: -inset}
					: {marginTop: spacing.sm, borderRadius: radius, transform: [{scale: lift}]},
				{
					/* the shadow points up: this surface is in front of the
					   content, so it casts onto it, not away from it */
					shadowColor: controls.lighting.shadow.color,
					shadowOpacity: 1,
					shadowRadius: controls.lighting.shadow.radius,
					shadowOffset: {width: 0, height: -controls.lighting.shadow.offsetY},
					elevation: controls.lighting.shadow.elevation,
				},
				style,
			]}>
			<BerxSurface
				surface={controls.surface}
				lighting={controls.lighting}
				radius={variant === 'anchored' ? radius : 0}
				illumination={light.illumination}
				behind={light.behind}
				/* the wrapper already casts this plane's shadow, upward */
				style={styles.flat}>
				<View
					style={[
						styles.shelf,
						align === 'spread' ? styles.spread : null,
						align === 'stack' ? styles.stack : null,
						variant === 'attached' ? {paddingHorizontal: inset} : {paddingHorizontal: spacing.lg},
					]}>
					{children}
				</View>
			</BerxSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	shelf: {
		flexDirection: 'row',
		gap: spacing.sm,
		flexWrap: 'wrap',
		alignItems: 'center',
		paddingVertical: spacing.md,
	},
	flat: {shadowOpacity: 0, elevation: 0},
	spread: {justifyContent: 'space-between'},
	stack: {flexDirection: 'column', alignItems: 'stretch'},
});
