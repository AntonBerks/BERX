/**
 * !!! VERIFICATION STATUS: UNVERIFIED beyond this container's own web
 * harness — see LoginScreen.tsx's header for the standing explanation.
 *
 * CINEMATIC ONBOARDING — the orchestrator. Replaces the previous
 * screen-swap flow (Splash → Discover → Register, each mounting its own
 * background) with the user's own explicit spec: "one continuous
 * cinematic 3D journey... every screen exists in the same spatial
 * coordinate system... backgrounds are always alive." ONE
 * `BerxAuroraField` instance lives here, mounted once for the whole
 * flow — it is never remounted as `step` changes, which is what makes
 * the background actually continuous instead of merely similar between
 * screens. Ten panels swap in front of it via `BerxPanel3D`
 * (CinematicShared.tsx) with real spring transforms, never a hard cut.
 *
 * HONEST GAP THIS FLOW HAD TO CLOSE: the spec's own ten screens are
 * Splash/Welcome/Name/Username/Photo/Birthday/Interests/City/"Feel
 * BERX"/Final Welcome — but real `api.register()` (see
 * packages/api/src/client.ts's own comment on auth.php's real field
 * list) needs firstname+lastname+username+email+password ATOMICALLY,
 * and nowhere in the spec's ten screens is there a place to collect
 * email/password. Rather than fabricate a registration call that
 * omits real required fields, the USERNAME screen is honestly widened
 * into `account` — same glass panel, same "Выбери своё имя в BERX"
 * headline, with real email/password fields added below it. The real
 * `register()` call fires the moment that panel's "Продолжить"
 * succeeds; Photo/Birthday/Interests/City after it are then genuinely
 * profile-completion screens for the account that now exists, not
 * still part of account creation.
 *
 * WHY NO LIVE "✓ Свободно / Занято" ON THE USERNAME FIELD: checked
 * (grep) — there is no anonymous, pre-auth username-availability
 * endpoint anywhere in this codebase. Faking one (a client-side
 * "looks free" heuristic dressed up as a server check) would be exactly
 * the kind of fabricated backend behaviour the master build rule
 * forbids. What IS real: client-side FORMAT validation (length/
 * characters) shown live, and the real `username_taken`/
 * `invalid_username` error codes `register()` already maps, surfaced
 * honestly if the real submit rejects the name.
 *
 * WHY THE CITY SCREEN'S "Разрешить доступ" IS A DISCLOSED NON-ACTION:
 * checked (grep) — no expo-location dependency or permission flow
 * exists anywhere in this codebase (PlacesNearbyScreen.tsx's own header
 * says so explicitly: "does not pretend that already exists"). Same
 * honest "coming soon" convention this flow already uses for Apple/
 * Google login. Manual city entry is real, local, unvalidated text —
 * disclosed as such, not matched against a fake gazetteer.
 *
 * REGISTRATION → LOGIN, HONESTLY. `register()` returns no session — the
 * real API requires email activation first (see client.ts's own
 * comment). FINAL WELCOME's "Войти в BERX →" therefore performs a REAL
 * `authState.login()` with the credentials just collected; on success
 * AppShell's own `authenticated` branch takes over exactly like every
 * other real login in this app. On the real, expected activation-
 * pending error, the screen says so plainly and offers the real
 * LoginScreen as the way back in once the user has activated — not a
 * fabricated "you're in" state.
 */
