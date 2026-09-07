/**
 * BERX V9 OVERLAYS — sheets, modals, transient feedback, safety.
 *
 * Every one of these is a named V9 component contract with real backing
 * in this repository's API (submitReport, blockUser, muteUser,
 * likePost), so they are CREATE, not DEFER. They share the V9 component
 * contract and the seven states, and they all rise from depth rather
 * than appearing — an overlay is a nearer plane, not a new screen.
 */
import {useEffect, useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, Text, Pressable, Modal, StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, withSpring} from 'react-native-reanimated';
import {useBerxColors, useBerxGlass} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {spacing, typography, radius} from '../tokens';
import {BERX_MOTION, reduce} from '../animation/motion';
import {BerxIcon} from '../icons/BerxIcon';
import type {BerxIconName} from '../icons/geometry';
import {useBerxReducedMotion} from './BerxBoundaries';
import {depthShadowV9} from './depth';
import type {BerxV9ComponentContract} from './componentRegistry';

/* ---------------- Sheet / Modal / Popover ---------------- */

export interface BerxSheetProps extends BerxV9ComponentContract {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}

/** A sheet rises from below on the SPATIAL tier; under reduced motion it cross-fades instead, keeping the hierarchy without the travel. */
export function BerxSheet({visible, onClose, title, children, style, testID, accessibilityLabel}: BerxSheetProps) {
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const reduced = useBerxReducedMotion();
	const t = useSharedValue(0);
	useEffect(() => {
		t.value = reduced
			? withTiming(visible ? 1 : 0, {duration: reduce(BERX_MOTION.standard, true)})
			: withSpring(visible ? 1 : 0, BERX_MOTION.spatial.spring);
	}, [visible, reduced, t]);
	const panel = useAnimatedStyle(() => ({
		opacity: t.value,
		transform: [{translateY: reduced ? 0 : (1 - t.value) * 380}],
	}), [t, reduced]);
	const scrim = useAnimatedStyle(() => ({opacity: t.value * 0.6}), [t]);

	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={onClose} testID={testID}>
			<Animated.View style={[StyleSheet.absoluteFillObject, {backgroundColor: colors.mediaScrim}, scrim]}>
				<Pressable accessibilityRole="button" accessibilityLabel="Закрыть" style={StyleSheet.absoluteFillObject} onPress={onClose} />
			</Animated.View>
			<View style={styles.sheetHost} pointerEvents="box-none">
				<Animated.View
					accessibilityViewIsModal
					accessibilityLabel={accessibilityLabel ?? title}
					style={[styles.sheet, {backgroundColor: glass[4].fill, borderColor: glass[4].border}, depthShadowV9('D5', colors.mediaScrim), panel, style]}>
					<View style={[styles.grabber, {backgroundColor: colors.borderStrong}]} />
					{title ? <Text style={[styles.sheetTitle, {color: colors.text}]}>{title}</Text> : null}
					{children}
				</Animated.View>
			</View>
		</Modal>
	);
}

export interface BerxModalProps extends BerxSheetProps {}

