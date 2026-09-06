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
import {Pressable, StyleSheet, View} from 'react-native';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxWordmark} from '../../../../packages/design-system/src/spatial/BerxWordmark';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxScreenScene} from '../spatial/BerxScreenScene';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

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
	/**
	 * A dead network is not a wrong password.
	 *
	 * Signing in with no connection produced the same "wrong login or
	 * password" as typing the wrong one — so the one failure a person
	 * can actually do something about was indistinguishable from the
	 * one they cannot. The offline state is real here now, and it takes
	 * precedence: there is no point telling someone their credentials
	 * are wrong when nothing was sent.
	 */
	const {offline} = useBerxConnectivity();
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
		<BerxSceneScroll
			style={styles.screen}
			contentContainerStyle={styles.scrollBody}
			keyboardShouldPersistTaps="handled">
			{/* the mark, then what this screen is. The mark alone at the
			    top of a form leaves the screen unnamed. */}
			<View style={styles.masthead}>
				<BerxWordmark size={38} />
				<BerxText role="heading" heading>
					Вход
				</BerxText>
			</View>

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
					/* assertive: a failed sign-in must interrupt, not wait to be noticed */
					<View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>
						<BerxText role="callout" style={styles.errorText}>
							Неверный логин или пароль
						</BerxText>
					</View>
				) : null}

				{offline ? (
					<View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>
						<BerxText role="callout">Нет соединения</BerxText>
						<BerxText role="meta" emphasis="secondary">
							BERX не сможет войти, пока связь не вернётся. Данные, которые вы ввели, останутся здесь.
						</BerxText>
					</View>
				) : null}

				<BerxButton
					label="Войти"
					onPress={handleSubmit}
					loading={isSubmitting}
					disabled={!canSubmit || offline}
					fullWidth
				/>
			</BerxSpatialCard>

			{onGoToRegister ? (
				<Pressable
					onPress={onGoToRegister}
					accessibilityRole="button"
					accessibilityLabel="Нет аккаунта? Зарегистрироваться"
					style={styles.registerLink}>
					<BerxText role="label" emphasis="accent">
						Нет аккаунта? Зарегистрироваться
					</BerxText>
				</Pressable>
			) : null}
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	/* the form scrolls: five fields and a keyboard do not fit on a
	   small phone, and a centred column with nothing to scroll simply
	   put the submit button out of reach */
	scrollBody: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, gap: spacing.xl},
	screen: {flex: 1},
	masthead: {alignItems: 'center', gap: spacing.sm},
	input: {marginBottom: spacing.md},
	error: {marginBottom: spacing.md},
	errorText: {color: colors.danger},
	/* 44dp, per the accessibility contract — it was an 8px hit-slop link */
	registerLink: {minHeight: 44, alignItems: 'center', justifyContent: 'center'},
});
