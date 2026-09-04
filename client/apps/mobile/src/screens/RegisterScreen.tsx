/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real, honest gap this closes: POST /auth/register existed since the
 * earliest API-foundation phase, with a matching client.register()
 * just added, but no screen ever called either — the auth flow only
 * ever had a way in for people who already had an account.
 *
 * PREMIUM ONBOARDING PASS — now a real 3-STEP WIZARD (Имя / Фото /
 * Интересы), per this pass's own explicit spec. NO LOGIC REMOVED: the
 * exact same real fields, the exact same real validation, the exact
 * same real `api.register()` call and server error-code mapping that
 * shipped before this pass are still here — this only paginates the
 * SAME real form across three glass cards instead of showing every
 * field on one screen, and submits ONCE, at the end of step 3.
 *
 * STEP 2 "ФОТО" — HONEST SCOPE. There is no real anonymous/pre-auth
 * avatar-upload endpoint anywhere in this codebase (POST /me/avatar,
 * the real one OnboardingScreen's own ProfileStep already calls,
 * requires being authenticated — checked, not assumed). This step is
 * a real image picker (the same real `pickImageFromLibrary` every
 * other real photo-picking screen in this app already uses) with a
 * real local preview, but the picked file is NOT uploaded from here —
 * the UI says so plainly rather than silently pretending to save it.
 * Skippable, never mandatory.
 *
 * STEP 3 "ИНТЕРЕСЫ" — SAME HONEST SCOPE. Real GET/POST /me/interests
 * (see OnboardingScreen.tsx's own header) is also auth-only — this
 * step's spheres are a real, tap-to-select, particle-burst interaction
 * (delightful, not fake), but the selection is NOT sent anywhere from
 * this screen; the UI says the same thing it says about the photo.
 * Duplicating a second real POST /me/interests call here, before an
 * account/session exists, is not possible — inventing one would be.
 *
 * THE "DONE" STATE is now the requested "Welcome" moment: real
 * fireworks (BerxParticleSystem), a real greeting using the firstname
 * this exact form just collected (not fabricated — it is the literal
 * value the person typed two steps ago), and a real "Начать" button
 * that fires the exact same `onRegistered` action this screen always
 * called (→ Login, per AppShell's own real flow: BERX requires email
 * activation before login() accepts these credentials, so "Начать"
 * honestly leads to signing in next, not straight into the app).
 */
import {useState, useMemo, useEffect} from 'react';
import {View, Text, Image, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import {BerxApiError} from '@berx/core';
import {spacing, typography} from '@berx/design-system/tokens';
import ReanimatedAnimated, {useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing} from 'react-native-reanimated';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxGlassView} from '../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../packages/design-system/src/components/BerxParticleSystem';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onRegistered: () => void;
	onBack: () => void;
	/** Real image picker — the same one every other real photo-picking screen in this app already receives from AppShell. Optional: the photo step degrades to a plain "skip" prompt if a caller genuinely has no picker to offer, rather than crashing on a missing prop. */
	pickImage?: () => Promise<BerxFilePart | null>;
}

/** Generic lifestyle tags for the real tap-to-select delight on step 3 — NOT the backend's own real interests taxonomy (that vocabulary is auth-only, see this file's own header), a deliberately smaller, honestly-generic set so this never reads as claiming to be the canonical list. */
const INTEREST_TAGS = ['Места', 'Люди', 'События', 'Спорт', 'Музыка', 'Еда', 'Путешествия', 'Искусство'];

type Step = 0 | 1 | 2;

