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
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {BerxGrain} from '../../../../packages/design-system/src/components/BerxGrain';
import {BerxPlanes} from '../../../../packages/design-system/src/components/BerxPlanes';
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
		<View style={styles.screen}>
			<BerxAura
				ground={BERX_SCENE.ground}
				glow={BERX_SCENE.glow}
				counter={BERX_SCENE.counter}
				intensity={1}
				at={0.52}
			/>
			{/* BERX's own 3D, filling the upper half: glass slabs floating at
			    three depths, each catching the ember along one edge. The
			    alternative was half a screen of empty ground, which reads as
			    an unfinished layout rather than as space. */}
			<BerxPlanes
				planes={[
					// Discrete OBJECTS, not sheets. An earlier set ran 0.62–0.72 of
					// the screen wide and bled off both edges at once, which reads
					// as a stack of ramps rather than as slabs floating in a room.
					// They are also kept clear of the type block below.
					{x: 0.68, y: 0.09, w: 0.3, depth: 0.88, tilt: -6},
					{x: 0.3, y: 0.15, w: 0.24, depth: 0.72, tilt: 4},
					{x: 0.74, y: 0.24, w: 0.44, depth: 0.1, tilt: -3},
					{x: 0.22, y: 0.3, w: 0.34, depth: 0.42, tilt: 7},
					{x: 0.52, y: 0.38, w: 0.2, depth: 0.8, tilt: -8},
				]}
				light={BERX_SCENE.light}
				body={BERX_SCENE.object}
			/>
			<BerxGrain opacity={0.045} />

			{/* The mark stands high in the light, at the size of an object
			    rather than of a logo in a corner. */}
			{/* The safe-area inset is applied on the host View: BerxFadeIn
			    takes a single ViewStyle, not a style array. */}
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
		</View>
	);
}

const makeStyles = () =>
	StyleSheet.create({
		screen: {flex: 1, backgroundColor: BERX_SCENE.ground, overflow: 'hidden'},
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
