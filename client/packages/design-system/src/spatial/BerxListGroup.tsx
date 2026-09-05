/**
 * BerxListGroup / BerxListRow — the grouped list, as a spatial object.
 *
 * Settings, sessions, blocked people, moderators, privacy: BERX has a
 * dozen screens whose content is a list of labelled rows that lead
 * somewhere. Every one of them was a `View` with a flat token fill and
 * hairline dividers — correct layout, no depth, sitting inside a
 * resolved 5D scene that it covered up.
 *
 * A group is one structural surface on D2, because that is what it is:
 * architecture holding content, not content itself. The rows are D3,
 * and the affordance that says a row leads somewhere — its chevron and
 * its pressed state — comes from D4, the control plane. The dividers
 * are the structure layer's own edge highlight rather than a grey
 * hairline, so a group in a Crimson world and a group in Obsidian are
 * lit differently, as every other BERX surface already is.
 *
 * Rows are real buttons: role, accessible name, the archive's 44dp
 * minimum, and a focus ring. A row that navigates is a control
 * whatever it looks like.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View, type ViewStyle} from 'react-native';
import {BERX_V9_TOUCH} from '@berx/spatial';
import {colors, radius, spacing} from '../tokens';
import {BerxText} from './BerxText';
import {BerxIcon, type BerxIconName} from '../icons';
import {useBerxScene} from './BerxSpatialScene';
import {BerxGlassSurface} from '../components/BerxGlassSurface';

export interface BerxListGroupProps {
	children: React.ReactNode;
	/** Section heading above the group. Rendered as a real header for assistive tech. */
	label?: string;
	style?: ViewStyle;
	testID?: string;
}

export function BerxListGroup({children, label, style, testID}: BerxListGroupProps) {
	return (
		<View style={[styles.wrap, style]} testID={testID}>
			{label ? (
				<BerxText role="micro" emphasis="tertiary" heading style={styles.label}>
					{label}
				</BerxText>
			) : null}
			{/* D2 — structure. The group is architecture, not content. */}
			<BerxGlassSurface padding={0} style={styles.group}>
				{children}
			</BerxGlassSurface>
		</View>
	);
}

export interface BerxListRowProps {
	label: string;
	/**
	 * The row's own glyph, from the icon set.
	 *
	 * One per destination or nothing at all: a column of identical
	 * icons teaches the eye that the column carries no information,
	 * and it then stops reading the column entirely. Decorative by
	 * contract — the row already carries the accessible name.
	 */
	icon?: BerxIconName;
	/** Second line: a device, a date, a status. Real values only. */
	detail?: string;
	/** Trailing content — a switch, a badge, a count. */
	trailing?: React.ReactNode;
	onPress?: () => void;
	/** Destructive rows are named as such to assistive technology, not just coloured. */
	danger?: boolean;
	disabled?: boolean;
	/** Last row in a group drops its divider. */
	last?: boolean;
	accessibilityHint?: string;
	testID?: string;
}

export function BerxListRow({
	label,
	icon,
	detail,
	trailing,
	onPress,
	danger,
	disabled,
	last,
	accessibilityHint,
	testID,
}: BerxListRowProps) {
	const {scene} = useBerxScene();
	const structure = scene.layers.D2;
	const controls = scene.layers.D4;

	const body = (
		<>
			{icon ? (
				<View style={styles.rowIcon}>
					<BerxIcon name={icon} size={18} decorative />
				</View>
			) : null}
			<View style={styles.rowText}>
				<BerxText
					role="callout"
					style={danger ? styles.rowLabelDanger : disabled ? styles.rowDisabled : undefined}>
					{label}
				</BerxText>
				{detail ? (
					<BerxText role="meta" emphasis="secondary">
						{detail}
					</BerxText>
				) : null}
			</View>
			{trailing ?? (onPress ? <Text style={[styles.chevron, {color: controls.surface.edgeHighlightColor}]}>›</Text> : null)}
		</>
	);

	const divider = last ? null : (
		<View pointerEvents="none" style={[styles.divider, {backgroundColor: structure.surface.borderColor}]} />
	);

	if (!onPress) {
		return (
			<View style={styles.row} testID={testID} accessible accessibilityLabel={detail ? `${label}, ${detail}` : label}>
				{body}
				{divider}
			</View>
		);
	}

	return (
		<Pressable
			testID={testID}
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={detail ? `${label}, ${detail}` : label}
			accessibilityHint={accessibilityHint}
			accessibilityState={{disabled: Boolean(disabled)}}
			style={({pressed}) => [
				styles.row,
				/* pressed lifts the row onto the control plane it already
				   belongs to, rather than tinting it an arbitrary grey */
				pressed ? {backgroundColor: controls.surface.backgroundColor} : null,
				disabled ? styles.rowDisabled : null,
			]}>
			{body}
			{divider}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.xs},
	label: {paddingHorizontal: spacing.md, paddingTop: spacing.md},
	group: {borderRadius: radius.lg, overflow: 'hidden'},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacing.md,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		minHeight: BERX_V9_TOUCH.preferredDp,
	},
	/* a fixed column, so the labels line up whether a row has a glyph
	   or not — a ragged left edge is what makes a menu look assembled
	   rather than designed */
	rowIcon: {width: 24, alignItems: 'center'},
	rowText: {flex: 1, gap: 2},
	rowLabelDanger: {color: colors.danger},
	rowDisabled: {opacity: 0.5},
	chevron: {fontSize: 18},
	divider: {position: 'absolute', left: spacing.lg, right: 0, bottom: 0, height: 1},
});
