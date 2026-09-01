/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real RSVP: api.rsvpEvent()/cancelRsvp() — capacity is re-checked
 * server-side immediately before insert (OssnEvents::rsvp()), so a
 * double-tap here cannot oversell an event; the server response is
 * always the source of truth for seats_left/attendee_count, not a
 * client-side guess.
 *
 * Future UI pass: body gets a real BerxFadeIn entrance, and the
 * "friends going" row (Experience Graph signal) moves onto a
 * BerxGlassSurface strip, mirroring PlaceDetailScreen's treatment.
 *
 * MAX BUILD — closes a real gap: api.eventStories() was always a
 * real, working client method (GET /stories/event/{guid}, real
 * OssnStories::listForEvent()) with zero UI caller — a real event
 * story could be created via onAddEventStory() but never actually
 * seen again from the event itself. Grouped client-side by owner into
 * the same BerxStoryFeedGroup shape StoriesRailScreen already builds
 * (eventStories() returns a flat, already-mixed-owner list, unlike
 * the feed's own per-owner grouping) and opened through the exact
 * same currentStoryGroup + 'StoryViewer' route AppShell already uses
 * for the main Stories rail — no new viewer, no duplicated logic.
 *
 * BERX WORLD — real Checkpoint (OssnEvents::checkIn()): RSVP is
 * intent, this is real geo-verified attendance, distinct and proven.
 * Same honest manual lat/lng entry as PlaceDetailScreen's own
 * check-in (no device Geolocation library installed/verifiable in
 * this sandbox). Once checked in, a real "Сохранить как воспоминание"
 * action (api.saveMemoryFromEventCheckin()) closes the Checkpoint ->
 * Memory link — only ever shown once the server has already confirmed
 * has_checked_in, never a button that would 403.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, ScrollView, Image, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxEventAttendee, BerxExperienceGraphFriend, BerxExperienceGraphWorldFriend, BerxEventStoryItem, BerxStoryFeedGroup, BerxLifeMoment} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	onOpenPlace?: (guid: number) => void;
	onOpenCommunity?: (guid: number) => void;
	onOpenInvite: (guid: number) => void;
	onAddToCollection?: () => void;
	onAddToTrip?: () => void;
	onAddToWorld?: () => void;
	onAddEventStory?: (eventGuid: number) => void;
	onOpenStoryGroup?: (group: BerxStoryFeedGroup) => void;
	onEdit?: () => void;
	onBack?: () => void;
}

function groupStoriesByOwner(items: BerxEventStoryItem[]): BerxStoryFeedGroup[] {
	const byOwner = new Map<number, BerxStoryFeedGroup>();
	for (const item of items) {
		if (!byOwner.has(item.owner_guid)) {
			byOwner.set(item.owner_guid, {owner_guid: item.owner_guid, owner_username: item.owner_username, stories: []});
		}
		byOwner.get(item.owner_guid)!.stories.push({id: item.id, caption: item.caption, time_created: item.time_created, mime_type: item.mime_type});
	}
	return Array.from(byOwner.values());
}

