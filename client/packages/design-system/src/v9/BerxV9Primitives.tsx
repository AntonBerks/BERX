/**
 * BERX V9 PRIMITIVES — the most-demanded missing components, built.
 *
 * Ranked by how many of the 300 scene contracts actually declare them
 * (BerxProgressRing 50, BerxMapPin 50, BerxFilterBar 40,
 * BerxSearchField 30, BerxCountdown 20), so this is the batch that
 * unblocks the most scenes rather than the batch that is easiest.
 *
 * Every one takes the shared V9 component contract (depth, material,
 * motion, reducedMotionSafe, testID, accessibilityLabel, disabled),
 * reads its geometry from the foundation, and its colour from the live
 * theme — so each is correct in both environments and on every plane
 * without the caller restating any of it.
 */
import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, withRepeat, Easing} from 'react-native-reanimated';
import Svg, {Circle} from 'react-native-svg';
import {useBerxColors} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {spacing, typography} from '../tokens';
import {BERX_MOTION} from '../animation/motion';
import {BerxIcon} from '../icons/BerxIcon';
import {BerxInput} from '../components/BerxInput';
import {useBerxReducedMotion} from './BerxBoundaries';
import type {BerxV9ComponentContract} from './componentRegistry';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ---------------------------------------------------------------- */

export interface BerxProgressRingProps extends BerxV9ComponentContract {
	/** 0..1. Omit for the indeterminate ring (a real spin, not a fake percentage). */
	progress?: number;
	size?: number;
	strokeWidth?: number;
	label?: string;
	style?: StyleProp<ViewStyle>;
}

/**
 * A real SVG ring. Determinate when given a progress value; when not,
 * it spins rather than inventing a number — an indeterminate wait must
 * not claim to know how far along it is.
 */
export function BerxProgressRing({progress, size = 44, strokeWidth = 3, label, style, testID, accessibilityLabel}: BerxProgressRingProps) {
	const colors = useBerxColors();
	const reduced = useBerxReducedMotion();
	const r = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * r;
	const spin = useSharedValue(0);
	const value = useSharedValue(progress ?? 0);

	useEffect(() => {
		if (progress === undefined) {
			if (!reduced) spin.value = withRepeat(withTiming(1, {duration: BERX_MOTION.ambient.duration / 3, easing: Easing.linear}), -1, false);
			return;
		}
		value.value = withTiming(Math.max(0, Math.min(1, progress)), {duration: BERX_MOTION.standard.duration});
	}, [progress, reduced, spin, value]);

	const arcProps = useAnimatedProps(() => {
		const frac = progress === undefined ? 0.25 : value.value;
		return {strokeDashoffset: circumference * (1 - frac)};
	}, [value, circumference, progress]);

	const spinStyle = useAnimatedStyle(() => ({
		transform: [{rotate: progress === undefined ? `${spin.value * 360}deg` : '-90deg'}],
	}), [spin, progress]);

	return (
		<View testID={testID} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel ?? label} style={[{width: size, height: size}, style]}>
			<Animated.View style={spinStyle}>
				<Svg width={size} height={size}>
					<Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.borderSoft} strokeWidth={strokeWidth} fill="none" />
					<AnimatedCircle
						cx={size / 2}
						cy={size / 2}
						r={r}
						stroke={colors.accent}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						fill="none"
						strokeDasharray={circumference}
						animatedProps={arcProps}
					/>
				</Svg>
			</Animated.View>
			{label ? <Text style={[styles.ringLabel, {color: colors.textDim}]}>{label}</Text> : null}
		</View>
	);
}

/* ---------------------------------------------------------------- */

export interface BerxSearchFieldProps extends BerxV9ComponentContract {
	value: string;
	onChangeText: (v: string) => void;
	placeholder?: string;
	onSubmit?: () => void;
	onClear?: () => void;
	style?: StyleProp<ViewStyle>;
}

/** Search, as one control: the field, its glyph, and a real clear affordance that only exists when there is something to clear. */
export function BerxSearchField({value, onChangeText, placeholder = 'Поиск', onSubmit, onClear, disabled, style, testID, accessibilityLabel}: BerxSearchFieldProps) {
	const colors = useBerxColors();
	return (
		<View testID={testID} style={[styles.searchWrap, {backgroundColor: colors.glass1, borderColor: colors.borderSoft}, style]}>
			<BerxIcon name="search" size={16} color={colors.textFaint} />
			<BerxInput
				accessibilityLabel={accessibilityLabel ?? placeholder}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				editable={!disabled}
				onSubmitEditing={onSubmit}
				returnKeyType="search"
				style={styles.searchInput}
			/>
			{value.length > 0 ? (
				<Pressable accessibilityRole="button" accessibilityLabel="Очистить" hitSlop={8} onPress={() => (onClear ? onClear() : onChangeText(''))}>
					<BerxIcon name="x" size={15} color={colors.textFaint} />
				</Pressable>
			) : null}
		</View>
	);
}

/* ---------------------------------------------------------------- */

export interface BerxFilterOption {
	key: string;
	label: string;
	count?: number;
}

export interface BerxFilterBarProps extends BerxV9ComponentContract {
	options: BerxFilterOption[];
	selected: string | null;
	onSelect: (key: string | null) => void;
	/** Allow clearing by re-tapping the active filter. */
	clearable?: boolean;
	style?: StyleProp<ViewStyle>;
}

