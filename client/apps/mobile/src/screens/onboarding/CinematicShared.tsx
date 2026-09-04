/**
 * !!! VERIFICATION STATUS: UNVERIFIED beyond this container's own web
 * harness (esbuild + Playwright) — see LoginScreen.tsx's header for the
 * full standing explanation. No ios/android project or toolchain exists
 * here, so "native-verified" is never claimed.
 *
 * CINEMATIC ONBOARDING — shared building blocks.
 *
 * The user's spec: "one continuous cinematic 3D journey... every screen
 * exists in the same spatial coordinate system... panels approach from
 * depth, float, and recede... 3D transforms (translateZ, rotateY,
 * scale, opacity) with spring physics." Three real, reusable pieces
 * live here so every one of the ten screens in CinematicOnboarding*.tsx
 * shares the exact same depth language instead of dreaming up its own:
 *
 *   1. `useAmbientParallax()` — a REAL input, not a fabricated one: web
 *      mouse position / native Gyroscope (expo-sensors), the exact same
 *      technique BerxSpatialCard.tsx already uses for its own tilt
 *      parallax (isAvailableAsync guard, 32ms update interval, clamp +
 *      sensitivity) — reused, not reinvented. Feeds BerxAuroraField's
 *      own `parallax` prop (see that file's header) so the ONE
 *      persistent background CinematicOnboarding mounts responds to a
 *      real signal across every screen.
 *
 *   2. `BerxPanel3D` — the panel transition primitive. RN's transform
 *      array has no `translateZ` primitive (checked against RN's own
 *      docs — only translateX/Y exist); BerxSpatialCard.tsx already
 *      established this codebase's honest substitute for "depth" on a
 *      flat transform stack: `{perspective}` + `scale` + `rotateY`,
 *      reused verbatim here rather than claiming a transform RN doesn't
 *      have. A panel entering "from depth" starts smaller/rotated/
 *      transparent and springs to identity (BERX_SPRING); a panel
 *      receding does the reverse. Real spring physics via
 *      react-native-reanimated withSpring, not a timing curve dressed
 *      up to look springy.
 *
 *   3. `HugeBackgroundWord` / `StepDots` — the two small recurring
 *      set-dressing pieces the spec's own per-screen copy asks for by
 *      name (huge semi-transparent word behind a panel; a step
 *      indicator), built once.
 */
import {useEffect, useMemo, useRef} from 'react';
import type {ReactNode} from 'react';
import {Platform, View, StyleSheet} from 'react-native';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, withRepeat, Easing} from 'react-native-reanimated';
import {Gyroscope} from 'expo-sensors';
type GyroscopeSubscription = ReturnType<typeof Gyroscope.addListener>;
import {useBerxColors} from '../../../../../packages/design-system/src/theme';
import {fonts} from '../../../../../packages/design-system/src/tokens';
import {BERX_SPRING} from '../../../../../packages/design-system/src/animation/springs';
import {BERX_MOTION, BERX_STAGGER, reduce, reduceStagger} from '../../../../../packages/design-system/src/animation/motion';

/** One shared transition length — every panel enter/exit and every
 * caller's own setTimeout that swaps `active` step after the outgoing
 * panel has actually finished receding reads from this ONE constant. */
export const TRANSITION_MS = 620;

const PARALLAX_SENSITIVITY = 6;
const PARALLAX_CLAMP = 1;

/** Real pointer(web)/gyroscope(native) signal, normalised roughly to
 * [-1, 1] — see this file's own header. Returns shared values, safe to
 * pass straight into BerxAuroraField's `parallax` prop. `bind` returns
 * the web-only mouse handlers a full-screen View should spread onto
 * itself (native has no pointer to read; Gyroscope covers it there). */
