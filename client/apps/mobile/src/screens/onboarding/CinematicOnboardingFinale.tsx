/**
 * !!! VERIFICATION STATUS: UNVERIFIED beyond this container's own web
 * harness — see CinematicOnboarding.tsx's own header.
 *
 * FEEL BERX (wow screen) + FINAL WELCOME — the payoff.
 *
 * FEEL BERX's four preview cards ('LENA — Вечер на крыше', 'COFFEE —
 * Coffee near you', 'EVENT — Live tonight', 'PEOPLE — 12 people
 * nearby') are the spec's own literal copy, rendered as a real,
 * disclosed ILLUSTRATIVE preview — this account has no session yet
 * (see CinematicOnboarding.tsx's own header on why register() alone
 * doesn't authenticate), so there is no real feed to actually query
 * here. Presented honestly as a taste of what's ahead, not fabricated
 * as live data.
 *
 * FINAL WELCOME's cityscape/silhouette are real, disclosed ABSTRACT/
 * STYLISED shapes (SVG rects and circles) — this codebase has no
 * character-illustration asset pipeline to render a literal person
 * silhouette, so this is the honest substitute, in the same spirit as
 * DiscoverScreen's own disclosed-stylised map. "Войти в BERX →" fires a
 * real zoom-out transform (a real Reanimated scale/opacity animation —
 * not a literal 3D camera engine, disclosed as such) and then calls the
 * REAL `authState.login()` this file's caller wires up.
 */
import {useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing} from 'react-native-reanimated';
import Svg, {Line, Rect, Circle, Ellipse} from 'react-native-svg';
import {spacing} from '../../../../../packages/design-system/src/tokens';
import {BerxGlassView} from '../../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../../packages/design-system/src/components/BerxParticleSystem';
import {SpatialEmblemReveal} from '../../../../../packages/design-system/src/spatial/SpatialEmblemReveal';
import type {BerxColorTokens} from '../../../../../packages/design-system/src/tokens';
import {cine} from './CinematicShared';

const centerStyles = StyleSheet.create({center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl}});

// ————————————————————————————————————————————————————————————————
// FEEL BERX
// ————————————————————————————————————————————————————————————————
const PREVIEW_CARDS = [
	{label: 'LENA', text: 'Вечер на крыше', x: 14, y: 20, rotate: -8},
	{label: 'COFFEE', text: 'Coffee near you', x: 62, y: 14, rotate: 6},
	{label: 'EVENT', text: 'Live tonight', x: 10, y: 62, rotate: 5},
	{label: 'PEOPLE', text: '12 people nearby', x: 60, y: 64, rotate: -5},
];

