/**
 * BERX WELCOME — screen 01, and the visual benchmark for the product.
 *
 * The composition is deliberately not a scene. Earlier versions drew a
 * dusk sky, a starfield, a city and a ringed sphere; fully-illustrated
 * scenery reads as a phone wallpaper, and it left the brand nothing to
 * own. What is here instead is an ENVIRONMENT: a warm near-black
 * ground, one soft ember pool falling through it, the BERX mark
 * standing in that light, and type doing most of the work.
 *
 * Type does that work because BERX now ships real typefaces. The
 * display line is Instrument Serif — a serif against a geometric sans
 * is the cheapest way a product stops looking like every other app
 * rendered in one grotesque — set large and tight, with the interface
 * around it in Manrope.
 *
 * Ember is the whole identity. It lights the ground, it is the mark,
 * and it is the one control that matters. Nothing else on the screen
 * is allowed to be colourful.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography, fonts} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxEntryStage} from '../../../../packages/design-system/src/components/BerxEntryStage';
import {BerxMark, BerxWordmark} from '../../../../packages/design-system/src/components/BerxLogo';
import {BerxPrimaryAction, BerxQuietAction} from '../../../../packages/design-system/src/components/BerxActions';
import {BERX_SCENE} from '../../../../packages/design-system/src/palette';
import {useBerxInsets} from '../../../../packages/design-system/src/insets';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	const insets = useBerxInsets();
	const styles = useMemo(() => makeStyles(), []);
	return (
		<BerxEntryStage progress={0}>
			{/* Mark, wordmark and headline are ONE block. Parking the mark in
			    a top corner left a quarter-screen of nothing between it and
			    the type, which reads as an unfinished layout rather than as
			    space. */}
			<View style={styles.copy}>
				<BerxFadeIn riseFrom={20} scaleFrom={0.9}>
					<BerxMark size={68} light={BERX_SCENE.light} body="#4A2C2A" style={styles.mark} />
				</BerxFadeIn>
				<BerxFadeIn delayMs={180} riseFrom={14}>
					<BerxWordmark width={92} color="rgba(248,243,239,0.86)" />
				</BerxFadeIn>
				<BerxFadeIn delayMs={320} riseFrom={26}>
					<Text style={styles.display}>Новый мир</Text>
					<Text style={styles.displayAccent}>вокруг вас</Text>
				</BerxFadeIn>
				<BerxFadeIn delayMs={460} riseFrom={14}>
					<Text style={styles.lede}>Места, люди и впечатления — там, где вы сейчас.</Text>
				</BerxFadeIn>
			</View>

			<View style={[styles.actions, {paddingBottom: insets.bottom + 20}]}>
				<BerxFadeIn delayMs={620} riseFrom={28}>
					<BerxPrimaryAction label="Начать" onPress={onRegister} tone={BERX_SCENE.light} ink="#26100A" />
					<BerxQuietAction label="У меня уже есть аккаунт" onPress={onLogin} />
				</BerxFadeIn>
			</View>
		</BerxEntryStage>
	);
}

const makeStyles = () =>
	StyleSheet.create({
		mark: {marginLeft: -10, marginBottom: spacing.lg},
		copy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 200},
		display: {
			fontFamily: fonts.display,
			fontSize: 62,
			lineHeight: 66,
			color: '#F8F3EF',
			letterSpacing: -1,
			marginTop: spacing.md,
		},
		displayAccent: {
			fontFamily: fonts.displayItalic,
			fontSize: 62,
			lineHeight: 66,
			color: BERX_SCENE.light,
			letterSpacing: -1,
		},
		lede: {
			fontSize: typography.sizeBase,
			lineHeight: 25,
			color: 'rgba(248,243,239,0.55)',
			marginTop: spacing.lg,
			maxWidth: 264,
		},
		actions: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 0},
	});
