/**
 * !!! VERIFICATION STATUS: UNVERIFIED beyond this container's own web
 * harness — see CinematicOnboarding.tsx's own header.
 *
 * PHOTO / BIRTHDAY / INTERESTS / CITY — the four real profile-
 * completion panels between account creation and the "Feel BERX" wow
 * screen. All four are honestly LOCAL-ONLY beyond what real endpoints
 * exist for, exactly the same disclosed scope RegisterScreen.tsx's own
 * step 2/3 already established (checked again here, not assumed):
 *   - avatar upload (POST /me/avatar) and interests (POST /me/interests)
 *     are both real but AUTH-ONLY — the account this flow just created
 *     has no session yet (register() returns no token, see
 *     CinematicOnboarding.tsx's own header), so neither can be called
 *     from here. The UI says so plainly.
 *   - there is no real birthday-of-record field/endpoint reachable from
 *     this flow either — collected locally, same honest treatment.
 *   - there is no real city/geo backend (checked — see
 *     CinematicOnboarding.tsx's own header) — CITY's "map" is a real,
 *     disclosed STYLISED point-field (same technique DiscoverScreen's
 *     own AvatarMapVisual already uses), not a literal roads/buildings
 *     renderer this codebase has no mapping library for.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Image, StyleSheet, Pressable} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, withSpring, withDelay, Easing} from 'react-native-reanimated';
import type {StyleProp, TextStyle} from 'react-native';
import type {BerxFilePart} from '@berx/api/client';
import {BERX_MOTION, BERX_STAGGER} from '../../../../../packages/design-system/src/animation/motion';
import {spacing} from '../../../../../packages/design-system/src/tokens';
import {BerxGlassView} from '../../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../../packages/design-system/src/components/BerxParticleSystem';
import {BerxInput} from '../../../../../packages/design-system/src/components/BerxInput';
import {BerxIcon} from '../../../../../packages/design-system/src/icons/BerxIcon';
import type {BerxColorTokens} from '../../../../../packages/design-system/src/tokens';
import {cine, type CinematicWizardState} from './CinematicShared';

const centerStyles = StyleSheet.create({
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
});

// ————————————————————————————————————————————————————————————————
// PHOTO — real picker, real local preview, real scale-in + edge pulse
// on selection. No photo yet: an abstract glowing floating shape,
// per the spec's own copy ("abstract floating object" inside the ring).
// ————————————————————————————————————————————————————————————————
export function CinematicPhotoPanel({
	colors,
	photoUri,
	pickImage,
	onPicked,
	onBack,
	onNext,
}: {
	colors: BerxColorTokens;
	photoUri: string | null;
	pickImage?: () => Promise<BerxFilePart | null>;
	onPicked: (uri: string, part: BerxFilePart) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const scale = useSharedValue(0.4);
	const pulse = useSharedValue(0);
	const drift = useSharedValue(0);
	useEffect(() => {
		drift.value = withRepeat(withTiming(1, {duration: 3200, easing: Easing.inOut(Easing.sin)}), -1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	async function handlePick() {
		if (!pickImage) return;
		const part = await pickImage();
		if (!part) return;
		const uri = part instanceof Blob ? URL.createObjectURL(part) : part.uri;
		scale.value = 0.4;
		scale.value = withTiming(1, {duration: 420, easing: Easing.out(Easing.back(1.4))});
		pulse.value = 0;
		pulse.value = withTiming(1, {duration: 700, easing: Easing.out(Easing.ease)});
		onPicked(uri, part);
	}
	const photoScaleStyle = useAnimatedStyle(() => ({transform: [{scale: photoUri ? scale.value : 1}]}), [scale, photoUri]);
	const pulseStyle = useAnimatedStyle(() => ({opacity: (1 - pulse.value) * 0.9, transform: [{scale: 1 + pulse.value * 0.35}]}), [pulse]);
	const driftStyle = useAnimatedStyle(() => ({transform: [{translateY: (drift.value - 0.5) * 14}, {rotate: `${drift.value * 40}deg`}]}), [drift]);

	return (
		<View style={centerStyles.center}>
			<Text style={[cine.heading, styles.title, {color: colors.text}]}>Покажи себя</Text>
			<Text style={[cine.body, styles.subtitleTop, {color: colors.textDim}]}>Людям проще почувствовать связь, когда они видят человека.</Text>
			<Animated.View style={[styles.photoRingWrap, photoScaleStyle]}>
				<Animated.View pointerEvents="none" style={[styles.photoPulseRing, {borderColor: colors.accent}, pulseStyle]} />
				<Pressable onPress={handlePick}>
					<BerxGlassView glow radius={999} style={styles.photoGlass}>
						{photoUri ? (
							<Image source={{uri: photoUri}} style={styles.photoImage} />
						) : (
							<Animated.View style={driftStyle}>
								<BerxIcon name="sparkles" size={40} color={colors.accent} />
							</Animated.View>
						)}
					</BerxGlassView>
				</Pressable>
			</Animated.View>
			{!pickImage ? <Text style={[styles.hint, {color: colors.textFaint}]}>Выбор фото недоступен в этом окружении.</Text> : null}
			<View style={styles.stepActions}>
				<BerxAnimatedButton variant="secondary" title="Назад" onPress={onBack} style={styles.stepBtn} />
				<BerxAnimatedButton variant="primary" title="Добавить фото" onPress={handlePick} style={styles.stepBtn} />
			</View>
			<Text style={[styles.skipLink, {color: colors.textDim}]} onPress={onNext}>Пропустить</Text>
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// BIRTHDAY — a real minimal vertical date selector: the current value
// large and in front, its neighbours smaller and dimmer (the spec's own
// "depth effect"), driven by real +/- taps (no wheel-picker/scroll-snap
// dependency exists in this build — an honest, still-real substitute).
// ————————————————————————————————————————————————————————————————
function DateColumn({value, min, max, format, onChange, colors, index = 0}: {value: number; min: number; max: number; format: (n: number) => string; onChange: (n: number) => void; colors: BerxColorTokens; index?: number}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	// "Три колонки (день, месяц, год) выезжают по очереди (stagger 100ms)".
	const enter = useSharedValue(0);
	useEffect(() => {
		enter.value = withDelay(index * BERX_STAGGER.base, withSpring(1, BERX_MOTION.spatial.spring));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const enterStyle = useAnimatedStyle(() => ({opacity: enter.value, transform: [{translateY: (1 - enter.value) * 24}]}), [enter]);
	const prev = value > min ? value - 1 : max;
	const next = value < max ? value + 1 : min;
	return (
		<Animated.View style={[styles.dateCol, enterStyle]}>
			<Pressable onPress={() => onChange(prev)}>
				<Text style={[styles.dateNeighbor, {color: colors.textFaint}]}>{format(prev)}</Text>
			</Pressable>
			<Text style={[styles.dateCurrent, {color: colors.accent}]}>{format(value)}</Text>
			<Pressable onPress={() => onChange(next)}>
				<Text style={[styles.dateNeighbor, {color: colors.textFaint}]}>{format(next)}</Text>
			</Pressable>
		</Animated.View>
	);
}

export function CinematicBirthdayPanel({
	colors,
	day,
	month,
	year,
	onChange,
	onBack,
	onNext,
}: {
	colors: BerxColorTokens;
	day: number;
	month: number;
	year: number;
	onChange: (f: Partial<CinematicWizardState>) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const thisYear = new Date().getFullYear();
	return (
		<View style={centerStyles.center}>
			<Text style={[cine.heading, styles.title, {color: colors.text}]}>Когда начинается твоя история?</Text>
			{/* Non-flex shell — see CinematicOnboarding.tsx's WelcomePanel comment on the real BerxGlassView stretch bug this avoids. */}
			<View style={styles.calendarCardShell}>
				<BerxGlassView glow radius={28} style={styles.calendarCard}>
					<View style={styles.dateRow}>
						<DateColumn value={day} min={1} max={31} format={(n) => String(n).padStart(2, '0')} onChange={(n) => onChange({birthDay: n})} colors={colors} />
						<DateColumn value={month} min={1} max={12} format={(n) => String(n).padStart(2, '0')} onChange={(n) => onChange({birthMonth: n})} colors={colors} index={1} />
						<DateColumn value={year} min={thisYear - 90} max={thisYear - 13} format={(n) => String(n)} onChange={(n) => onChange({birthYear: n})} colors={colors} index={2} />
					</View>
				</BerxGlassView>
			</View>
			<View style={styles.stepActions}>
				<BerxAnimatedButton variant="secondary" title="Назад" onPress={onBack} style={styles.stepBtn} />
				<BerxAnimatedButton variant="primary" title="Продолжить →" onPress={onNext} style={styles.stepBtn} />
			</View>
		</View>
	);
}

