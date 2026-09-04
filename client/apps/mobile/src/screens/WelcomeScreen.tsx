/**
 * BERX-001 — Welcome / Cinematic Reveal. The AUTH family's entry.
 *
 * The 'Welcome' route existed in routes.ts from the first
 * information-architecture pass but was never implemented; AppShell
 * jumped straight to login. This is the real screen, now resolved as
 * a v9 scene: DeepGlass on a hero light recipe, the wordmark on the
 * content plane, the actions on the control plane, and a slow energy
 * halo at D5 that holds still under reduced motion instead of
 * pulsing.
 *
 * No stock imagery. The reference boards are AI-generated composites
 * with no rights attached, so the atmosphere here is the scene's own
 * lighting rather than a borrowed photograph — an honest empty D1 is
 * better than an unlicensed full one.
 */
import {Animated, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxDepthLayer} from '../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {useBerxSceneEnter} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxScreenScene} from '../spatial/BerxScreenScene';

export interface WelcomeScreenProps {
	onLogin: () => void;
	onRegister: () => void;
}

export default function WelcomeScreen(props: WelcomeScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-001" testID="berx-001">
			<WelcomeSceneBody {...props} />
		</BerxScreenScene>
	);
}

function WelcomeSceneBody({onLogin, onRegister}: WelcomeScreenProps) {
	/* the scene's own enter motion — cross-fade under reduced motion */
	const enter = useBerxSceneEnter();

	return (
		<View style={styles.screen}>
			{/* D5 — the only layer allowed to emit */}
			<BerxDepthLayer depth="D5" style={styles.haloLayer} decorative>
				<BerxEnergyHalo size={280} intensity={0.5} />
			</BerxDepthLayer>

			<Animated.View style={[styles.center, enter]}>
				<Text style={styles.wordmark} accessibilityRole="header">
					BER<Text style={styles.wordmarkAccent}>X</Text>
				</Text>
				<Text style={styles.tagline}>Место, где люди находят впечатления</Text>
			</Animated.View>

			<View style={styles.actions}>
				<BerxButton label="Войти" onPress={onLogin} fullWidth />
				<BerxButton label="Регистрация" variant="secondary" onPress={onRegister} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.xxl},
	haloLayer: {position: 'absolute', top: '18%', left: 0, right: 0, alignItems: 'center'},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
	wordmark: {fontSize: 40, fontWeight: typography.weightBold, color: colors.text, letterSpacing: 2},
	wordmarkAccent: {color: colors.accent},
	tagline: {fontSize: typography.sizeBase, color: colors.textDim, textAlign: 'center'},
	actions: {gap: spacing.md},
});
