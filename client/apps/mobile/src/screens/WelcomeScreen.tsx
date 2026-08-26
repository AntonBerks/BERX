/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * The 'Welcome' route existed in routes.ts since the earliest
 * information-architecture pass but was never actually implemented —
 * AppShell always jumped straight to LoginScreen. This closes that
 * real gap, using the splash/tagline direction from the reference
 * images (own wordmark treatment and copy, not the reference images'
 * actual bitmap assets — those are AI-generated stock composites with
 * no rights attached, not something to embed as real app assets).
 *
 * Future UI pass: real device-time daypart palette (tokens/index.ts's
 * getBerxDaypartPalette() — built earlier this project but never
 * actually wired into a screen until now) shifts the glow/wordmark
 * subtly across the day, plus a real cinematic fade-rise (BerxFadeIn)
 * on mount. No purple — the accent stays the locked cyan or the
 * neutral grey the palette itself already defines for night hours.
 */
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography, getBerxDaypartPalette} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

const daypart = getBerxDaypartPalette(new Date().getHours());

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	return (
		<View style={styles.screen}>
			<View style={[styles.glow, {backgroundColor: daypart.accentSoft}]} />
			<View style={[styles.glowSecondary, {backgroundColor: daypart.accentSoft}]} />
			<BerxFadeIn style={styles.center} riseFrom={20}>
				<Text style={styles.wordmark}>
					BER<Text style={[styles.wordmarkAccent, {color: daypart.accent}]}>X</Text>
				</Text>
				<Text style={styles.tagline}>Место, где люди находят впечатления</Text>
				<Text style={styles.daypart}>{daypart.label} · BERX уже рядом</Text>
			</BerxFadeIn>
			<BerxFadeIn style={styles.actions} delayMs={120} riseFrom={16}>
				<BerxButton label="Войти" onPress={onLogin} fullWidth />
				<BerxButton label="Регистрация" variant="secondary" onPress={onRegister} fullWidth />
			</BerxFadeIn>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.xxl, overflow: 'hidden'},
	glow: {
		position: 'absolute',
		top: -100,
		left: '50%',
		marginLeft: -160,
		width: 320,
		height: 320,
		borderRadius: 160,
	},
	glowSecondary: {
		position: 'absolute',
		bottom: -140,
		right: -80,
		width: 260,
		height: 260,
		borderRadius: 130,
		opacity: 0.6,
	},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
	wordmark: {fontSize: 40, fontWeight: typography.weightBold, color: colors.text, letterSpacing: 2},
	wordmarkAccent: {},
	tagline: {fontSize: typography.sizeBase, color: colors.textDim, textAlign: 'center'},
	daypart: {fontSize: typography.sizeXs, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm},
	actions: {gap: spacing.md},
});
