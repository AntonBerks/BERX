/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX MEDIA CARD — the cinematic unit the whole spatial layer is
 * built from. Large real photography, an aspect ratio chosen from the
 * real ratio scale (never a square Instagram tile by default), a
 * bottom legibility scrim, and overlay slots that sit ON the image
 * rather than in a caption box under it.
 *
 * Scrim is 5 stacked absolute Views rather than a shader — same
 * honest constraint BerxScrimHero already documents (no
 * expo-linear-gradient installable in this sandbox).
 *
 * MEDIA IS REAL OR ABSENT. With no real image URL this renders a
 * composed graphite plane carrying the same overlay content — never a
 * grey "photo placeholder" pretending an image exists.
 */
import React, {useMemo} from 'react';
import {View, Image, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {radius, spacing, mediaRatio, elevation as elevationTokens} from '../tokens';
import {BerxScrim} from './BerxScrim';
import type {BerxElevation} from '../tokens';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';


export interface BerxMediaCardProps {
	imageUrl?: string | null;
	/** Real ratio from the token scale — 'hero' (4:5) is the BERX default for a feed unit. */
	ratio?: keyof typeof mediaRatio;
	/** Fixed height instead of a ratio, when a rail needs uniform rows. */
	height?: number;
	width?: number;
	onPress?: () => void;
	/** Content pinned to the bottom of the image, above the scrim. */
	children?: React.ReactNode;
	/** Content pinned to the top-left — live badges, distance, category. */
	topLeft?: React.ReactNode;
	/** Content pinned to the top-right — presence dots, counts, actions. */
	topRight?: React.ReactNode;
	depth?: BerxElevation;
	cornerRadius?: number;
	style?: ViewStyle;
}

export function BerxMediaCard({
	imageUrl,
	ratio = 'hero',
	height,
	width,
	onPress,
	children,
	topLeft,
	topRight,
	depth = 2,
	cornerRadius = radius.lg,
	style,
}: BerxMediaCardProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const body = (
		<View
			style={[
				styles.wrap,
				elevationTokens[depth],
				{borderRadius: cornerRadius},
				height ? {height} : {aspectRatio: mediaRatio[ratio]},
				width ? {width} : null,
				style,
			]}>
			{imageUrl ? (
				<Image source={{uri: imageUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
			) : (
				<View style={[StyleSheet.absoluteFillObject, styles.noMedia]} />
			)}

			{/* Bottom legibility scrim — only rendered when there's overlay content to protect. */}
			{children ? (
			<BerxScrim coverage={0.62} strength={0.9} />
			) : null}

			{topLeft ? <View style={styles.topLeft}>{topLeft}</View> : null}
			{topRight ? <View style={styles.topRight}>{topRight}</View> : null}
			{children ? <View style={styles.bottom}>{children}</View> : null}
		</View>
	);

	if (!onPress) {
		return body;
	}
	return (
		<Pressable onPress={onPress} style={styles.press}>
			{body}
		</Pressable>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	press: {},
	wrap: {
		overflow: 'hidden',
		backgroundColor: colors.mediaScrim,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	noMedia: {backgroundColor: colors.mediaScrim},
	topLeft: {position: 'absolute', top: spacing.md, left: spacing.md},
	topRight: {position: 'absolute', top: spacing.md, right: spacing.md},
	bottom: {position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, gap: spacing.xs},
});