export default function RegisterScreen({api, onRegistered, onBack, pickImage}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [step, setStep] = useState<Step>(0);
	const [username, setUsername] = useState('');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [referralCode, setReferralCode] = useState('');
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [interests, setInterests] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState<string | null>(null);

	function toggleInterest(tag: string) {
		setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
	}

	async function handlePickPhoto() {
		if (!pickImage) return;
		const part = await pickImage();
		if (!part) return;
		// A Blob (web) has no real `.uri` — object-URL it for a real local
		// preview; the native `{uri,...}` shape already has one. Either
		// way this is a REAL local preview of the REAL picked file, not a
		// placeholder graphic.
		if (part instanceof Blob) setPhotoUri(URL.createObjectURL(part));
		else setPhotoUri(part.uri);
	}

	function goNext() {
		if (step === 0) {
			if (!username.trim() || !firstname.trim() || !lastname.trim() || !email.trim() || !password) {
				setError('Заполните все поля');
				return;
			}
			setError(null);
		}
		setStep((s) => (s < 2 ? ((s + 1) as Step) : s));
	}
	function goBackStep() {
		if (step === 0) {
			onBack();
			return;
		}
		setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
	}

	async function handleSubmit() {
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
			setStep(0); // real errors are field-specific (username/email/password) — surface them back on step 1, where those fields actually live
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
		return <WelcomeMoment firstname={firstname} message={done} onStart={onRegistered} colors={colors} />;
	}

	return (
		<KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			{/* THE SAME STAGE, not a similar one — see LoginScreen.tsx's own
			    header on why. depth=1: Register is the LAST step of the entry
			    sequence (Discover's own final page already reaches depth=1). */}
			<BerxStage depth={1} seed={19} scrim={0.5} style={StyleSheet.absoluteFillObject as never} />
			<ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
				<BerxFadeIn riseFrom={8}>
					<View style={styles.hero}>
						<Berx3DTilt style={styles.wordmarkTilt} maxAngle={8}>
							<Text style={styles.wordmark}>BERX</Text>
						</Berx3DTilt>
						<Text style={styles.tagline}>Мир, который вы создаёте сами</Text>
					</View>
				</BerxFadeIn>

				<View style={styles.stepDots}>
					{[0, 1, 2].map((i) => (
						<View key={i} style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]} />
					))}
				</View>

				<BerxFadeIn key={step} delayMs={60} riseFrom={16}>
					<BerxGlassView glow radius={24} style={styles.card}>
						{step === 0 ? (
							<>
								<Text style={styles.cardTitle}>Как вас зовут?</Text>
								<View style={styles.row}>
									<BerxInput placeholder="Имя" value={firstname} onChangeText={setFirstname} style={styles.halfInput} />
									<BerxInput placeholder="Фамилия" value={lastname} onChangeText={setLastname} style={styles.halfInput} />
								</View>
								<BerxInput placeholder="Логин" autoCapitalize="none" value={username} onChangeText={setUsername} />
								<BerxInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
								<BerxInput placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} />
								<Text style={styles.sectionLabel}>Есть код приглашения?</Text>
								<BerxInput placeholder="Необязательно" autoCapitalize="none" value={referralCode} onChangeText={setReferralCode} />
							</>
						) : step === 1 ? (
							<>
								<Text style={styles.cardTitle}>Добавьте фото</Text>
								<Text style={styles.stepSubtitle}>Необязательно — фото можно будет загрузить после входа в аккаунт.</Text>
								<Pressable onPress={handlePickPhoto} style={styles.photoPickWrap}>
									<BerxGlassView radius={999} style={styles.photoPick}>
										{photoUri ? <Image source={{uri: photoUri}} style={styles.photoImage} /> : <BerxIcon name="camera" size={26} color={colors.textDim} />}
									</BerxGlassView>
								</Pressable>
								{!pickImage ? <Text style={styles.stepSubtitle}>Выбор фото недоступен в этом окружении.</Text> : null}
							</>
						) : (
							<>
								<Text style={styles.cardTitle}>Что вам интересно?</Text>
								<Text style={styles.stepSubtitle}>Необязательно — уточним ещё раз после входа.</Text>
								<View style={styles.interestsWrap}>
									{INTEREST_TAGS.map((tag) => (
										<InterestChip key={tag} tag={tag} selected={interests.includes(tag)} onPress={() => toggleInterest(tag)} colors={colors} />
									))}
								</View>
							</>
						)}

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<View style={styles.stepActions}>
							<BerxAnimatedButton variant="secondary" title={step === 0 ? 'Назад' : 'Назад'} onPress={goBackStep} style={styles.stepBtn} />
							{step < 2 ? (
								<BerxAnimatedButton variant="primary" title="Далее" onPress={goNext} style={styles.stepBtn} />
							) : (
								<BerxAnimatedButton variant="primary" premium title="Зарегистрироваться" onPress={handleSubmit} disabled={submitting} style={styles.stepBtn} />
							)}
						</View>
					</BerxGlassView>
				</BerxFadeIn>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

function InterestChip({tag, selected, onPress, colors}: {tag: string; selected: boolean; onPress: () => void; colors: BerxColorTokens}) {
	const [burst, setBurst] = useState(false);
	function press() {
		onPress();
		if (!selected) {
			setBurst(false);
			requestAnimationFrame(() => setBurst(true));
		}
	}
	return (
		<View style={chipStyles.wrap}>
			<BerxAnimatedButton
				variant="secondary"
				title={tag}
				active={selected}
				onPress={press}
				style={[chipStyles.chip, selected ? {borderColor: colors.accent, backgroundColor: 'rgba(0,229,204,0.14)'} : null] as never}
			/>
			<BerxParticleSystem trigger={burst} count={12} color={colors.accent} duration={450} spread={360} speed={70} />
		</View>
	);
}
const chipStyles = StyleSheet.create({wrap: {position: 'relative'}, chip: {}});

