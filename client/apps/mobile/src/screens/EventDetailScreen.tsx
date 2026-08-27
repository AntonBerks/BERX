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
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Image, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxEventAttendee, BerxExperienceGraphFriend, BerxEventStoryItem, BerxStoryFeedGroup} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	onOpenPlace?: (guid: number) => void;
	onOpenCommunity?: (guid: number) => void;
	onOpenInvite: (guid: number) => void;
	onAddToCollection?: () => void;
	onAddToTrip?: () => void;
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

export default function EventDetailScreen({api, guid, myGuid, onOpenPlace, onOpenCommunity, onOpenInvite, onAddToCollection, onAddToTrip, onAddEventStory, onOpenStoryGroup, onEdit, onBack}: Props) {
	const [event, setEvent] = useState<BerxEvent | null>(null);
	const [attendees, setAttendees] = useState<BerxEventAttendee[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rsvping, setRsvping] = useState(false);
	const [rsvpError, setRsvpError] = useState<string | null>(null);
	const [friendsGoing, setFriendsGoing] = useState<BerxExperienceGraphFriend[]>([]);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [e, a] = await Promise.all([api.getEvent(guid), api.eventAttendees(guid)]);
			setEvent(e);
			setAttendees(a.attendees);
			// Experience Graph — best-effort, never blocks the event itself.
			api.eventExperienceGraph(guid).then((g) => setFriendsGoing(g.friends_going)).catch(() => undefined);
			api.eventStories(guid).then((s) => setStoryGroups(groupStoriesByOwner(s.stories))).catch(() => undefined);
			api.getAuthHeaders().then(setAuthHeaders).catch(() => undefined);
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

	if (loading && !event) return <BerxLoadingState />;
	if (error && !event) return <BerxErrorState message={error} onRetry={load} />;
	if (!event) return null;

	const date = new Date(event.starts * 1000);
	const rsvpLabel = event.has_ended ? 'Завершено' : event.is_going ? 'Вы идёте' : event.seats_left === 0 ? 'Мест нет' : 'Пойду';
	const rsvpDisabled = event.has_ended || (event.seats_left === 0 && !event.is_going);

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
					{!event.has_ended ? <BerxButton label="Пригласить" variant="secondary" onPress={() => onOpenInvite(event.guid)} /> : null}
					{onAddToCollection ? <BerxButton label="В подборку" variant="secondary" onPress={onAddToCollection} /> : null}
					{onAddToTrip ? <BerxButton label="В поездку" variant="secondary" onPress={onAddToTrip} /> : null}
					{event.is_going && onAddEventStory ? <BerxButton label="Добавить историю" variant="secondary" onPress={() => onAddEventStory(event.guid)} /> : null}
					{myGuid === event.owner_guid && onEdit ? <BerxButton label="Редактировать" variant="secondary" onPress={onEdit} /> : null}
				</View>
				{rsvpError ? <Text style={styles.error}>{rsvpError}</Text> : null}

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

const styles = StyleSheet.create({
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
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	seats: {fontSize: typography.sizeSm, color: colors.textFaint},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	friendsHereRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm},
	friendHereItem: {marginLeft: -spacing.xs},
	friendsHereLabel: {fontSize: typography.sizeSm, color: colors.textDim, marginLeft: spacing.sm},
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
