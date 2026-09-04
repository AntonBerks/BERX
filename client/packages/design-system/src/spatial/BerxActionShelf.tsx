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
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import {spacing} from '../tokens';
import {useBerxScene} from './BerxSpatialScene';

export interface BerxActionShelfProps {
	children: React.ReactNode;
	/** How the shelf attaches to what it acts on. */
	variant?: 'attached' | 'anchored';
	/** Horizontal arrangement. `spread` puts the primary action at the end. */
	align?: 'start' | 'spread';
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

	return (
		<View
			testID={testID}
			style={[
				styles.shelf,
				align === 'spread' ? styles.spread : null,
				variant === 'attached'
					? {marginTop: spacing.md, marginHorizontal: -inset, marginBottom: -inset, paddingHorizontal: inset}
					: {marginTop: spacing.sm, borderRadius: radius, paddingHorizontal: spacing.lg, borderWidth: 1},
				{
					backgroundColor: controls.surface.backgroundColor,
					borderColor: controls.surface.borderColor,
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
			{/* the lit leading edge — where the light meets the front plane */}
			<View pointerEvents="none" style={[styles.edge, {backgroundColor: controls.surface.edgeHighlightColor}]} />
			{children}
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
		borderTopWidth: 1,
	},
	spread: {justifyContent: 'space-between'},
	edge: {position: 'absolute', top: 0, left: 0, right: 0, height: 1},
});