/** A row of real filters. Selected reads as SELECTED (accent ink, accent-tinted fill), never as merely hovered — the state distinction the icon system already makes. */
export function BerxFilterBar({options, selected, onSelect, clearable = true, disabled, style, testID}: BerxFilterBarProps) {
	const colors = useBerxColors();
	return (
		<View testID={testID} style={[styles.filterRow, style]}>
			{options.map((o) => {
				const on = o.key === selected;
				return (
					<Pressable
						key={o.key}
						accessibilityRole="button"
						accessibilityState={{selected: on, disabled: !!disabled}}
						disabled={disabled}
						onPress={() => onSelect(on && clearable ? null : o.key)}
						style={[
							styles.filterChip,
							{borderColor: on ? colors.accent : colors.borderSoft, backgroundColor: on ? accentAlpha(colors.accent, 0.14) : colors.glass1},
						]}>
						<Text style={[styles.filterLabel, {color: on ? colors.accent : colors.textDim}]}>
							{o.label}
							{o.count !== undefined ? ` · ${o.count}` : ''}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

/* ---------------------------------------------------------------- */

export interface BerxCountdownProps extends BerxV9ComponentContract {
	/** The real event time. */
	target: Date | string | number;
	/** Rendered once the target has passed. */
	pastLabel?: string;
	style?: StyleProp<ViewStyle>;
}

/**
 * A real countdown to a real timestamp. Ticks once a second only while
 * it is showing seconds; below that it ticks per minute, because a
 * component that wakes 60 times a minute to redraw "3 дня" is a
 * performance bug wearing a feature's clothes.
 */
export function BerxCountdown({target, pastLabel = 'Уже идёт', style, testID}: BerxCountdownProps) {
	const colors = useBerxColors();
	const targetMs = useMemo(() => new Date(target).getTime(), [target]);
	const [now, setNow] = useState(() => Date.now());
	const left = targetMs - now;
	const underAnHour = left > 0 && left < 3600_000;

	useEffect(() => {
		if (left <= 0) return;
		const period = underAnHour ? 1000 : 60_000;
		const id = setInterval(() => setNow(Date.now()), period);
		return () => clearInterval(id);
	}, [left, underAnHour]);

	if (left <= 0) return <Text testID={testID} style={[styles.countdown, {color: colors.accent}, style as never]}>{pastLabel}</Text>;

	const d = Math.floor(left / 86400_000);
	const h = Math.floor((left % 86400_000) / 3600_000);
	const m = Math.floor((left % 3600_000) / 60_000);
	const s = Math.floor((left % 60_000) / 1000);
	const text = d > 0 ? `${d} д ${h} ч` : h > 0 ? `${h} ч ${m} мин` : `${m}:${String(s).padStart(2, '0')}`;

	return (
		<Text testID={testID} accessibilityLabel={`Осталось ${text}`} style={[styles.countdown, {color: colors.accent}, style as never]}>
			{text}
		</Text>
	);
}

/* ---------------------------------------------------------------- */

export interface BerxMapPinProps extends BerxV9ComponentContract {
	label?: string;
	/** The pin for the viewer's own position reads differently from a place pin. */
	self?: boolean;
	active?: boolean;
	onPress?: () => void;
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
}

/** A pin on the spatial map. `self` pulses (a live signal); a place pin does not, because only presence is live. */
export function BerxMapPin({label, self = false, active = false, onPress, children, style, testID, accessibilityLabel}: BerxMapPinProps) {
	const colors = useBerxColors();
	const reduced = useBerxReducedMotion();
	const pulse = useSharedValue(0);
	useEffect(() => {
		if (!self || reduced) return;
		pulse.value = withRepeat(withTiming(1, {duration: BERX_MOTION.ambient.duration / 2, easing: Easing.out(Easing.quad)}), -1, false);
	}, [self, reduced, pulse]);
	const ringStyle = useAnimatedStyle(() => ({opacity: (1 - pulse.value) * 0.6, transform: [{scale: 1 + pulse.value * 1.6}]}), [pulse]);

	return (
		<Pressable
			testID={testID}
			accessibilityRole={onPress ? 'button' : 'image'}
			accessibilityLabel={accessibilityLabel ?? label}
			disabled={!onPress}
			onPress={onPress}
			style={[styles.pinWrap, style]}>
			{self ? <Animated.View pointerEvents="none" style={[styles.pinRing, {borderColor: colors.accent}, ringStyle]} /> : null}
			<View style={[styles.pin, {backgroundColor: active || self ? colors.accent : colors.glass3, borderColor: colors.accent}]}>
				{children ?? <BerxIcon name="map-pin" size={13} color={active || self ? colors.onAccent : colors.accent} />}
			</View>
			{label ? <Text numberOfLines={1} style={[styles.pinLabel, {color: colors.onMedia}]}>{label}</Text> : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	ringLabel: {position: 'absolute', alignSelf: 'center', top: '50%', fontSize: typography.sizeXs, fontVariant: ['tabular-nums']},
	searchWrap: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999, borderWidth: 1},
	searchInput: {flex: 1, minWidth: 0, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0},
	filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	filterChip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999, borderWidth: 1},
	filterLabel: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	countdown: {fontSize: typography.sizeSm, fontWeight: typography.weightBold, fontVariant: ['tabular-nums']},
	pinWrap: {alignItems: 'center', gap: 3},
	pinRing: {position: 'absolute', top: 0, width: 26, height: 26, borderRadius: 13, borderWidth: 1.5},
	pin: {width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	pinLabel: {fontSize: 10, fontWeight: typography.weightMedium, maxWidth: 72},
});
