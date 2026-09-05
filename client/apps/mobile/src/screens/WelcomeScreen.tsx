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
import {Animated, StyleSheet, View} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxWordmark} from '../../../../packages/design-system/src/spatial/BerxWordmark';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxDepthLayer} from '../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {useBerxSceneEnter} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
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
	/**
	 * A reveal, not an appearance.
	 *
	 * The scene's own enter preset runs three times with the same
	 * duration and the same distance, offset so the room arrives
	 * before the mark, the mark before the line, the line before the
	 * doors. Under reduced motion resolveMotion has already made it a
	 * cross-fade and the offsets collapse — nothing travels and
	 * nothing waits.
	 */
	const enterMark = useBerxSceneEnter(0);
	const enterLine = useBerxSceneEnter(160);
	const enterActions = useBerxSceneEnter(280);

	return (
		<View style={styles.screen}>
			{/* D5 — the only layer allowed to emit */}
			<BerxDepthLayer depth="D5" style={styles.haloLayer} decorative>
				<BerxEnergyHalo size={280} intensity={0.5} />
			</BerxDepthLayer>

			<View style={styles.center}>
				{/* the mark, set the way BERX's own identity sets it: wide
				    tracking, weight held back, the last letter carrying the
				    colour world's accent. This is the one place in the
				    product where type is the image. */}
				<Animated.View style={enterMark}>
					<BerxWordmark size={46} heading />
				</Animated.View>
				<Animated.View style={enterLine}>
					<BerxText role="subtitle" emphasis="secondary" style={styles.tagline}>
						Место, где люди находят впечатления
					</BerxText>
				</Animated.View>
			</View>

			<Animated.View style={enterActions}>
				<BerxActionShelf variant="anchored">
					<BerxButton label="Войти" onPress={onLogin} fullWidth />
					<BerxButton label="Регистрация" variant="secondary" onPress={onRegister} fullWidth />
				</BerxActionShelf>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.xxl},
	haloLayer: {position: 'absolute', top: '18%', left: 0, right: 0, alignItems: 'center'},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl},
	tagline: {textAlign: 'center', maxWidth: 320},
	actions: {gap: spacing.md},
});
