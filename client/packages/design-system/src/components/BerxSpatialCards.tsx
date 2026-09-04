/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX SPATIAL VOCABULARY — Place, Event, Person and Moment as four
 * real card types built on the one BerxMediaCard primitive, so the
 * whole app speaks a single visual language instead of each screen
 * re-inventing a row layout.
 *
 * Every field these render is REAL, already-fetched data (see the
 * prop types — they mirror the actual API shapes in
 * packages/api/src/types.ts). Nothing here fabricates a distance, a
 * headcount, a rating or an "N people here" that the server didn't
 * actually return: each is optional and simply doesn't render when
 * the caller has no real value for it.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius} from '../tokens';
import {BerxMediaCard} from './BerxMediaCard';
import {BerxAvatarStack} from './BerxAvatarStack';
import type {BerxStackPerson} from './BerxAvatarStack';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

/* ---------------- shared atoms ---------------- */

export function BerxLiveDot({label}: {label: string}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.livePill}>
			<View style={styles.liveDot} />
			<Text style={styles.liveText}>{label}</Text>
		</View>
	);
}

export function BerxMetaPill({text, accent}: {text: string; accent?: boolean}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={[styles.metaPill, accent && styles.metaPillAccent]}>
			<Text style={[styles.metaPillText, accent && styles.metaPillTextAccent]} numberOfLines={1}>
				{text}
			</Text>
		</View>
	);
}

/** Real distance formatting — metres under a km, one decimal above it. Never a fake "рядом". */
export function formatDistance(km: number): string {
	if (km < 1) {
		return `${Math.max(1, Math.round(km * 1000))} м`;
	}
	return `${km.toFixed(1)} км`;
}

/* ---------------- PLACE ---------------- */

export interface BerxPlaceCardProps {
	title: string;
	imageUrl?: string | null;
	category?: string | null;
	/** Real km from the caller's own verified position — omitted entirely when unknown. */
	distanceKm?: number;
	/** Real server-side friends_count. */
	friendsCount?: number;
	people?: BerxStackPerson[];
	isOpenNow?: boolean | null;
	rating?: number;
	/** Real live activity line — e.g. a running Business Moment. Never invented. */
	liveLabel?: string;
	onPress?: () => void;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export function BerxPlaceCard({
	title,
	imageUrl,
	category,
	distanceKm,
	friendsCount,
	people,
	isOpenNow,
	rating,
	liveLabel,
	onPress,
	width,
	height,
	style,
}: BerxPlaceCardProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<BerxMediaCard
			imageUrl={imageUrl}
			ratio="hero"
			width={width}
			height={height}
			onPress={onPress}
			style={style}
			topLeft={liveLabel ? <BerxLiveDot label={liveLabel} /> : isOpenNow ? <BerxMetaPill text="Открыто" accent /> : undefined}
			topRight={typeof distanceKm === 'number' ? <BerxMetaPill text={formatDistance(distanceKm)} /> : undefined}>
			<Text style={styles.cardTitle} numberOfLines={2}>
				{title}
			</Text>
			<View style={styles.metaRow}>
				{category ? <Text style={styles.metaText}>{category}</Text> : null}
				{typeof rating === 'number' && rating > 0 ? <Text style={styles.metaAccent}>★ {rating.toFixed(1)}</Text> : null}
			</View>
			{people && people.length > 0 ? (
				<View style={styles.peopleRow}>
					<BerxAvatarStack people={people} total={friendsCount} size={22} />
					{typeof friendsCount === 'number' && friendsCount > 0 ? (
						<Text style={styles.peopleText}>{friendsCount} друзей здесь</Text>
					) : null}
				</View>
			) : typeof friendsCount === 'number' && friendsCount > 0 ? (
				<Text style={styles.peopleText}>{friendsCount} друзей здесь</Text>
			) : null}
		</BerxMediaCard>
	);
}

/* ---------------- EVENT ---------------- */

