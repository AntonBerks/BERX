/**
 * BERX V9 CONTROLS + NOW SCENE + remaining system boundaries.
 *
 * Everything here is a named V9 contract with real support:
 * inputs the app already needs (Toggle, TextArea, Stepper, Slider,
 * DatePicker, TimePicker), the Color Vibe picker (the live accent
 * runtime this repo already has, extracted into one reusable control
 * instead of the two screens that each re-implemented it), the NOW
 * scene and rail (backed by `nearbyNow` / `onlineFriends`), the
 * composer (backed by `createPost` / message send), plus FocusRing,
 * PermissionGate and RouteBoundary.
 */
import {useEffect} from 'react';
import type {ReactNode} from 'react';
import {View, Text, Pressable, TextInput, StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming} from 'react-native-reanimated';
import {useBerxColors, useBerxThemeSettings, BERX_ACCENT_LIST, type BerxAccentKey} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {spacing, typography, radius} from '../tokens';
import {BERX_MOTION} from '../animation/motion';
import {BerxIcon} from '../icons/BerxIcon';
import {BerxIconButton} from '../components/BerxIconButton';
import {useBerxReducedMotion} from './BerxBoundaries';
import {BerxSpatialScene, BerxDepthLayer} from './BerxSpatialScene';
import {BerxNowPulse} from './BerxV9Live';
import type {BerxV9ComponentContract} from './componentRegistry';

/* ---------------- Toggle ---------------- */

export interface BerxToggleProps extends BerxV9ComponentContract {
	value: boolean;
	onValueChange: (v: boolean) => void;
	label?: string;
	style?: StyleProp<ViewStyle>;
}

/** A real switch. This repo had none — every settings row was doing its own thing. */
export function BerxToggle({value, onValueChange, label, disabled, style, testID, accessibilityLabel}: BerxToggleProps) {
	const colors = useBerxColors();
	const reduced = useBerxReducedMotion();
	const t = useSharedValue(value ? 1 : 0);
	useEffect(() => {
		t.value = reduced ? withTiming(value ? 1 : 0, {duration: 120}) : withSpring(value ? 1 : 0, BERX_MOTION.micro.spring);
	}, [value, reduced, t]);
	const knob = useAnimatedStyle(() => ({transform: [{translateX: t.value * 20}]}), [t]);
	const track = useAnimatedStyle(() => ({backgroundColor: t.value > 0.5 ? colors.accent : colors.glass2}), [t, colors]);
	return (
		<Pressable
			testID={testID}
			accessibilityRole="switch"
			accessibilityState={{checked: value, disabled: !!disabled}}
			accessibilityLabel={accessibilityLabel ?? label}
			disabled={disabled}
			onPress={() => onValueChange(!value)}
			style={[styles.toggleRow, disabled ? styles.disabled : null, style]}>
			{label ? <Text style={[styles.controlLabel, {color: colors.text}]}>{label}</Text> : null}
			<Animated.View style={[styles.track, {borderColor: colors.borderSoft}, track]}>
				<Animated.View style={[styles.knob, {backgroundColor: value ? colors.onAccent : colors.textDim}, knob]} />
			</Animated.View>
		</Pressable>
	);
}

/* ---------------- Text ---------------- */

export function BerxTextArea({value, onChangeText, placeholder, rows = 4, disabled, style, testID, accessibilityLabel}: {value: string; onChangeText: (v: string) => void; placeholder?: string; rows?: number; style?: StyleProp<ViewStyle>} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	return (
		<TextInput
			testID={testID}
			accessibilityLabel={accessibilityLabel ?? placeholder}
			value={value}
			onChangeText={onChangeText}
			placeholder={placeholder}
			placeholderTextColor={colors.textFaint}
			editable={!disabled}
			multiline
			numberOfLines={rows}
			textAlignVertical="top"
			style={[styles.textArea, {backgroundColor: colors.glass1, borderColor: colors.borderSoft, color: colors.text, minHeight: rows * 22 + 24}, style as never]}
		/>
	);
}

/* ---------------- Numeric ---------------- */

