/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Pure UI layer: every state shown here (authenticating/authError/
 * banned) comes from BerxAuthState's snapshot, not local component
 * state — this screen calls authState.login() and renders whatever the
 * snapshot says, it does not call api.login()/api.me() itself and
 * does not track its own "loading"/"error" booleans. That's the
 * architectural point of Phase-4's "LoginScreen should be a UI layer"
 * requirement.
 *
 * MAX BUILD — real ban enforcement (OssnUser::ban(), see report.php's
 * user-report action and admin.php's /admin/ban route). A banned
 * account's real server message ("This account has been suspended")
 * now actually renders instead of a hardcoded "неверный логин или
 * пароль" that would have misled a suspended user into thinking they
 * mistyped their password.
 *
 * MAX BUILD — real visual pass, same reasoning as RegisterScreen.tsx's
 * own header: the previous version was a bare title + two inputs with
 * no relationship to the redesigned RegisterScreen right next to it
 * in the same flow. No auth logic touched — still reads only from
 * BerxAuthState's snapshot, still calls authState.login() the same
 * way. Berx3DTilt/BerxFadeIn/BerxGlassSurface are the same real,
 * already-shipped primitives RegisterScreen now uses, kept identical
 * across both screens on purpose.
 */
import {useState} from 'react';
import {View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet} from 'react-native';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

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
		if (snapshot.status === 'authError' || snapshot.status === 'banned') {
			authState.clearError();
		}
		setIdentifier(text);
	}

	return (
		<KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
				<BerxFadeIn riseFrom={8}>
					<View style={styles.hero}>
						<Berx3DTilt style={styles.wordmarkTilt} maxAngle={8}>
							<Text style={styles.wordmark}>BERX</Text>
						</Berx3DTilt>
						<Text style={styles.tagline}>Мир, который вы создаёте сами</Text>
					</View>
				</BerxFadeIn>

				<BerxFadeIn delayMs={90} riseFrom={16}>
					<BerxGlassSurface style={styles.card}>
						<BerxInput
							placeholder="Логин или email"
							autoCapitalize="none"
							autoCorrect={false}
							value={identifier}
							onChangeText={handleIdentifierChange}
						/>
						<BerxInput
							placeholder="Пароль"
							secureTextEntry
							value={password}
							onChangeText={setPassword}
						/>
						{snapshot.status === 'authError' ? (
							<Text style={styles.error}>{snapshot.error ?? 'Неверный логин или пароль'}</Text>
						) : null}
						{snapshot.status === 'banned' ? (
							<Text style={styles.error}>{snapshot.error ?? 'Этот аккаунт заблокирован.'}</Text>
						) : null}
						<BerxButton label="Войти" onPress={handleSubmit} loading={isSubmitting} fullWidth />
					</BerxGlassSurface>
				</BerxFadeIn>

				{onGoToRegister ? (
					<Pressable onPress={onGoToRegister} hitSlop={8} style={styles.registerLink}>
						<Text style={styles.registerLinkText}>Нет аккаунта? Зарегистрироваться</Text>
					</Pressable>
				) : null}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	scrollBody: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl},
	hero: {alignItems: 'center', gap: spacing.sm},
	wordmarkTilt: {alignSelf: 'center'},
	wordmark: {
		fontSize: typography.sizeHero,
		fontWeight: typography.weightBold,
		color: colors.accent,
		letterSpacing: 4,
		textShadowColor: 'rgba(79,214,232,0.45)',
		textShadowOffset: {width: 0, height: 0},
		textShadowRadius: 24,
	},
	tagline: {color: colors.textDim, fontSize: typography.sizeSm},
	card: {gap: spacing.md},
	error: {
		color: colors.danger,
		fontSize: typography.sizeSm,
		textAlign: 'center',
	},
	registerLink: {alignSelf: 'center', paddingVertical: spacing.sm},
	registerLinkText: {color: colors.accent, fontSize: typography.sizeSm},
});
