/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Pure UI layer: every state shown here (authenticating/authError/
 * banned) comes from BerxAuthState's snapshot, not local component
 * state — this screen calls authState.login() and renders whatever the
 * snapshot says, it does not call api.login()/api.me() itself and
 * does not track its own "loading"/"error" booleans. That's the
 * architectural point of Phase-4's "LoginScreen should be a UI layer"
 * requirement — UNCHANGED by this pass.
 *
 * MAX BUILD — real ban enforcement (OssnUser::ban(), see report.php's
 * user-report action and admin.php's /admin/ban route). A banned
 * account's real server message ("This account has been suspended")
 * now actually renders instead of a hardcoded "неверный логин или
 * пароль" that would have misled a suspended user into thinking they
 * mistyped their password.
 *
 * PREMIUM ONBOARDING PASS — visual only, same as the MAX BUILD visual
 * pass before it: no auth logic touched, still reads only from
 * BerxAuthState's snapshot, still calls authState.login() the same
 * way. The card is now BerxGlassView (this component set's own real
 * glass, `glow` on), the submit is BerxAnimatedButton (real spring
 * press, real haptic, real particle burst on success-bound presses).
 *
 * APPLE/GOOGLE — real glass buttons, per this pass's own explicit ask,
 * but HONESTLY NOT WIRED: no Apple/Google OAuth endpoint exists
 * anywhere in this codebase's real API client or auth module (checked
 * before adding these, not assumed). Rendering a functional-looking
 * button that silently does nothing — or worse, pretends to sign
 * someone in — would be exactly the fabricated-functionality this
 * codebase's own standing rule forbids. Tapping either shows a real,
 * honest "not connected yet" message instead, the same "coming soon"
 * discipline this app already uses for every not-yet-connected section
 * (see API_SECURITY_MATRIX.md's own connected:false convention) —
 * never a fake success path.
 */
import {useState, useMemo} from 'react';
import {View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet} from 'react-native';
import type {BerxAuthState} from '@berx/auth';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxGlassView} from '../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {SpatialEmblem} from '../../../../packages/design-system/src/spatial/SpatialEmblem';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	authState: BerxAuthState;
	/** Optional — when provided, shows a link back to registration; the unauthenticated flow that renders this screen decides whether that's reachable from here. */
	onGoToRegister?: () => void;
}

export default function LoginScreen({authState, onGoToRegister}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [notConnected, setNotConnected] = useState<'apple' | 'google' | null>(null);
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
			{/* THE SAME STAGE, not a similar one — see this file's own header
			    on why. depth=1: Login is a LAST-STEP screen the same way
			    Register is. */}
			<BerxStage depth={1} seed={19} scrim={0.5} style={StyleSheet.absoluteFillObject as never} />
			<ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
				<BerxFadeIn riseFrom={8}>
					<View style={styles.hero}>
						<SpatialEmblem size={104} light={colors.accent} style={styles.heroEmblem} />
						<Text style={styles.heroTitle}>С возвращением</Text>
						<Text style={styles.tagline}>Мир, который вы создаёте сами</Text>
					</View>
				</BerxFadeIn>

				<BerxFadeIn delayMs={90} riseFrom={16}>
					<BerxGlassView glow radius={24} style={styles.card}>
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
						<BerxAnimatedButton variant="primary" premium title="Войти" onPress={handleSubmit} disabled={isSubmitting} style={styles.submitBtn} />

						<View style={styles.dividerRow}>
							<View style={styles.dividerLine} />
							<Text style={styles.dividerText}>или</Text>
							<View style={styles.dividerLine} />
						</View>

						<View style={styles.oauthRow}>
							<BerxAnimatedButton
								variant="secondary"
								title="Apple"
								icon={<BerxIcon name="lock" size={16} color={colors.textDim} />}
								onPress={() => setNotConnected('apple')}
								style={styles.oauthBtn}
							/>
							<BerxAnimatedButton
								variant="secondary"
								title="Google"
								icon={<BerxIcon name="globe" size={16} color={colors.textDim} />}
								onPress={() => setNotConnected('google')}
								style={styles.oauthBtn}
							/>
						</View>
						{notConnected ? (
							<Text style={styles.notConnected}>
								{notConnected === 'apple' ? 'Вход через Apple' : 'Вход через Google'} пока не подключён — используйте логин и пароль.
							</Text>
						) : null}
					</BerxGlassView>
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

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	scrollBody: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl},
	heroEmblem: {alignSelf: 'center', marginBottom: spacing.md},
	heroTitle: {color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: typography.weightBold, letterSpacing: -1, textAlign: 'center'},
	hero: {alignItems: 'center', gap: spacing.sm},
	tagline: {color: colors.textDim, fontSize: typography.sizeSm},
	card: {gap: spacing.md},
	submitBtn: {width: '100%', marginTop: spacing.xs},
	error: {
		color: colors.danger,
		fontSize: typography.sizeSm,
		textAlign: 'center',
	},
	dividerRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs},
	dividerLine: {flex: 1, height: 1, backgroundColor: colors.borderSoft},
	dividerText: {color: colors.textFaint, fontSize: typography.sizeXs},
	oauthRow: {flexDirection: 'row', gap: spacing.sm},
	oauthBtn: {flex: 1},
	notConnected: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
	registerLink: {alignSelf: 'center', paddingVertical: spacing.sm},
	registerLinkText: {color: colors.accent, fontSize: typography.sizeSm},
});