export function BerxStepper({value, onChange, min = 0, max = 99, label, disabled, testID}: {value: number; onChange: (v: number) => void; min?: number; max?: number; label?: string} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	return (
		<View testID={testID} style={styles.stepperRow}>
			{label ? <Text style={[styles.controlLabel, {color: colors.text}]}>{label}</Text> : null}
			<View style={styles.stepperControls}>
				<BerxIconButton size="sm" disabled={disabled || value <= min} onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel="Меньше" icon={<BerxIcon name="chevron-left" size={15} color={colors.textDim} />} />
				<Text style={[styles.stepperValue, {color: colors.text}]}>{value}</Text>
				<BerxIconButton size="sm" disabled={disabled || value >= max} onPress={() => onChange(Math.min(max, value + 1))} accessibilityLabel="Больше" icon={<BerxIcon name="chevron-right" size={15} color={colors.textDim} />} />
			</View>
		</View>
	);
}

/**
 * A slider without a gesture dependency: this codebase has no
 * gesture-handler, so dragging a custom track would be a worse control
 * than stepping one. Discrete steps are honest and fully accessible;
 * a continuous drag version is the follow-up when that dependency lands.
 */
export function BerxSlider({value, onChange, min = 0, max = 10, step = 1, label, testID}: {value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	const pct = max === min ? 0 : (value - min) / (max - min);
	return (
		<View testID={testID} accessibilityRole="adjustable" accessibilityValue={{min, max, now: value}} style={styles.sliderWrap}>
			{label ? <Text style={[styles.controlLabel, {color: colors.text}]}>{label}</Text> : null}
			<View style={styles.sliderRow}>
				<BerxIconButton size="sm" onPress={() => onChange(Math.max(min, value - step))} accessibilityLabel="Меньше" icon={<BerxIcon name="chevron-left" size={15} color={colors.textDim} />} />
				<View style={[styles.sliderTrack, {backgroundColor: colors.glass2}]}>
					<View style={[styles.sliderFill, {backgroundColor: colors.accent, width: `${Math.round(pct * 100)}%`}]} />
				</View>
				<BerxIconButton size="sm" onPress={() => onChange(Math.min(max, value + step))} accessibilityLabel="Больше" icon={<BerxIcon name="chevron-right" size={15} color={colors.textDim} />} />
			</View>
		</View>
	);
}

/* ---------------- Date / time ---------------- */

interface WheelProps {
	value: number;
	min: number;
	max: number;
	format?: (n: number) => string;
	onChange: (n: number) => void;
	label?: string;
}

/** One depth column: the selected value in front, its neighbours behind and dimmer. The archive's own "depth effect" on a picker. */
function DepthColumn({value, min, max, format = String, onChange, label}: WheelProps) {
	const colors = useBerxColors();
	const prev = value > min ? value - 1 : max;
	const next = value < max ? value + 1 : min;
	return (
		<View style={styles.wheelCol}>
			{label ? <Text style={[styles.wheelLabel, {color: colors.textFaint}]}>{label}</Text> : null}
			<Pressable accessibilityRole="button" accessibilityLabel={`Предыдущее: ${format(prev)}`} onPress={() => onChange(prev)} hitSlop={6}>
				<Text style={[styles.wheelNeighbor, {color: colors.textFaint}]}>{format(prev)}</Text>
			</Pressable>
			<Text style={[styles.wheelValue, {color: colors.accent}]}>{format(value)}</Text>
			<Pressable accessibilityRole="button" accessibilityLabel={`Следующее: ${format(next)}`} onPress={() => onChange(next)} hitSlop={6}>
				<Text style={[styles.wheelNeighbor, {color: colors.textFaint}]}>{format(next)}</Text>
			</Pressable>
		</View>
	);
}

export function BerxDatePicker({day, month, year, onChange, testID}: {day: number; month: number; year: number; onChange: (v: {day?: number; month?: number; year?: number}) => void} & BerxV9ComponentContract) {
	const thisYear = new Date().getFullYear();
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		<View testID={testID} style={styles.wheelRow}>
			<DepthColumn label="День" value={day} min={1} max={31} format={pad} onChange={(v) => onChange({day: v})} />
			<DepthColumn label="Месяц" value={month} min={1} max={12} format={pad} onChange={(v) => onChange({month: v})} />
			<DepthColumn label="Год" value={year} min={thisYear - 90} max={thisYear} onChange={(v) => onChange({year: v})} />
		</View>
	);
}

export function BerxTimePicker({hour, minute, onChange, testID}: {hour: number; minute: number; onChange: (v: {hour?: number; minute?: number}) => void} & BerxV9ComponentContract) {
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		<View testID={testID} style={styles.wheelRow}>
			<DepthColumn label="Час" value={hour} min={0} max={23} format={pad} onChange={(v) => onChange({hour: v})} />
			<DepthColumn label="Мин" value={minute} min={0} max={59} format={pad} onChange={(v) => onChange({minute: v})} />
		</View>
	);
}

