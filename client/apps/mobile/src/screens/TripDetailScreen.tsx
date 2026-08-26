/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getTrip()/removeTripStop()/addTripParticipant()
 * (components/OssnApi/v1/trips.php). Stops are grouped by
 * day_number client-side from the flat list the server returns
 * (already ordered by day, sort_order) — no separate per-day fetch.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTripDetail, BerxTripStop, BerxTripParticipant, BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	id: number;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

function groupByDay(stops: BerxTripStop[]): [number, BerxTripStop[]][] {
	const map = new Map<number, BerxTripStop[]>();
	for (const s of stops) {
		if (!map.has(s.day_number)) map.set(s.day_number, []);
		map.get(s.day_number)!.push(s);
	}
	return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

export default function TripDetailScreen({api, id, onOpenPlace, onOpenEvent, onBack}: Props) {
	const [trip, setTrip] = useState<BerxTripDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [t, f] = await Promise.all([api.getTrip(id), api.friends()]);
			setTrip(t);
			setFriends(f.friends);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Поездка недоступна');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function removeStop(stopId: number) {
		if (!trip) return;
		try {
			await api.removeTripStop(trip.id, stopId);
			setTrip({...trip, stops: trip.stops.filter((s: BerxTripStop) => s.stop_id !== stopId)});
		} catch {
			// list stays as-is on failure
		}
	}

	async function addParticipant(guid: number) {
		if (!trip) return;
		setBusy(true);
		try {
			await api.addTripParticipant(trip.id, guid);
			await load();
		} catch {
			// server rejects non-friends/duplicates with a real error
		} finally {
			setBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !trip) return <BerxErrorState message={error ?? 'Поездка не найдена'} onRetry={load} />;

	const days = groupByDay(trip.stops);
	const participantGuids = new Set(trip.participants.map((p: BerxTripParticipant) => p.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !participantGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			<BerxHeader title={trip.title} onBack={onBack} />
			{trip.description ? <Text style={styles.description}>{trip.description}</Text> : null}

			{trip.is_own ? (
				<View style={styles.toolbar}>
					<Pressable onPress={() => setShowPicker(!showPicker)}>
						<Text style={styles.toggleBtnText}>{showPicker ? 'Скрыть друзей' : 'Пригласить друга'}</Text>
					</Pressable>
				</View>
			) : null}

			{showPicker ? (
				availableFriends.length === 0 ? (
					<Text style={styles.hint}>Все друзья уже участвуют.</Text>
				) : (
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={availableFriends}
						keyExtractor={(f: BerxFriend) => String(f.guid)}
						contentContainerStyle={styles.pickerRow}
						renderItem={({item}: {item: BerxFriend}) => (
							<Pressable style={styles.pickerItem} onPress={() => addParticipant(item.guid)} disabled={busy}>
								<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
								<Text style={styles.pickerName} numberOfLines={1}>{item.fullname}</Text>
							</Pressable>
						)}
					/>
				)
			) : null}

			{trip.participants.length > 0 ? (
				<View style={styles.participantsRow}>
					{trip.participants.map((p: BerxTripParticipant) => (
						<Image key={p.guid} source={{uri: p.icon}} style={styles.participantAvatar} />
					))}
				</View>
			) : null}

			{days.length === 0 ? (
				<BerxEmptyState title="Маршрут пока пуст" subtitle="Добавляйте места и события со страниц Places/Events." />
			) : (
				<FlatList
					data={days}
					keyExtractor={([day]: [number, BerxTripStop[]]) => String(day)}
					contentContainerStyle={styles.list}
					renderItem={({item: [day, stops]}: {item: [number, BerxTripStop[]]}) => (
						<View style={styles.dayBlock}>
							<Text style={styles.dayLabel}>День {day}</Text>
							{stops.map((s: BerxTripStop) => (
								<Pressable
									key={s.stop_id}
									style={styles.stopRow}
									onPress={() => (s.item_type === 'place' ? onOpenPlace(s.item_guid) : onOpenEvent(s.item_guid))}>
									{s.image_url ? <Image source={{uri: s.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
									<View style={styles.stopBody}>
										<Text style={styles.stopTitle} numberOfLines={1}>{s.title}</Text>
										<Text style={styles.stopType}>{s.item_type === 'place' ? 'Место' : 'Событие'}</Text>
									</View>
									{trip.is_own ? (
										<Pressable onPress={() => removeStop(s.stop_id)} hitSlop={8}>
											<Text style={styles.remove}>✕</Text>
										</Pressable>
									) : null}
								</Pressable>
							))}
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	description: {fontSize: typography.sizeSm, color: colors.textDim, paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	toolbar: {paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	toggleBtnText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	participantsRow: {flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: -8},
	participantAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite, borderWidth: 2, borderColor: colors.bg, marginRight: -8},
	list: {padding: spacing.md, gap: spacing.md},
	dayBlock: {gap: spacing.sm, marginBottom: spacing.md},
	dayLabel: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	stopRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	stopBody: {flex: 1, gap: 2},
	stopTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	stopType: {fontSize: typography.sizeXs, color: colors.textFaint},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
