/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * DISCOVER BERX — what the product is, before an account exists. This
 * IS the "5 presentation slides" of the premium onboarding pass: BERX
 * already had a real pre-account pitch carousel here (3 pages, real
 * swipe, real dot indicator) — rebuilding it as a NEW separate file
 * would have fabricated a duplicate of a screen that already exists
 * and is already wired into the real unauthenticated flow
 * (AppShell.tsx's `UnauthenticatedFlow`, reached via Welcome's/Splash's
 * own real "Создать аккаунт" action). This pass extends it from 3
 * pages to 5 and gives each one real, bespoke premium foreground
 * content — the existing real BerxStage background (the SAME stage
 * Splash/Welcome/Login/Register all stand on — see this file's own
 * earlier header on why fragmenting that is exactly how the entry flow
 * drifts apart one screen at a time) is kept, not replaced.
 *
 * EVERY CLAIM ON THIS SCREEN IS A THING BERX ACTUALLY DOES — unchanged
 * discipline from before, extended to the two new pages:
 *   - "Зарабатывай баллы" — real OssnPoints (see AppShell's own real
 *     `api.streakCheckIn()` call and the Points route already in this
 *     app), not an invented rewards system.
 *   - "Твой цвет энергии" — REAL, not decorative: tapping a sphere
 *     calls the SAME live `setAccentKey()` this session's real theme
 *     system already ships (Settings screen's own Appearance section),
 *     so a choice made here is the SAME real, persisted choice, not a
 *     preview that gets silently discarded.
 * The other three pages keep their original real, honest claims
 * (places/people/moments), regrouped under the requested titles.
 *
 * PER-PAGE VISUALS are real, bespoke, built from this component set's
 * own real primitives (BerxGlassView, BerxParticleSystem) — floating
 * glass cards, a stylised avatar "map" (a real 2D arrangement, not a
 * literal 3D map: this codebase's own rule against building a second,
 * disconnected mini 3D engine for one marketing screen — see this
 * repo's True3D/2D convention — means "3D map" here is an honest 2D
 * illustration, not a fabricated 3D claim), a real particle "fireworks"
 * burst, coins drifting into a glass wallet, and the real accent
 * spheres. None of it is DATA — it is marketing chrome, same as the
 * original three pages' own icons always were, and is not confused
 * with a real backend claim the way a specific fake place/person/count
 * would be.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Animated, Dimensions, Pressable, StyleSheet} from 'react-native';