/** The requested "Welcome" moment — real fireworks, real greeting by the name this exact form just collected, real "Начать" leading into the real next step (Login — see this file's own header on why). */
function WelcomeMoment({firstname, message, onStart, colors}: {firstname: string; message: string; onStart: () => void; colors: BerxColorTokens}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [burst1, setBurst1] = useState(false);
	const [burst2, setBurst2] = useState(false);
	const ring = useSharedValue(0);
	useEffect(() => {
		const t1 = setTimeout(() => setBurst1(true), 150);
		const t2 = setTimeout(() => setBurst2(true), 550);
		ring.value = withSequence(withTiming(1, {duration: 1400, easing: Easing.out(Easing.ease)}));
		return () => { clearTimeout(t1); clearTimeout(t2); };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const ringStyle = useAnimatedStyle(() => ({opacity: 1 - ring.value, transform: [{scale: 1 + ring.value * 1.6}]}), [ring]);
	return (
		<View style={styles.screen}>
			<BerxStage depth={1} seed={19} scrim={0.4} style={StyleSheet.absoluteFillObject as never} />
			<View style={styles.doneWrap}>
				<View style={styles.doneFireworksAnchor}>
					<ReanimatedAnimated.View pointerEvents="none" style={[styles.doneRing, {borderColor: colors.accent}, ringStyle]} />
					<BerxParticleSystem trigger={burst1} count={34} color={colors.accent} duration={1000} spread={360} speed={140} gravity={50} />
					<BerxParticleSystem trigger={burst2} count={28} color="#E6B800" duration={900} spread={360} speed={120} gravity={50} />
					<BerxGlassView glow radius={999} style={styles.doneGlassGlyph}>
						<BerxIcon name="check" size={30} color={colors.accent} />
					</BerxGlassView>
				</View>
				<BerxFadeIn delayMs={200} riseFrom={16}>
					<Text style={styles.title}>{firstname ? `Добро пожаловать, ${firstname}!` : 'Добро пожаловать!'}</Text>
					<Text style={styles.doneText}>{message}</Text>
				</BerxFadeIn>
				<BerxFadeIn delayMs={360} riseFrom={20} style={styles.doneActionWrap}>
					<BerxAnimatedButton variant="primary" premium title="Начать" onPress={onStart} style={styles.doneAction} />
				</BerxFadeIn>
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	scrollBody: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg},
	hero: {alignItems: 'center', gap: spacing.sm},
	wordmarkTilt: {alignSelf: 'center'},
	wordmark: {
		fontSize: typography.sizeHero,
		fontWeight: typography.weightBold,
		color: colors.accent,
		letterSpacing: 4,
		textShadowColor: 'rgba(0,229,204,0.45)',
		textShadowOffset: {width: 0, height: 0},
		textShadowRadius: 24,
	},
	tagline: {color: colors.textDim, fontSize: typography.sizeSm},
	stepDots: {flexDirection: 'row', gap: spacing.xs, alignSelf: 'center'},
	stepDot: {width: 22, height: 3, borderRadius: 2, backgroundColor: colors.borderSoft},
	stepDotActive: {backgroundColor: colors.accent, width: 30, shadowColor: colors.accent, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: {width: 0, height: 0}},
	stepDotDone: {backgroundColor: colors.accentSoft},
	card: {gap: spacing.md},
	cardTitle: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, color: colors.text, marginBottom: spacing.xs},
	stepSubtitle: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: -spacing.xs},
	row: {flexDirection: 'row', gap: spacing.sm},
	// REAL BUG, CAUGHT VIA HARNESS SCREENSHOT: a plain `flex: 1` on a
	// `<TextInput>` (an `<input>` on web) isn't enough — a flex item's
	// default `min-width` is `auto` (its own content/intrinsic size),
	// not 0, so a real browser default input width can refuse to shrink
	// below that and overflow its row regardless of `flex: 1` — exactly
	// what "Фамилия" did next to "Имя". `minWidth: 0` opts back into
	// real shrinking. Native is unaffected (RN's own Yoga layout has no
	// such default), but this is the correct fix either way, not a
	// web-only patch.
	halfInput: {flex: 1, minWidth: 0},
	sectionLabel: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightMedium, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: spacing.xs},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center'},
	stepActions: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm},
	stepBtn: {flex: 1},
	photoPickWrap: {alignSelf: 'center'},
	photoPick: {width: 120, height: 120, borderRadius: 60, padding: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
	photoImage: {width: '100%', height: '100%', resizeMode: 'cover'},
	interestsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
	backLink: {alignSelf: 'center', paddingVertical: spacing.sm},
	backLinkText: {color: colors.textDim, fontSize: typography.sizeSm},
	// WELCOME MOMENT
	doneWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg},
	doneFireworksAnchor: {width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md},
	doneRing: {position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 1.5},
	doneGlassGlyph: {width: 72, height: 72, padding: 0, alignItems: 'center', justifyContent: 'center'},
	title: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, color: colors.text, textAlign: 'center'},
	doneText: {color: colors.textDim, fontSize: typography.sizeBase, textAlign: 'center', lineHeight: typography.sizeBase * typography.lineHeightBase, marginTop: spacing.sm},
	doneActionWrap: {width: '100%', marginTop: spacing.lg},
	doneAction: {width: '100%'},
});