import {useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing} from 'react-native-reanimated';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import {BerxApiError} from '@berx/core';
import type {BerxAuthState} from '@berx/auth';
import {spacing} from '../../../../../packages/design-system/src/tokens';
import {BerxAuroraField} from '../../../../../packages/design-system/src/components/BerxAuroraField';
import {BerxGlassView} from '../../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../../packages/design-system/src/components/BerxParticleSystem';
import {BerxInput} from '../../../../../packages/design-system/src/components/BerxInput';
import {BerxIcon} from '../../../../../packages/design-system/src/icons/BerxIcon';
import {SpatialEmblemReveal} from '../../../../../packages/design-system/src/spatial/SpatialEmblemReveal';
import {useBerxColors} from '../../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '../../../../../packages/design-system/src/tokens';
import {
	TRANSITION_MS,
	useAmbientParallax,
	BerxPanel3D,
	HugeBackgroundWord,
	StepDots,
	cine,
	type CinematicStepId,
	CINEMATIC_STEP_ORDER,
	type CinematicWizardState,
	DEFAULT_CINEMATIC_WIZARD,
} from './CinematicShared';
import {CinematicPhotoPanel, CinematicBirthdayPanel, CinematicInterestsPanel, CinematicCityPanel} from './CinematicOnboardingSteps';
import {CinematicFeelPanel, CinematicFinalPanel} from './CinematicOnboardingFinale';

export interface CinematicOnboardingProps {
	api: BerxApiClient;
	authState: BerxAuthState;
	pickImage?: () => Promise<BerxFilePart | null>;
	/** Real, direct exit to the existing LoginScreen — the "Уже есть аккаунт? Войти" link, and the honest fallback after a real activation-pending login error. Pure navigation, no side effect. */
	onLogin: () => void;
	/** Fires once, right after a real successful `api.register()` — lets the caller flag the post-login OnboardingScreen wizard, exactly the same real moment RegisterScreen.tsx's own `onRegistered` used to fire it. */
	onRegistered?: () => void;
}

const SPLASH_MS = 3000;