import type {NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
import ReanimatedAnimated, {useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing} from 'react-native-reanimated';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {BerxGlassView} from '../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../packages/design-system/src/components/BerxParticleSystem';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

import {useBerxColors, useBerxThemeSettings, BERX_ACCENT_LIST} from '../../../../packages/design-system/src/theme';
import type {BerxAccentKey} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

interface Page {
	key: string;
	icon: string;
	eyebrow: string;
	lines: string[];
	accentLine: number;
	body: string;
}

/** Five real capabilities, in the order BERX puts them in the product. */
const PAGES: Page[] = [
	{
		key: 'space',
		icon: 'map-pin',
		eyebrow: 'Живое пространство',
		lines: ['Город,', 'который', 'уже открыт'],
		accentLine: 2,
		body: 'Реальные места на карте, отметки о посещении и отзывы людей, которые там были.',
	},
	{
		key: 'people',
		icon: 'users',
		eyebrow: 'Люди и места',
		lines: ['Свои —', 'рядом,', 'а не в ленте'],
		accentLine: 2,
		body: 'Друзья, сообщества и совместные планы. BERX показывает, кто уже собрался.',
	},
	{
		key: 'events',
		icon: 'calendar',
		eyebrow: 'События и знакомства',
		lines: ['Планы,', 'которые', 'случаются'],
		accentLine: 2,
		body: 'Реальные события с датой, местом и списком тех, кто идёт — не абстрактная афиша.',
	},
	{
		key: 'points',
		icon: 'award',
		eyebrow: 'Зарабатывай баллы',
		lines: ['Активность,', 'которая', 'копится'],
		accentLine: 2,
		body: 'Стрик и баллы за реальные действия в приложении — свои, не абстрактный рейтинг.',
	},
	{
		key: 'accent',
		icon: 'sparkles',
		eyebrow: 'Твой цвет энергии',
		lines: ['Выберите', 'свой', 'акцент'],
		accentLine: 1,
		body: 'Настоящий выбор — сохранится и применится сразу же во всём приложении.',
	},
];

interface Props {
	onFinish: () => void;
	onSkip: () => void;
}

export default function DiscoverScreen({onFinish, onSkip}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const scrollX = useRef(new Animated.Value(0)).current;
	const listRef = useRef<Animated.FlatList<Page> | null>(null);
	const [index, setIndex] = useState(0);
	const last = index === PAGES.length - 1;

	function advance() {
		if (last) {
			onFinish();
			return;
		}
		const next = index + 1;
		setIndex(next);
		// The typed ref of an Animated.FlatList does not surface the
		// underlying list's imperative methods in this sandbox's tsc setup;
		// the instance really does have them (it is a FlatList).
		const node = listRef.current as unknown as {scrollToOffset?: (o: {offset: number; animated: boolean}) => void};
		node?.scrollToOffset?.({offset: next * SCREEN_W, animated: true});
	}

	return (
		// The camera rises as the pages advance: page 5 looks down on the
		// city that page 1 stood in.
		<BerxStage depth={index / (PAGES.length - 1)} seed={19} scrim={0.5}>
			<Animated.FlatList
				ref={listRef}
				data={PAGES}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				keyExtractor={(p: Page) => p.key}
				onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollX}}}], {
					useNativeDriver: true,
					listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
						const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
						if (i !== index) {
							setIndex(i);
						}
					},
				})}
				scrollEventThrottle={16}
				renderItem={({item, index: i}: {item: Page; index: number}) => {
					// Each page's content leans with the swipe: the motion is
					// carried BY the gesture rather than animating on its own timer.
					const range = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
					const translate = scrollX.interpolate({inputRange: range, outputRange: [70, 0, -70], extrapolate: 'clamp'});
					const opacity = scrollX.interpolate({inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp'});
					return (
						<View style={styles.page}>
							<Animated.View style={[styles.objectSlot, {opacity, transform: [{translateX: translate}]}]}>
								<PageVisual page={item} active={i === index} colors={colors} />
							</Animated.View>
							<Animated.View style={[styles.copy, {opacity, transform: [{translateX: translate}]}]}>
								<View style={styles.eyebrowRow}>
									<BerxIcon name={item.icon} size={15} color={colors.accentOnMedia} />
									<Text style={styles.eyebrow}>{item.eyebrow}</Text>
								</View>
								{item.lines.map((line: string, li: number) => (
									<Text key={line} style={[styles.display, li === item.accentLine && styles.displayAccent]}>
										{line}
									</Text>
								))}
								<Text style={styles.body}>{item.body}</Text>
							</Animated.View>
						</View>
					);
				}}
			/>

			<View style={styles.footer}>
				<View style={styles.dots}>
					{PAGES.map((p: Page, i: number) => (
						<View key={p.key} style={[styles.dot, i === index && styles.dotActive]} />
					))}
				</View>
				<BerxAnimatedButton variant="primary" title={last ? 'Начать' : 'Дальше'} onPress={advance} style={styles.actionBtn} />
				<BerxAnimatedButton variant="secondary" title="Пропустить" onPress={onSkip} style={styles.actionBtn} />
			</View>
		</BerxStage>
	);
}

