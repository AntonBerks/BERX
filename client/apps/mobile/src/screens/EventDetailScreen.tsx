/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real RSVP: api.rsvpEvent()/cancelRsvp() — capacity is re-checked
 * server-side immediately before insert (OssnEvents::rsvp()), so a
 * double-tap here cannot oversell an event; the server response is
 * always the source of truth for seats_left/attendee_count, not a
 * client-side guess.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Image, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxEventAttendee} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	onOpenPlace?: (guid: number) => void;
	onOpenInvite: (guid: number) => void;
	onAddToCollection?: () => void;
	onAddEventStory?: (eventGuid: number) => void;
	onBack?: () => void;
}

export default function EventDetailScreen({api, guid, myGuid, onOpenPlace, onOpenInvite, onAddToCollection, onAddEventStory, onBack}: Props) {
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
			<View style={styles.hero}>
				{event.cover_url ? (
					<Image source={{uri: event.cover_url}} style={styles.heroImage} />
				) : (
					<View style={styles.heroFallback}>
						<Text style={styles.heroInitial}>{event.title.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</View>

			<View style={styles.body}>
				<Text style={styles.when}>
					{date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})} · {date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
				</Text>
				{event.place ? (
					<Text style={styles.place} onPress={() => onOpenPlace?.(event.place!.guid)}>📍 {event.place.title}</Text>
				) : event.location ? (
					<Text style={styles.place}>📍 {event.location}</Text>
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
					{event.is_going && onAddEventStory ? <BerxButton label="Добавить историю" variant="secondary" onPress={() => onAddEventStory(event.guid)} /> : null}
				</View>
				{rsvpError ? <Text style={styles.error}>{rsvpError}</Text> : null}

				{event.description ? <Text style={styles.description}>{event.description}</Text> : null}

				{event.seats_left !== null ? <Text style={styles.seats}>Свободных мест: {event.seats_left}</Text> : null}

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
			</View>
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
	attendee: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	attendeeIcon: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	attendeeName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
});
