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
 */
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	return (
		<View style={styles.screen}>
			<View style={styles.glow} />
			<View style={styles.center}>
				<Text style={styles.wordmark}>
					BER<Text style={styles.wordmarkAccent}>X</Text>
				</Text>
				<Text style={styles.tagline}>Место, где люди находят впечатления</Text>
			</View>
			<View style={styles.actions}>
				<BerxButton label="Войти" onPress={onLogin} fullWidth />
				<BerxButton label="Регистрация" variant="secondary" onPress={onRegister} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.xxl},
	glow: {
		position: 'absolute',
		top: -100,
		left: '50%',
		marginLeft: -160,
		width: 320,
		height: 320,
		borderRadius: 160,
		backgroundColor: colors.accentSoft,
	},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
	wordmark: {fontSize: 40, fontWeight: typography.weightBold, color: colors.text, letterSpacing: 2},
	wordmarkAccent: {color: colors.accent},
	tagline: {fontSize: typography.sizeBase, color: colors.textDim, textAlign: 'center'},
	actions: {gap: spacing.md},
});
