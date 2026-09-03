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
 *
 * BERX WORLD REBUILD — same gap PlaceDetailScreen had: a small
 * fixed-ratio photo, plain-text when/place lines, a wrapped row of
 * buttons, and a plain hairline-divided moments log. All state/
 * handlers below are unchanged; only the render/style layer moved to
 * BERX WORLD's vocabulary: a full-bleed hero that recedes on real
 * scroll (BerxSpatialLayer) with title/when/place resting on its
 * scrim, a real "friends going" presence badge (BerxAvatarStack) on
 * the hero itself, a glass action bar, and moments as individual
 * BerxGlassSurface cards instead of hairline-divided rows.
 */
import {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {View, Text, Animated, Image, FlatList, Pressable, RefreshControl, Dimensions, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxEventAttendee, BerxExperienceGraphFriend, BerxExperienceGraphWorldFriend, BerxEventStoryItem, BerxStoryFeedGroup, BerxLifeMoment} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxSpatialLayer} from '../../../../packages/design-system/src/components/BerxSpatialLayer';
import {BerxScrim} from '../../../../packages/design-system/src/components/BerxScrim';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

// Same reasoning as PlaceDetailScreen's own HERO_H — cinematic but not
// overwhelming, since attendees/moments/discussion follow below.
const HERO_H = Math.round(Dimensions.get('window').height * 0.58);

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
	/**
	 * Real "context everywhere" entry point (master build directive §56),
	 * same reasoning as PlaceDetailScreen's own: from an event the user
	 * is already looking at, record a real experience anchored to THIS
	 * event rather than sending them to search for it again.
	 */
	onCreateExperience?: (anchor: {type: 'event'; guid: number; title: string}) => void;
	/** Event → Attendees → Group Chat ("context everywhere", master build directive §56) — finds this event's real group or offers to create one; attendee-only, same gate as "Добавить историю". */
	onOpenGroupChat?: (anchor: {guid: number; title: string}) => void;
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