/** A modal arrives from depth (scale) rather than from below — a decision, not a drawer. */
export function BerxModal({visible, onClose, title, children, style, testID, accessibilityLabel}: BerxModalProps) {
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const reduced = useBerxReducedMotion();
	const t = useSharedValue(0);
	useEffect(() => {
		t.value = reduced ? withTiming(visible ? 1 : 0, {duration: reduce(BERX_MOTION.standard, true)}) : withSpring(visible ? 1 : 0, BERX_MOTION.spatial.spring);
	}, [visible, reduced, t]);
	const panel = useAnimatedStyle(() => ({opacity: t.value, transform: [{perspective: 1200}, {scale: reduced ? 1 : 0.86 + t.value * 0.14}]}), [t, reduced]);
	const scrim = useAnimatedStyle(() => ({opacity: t.value * 0.66}), [t]);
	return (
		<Modal visible={visible} transparent animationType="none" onRequestClose={onClose} testID={testID}>
			<Animated.View style={[StyleSheet.absoluteFillObject, {backgroundColor: colors.mediaScrim}, scrim]}>
				<Pressable accessibilityRole="button" accessibilityLabel="Закрыть" style={StyleSheet.absoluteFillObject} onPress={onClose} />
			</Animated.View>
			<View style={styles.modalHost} pointerEvents="box-none">
				<Animated.View
					accessibilityViewIsModal
					accessibilityLabel={accessibilityLabel ?? title}
					style={[styles.modal, {backgroundColor: glass[4].fill, borderColor: glass[4].border}, depthShadowV9('D5', colors.mediaScrim), panel, style]}>
					{title ? <Text style={[styles.sheetTitle, {color: colors.text}]}>{title}</Text> : null}
					{children}
				</Animated.View>
			</View>
		</Modal>
	);
}


/* ---------------- Transient feedback ---------------- */

export type BerxToastTone = 'neutral' | 'success' | 'error';

export interface BerxToastProps extends BerxV9ComponentContract {
	visible: boolean;
	message: string;
	tone?: BerxToastTone;
	/** Auto-dismiss after this long. Errors default to staying until dismissed. */
	durationMs?: number;
	onDismiss?: () => void;
	action?: {label: string; onPress: () => void};
	style?: StyleProp<ViewStyle>;
}

/** Transient confirmation that never blocks. An error toast does not auto-dismiss by default — a failure the user did not see is a failure they cannot act on. */
export function BerxToast({visible, message, tone = 'neutral', durationMs, onDismiss, action, style, testID}: BerxToastProps) {
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const reduced = useBerxReducedMotion();
	const t = useSharedValue(0);
	useEffect(() => {
		t.value = reduced ? withTiming(visible ? 1 : 0, {duration: reduce(BERX_MOTION.fast, true)}) : withSpring(visible ? 1 : 0, BERX_MOTION.fast.spring);
	}, [visible, reduced, t]);
	useEffect(() => {
		if (!visible || !onDismiss) return;
		const ms = durationMs ?? (tone === 'error' ? 0 : 3200);
		if (ms <= 0) return;
		const id = setTimeout(onDismiss, ms);
		return () => clearTimeout(id);
	}, [visible, durationMs, tone, onDismiss]);
	const style2 = useAnimatedStyle(() => ({opacity: t.value, transform: [{translateY: (1 - t.value) * (reduced ? 0 : 20)}]}), [t, reduced]);
	if (!visible) return null;
	const accent = tone === 'success' ? colors.success : tone === 'error' ? colors.danger : colors.accent;
	return (
		<Animated.View
			testID={testID}
			accessibilityLiveRegion="polite"
			accessibilityRole="alert"
			style={[styles.toast, {backgroundColor: glass[4].fill, borderColor: accentAlpha(accent, 0.5)}, depthShadowV9('D5', colors.mediaScrim), style2, style]}>
			<View style={[styles.toastDot, {backgroundColor: accent}]} />
			<Text style={[styles.toastText, {color: colors.text}]}>{message}</Text>
			{action ? (
				<Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
					<Text style={[styles.toastAction, {color: accent}]}>{action.label}</Text>
				</Pressable>
			) : null}
		</Animated.View>
	);
}

/** A snackbar is a toast with a required action — the two differ by contract, not by looks. */
export function BerxSnackbar(props: BerxToastProps & {action: {label: string; onPress: () => void}}) {
	return <BerxToast {...props} />;
}

/* ---------------- Menus and pickers ---------------- */

export interface BerxContextMenuItem {
	key: string;
	label: string;
	icon?: BerxIconName;
	destructive?: boolean;
	onPress: () => void;
}

