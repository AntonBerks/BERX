/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX PHOTO GRID — the reference profiles end on photography, in a
 * two-column grid of tall tiles with real overlay facts on each. This
 * replaces the "list of menu rows where the references put pictures"
 * shape a profile had.
 *
 * Every tile needs a real image URL. An item without one is not
 * rendered as a grey placeholder square — the caller filters it out,
 * and an empty grid is an empty state, not a wall of blanks.
 */
import {useMemo} from 'react';
import {View, Text, Image, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius} from '../tokens';
import type {BerxColorTokens} from '../tokens';
import {useBerxColors} from '../theme';
import {BerxScrim} from './BerxScrim';

export interface BerxPhotoGridItem {
	key: string;
	imageUrl: string;
	/** Auth headers, for media behind a token-gated URL (story media). */
	imageHeaders?: Record<string, string>;
	/** A real fact about this item — a like count, a date. Never filler. */
	overlay?: string | null;
	/** Small badge in the corner, e.g. a real rating. */
	badge?: string | null;
	onPress?: () => void;
}

export interface BerxPhotoGridProps {
	items: BerxPhotoGridItem[];
	/** Tile aspect (width/height). The reference grids are portrait. */
	ratio?: number;
	style?: ViewStyle;
}

export function BerxPhotoGrid({items, ratio = 3 / 4, style}: BerxPhotoGridProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={[styles.grid, style]}>
			{items.map((it: BerxPhotoGridItem) => (
				<Pressable
					key={it.key}
					style={[styles.tile, {aspectRatio: ratio}]}
					onPress={it.onPress}
					disabled={!it.onPress}>
					<Image
						source={{uri: it.imageUrl, headers: it.imageHeaders}}
						style={StyleSheet.absoluteFillObject}
						resizeMode="cover"
					/>
					{it.overlay || it.badge ? <BerxScrim coverage={0.5} strength={0.85} /> : null}
					{it.badge ? (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{it.badge}</Text>
						</View>
					) : null}
					{it.overlay ? (
						<Text style={styles.overlay} numberOfLines={1}>
							{it.overlay}
						</Text>
					) : null}
				</Pressable>
			))}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		grid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
		tile: {
			width: '48%',
			borderRadius: radius.lg,
			overflow: 'hidden',
			backgroundColor: colors.mediaScrim,
		},
		badge: {
			position: 'absolute',
			top: spacing.sm,
			right: spacing.sm,
			paddingHorizontal: spacing.sm,
			paddingVertical: 3,
			borderRadius: radius.pill,
			backgroundColor: 'rgba(11,10,20,0.55)',
			borderWidth: 1,
			borderColor: 'rgba(255,255,255,0.2)',
		},
		badgeText: {color: colors.onMedia, fontSize: 11, fontWeight: typography.weightBold},
		overlay: {
			position: 'absolute',
			left: spacing.sm,
			right: spacing.sm,
			bottom: spacing.sm,
			color: colors.onMediaDim,
			fontSize: 11,
			fontWeight: typography.weightMedium,
		},
	});
