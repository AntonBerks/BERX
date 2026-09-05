/**
 * BerxSceneHeader — how a BERX scene names itself.
 *
 * Every screen had grown its own header row: a bold word on the left,
 * an icon on the right, a hairline underneath. Seventy-eight small
 * variations of the same bar, and a bar is the one thing a spatial
 * interface should not put across the top of a room — it cuts the
 * scene in half and hides the light coming in.
 *
 * So this is not a bar. It is the scene introducing itself, standing
 * in its own room:
 *
 *   an overline in micro type — the family or the section, tracked
 *   out and dim, which is what tells you where you are before you
 *   read anything;
 *
 *   the title in display type, which is the only thing on the screen
 *   allowed to be that size;
 *
 *   a line of real context under it — a count, a place, a state —
 *   never a slogan, because there is nothing to say that the data
 *   does not already say;
 *
 *   and the actions, on the control plane, physically nearer than the
 *   title and reachable without covering it.
 *
 * There is no fill and no border. The atmosphere behind it is the
 * background, which is the whole point of having one.
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import {BerxText} from './BerxText';
import {BerxWordmark} from './BerxWordmark';
import {BerxActionShelf} from './BerxActionShelf';
import {spacing} from '../tokens';

export interface BerxSceneHeaderProps {
	/**
	 * Draws the BERX mark above the title instead of an overline.
	 *
	 * For the scenes a person arrives at rather than navigates into —
	 * the tab roots. Everywhere else the overline says which part of
	 * BERX you are in, which is more useful than repeating the name of
	 * the product to someone already inside it.
	 */
	mark?: boolean;
	/** Where you are: the family, the section. Real, short, dim. */
	overline?: string;
	title: string;
	/** Real context only — a count, a place, a state. Never a tagline. */
	subtitle?: string;
	/** Controls. They sit on D4, nearer than the title. */
	actions?: React.ReactNode;
	/**
	 * Secondary scenes — a detail opened from a list, a settings page —
	 * introduce themselves more quietly. The title steps down a size
	 * and the room above it closes up.
	 */
	compact?: boolean;
	style?: ViewStyle;
	testID?: string;
}

export function BerxSceneHeader({
	mark,
	overline,
	title,
	subtitle,
	actions,
	compact = false,
	style,
	testID,
}: BerxSceneHeaderProps) {
	return (
		<View testID={testID} style={[compact ? styles.rootCompact : styles.root, style]}>
			<View style={styles.text}>
				{mark ? <BerxWordmark size={13} style={styles.mark} /> : null}
				{!mark && overline ? (
					<BerxText role="micro" emphasis="tertiary" numberOfLines={1}>
						{overline}
					</BerxText>
				) : null}
				<BerxText
					role={compact ? 'title' : 'display'}
					heading
					numberOfLines={2}
					style={mark || overline ? styles.titleUnderOverline : undefined}>
					{title}
				</BerxText>
				{subtitle ? (
					<BerxText role="meta" emphasis="secondary" numberOfLines={2} style={styles.subtitle}>
						{subtitle}
					</BerxText>
				) : null}
			</View>
			{actions ? (
				/* attached, not anchored: these belong to the header,
				   they are not the screen's floating toolbar */
				<BerxActionShelf variant="attached" align="start" style={styles.actions}>
					{actions}
				</BerxActionShelf>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: spacing.md,
		paddingHorizontal: spacing.lg,
		/* the room above the title is deliberate: it is where the
		   atmosphere's own light enters the frame */
		paddingTop: spacing.xxl,
		paddingBottom: spacing.lg,
	},
	rootCompact: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacing.md,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.md,
	},
	text: {flex: 1, gap: 2},
	/* the mark reads as a label at this size, so it is dimmed to sit
	   behind the title rather than compete with it */
	mark: {opacity: 0.72},
	/* the overline sits close to the title it labels */
	titleUnderOverline: {marginTop: 2},
	subtitle: {marginTop: spacing.xs},
	actions: {flexShrink: 0},
});
