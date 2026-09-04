/**
 * Dating / It's a match — a SOCIAL-family v9 scene.
 *
 * BERX's own visual language, not a clone of anyone's match screen:
 * the D5 energy layer carries the moment, the accent is the BERX cyan
 * (this file used to describe an orange glow — a leftover from a
 * palette rejected twice, see BERX_DECISIONS.md), and both actions are
 * real: message the match through the same real conversation thread as
 * anyone else, or keep browsing.
 *
 * No avatars: BERX Match keeps profile photos server-side private and
 * releases them through a request/grant flow API v1 does not expose
 * here, so the scene shows the pseudonym rather than two grey circles
 * standing in for people.
 */
import {Animated, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxDepthLayer} from '../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {useBerxScene, useBerxSceneEnter} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface DatingMatchScreenProps {
	otherUsername: string;
	onMessage: () => void;
	onContinueBrowsing: () => void;
}

export default function DatingMatchScreen(props: DatingMatchScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" testID="dating-match">
			<DatingMatchSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function DatingMatchSceneBody({otherUsername, onMessage, onContinueBrowsing}: DatingMatchScreenProps) {
	const {scene} = useBerxScene();
	const enter = useBerxSceneEnter();

	return (
		<View style={styles.screen}>
			<BerxDepthLayer depth="D5" style={styles.haloLayer} decorative>
				<BerxEnergyHalo size={300} intensity={0.85} />
			</BerxDepthLayer>

			<Animated.View style={[styles.center, enter]}>
				<Text
					style={[styles.title, {color: scene.accent}]}
					accessibilityRole="header"
					accessibilityLiveRegion="polite">
					Это совпадение!
				</Text>
				<Text style={styles.subtitle}>Вы понравились друг другу с {otherUsername}</Text>
			</Animated.View>

			<View style={styles.actions}>
				<BerxButton label="Написать" onPress={onMessage} fullWidth />
				<BerxButton label="Продолжить просмотр" variant="secondary" onPress={onContinueBrowsing} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.xxl},
	haloLayer: {position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center'},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
	title: {fontSize: typography.sizeHero, fontWeight: typography.weightBold, textAlign: 'center'},
	subtitle: {color: colors.textDim, fontSize: typography.sizeBase, textAlign: 'center'},
	actions: {gap: spacing.md},
});