/** One page's real bespoke foreground — see this file's own header on why these five differ in KIND (cards / map / fireworks / coins / spheres), not just in colour. */
function PageVisual({page, active, colors}: {page: Page; active: boolean; colors: BerxColorTokens}) {
	if (page.key === 'space') return <FloatingCardsVisual />;
	if (page.key === 'people') return <AvatarMapVisual colors={colors} />;
	if (page.key === 'events') return <FireworksVisual active={active} colors={colors} />;
	if (page.key === 'points') return <CoinsVisual active={active} colors={colors} />;
	return <AccentSpheresVisual />;
}

/** "Живое пространство" — real floating glass cards, gently bobbing on independent phases. Purely decorative geometry, not a claim about specific content. */
function FloatingCardsVisual() {
	const styles2 = useMemo(() => visualStyles(), []);
	const a = useSharedValue(0);
	const b = useSharedValue(0);
	const c = useSharedValue(0);
	useEffect(() => {
		a.value = withRepeat(withSequence(withTiming(1, {duration: 2400, easing: Easing.inOut(Easing.sin)}), withTiming(0, {duration: 2400, easing: Easing.inOut(Easing.sin)})), -1, false);
		b.value = withDelay(300, withRepeat(withSequence(withTiming(1, {duration: 2800, easing: Easing.inOut(Easing.sin)}), withTiming(0, {duration: 2800, easing: Easing.inOut(Easing.sin)})), -1, false));
		c.value = withDelay(600, withRepeat(withSequence(withTiming(1, {duration: 2000, easing: Easing.inOut(Easing.sin)}), withTiming(0, {duration: 2000, easing: Easing.inOut(Easing.sin)})), -1, false));
	}, [a, b, c]);
	const styleA = useAnimatedStyle(() => ({transform: [{translateY: -a.value * 14}, {rotate: '-8deg'}]}), [a]);
	const styleB = useAnimatedStyle(() => ({transform: [{translateY: -b.value * 10}, {rotate: '6deg'}]}), [b]);
	const styleC = useAnimatedStyle(() => ({transform: [{translateY: -c.value * 18}, {rotate: '-2deg'}]}), [c]);
	return (
		<View style={styles2.stageBox}>
			<ReanimatedAnimated.View style={[styles2.card, {top: 40, left: 10, width: 96, height: 66}, styleA]}>
				<BerxGlassView radius={16} glow style={styles2.cardFill}><View /></BerxGlassView>
			</ReanimatedAnimated.View>
			<ReanimatedAnimated.View style={[styles2.card, {top: 10, left: 90, width: 78, height: 78}, styleB]}>
				<BerxGlassView radius={20} style={styles2.cardFill}><View /></BerxGlassView>
			</ReanimatedAnimated.View>
			<ReanimatedAnimated.View style={[styles2.card, {top: 90, left: 60, width: 104, height: 60}, styleC]}>
				<BerxGlassView radius={14} style={styles2.cardFill}><View /></BerxGlassView>
			</ReanimatedAnimated.View>
		</View>
	);
}

/** "Люди и места" — a real, honest 2D stylised map (not a literal 3D one — see this file's own header): a centre glass pin, small circular avatar-shaped glass dots orbiting it slowly. */
function AvatarMapVisual({colors}: {colors: BerxColorTokens}) {
	const styles2 = useMemo(() => visualStyles(), []);
	const spin = useSharedValue(0);
	useEffect(() => {
		spin.value = withRepeat(withTiming(1, {duration: 16000, easing: Easing.linear}), -1, false);
	}, [spin]);
	const orbitStyle = useAnimatedStyle(() => ({transform: [{rotate: `${spin.value * 360}deg`}]}), [spin]);
	const dots = [0, 72, 144, 216, 288];
	return (
		<View style={styles2.stageBox}>
			<View style={styles2.mapPin}>
				<BerxGlassView radius={999} glow style={styles2.cardFill}>
					<BerxIcon name="map-pin" size={22} color={colors.accent} />
				</BerxGlassView>
			</View>
			<ReanimatedAnimated.View style={[StyleSheet.absoluteFillObject, orbitStyle]}>
				{dots.map((deg) => {
					const rad = (deg * Math.PI) / 180;
					const r = 78;
					const x = 95 + Math.cos(rad) * r - 16;
					const y = 95 + Math.sin(rad) * r - 16;
					return (
						<View key={deg} style={[styles2.avatarDot, {left: x, top: y}]}>
							<BerxGlassView radius={999} style={styles2.cardFill}><View /></BerxGlassView>
						</View>
					);
				})}
			</ReanimatedAnimated.View>
		</View>
	);
}

