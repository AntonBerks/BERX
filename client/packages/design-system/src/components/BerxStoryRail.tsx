/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX STORY RAIL — the live rail at the top of NOW. The reference set
 * is unanimous on the shape here: a circular portrait with a thin
 * luminous ring, the person's name directly under it, and an
 * "add yours" tile leading the row. BERX keeps that shape and makes
 * the ring mean something real — it is drawn from the accent only for
 * owners who genuinely have an unseen active story.
 *
 * Every tile is a REAL story owner the caller can actually open. The
 * leading tile is the caller's own real create action.
 */
import {useMemo} from 'react';
import {View, Text, Image, Pressable, ScrollView, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography} from '../tokens';

import {useBerxColors} from '../theme';
import {BerxIcon} from '../icons/BerxIcon';
import type {BerxColorTokens} from '../tokens';

export interface BerxStoryRailItem {
	key: string;
	label: string;
	iconUrl?: string | null;
	/** Real unseen state — drives the accent ring. A fully-viewed owner reads as a quiet ring, not a bright one. */
	unseen?: boolean;
	onPress: () => void;
}

export interface BerxStoryRailProps {
	items: BerxStoryRailItem[];
	onCreate?: () => void;
	createLabel?: string;
	/** Trailing "see all" tile. The references have no header above the rail, so this keeps that route reachable from inside it. */
	onMore?: () => void;
	moreLabel?: string;
	/** Rendered over a photograph: labels switch to the media ink set. */
	onMedia?: boolean;
	size?: number;
	style?: ViewStyle;
}

export function BerxStoryRail({items, onCreate, createLabel = 'Вы', onMore, moreLabel = 'Все', onMedia, size = 52, style}: BerxStoryRailProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const ring = size + 8;
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={[styles.rail, style]}>
			{onCreate ? (
				<Pressable style={styles.item} onPress={onCreate}>
					<View style={[styles.addTile, {width: ring, height: ring, borderRadius: ring / 2}]}>
						<BerxIcon name="plus" size={22} color={colors.accent} />
					</View>
					<Text style={[styles.label, onMedia && styles.labelOnMedia]} numberOfLines={1}>
						{createLabel}
					</Text>
				</Pressable>
			) : null}
			{items.map((it: BerxStoryRailItem) => (
				<Pressable key={it.key} style={styles.item} onPress={it.onPress}>
					<View
						style={[
							styles.ring,
							{width: ring, height: ring, borderRadius: ring / 2},
							it.unseen ? styles.ringUnseen : styles.ringSeen,
						]}>
						{it.iconUrl ? (
							<Image source={{uri: it.iconUrl}} style={{width: size, height: size, borderRadius: size / 2}} />
						) : (
							<View style={[styles.fallback, {width: size, height: size, borderRadius: size / 2}]}>
								<Text style={styles.fallbackText}>{it.label.charAt(0).toUpperCase()}</Text>
							</View>
						)}
					</View>
					<Text style={[styles.label, onMedia && styles.labelOnMedia]} numberOfLines={1}>
						{it.label}
					</Text>
				</Pressable>
			))}
			{onMore ? (
				<Pressable style={styles.item} onPress={onMore}>
					<View
						style={[
							styles.addTile,
							{width: size, height: size, borderRadius: size / 2, borderStyle: 'solid'},
						]}>
						<BerxIcon name="chevron-right" size={20} color={colors.accent} />
					</View>
					<Text style={[styles.label, onMedia && styles.labelOnMedia]} numberOfLines={1}>
						{moreLabel}
					</Text>
				</Pressable>
			) : null}
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	rail: {paddingHorizontal: spacing.lg, gap: spacing.md, alignItems: 'flex-start'},
	item: {alignItems: 'center', width: 64},
	ring: {alignItems: 'center', justifyContent: 'center', borderWidth: 2},
	ringUnseen: {borderColor: colors.accent},
	ringSeen: {borderColor: 'rgba(255,255,255,0.16)'},
	addTile: {
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: colors.borderStrong,
		backgroundColor: colors.glass1,
	},
	addGlyph: {color: colors.accent, fontSize: 22, fontWeight: typography.weightRegular, marginTop: -2},
	moreGlyph: {color: colors.accent, fontSize: 22, fontWeight: typography.weightBold, marginTop: -2},
	fallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	fallbackText: {color: colors.textDim, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	label: {color: colors.textDim, fontSize: 11, marginTop: spacing.xs, textAlign: 'center', width: 72},
	labelOnMedia: {color: colors.onMediaDim},
});
