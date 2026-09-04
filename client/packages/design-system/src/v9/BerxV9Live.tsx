/**
 * BERX V9 LIVE / D5 — the energy layer, and the messaging primitives.
 *
 * D5 is the archive's own "cyan energy, live pulse, focus feedback",
 * and its rule is strict: "D5 only when state changes" / "No floating
 * object should exist without hierarchy or interaction meaning." So
 * every component here is bound to something REAL — a live presence
 * count, a real typing status, a real unread state. None of them
 * animates to look alive while representing nothing.
 *
 * The families that may hold a persistent D5 are the three whose
 * subject genuinely is live: NOW, MESSAGES, EVENTS (see families.ts).
 */
import {useEffect, useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing} from 'react-native-reanimated';
import {useBerxColors} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {spacing, typography, radius} from '../tokens';
import {BERX_MOTION} from '../animation/motion';
import {BerxAvatar} from '../components/BerxAvatar';
import {useBerxReducedMotion} from './BerxBoundaries';
import type {BerxV9ComponentContract} from './componentRegistry';

/* ------------------------------------------------------------------ *
 * D5 ENERGY
 * ------------------------------------------------------------------ */

export interface BerxNowPulseProps extends BerxV9ComponentContract {
	/** The real count this pulse represents — people nearby, live events. A pulse with nothing behind it must not render. */
	count: number;
	label?: string;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
}

/** The NOW signal: a real number with a pulse whose rate does not vary, so it reads as a heartbeat rather than as urgency theatre. */
export function BerxNowPulse({count, label, onPress, style, testID, accessibilityLabel}: BerxNowPulseProps) {
	const colors = useBerxColors();
	const reduced = useBerxReducedMotion();
	const beat = useSharedValue(0);
	useEffect(() => {
		if (reduced || count <= 0) return;
		beat.value = withRepeat(
			withSequence(withTiming(1, {duration: 900, easing: Easing.out(Easing.quad)}), withTiming(0, {duration: 900, easing: Easing.in(Easing.quad)})),
			-1,
			false
		);
	}, [reduced, count, beat]);
	const dotStyle = useAnimatedStyle(() => ({transform: [{scale: 1 + beat.value * 0.35}], opacity: 0.7 + beat.value * 0.3}), [beat]);

	if (count <= 0) return null;

	const body = (
		<View style={[styles.pulseRow, {borderColor: accentAlpha(colors.accent, 0.4), backgroundColor: accentAlpha(colors.accent, 0.1)}, style]}>
			<Animated.View style={[styles.pulseDot, {backgroundColor: colors.accent}, dotStyle]} />
			<Text style={[styles.pulseText, {color: colors.accent}]}>
				{count}
				{label ? ` ${label}` : ''}
			</Text>
		</View>
	);
	return onPress ? (
		<Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress}>
			{body}
		</Pressable>
	) : (
		<View testID={testID} accessibilityLabel={accessibilityLabel ?? label}>{body}</View>
	);
}

export interface BerxEnergyHaloProps extends BerxV9ComponentContract {
	children: ReactNode;
	/** 0..1 — how much live energy this object currently carries. 0 renders no halo at all. */
	energy: number;
	size?: number;
	style?: StyleProp<ViewStyle>;
}

/**
 * The D5 halo around an object that is genuinely live. `energy` is a
 * real measured quantity from the caller (attendance, activity), not a
 * decoration knob: at 0 there is no halo, because an object with no
 * live state must not glow.
 */
export function BerxEnergyHalo({children, energy, size = 999, style, testID}: BerxEnergyHaloProps) {
	const colors = useBerxColors();
	const reduced = useBerxReducedMotion();
	const breath = useSharedValue(0);
	const e = Math.max(0, Math.min(1, energy));
	useEffect(() => {
		if (reduced || e <= 0) return;
		breath.value = withRepeat(withTiming(1, {duration: BERX_MOTION.ambient.duration / 2, easing: Easing.inOut(Easing.sin)}), -1, true);
	}, [reduced, e, breath]);
	const haloStyle = useAnimatedStyle(() => ({
		opacity: e * (0.35 + breath.value * 0.35),
		transform: [{scale: 1 + breath.value * 0.04}],
	}), [breath, e]);

	return (
		<View testID={testID} style={style}>
			{e > 0 ? (
				<Animated.View
					pointerEvents="none"
					style={[
						StyleSheet.absoluteFillObject,
						{borderRadius: size, shadowColor: colors.accent, shadowOpacity: 0.9, shadowRadius: 18 * e, shadowOffset: {width: 0, height: 0}, elevation: Math.round(8 * e)},
						haloStyle,
					]}
				/>
			) : null}
			{children}
		</View>
	);
}

/* ------------------------------------------------------------------ *
 * MESSAGING
 * ------------------------------------------------------------------ */

export interface BerxTypingIndicatorProps extends BerxV9ComponentContract {
	/** Real names from the real typing status endpoint. Empty renders nothing. */
	names: string[];
	style?: StyleProp<ViewStyle>;
}