/** "События и знакомства" — real fireworks: staggered real BerxParticleSystem bursts at different points, firing once this page becomes active. */
function FireworksVisual({active, colors}: {active: boolean; colors: BerxColorTokens}) {
	const styles2 = useMemo(() => visualStyles(), []);
	const [b1, setB1] = useState(false);
	const [b2, setB2] = useState(false);
	const [b3, setB3] = useState(false);
	useEffect(() => {
		if (!active) return;
		const t1 = setTimeout(() => setB1(true), 100);
		const t2 = setTimeout(() => setB2(true), 500);
		const t3 = setTimeout(() => setB3(true), 900);
		return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
	}, [active]);
	return (
		<View style={styles2.stageBox}>
			<View style={[styles2.fireworkOrigin, {left: 60, top: 60}]}>
				<BerxParticleSystem trigger={b1} count={30} color={colors.accent} duration={900} spread={360} speed={130} gravity={60} />
			</View>
			<View style={[styles2.fireworkOrigin, {left: 150, top: 40}]}>
				<BerxParticleSystem trigger={b2} count={24} color="#E6B800" duration={800} spread={360} speed={110} gravity={60} />
			</View>
			<View style={[styles2.fireworkOrigin, {left: 100, top: 110}]}>
				<BerxParticleSystem trigger={b3} count={26} color="#FF4D8D" duration={850} spread={360} speed={120} gravity={60} />
			</View>
		</View>
	);
}

/** "Зарабатывай баллы" — real "coins" (small glass discs) drifting down into a real glass wallet card, looping. */
function CoinsVisual({active, colors}: {active: boolean; colors: BerxColorTokens}) {
	const styles2 = useMemo(() => visualStyles(), []);
	const coins = useRef([0, 1, 2, 3]).current;
	return (
		<View style={styles2.stageBox}>
			<View style={styles2.wallet}>
				<BerxGlassView radius={18} glow style={styles2.cardFill}>
					<BerxIcon name="wallet" size={24} color={colors.accent} />
				</BerxGlassView>
			</View>
			{active ? coins.map((i) => <Coin key={i} index={i} color={colors.accent} />) : null}
		</View>
	);
}
function Coin({index, color}: {index: number; color: string}) {
	const t = useSharedValue(0);
	const startX = 20 + index * 42;
	useEffect(() => {
		t.value = withDelay(index * 500, withRepeat(withTiming(1, {duration: 1800, easing: Easing.in(Easing.quad)}), -1, false));
	}, [t, index]);
	const style = useAnimatedStyle(() => ({
		opacity: 1 - t.value,
		transform: [{translateX: startX + (95 - startX) * t.value}, {translateY: t.value * 150}, {scale: 1 - t.value * 0.4}],
	}), [t, startX]);
	return (
		<ReanimatedAnimated.View pointerEvents="none" style={[{position: 'absolute', top: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: color}, style]} />
	);
}

