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
import {BerxScrim} from './BerxScrim';
import type {BerxRailAction} from './BerxActionRail';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';


export interface BerxImmersivePostProps {
	imageUrl: string;
	/** Real extra-image count on the same post (2 means one more photo exists) — a real counter, never a decorative dot row. */
	mediaCount?: number;
	authorName: string;
	authorIcon?: string | null;
	/** Real creator status (OssnUser is_creator). The reference sheets badge it beside the name; absent means not verified, never "unknown". */
	authorVerified?: boolean;
	timeLabel?: string;
	/** Real place/context this was posted from, when the caller actually knows it. */
	contextLabel?: string | null;
	text?: string;
	actions?: BerxRailAction[];
	onPress?: () => void;
	onPressAuthor?: () => void;
	ratio?: keyof typeof mediaRatio;
	/**
	 * Real follow state and action. The reference sheets put a Follow pill
	 * right beside the author on the media. It renders ONLY when the
	 * caller actually supplies the handler and the real state — a post by
	 * someone you already follow, or a screen that doesn't know, shows no
	 * pill rather than a decorative one.
	 */
	isFollowing?: boolean;
	onToggleFollow?: () => void;
	/**
	 * Opens the real comment surface. The reference sheets end the media
	 * with a glass comment bar; BERX composes on the post screen, so this
	 * is a real entry point to it, not an inline input that would pretend
	 * to post from here.
	 */
	onOpenComments?: () => void;
	commentPlaceholder?: string;
	/** Rendered under the caption, still inside the card — used for a real poll attached to the post. */
	children?: React.ReactNode;
	style?: ViewStyle;
}

export function BerxImmersivePost({
	imageUrl,
	mediaCount,
	authorName,
	authorIcon,
	authorVerified,
	timeLabel,
	contextLabel,
	text,
	actions,
	onPress,
	onPressAuthor,
	isFollowing,
	onToggleFollow,
	onOpenComments,
	commentPlaceholder = 'Добавить комментарий',
	ratio = 'hero',
	children,
	style,
}: BerxImmersivePostProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<Pressable onPress={onPress} disabled={!onPress} style={[styles.wrap, elevation[3], {aspectRatio: mediaRatio[ratio]}, style]}>
			<Image source={{uri: imageUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

			<BerxScrim coverage={0.7} strength={0.94} />

			{typeof mediaCount === 'number' && mediaCount > 1 ? (
				<View style={styles.mediaCount}>
					<Text style={styles.mediaCountText}>1/{mediaCount}</Text>
				</View>
			) : null}

			{actions && actions.length > 0 ? <BerxActionRail actions={actions} style={styles.rail} /> : null}

			<View style={styles.bottom}>
				{/* Identity and words are ONE editorial block on the media, the
				    way the reference set composes them — not a floating pill in
				    the opposite corner from the caption it belongs to. */}
				<Pressable style={styles.authorRow} onPress={onPressAuthor} disabled={!onPressAuthor}>
					{authorIcon ? (
						<Image source={{uri: authorIcon}} style={styles.authorAvatar} />
					) : (
						<View style={[styles.authorAvatar, styles.authorAvatarFallback]}>
							<Text style={styles.authorInitial}>{authorName.charAt(0).toUpperCase()}</Text>
						</View>
					)}
					<View style={styles.authorText}>
						<View style={styles.authorNameRow}>
							<Text style={styles.authorName} numberOfLines={1}>
								{authorName}
							</Text>
							{authorVerified ? <Text style={styles.verified}>✓</Text> : null}
						</View>
						{timeLabel || contextLabel ? (
							<Text style={styles.authorMeta} numberOfLines={1}>
								{[timeLabel, contextLabel].filter(Boolean).join(' · ')}
							</Text>
						) : null}
					</View>
					{onToggleFollow ? (
						<Pressable
							style={[styles.followPill, isFollowing && styles.followPillOn]}
							onPress={onToggleFollow}
							hitSlop={8}>
							<Text style={[styles.followText, isFollowing && styles.followTextOn]}>
								{isFollowing ? 'В друзьях' : 'Добавить'}
							</Text>
						</Pressable>
					) : null}
				</Pressable>
				{text ? (
					<Text style={styles.caption} numberOfLines={3}>
						{text}
					</Text>
				) : null}
				{children}

				{onOpenComments ? (
					<Pressable style={styles.commentBar} onPress={onOpenComments}>
						<Text style={styles.commentGlyph}>◌</Text>
						<Text style={styles.commentText} numberOfLines={1}>
							{commentPlaceholder}
						</Text>
					</Pressable>
				) : null}
			</View>
		</Pressable>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {
		borderRadius: radius.xl,
		overflow: 'hidden',
		// Media ground, not surface ground: the overlays on top are white
		// in both environments, so this must stay dark even in Day.
		backgroundColor: colors.mediaScrim,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	authorRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2},
	followPill: {
		paddingHorizontal: spacing.md,
		paddingVertical: 5,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(255,255,255,0.16)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.28)',
	},
	followPillOn: {backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.16)'},
	followText: {color: colors.onMedia, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	followTextOn: {color: colors.onMediaDim, fontWeight: typography.weightMedium},
	commentBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: 11,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(255,255,255,0.10)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.20)',
	},
	commentGlyph: {color: colors.onMediaDim, fontSize: 14},
	commentText: {color: colors.onMediaDim, fontSize: typography.sizeSm, flex: 1},
	authorAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.mediaScrim,
		borderWidth: 1.5,
		borderColor: 'rgba(255,255,255,0.28)',
	},
	authorAvatarFallback: {alignItems: 'center', justifyContent: 'center'},
	authorInitial: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	authorText: {flexShrink: 1},
	authorNameRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
	verified: {
		color: colors.onMedia,
		fontSize: 10,
		fontWeight: typography.weightBold,
		backgroundColor: colors.accent,
		width: 15,
		height: 15,
		borderRadius: 8,
		textAlign: 'center',
		lineHeight: 15,
		overflow: 'hidden',
	},
	authorName: {color: colors.onMedia, fontSize: typography.sizeBase, fontWeight: typography.weightBold, letterSpacing: -0.2},
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
	rail: {position: 'absolute', right: spacing.md, top: spacing.md},
	bottom: {position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.xl, paddingRight: 84, gap: spacing.sm},
	caption: {
		color: colors.onMedia,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightMedium,
		lineHeight: 23,
		letterSpacing: -0.2,
	},
});
