/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Pure UI layer: every state shown here (authenticating/authError)
 * comes from BerxAuthState's snapshot, not local component state —
 * this screen calls authState.login() and renders whatever the
 * snapshot says, it does not call api.login()/api.me() itself and
 * does not track its own "loading"/"error" booleans. That's the
 * architectural point of Phase-4's "LoginScreen should be a UI layer"
 * requirement.
 */
import {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';

interface Props {
	authState: BerxAuthState;
	/** Optional — when provided, shows a link back to registration; the unauthenticated flow that renders this screen decides whether that's reachable from here. */
	onGoToRegister?: () => void;
}

export default function LoginScreen({authState, onGoToRegister}: Props) {
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const snapshot = authState.getSnapshot();
	const isSubmitting = snapshot.status === 'authenticating';

	async function handleSubmit() {
		if (!identifier.trim() || !password) {
			return; // real validation (empty fields) — not a fake disabled-forever state
		}
		try {
			await authState.login(identifier.trim(), password);
			// No navigation call here — AppShell re-renders into the
			// authenticated tree automatically once the snapshot's
			// status flips, via its own subscribe() to authState. This
			// screen doesn't know or care what happens after a
			// successful login.
		} catch {
			// authState already recorded authError in its snapshot;
			// nothing further to do here — the error text below reads
			// from that same snapshot, not a local catch variable.
		}
	}

	function handleIdentifierChange(text: string) {
		if (snapshot.status === 'authError') {
			authState.clearError();
		}
		setIdentifier(text);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>BERX</Text>
			<BerxInput
				placeholder="Логин или email"
				autoCapitalize="none"
				autoCorrect={false}
				value={identifier}
				onChangeText={handleIdentifierChange}
				style={styles.input}
			/>
			<BerxInput
				placeholder="Пароль"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
				style={styles.input}
			/>
			{snapshot.status === 'authError' ? (
				<Text style={styles.error}>Неверный логин или пароль</Text>
			) : null}
			<BerxButton label="Войти" onPress={handleSubmit} loading={isSubmitting} fullWidth />
			{onGoToRegister ? (
				<Pressable onPress={onGoToRegister} hitSlop={8} style={styles.registerLink}>
					<Text style={styles.registerLinkText}>Нет аккаунта? Зарегистрироваться</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.black,
		justifyContent: 'center',
		paddingHorizontal: spacing.xl,
	},
	title: {
		color: colors.accent,
		fontSize: typography.sizeHero,
		fontWeight: typography.weightBold,
		textAlign: 'center',
		marginBottom: spacing.xxl,
	},
	input: {
		marginBottom: spacing.md,
	},
	error: {
		color: colors.danger,
		marginBottom: spacing.md,
		fontSize: typography.sizeSm,
	},
	registerLink: {marginTop: spacing.lg, alignItems: 'center'},
	registerLinkText: {color: colors.accent, fontSize: typography.sizeSm},
});