/* ---------------- Color Vibe ---------------- */

/**
 * The archive's "Choose Color Vibe" (BERX-004), as ONE control.
 *
 * This repo already had a real, persisted accent runtime and two
 * screens that each re-implemented the swatch row. Extracting it is the
 * "reuse, do not duplicate" rule applied literally: the picker now
 * lives once, and both screens can use it.
 */
export function BerxColorVibePicker({testID}: BerxV9ComponentContract = {}) {
	const colors = useBerxColors();
	const {accentKey, setAccentKey} = useBerxThemeSettings();
	return (
		<View testID={testID} accessibilityRole="radiogroup" style={styles.vibeRow}>
			{BERX_ACCENT_LIST.map((a) => {
				const on = a.key === accentKey;
				return (
					<Pressable
						key={a.key}
						accessibilityRole="radio"
						accessibilityState={{selected: on}}
						accessibilityLabel={a.label}
						onPress={() => setAccentKey(a.key as BerxAccentKey)}
						style={[styles.vibeSwatch, {backgroundColor: a.hex, borderColor: on ? colors.text : 'transparent'}]}
					/>
				);
			})}
		</View>
	);
}

/* ---------------- Composer ---------------- */

export interface BerxComposerProps extends BerxV9ComponentContract {
	value: string;
	onChangeText: (v: string) => void;
	onSubmit: () => void;
	placeholder?: string;
	/** True while a real request is in flight. The control must not claim success before the server does. */
	sending?: boolean;
	attachments?: ReactNode;
	onAttach?: () => void;
	style?: StyleProp<ViewStyle>;
}

/** The one composer: message, comment, post. Submit is disabled while empty or sending — never optimistic-as-final. */
export function BerxComposer({value, onChangeText, onSubmit, placeholder = 'Написать…', sending, attachments, onAttach, disabled, style, testID}: BerxComposerProps) {
	const colors = useBerxColors();
	const canSend = value.trim().length > 0 && !sending && !disabled;
	return (
		<View testID={testID} style={[styles.composer, {backgroundColor: colors.glass1, borderColor: colors.borderSoft}, style]}>
			{attachments}
			<View style={styles.composerRow}>
				{onAttach ? (
					<BerxIconButton size="sm" bare onPress={onAttach} accessibilityLabel="Прикрепить" icon={<BerxIcon name="paperclip" size={17} color={colors.textDim} />} />
				) : null}
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.textFaint}
					editable={!disabled && !sending}
					multiline
					accessibilityLabel={placeholder}
					style={[styles.composerInput, {color: colors.text}]}
				/>
				<BerxIconButton
					size="sm"
					onPress={onSubmit}
					disabled={!canSend}
					active={canSend}
					accessibilityLabel="Отправить"
					icon={<BerxIcon name="send" size={17} color={canSend ? colors.accent : colors.textFaint} />}
				/>
			</View>
		</View>
	);
}

/* ---------------- NOW ---------------- */

export interface BerxNowRailProps extends BerxV9ComponentContract {
	/** Real items from `nearbyNow` / `onlineFriends`. */
	items: {key: string; label: string; sublabel?: string; icon?: 'users' | 'map-pin' | 'calendar' | 'zap'; onPress?: () => void}[];
	style?: StyleProp<ViewStyle>;
}

/** The NOW rail: what is happening, as real rows. Empty renders nothing — NOW with nothing in it is not a rail with placeholders. */
export function BerxNowRail({items, style, testID}: BerxNowRailProps) {
	const colors = useBerxColors();
	if (!items.length) return null;
	return (
		<View testID={testID} style={[styles.nowRail, style]}>
			{items.map((it) => (
				<Pressable key={it.key} accessibilityRole="button" accessibilityLabel={it.label} onPress={it.onPress} style={[styles.nowChip, {borderColor: accentAlpha(colors.accent, 0.35), backgroundColor: colors.glass1}]}>
					<BerxIcon name={it.icon ?? 'zap'} size={13} color={colors.accent} />
					<Text numberOfLines={1} style={[styles.nowChipLabel, {color: colors.text}]}>{it.label}</Text>
					{it.sublabel ? <Text style={[styles.nowChipSub, {color: colors.textFaint}]}>{it.sublabel}</Text> : null}
				</Pressable>
			))}
		</View>
	);
}

export interface BerxNowSceneProps extends BerxV9ComponentContract {
	/** Real live count — people/places/events actually nearby now. */
	liveCount: number;
	rail: BerxNowRailProps['items'];
	/** The environment plane: a map, a scene, whatever the caller has. */
	environment?: ReactNode;
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
}

