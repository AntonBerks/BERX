/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX GREETING HEADER + EDITORIAL TITLE — the top plane of NOW.
 *
 * The reference set opens every home screen the same way: the user's
 * own small portrait on the left with a two-line greeting beside it,
 * circular glass utility buttons on the right, and then a large
 * two-line editorial headline underneath. BERX takes that composition
 * and makes the headline say something REAL — it is written by the
 * caller from live state (the real daypart, the real number of people
 * actually around), never a static marketing line.
 *
 * The avatar and name are the caller's own real identity. Badges on
 * the utility buttons are real unread counts or nothing at all.
 */
import React, {useMemo} from 'react';
import {View, Text, Image, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius, fonts} from '../tokens';

import {useBerxColors} from '../theme';
import {useBerxInsets} from '../insets';
import {BerxIcon} from '../icons/BerxIcon';
import type {BerxIconName} from '../icons/geometry';
import type {BerxColorTokens} from '../tokens';

export interface BerxHeaderAction {
	key: string;
	glyph?: string;
	icon?: React.ReactNode;
	/** Real unread count. Omitted entirely when there is nothing to badge. */
	badge?: number;
	onPress: () => void;
}

export interface BerxGreetingHeaderProps {
	greeting: string;
	name: string;
	avatarUrl?: string | null;
	onPressIdentity?: () => void;
	actions?: BerxHeaderAction[];
	/** Rendered over a photograph: ink and glass switch to the media set. */
	onMedia?: boolean;
	/**
	 * Whether this header is the topmost thing on its screen and so owns
	 * the status-bar/notch inset. False when something above it already
	 * paid it.
	 */
	topInset?: boolean;
	style?: ViewStyle;
}

export function BerxGreetingHeader({greeting, name, avatarUrl, onPressIdentity, actions = [], onMedia, topInset = true, style}: BerxGreetingHeaderProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	// Real measured inset — see design-system/src/insets.ts for why this
	// exists at all (BERX had no safe-area handling anywhere).
	const insets = useBerxInsets();
	return (
		<View style={[styles.row, topInset && {paddingTop: insets.top}, style]}>
			<Pressable style={styles.identity} onPress={onPressIdentity} disabled={!onPressIdentity}>
				{avatarUrl ? (
					<Image source={{uri: avatarUrl}} style={styles.avatar} />
				) : (
					<View style={[styles.avatar, styles.avatarFallback]}>
						<Text style={styles.avatarInitial}>{(name || 'B').charAt(0).toUpperCase()}</Text>
					</View>
				)}
				<View style={styles.identityText}>
					<Text style={[styles.greeting, onMedia && styles.greetingOnMedia]} numberOfLines={1}>
						{greeting}
					</Text>
					<Text style={[styles.name, onMedia && styles.nameOnMedia]} numberOfLines={1}>
						{name}
					</Text>
				</View>
			</Pressable>
			<View style={styles.actions}>
				{actions.map((a: BerxHeaderAction) => (
					<Pressable key={a.key} style={[styles.actionButton, onMedia && styles.actionButtonOnMedia]} onPress={a.onPress} hitSlop={6}>
						{a.icon ? a.icon : <Text style={styles.actionGlyph}>{a.glyph}</Text>}
						{typeof a.badge === 'number' && a.badge > 0 ? (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{a.badge > 99 ? '99+' : a.badge}</Text>
							</View>
						) : null}
					</Pressable>
				))}
			</View>
		</View>
	);
}

/**
 * The reference set's circular glass utility button, used on its own
 * (outside the greeting row) by screens that have utilities but no
 * greeting — PLACES, EVENTS, COMMUNITIES. Same material and geometry
 * as the header's own actions, so the two never drift apart.
 */