/** Three dots on a real stagger, shown only while someone is actually typing. */
export function BerxTypingIndicator({names, style, testID}: BerxTypingIndicatorProps) {
	const colors = useBerxColors();
	const reduced = useBerxReducedMotion();
	const t = useSharedValue(0);
	useEffect(() => {
		if (reduced || names.length === 0) return;
		t.value = withRepeat(withTiming(1, {duration: 900, easing: Easing.inOut(Easing.sin)}), -1, true);
	}, [reduced, names.length, t]);

	// Three explicit hooks rather than a loop: hooks must not be called
	// from a helper invoked N times, even when N is constant.
	const d0 = useAnimatedStyle(() => {
		const p = t.value % 1;
		return {opacity: 0.35 + Math.sin(p * Math.PI) * 0.65, transform: [{translateY: -Math.sin(p * Math.PI) * 2}]};
	}, [t]);
	const d1 = useAnimatedStyle(() => {
		const p = (t.value + 0.33) % 1;
		return {opacity: 0.35 + Math.sin(p * Math.PI) * 0.65, transform: [{translateY: -Math.sin(p * Math.PI) * 2}]};
	}, [t]);
	const d2 = useAnimatedStyle(() => {
		const p = (t.value + 0.66) % 1;
		return {opacity: 0.35 + Math.sin(p * Math.PI) * 0.65, transform: [{translateY: -Math.sin(p * Math.PI) * 2}]};
	}, [t]);
	if (names.length === 0) return null;

	const who = names.length === 1 ? `${names[0]} печатает` : `${names.length} человека печатают`;
	return (
		<View testID={testID} accessibilityLabel={who} style={[styles.typingRow, style]}>
			{[d0, d1, d2].map((s, i) => (
				<Animated.View key={i} style={[styles.typingDot, {backgroundColor: colors.textDim}, s]} />
			))}
			<Text style={[styles.typingText, {color: colors.textFaint}]}>{who}</Text>
		</View>
	);
}

export interface BerxMessageBubbleProps extends BerxV9ComponentContract {
	text: string;
	mine: boolean;
	timeLabel?: string;
	/** Real delivery state from the server, never optimistic-as-final. */
	pending?: boolean;
	failed?: boolean;
	onRetry?: () => void;
	style?: StyleProp<ViewStyle>;
}

/**
 * One message. Ink on my own bubble comes from `onAccent` because it
 * sits on an accent fill — the rule the Day rebuild made unavoidable
 * (a bubble that reads in Night and vanishes in Day is a real bug this
 * codebase already hit and fixed).
 */
export function BerxMessageBubble({text, mine, timeLabel, pending, failed, onRetry, style, testID}: BerxMessageBubbleProps) {
	const colors = useBerxColors();
	const ink = mine ? colors.onAccent : colors.text;
	const meta = mine ? accentAlpha(colors.onAccent, 0.72) : colors.textFaint;
	return (
		<View
			testID={testID}
			style={[
				styles.bubble,
				mine ? {alignSelf: 'flex-end', backgroundColor: colors.accent} : {alignSelf: 'flex-start', backgroundColor: colors.glass2, borderColor: colors.borderSoft, borderWidth: 1},
				pending ? styles.bubblePending : null,
				style,
			]}>
			<Text style={[styles.bubbleText, {color: ink}]}>{text}</Text>
			<View style={styles.bubbleMeta}>
				{timeLabel ? <Text style={[styles.bubbleTime, {color: meta}]}>{timeLabel}</Text> : null}
				{pending ? <Text style={[styles.bubbleTime, {color: meta}]}>отправляется…</Text> : null}
				{failed ? (
					<Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
						<Text style={[styles.bubbleTime, {color: colors.danger}]}>не отправлено · повторить</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

export interface BerxChatRowProps extends BerxV9ComponentContract {
	name: string;
	preview: string;
	timeLabel?: string;
	iconUrl?: string | null;
	unread?: number;
	online?: boolean;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
}

/** One conversation in the list. Unread is a real count from the server, and it is the only thing here allowed to carry accent. */
export function BerxChatRow({name, preview, timeLabel, iconUrl, unread = 0, online, onPress, style, testID}: BerxChatRowProps) {
	const colors = useBerxColors();
	const label = useMemo(() => (unread > 0 ? `${name}, ${unread} непрочитанных` : name), [name, unread]);
	return (
		<Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.chatRow, style]}>
			<BerxAvatar iconUrl={iconUrl ?? null} fallbackInitial={name.charAt(0)} size={44} />
			{online ? <View style={[styles.onlineDot, {backgroundColor: colors.accent, borderColor: colors.bg}]} /> : null}
			<View style={styles.chatBody}>
				<View style={styles.chatTop}>
					<Text numberOfLines={1} style={[styles.chatName, {color: colors.text}]}>{name}</Text>
					{timeLabel ? <Text style={[styles.chatTime, {color: colors.textFaint}]}>{timeLabel}</Text> : null}
				</View>
				<Text numberOfLines={1} style={[styles.chatPreview, {color: unread > 0 ? colors.text : colors.textDim}]}>{preview}</Text>
			</View>
			{unread > 0 ? (
				<View style={[styles.unread, {backgroundColor: colors.accent}]}>
					<Text style={[styles.unreadText, {color: colors.onAccent}]}>{unread > 99 ? '99+' : unread}</Text>
				</View>
			) : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pulseRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999, borderWidth: 1},
	pulseDot: {width: 7, height: 7, borderRadius: 3.5},
	pulseText: {fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	typingRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
	typingDot: {width: 5, height: 5, borderRadius: 2.5},
	typingText: {fontSize: typography.sizeXs, marginLeft: spacing.xs},
	bubble: {maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg, gap: 2},
	bubblePending: {opacity: 0.7},
	bubbleText: {fontSize: typography.sizeBase, lineHeight: typography.sizeBase * 1.35},
	bubbleMeta: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	bubbleTime: {fontSize: typography.sizeXs},
	chatRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg},
	onlineDot: {position: 'absolute', left: spacing.lg + 32, top: '50%', width: 11, height: 11, borderRadius: 6, borderWidth: 2},
	chatBody: {flex: 1, minWidth: 0, gap: 2},
	chatTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	chatName: {flex: 1, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	chatTime: {fontSize: typography.sizeXs},
	chatPreview: {fontSize: typography.sizeSm},
	unread: {minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5},
	unreadText: {fontSize: 11, fontWeight: typography.weightBold},
});
