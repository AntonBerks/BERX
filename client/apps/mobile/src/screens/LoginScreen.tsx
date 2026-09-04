/**
 * BERX-002 — Sign In.
 *
 * Still a pure UI layer over BerxAuthState: every state shown here
 * (authenticating, authError) comes from the auth snapshot, not from
 * local booleans. The screen calls authState.login() and renders what
 * the snapshot says; it never calls api.login()/api.me() itself and
 * never navigates — AppShell re-renders into the authenticated tree
 * when the snapshot flips.
 *
 * v9 puts the form on the structure plane of a DeepGlass hero scene
 * and adds what the accessibility contract asks for and this screen
 * did not have: the error is announced assertively rather than only
 * drawn, the submit button reports its own disabled reason, and the
 * register link is a real 44dp control instead of an 8px hit-slop.
 */
import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxScreenScene} from '../spatial/BerxScreenScene';

export interface LoginScreenProps {
	authState: BerxAuthState;
	/** When provided, shows the route back to registration. */
	onGoToRegister?: () => void;
}

export default function LoginScreen(props: LoginScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-002" testID="berx-002">
			<LoginSceneBody {...props} />
		</BerxScreenScene>
	);
}

function LoginSceneBody({authState, onGoToRegister}: LoginScreenProps) {
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const snapshot = authState.getSnapshot();
	const isSubmitting = snapshot.status === 'authenticating';
	const canSubmit = identifier.trim().length > 0 && password.length > 0;

	async function handleSubmit() {
		/* real validation, not a permanently disabled button */
		if (!canSubmit) return;
		try {
			await authState.login(identifier.trim(), password);
		} catch {
			/* authState already recorded authError; the text below reads from that snapshot */
		}
	}

	function handleIdentifierChange(text: string) {
		if (snapshot.status === 'authError') authState.clearError();
		setIdentifier(text);
	}

	return (
		<View style={styles.screen}>
			<Text style={styles.title} accessibilityRole="header">
				BER<Text style={styles.titleAccent}>X</Text>
			</Text>

			<BerxSpatialCard depth="D2" padding={spacing.xl}>
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
					/* assertive: a failed sign-in must interrupt, not wait to be noticed */
					<Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>
						Неверный логин или пароль
					</Text>
				) : null}

				<BerxButton
					label="Войти"
					onPress={handleSubmit}
					loading={isSubmitting}
					disabled={!canSubmit}
					fullWidth
				/>
			</BerxSpatialCard>

			{onGoToRegister ? (
				<Pressable
					onPress={onGoToRegister}
					accessibilityRole="button"
					accessibilityLabel="Нет аккаунта? Зарегистрироваться"
					style={styles.registerLink}>
					<Text style={styles.registerLinkText}>Нет аккаунта? Зарегистрироваться</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.xl},
	title: {
		color: colors.text,
		fontSize: typography.sizeHero,
		fontWeight: typography.weightBold,
		textAlign: 'center',
		letterSpacing: 2,
	},
	titleAccent: {color: colors.accent},
	input: {marginBottom: spacing.md},
	error: {color: colors.danger, marginBottom: spacing.md, fontSize: typography.sizeSm},
	/* 44dp, per the accessibility contract — it was an 8px hit-slop link */
	registerLink: {minHeight: 44, alignItems: 'center', justifyContent: 'center'},
	registerLinkText: {color: colors.accent, fontSize: typography.sizeSm},
});