export function BerxContextMenu({visible, onClose, items, testID}: {visible: boolean; onClose: () => void; items: BerxContextMenuItem[]; testID?: string}) {
	const colors = useBerxColors();
	return (
		<BerxSheet visible={visible} onClose={onClose} testID={testID}>
			<View style={styles.menuList}>
				{items.map((it) => (
					<Pressable
						key={it.key}
						accessibilityRole="menuitem"
						accessibilityLabel={it.label}
						onPress={() => {
							onClose();
							it.onPress();
						}}
						style={styles.menuRow}>
						{it.icon ? <BerxIcon name={it.icon} size={17} color={it.destructive ? colors.danger : colors.textDim} /> : null}
						<Text style={[styles.menuLabel, {color: it.destructive ? colors.danger : colors.text}]}>{it.label}</Text>
					</Pressable>
				))}
			</View>
		</BerxSheet>
	);
}

/** Share targets. The caller supplies real destinations; this never invents one. */
export function BerxShareSheet({visible, onClose, targets, testID}: {visible: boolean; onClose: () => void; targets: BerxContextMenuItem[]; testID?: string}) {
	return <BerxContextMenu visible={visible} onClose={onClose} items={targets} testID={testID} />;
}

/* ---------------- Safety ---------------- */

export interface BerxReportSheetProps {
	visible: boolean;
	onClose: () => void;
	/** Real submit — wire to api.submitReport. Must resolve before the sheet reports success. */
	onSubmit: (reason: string) => Promise<void> | void;
	reasons?: {key: string; label: string}[];
	testID?: string;
}

/**
 * The server's REAL reason enum, verbatim (BerxReportReason in
 * packages/api/src/types.ts, backing submitReport()).
 *
 * The first version of this list was written from what a report sheet
 * usually offers — it had `nudity`, `violence` and `false_info`, none of
 * which exist server-side, so three of six choices would have been
 * rejected by the API. Keys must match the enum; only the labels are
 * this file's.
 */
const DEFAULT_REASONS = [
	{key: 'spam', label: 'Спам'},
	{key: 'harassment', label: 'Оскорбления или травля'},
	{key: 'inappropriate_content', label: 'Недопустимый контент'},
	{key: 'fake_profile', label: 'Фейковый профиль'},
	{key: 'underage', label: 'Аккаунт несовершеннолетнего'},
	{key: 'other', label: 'Другое'},
];

/** Report, bound to the real `submitReport` endpoint by its caller. Reasons are UI vocabulary; the server decides what happens. */
export function BerxReportSheet({visible, onClose, onSubmit, reasons = DEFAULT_REASONS, testID}: BerxReportSheetProps) {
	const items = useMemo<BerxContextMenuItem[]>(
		() => reasons.map((r) => ({key: r.key, label: r.label, icon: 'flag' as BerxIconName, onPress: () => void onSubmit(r.key)})),
		[reasons, onSubmit]
	);
	return <BerxContextMenu visible={visible} onClose={onClose} items={items} testID={testID} />;
}

/** Block/mute, bound to the real blockUser/muteUser endpoints by its caller. Destructive actions read as destructive. */
export function BerxBlockSheet({visible, onClose, name, onBlock, onMute, testID}: {visible: boolean; onClose: () => void; name: string; onBlock: () => void; onMute?: () => void; testID?: string}) {
	const items: BerxContextMenuItem[] = [
		...(onMute ? [{key: 'mute', label: `Скрыть ${name}`, icon: 'bell-off' as BerxIconName, onPress: onMute}] : []),
		{key: 'block', label: `Заблокировать ${name}`, icon: 'user-x' as BerxIconName, destructive: true, onPress: onBlock},
	];
	return <BerxContextMenu visible={visible} onClose={onClose} items={items} testID={testID} />;
}

