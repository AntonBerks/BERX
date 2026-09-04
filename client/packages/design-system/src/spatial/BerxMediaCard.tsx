/**
 * BerxMediaCard — a moment on the content plane.
 *
 * Media is the primary visual element and the glass supports it, not
 * the other way round (BERX_DECISIONS.md). So the image occupies the
 * card and the scrim/identity/actions sit above it at the control
 * layer, where they stay legible over any photograph.
 */
import React from 'react';
import {Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSpatialCard} from './BerxSpatialCard';
import {colors, spacing, typography} from '../tokens';

export interface BerxMediaCardProps {
	/** Real media from the server. Absent renders a text-only card, never a stock image. */
	media?: ImageSourcePropType;
	title: string;
	subtitle?: string;
	body?: string;
	/** Alt text for the media. Required when media is present. */
	mediaAlt?: string;
	onPress?: () => void;
	/** Rendered at the control layer over the media — like, share, react. */
	actions?: React.ReactNode;
	sharedTag?: string;
	aspectRatio?: number;
	testID?: string;
}

export function BerxMediaCard({
	media,
	title,
	subtitle,
	body,
	mediaAlt,
	onPress,
	actions,
	sharedTag,
	aspectRatio = 4 / 5,
	testID,
}: BerxMediaCardProps) {
	const {scene} = useBerxScene();

	return (
		<BerxSpatialCard
			depth="D3"
			onPress={onPress}
			accessibilityLabel={onPress ? `${title}${subtitle ? `, ${subtitle}` : ''}` : undefined}
			padding={0}
			sharedTag={sharedTag}
			testID={testID}>
			{media ? (
				<View style={[styles.media, {aspectRatio}]}>
					<Image
						source={media}
						resizeMode="cover"
						accessible={mediaAlt !== undefined}
						accessibilityRole="image"
						accessibilityLabel={mediaAlt}
						style={StyleSheet.absoluteFillObject}
					/>
					{/* scrim so the control layer stays legible over any photograph */}
					<View style={[StyleSheet.absoluteFillObject, styles.scrim, {backgroundColor: rgba(scene.background, 0.34)}]} />
				</View>
			) : null}

			<View style={styles.text}>
				<Text style={styles.title} numberOfLines={2}>
					{title}
				</Text>
				{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
				{body ? (
					<Text style={styles.body} numberOfLines={4}>
						{body}
					</Text>
				) : null}
			</View>

			{actions ? <View style={styles.actions}>{actions}</View> : null}
		</BerxSpatialCard>
	);
}

/** A single control on a media card: 44dp, labelled, with pressed feedback. */
export function BerxMediaCardAction({
	label,
	glyph,
	active,
	onPress,
	disabled,
	testID,
}: {
	label: string;
	glyph: string;
	active?: boolean;
	onPress: () => void;
	disabled?: boolean;
	testID?: string;
}) {
	const {scene} = useBerxScene();
	return (
		<Pressable
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{selected: active === true, disabled: disabled === true}}
			disabled={disabled}
			onPress={onPress}
			style={({pressed}) => [
				styles.action,
				{
					borderColor: active ? rgba(scene.accent, 0.5) : scene.layers.D4.surface.borderColor,
					backgroundColor: active ? rgba(scene.accent, 0.12) : 'transparent',
					opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
				},
			]}>
			<Text style={[styles.actionGlyph, {color: active ? scene.accent : colors.textDim}]}>{glyph}</Text>
			<Text style={[styles.actionLabel, {color: active ? scene.accent : colors.textDim}]}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	media: {width: '100%', overflow: 'hidden'},
	scrim: {opacity: 0.5},
	text: {padding: spacing.lg, gap: spacing.xs},
	title: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	subtitle: {color: colors.textDim, fontSize: typography.sizeSm},
	body: {color: colors.textDim, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * 1.45},
	actions: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg},
	action: {
		minHeight: 44,
		minWidth: 44,
		paddingHorizontal: spacing.md,
		borderRadius: 999,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	actionGlyph: {fontSize: typography.sizeBase},
	actionLabel: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
});
