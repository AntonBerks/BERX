/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real RSVP: api.rsvpEvent()/cancelRsvp() — capacity is re-checked
 * server-side immediately before insert (OssnEvents::rsvp()), so a
 * double-tap here cannot oversell an event; the server response is
 * always the source of truth for seats_left/attendee_count, not a
 * client-side guess.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, ScrollView, Image, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxEventAttendee} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxEventHero} from '../../../../packages/design-system/src/spatial/BerxEventHero';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';
import {BerxEyebrow} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';

export interface EventDetailScreenProps {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	onOpenPlace?: (guid: number) => void;
	onOpenInvite: (guid: number) => void;
	onAddToCollection?: () => void;
	onAddEventStory?: (eventGuid: number) => void;
	onBack?: () => void;
}

export default function EventDetailScreen(props: EventDetailScreenProps) {
	/**
	 * The event's real poster becomes the atmosphere the whole scene
	 * sits in — the archive's D1 layer doing its actual job, rather
	 * than a banner cropped into the top of a scrolling page. Scrimmed
	 * so contrast never depends on the artwork; absent when the event
	 * has no poster, because BERX does not invent one.
	 */
	const [poster, setPoster] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		props.api
			.getEvent(props.guid)
			.then((event) => {
				if (!cancelled) setPoster(event.cover_url ?? null);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [props.api, props.guid]);

	return (
		<BerxFamilyScene
			family="EVENTS"
			atmosphere={poster ? {uri: poster} : undefined}
			testID="event-detail">
			<EventDetailSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function EventDetailSceneBody({api, guid, myGuid, onOpenPlace, onOpenInvite, onAddToCollection, onAddEventStory, onBack}: EventDetailScreenProps) {
	const [event, setEvent] = useState<BerxEvent | null>(null);
	const [attendees, setAttendees] = useState<BerxEventAttendee[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [rsvping, setRsvping] = useState(false);
	const [rsvpError, setRsvpError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [e, a] = await Promise.all([api.getEvent(guid), api.eventAttendees(guid)]);
			setEvent(e);
			setAttendees(a.attendees);
		} catch (e2) {
			setError(e2 instanceof Error ? e2.message : 'Не удалось загрузить событие');
		} finally {
			setLoading(false);
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
		<ScrollView style={styles.screen}>
			<BerxHeader title={event.title} onBack={onBack} />
			{/**
			 * A real countdown to the server-recorded start, the real
			 * attendee count and the real remaining capacity. No ticket:
			 * RSVP and capacity exist, payment and ticket issuance do
			 * not, so BerxTicket stays BLOCKED rather than rendering an
			 * artefact nobody can redeem.
			 */}
			<BerxEventHero
				eventGuid={event.guid}
				title={event.title}
				startsAtUnix={event.starts}
				placeName={event.place?.title ?? event.location ?? undefined}
				poster={event.cover_url ? {uri: event.cover_url} : undefined}
				goingCount={event.attendee_count}
				capacityLeft={event.seats_left ?? undefined}
			/>

			<View style={styles.body}>
				<BerxText role="meta" emphasis="secondary">
					{date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})} · {date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
				</BerxText>
				{/* where, with the icon set's own pin. The emoji that used
				    to be here is a colour image from the platform's font:
				    it ignores the scene's accent and looks different on
				    every device BERX runs on. */}
				{event.place ? (
					<Pressable
						style={styles.placeRow}
						accessibilityRole="button"
						accessibilityLabel={`Место: ${event.place.title}`}
						onPress={() => onOpenPlace?.(event.place!.guid)}>
						<BerxIcon name="location" size={15} state="active" decorative />
						<BerxText role="meta" emphasis="accent">
							{event.place.title}
						</BerxText>
					</Pressable>
				) : event.location ? (
					<View style={styles.placeRow}>
						<BerxIcon name="location" size={15} decorative />
						<BerxText role="meta" emphasis="secondary">
							{event.location}
						</BerxText>
					</View>
				) : null}

				<BerxActionShelf variant="anchored">
					<BerxButton
						label={rsvpLabel}
						variant={event.is_going ? 'primary' : 'secondary'}
						loading={rsvping}
						disabled={rsvpDisabled}
						onPress={toggleRsvp}
					/>
					{!event.has_ended ? <BerxButton label="Пригласить" variant="secondary" onPress={() => onOpenInvite(event.guid)} /> : null}
					{onAddToCollection ? <BerxButton label="В подборку" variant="secondary" onPress={onAddToCollection} /> : null}
					{event.is_going && onAddEventStory ? <BerxButton label="Добавить историю" variant="secondary" onPress={() => onAddEventStory(event.guid)} /> : null}
				</BerxActionShelf>
				{rsvpError ? <Text style={styles.error}>{rsvpError}</Text> : null}

				{event.description ? <BerxText role="body">{event.description}</BerxText> : null}

				{event.seats_left !== null ? <BerxText role="meta" emphasis="tertiary">Свободных мест: {event.seats_left}</BerxText> : null}

				<BerxEyebrow tone="quiet">Участники ({event.attendee_count})</BerxEyebrow>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={attendees}
					keyExtractor={(a: BerxEventAttendee) => String(a.guid)}
					renderItem={({item}: {item: BerxEventAttendee}) => (
						<View style={styles.attendee}>
							<Image source={{uri: item.icon}} style={styles.attendeeIcon} />
							<BerxText role="meta" emphasis="secondary" style={styles.attendeeName} numberOfLines={1}>{item.fullname}</BerxText>
						</View>
					)}
				/>

				<BerxDiscussion api={api} type="event" id={event.guid} myGuid={myGuid} />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	hero: {aspectRatio: 1.6, backgroundColor: colors.graphite},
	heroImage: {width: '100%', height: '100%'},
	heroFallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	heroInitial: {fontSize: typography.sizeHero, color: colors.textFaint},
	body: {padding: spacing.md, gap: spacing.md},
	/* 44dp when it navigates; the row is the control, not the word */
	placeRow: {flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44},
	actions: {flexDirection: 'row', gap: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	attendee: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	attendeeIcon: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	attendeeName: {marginTop: 4},
});