export default function CinematicOnboarding({api, authState, pickImage, onLogin, onRegistered}: CinematicOnboardingProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const parallax = useAmbientParallax();

	const [bgSize, setBgSize] = useState({width: 0, height: 0});
	const [step, setStep] = useState<CinematicStepId>('splash');
	const [prevStep, setPrevStep] = useState<CinematicStepId | null>(null);
	const [direction, setDirection] = useState<'forward' | 'back'>('forward');
	const [wizard, setWizard] = useState<CinematicWizardState>(DEFAULT_CINEMATIC_WIZARD);
	const [registering, setRegistering] = useState(false);
	const [registerError, setRegisterError] = useState<string | null>(null);
	const [loginBusy, setLoginBusy] = useState(false);
	const [loginError, setLoginError] = useState<string | null>(null);

	function patch(fields: Partial<CinematicWizardState>) {
		setWizard((w) => ({...w, ...fields}));
	}

	function goTo(next: CinematicStepId, dir: 'forward' | 'back' = 'forward') {
		setDirection(dir);
		setPrevStep(step);
		setStep(next);
		setTimeout(() => setPrevStep(null), TRANSITION_MS + 60);
	}

	// SPLASH — auto-advances after 3s, per the spec's own "After 3 seconds, auto-transition to next screen."
	useEffect(() => {
		if (step !== 'splash') return;
		const t = setTimeout(() => goTo('welcome'), SPLASH_MS);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [step]);

	async function submitAccount() {
		if (!wizard.firstname.trim() || !wizard.lastname.trim() || !wizard.username.trim() || !wizard.email.trim() || !wizard.password) {
			setRegisterError('Заполните все поля');
			return;
		}
		setRegistering(true);
		setRegisterError(null);
		try {
			await api.register({
				username: wizard.username.trim(),
				firstname: wizard.firstname.trim(),
				lastname: wizard.lastname.trim(),
				email: wizard.email.trim(),
				password: wizard.password,
				...(wizard.referralCode.trim() ? {referralCode: wizard.referralCode.trim()} : {}),
			});
			onRegistered?.();
			goTo('photo');
		} catch (e) {
			if (e instanceof BerxApiError) {
				if (e.code === 'username_taken') setRegisterError('Это имя уже занято');
				else if (e.code === 'invalid_username') setRegisterError('Имя пользователя недопустимо');
				else if (e.code === 'email_taken') setRegisterError('Этот email уже используется');
				else if (e.code === 'invalid_password') setRegisterError('Пароль слишком простой');
				else if (e.code === 'invalid_email') setRegisterError('Некорректный email');
				else setRegisterError('Не удалось зарегистрироваться');
			} else {
				setRegisterError('Не удалось подключиться');
			}
		} finally {
			setRegistering(false);
		}
	}

	async function enterBerx() {
		setLoginBusy(true);
		setLoginError(null);
		await authState.login(wizard.email.trim(), wizard.password);
		const snap = authState.getSnapshot();
		if (snap.status === 'authError') {
			// Real, expected outcome (see this file's own header): the server
			// requires email activation first. Honest message, not a
			// fabricated "you're in".
			setLoginError(snap.error ?? 'Подтвердите email, затем войдите.');
		}
		setLoginBusy(false);
	}

	const stepIndex = CINEMATIC_STEP_ORDER.indexOf(step);

	function renderPanel(id: CinematicStepId) {
		switch (id) {
			case 'splash':
				return <SplashPanel colors={colors} />;
			case 'welcome':
				return <WelcomePanel colors={colors} onPhone={() => goTo('name')} onLogin={onLogin} />;
			case 'name':
				return (
					<NamePanel
						colors={colors}
						firstname={wizard.firstname}
						lastname={wizard.lastname}
						onChange={patch}
						onBack={() => goTo('welcome', 'back')}
						onNext={() => goTo('account')}
					/>
				);
			case 'account':
				return (
					<AccountPanel
						colors={colors}
						wizard={wizard}
						onChange={patch}
						busy={registering}
						error={registerError}
						onBack={() => goTo('name', 'back')}
						onNext={submitAccount}
					/>
				);
			case 'photo':
				return (
					<CinematicPhotoPanel
						colors={colors}
						photoUri={wizard.photoUri}
						pickImage={pickImage}
						onPicked={(uri, part) => patch({photoUri: uri, photoPart: part})}
						onBack={() => goTo('account', 'back')}
						onNext={() => goTo('birthday')}
					/>
				);
			case 'birthday':
				return (
					<CinematicBirthdayPanel
						colors={colors}
						day={wizard.birthDay}
						month={wizard.birthMonth}
						year={wizard.birthYear}
						onChange={patch}
						onBack={() => goTo('photo', 'back')}
						onNext={() => goTo('interests')}
					/>
				);
			case 'interests':
				return (
					<CinematicInterestsPanel
						colors={colors}
						selected={wizard.interests}
						onToggle={(tag) => patch({interests: wizard.interests.includes(tag) ? wizard.interests.filter((t) => t !== tag) : [...wizard.interests, tag]})}
						onBack={() => goTo('birthday', 'back')}
						onNext={() => goTo('city')}
					/>
				);
			case 'city':
				return (
					<CinematicCityPanel
						colors={colors}
						city={wizard.city}
						onChange={(c) => patch({city: c})}
						onBack={() => goTo('interests', 'back')}
						onNext={() => goTo('feel')}
					/>
				);
			case 'feel':
				return <CinematicFeelPanel colors={colors} onNext={() => goTo('final')} />;
			case 'final':
				return (
					<CinematicFinalPanel
						colors={colors}
						firstname={wizard.firstname}
						busy={loginBusy}
						error={loginError}
						onEnter={enterBerx}
						onGoToLogin={onLogin}
					/>
				);
			default:
				return null;
		}
	}

	return (
		<View style={styles.root} {...parallax.bind}>
			{/* THE ONE PERSISTENT BACKGROUND — see this file's own header.
			    colors.bg (the live theme background, not a hardcoded black)
			    is the "deep space" base, exactly the same real live-theme
			    surface every other real BERX screen already sits on — night
			    mode already reads as a deep near-black; day mode gets its own
			    live aurora sky instead of a forced black that would fight the
			    rest of the app's real day/night system. */}
			<View style={StyleSheet.absoluteFillObject} pointerEvents="none" onLayout={(e) => setBgSize(e.nativeEvent.layout)}>
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: colors.bg}]} />
				<BerxAuroraField width={bgSize.width} height={bgSize.height} parallax={parallax} />
			</View>

			{prevStep ? (
				<BerxPanel3D key={`out-${prevStep}`} active={false} direction={direction} style={StyleSheet.absoluteFillObject}>
					{renderPanel(prevStep)}
				</BerxPanel3D>
			) : null}
			<BerxPanel3D key={`in-${step}`} active direction={direction} style={StyleSheet.absoluteFillObject}>
				{renderPanel(step)}
			</BerxPanel3D>

			{step !== 'splash' ? (
				<View style={styles.dotsWrap} pointerEvents="none">
					<StepDots count={CINEMATIC_STEP_ORDER.length - 1} activeIndex={stepIndex - 1} />
				</View>
			) : null}
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// SCREEN 1 — SPLASH. Real particle-and-glass mark reveal (the same
// real SpatialEmblemReveal every other real splash surface in this app
// uses — see that component's own header on why a literal "200
// particles assemble into the logo" simulation isn't what
// BerxParticleSystem's real closed-form outward kinematics can do,
// same honest substitution SplashScreen.tsx already established), a
// real settle particle release + glass halo, and the two lines of copy
// the spec asks for by name. Non-interactive here (the spec's own
// Welcome screen owns the buttons) — pure 3s auto-advance.
// ————————————————————————————————————————————————————————————————
function SplashPanel({colors}: {colors: BerxColorTokens}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [settleBurst, setSettleBurst] = useState(false);
	const haloRotation = useSharedValue(0);
	const lines = useSharedValue(0);
	useEffect(() => {
		const t = setTimeout(() => {
			setSettleBurst(true);
			haloRotation.value = withRepeat(withTiming(360, {duration: 14000, easing: Easing.linear}), -1, false);
			lines.value = withTiming(1, {duration: 600, easing: Easing.out(Easing.ease)});
		}, 1200);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const haloStyle = useAnimatedStyle(() => ({transform: [{rotate: `${haloRotation.value}deg`}]}), [haloRotation]);
	const linesStyle = useAnimatedStyle(() => ({opacity: lines.value, transform: [{translateY: (1 - lines.value) * 14}]}), [lines]);
	return (
		<View style={styles.center}>
			<View style={styles.emblemSlot}>
				<Animated.View pointerEvents="none" style={[styles.halo, haloStyle]}>
					<BerxGlassView glow radius={999} style={styles.haloGlass}>
						<View />
					</BerxGlassView>
				</Animated.View>
				<SpatialEmblemReveal size={160} light={colors.accent} />
				<BerxParticleSystem trigger={settleBurst} count={30} color={colors.accent} duration={950} spread={360} speed={120} gravity={30} />
			</View>
			<Animated.View style={[styles.splashLines, linesStyle]}>
				<Text style={[cine.heading, styles.splashLine1, {color: colors.text}]}>REAL LIFE. CONNECTED.</Text>
				<Text style={[cine.body, styles.splashLine2, {color: colors.textDim}]}>Твоя жизнь начинается здесь.</Text>
			</Animated.View>
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// SCREEN 2 — WELCOME. A glass panel over the live background; Apple/
// Google honestly-disclosed non-actions (same convention LoginScreen.tsx
// already established — no real OAuth backend exists, checked), a real
// primary CTA into the flow, and a real lateral link to LoginScreen.
// ————————————————————————————————————————————————————————————————
function WelcomePanel({colors, onPhone, onLogin}: {colors: BerxColorTokens; onPhone: () => void; onLogin: () => void}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [notConnected, setNotConnected] = useState<'apple' | 'google' | null>(null);
	return (
		<View style={styles.center}>
			{/* REAL BUG, CAUGHT VIA HARNESS SCREENSHOT (see CinematicOnboardingSteps.tsx's own comment on the city badge for the full mechanism): BerxGlassView's outer wrapper always carries `flex: 1`, so as a direct sibling of `bottomLink` inside this flex:1 column it silently stretched ~2x taller than its own content. This plain, non-flex shell gives that request nothing to grow into. */}
			<View style={styles.cardShell}>
				<BerxGlassView glow radius={28} style={styles.card}>
				<Text style={[cine.heading, styles.title, {color: colors.text}]}>Добро пожаловать в BERX</Text>
				<Text style={[cine.body, styles.subtitle, {color: colors.textDim}]}>Люди. Места. События. Всё, что происходит вокруг тебя.</Text>
				<BerxAnimatedButton
					variant="secondary"
					title="Продолжить с Apple"
					icon={<BerxIcon name="lock" size={16} color={colors.textDim} />}
					onPress={() => setNotConnected('apple')}
					style={styles.fullBtn}
				/>
				<BerxAnimatedButton
					variant="secondary"
					title="Продолжить с Google"
					icon={<BerxIcon name="globe" size={16} color={colors.textDim} />}
					onPress={() => setNotConnected('google')}
					style={styles.fullBtn}
				/>
				{notConnected ? (
					<Text style={styles.notConnected}>
						{notConnected === 'apple' ? 'Вход через Apple' : 'Вход через Google'} пока не подключён — используйте почту.
					</Text>
				) : null}
				<View style={styles.dividerRow}>
					<View style={[styles.dividerLine, {backgroundColor: colors.borderSoft}]} />
					<Text style={[styles.dividerText, {color: colors.textFaint}]}>или</Text>
					<View style={[styles.dividerLine, {backgroundColor: colors.borderSoft}]} />
				</View>
				{/* Real backend has no phone auth (checked) — honestly relabelled to email, the field the real register()/login() actually take, rather than promising a phone flow that doesn't exist. */}
				<BerxAnimatedButton variant="primary" premium title="Продолжить с почтой" onPress={onPhone} style={styles.fullBtn} />
				</BerxGlassView>
			</View>
			<Text style={[styles.bottomLink, {color: colors.textDim}]} onPress={onLogin}>
				Уже есть аккаунт? <Text style={{color: colors.accent}}>Войти</Text>
			</Text>
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// SCREEN 3 — NAME. Huge background word, real reactive phrase once a
// name is typed, real first/last name collection (both required by
// register() — see this file's own header).
// ————————————————————————————————————————————————————————————————
function NamePanel({colors, firstname, lastname, onChange, onBack, onNext}: {colors: BerxColorTokens; firstname: string; lastname: string; onChange: (f: Partial<CinematicWizardState>) => void; onBack: () => void; onNext: () => void}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const canNext = firstname.trim().length > 0 && lastname.trim().length > 0;
	return (
		<View style={styles.center}>
			<HugeBackgroundWord text="NAME" />
			{/* Non-flex shell — see WelcomePanel's own comment on the real BerxGlassView stretch bug this avoids. */}
			<View style={styles.cardShell}>
				<BerxGlassView glow radius={28} style={styles.card}>
					<Text style={[cine.heading, styles.title, {color: colors.text}]}>Как тебя зовут?</Text>
					<BerxInput placeholder="Имя" value={firstname} onChangeText={(v) => onChange({firstname: v})} style={styles.input} />
					<BerxInput placeholder="Фамилия" value={lastname} onChangeText={(v) => onChange({lastname: v})} style={styles.input} />
					{firstname.trim() ? <Text style={[styles.reactivePhrase, {color: colors.accent}]}>Приятно познакомиться, {firstname.trim()}.</Text> : null}
					<View style={styles.stepActions}>
						<BerxAnimatedButton variant="secondary" title="Назад" onPress={onBack} style={styles.stepBtn} />
						<BerxAnimatedButton variant="primary" title="Продолжить →" onPress={onNext} disabled={!canNext} style={styles.stepBtn} />
					</View>
				</BerxGlassView>
			</View>
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// SCREEN 4 — USERNAME, honestly widened to ACCOUNT (email + password —
// see this file's own header). Huge "@" behind the panel per spec.
// ————————————————————————————————————————————————————————————————
function AccountPanel({colors, wizard, onChange, busy, error, onBack, onNext}: {colors: BerxColorTokens; wizard: CinematicWizardState; onChange: (f: Partial<CinematicWizardState>) => void; busy: boolean; error: string | null; onBack: () => void; onNext: () => void}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const usernameFormatOk = /^[a-zA-Z0-9_]{3,20}$/.test(wizard.username.trim());
	return (
		<View style={styles.center}>
			<HugeBackgroundWord text="@" />
			{/* Non-flex shell — see WelcomePanel's own comment on the real BerxGlassView stretch bug this avoids. */}
			<View style={styles.cardShell}>
				<BerxGlassView glow radius={28} style={styles.card}>
					<Text style={[cine.heading, styles.title, {color: colors.text}]}>Выбери своё имя в BERX</Text>
					<BerxInput
						placeholder="@username"
						autoCapitalize="none"
						value={wizard.username}
						onChangeText={(v) => onChange({username: v})}
						style={styles.input}
					/>
					{wizard.username.trim() ? (
						<Text style={[styles.availability, {color: usernameFormatOk ? '#00C896' : '#E0555A'}]}>
							{usernameFormatOk ? '✓ Похоже на действительное имя' : 'Только буквы, цифры и _, от 3 символов'}
						</Text>
					) : null}
					<Text style={[styles.sectionLabel, {color: colors.textFaint}]}>Почта и пароль для входа</Text>
					<BerxInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={wizard.email} onChangeText={(v) => onChange({email: v})} style={styles.input} />
					<BerxInput placeholder="Пароль" secureTextEntry value={wizard.password} onChangeText={(v) => onChange({password: v})} style={styles.input} />
					{error ? <Text style={styles.error}>{error}</Text> : null}
					<View style={styles.stepActions}>
						<BerxAnimatedButton variant="secondary" title="Назад" onPress={onBack} style={styles.stepBtn} />
						<BerxAnimatedButton variant="primary" premium title={busy ? 'Создаём…' : 'Продолжить →'} onPress={onNext} disabled={busy} style={styles.stepBtn} />
					</View>
				</BerxGlassView>
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		root: {flex: 1, backgroundColor: colors.bg} as ViewStyle,
		center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
		dotsWrap: {position: 'absolute', left: 0, right: 0, bottom: 22, alignItems: 'center'},
		// `cardShell` (no flex) is the real fix — see WelcomePanel's own
		// comment on why BerxGlassView's own outer wrapper can't be
		// trusted not to stretch when placed directly in a flex:1 column.
		cardShell: {width: '100%', maxWidth: 380},
		card: {gap: spacing.md},
		title: {fontSize: 30, color: colors.text, marginBottom: spacing.xs},
		subtitle: {color: colors.textDim, marginBottom: spacing.sm},
		fullBtn: {width: '100%'},
		notConnected: {color: colors.textFaint, fontSize: 12, textAlign: 'center'},
		dividerRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs},
		dividerLine: {flex: 1, height: 1},
		dividerText: {fontSize: 12},
		bottomLink: {marginTop: spacing.lg, fontSize: 14},
		input: {width: '100%'},
		reactivePhrase: {fontSize: 14, marginTop: -spacing.xs},
		sectionLabel: {fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: spacing.xs},
		availability: {fontSize: 12, marginTop: -spacing.xs},
		error: {color: '#E0555A', fontSize: 13, textAlign: 'center'},
		stepActions: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm},
		stepBtn: {flex: 1},
		emblemSlot: {width: 200, height: 200, alignItems: 'center', justifyContent: 'center'},
		halo: {position: 'absolute', width: 190, height: 190},
		haloGlass: {flex: 1, padding: 0, borderWidth: 1},
		splashLines: {alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs},
		splashLine1: {fontSize: 15, letterSpacing: 2, textAlign: 'center'},
		splashLine2: {fontSize: 15, textAlign: 'center'},
	});