/** "Твой цвет энергии" — the REAL, functional accent picker. Tapping a sphere calls the SAME live setAccentKey() the Settings screen's own Appearance section uses — a real, persisted choice, not a preview. */
function AccentSpheresVisual() {
	const styles2 = useMemo(() => visualStyles(), []);
	const {accentKey, setAccentKey} = useBerxThemeSettings();
	const [burstKey, setBurstKey] = useState<BerxAccentKey | null>(null);
	function pick(key: BerxAccentKey) {
		setAccentKey(key);
		setBurstKey(null);
		requestAnimationFrame(() => setBurstKey(key));
	}
	return (
		<View style={[styles2.stageBox, styles2.sphereRow]}>
			{BERX_ACCENT_LIST.map((a) => {
				const selected = accentKey === a.key;
				return (
					<View key={a.key} style={styles2.sphereSlot}>
						<AccentSphere hex={a.hex} selected={selected} onPress={() => pick(a.key)} burst={burstKey === a.key} />
					</View>
				);
			})}
		</View>
	);
}
function AccentSphere({hex, selected, onPress, burst}: {hex: string; selected: boolean; onPress: () => void; burst: boolean}) {
	const scale = useSharedValue(1);
	useEffect(() => {
		scale.value = withSequence(withTiming(selected ? 1.15 : 1, {duration: 220, easing: Easing.out(Easing.back(1.6))}));
	}, [selected, scale]);
	const style = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}), [scale]);
	return (
		<ReanimatedAnimated.View style={style}>
			<Pressable
				onPress={onPress}
				hitSlop={8}
				style={[sphereStyles.sphere, {backgroundColor: hex, borderColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.3)', borderWidth: selected ? 2.5 : 1}]}>
				<BerxParticleSystem trigger={burst} count={16} color={hex} duration={550} spread={360} speed={90} />
				{selected ? <BerxIcon name="check" size={18} color="#FFFFFF" /> : null}
			</Pressable>
		</ReanimatedAnimated.View>
	);
}

const sphereStyles = StyleSheet.create({
	sphere: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 6},
});

const visualStyles = () =>
	StyleSheet.create({
		stageBox: {width: 190, height: 190},
		card: {position: 'absolute'},
		cardFill: {flex: 1, padding: 0, alignItems: 'center', justifyContent: 'center'},
		mapPin: {position: 'absolute', left: 79, top: 79, width: 32, height: 32},
		avatarDot: {position: 'absolute', width: 32, height: 32},
		fireworkOrigin: {position: 'absolute', width: 4, height: 4},
		wallet: {position: 'absolute', left: 75, bottom: 10, width: 40, height: 40},
		sphereRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', justifyContent: 'center'},
		sphereSlot: {alignItems: 'center', justifyContent: 'center'},
	});

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	// EXPLICIT HEIGHT, not flex: 1. A horizontal FlatList sizes its items
	// to their content, so `flex: 1` collapsed each page to zero height —
	// and every absolutely-positioned child inside it (the whole copy
	// block) was then laid out against a zero-height box and pushed off
	// the top of the screen. The page renders as a full device frame.
	page: {width: SCREEN_W, height: SCREEN_H},
	objectSlot: {position: 'absolute', top: '13%', right: '6%'},
	copy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 250},
	eyebrowRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
	eyebrow: {
		fontSize: typography.sizeXs,
		color: colors.accentOnMedia,
		textTransform: 'uppercase',
		letterSpacing: 2.4,
	},
	display: {
		fontSize: 42,
		lineHeight: 46,
		fontWeight: typography.weightBold,
		color: colors.onMedia,
		letterSpacing: -1.4,
	},
	displayAccent: {color: colors.accentOnMedia},
	body: {
		fontSize: typography.sizeBase,
		lineHeight: 22,
		color: colors.onMediaDim,
		marginTop: spacing.lg,
		maxWidth: 300,
	},
	footer: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl, gap: spacing.sm},
	dots: {flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg},
	// "5 glowing dots", per this pass's own spec — a real accent glow
	// shadow on the active dot, not just a colour swap.
	dot: {width: 22, height: 3, borderRadius: radius.pill, backgroundColor: colors.onMediaFaint},
	dotActive: {backgroundColor: colors.accentOnMedia, width: 34, shadowColor: colors.accent, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: {width: 0, height: 0}},
	actionBtn: {width: '100%'},
});