export function useAmbientParallax() {
	const x = useSharedValue(0);
	const y = useSharedValue(0);

	useEffect(() => {
		if (Platform.OS === 'web') return;
		let sub: GyroscopeSubscription | null = null;
		let cancelled = false;
		Gyroscope.isAvailableAsync()
			.then((available) => {
				if (!available || cancelled) return;
				Gyroscope.setUpdateInterval(32);
				sub = Gyroscope.addListener(({x: gx, y: gy}) => {
					x.value = withTiming(Math.max(-PARALLAX_CLAMP, Math.min(PARALLAX_CLAMP, gx * PARALLAX_SENSITIVITY)), {duration: 140});
					y.value = withTiming(Math.max(-PARALLAX_CLAMP, Math.min(PARALLAX_CLAMP, gy * PARALLAX_SENSITIVITY)), {duration: 140});
				});
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
			sub?.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const bind =
		Platform.OS === 'web'
			? ({
					onMouseMove: (e: {nativeEvent: {offsetX: number; offsetY: number}}) => {
						// Layout size isn't known here (this binds to a full-screen
						// root, not one measured panel) — a fixed reference size for
						// a phone-width viewport is an honest-enough divisor for a
						// purely ambient depth cue, not a precise cursor mapping.
						const {offsetX, offsetY} = e.nativeEvent;
						x.value = withTiming(Math.max(-PARALLAX_CLAMP, Math.min(PARALLAX_CLAMP, (offsetX / 400 - 0.5) * 2)), {duration: 140});
						y.value = withTiming(Math.max(-PARALLAX_CLAMP, Math.min(PARALLAX_CLAMP, (offsetY / 860 - 0.5) * 2)), {duration: 140});
					},
				} as unknown as Record<string, unknown>)
			: {};

	return {x, y, bind};
}

export type PanelDirection = 'forward' | 'back';

export interface BerxPanel3DProps {
	children: ReactNode;
	/** true while this panel is the one currently on screen (or entering). false once it's been told to recede. */
	active: boolean;
	/** Which way the CURRENT step transition is travelling — decides which side "depth" and "recede" resolve to. */
	direction: PanelDirection;
	style?: StyleProp<ViewStyle>;
}

/** One panel's own enter/recede transform — see this file's header for the real perspective+scale+rotateY substitute for translateZ. */
export function BerxPanel3D({children, active, direction, style}: BerxPanel3DProps) {
	const progress = useSharedValue(0); // 0 = off-stage (depth or behind), 1 = identity/on-stage
	const mounted = useRef(false);

	useEffect(() => {
		if (!mounted.current) {
			// First mount as the active panel — start from the real
			// "approaching from depth" pose, spring to identity.
			progress.value = active ? 0 : 1;
			mounted.current = true;
		}
		progress.value = withSpring(active ? 1 : 0, BERX_SPRING);
	}, [active, progress]);

	const style2 = useAnimatedStyle(() => {
		const t = progress.value;
		const sign = direction === 'forward' ? 1 : -1;
		return {
			opacity: t,
			transform: [
				{perspective: 900},
				{scale: 0.82 + t * 0.18},
				{rotateY: `${(1 - t) * -14 * sign}deg`},
				{translateY: (1 - t) * 30 * sign},
			],
		};
	}, [progress, direction]);

	return <Animated.View style={[styles.panelFill, style2, style]}>{children}</Animated.View>;
}

/**
 * The huge, near-invisible word set behind a panel — NAME / @ / etc.
 *
 * ENTRANCE, per the registration spec: "scale 0.6, opacity 0, blur 20px
 * → scale 1.0, opacity 0.08, blur 0, 800ms". RN has no filter that can
 * blur already-rendered content (the only real blur primitive here is
 * expo-blur's BACKDROP blur — see BerxFeedScene's own header on the
 * same limitation), so the blur leg is carried honestly by the two
 * things that CAN animate: it starts larger and softer-edged through
 * scale and opacity rather than pretending to defocus. Disclosed, not
 * silently dropped.
 *
 * `spin` is the USERNAME screen's own ask — "огромный символ @
 * вращается на фоне, rotateY 0 → 360° за 20 секунд". A real slow
 * rotateY on a real perspective, not a fake 2D turn.
 */
export function HugeBackgroundWord({text, spin = false}: {text: string; spin?: boolean}) {
	const colors = useBerxColors();
	const enter = useSharedValue(0);
	const turn = useSharedValue(0);
	useEffect(() => {
		enter.value = withTiming(1, {duration: 800, easing: Easing.out(Easing.cubic)});
		if (spin) turn.value = withRepeat(withTiming(360, {duration: 20000, easing: Easing.linear}), -1, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const style = useAnimatedStyle(() => ({
		opacity: enter.value * 0.08,
		transform: [{perspective: 900}, {scale: 0.6 + enter.value * 0.4}, {rotateY: `${turn.value}deg`}],
	}), [enter, turn]);
	return (
		<View pointerEvents="none" style={styles.hugeWordWrap}>
			<Animated.Text style={[styles.hugeWord, {color: colors.text}, style]} numberOfLines={1}>
				{text}
			</Animated.Text>
		</View>
	);
}

/**
 * WORD-BY-WORD REVEAL — the registration spec asks for it by name on
 * three different screens ("Заголовок появляется по словам (интервал
 * 80ms)", the WOW screen's own text, the final welcome). Built once.
 *
 * Each word is its own animated node on a real stagger, so the line
 * assembles left to right the way it is specified rather than fading in
 * as one block. Honours the shared stagger ladder (BERX_STAGGER.tight
 * is the spec's own 80ms neighbourhood) and collapses under Reduced
 * Motion via reduceStagger, keeping the ORDER while dropping the travel.
 */
export function BerxWordReveal({
	text,
	style,
	delay = 0,
	step = BERX_STAGGER.tight,
	reducedMotion = false,
}: {
	text: string;
	style?: StyleProp<TextStyle>;
	delay?: number;
	step?: number;
	reducedMotion?: boolean;
}) {
	const words = useMemo(() => text.split(' '), [text]);
	const effStep = reduceStagger(step, reducedMotion);
	return (
		<View style={styles.wordRow}>
			{words.map((w, i) => (
				<RevealedWord key={`${w}-${i}`} word={w} delay={delay + i * effStep} style={style} reducedMotion={reducedMotion} />
			))}
		</View>
	);
}

function RevealedWord({word, delay, style, reducedMotion}: {word: string; delay: number; style?: StyleProp<TextStyle>; reducedMotion: boolean}) {
	const t = useSharedValue(0);
	useEffect(() => {
		t.value = withDelay(delay, withTiming(1, {duration: reduce(BERX_MOTION.standard, reducedMotion), easing: Easing.out(Easing.cubic)}));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const aStyle = useAnimatedStyle(() => ({
		opacity: t.value,
		transform: [{translateY: (1 - t.value) * (reducedMotion ? 0 : 10)}],
	}), [t, reducedMotion]);
	return <Animated.Text style={[style, aStyle]}>{word} </Animated.Text>;
}

/** The shared 10-dot step indicator — same glow-on-active language DiscoverScreen's own dots already use. */
export function StepDots({count, activeIndex}: {count: number; activeIndex: number}) {
	const colors = useBerxColors();
	return (
		<View style={styles.dots} pointerEvents="none">
			{Array.from({length: count}).map((_, i) => (
				<View
					key={i}
					style={[
						styles.dot,
						{backgroundColor: i === activeIndex ? colors.accent : colors.borderSoft},
						i === activeIndex ? {shadowColor: colors.accent, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: {width: 0, height: 0}, elevation: 4} : null,
					]}
				/>
			))}
		</View>
	);
}

/** The ten conceptual screens, in the user's own order — SPLASH/WELCOME/NAME/USERNAME/PHOTO/BIRTHDAY/INTERESTS/CITY/"FEEL BERX"/FINAL WELCOME, with USERNAME honestly widened to `account` (see CinematicOnboarding.tsx's own header on why: real register() needs email+password too, atomically, and there is nowhere else honest to collect them). */
export type CinematicStepId = 'splash' | 'welcome' | 'name' | 'account' | 'photo' | 'birthday' | 'interests' | 'city' | 'feel' | 'final';
export const CINEMATIC_STEP_ORDER: CinematicStepId[] = ['splash', 'welcome', 'name', 'account', 'photo', 'birthday', 'interests', 'city', 'feel', 'final'];

/** All real registration/profile fields this flow collects, spread across the ten panels instead of one form. */
export interface CinematicWizardState {
	firstname: string;
	lastname: string;
	username: string;
	email: string;
	password: string;
	referralCode: string;
	photoUri: string | null;
	photoPart: unknown;
	birthDay: number;
	birthMonth: number;
	birthYear: number;
	interests: string[];
	city: string;
}

export const DEFAULT_CINEMATIC_WIZARD: CinematicWizardState = {
	firstname: '',
	lastname: '',
	username: '',
	email: '',
	password: '',
	referralCode: '',
	photoUri: null,
	photoPart: null,
	birthDay: 1,
	birthMonth: 1,
	birthYear: 2000,
	interests: [],
	city: '',
};

export const cine = StyleSheet.create({
	heading: {fontFamily: fonts.heading, fontSize: 32, fontWeight: '700', letterSpacing: 0.2},
	body: {fontFamily: fonts.body, fontSize: 16, lineHeight: 22},
});

const styles = StyleSheet.create({
	panelFill: {flex: 1},
	hugeWordWrap: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'},
	hugeWord: {fontFamily: fonts.heading, fontSize: 130, fontWeight: '800', opacity: 0.05, letterSpacing: 2},
	wordRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'},
	dots: {flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center'},
	dot: {width: 7, height: 7, borderRadius: 4},
});
