/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real, honest gap this closes: POST /auth/register existed since the
 * earliest API-foundation phase, with a matching client.register()
 * just added, but no screen ever called either — the auth flow only
 * ever had a way in for people who already had an account.
 *
 * MAX BUILD — real visual pass. The original version of this screen
 * was a bare stack of inputs with no hierarchy, no brand moment, and
 * no relationship to LoginScreen right next to it in the same flow —
 * a real quality gap, not a cosmetic one, since this is a new user's
 * first impression of the product. No logic changed: every validation
 * rule, every server error-code mapping, and the honest "check your
 * email" done-state text are the exact same ones that shipped before
 * this pass — only layout, grouping, and motion changed. Real
 * building blocks already in the design system, no new dependency:
 * BerxGlassSurface groups the fields into one real card instead of
 * loose stacked inputs; Berx3DTilt gives the wordmark genuine
 * touch-responsive depth (same native transform mechanism as
 * PlaceDetailScreen's hero); BerxFadeIn staggers a real entrance
 * instead of the whole screen appearing at once.
 */
import {useState} from 'react';
import {View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {BerxApiError} from '@berx/core';
import {colors, spacing, radius, typography, shadow} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

interface Props {
	api: BerxApiClient;
	onRegistered: () => void;
	onBack: () => void;
}

export default function RegisterScreen({api, onRegistered, onBack}: Props) {
	const [username, setUsername] = useState('');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [referralCode, setReferralCode] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState<string | null>(null);

	async function handleSubmit() {
		if (!username.trim() || !firstname.trim() || !lastname.trim() || !email.trim() || !password) {
			setError('Заполните все поля');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.register({
				username: username.trim(),
				firstname: firstname.trim(),
				lastname: lastname.trim(),
				email: email.trim(),
				password,
				...(referralCode.trim() ? {referralCode: referralCode.trim()} : {}),
			});
			// Honest, not a fake "logged in" state: the real API requires
			// email activation before login() will accept these
			// credentials — see auth.php's register action. Showing the
			// server's own message rather than inventing a friendlier one
			// that might not match what actually needs to happen next.
			setDone(res.message);
		} catch (e) {
			if (e instanceof BerxApiError) {
				if (e.code === 'username_taken') setError('Этот логин уже занят');
				else if (e.code === 'invalid_username') setError('Логин недопустим');
				else if (e.code === 'email_taken') setError('Этот email уже используется');
				else if (e.code === 'invalid_password') setError('Пароль слишком простой');
				else if (e.code === 'invalid_email') setError('Некорректный email');
				else setError('Не удалось зарегистрироваться');
			} else {
				setError('Не удалось подключиться');
			}
		} finally {
			setSubmitting(false);
		}
	}

	if (done) {
		return (
			<View style={styles.screen}>
				<BerxFadeIn style={styles.doneWrap}>
					<Text style={styles.doneGlyph}>✓</Text>
					<Text style={styles.title}>Почти готово</Text>
					<Text style={styles.doneText}>{done}</Text>
					<BerxButton label="К входу" onPress={onRegistered} fullWidth />
				</BerxFadeIn>
			</View>
		);
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
						<Text style={styles.cardTitle}>Создать аккаунт</Text>

						<View style={styles.row}>
							<BerxInput placeholder="Имя" value={firstname} onChangeText={setFirstname} style={styles.halfInput} />
							<BerxInput placeholder="Фамилия" value={lastname} onChangeText={setLastname} style={styles.halfInput} />
						</View>
						<BerxInput placeholder="Логин" autoCapitalize="none" value={username} onChangeText={setUsername} style={styles.input} />
						<BerxInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
						<BerxInput placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

						<Text style={styles.sectionLabel}>Есть код приглашения?</Text>
						<BerxInput placeholder="Необязательно" autoCapitalize="none" value={referralCode} onChangeText={setReferralCode} style={styles.input} />

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<BerxButton label="Зарегистрироваться" onPress={handleSubmit} loading={submitting} fullWidth />
					</BerxGlassSurface>
				</BerxFadeIn>

				<Pressable onPress={onBack} hitSlop={8} style={styles.backLink}>
					<Text style={styles.backLinkText}>← Назад</Text>
				</Pressable>
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
	cardTitle: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, color: colors.text, marginBottom: spacing.xs},
	row: {flexDirection: 'row', gap: spacing.sm},
	halfInput: {flex: 1},
	input: {},
	sectionLabel: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightMedium, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: spacing.xs},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center'},
	backLink: {alignSelf: 'center', paddingVertical: spacing.sm},
	backLinkText: {color: colors.textDim, fontSize: typography.sizeSm},
	doneWrap: {alignItems: 'center', padding: spacing.xl, gap: spacing.md},
	doneGlyph: {
		fontSize: 40,
		color: colors.accent,
		width: 72,
		height: 72,
		lineHeight: 72,
		textAlign: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.accentSoft,
		borderWidth: 1,
		borderColor: colors.accent,
		overflow: 'hidden',
		...shadow.glow,
	},
	title: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, color: colors.text, textAlign: 'center'},
	doneText: {color: colors.textDim, fontSize: typography.sizeBase, textAlign: 'center', lineHeight: typography.sizeBase * typography.lineHeightBase},
});
