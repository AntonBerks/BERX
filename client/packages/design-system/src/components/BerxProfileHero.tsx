/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX PROFILE HERO — the shared identity surface for every
 * profile-shaped screen (a person, a community, a place, a business).
 * ProfileScreen already had this composition inline and keeps its own
 * copy on purpose: it carries person-only extras (mutual friends,
 * online badge, 3D-tilted avatar ring) this generic primitive
 * deliberately doesn't. This exists so communities/places/businesses
 * stop rendering a flat title bar where the person profile renders a
 * cinematic hero — the Day/Night product should not have two different
 * ideas of what a profile looks like.
 *
 * Real photography first: the cover is the subject's OWN real image.
 * With no image there is no fake gradient stand-in — it falls back to
 * the ground plane plus the subject's own initial, which is real.
 *
 * Stat tiles render only the tiles the caller actually has values for,
 * and a tile without a route is genuinely not pressable rather than a
 * dead tap target.
 */
import React from 'react';
import {View, Text, Image, Pressable, Animated, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius as radiusTokens} from '../tokens';
import type {BerxColorTokens} from '../tokens';
import {useBerxColors} from '../theme';
import {BerxSpatialLayer} from './BerxSpatialLayer';

/** Same 5-step scrim simulation the rest of BERX uses (no gradient library is installable here). */
const HERO_SCRIM_STEPS = [0, 0.18, 0.38, 0.62, 0.86];

export interface BerxProfileHeroStat {
	key: string;
	value: number | string;
	label: string;
	onPress?: () => void;
}

export interface BerxProfileHeroProps {
	title: string;
	/** @handle, category, or any real secondary identifier. Omitted when absent. */
	handle?: string | null;
	coverUrl?: string | null;
	avatarUrl?: string | null;
	/** One real context line (members count, address, "На BERX с 2023 года"). */
	meta?: string | null;
	/** Small uppercase kind label above the title. */
	eyebrow?: string | null;
	stats?: BerxProfileHeroStat[];
	/** The screen's own real scroll offset, for parallax on the cover plane. */
	scrollDriver?: Animated.Value;
	height?: number;
	children?: React.ReactNode;
	style?: ViewStyle;
}

export function BerxProfileHero({
	title,
	handle,
	coverUrl,
	avatarUrl,
	meta,
	eyebrow,
	stats,
	scrollDriver,
	height = 380,
	children,
	style,
}: BerxProfileHeroProps) {
	const colors = useBerxColors();
	const styles = React.useMemo(() => makeStyles(colors), [colors]);
	const cover = coverUrl ?? avatarUrl ?? null;
	const realStats = (stats ?? []).filter((s: BerxProfileHeroStat) => s.value !== null && s.value !== undefined);

	return (
		<View style={[styles.hero, {height}, style]}>
			<BerxSpatialLayer
				plane="background"
				driver={scrollDriver}
				range={320}
				style={StyleSheet.absoluteFillObject as ViewStyle}>
				{cover ? (
					<Image source={{uri: cover}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
				) : (
					<View style={[StyleSheet.absoluteFillObject, styles.fallback]}>
						<Text style={styles.fallbackGlyph}>{title.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</BerxSpatialLayer>

			<View style={StyleSheet.absoluteFillObject} pointerEvents="none">
				{HERO_SCRIM_STEPS.map((opacity: number, i: number) => (
					<View
						key={`scrim-${i}`}
						style={[styles.scrimStep, {height: `${100 - i * 18}%`, backgroundColor: `rgba(5,5,5,${opacity})`}]}
					/>
				))}
			</View>

			<View style={styles.content}>
				{avatarUrl && coverUrl ? <Image source={{uri: avatarUrl}} style={styles.avatar} /> : null}
				{eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
				<Text style={styles.title} numberOfLines={2}>
					{title}
				</Text>
				{handle ? <Text style={styles.handle}>{handle}</Text> : null}
				{meta ? <Text style={styles.meta}>{meta}</Text> : null}

				{realStats.length > 0 ? (
					<View style={styles.statTiles}>
						{realStats.map((s: BerxProfileHeroStat) => (
							<Pressable
								key={s.key}
								style={styles.statTile}
								onPress={s.onPress}
								disabled={!s.onPress}>
								<Text style={styles.statValue}>{s.value}</Text>
								<View style={styles.statFoot}>
									<Text style={styles.statLabel}>{s.label}</Text>
									{s.onPress ? <Text style={styles.statArrow}>↗</Text> : null}
								</View>
							</Pressable>
						))}
					</View>
				) : null}

				{children}
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		hero: {backgroundColor: colors.graphite, justifyContent: 'flex-end', overflow: 'hidden'},
		fallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
		fallbackGlyph: {fontSize: typography.sizeHero, color: colors.textFaint, fontWeight: typography.weightBold},
		scrimStep: {position: 'absolute', left: 0, right: 0, bottom: 0},
		content: {padding: spacing.xl, gap: spacing.xs},
		avatar: {
			width: 60,
			height: 60,
			borderRadius: 30,
			backgroundColor: colors.graphite,
			borderWidth: 2,
			borderColor: colors.accentSoft,
			marginBottom: spacing.xs,
		},
		eyebrow: {fontSize: typography.sizeXs, color: colors.accent, letterSpacing: 1.4, fontWeight: typography.weightBold},
		title: {
			color: colors.white,
			fontSize: typography.sizeHero,
			fontWeight: typography.weightBold,
			letterSpacing: -1,
		},
		handle: {color: colors.textDim, fontSize: typography.sizeBase, marginTop: 2},
		meta: {color: colors.textFaint, fontSize: typography.sizeSm, marginTop: 2},
		statTiles: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
		statTile: {
			flex: 1,
			padding: spacing.md,
			borderRadius: radiusTokens.lg,
			backgroundColor: colors.glass2,
			borderWidth: 1,
			borderColor: colors.borderSoft,
			gap: spacing.xs,
		},
		statValue: {
			color: colors.white,
			fontSize: typography.sizeTitle,
			fontWeight: typography.weightBold,
			letterSpacing: -0.6,
		},
		statFoot: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
		statLabel: {color: colors.textDim, fontSize: typography.sizeXs, textTransform: 'uppercase'},
		statArrow: {color: colors.accent, fontSize: typography.sizeSm},
	});