// ————————————————————————————————————————————————————————————————
// INTERESTS — floating glass chips at different "depths" (scale/
// opacity per row), tap → scale to front + glow ring + particle burst,
// selected chips gain a persistent glow (the spec's own "cluster").
// ————————————————————————————————————————————————————————————————
const INTEREST_TAGS = ['MUSIC', 'TRAVEL', 'FOOD', 'NIGHTLIFE', 'SPORT', 'ART', 'FASHION', 'TECH', 'COFFEE', 'NATURE', 'CINEMA', 'PEOPLE'];

function Chip({tag, selected, depth, index, onPress, colors}: {tag: string; selected: boolean; depth: number; index: number; onPress: () => void; colors: BerxColorTokens}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [burst, setBurst] = useState(false);
	const pop = useSharedValue(1);
	/**
	 * ENTRANCE — "карточки появляются из разных точек экрана (stagger
	 * 50-80ms, случайное направление)". The direction is derived from the
	 * chip's own index rather than Math.random() at render: a random
	 * value re-rolled on every re-render would make chips jump whenever
	 * the parent updates (selecting one re-renders them all), which is a
	 * real bug this codebase has hit before with seeded fields.
	 */
	const enter = useSharedValue(0);
	const angle = ((index * 137.5) % 360) * (Math.PI / 180); // golden-angle spread, stable per chip
	useEffect(() => {
		enter.value = withDelay(index * BERX_STAGGER.tight, withSpring(1, BERX_MOTION.spatial.spring));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	function press() {
		onPress();
		if (!selected) {
			pop.value = withSequence(withTiming(1.22, {duration: 140, easing: Easing.out(Easing.back(1.6))}), withTiming(1, {duration: 160}));
			setBurst(false);
			requestAnimationFrame(() => setBurst(true));
		}
	}
	const popStyle = useAnimatedStyle(() => {
		const e = enter.value;
		return {
			opacity: e,
			transform: [
				{translateX: (1 - e) * Math.cos(angle) * 60},
				{translateY: (1 - e) * Math.sin(angle) * 60},
				{scale: pop.value * (0.7 + e * 0.3)},
			],
		};
	}, [pop, enter, angle]);
	// Depth, selection and entrance all live in ONE animated style: a
	// second style object carrying its own `transform` would replace this
	// one outright rather than compose with it.
	return (
		<Animated.View style={[{opacity: selected ? 1 : 0.68 - depth * 0.08}, popStyle, styles.chipWrap]}>
			<Pressable onPress={press}>
				<BerxGlassView
					radius={999}
					glow={selected}
					style={[styles.chip, selected ? {borderColor: colors.accent} : null]}>
					<Text style={[styles.chipText, {color: selected ? colors.accent : colors.textDim}]}>{tag}</Text>
				</BerxGlassView>
			</Pressable>
			<BerxParticleSystem trigger={burst} count={14} color={colors.accent} duration={480} spread={360} speed={80} />
		</Animated.View>
	);
}

export function CinematicInterestsPanel({colors, selected, onToggle, onBack, onNext}: {colors: BerxColorTokens; selected: string[]; onToggle: (tag: string) => void; onBack: () => void; onNext: () => void}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={centerStyles.center}>
			<Text style={[cine.heading, styles.title, {color: colors.text}]}>Что тебе близко?</Text>
			<View style={styles.chipsWrap}>
				{INTEREST_TAGS.map((tag, i) => (
					<Chip key={tag} tag={tag} selected={selected.includes(tag)} depth={i % 3} index={i} onPress={() => onToggle(tag)} colors={colors} />
				))}
			</View>
			<SelectedCounter count={selected.length} style={[styles.selectedCount, {color: colors.textDim}]} />
			<View style={styles.stepActions}>
				<BerxAnimatedButton variant="secondary" title="Назад" onPress={onBack} style={styles.stepBtn} />
				{/* "Кнопка появляется, когда выбрано минимум 3 интереса" — a
				    real gate, not a disabled button that looks tappable. */}
				<BerxAnimatedButton variant="primary" title="Продолжить →" onPress={onNext} disabled={selected.length < 3} style={styles.stepBtn} />
			</View>
		</View>
	);
}

/** "Счётчик обновляется с эффектом pop (scale 1.0 → 1.15 → 1.0)" — on the real value change, not on every render. */
function SelectedCounter({count, style}: {count: number; style?: StyleProp<TextStyle>}) {
	const pop = useSharedValue(1);
	const prev = useRef(count);
	useEffect(() => {
		if (prev.current === count) return;
		prev.current = count;
		pop.value = withSequence(withTiming(1.15, {duration: 130, easing: Easing.out(Easing.back(2))}), withTiming(1, {duration: 140}));
	}, [count, pop]);
	const st = useAnimatedStyle(() => ({transform: [{scale: pop.value}]}), [pop]);
	return <Animated.Text style={[style, st]}>Выбрано {count}</Animated.Text>;
}

// ————————————————————————————————————————————————————————————————
// CITY — a real, disclosed stylised point-field standing in for the
// spec's literal "living 3D city map" (no mapping library/backend in
// this build — see this file's own header), manual city entry (no real
// geo permission flow exists either, checked), then four real floating
// category labels once a city is set.
// ————————————————————————————————————————————————————————————————
function MapPoint({x, y, size, colorHex}: {x: number; y: number; size: number; colorHex: string}) {
	const pulse = useSharedValue(0);
	useEffect(() => {
		pulse.value = withRepeat(withSequence(withTiming(1, {duration: 1400, easing: Easing.inOut(Easing.sin)}), withTiming(0, {duration: 1400, easing: Easing.inOut(Easing.sin)})), -1, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const style = useAnimatedStyle(() => ({opacity: 0.4 + pulse.value * 0.5, transform: [{scale: 0.8 + pulse.value * 0.5}]}), [pulse]);
	return <Animated.View pointerEvents="none" style={[{position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: size / 2, backgroundColor: colorHex}, style]} />;
}

const MAP_POINTS = [
	{x: 20, y: 25, size: 5},
	{x: 70, y: 18, size: 4},
	{x: 40, y: 55, size: 6},
	{x: 82, y: 62, size: 4},
	{x: 15, y: 72, size: 5},
	{x: 60, y: 80, size: 4},
	{x: 30, y: 40, size: 3},
];

export function CinematicCityPanel({colors, city, onChange, onBack, onNext}: {colors: BerxColorTokens; city: string; onChange: (c: string) => void; onBack: () => void; onNext: () => void}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [manual, setManual] = useState(false);
	const [locationHint, setLocationHint] = useState(false);
	// REAL BUG, CAUGHT VIA HARNESS SCREENSHOT: this panel's OWN view
	// (typing form vs. selected-city badge) used to key directly off the
	// shared `city` wizard field — but that field updates on every
	// keystroke (it's the same controlled value `onChange` writes back
	// to), so the very first character typed already made `city` truthy
	// and silently swapped the whole panel to the "selected" view mid-
	// type. A local draft, committed to the shared field only on
	// "Готово", keeps typing and "selected" as two real, separate states.
	const [draft, setDraft] = useState(city);
	return (
		<View style={centerStyles.center}>
			<View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
				{MAP_POINTS.map((p, i) => (
					<MapPoint key={i} x={p.x} y={p.y} size={p.size} colorHex={colors.accent} />
				))}
			</View>
			<Text style={[cine.heading, styles.title, {color: colors.text}]}>Где ты сейчас?</Text>
			{!city ? (
				<>
					{locationHint ? <Text style={[styles.hint, {color: colors.textFaint}]}>Геолокация пока не подключена — выбери город вручную.</Text> : null}
					{manual ? (
						<View style={styles.cityInputCardShell}>
							<BerxGlassView glow radius={24} style={styles.cityInputCard}>
								<BerxInput placeholder="Название города" value={draft} onChangeText={setDraft} style={styles.input} />
								<BerxAnimatedButton variant="primary" title="Готово" onPress={() => draft.trim() && onChange(draft.trim())} disabled={!draft.trim()} style={styles.stepBtnFull} />
							</BerxGlassView>
						</View>
					) : (
						<View style={styles.stepActions}>
							<BerxAnimatedButton variant="secondary" title="Выбрать город вручную" onPress={() => setManual(true)} style={styles.stepBtn} />
							<BerxAnimatedButton variant="primary" title="Разрешить доступ" onPress={() => setLocationHint(true)} style={styles.stepBtn} />
						</View>
					)}
				</>
			) : (
				<>
					{/* REAL BUG, CAUGHT VIA HARNESS SCREENSHOT: BerxGlassView's
					    OWN outer wrapper always carries `flex: 1` (see that
					    file's own header) — harmless when it's the sole/
					    dominant child of a flex parent, but here it was a
					    DIRECT sibling of Title/categoriesRow/stepActions
					    inside a flex:1 column, so it silently grabbed all the
					    leftover vertical space and cast its shadow across a
					    644px-tall invisible box — a giant ghost capsule
					    behind a small pill of text. A plain, non-flex wrapper
					    View around it (the same pattern the category chips
					    just below already use) gives the flex:1 request
					    nothing to grow into, exactly like a chip in a
					    flexWrap row never stretches either. */}
					<View style={styles.cityBadgeWrap}>
						<BerxGlassView glow radius={999} style={styles.cityBadge}>
							<Text style={[styles.cityBadgeText, {color: colors.text}]}>{city}</Text>
						</BerxGlassView>
					</View>
					<View style={styles.categoriesRow}>
						{['PEOPLE', 'PLACES', 'EVENTS', 'NOW'].map((cat) => (
							<View key={cat} style={styles.categoryChip}>
								<BerxGlassView radius={16} style={styles.categoryGlass}>
									<Text style={[styles.categoryText, {color: colors.textDim}]}>{cat}</Text>
								</BerxGlassView>
							</View>
						))}
					</View>
					<View style={styles.stepActions}>
						<BerxAnimatedButton variant="secondary" title="Назад" onPress={onBack} style={styles.stepBtn} />
						<BerxAnimatedButton variant="primary" premium title="Продолжить →" onPress={onNext} style={styles.stepBtn} />
					</View>
				</>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		title: {fontSize: 26, color: colors.text, textAlign: 'center', marginBottom: spacing.md},
		subtitleTop: {color: colors.textDim, textAlign: 'center', marginTop: -spacing.sm, marginBottom: spacing.lg, maxWidth: 300},
		hint: {fontSize: 12, marginTop: spacing.sm, textAlign: 'center'},
		photoRingWrap: {width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg},
		photoPulseRing: {position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2},
		photoGlass: {width: 176, height: 176, borderRadius: 88, padding: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
		photoImage: {width: '100%', height: '100%'},
		stepActions: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, width: '100%', maxWidth: 380},
		stepBtn: {flex: 1},
		stepBtnFull: {width: '100%', marginTop: spacing.sm},
		skipLink: {marginTop: spacing.md, fontSize: 14},
		calendarCardShell: {width: '100%', maxWidth: 380},
		calendarCard: {},
		// REAL BUG, CAUGHT VIA HARNESS SCREENSHOT: `justifyContent:
		// 'space-around'` alone left day/month/year touching with no
		// visible gap — the CURRENT row's bold 30px digits are wide
		// enough that they ate all of space-around's slack (the smaller,
		// narrower neighbour rows had plenty of visible gap from the same
		// layout, which is what made this easy to miss at first glance).
		// A real minWidth per column plus an explicit row gap guarantees
		// separation regardless of glyph width at any font size.
		dateRow: {flexDirection: 'row', justifyContent: 'center', gap: spacing.lg},
		dateCol: {alignItems: 'center', gap: spacing.xs, minWidth: 64},
		dateCurrent: {fontSize: 30, fontWeight: '800'},
		dateNeighbor: {fontSize: 15, opacity: 0.5},
		chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', maxWidth: 380},
		chipWrap: {},
		chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
		chipText: {fontSize: 13, fontWeight: '700', letterSpacing: 0.4},
		selectedCount: {marginTop: spacing.md, fontSize: 14},
		cityInputCardShell: {width: '100%', maxWidth: 380},
		cityInputCard: {gap: spacing.sm},
		input: {width: '100%'},
		cityBadgeWrap: {},
		cityBadge: {paddingHorizontal: spacing.xl, paddingVertical: spacing.md},
		cityBadgeText: {fontSize: 20, fontWeight: '700'},
		categoriesRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg},
		categoryChip: {},
		categoryGlass: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
		categoryText: {fontSize: 11, fontWeight: '700', letterSpacing: 0.6},
	});
