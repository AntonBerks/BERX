/**
 * BerxProfileHero — identity as the focal object of a PROFILE scene.
 *
 * The cover sits at D1 (atmosphere), the identity block at D3
 * (content) and the actions at D4 (controls), which is what makes a
 * profile read as a person standing in a space rather than a banner
 * with text on it. The avatar and the header are shared elements, so
 * moving between profile tabs keeps the same person on screen instead
 * of rebuilding them.
 */
import {Image, StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import {rgba, sharedElementTag} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxActionShelf} from './BerxActionShelf';
import {BerxAvatar} from '../components/BerxAvatar';
import {BerxStatRail, type BerxStat} from './BerxStatRail';
import {colors, spacing, typography} from '../tokens';

export interface BerxProfileHeroProps {
	userGuid: number;
	name: string;
	handle?: string;
	avatarUrl?: string;
	/** Real cover media. Omitted when the account has none — no stock banner. */
	cover?: ImageSourcePropType;
	bio?: string;
	verified?: boolean;
	stats: readonly BerxStat[];
	/** Follow / message / edit — whatever the viewer is actually permitted to do. */
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxProfileHero({
	userGuid,
	name,
	handle,
	avatarUrl,
	cover,
	bio,
	verified,
	stats,
	actions,
	testID,
}: BerxProfileHeroProps) {
	const {scene} = useBerxScene();
	const atmosphere = scene.layers.D1;

	return (
		<View testID={testID} nativeID={sharedElementTag('profileHeader', userGuid)} style={styles.root}>
			{/* D1 — atmosphere. Decorative: the identity below carries the meaning. */}
			<View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={[styles.cover, {opacity: atmosphere.contentOpacity}]}>
				{cover ? <Image source={cover} resizeMode="cover" style={StyleSheet.absoluteFillObject} /> : null}
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: rgba(scene.background, cover ? 0.45 : 0.9)}]} />
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: atmosphere.lighting.accentGlow}]} />
			</View>

			{/* D3 — content */}
			<View style={styles.body}>
				<View nativeID={sharedElementTag('avatar', userGuid)} style={[styles.avatar, {borderColor: scene.background}]}>
					<BerxAvatar iconUrl={avatarUrl} fallbackInitial={name.slice(0, 1)} size={84} />
				</View>

				<View accessible accessibilityRole="header" accessibilityLabel={`${name}${handle ? `, @${handle}` : ''}${verified ? ', подтверждён' : ''}`}>
					<View style={styles.nameRow}>
						<Text style={styles.name}>{name}</Text>
						{verified ? (
							<View style={[styles.verified, {borderColor: rgba(scene.accent, 0.42), backgroundColor: rgba(scene.accent, 0.16)}]}>
								<Text style={[styles.verifiedGlyph, {color: scene.accent}]}>✓</Text>
							</View>
						) : null}
					</View>
					{handle ? <Text style={styles.handle}>@{handle}</Text> : null}
				</View>

				{bio ? <Text style={styles.bio}>{bio}</Text> : null}

				<BerxStatRail stats={stats} />

				{/* D4 — controls */}
				{/* promoted to the control plane and anchored to the hero above it */}
				{actions ? <BerxActionShelf variant="anchored">{actions}</BerxActionShelf> : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {},
	cover: {height: 168, overflow: 'hidden'},
	body: {paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, marginTop: -42},
	avatar: {borderWidth: 3, borderRadius: 48, alignSelf: 'flex-start'},
	nameRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	name: {color: colors.text, fontSize: typography.sizeTitle, fontWeight: typography.weightBold},
	verified: {width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	verifiedGlyph: {fontSize: 11, fontWeight: typography.weightBold},
	handle: {color: colors.textDim, fontSize: typography.sizeBase},
	bio: {color: colors.textDim, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * 1.45},
	actions: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap'},
});