export function BerxCircleButton({
	glyph,
	icon,
	label,
	badge,
	onPress,
}: {
	glyph?: string;
	/** Preferred: a name from the BERX icon family. `glyph` stays for callers not yet migrated. */
	icon?: BerxIconName;
	label?: string;
	badge?: number;
	onPress: () => void;
}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<Pressable style={[styles.circleWrap, label ? styles.circleWrapLabelled : null]} onPress={onPress} hitSlop={6}>
			<View style={styles.actionButton}>
				{icon ? <BerxIcon name={icon} size={18} color={colors.text} /> : <Text style={styles.actionGlyph}>{glyph}</Text>}
				{typeof badge === 'number' && badge > 0 ? (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
					</View>
				) : null}
			</View>
			{label ? <Text style={styles.circleLabel} numberOfLines={1}>{label}</Text> : null}
		</Pressable>
	);
}

/** The large two-line editorial headline the reference set puts under the greeting. Caller supplies real, live copy. */
export function BerxEditorialTitle({
	lines,
	accentIndex,
	topInset = true,
	style,
}: {
	lines: string[];
	accentIndex?: number;
	/**
	 * Whether this title is the topmost thing on its screen and so owns
	 * the status-bar/notch inset. Screens that render a conditional
	 * BerxHeader above it pass `topInset={!onBack}` so the inset is paid
	 * exactly once.
	 */
	topInset?: boolean;
	style?: ViewStyle;
}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const insets = useBerxInsets();
	return (
		<View style={[styles.titleWrap, topInset && {paddingTop: insets.top}, style]}>
			{lines.map((line: string, i: number) => (
				<Text
					key={i}
					numberOfLines={2}
					style={[styles.titleLine, i > 0 && styles.titleSub, i === accentIndex && styles.titleAccent]}>
					{line}
				</Text>
			))}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
		gap: spacing.md,
	},
	circleWrap: {alignItems: 'center', gap: 4},
	circleWrapLabelled: {width: 62},
	circleLabel: {color: colors.textFaint, fontSize: typography.sizeXs},
	identity: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.graphite,
		borderWidth: 2,
		borderColor: colors.accent,
	},
	avatarFallback: {alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft},
	avatarInitial: {color: colors.accent, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	identityText: {flex: 1},
	greeting: {color: colors.textFaint, fontSize: typography.sizeXs},
	greetingOnMedia: {color: colors.onMediaDim},
	nameOnMedia: {color: colors.onMedia},
	actionButtonOnMedia: {backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)'},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightBold, letterSpacing: -0.2},
	actions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	actionButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	actionGlyph: {color: colors.text, fontSize: 16},
	badge: {
		position: 'absolute',
		top: -2,
		right: -2,
		minWidth: 17,
		height: 17,
		paddingHorizontal: 4,
		borderRadius: 9,
		backgroundColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: colors.bg,
	},
	badgeText: {color: colors.onAccent, fontSize: 9, fontWeight: typography.weightBold},
	titleWrap: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs, gap: 1},
	// The screen headline is Instrument Serif, matching the entry
	// sequence. A geometric-sans bold headline is what every competitor
	// ships; the serif is the single change that makes a BERX screen
	// recognisable from across a room.
	titleLine: {
		color: colors.text,
		fontFamily: fonts.display,
		fontSize: 40,
		lineHeight: 43,
		letterSpacing: -0.4,
	},
	/**
	 * The lead line carries the display weight; the lines under it are the
	 * live subtitle. Rendering every line at display size — and painting a
	 * whole cyan sentence across the screen — pushed the photography below
	 * the fold and made the accent shout instead of point.
	 */
	// The subtitle drops back to the interface face: a whole screen set
	// in the display serif reads as a poster, not as a product.
	titleSub: {
		fontFamily: fonts.sans,
		fontSize: typography.sizeBase,
		lineHeight: 20,
		fontWeight: typography.weightMedium,
		letterSpacing: 0,
		color: colors.textDim,
		marginTop: 6,
	},
	titleAccent: {color: colors.accent},
	spacer: {height: radius.sm},
});