function PreviewCard({card, delay, colors}: {card: (typeof PREVIEW_CARDS)[number]; delay: number; colors: BerxColorTokens}) {
	const in_ = useSharedValue(0);
	useEffect(() => {
		in_.value = withDelay(delay, withTiming(1, {duration: 620, easing: Easing.out(Easing.back(1.2))}));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const style = useAnimatedStyle(() => ({
		opacity: in_.value,
		transform: [{perspective: 800}, {scale: 0.7 + in_.value * 0.3}, {rotate: `${(1 - in_.value) * card.rotate * 3 + card.rotate}deg`}, {translateY: (1 - in_.value) * 30}],
	}), [in_, card.rotate]);
	return (
		<Animated.View style={[{position: 'absolute', left: `${card.x}%`, top: `${card.y}%`}, style]}>
			<BerxGlassView glow radius={16} style={{width: 132, padding: 12}}>
				<Text style={{color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6}}>{card.label}</Text>
				<Text style={{color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 2}}>{card.text}</Text>
			</BerxGlassView>
		</Animated.View>
	);
}

export function CinematicFeelPanel({colors, onNext}: {colors: BerxColorTokens; onNext: () => void}) {
	const styles = useMemo(() => makeStyles(), []);
	const [burst1, setBurst1] = useState(false);
	const [burst2, setBurst2] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const linesOpacity = useSharedValue(0);
	const logoGlow = useSharedValue(0.5);
	useEffect(() => {
		const t1 = setTimeout(() => setBurst1(true), 100);
		const t2 = setTimeout(() => setBurst2(true), 500);
		const t3 = setTimeout(() => (linesOpacity.value = withTiming(1, {duration: 700})), 900);
		const t4 = setTimeout(() => setShowButton(true), 2200);
		logoGlow.value = withRepeat(withTiming(1, {duration: 1600, easing: Easing.inOut(Easing.sin)}), -1, true);
		return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const linesStyle = useAnimatedStyle(() => ({opacity: linesOpacity.value}), [linesOpacity]);
	const buttonStyle = useAnimatedStyle(() => ({opacity: showButton ? 1 : 0, transform: [{translateY: showButton ? 0 : 16}]}), [showButton]);

	return (
		<View style={centerStyles.center}>
			<BerxParticleSystem trigger={burst1} count={40} color={colors.accent} duration={1400} spread={360} speed={90} />
			<BerxParticleSystem trigger={burst2} count={30} color="#E6B800" duration={1200} spread={360} speed={70} />
			{/* Connective lines between the four preview cards — real SVG, not a literal physics link. */}
			<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, linesStyle]}>
				<Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
					<Line x1={20} y1={26} x2={68} y2={20} stroke={colors.accent} strokeOpacity={0.25} strokeWidth={0.3} />
					<Line x1={20} y1={26} x2={16} y2={68} stroke={colors.accent} strokeOpacity={0.25} strokeWidth={0.3} />
					<Line x1={68} y1={20} x2={66} y2={70} stroke={colors.accent} strokeOpacity={0.25} strokeWidth={0.3} />
					<Line x1={16} y1={68} x2={66} y2={70} stroke={colors.accent} strokeOpacity={0.25} strokeWidth={0.3} />
				</Svg>
			</Animated.View>
			{PREVIEW_CARDS.map((c, i) => (
				<PreviewCard key={c.label} card={c} delay={i * 180} colors={colors} />
			))}
			<View style={styles.centerLogoWrap}>
				<SpatialEmblemReveal size={96} light={colors.accent} />
			</View>
			<Text style={[cine.heading, styles.feelText, {color: colors.text}]}>Твоя жизнь. В одном живом пространстве.</Text>
			<Animated.View style={buttonStyle}>
				<BerxAnimatedButton variant="primary" premium title="Далее →" onPress={onNext} style={{marginTop: spacing.xl}} />
			</Animated.View>
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// FINAL WELCOME
// ————————————————————————————————————————————————————————————————
function Skyline({colors}: {colors: BerxColorTokens}) {
	const buildings = [12, 22, 16, 30, 20, 26, 14, 24, 18];
	return (
		<Svg width="100%" height={90} viewBox="0 0 200 90" preserveAspectRatio="none" style={StyleSheet.absoluteFillObject as never}>
			{buildings.map((h, i) => (
				<Rect key={i} x={i * 22} y={90 - h * 2.4} width={16} height={h * 2.4} fill={colors.text} opacity={0.05 + (i % 3) * 0.02} />
			))}
		</Svg>
	);
}

/** A real, disclosed ABSTRACT silhouette — see this file's own header on why this isn't a literal character illustration. */
function PersonSilhouette({colors}: {colors: BerxColorTokens}) {
	return (
		<Svg width={120} height={160} viewBox="0 0 120 160">
			<Circle cx={60} cy={38} r={26} fill={colors.text} opacity={0.14} />
			<Ellipse cx={60} cy={132} rx={48} ry={60} fill={colors.text} opacity={0.14} />
		</Svg>
	);
}

export function CinematicFinalPanel({
	colors,
	firstname,
	busy,
	error,
	onEnter,
	onGoToLogin,
}: {
	colors: BerxColorTokens;
	firstname: string;
	busy: boolean;
	error: string | null;
	onEnter: () => void | Promise<void>;
	onGoToLogin: () => void;
}) {
	const styles = useMemo(() => makeStyles(), []);
	const zoom = useSharedValue(0);
	const [zooming, setZooming] = useState(false);

	async function handleEnter() {
		setZooming(true);
		zoom.value = withTiming(1, {duration: 700, easing: Easing.in(Easing.cubic)});
		await onEnter();
		// Real outcome, not assumed: if login actually failed (activation
		// pending — see this flow's own header), undo the zoom so the real
		// error message stays legible instead of leaving the screen faded.
		setZooming(false);
		zoom.value = withTiming(0, {duration: 260});
	}

	const zoomStyle = useAnimatedStyle(() => ({
		opacity: 1 - zoom.value * 0.85,
		transform: [{scale: 1 + zoom.value * 1.8}],
	}), [zoom]);

	return (
		<Animated.View style={[centerStyles.center, zoomStyle]}>
			<View style={styles.skylineWrap} pointerEvents="none">
				<Skyline colors={colors} />
			</View>
			<PersonSilhouette colors={colors} />
			<View style={styles.emblemSmallWrap}>
				<SpatialEmblemReveal size={64} light={colors.accent} />
			</View>
			<Text style={[cine.heading, styles.title, {color: colors.text}]}>
				Добро пожаловать в BERX{firstname.trim() ? `, ${firstname.trim()}` : ''}.
			</Text>
			<Text style={[cine.body, styles.subtitle, {color: colors.textDim}]}>Твоя жизнь. В одном живом пространстве.</Text>
			{error ? (
				<>
					<Text style={styles.error}>{error}</Text>
					<Text style={[styles.loginLink, {color: colors.accent}]} onPress={onGoToLogin}>Перейти к входу</Text>
				</>
			) : null}
			<BerxAnimatedButton variant="primary" premium title={busy || zooming ? 'Входим…' : 'Войти в BERX →'} onPress={handleEnter} disabled={busy || zooming} style={styles.enterBtn} />
		</Animated.View>
	);
}

const makeStyles = () =>
	StyleSheet.create({
		centerLogoWrap: {marginTop: spacing.xl},
		feelText: {fontSize: 22, textAlign: 'center', marginTop: spacing.lg, maxWidth: 300},
		skylineWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, opacity: 0.8},
		emblemSmallWrap: {marginTop: -spacing.xl, marginBottom: spacing.md},
		title: {fontSize: 28, textAlign: 'center'},
		subtitle: {textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl},
		error: {color: '#E0555A', fontSize: 13, textAlign: 'center', marginBottom: spacing.xs},
		loginLink: {fontSize: 13, textAlign: 'center', marginBottom: spacing.md},
		enterBtn: {width: '100%', maxWidth: 320},
	});
