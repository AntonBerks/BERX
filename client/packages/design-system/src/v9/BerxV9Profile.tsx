/**
 * BERX V9 PROFILE SECTIONS + MAP CLUSTER.
 *
 * The V9 contracts name five profile sections (About, Places, Moments,
 * Experiences, Connections) and a map cluster. All six are CREATE
 * rather than DEFER because each one has a real endpoint behind it in
 * this repository:
 *
 *   About        ← getProfile()            (BerxProfileSummary)
 *   Places       ← savedPlaces() / recentCheckins()
 *   Moments      ← myLifeMoments() / momentsForSource()
 *   Experiences  ← experiences()
 *   Connections  ← friends() / onlineFriends()
 *   MapCluster   ← nearbyPlaces() / socialMap() lat+lng
 *
 * None of them fetches. Each takes the real rows its caller already
 * holds and renders them, plus the real empty state when the server
 * genuinely returned nothing. A field the API does not carry is not
 * displayed and not invented — that is why About renders only the rows
 * BerxProfileSummary actually has.
 *
 * MapCluster is real geometry, not a decoration: it grids pins in
 * SCREEN space at the current zoom and collapses each occupied cell
 * into one marker carrying its true count, which is what stops a dense
 * city from painting 400 overlapping pins.
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
import {BerxEmptyState} from '../components/BerxStates';
import {depthShadowV9} from './depth';
import type {BerxV9ComponentContract} from './componentRegistry';

/* ---------------- shared section shell ---------------- */

interface SectionProps extends BerxV9ComponentContract {
	title: string;
	/** Real count from the server, when the caller has one. Never estimated. */
	count?: number;
	action?: ReactNode;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}

/**
 * One shell for all five sections, so a profile reads as one object
 * seen from five sides rather than five differently-built panels.
 * D2 — profile sections sit on the content plane, above the hero.
 */
function Section({title, count, action, children, style, testID, accessibilityLabel}: SectionProps) {
	const colors = useBerxColors();
	return (
		<View
			testID={testID}
			accessibilityLabel={accessibilityLabel ?? title}
			style={[styles.section, depthShadowV9('D2', colors.mediaScrim), style]}>
			<View style={styles.sectionHead}>
				<Text style={[styles.sectionTitle, {color: colors.text}]}>{title}</Text>
				{typeof count === 'number' ? (
					<Text style={[styles.sectionCount, {color: colors.textFaint}]}>{count}</Text>
				) : null}
				<View style={styles.sectionSpacer} />
				{action}
			</View>
			{children}
		</View>
	);
}

/** A labelled row. Renders nothing at all when the server had no value — no "—" placeholders. */
function Row({icon, label, value}: {icon: BerxIconName; label: string; value?: string | null}) {
	const colors = useBerxColors();
	if (!value) return null;
	return (
		<View style={styles.row}>
			<BerxIcon name={icon} size={16} color={colors.textFaint} />
			<Text style={[styles.rowLabel, {color: colors.textFaint}]}>{label}</Text>
			<Text style={[styles.rowValue, {color: colors.text}]} numberOfLines={2}>
				{value}
			</Text>
		</View>
	);
}

/* ---------------- About ---------------- */