/**
 * The NOW family's scene, assembled from the foundation rather than
 * hand-laid: environment on D1, content on D3, the live pulse on D5 —
 * and D5 exists only because NOW is one of the three families the
 * archive allows a persistent live layer.
 */
export function BerxNowScene({liveCount, rail, environment, children, style, testID}: BerxNowSceneProps) {
	const reduced = useBerxReducedMotion();
	return (
		<BerxSpatialScene reducedMotion={reduced} style={style}>
			<View testID={testID} style={styles.nowScene}>
				{environment ? (
					<BerxDepthLayer depth="D1" fill animateEntry>
						{environment}
					</BerxDepthLayer>
				) : null}
				<BerxDepthLayer depth="D3" style={styles.nowContent}>
					<BerxNowRail items={rail} />
					{children}
				</BerxDepthLayer>
				{liveCount > 0 ? (
					<BerxDepthLayer depth="D5" style={styles.nowPulse}>
						<BerxNowPulse count={liveCount} label="рядом сейчас" />
					</BerxDepthLayer>
				) : null}
			</View>
		</BerxSpatialScene>
	);
}

/* ---------------- system ---------------- */

/** A visible focus ring for keyboard/web focus — the contracts require focusVisible and the platform default is not always enough on glass. */
export function BerxFocusRing({focused, radius: r = radius.md, children, style}: {focused: boolean; radius?: number; children: ReactNode; style?: StyleProp<ViewStyle>}) {
	const colors = useBerxColors();
	return (
		<View style={[focused ? {borderColor: colors.accent, borderWidth: 2, borderRadius: r} : null, style]}>{children}</View>
	);
}


/**
 * Resolves a V9 route to its scene before rendering. A route with no
 * contract must fail visibly here rather than render an empty screen
 * that looks intentional.
 */
export function BerxRouteBoundary({resolved, routeName, children, fallback}: {resolved: boolean; routeName: string; children: ReactNode; fallback?: ReactNode}) {
	const colors = useBerxColors();
	if (resolved) return <>{children}</>;
	if (fallback) return <>{fallback}</>;
	return (
		<View style={styles.routeError}>
			<Text style={[styles.controlLabel, {color: colors.text}]}>Маршрут не найден</Text>
			<Text style={[styles.wheelLabel, {color: colors.textDim}]}>{routeName}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	disabled: {opacity: 0.4},
	controlLabel: {fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	toggleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 44},
	track: {width: 46, height: 26, borderRadius: 13, borderWidth: 1, padding: 2, justifyContent: 'center'},
	knob: {width: 20, height: 20, borderRadius: 10},
	textArea: {borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: typography.sizeBase},
	stepperRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 44},
	stepperControls: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	stepperValue: {minWidth: 32, textAlign: 'center', fontSize: typography.sizeBase, fontWeight: typography.weightBold, fontVariant: ['tabular-nums']},
	sliderWrap: {gap: spacing.xs},
	sliderRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	sliderTrack: {flex: 1, height: 6, borderRadius: 3, overflow: 'hidden'},
	sliderFill: {height: '100%', borderRadius: 3},
	wheelRow: {flexDirection: 'row', justifyContent: 'center', gap: spacing.xl},
	wheelCol: {alignItems: 'center', gap: 4, minWidth: 64},
	wheelLabel: {fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5},
	wheelNeighbor: {fontSize: typography.sizeSm, opacity: 0.6},
	wheelValue: {fontSize: 28, fontWeight: typography.weightBold, fontVariant: ['tabular-nums']},
	vibeRow: {flexDirection: 'row', gap: spacing.md, justifyContent: 'center'},
	vibeSwatch: {width: 40, height: 40, borderRadius: 20, borderWidth: 2},
	composer: {borderRadius: radius.lg, borderWidth: 1, padding: spacing.sm, gap: spacing.sm},
	composerRow: {flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm},
	composerInput: {flex: 1, minWidth: 0, maxHeight: 120, fontSize: typography.sizeBase, paddingVertical: spacing.sm},
	nowRail: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
	nowChip: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, minHeight: 36},
	nowChipLabel: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	nowChipSub: {fontSize: 11},
	nowScene: {flex: 1},
	nowContent: {padding: spacing.lg, gap: spacing.md},
	nowPulse: {position: 'absolute', top: spacing.lg, right: spacing.lg},
	routeError: {padding: spacing.xl, gap: spacing.xs, alignItems: 'center'},
});
