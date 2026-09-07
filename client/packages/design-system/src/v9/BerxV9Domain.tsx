/**
 * BERX V9 DOMAIN COMPONENTS — the objects BERX is actually about.
 *
 * PEOPLE, PLACES, EVENTS, EXPERIENCES, TRIPS, COLLECTIONS, COMMUNITIES,
 * BUSINESS, CREATOR, REWARDS — every one of these has a real endpoint
 * behind it in this repository (getPlace, placeHours, placeReviews,
 * getEvent, rsvpEvent, experiences, getTrip, collections, communities,
 * businessDashboard, getCreatorProfile, pointsBalance), which is why
 * they are CREATE and not DEFER.
 *
 * They take real domain values as props and render real states. None of
 * them fetches, and none invents a field: a card shows what its caller
 * actually has, and says nothing where the server said nothing.
 */
import type {ReactNode} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import {useBerxColors} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {spacing, typography, radius} from '../tokens';
import {BerxIcon} from '../icons/BerxIcon';
import type {BerxIconName} from '../icons/geometry';
import {BerxGlassView} from '../components/BerxGlassView';
import {depthShadowV9} from './depth';
import type {BerxV9ComponentContract} from './componentRegistry';

/* ---------------- shared card shell ---------------- */

interface ShellProps extends BerxV9ComponentContract {
	onPress?: () => void;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}

/** One card shell so twelve cards cannot drift apart in radius, padding, glass or press behaviour. */
function CardShell({onPress, children, style, testID, accessibilityLabel, disabled}: ShellProps) {
	const colors = useBerxColors();
	const body = (
		<View style={[styles.card, depthShadowV9('D3', colors.mediaScrim), style]}>
			<BerxGlassView radius={radius.lg} style={styles.cardGlass}>
				{children}
			</BerxGlassView>
		</View>
	);
	if (!onPress) return <View testID={testID} accessibilityLabel={accessibilityLabel}>{body}</View>;
	return (
		<Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{disabled: !!disabled}} disabled={disabled} onPress={onPress}>
			{body}
		</Pressable>
	);
}

/* ---------------- identity ---------------- */

/** Server-verified only. This badge must never be decorative. */
export function BerxVerifiedBadge({size = 14, label = 'Подтверждён', testID}: {size?: number; label?: string; testID?: string}) {
	const colors = useBerxColors();
	return (
		<View testID={testID} accessibilityLabel={label} style={styles.inlineBadge}>
			<BerxIcon name="badge-check" size={size} color={colors.accent} filled />
		</View>
	);
}

/** Real level from the reputation/points system (pointsBalance). Shows a number the server gave, never a computed guess. */
export function BerxLevelBadge({level, label = 'Уровень', testID}: {level: number; label?: string; testID?: string}) {
	const colors = useBerxColors();
	return (
		<View testID={testID} accessibilityLabel={`${label} ${level}`} style={[styles.levelBadge, {borderColor: accentAlpha(colors.accent, 0.5), backgroundColor: accentAlpha(colors.accent, 0.12)}]}>
			<Text style={[styles.levelText, {color: colors.accent}]}>{level}</Text>
		</View>
	);
}

/* ---------------- place ---------------- */

export interface BerxPlaceHeroProps extends BerxV9ComponentContract {
	title: string;
	coverUrl?: string | null;
	category?: string | null;
	distanceLabel?: string | null;
	openNow?: boolean | null;
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
}

