/**
 * BERX WELCOME — screen 01, and the visual benchmark for the product.
 *
 * WHAT THIS SCREEN IS NOT, and why.
 *
 * The version before this drew a scene: a gradient dusk sky, a
 * starfield, a city skyline with lit windows, water, and a ringed
 * sphere floating over it. Every one of those is a picture of
 * something, and a first screen made of pictures reads as a phone
 * wallpaper — the eye files it as illustration, and illustration is
 * never read as luxury. It also fought the brand: with that much
 * colour and shape in play, BERX itself had nothing left to own.
 *
 * This is the opposite discipline, and it is what expensive products
 * actually do. A deep, almost-solid ground. One soft light falling
 * through it that you feel rather than look at. Enormous, restrained
 * typography with real air around it. One object so quiet you have to
 * look twice. One control, and it is white — because the accent is
 * worth more when it is spent on one word than smeared over a
 * template.
 *
 * Everything is drawn: no photograph is bundled, none is claimed, and
 * nothing here is a placeholder standing in for one.
 *
 * This reads `useBerxScene()`/`useBerxColors()` rather than a
 * hardcoded standalone constant — the single systemic cyan identity
 * (colors.bg #07080A, colors.accent #4FD6E8), not a private copy of
 * it. There is one BERX Spatial identity, not a palette a user picks;
 * this file just avoids owning its own duplicate of it. The object
 * itself (SpatialLens) is the real True3D/2D renderer split — see
 * SpatialLens.tsx's own header — keeping the exact same restrained
 * "look twice" mood BerxLens was built for.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {BerxGrain} from '../../../../packages/design-system/src/components/BerxGrain';
import {BerxPrimaryAction, BerxQuietAction} from '../../../../packages/design-system/src/components/BerxActions';
import {SpatialLens} from '../../../../packages/design-system/src/spatial/SpatialLens';
import {useBerxScene, useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxScene} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	const scene = useBerxScene();
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(scene, colors), [scene, colors]);
	return (
		<View style={styles.screen}>
			<BerxAura ground={scene.ground} glow={scene.glow} counter={scene.counter} intensity={0.9} at={0.26} />
			<BerxGrain opacity={0.04} />

			{/* The object sits high, off the left margin, half out of frame —
			    an object that fits neatly inside the composition is a logo. */}
			<BerxFadeIn riseFrom={24} scaleFrom={0.94} style={styles.lensSlot}>
				<SpatialLens size={330} light={scene.light} body={scene.object} presence={0.95} />
			</BerxFadeIn>

			<View style={styles.copy}>
				<BerxFadeIn delayMs={200} riseFrom={16}>
					<Text style={styles.mark}>BERX</Text>
				</BerxFadeIn>
				<BerxFadeIn delayMs={340} riseFrom={26}>
					<Text style={styles.display}>Новый мир</Text>
					<Text style={styles.displayThin}>вокруг вас</Text>
				</BerxFadeIn>
				<BerxFadeIn delayMs={480} riseFrom={16}>
					<Text style={styles.lede}>Места, люди и впечатления — там, где вы есть.</Text>
				</BerxFadeIn>
			</View>

			<BerxFadeIn delayMs={640} riseFrom={30} style={styles.actions}>
				<BerxPrimaryAction label="Начать" onPress={onRegister} tone="#FFFFFF" ink="#0A0D12" />
				<BerxQuietAction label="У меня уже есть аккаунт" onPress={onLogin} />
			</BerxFadeIn>
		</View>
	);
}

const makeStyles = (scene: BerxScene, colors: BerxColorTokens) =>
	StyleSheet.create({
		screen: {flex: 1, backgroundColor: scene.ground, overflow: 'hidden'},
		lensSlot: {position: 'absolute', top: '9%', left: -96},
		copy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 214},
		mark: {
			fontSize: 12,
			color: scene.light,
			letterSpacing: 6,
			fontWeight: typography.weightBold,
			marginBottom: spacing.xl,
		},
		// Copy stays a constant near-white/white regardless of World —
		// same reasoning as tokens/index.ts's own onMedia (media/scene ink
		// is deliberately world-invariant; only the accent and the
		// ground move), so light-toned worlds (Day/Ice, Sun) don't lose
		// contrast against their own brighter ground.
		display: {fontSize: 52, lineHeight: 56, fontWeight: '700', color: colors.onMedia, letterSpacing: -2},
		displayThin: {fontSize: 52, lineHeight: 56, fontWeight: '200', color: colors.onMediaDim, letterSpacing: -2},
		lede: {
			fontSize: typography.sizeBase,
			lineHeight: 24,
			color: colors.onMediaFaint,
			marginTop: spacing.xl,
			maxWidth: 270,
		},
		actions: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 40},
	});
