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
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {BerxLens} from '../../../../packages/design-system/src/components/BerxLens';
import {BerxGrain} from '../../../../packages/design-system/src/components/BerxGrain';
import {BerxPrimaryAction, BerxQuietAction} from '../../../../packages/design-system/src/components/BerxActions';
import {BERX_SCENE} from '../../../../packages/design-system/src/palette';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	const styles = useMemo(() => makeStyles(), []);
	return (
		<View style={styles.screen}>
			<BerxAura
				ground={BERX_SCENE.ground}
				glow={BERX_SCENE.glow}
				counter={BERX_SCENE.counter}
				intensity={0.9}
				at={0.26}
			/>
			<BerxGrain opacity={0.04} />

			{/* The object sits high, off the left margin, half out of frame —
			    an object that fits neatly inside the composition is a logo. */}
			<BerxFadeIn riseFrom={24} scaleFrom={0.94} style={styles.lensSlot}>
				<BerxLens size={330} light={BERX_SCENE.light} body={BERX_SCENE.object} presence={0.95} />
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

const makeStyles = () =>
	StyleSheet.create({
		screen: {flex: 1, backgroundColor: BERX_SCENE.ground, overflow: 'hidden'},
		lensSlot: {position: 'absolute', top: '9%', left: -96},
		copy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 214},
		mark: {
			fontSize: 12,
			color: BERX_SCENE.light,
			letterSpacing: 6,
			fontWeight: typography.weightBold,
			marginBottom: spacing.xl,
		},
		display: {fontSize: 52, lineHeight: 56, fontWeight: '700', color: '#FFFFFF', letterSpacing: -2},
		displayThin: {fontSize: 52, lineHeight: 56, fontWeight: '200', color: 'rgba(255,255,255,0.82)', letterSpacing: -2},
		lede: {
			fontSize: typography.sizeBase,
			lineHeight: 24,
			color: 'rgba(255,255,255,0.5)',
			marginTop: spacing.xl,
			maxWidth: 270,
		},
		actions: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 40},
	});