export default function EventDetailScreen({api, guid, myGuid, onOpenPlace, onOpenCommunity, onOpenInvite, onAddToCollection, onAddToTrip, onAddToWorld, onAddEventStory, onOpenStoryGroup, onEdit, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [event, setEvent] = useState<BerxEvent | null>(null);
	const [attendees, setAttendees] = useState<BerxEventAttendee[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rsvping, setRsvping] = useState(false);
	const [rsvpError, setRsvpError] = useState<string | null>(null);
	const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
	const [friendsGoing, setFriendsGoing] = useState<BerxExperienceGraphFriend[]>([]);
	const [friendsWorlds, setFriendsWorlds] = useState<BerxExperienceGraphWorldFriend[]>([]);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
	const [checkinOpen, setCheckinOpen] = useState(false);
	const [checkinLat, setCheckinLat] = useState('');
	const [checkinLng, setCheckinLng] = useState('');
	const [checkinBusy, setCheckinBusy] = useState(false);
	const [checkinMessage, setCheckinMessage] = useState<string | null>(null);
	const [savingMemory, setSavingMemory] = useState(false);
	const [memorySaved, setMemorySaved] = useState(false);
	const [moments, setMoments] = useState<BerxLifeMoment[]>([]);
	const [momentText, setMomentText] = useState('');
	const [momentBusy, setMomentBusy] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [e, a] = await Promise.all([api.getEvent(guid), api.eventAttendees(guid)]);
			setEvent(e);
			setAttendees(a.attendees);
			// Experience Graph — best-effort, never blocks the event itself.
			api.eventExperienceGraph(guid).then((g) => { setFriendsGoing(g.friends_going); setFriendsWorlds(g.friends_worlds); }).catch(() => undefined);
			api.eventStories(guid).then((s) => setStoryGroups(groupStoriesByOwner(s.stories))).catch(() => undefined);
			api.getAuthHeaders().then(setAuthHeaders).catch(() => undefined);
			// Best-effort — canViewSource() 403s for someone who hasn't
			// really checked in yet; expected, not a real failure.
			api.momentsForSource('event_checkin', guid).then((r) => setMoments(r.moments)).catch(() => undefined);
		} catch (e2) {
			setError(e2 instanceof Error ? e2.message : 'Не удалось загрузить событие');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	async function toggleRsvp() {
		if (!event) return;
		setRsvping(true);
		setRsvpError(null);
		try {
			if (event.is_going) {
				await api.cancelRsvp(event.guid);
			} else {
				await api.rsvpEvent(event.guid);
			}
			await load();
		} catch (e) {
			// Real server error (e.g. "full", "ended") — shown as-is,
			// never silently swallowed into an optimistic fake success.
			setRsvpError(e instanceof Error ? e.message : 'Не удалось изменить запись');
		} finally {
			setRsvping(false);
		}
	}

	/**
	 * BERX WORLD — real Checkpoint: geo-verified attendance, distinct
	 * from the RSVP above (intent only). Same honest manual lat/lng
	 * entry as PlaceDetailScreen's own check-in — no real device
	 * Geolocation library is installed/verifiable in this sandbox; the
	 * server (OssnEvents::checkIn()) does the real distance
	 * verification either way, this form never claims to.
	 */
	async function submitCheckin() {
		if (!event) return;
		const la = Number(checkinLat);
		const ln = Number(checkinLng);
		if (!Number.isFinite(la) || !Number.isFinite(ln)) {
			setCheckinMessage('Введите корректные координаты.');
			return;
		}
		setCheckinBusy(true);
		setCheckinMessage(null);
		try {
			const res = await api.checkInAtEvent(event.guid, la, ln);
			setCheckinMessage(res.points_awarded > 0 ? `✓ Отмечено — +${res.points_awarded} баллов` : '✓ Отмечено');
			setCheckinOpen(false);
			await load();
		} catch (e) {
			// Real, honest server verdict — same discipline as PlaceDetailScreen's own check-in.
			if (e instanceof BerxApiError && (e.code === 'too_far' || e.code === 'no_location' || e.code === 'not_going' || e.code === 'not_started' || e.code === 'already_checked_in')) {
				setCheckinMessage(e.message);
			} else {
				setCheckinMessage('Не удалось отметиться');
			}
		} finally {
			setCheckinBusy(false);
		}
	}

	/** The real Checkpoint -> Memory link — only ever shown once event.has_checked_in is already true. */
	async function saveMemory() {
		if (!event) return;
		setSavingMemory(true);
		try {
			await api.saveMemoryFromEventCheckin(event.guid);
			setMemorySaved(true);
		} catch {
			// real rejection — button stays, no fake success
		} finally {
			setSavingMemory(false);
		}
	}

	/** BERX WORLD — a real Life Moment, scoped to this event. Only reachable once the server has already confirmed a real checkpoint (has_checked_in). */
	async function createMoment() {
		if (!event || !momentText.trim()) return;
		setMomentBusy(true);
		try {
			await api.createLifeMoment('event_checkin', event.guid, momentText.trim());
			setMomentText('');
			const res = await api.momentsForSource('event_checkin', event.guid);
			setMoments(res.moments);
		} catch {
			// real rejection — text stays in the input
		} finally {
			setMomentBusy(false);
		}
	}

	/** Owner-only (server re-checks — OssnLifeMoments::deleteMoment()). Optimistic removal, real server call. */
	async function deleteMoment(id: number) {
		setMoments((prev: BerxLifeMoment[]) => prev.filter((m: BerxLifeMoment) => m.id !== id));
		try {
			await api.deleteLifeMoment(id);
		} catch {
			// real rejection — reload the true state rather than leaving a stale optimistic remove
			if (event) {
				api.momentsForSource('event_checkin', event.guid).then((res) => setMoments(res.moments)).catch(() => undefined);
			}
		}
	}

	/**
	 * MAX BUILD — real Event Waitlist toggle. Only reachable once the
	 * event is genuinely full (server re-checks either way) — cancelling
	 * ANY attendee's RSVP on this event promotes the earliest waitlisted
	 * person automatically, server-side, no client polling required to
	 * see it happen (a real refresh here just reflects that real state).
	 */
	async function toggleWaitlist() {
		if (!event) return;
		setRsvping(true);
		setRsvpError(null);
		try {
			if (event.is_waitlisted) {
				await api.leaveEventWaitlist(event.guid);
				setWaitlistPosition(null);
			} else {
				const res = await api.joinEventWaitlist(event.guid);
				setWaitlistPosition(res.waitlist_position);
			}
			await load();
		} catch (e) {
			setRsvpError(e instanceof Error ? e.message : 'Не удалось изменить лист ожидания');
		} finally {
			setRsvping(false);
		}
	}

	if (loading && !event) return <BerxLoadingState />;
	if (error && !event) return <BerxErrorState message={error} onRetry={load} />;
	if (!event) return null;

	const date = new Date(event.starts * 1000);
	const isFull = event.seats_left === 0 && !event.is_going;
	const rsvpLabel = event.has_ended ? 'Завершено' : event.is_going ? 'Вы идёте' : isFull ? 'Мест нет' : 'Пойду';
	const rsvpDisabled = event.has_ended || isFull;
	const waitlistLabel = event.is_waitlisted
		? `В листе ожидания${waitlistPosition !== null ? ` (№${waitlistPosition})` : ''}`
		: `Встать в лист ожидания${event.waitlist_count > 0 ? ` (${event.waitlist_count})` : ''}`;

	return (
		<ScrollView
			style={styles.screen}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={() => {
						setRefreshing(true);
						load();
					}}
					tintColor={colors.accent}
				/>
			}>
			<BerxHeader title={event.title} onBack={onBack} />
			<Berx3DTilt style={styles.hero} maxAngle={6}>
				{event.cover_url ? (
					<Image source={{uri: event.cover_url}} style={styles.heroImage} />
				) : (
					<View style={styles.heroFallback}>
						<Text style={styles.heroInitial}>{event.title.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</Berx3DTilt>

			<BerxFadeIn style={styles.body}>
				<Text style={styles.when}>
					{date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})} · {date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
				</Text>
				{event.place ? (
					<Text style={styles.place} onPress={() => onOpenPlace?.(event.place!.guid)}>📍 {event.place.title}</Text>
				) : event.location ? (
					<Text style={styles.place}>📍 {event.location}</Text>
				) : null}
				{event.group ? (
					<Text style={styles.place} onPress={() => onOpenCommunity?.(event.group!.guid)}>👥 Организовано сообществом «{event.group.title}»</Text>
				) : null}

				<View style={styles.actions}>
					<BerxButton
						label={rsvpLabel}
						variant={event.is_going ? 'primary' : 'secondary'}
						loading={rsvping}
						disabled={rsvpDisabled}
						onPress={toggleRsvp}
					/>
					{!event.has_ended && isFull ? (
						<BerxButton
							label={waitlistLabel}
							variant={event.is_waitlisted ? 'primary' : 'secondary'}
							loading={rsvping}
							onPress={toggleWaitlist}
						/>
					) : null}
					{!event.has_ended ? <BerxButton label="Пригласить" variant="secondary" onPress={() => onOpenInvite(event.guid)} /> : null}
					{onAddToCollection ? <BerxButton label="В подборку" variant="secondary" onPress={onAddToCollection} /> : null}
					{onAddToTrip ? <BerxButton label="В поездку" variant="secondary" onPress={onAddToTrip} /> : null}
					{onAddToWorld ? <BerxButton label="В мир" variant="secondary" onPress={onAddToWorld} /> : null}
					{event.is_going && onAddEventStory ? <BerxButton label="Добавить историю" variant="secondary" onPress={() => onAddEventStory(event.guid)} /> : null}
					{myGuid === event.owner_guid && onEdit ? <BerxButton label="Редактировать" variant="secondary" onPress={onEdit} /> : null}
					{event.is_going && !event.has_checked_in && event.starts * 1000 <= Date.now() ? (
						<BerxButton
							label="Отметиться"
							variant="secondary"
							onPress={() => {
								setCheckinOpen(!checkinOpen);
								setCheckinMessage(null);
							}}
						/>
					) : null}
				</View>
				{rsvpError ? <Text style={styles.error}>{rsvpError}</Text> : null}

				{checkinOpen ? (
					<BerxGlassSurface padding="sm" style={styles.checkinForm}>
						<Text style={styles.checkinHint}>Введите ваши текущие координаты — сервер проверит, что вы действительно на месте события.</Text>
						<View style={styles.checkinRow}>
							<View style={styles.checkinHalf}><BerxInput placeholder="Широта" value={checkinLat} onChangeText={setCheckinLat} keyboardType="decimal-pad" /></View>
							<View style={styles.checkinHalf}><BerxInput placeholder="Долгота" value={checkinLng} onChangeText={setCheckinLng} keyboardType="decimal-pad" /></View>
						</View>
						<BerxButton label="Подтвердить" onPress={submitCheckin} loading={checkinBusy} fullWidth />
					</BerxGlassSurface>
				) : null}
				{checkinMessage ? <Text style={styles.checkinMessage}>{checkinMessage}</Text> : null}

				{event.has_checked_in ? (
					<>
						<View style={styles.memoryRow}>
							{memorySaved ? (
								<Text style={styles.memorySavedText}>Сохранено как воспоминание ✓</Text>
							) : (
								<BerxButton label="Сохранить как воспоминание" variant="secondary" loading={savingMemory} onPress={saveMemory} fullWidth />
							)}
						</View>
						<View style={styles.momentsSection}>
							<Text style={styles.sectionTitle}>Моменты</Text>
							<View style={styles.momentInputRow}>
								<View style={styles.momentInputField}>
									<BerxInput placeholder="Что происходит?" value={momentText} onChangeText={setMomentText} />
								</View>
								<BerxButton label="+" onPress={createMoment} loading={momentBusy} disabled={!momentText.trim()} />
							</View>
							{moments.map((m: BerxLifeMoment) => (
								<View key={m.id} style={styles.momentRow}>
									<View style={styles.momentRowHeader}>
										<Text style={styles.momentAuthor}>{m.owner_username ?? 'Кто-то'}</Text>
										{myGuid === m.owner_guid ? (
											<Pressable onPress={() => deleteMoment(m.id)}>
												<Text style={styles.momentDelete}>удалить</Text>
											</Pressable>
										) : null}
									</View>
									<Text style={styles.momentText}>{m.text}</Text>
								</View>
							))}
						</View>
					</>
				) : null}

				{event.description ? <Text style={styles.description}>{event.description}</Text> : null}

				{event.seats_left !== null ? <Text style={styles.seats}>Свободных мест: {event.seats_left}</Text> : null}

				{friendsGoing.length > 0 ? (
					<BerxGlassSurface padding="sm" style={styles.friendsHereRow}>
						{friendsGoing.slice(0, 8).map((f: BerxExperienceGraphFriend) => (
							<View key={f.guid} style={styles.friendHereItem}>
								<BerxAvatar iconUrl={f.icon} fallbackInitial={f.username.charAt(0)} size={36} />
							</View>
						))}
						<Text style={styles.friendsHereLabel}>{friendsGoing.length === 1 ? '1 друг идёт' : `${friendsGoing.length} друзей идут`}</Text>
					</BerxGlassSurface>
				) : null}

				{friendsWorlds.length > 0 ? (
					<Text style={styles.friendsWorldsLine}>
						{friendsWorlds.map((f: BerxExperienceGraphWorldFriend) => f.fullname || f.username).join(', ')} добавил{friendsWorlds.length === 1 ? '' : 'и'} это событие в свой мир
					</Text>
				) : null}

				{storyGroups.length > 0 && onOpenStoryGroup ? (
					<View>
						<Text style={styles.sectionTitle}>Истории с события</Text>
						<FlatList
							horizontal
							showsHorizontalScrollIndicator={false}
							data={storyGroups}
							keyExtractor={(g: BerxStoryFeedGroup) => String(g.owner_guid)}
							contentContainerStyle={styles.storyRow}
							renderItem={({item}: {item: BerxStoryFeedGroup}) => (
								<Pressable style={styles.storyItem} onPress={() => onOpenStoryGroup(item)}>
									<View style={styles.storyRing}>
										{item.stories[0].mime_type === 'video/mp4' ? (
											<View style={styles.storyVideoFallback}><Text style={styles.storyVideoIcon}>▶</Text></View>
										) : (
											<Image source={{uri: api.storyMediaUrl(item.stories[0].id), headers: authHeaders}} style={styles.storyThumb} />
										)}
									</View>
									<Text style={styles.storyName} numberOfLines={1}>{item.owner_username ?? `#${item.owner_guid}`}</Text>
								</Pressable>
							)}
						/>
					</View>
				) : null}

				<Text style={styles.sectionTitle}>Участники ({event.attendee_count})</Text>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={attendees}
					keyExtractor={(a: BerxEventAttendee) => String(a.guid)}
					renderItem={({item}: {item: BerxEventAttendee}) => (
						<View style={styles.attendee}>
							<Image source={{uri: item.icon}} style={styles.attendeeIcon} />
							<Text style={styles.attendeeName} numberOfLines={1}>{item.fullname}</Text>
						</View>
					)}
				/>

				<BerxDiscussion api={api} type="event" id={event.guid} myGuid={myGuid} />
			</BerxFadeIn>
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	hero: {aspectRatio: 1.6, backgroundColor: colors.graphite},
	heroImage: {width: '100%', height: '100%'},
	heroFallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	heroInitial: {fontSize: typography.sizeHero, color: colors.textFaint},
	body: {padding: spacing.md, gap: spacing.md},
	when: {fontSize: typography.sizeSm, color: colors.textDim},
	place: {fontSize: typography.sizeSm, color: colors.accent},
	actions: {flexDirection: 'row', gap: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	checkinForm: {gap: spacing.sm},
	checkinHint: {fontSize: typography.sizeXs, color: colors.textFaint},
	checkinRow: {flexDirection: 'row', gap: spacing.sm},
	checkinHalf: {flex: 1},
	checkinMessage: {fontSize: typography.sizeSm, color: colors.accent},
	memoryRow: {marginTop: spacing.xs},
	memorySavedText: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, textAlign: 'center'},
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	seats: {fontSize: typography.sizeSm, color: colors.textFaint},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	// BERX WORLD — Life Moments: a quiet running log scoped to this
	// event, deliberately not styled like a post card.
	momentsSection: {gap: spacing.xs, marginTop: spacing.xs},
	momentInputRow: {flexDirection: 'row', gap: spacing.xs, alignItems: 'center'},
	momentInputField: {flex: 1},
	momentRow: {paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	momentRowHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	momentAuthor: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold},
	momentDelete: {fontSize: typography.sizeXs, color: colors.danger},
	momentText: {fontSize: typography.sizeSm, color: colors.white, marginTop: 2},
	friendsHereRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm},
	friendHereItem: {marginLeft: -spacing.xs},
	friendsHereLabel: {fontSize: typography.sizeSm, color: colors.textDim, marginLeft: spacing.sm},
	friendsWorldsLine: {fontSize: typography.sizeXs, color: colors.textFaint, fontStyle: 'italic'},
	storyRow: {gap: spacing.sm, paddingVertical: spacing.xs},
	storyItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	storyRing: {width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
	storyThumb: {width: 50, height: 50, borderRadius: 25},
	storyVideoFallback: {width: 50, height: 50, borderRadius: 25, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	storyVideoIcon: {color: colors.white, fontSize: typography.sizeBase},
	storyName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	attendee: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	attendeeIcon: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	attendeeName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
});