export default function EventDetailScreen({api, guid, myGuid, onOpenPlace, onOpenCommunity, onOpenInvite, onAddToCollection, onAddToTrip, onAddToWorld, onAddEventStory, onOpenStoryGroup, onCreateExperience, onOpenGroupChat, onEdit, onBack}: Props) {
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
	const scrollY = useRef(new Animated.Value(0)).current;

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
		<Animated.ScrollView
			style={styles.screen}
			scrollEventThrottle={16}
			onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: true})}
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

			<View style={styles.hero}>
				{/* BERX SPATIAL — same real scroll-driven parallax as
				    PlaceDetailScreen's hero (BerxSpatialLayer, this screen's
				    own scrollY driver). */}
				<BerxSpatialLayer plane="background" driver={scrollY} range={280} style={StyleSheet.absoluteFillObject}>
					{event.cover_url ? (
						<Image source={{uri: event.cover_url}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
					) : (
						<View style={[StyleSheet.absoluteFillObject, styles.heroFallback]}>
							<Text style={styles.heroFallbackGlyph}>{event.title.charAt(0).toUpperCase()}</Text>
						</View>
					)}
				</BerxSpatialLayer>
				<BerxScrim coverage={0.72} strength={0.88} />

				{friendsGoing.length > 0 ? (
					<BerxGlassSurface padding="sm" style={styles.presenceBadge}>
						<BerxAvatarStack
							people={friendsGoing.slice(0, 6).map((f: BerxExperienceGraphFriend) => ({guid: f.guid, icon: f.icon, initial: f.username.charAt(0)}))}
							total={friendsGoing.length}
							size={26}
						/>
						<Text style={styles.presenceLabel}>{friendsGoing.length === 1 ? '1 друг идёт' : `${friendsGoing.length} друзей идут`}</Text>
					</BerxGlassSurface>
				) : null}

				<BerxFadeIn riseFrom={0} style={styles.heroContent}>
					<Text style={styles.heroTitle}>{event.title}</Text>
					<Text style={styles.when}>
						{date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})} · {date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
					</Text>
					{event.place ? (
						<Pressable style={styles.placeRow} onPress={() => onOpenPlace?.(event.place!.guid)}>
							<BerxIcon name="map-pin" size={14} color={colors.textDim} />
							<Text style={styles.place}>{event.place.title}</Text>
						</Pressable>
					) : event.location ? (
						<View style={styles.placeRow}>
							<BerxIcon name="map-pin" size={14} color={colors.textDim} />
							<Text style={styles.place}>{event.location}</Text>
						</View>
					) : null}
					{event.group ? (
						<Pressable style={styles.placeRow} onPress={() => onOpenCommunity?.(event.group!.guid)}>
							<BerxIcon name="users" size={14} color={colors.textDim} />
							<Text style={styles.place}>Организовано сообществом «{event.group.title}»</Text>
						</Pressable>
					) : null}
				</BerxFadeIn>
			</View>

			<BerxFadeIn style={styles.body}>
				<BerxGlassSurface padding="sm" style={styles.actionBar}>
				<View style={styles.actions}>
				{/* The variant was INVERTED: primary when already going, secondary
					    when not. So "Пойду" — the whole point of the screen — was
					    drawn quiet, and "Вы идёте", a settled state needing no
					    emphasis at all, was drawn in the accent. The accent belongs
					    on the action you want taken, never on the one already taken.
					    Also stays secondary when the button is dead (ended, full):
					    an accent on a disabled control is a promise the screen
					    cannot keep. */}
					<BerxButton
						label={rsvpLabel}
						variant={!event.is_going && !rsvpDisabled ? 'primary' : 'secondary'}
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
					{/* Going-only actions, which only exist once you have RSVP'd —
					    they belong with the RSVP, not scattered among the filing
					    actions below. */}
					{event.is_going && onAddEventStory ? <BerxButton label="Добавить историю" variant="secondary" onPress={() => onAddEventStory(event.guid)} /> : null}
					{event.is_going && onOpenGroupChat ? (
						<BerxButton label="Групповой чат" variant="secondary" onPress={() => onOpenGroupChat({guid: event.guid, title: event.title})} />
					) : null}
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
				{/* Same three-job split PlaceDetail now uses: DO (rsvp, invite,
				    check in), and FILE — the "add this event to a thing"
				    actions, which were interleaved with the rest so nothing on
				    the screen read as the thing to do. */}
				{onAddToCollection || onAddToTrip || onAddToWorld || onCreateExperience ? (
					<View style={styles.fileGroup}>
						<Text style={styles.fileLabel}>Добавить</Text>
						<View style={styles.actions}>
							{onAddToCollection ? <BerxButton label="В подборку" variant="secondary" onPress={onAddToCollection} /> : null}
							{onAddToTrip ? <BerxButton label="В поездку" variant="secondary" onPress={onAddToTrip} /> : null}
							{onAddToWorld ? <BerxButton label="В мир" variant="secondary" onPress={onAddToWorld} /> : null}
							{onCreateExperience ? (
								<BerxButton
									label="Впечатление"
									variant="secondary"
									onPress={() => onCreateExperience({type: 'event', guid: event.guid, title: event.title})}
								/>
							) : null}
						</View>
					</View>
				) : null}
				</BerxGlassSurface>
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
								<BerxGlassSurface key={m.id} padding="sm" style={styles.momentRow}>
									<View style={styles.momentRowHeader}>
										<Text style={styles.momentAuthor}>{m.owner_username ?? 'Кто-то'}</Text>
										{myGuid === m.owner_guid ? (
											<Pressable onPress={() => deleteMoment(m.id)}>
												<Text style={styles.momentDelete}>удалить</Text>
											</Pressable>
										) : null}
									</View>
									<Text style={styles.momentText}>{m.text}</Text>
								</BerxGlassSurface>
							))}
						</View>
					</>
				) : null}

				{event.description ? <Text style={styles.description}>{event.description}</Text> : null}

				{event.seats_left !== null ? <Text style={styles.seats}>Свободных мест: {event.seats_left}</Text> : null}

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
		</Animated.ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	hero: {height: HERO_H, backgroundColor: colors.mediaScrim, justifyContent: 'flex-end', overflow: 'hidden'},
	heroFallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	heroFallbackGlyph: {fontSize: typography.sizeHero, color: colors.textFaint, fontWeight: typography.weightBold},
	presenceBadge: {position: 'absolute', top: spacing.xl, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	presenceLabel: {fontSize: typography.sizeXs, color: colors.onMediaDim},
	heroContent: {padding: spacing.xl, gap: 2},
	heroTitle: {
		fontSize: typography.sizeTitle,
		fontWeight: typography.weightBold,
		color: colors.onMedia,
		letterSpacing: -0.4,
		marginBottom: spacing.xs,
	},
	body: {padding: spacing.md, gap: spacing.md},
	when: {fontSize: typography.sizeSm, color: colors.onMediaDim},
	placeRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	fileGroup: {marginTop: spacing.md, gap: spacing.sm},
	fileLabel: {color: colors.textFaint, fontSize: typography.sizeXs, textTransform: 'uppercase', letterSpacing: 0.5},
	place: {fontSize: typography.sizeSm, color: colors.accentOnMedia},
	actions: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap'},
	actionBar: {gap: spacing.sm},
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
	// event, each entry its own real glass card rather than a post.
	momentsSection: {gap: spacing.xs, marginTop: spacing.xs},
	momentInputRow: {flexDirection: 'row', gap: spacing.xs, alignItems: 'center'},
	momentInputField: {flex: 1},
	momentRow: {gap: 2},
	momentRowHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	momentAuthor: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold},
	momentDelete: {fontSize: typography.sizeXs, color: colors.danger},
	momentText: {fontSize: typography.sizeSm, color: colors.white, marginTop: 2},
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
