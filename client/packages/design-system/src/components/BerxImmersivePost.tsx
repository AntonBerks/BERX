/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX IMMERSIVE POST — the moment unit on NOW, built to the
 * composition the reference set uses for its feed: the photograph IS
 * the card (full-bleed, tall, large radius), the author sits ON the
 * image at the top as a translucent chip rather than in a header
 * strip above it, the caption sits at the bottom over a legibility
 * scrim, and the actions are a floating vertical rail pinned to the
 * right edge of the media.
 *
 * REAL MEDIA OR REAL TEXT — never a fake photo. This component
 * REQUIRES a real imageUrl: a post with no attached image is not
 * given a grey photo plate here, it renders through the caller's own
 * typographic branch instead, so the feed never pretends a picture
 * exists.
 */
import React, {useMemo} from 'react';
import {View, Text, Image, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius, elevation, mediaRatio} from '../tokens';
import {BerxActionRail} from './BerxActionRail';
import type {BerxRailAction} from './BerxActionRail';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

const SCRIM_STEPS = [0, 0.1, 0.28, 0.56, 0.88];

export interface BerxImmersivePostProps {
	imageUrl: string;
	/** Real extra-image count on the same post (2 means one more photo exists) — a real counter, never a decorative dot row. */
	mediaCount?: number;
	authorName: string;
	authorIcon?: string | null;
	timeLabel?: string;
	/** Real place/context this was posted from, when the caller actually knows it. */
	contextLabel?: string | null;
	text?: string;
	actions?: BerxRailAction[];
	onPress?: () => void;
	onPressAuthor?: () => void;
	ratio?: keyof typeof mediaRatio;
	/** Rendered under the caption, still inside the card — used for a real poll attached to the post. */
	children?: React.ReactNode;
	style?: ViewStyle;
}

export function BerxImmersivePost({
	imageUrl,
	mediaCount,
	authorName,
	authorIcon,
	timeLabel,
	contextLabel,
	text,
	actions,
	onPress,
	onPressAuthor,
	ratio = 'hero',
	children,
	style,
}: BerxImmersivePostProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<Pressable onPress={onPress} disabled={!onPress} style={[styles.wrap, elevation[3], {aspectRatio: mediaRatio[ratio]}, style]}>
			<Image source={{uri: imageUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

			<View style={styles.scrim} pointerEvents="none">
				{SCRIM_STEPS.map((opacity: number, i: number) => (
					<View key={i} style={[styles.scrimStep, {backgroundColor: colors.mediaScrim, opacity}]} />
				))}
			</View>

			<Pressable style={styles.authorChip} onPress={onPressAuthor} disabled={!onPressAuthor}>
				{authorIcon ? (
					<Image source={{uri: authorIcon}} style={styles.authorAvatar} />
				) : (
					<View style={[styles.authorAvatar, styles.authorAvatarFallback]}>
						<Text style={styles.authorInitial}>{authorName.charAt(0).toUpperCase()}</Text>
					</View>
				)}
				<View style={styles.authorText}>
					<Text style={styles.authorName} numberOfLines={1}>
						{authorName}
					</Text>
					{timeLabel || contextLabel ? (
						<Text style={styles.authorMeta} numberOfLines={1}>
							{[timeLabel, contextLabel].filter(Boolean).join(' · ')}
						</Text>
					) : null}
				</View>
			</Pressable>

			{typeof mediaCount === 'number' && mediaCount > 1 ? (
				<View style={styles.mediaCount}>
					<Text style={styles.mediaCountText}>1/{mediaCount}</Text>
				</View>
			) : null}

			{actions && actions.length > 0 ? <BerxActionRail actions={actions} style={styles.rail} /> : null}

			<View style={styles.bottom}>
				{text ? (
					<Text style={styles.caption} numberOfLines={3}>
						{text}
					</Text>
				) : null}
				{children}
			</View>
		</Pressable>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {
		borderRadius: radius.lg + 8,
		overflow: 'hidden',
		// Media ground, not surface ground: the overlays on top are white
		// in both environments, so this must stay dark even in Day.
		backgroundColor: colors.mediaScrim,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	scrim: {position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%'},
	scrimStep: {flex: 1},
	authorChip: {
		position: 'absolute',
		top: spacing.md,
		left: spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingRight: spacing.md,
		paddingLeft: 4,
		paddingVertical: 4,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(7,8,10,0.42)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.16)',
		maxWidth: '72%',
	},
	authorAvatar: {width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mediaScrim},
	authorAvatarFallback: {alignItems: 'center', justifyContent: 'center'},
	authorInitial: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	authorText: {flexShrink: 1},
	authorName: {color: colors.onMedia, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	authorMeta: {color: colors.onMediaDim, fontSize: 11},
	mediaCount: {
		position: 'absolute',
		top: spacing.md,
		right: spacing.md,
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(7,8,10,0.5)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.16)',
	},
	mediaCountText: {color: colors.onMedia, fontSize: 11, fontWeight: typography.weightMedium},
	rail: {position: 'absolute', right: spacing.md, bottom: '26%'},
	bottom: {position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingRight: 76, gap: spacing.sm},
	caption: {
		color: colors.onMedia,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightMedium,
		lineHeight: 23,
		letterSpacing: -0.2,
	},
});