export interface BerxProfileAboutData {
	/** Real bio text from the profile record. */
	bio?: string | null;
	location?: string | null;
	website?: string | null;
	/** Unix seconds — the account's real creation time. */
	joined?: number | null;
	mutualFriends?: number;
	mutualCommunities?: number;
	verified?: boolean;
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function joinedText(unixSeconds: number): string {
	const d = new Date(unixSeconds * 1000);
	return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * About — the identity facts the server really returned. Every row is
 * conditional, so a profile with only a name renders a single honest
 * empty state instead of a column of dashes.
 */
export function BerxProfileAbout({data, testID}: {data: BerxProfileAboutData; testID?: string}) {
	const colors = useBerxColors();
	const hasAny =
		!!data.bio ||
		!!data.location ||
		!!data.website ||
		!!data.joined ||
		!!data.mutualFriends ||
		!!data.mutualCommunities;
	return (
		<Section title="О себе" testID={testID}>
			{!hasAny ? (
				<BerxEmptyState title="Пока ничего не рассказано" subtitle="Профиль ещё не заполнен." />
			) : (
				<BerxGlassView radius={radius.lg} style={styles.panel}>
					{data.bio ? (
						<Text style={[styles.bio, {color: colors.text}]}>{data.bio}</Text>
					) : null}
					<Row icon="map-pin" label="Город" value={data.location} />
					<Row icon="link" label="Сайт" value={data.website} />
					<Row icon="calendar" label="В BERX с" value={data.joined ? joinedText(data.joined) : null} />
					<Row
						icon="users"
						label="Общие друзья"
						value={data.mutualFriends ? String(data.mutualFriends) : null}
					/>
					<Row
						icon="layers"
						label="Общие сообщества"
						value={data.mutualCommunities ? String(data.mutualCommunities) : null}
					/>
				</BerxGlassView>
			)}
		</Section>
	);
}

/* ---------------- Places ---------------- */

export interface BerxProfilePlaceItem {
	guid: number;
	title: string;
	category?: string | null;
	coverUrl?: string | null;
	/** Unix seconds of a real check-in, when this row came from recentCheckins(). */
	visitedAt?: number | null;
}

function relTime(unixSeconds: number): string {
	const mins = Math.max(0, Math.round((Date.now() / 1000 - unixSeconds) / 60));
	if (mins < 60) return `${mins} мин назад`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours} ч назад`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days} дн назад`;
	return joinedText(unixSeconds);
}

/** Places this person really saved or really checked into. */
export function BerxProfilePlaces({
	places,
	onOpen,
	testID,
}: {
	places: BerxProfilePlaceItem[];
	onOpen?: (guid: number) => void;
	testID?: string;
}) {
	const colors = useBerxColors();
	return (
		<Section title="Места" count={places.length} testID={testID}>
			{places.length === 0 ? (
				<BerxEmptyState title="Мест пока нет" subtitle="Сохранённые и посещённые места появятся здесь." />
			) : (
				places.map((p) => (
					<Pressable
						key={p.guid}
						accessibilityRole="button"
						accessibilityLabel={p.title}
						onPress={onOpen ? () => onOpen(p.guid) : undefined}
						style={styles.mediaRow}>
						{p.coverUrl ? (
							<Image source={{uri: p.coverUrl}} style={styles.thumb} />
						) : (
							<View style={[styles.thumb, styles.thumbEmpty, {backgroundColor: colors.glass2}]}>
								<BerxIcon name="map-pin" size={18} color={colors.textFaint} />
							</View>
						)}
						<View style={styles.mediaBody}>
							<Text style={[styles.mediaTitle, {color: colors.text}]} numberOfLines={1}>
								{p.title}
							</Text>
							<Text style={[styles.mediaMeta, {color: colors.textFaint}]} numberOfLines={1}>
								{[p.category, p.visitedAt ? relTime(p.visitedAt) : null].filter(Boolean).join(' · ')}
							</Text>
						</View>
						<BerxIcon name="chevron-right" size={16} color={colors.textFaint} />
					</Pressable>
				))
			)}
		</Section>
	);
}

/* ---------------- Moments ---------------- */

export interface BerxProfileMomentItem {
	id: number;
	text: string;
	timeCreated: number;
	/** Real people tagged on the moment (BerxLifeMomentPerson) — count only, names stay on the detail scene. */
	peopleCount?: number;
}

/** Life moments — the real rows myLifeMoments()/momentsForSource() returns. */
export function BerxProfileMoments({
	moments,
	onOpen,
	testID,
}: {
	moments: BerxProfileMomentItem[];
	onOpen?: (id: number) => void;
	testID?: string;
}) {
	const colors = useBerxColors();
	return (
		<Section title="Моменты" count={moments.length} testID={testID}>
			{moments.length === 0 ? (
				<BerxEmptyState title="Моментов пока нет" subtitle="Сохранённые моменты жизни появятся здесь." />
			) : (
				moments.map((m) => (
					<Pressable
						key={m.id}
						accessibilityRole="button"
						accessibilityLabel={m.text}
						onPress={onOpen ? () => onOpen(m.id) : undefined}>
						<BerxGlassView radius={radius.lg} style={styles.momentCard}>
							<Text style={[styles.momentText, {color: colors.text}]} numberOfLines={4}>
								{m.text}
							</Text>
							<View style={styles.momentFoot}>
								<Text style={[styles.mediaMeta, {color: colors.textFaint}]}>{relTime(m.timeCreated)}</Text>
								{m.peopleCount ? (
									<>
										<View style={[styles.dot, {backgroundColor: colors.textFaint}]} />
										<BerxIcon name="users" size={13} color={colors.textFaint} />
										<Text style={[styles.mediaMeta, {color: colors.textFaint}]}>{m.peopleCount}</Text>
									</>
								) : null}
							</View>
						</BerxGlassView>
					</Pressable>
				))
			)}
		</Section>
	);
}

/* ---------------- Experiences ---------------- */

export interface BerxProfileExperienceItem {
	id: number;
	title: string;
	scheduledStart: number;
	anchorTitle?: string | null;
	/** Real participation status from the API — 'going' | 'maybe' | 'declined' | null. */
	myStatus?: string | null;
}

/** Shared experiences — real rows from experiences(). */
export function BerxProfileExperiences({
	experiences,
	onOpen,
	testID,
}: {
	experiences: BerxProfileExperienceItem[];
	onOpen?: (id: number) => void;
	testID?: string;
}) {
	const colors = useBerxColors();
	return (
		<Section title="Впечатления" count={experiences.length} testID={testID}>
			{experiences.length === 0 ? (
				<BerxEmptyState title="Впечатлений пока нет" subtitle="Совместные планы и встречи появятся здесь." />
			) : (
				experiences.map((e) => (
					<Pressable
						key={e.id}
						accessibilityRole="button"
						accessibilityLabel={e.title}
						onPress={onOpen ? () => onOpen(e.id) : undefined}
						style={styles.mediaRow}>
						<View style={[styles.thumb, styles.thumbEmpty, {backgroundColor: accentAlpha(colors.accent, 0.14)}]}>
							<BerxIcon name="sparkles" size={18} color={colors.accent} />
						</View>
						<View style={styles.mediaBody}>
							<Text style={[styles.mediaTitle, {color: colors.text}]} numberOfLines={1}>
								{e.title}
							</Text>
							<Text style={[styles.mediaMeta, {color: colors.textFaint}]} numberOfLines={1}>
								{[e.anchorTitle, joinedText(e.scheduledStart)].filter(Boolean).join(' · ')}
							</Text>
						</View>
						{e.myStatus ? (
							<View style={[styles.statusPill, {borderColor: colors.border}]}>
								<Text style={[styles.statusText, {color: colors.textDim}]}>{e.myStatus}</Text>
							</View>
						) : null}
					</Pressable>
				))
			)}
		</Section>
	);
}

/* ---------------- Connections ---------------- */

export interface BerxProfileConnectionItem {
	guid: number;
	fullname: string;
	iconUrl?: string | null;
	/** Real presence (OssnUser::isOnline) — never inferred from recency. */
	isOnline?: boolean;
}

/** Friends — real rows from friends()/onlineFriends(). */
export function BerxProfileConnections({
	people,
	onOpen,
	testID,
}: {
	people: BerxProfileConnectionItem[];
	onOpen?: (guid: number) => void;
	testID?: string;
}) {
	const colors = useBerxColors();
	return (
		<Section title="Связи" count={people.length} testID={testID}>
			{people.length === 0 ? (
				<BerxEmptyState title="Связей пока нет" subtitle="Друзья появятся здесь." />
			) : (
				<View style={styles.grid}>
					{people.map((p) => (
						<Pressable
							key={p.guid}
							accessibilityRole="button"
							accessibilityLabel={p.fullname}
							onPress={onOpen ? () => onOpen(p.guid) : undefined}
							style={styles.person}>
							<View>
								{p.iconUrl ? (
									<Image source={{uri: p.iconUrl}} style={styles.personAvatar} />
								) : (
									<View style={[styles.personAvatar, styles.thumbEmpty, {backgroundColor: colors.glass2}]}>
										<BerxIcon name="user" size={18} color={colors.textFaint} />
									</View>
								)}
								{p.isOnline ? (
									<View style={[styles.presence, {backgroundColor: colors.success, borderColor: colors.bg}]} />
								) : null}
							</View>
							<Text style={[styles.personName, {color: colors.textDim}]} numberOfLines={1}>
								{p.fullname}
							</Text>
						</Pressable>
					))}
				</View>
			)}
		</Section>
	);
}

/* ---------------- Map cluster ---------------- */

export interface BerxMapPoint {
	id: number | string;
	lat: number;
	lng: number;
}

export interface BerxMapClusterGroup<T extends BerxMapPoint> {
	/** Screen-space centre of the group, in the same px box the caller projected into. */
	x: number;
	y: number;
	count: number;
	points: T[];
	/** True when this is a single real pin rather than a collapsed group. */
	single: boolean;
}

/**
 * Real screen-space clustering.
 *
 * Points are projected into the caller's px box (Web Mercator for y, so
 * clusters do not drift with latitude), gridded at `cellPx`, and each
 * occupied cell becomes one group whose centre is the MEAN of its own
 * members — not the cell centre, so a cluster sits on its actual mass.
 * `count` is the true number of members; nothing is estimated.
 */
export function berxClusterPoints<T extends BerxMapPoint>(
	points: T[],
	region: {minLat: number; maxLat: number; minLng: number; maxLng: number},
	size: {width: number; height: number},
	cellPx = 56,
): BerxMapClusterGroup<T>[] {
	const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * Math.PI) / 360));
	const yTop = merc(region.maxLat);
	const yBottom = merc(region.minLat);
	const ySpan = yTop - yBottom || 1;
	const xSpan = region.maxLng - region.minLng || 1;

	const cells = new Map<string, {sx: number; sy: number; points: T[]}>();
	for (const p of points) {
		const x = ((p.lng - region.minLng) / xSpan) * size.width;
		const y = ((yTop - merc(p.lat)) / ySpan) * size.height;
		const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
		const cell = cells.get(key);
		if (cell) {
			cell.sx += x;
			cell.sy += y;
			cell.points.push(p);
		} else {
			cells.set(key, {sx: x, sy: y, points: [p]});
		}
	}
	return [...cells.values()].map((c) => ({
		x: c.sx / c.points.length,
		y: c.sy / c.points.length,
		count: c.points.length,
		points: c.points,
		single: c.points.length === 1,
	}));
}