/** The D2 plane of a place scene: the photograph is the subject; everything else is on-media ink over its scrim. */
export function BerxPlaceHero({title, coverUrl, category, distanceLabel, openNow, children, style, testID}: BerxPlaceHeroProps) {
	const colors = useBerxColors();
	return (
		<View testID={testID} style={[styles.hero, {backgroundColor: colors.mediaScrim}, style]}>
			{coverUrl ? <Image source={{uri: coverUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
			<View style={[StyleSheet.absoluteFillObject, {backgroundColor: colors.mediaScrim, opacity: 0.42}]} />
			<View style={styles.heroBody}>
				{category ? <Text style={[styles.heroEyebrow, {color: colors.accentOnMedia}]}>{category.toUpperCase()}</Text> : null}
				<Text style={[styles.heroTitle, {color: colors.onMedia}]}>{title}</Text>
				<View style={styles.heroMetaRow}>
					{distanceLabel ? <Text style={[styles.heroMeta, {color: colors.onMediaDim}]}>{distanceLabel}</Text> : null}
					{openNow !== null && openNow !== undefined ? (
						<Text style={[styles.heroMeta, {color: openNow ? colors.success : colors.onMediaFaint}]}>{openNow ? 'Открыто' : 'Закрыто'}</Text>
					) : null}
				</View>
				{children}
			</View>
		</View>
	);
}

export interface BerxPlaceHoursProps extends BerxV9ComponentContract {
	/** Real rows from `placeHours`. An empty list renders the honest "hours unknown", never invented hours. */
	hours: {day: string; opens?: string | null; closes?: string | null; closed?: boolean}[];
	todayIndex?: number;
	style?: StyleProp<ViewStyle>;
}

export function BerxPlaceHours({hours, todayIndex, style, testID}: BerxPlaceHoursProps) {
	const colors = useBerxColors();
	if (!hours.length) {
		return <Text testID={testID} style={[styles.meta, {color: colors.textFaint}]}>Часы работы не указаны</Text>;
	}
	return (
		<View testID={testID} style={[styles.hoursList, style]}>
			{hours.map((h, i) => {
				const today = i === todayIndex;
				return (
					<View key={h.day} style={styles.hoursRow}>
						<Text style={[styles.hoursDay, {color: today ? colors.text : colors.textDim, fontWeight: today ? typography.weightBold : typography.weightMedium}]}>{h.day}</Text>
						<Text style={[styles.hoursValue, {color: today ? colors.text : colors.textDim}]}>
							{h.closed || !h.opens ? 'Закрыто' : `${h.opens}–${h.closes ?? ''}`}
						</Text>
					</View>
				);
			})}
		</View>
	);
}

/** A rating shown only when the server actually has one. `count` 0 renders the honest "no reviews yet". */
export function BerxPlaceRating({rating, count, style, testID}: {rating: number | null; count: number; style?: StyleProp<ViewStyle>; testID?: string} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	if (rating === null || count === 0) {
		return <Text testID={testID} style={[styles.meta, {color: colors.textFaint}]}>Оценок пока нет</Text>;
	}
	return (
		<View testID={testID} accessibilityLabel={`Рейтинг ${rating.toFixed(1)} из 5, ${count} оценок`} style={[styles.ratingRow, style]}>
			<BerxIcon name="star" size={14} color={colors.accent} filled />
			<Text style={[styles.ratingValue, {color: colors.text}]}>{rating.toFixed(1)}</Text>
			<Text style={[styles.meta, {color: colors.textFaint}]}>· {count}</Text>
		</View>
	);
}

/* ---------------- event ---------------- */

export interface BerxEventHeroProps extends BerxV9ComponentContract {
	title: string;
	coverUrl?: string | null;
	whenLabel: string;
	placeLabel?: string | null;
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
}

export function BerxEventHero({title, coverUrl, whenLabel, placeLabel, children, style, testID}: BerxEventHeroProps) {
	const colors = useBerxColors();
	return (
		<View testID={testID} style={[styles.hero, {backgroundColor: colors.mediaScrim}, style]}>
			{coverUrl ? <Image source={{uri: coverUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
			<View style={[StyleSheet.absoluteFillObject, {backgroundColor: colors.mediaScrim, opacity: 0.45}]} />
			<View style={styles.heroBody}>
				<Text style={[styles.heroTitle, {color: colors.onMedia}]}>{title}</Text>
				<View style={styles.heroMetaRow}>
					<Text style={[styles.heroMeta, {color: colors.onMediaDim}]}>{whenLabel}</Text>
					{placeLabel ? (
						<View style={styles.inlineRow}>
							<BerxIcon name="map-pin" size={12} color={colors.onMediaDim} />
							<Text style={[styles.heroMeta, {color: colors.accentOnMedia}]}>{placeLabel}</Text>
						</View>
					) : null}
				</View>
				{children}
			</View>
		</View>
	);
}

/**
 * A ticket for a real RSVP. `seatsLeft` is the server's number — null
 * means unlimited/unknown and renders nothing rather than a guess.
 */
export function BerxTicket({eventTitle, whenLabel, going, seatsLeft, onToggle, busy, testID}: {eventTitle: string; whenLabel: string; going: boolean; seatsLeft: number | null; onToggle: () => void; busy?: boolean; testID?: string} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	return (
		<CardShell testID={testID} accessibilityLabel={`${eventTitle}, ${going ? 'вы идёте' : 'не идёте'}`}>
			<View style={styles.ticketRow}>
				<View style={styles.ticketBody}>
					<Text numberOfLines={1} style={[styles.cardTitle, {color: colors.text}]}>{eventTitle}</Text>
					<Text style={[styles.meta, {color: colors.textDim}]}>{whenLabel}</Text>
					{seatsLeft !== null ? <Text style={[styles.meta, {color: colors.textFaint}]}>Свободных мест: {seatsLeft}</Text> : null}
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityState={{selected: going, disabled: !!busy}}
					disabled={busy}
					onPress={onToggle}
					style={[styles.ticketAction, {backgroundColor: going ? colors.accent : 'transparent', borderColor: colors.accent}]}>
					<Text style={[styles.ticketActionText, {color: going ? colors.onAccent : colors.accent}]}>{going ? 'Иду' : 'Пойду'}</Text>
				</Pressable>
			</View>
		</CardShell>
	);
}

/* ---------------- generic object cards ---------------- */

interface ObjectCardProps extends BerxV9ComponentContract {
	title: string;
	subtitle?: string | null;
	imageUrl?: string | null;
	icon?: BerxIconName;
	meta?: string | null;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
}

/** The shared body every object card uses — one composition, different subjects. */
function ObjectCard({title, subtitle, imageUrl, icon, meta, onPress, style, testID, accessibilityLabel}: ObjectCardProps) {
	const colors = useBerxColors();
	return (
		<CardShell onPress={onPress} testID={testID} accessibilityLabel={accessibilityLabel ?? title} style={style}>
			<View style={styles.objectRow}>
				{imageUrl ? (
					<Image source={{uri: imageUrl}} style={styles.objectThumb} resizeMode="cover" />
				) : icon ? (
					<View style={[styles.objectThumb, styles.objectIcon, {backgroundColor: accentAlpha(colors.accent, 0.12)}]}>
						<BerxIcon name={icon} size={20} color={colors.accent} />
					</View>
				) : null}
				<View style={styles.objectBody}>
					<Text numberOfLines={1} style={[styles.cardTitle, {color: colors.text}]}>{title}</Text>
					{subtitle ? <Text numberOfLines={2} style={[styles.meta, {color: colors.textDim}]}>{subtitle}</Text> : null}
					{meta ? <Text style={[styles.meta, {color: colors.textFaint}]}>{meta}</Text> : null}
				</View>
			</View>
		</CardShell>
	);
}

export const BerxExperienceCard = (p: ObjectCardProps) => <ObjectCard icon="sparkles" {...p} />;
export const BerxTripCard = (p: ObjectCardProps) => <ObjectCard icon="route" {...p} />;
export const BerxCollectionCard = (p: ObjectCardProps) => <ObjectCard icon="layers" {...p} />;
export const BerxCommunityCard = (p: ObjectCardProps) => <ObjectCard icon="users" {...p} />;
export const BerxBusinessCard = (p: ObjectCardProps) => <ObjectCard icon="store" {...p} />;
export const BerxCreatorCard = (p: ObjectCardProps) => <ObjectCard icon="star" {...p} />;
export const BerxRewardCard = (p: ObjectCardProps) => <ObjectCard icon="gift" {...p} />;

/** The business D2 plane. Same hero geometry as a place, different subject and metrics. */
export function BerxBusinessHero({name, coverUrl, category, verified, children, style, testID}: {name: string; coverUrl?: string | null; category?: string | null; verified?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	return (
		<View testID={testID} style={[styles.hero, {backgroundColor: colors.mediaScrim}, style]}>
			{coverUrl ? <Image source={{uri: coverUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
			<View style={[StyleSheet.absoluteFillObject, {backgroundColor: colors.mediaScrim, opacity: 0.5}]} />
			<View style={styles.heroBody}>
				{category ? <Text style={[styles.heroEyebrow, {color: colors.accentOnMedia}]}>{category.toUpperCase()}</Text> : null}
				<View style={styles.inlineRow}>
					<Text style={[styles.heroTitle, {color: colors.onMedia}]}>{name}</Text>
					{verified ? <BerxVerifiedBadge /> : null}
				</View>
				{children}
			</View>
		</View>
	);
}

/** Real balance from `pointsBalance`. Never renders a currency it was not given. */
export function BerxWalletCard({balance, unitLabel = 'баллов', onPress, testID}: {balance: number; unitLabel?: string; onPress?: () => void; testID?: string} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	return (
		<CardShell onPress={onPress} testID={testID} accessibilityLabel={`${balance} ${unitLabel}`}>
			<View style={styles.walletRow}>
				<BerxIcon name="coins" size={22} color={colors.accent} />
				<View style={styles.objectBody}>
					<Text style={[styles.walletValue, {color: colors.text}]}>{balance.toLocaleString('ru-RU')}</Text>
					<Text style={[styles.meta, {color: colors.textDim}]}>{unitLabel}</Text>
				</View>
			</View>
		</CardShell>
	);
}

/* ---------------- notifications ---------------- */

export interface BerxNotificationRowProps extends BerxV9ComponentContract {
	text: string;
	timeLabel?: string;
	iconUrl?: string | null;
	unread?: boolean;
	onPress?: () => void;
	/**
	 * A trailing affordance — dismiss, accept, mute. Real notifications in
	 * BERX are deletable (api.deleteNotification), so a row that could not
	 * carry that action would have forced the screen to keep its own
	 * hand-rolled row and this component would have stayed unused.
	 */
	action?: ReactNode;
	style?: StyleProp<ViewStyle>;
}

export function BerxNotificationRow({text, timeLabel, iconUrl, unread, onPress, action, style, testID}: BerxNotificationRowProps) {
	const colors = useBerxColors();
	return (
		<Pressable
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={unread ? `Непрочитано: ${text}` : text}
			onPress={onPress}
			style={[styles.notifRow, unread ? {backgroundColor: accentAlpha(colors.accent, 0.06)} : null, style]}>
			{iconUrl ? <Image source={{uri: iconUrl}} style={styles.notifAvatar} /> : <View style={[styles.notifAvatar, {backgroundColor: colors.glass2}]} />}
			<View style={styles.objectBody}>
				<Text style={[styles.notifText, {color: colors.text}]}>{text}</Text>
				{timeLabel ? <Text style={[styles.meta, {color: colors.textFaint}]}>{timeLabel}</Text> : null}
			</View>
			{unread ? <View style={[styles.notifDot, {backgroundColor: colors.accent}]} /> : null}
			{action}
		</Pressable>
	);
}

/** Groups notifications the way the archive asks (People / Messages / Places / Events / Experiences) — grouping supplied by the caller from real data. */
export function BerxNotificationStack({groups, testID}: {groups: {key: string; label: string; items: BerxNotificationRowProps[]}[]; testID?: string}) {
	const colors = useBerxColors();
	return (
		<View testID={testID}>
			{groups.map((g) => (
				<View key={g.key} style={styles.notifGroup}>
					<Text style={[styles.groupLabel, {color: colors.textFaint}]}>{g.label.toUpperCase()}</Text>
					{g.items.map((it, i) => (
						<BerxNotificationRow key={`${g.key}-${i}`} {...it} />
					))}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {borderRadius: radius.lg},
	cardGlass: {padding: spacing.md},
	inlineBadge: {marginLeft: 4},
	levelBadge: {minWidth: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6},
	levelText: {fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	hero: {minHeight: 220, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: radius.lg},
	heroBody: {padding: spacing.lg, gap: 4},
	heroEyebrow: {fontSize: 11, fontWeight: typography.weightBold, letterSpacing: 0.8},
	heroTitle: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: -0.3},
	heroMetaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap'},
	heroMeta: {fontSize: typography.sizeSm},
	inlineRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
	hoursList: {gap: 4},
	hoursRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md},
	hoursDay: {fontSize: typography.sizeSm},
	hoursValue: {fontSize: typography.sizeSm, fontVariant: ['tabular-nums']},
	ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
	ratingValue: {fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	meta: {fontSize: typography.sizeXs},
	cardTitle: {fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	ticketRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	ticketBody: {flex: 1, minWidth: 0, gap: 2},
	ticketAction: {minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	ticketActionText: {fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	objectRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	objectThumb: {width: 52, height: 52, borderRadius: radius.md},
	objectIcon: {alignItems: 'center', justifyContent: 'center'},
	objectBody: {flex: 1, minWidth: 0, gap: 2},
	walletRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	walletValue: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, fontVariant: ['tabular-nums']},
	notifRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 44},
	notifAvatar: {width: 36, height: 36, borderRadius: 18},
	notifText: {fontSize: typography.sizeSm},
	notifDot: {width: 8, height: 8, borderRadius: 4},
	notifGroup: {marginBottom: spacing.md, gap: 2},
	groupLabel: {fontSize: 11, fontWeight: typography.weightBold, letterSpacing: 0.6, paddingHorizontal: spacing.lg, marginBottom: 4},
});