export interface BerxEventCardProps {
	title: string;
	imageUrl?: string | null;
	starts: number;
	placeTitle?: string | null;
	distanceKm?: number;
	attendeeCount?: number;
	friendsGoingCount?: number;
	people?: BerxStackPerson[];
	seatsLeft?: number | null;
	isGoing?: boolean;
	onPress?: () => void;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

/** Real, local, deterministic time label — no "через N минут" invented from a stale clock. */
export function formatEventTime(starts: number): string {
	const d = new Date(starts * 1000);
	return d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

export function BerxEventCard({
	title,
	imageUrl,
	starts,
	placeTitle,
	distanceKm,
	attendeeCount,
	friendsGoingCount,
	people,
	seatsLeft,
	isGoing,
	onPress,
	width,
	height,
	style,
}: BerxEventCardProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<BerxMediaCard
			imageUrl={imageUrl}
			ratio="cinema"
			width={width}
			height={height}
			onPress={onPress}
			style={style}
			topLeft={<BerxMetaPill text={formatEventTime(starts)} accent={!!isGoing} />}
			topRight={typeof distanceKm === 'number' ? <BerxMetaPill text={formatDistance(distanceKm)} /> : undefined}>
			<Text style={styles.cardTitle} numberOfLines={2}>
				{title}
			</Text>
			<View style={styles.metaRow}>
				{placeTitle ? <Text style={styles.metaText} numberOfLines={1}>{placeTitle}</Text> : null}
				{typeof seatsLeft === 'number' && seatsLeft > 0 ? <Text style={styles.metaAccent}>{seatsLeft} мест</Text> : null}
			</View>
			<View style={styles.peopleRow}>
				{people && people.length > 0 ? <BerxAvatarStack people={people} total={attendeeCount} size={22} /> : null}
				{typeof attendeeCount === 'number' && attendeeCount > 0 ? (
					<Text style={styles.peopleText}>
						{attendeeCount} идут
						{typeof friendsGoingCount === 'number' && friendsGoingCount > 0 ? ` · ${friendsGoingCount} друзей` : ''}
					</Text>
				) : null}
			</View>
		</BerxMediaCard>
	);
}

/* ---------------- PERSON ---------------- */

export interface BerxPersonCardProps {
	fullname: string;
	username: string;
	imageUrl?: string | null;
	/** Real presence — OssnUser::isOnline(10), same signal messaging already uses. */
	isOnline?: boolean;
	distanceKm?: number;
	/** Real mutual-friend count from the server. */
	mutualCount?: number;
	/** Real context line: what actually connects you (shared community, same place, same event). */
	contextLine?: string;
	onPress?: () => void;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export function BerxPersonCard({
	fullname,
	username,
	imageUrl,
	isOnline,
	distanceKm,
	mutualCount,
	contextLine,
	onPress,
	width,
	height,
	style,
}: BerxPersonCardProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<BerxMediaCard
			imageUrl={imageUrl}
			ratio="portrait"
			width={width}
			height={height}
			onPress={onPress}
			style={style}
			cornerRadius={radius.md}
			topLeft={isOnline ? <BerxLiveDot label="сейчас" /> : undefined}
			topRight={typeof distanceKm === 'number' ? <BerxMetaPill text={formatDistance(distanceKm)} /> : undefined}>
			<Text style={styles.personName} numberOfLines={1}>
				{(fullname || username).toUpperCase()}
			</Text>
			{contextLine ? (
				<Text style={styles.metaText} numberOfLines={1}>{contextLine}</Text>
			) : typeof mutualCount === 'number' && mutualCount > 0 ? (
				<Text style={styles.metaText} numberOfLines={1}>{mutualCount} общих друзей</Text>
			) : (
				<Text style={styles.metaText} numberOfLines={1}>@{username}</Text>
			)}
		</BerxMediaCard>
	);
}

/* ---------------- MOMENT ---------------- */

export interface BerxMomentCardProps {
	text: string;
	imageUrl?: string | null;
	authorName?: string | null;
	authorIcon?: string | null;
	timeLabel?: string;
	/** Real place this moment is anchored to — a moment always has context in BERX. */
	placeTitle?: string | null;
	people?: BerxStackPerson[];
	onPress?: () => void;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export function BerxMomentCard({
	text,
	imageUrl,
	authorName,
	authorIcon,
	timeLabel,
	placeTitle,
	people,
	onPress,
	width,
	height,
	style,
}: BerxMomentCardProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<BerxMediaCard
			imageUrl={imageUrl}
			ratio="hero"
			width={width}
			height={height}
			onPress={onPress}
			style={style}
			topLeft={placeTitle ? <BerxMetaPill text={placeTitle} /> : undefined}>
			<View style={styles.momentByline}>
				{authorIcon || authorName ? (
					<BerxAvatarStack people={[{guid: -1, icon: authorIcon, initial: (authorName ?? 'B').charAt(0)}]} size={20} />
				) : null}
				<Text style={styles.momentAuthor} numberOfLines={1}>
					{(authorName ?? 'BERX').toUpperCase()}
					{timeLabel ? ` · ${timeLabel}` : ''}
				</Text>
			</View>
			<Text style={styles.momentText} numberOfLines={3}>
				{text}
			</Text>
			{people && people.length > 1 ? <BerxAvatarStack people={people} size={20} style={styles.momentPeople} /> : null}
		</BerxMediaCard>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	livePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(5,5,5,0.55)',
		borderWidth: 1,
		borderColor: colors.accentSoft,
	},
	// accentOnMedia, not accent: this dot sits inside a pill on a photo.
	liveDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentOnMedia},
	liveText: {color: colors.accentOnMedia, fontSize: 11, fontWeight: typography.weightBold, letterSpacing: 0.4, textTransform: 'uppercase'},
	metaPill: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(5,5,5,0.55)',
		borderWidth: 1,
		borderColor: colors.borderSoft,
		maxWidth: 150,
	},
	metaPillAccent: {borderColor: colors.accentSoft, backgroundColor: colors.accentSoft},
	metaPillText: {color: colors.onMedia, fontSize: 11, fontWeight: typography.weightMedium},
	metaPillTextAccent: {color: colors.accentOnMedia},
	cardTitle: {color: colors.onMedia, fontSize: typography.sizeLg, fontWeight: typography.weightBold, letterSpacing: -0.2},
	personName: {color: colors.onMedia, fontSize: typography.sizeSm, fontWeight: typography.weightBold, letterSpacing: 0.4},
	metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	metaText: {color: 'rgba(245,245,247,0.72)', fontSize: typography.sizeXs, flexShrink: 1},
	metaAccent: {color: colors.accentOnMedia, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	peopleRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2},
	peopleText: {color: 'rgba(245,245,247,0.72)', fontSize: typography.sizeXs},
	momentByline: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	momentAuthor: {color: 'rgba(245,245,247,0.72)', fontSize: 11, fontWeight: typography.weightBold, letterSpacing: 0.5},
	momentText: {color: colors.onMedia, fontSize: typography.sizeBase, fontWeight: typography.weightMedium, lineHeight: 20},
	momentPeople: {marginTop: 2},
});