/** A standing safety notice. Not transient — it stays while the condition does. */
export function BerxSafetyBanner({message, onAction, actionLabel, testID}: {message: string; onAction?: () => void; actionLabel?: string; testID?: string}) {
	const colors = useBerxColors();
	return (
		<View testID={testID} accessibilityRole="alert" style={[styles.safety, {borderColor: accentAlpha(colors.warning, 0.5), backgroundColor: accentAlpha(colors.warning, 0.1)}]}>
			<BerxIcon name="shield" size={16} color={colors.warning} />
			<Text style={[styles.safetyText, {color: colors.text}]}>{message}</Text>
			{onAction && actionLabel ? (
				<Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
					<Text style={[styles.toastAction, {color: colors.warning}]}>{actionLabel}</Text>
				</Pressable>
			) : null}
		</View>
	);
}


/* ---------------- Reactions ---------------- */

export interface BerxReactionPickerProps extends BerxV9ComponentContract {
	visible: boolean;
	onPick: (key: string) => void;
	onClose: () => void;
	/** Real reaction vocabulary from the caller's own backend. */
	reactions?: {key: string; icon: BerxIconName; label: string}[];
	style?: StyleProp<ViewStyle>;
}

const DEFAULT_REACTIONS: {key: string; icon: BerxIconName; label: string}[] = [
	{key: 'like', icon: 'heart', label: 'Нравится'},
	{key: 'star', icon: 'star', label: 'Отлично'},
	{key: 'flame', icon: 'flame', label: 'Огонь'},
	{key: 'sparkle', icon: 'sparkles', label: 'Вау'},
];

/** Reactions arrive on a stagger from the anchor, so the row reads as opening rather than appearing. */
export function BerxReactionPicker({visible, onPick, onClose, reactions = DEFAULT_REACTIONS, style, testID}: BerxReactionPickerProps) {
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const reduced = useBerxReducedMotion();
	const t = useSharedValue(0);
	useEffect(() => {
		t.value = reduced ? withTiming(visible ? 1 : 0, {duration: reduce(BERX_MOTION.fast, true)}) : withSpring(visible ? 1 : 0, BERX_MOTION.fast.spring);
	}, [visible, reduced, t]);
	const rowStyle = useAnimatedStyle(() => ({opacity: t.value, transform: [{scale: 0.9 + t.value * 0.1}]}), [t]);
	if (!visible) return null;
	return (
		<>
			<Pressable accessibilityRole="button" accessibilityLabel="Закрыть" style={StyleSheet.absoluteFillObject} onPress={onClose} />
			<Animated.View testID={testID} style={[styles.reactions, {backgroundColor: glass[3].fill, borderColor: glass[3].border}, rowStyle, style]}>
				{reactions.map((r) => (
					<Pressable key={r.key} accessibilityRole="button" accessibilityLabel={r.label} hitSlop={6} onPress={() => {onPick(r.key); onClose();}} style={styles.reactionItem}>
						<BerxIcon name={r.icon} size={20} color={colors.accent} />
					</Pressable>
				))}
			</Animated.View>
		</>
	);
}

const styles = StyleSheet.create({
	sheetHost: {flex: 1, justifyContent: 'flex-end'},
	sheet: {borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl ?? spacing.xl},
	grabber: {alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: spacing.xs},
	sheetTitle: {fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	modalHost: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
	modal: {width: '100%', maxWidth: 420, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md},
	popover: {position: 'absolute', borderRadius: radius.md, borderWidth: 1, padding: spacing.md, minWidth: 180},
	toast: {position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 90, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1},
	toastDot: {width: 7, height: 7, borderRadius: 3.5},
	toastText: {flex: 1, fontSize: typography.sizeSm},
	toastAction: {fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	menuList: {gap: 2},
	menuRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, minHeight: 44},
	menuLabel: {fontSize: typography.sizeBase},
	safety: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1},
	safetyText: {flex: 1, fontSize: typography.sizeSm},
	permission: {padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm},
	permissionReason: {fontSize: typography.sizeSm, lineHeight: typography.sizeSm * 1.4},
	permissionActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.xs},
	reactions: {position: 'absolute', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.pill, borderWidth: 1},
	reactionItem: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
});