/**
 * The cluster marker itself. Size grows with the real count (sqrt, so
 * AREA is proportional to the count rather than the diameter — a 100-pin
 * cluster must not read as ten times a 10-pin one).
 */
export function BerxMapCluster({
	count,
	onPress,
	testID,
	accessibilityLabel,
}: {count: number; onPress?: () => void} & BerxV9ComponentContract) {
	const colors = useBerxColors();
	const size = Math.round(Math.min(64, 30 + Math.sqrt(Math.max(1, count)) * 5));
	return (
		<Pressable
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? `${count} объектов рядом`}
			onPress={onPress}
			style={[
				styles.cluster,
				depthShadowV9('D3', colors.mediaScrim),
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: accentAlpha(colors.accent, 0.9),
					borderColor: colors.borderStrong,
				},
			]}>
			<Text style={[styles.clusterText, {color: colors.onAccent}]}>{count}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	section: {marginBottom: spacing.xl},
	sectionHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
	sectionTitle: {fontSize: typography.sizeLg, fontWeight: typography.weightBold, letterSpacing: -0.2},
	sectionCount: {fontSize: typography.sizeXs, fontVariant: ['tabular-nums']},
	sectionSpacer: {flex: 1},
	panel: {padding: spacing.lg, gap: spacing.md},
	bio: {fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase, marginBottom: spacing.xs},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	rowLabel: {fontSize: typography.sizeXs, minWidth: 96},
	rowValue: {fontSize: typography.sizeSm, flex: 1, minWidth: 0},
	mediaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.md},
	thumbEmpty: {alignItems: 'center', justifyContent: 'center'},
	mediaBody: {flex: 1, minWidth: 0, gap: 2},
	mediaTitle: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	mediaMeta: {fontSize: typography.sizeXs},
	momentCard: {padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm},
	momentText: {fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	momentFoot: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	dot: {width: 3, height: 3, borderRadius: 2},
	statusPill: {borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2},
	statusText: {fontSize: typography.sizeXs},
	grid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md},
	person: {width: 64, alignItems: 'center', gap: spacing.xs},
	personAvatar: {width: 56, height: 56, borderRadius: 28},
	presence: {position: 'absolute', right: 2, bottom: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2},
	personName: {fontSize: typography.sizeXs, textAlign: 'center'},
	cluster: {alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth},
	clusterText: {fontSize: typography.sizeSm, fontWeight: typography.weightBold, fontVariant: ['tabular-nums']},
});
