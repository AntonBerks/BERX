/**
 * BerxSection — D2 inside the screen, not only behind it.
 *
 * The room was painted behind the content and then the content was
 * stacked on it with a uniform gap, so a long scene — a place, an
 * event, a business, a profile — read as one column of unrelated
 * blocks floating in a large rectangle. The architecture existed at
 * the back of the scene and nowhere among the things it was supposed
 * to be holding.
 *
 * A section is that architecture: a named region of the room, with
 * the structure plane's own light catching along its leading edge.
 * The edge is not a divider — a full-width rule across a scene is a
 * seam, and BERX rooms do not have seams. It is a hairline in the
 * structure plane's own edge-highlight colour that fades out along
 * its length, which is what an edge in a lit room actually looks
 * like: bright where the light reaches it, gone where it does not.
 *
 * The label is the type system's micro role and a real heading. The
 * section's own action, when it has one, sits on the control plane
 * beside the label rather than at the bottom of the content it acts
 * on.
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useBerxScene} from './BerxSpatialScene';
import {BerxText} from './BerxText';
import {spacing} from '../tokens';

export interface BerxSectionProps {
	/** What this region of the room is. Real and short. */
	label?: string;
	/** A count, a state — the real number this section holds. */
	detail?: string;
	/** The section's own control, on D4, beside the label. */
	action?: React.ReactNode;
	children: React.ReactNode;
	/**
	 * The first section in a scene follows the hero, so it opens
	 * without an edge: the hero already ended the space above it.
	 */
	leading?: boolean;
	style?: ViewStyle;
	testID?: string;
}

export function BerxSection({label, detail, action, children, leading = false, style, testID}: BerxSectionProps) {
	const {scene} = useBerxScene();
	const structure = scene.layers.D2;

	return (
		<View testID={testID} style={[styles.root, style]}>
			{leading ? null : (
				/* the light catching the room's edge, fading along its
				   length — an edge, not a seam */
				<View pointerEvents="none" accessibilityElementsHidden style={styles.edge}>
					<Svg width="100%" height={1}>
						<Defs>
							<LinearGradient id={`berx-section-${label ?? 'x'}`} x1="0%" y1="0%" x2="100%" y2="0%">
								<Stop offset="0%" stopColor={structure.surface.edgeHighlightColor} stopOpacity={0.9} />
								<Stop offset="62%" stopColor={structure.surface.edgeHighlightColor} stopOpacity={0.28} />
								<Stop offset="100%" stopColor={structure.surface.edgeHighlightColor} stopOpacity={0} />
							</LinearGradient>
						</Defs>
						<Rect x={0} y={0} width="100%" height={1} fill={`url(#berx-section-${label ?? 'x'})`} />
					</Svg>
				</View>
			)}
			{label || action ? (
				<View style={styles.head}>
					<View style={styles.headText}>
						{label ? (
							<BerxText role="micro" emphasis="tertiary" heading>
								{label}
							</BerxText>
						) : null}
						{detail ? (
							<BerxText role="meta" emphasis="secondary">
								{detail}
							</BerxText>
						) : null}
					</View>
					{action}
				</View>
			) : null}
			<View style={styles.body}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: spacing.sm},
	/* the edge sits above the section's own top padding, so the light
	   falls on the room rather than on the content */
	edge: {height: 1, marginTop: spacing.xl},
	head: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md},
	headText: {flex: 1, gap: 2},
	body: {gap: spacing.md},
});
