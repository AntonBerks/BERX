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
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxSceneHero} from '../../../../packages/design-system/src/spatial/BerxSceneHero';
import {BerxAvatarCluster} from '../../../../packages/design-system/src/spatial/BerxAvatarCluster';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

export interface TripDetailScreenProps {
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

/**
 * The two facts a trip actually has: how many stops it holds and when
 * it runs. Never a third one invented to fill the line.
 */
function tripMeta(trip: {stop_count: number; start_date: number | null; end_date: number | null}): string | undefined {
	const parts: string[] = [];
	if (trip.stop_count > 0) {
		const n = trip.stop_count;
		const mod10 = n % 10;
		const mod100 = n % 100;
		const word = mod10 === 1 && mod100 !== 11 ? 'точка' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'точки' : 'точек';
		parts.push(`${n} ${word}`);
	}
	if (trip.start_date) {
		const from = new Date(trip.start_date * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
		const to = trip.end_date ? new Date(trip.end_date * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) : null;
		parts.push(to && to !== from ? `${from} — ${to}` : from);
	}
	return parts.length > 0 ? parts.join(' · ') : undefined;
}

export default function TripDetailScreen(props: TripDetailScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" testID="trip-detail">
			<TripDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

/** The first stop carrying an image — where the trip is actually going. */
function tripMedia(trip: BerxTripDetail | null): {uri: string} | undefined {
	const stop = trip?.stops.find((s) => s.image_url);
	return stop?.image_url ? {uri: stop.image_url} : undefined;
}

function TripDetailScreenBody({api, id, onOpenPlace, onOpenEvent, onBack}: TripDetailScreenProps) {
	const [trip, setTrip] = useState<BerxTripDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [busy, setBusy] = useState(false);

	/* the first stop that has an image is where the journey is going */
	useBerxSceneAtmosphere(tripMedia(trip));

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
			{/* the title lives in the hero, so the way back does not
			    repeat it */}
			<BerxHeader onBack={onBack} />

			{/* the journey as the scene's subject. A trip has no cover in
			    the API, and the hero is built for that: it renders the
			    room's own lit surface rather than a borrowed photograph.
			    Its meta is the two real facts a trip has — how many stops
			    it holds and when it runs. */}
			<BerxSceneHero
				title={trip.title}
				meta={tripMeta(trip)}
				height={190}
				actions={
					trip.is_own ? (
						<BerxButton
							label={showPicker ? 'Скрыть друзей' : 'Пригласить друга'}
							variant="secondary"
							onPress={() => setShowPicker(!showPicker)}
							accessibilityState={{expanded: showPicker}}
						/>
					) : undefined
				}
			/>

			{trip.description ? (
				<BerxText role="body" emphasis="secondary" style={styles.description}>
					{trip.description}
				</BerxText>
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
							<Pressable
								style={styles.pickerItem}
								accessibilityRole="button"
								accessibilityLabel={`Добавить ${item.fullname} в поездку`}
								accessibilityState={{disabled: busy}}
								onPress={() => addParticipant(item.guid)}
								disabled={busy}>
								<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
								<Text style={styles.pickerName} numberOfLines={1}>{item.fullname}</Text>
							</Pressable>
						)}
					/>
				)
			) : null}

			{/* who is on the trip, as one addressable object that
			    announces the names rather than a row of unlabelled
			    circles */}
			{trip.participants.length > 0 ? (
				<View style={styles.participantsRow}>
					<BerxAvatarCluster
						members={trip.participants.map((p: BerxTripParticipant) => ({
							guid: p.guid,
							name: p.fullname,
							avatarUrl: p.icon,
						}))}
						contextLabel="участники поездки"
					/>
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
								<BerxSpatialCard
									key={s.stop_id}
									depth="D3"
									padding={spacing.md}
									radius={18}
									onPress={() => (s.item_type === 'place' ? onOpenPlace(s.item_guid) : onOpenEvent(s.item_guid))}
									accessibilityLabel={`${s.title}, ${s.item_type === 'place' ? 'место' : 'событие'}, день ${day}`}>
									<View style={styles.stopRow}>
									{s.image_url ? <Image source={{uri: s.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
									<View style={styles.stopBody}>
										<Text style={styles.stopTitle} numberOfLines={1}>{s.title}</Text>
										<Text style={styles.stopType}>{s.item_type === 'place' ? 'Место' : 'Событие'}</Text>
									</View>
									{trip.is_own ? (
										<Pressable
											onPress={() => removeStop(s.stop_id)}
											hitSlop={8}
											accessibilityRole="button"
											accessibilityLabel={`Убрать ${s.title} из поездки`}>
											<BerxIcon name="close" size={15} decorative />
										</Pressable>
									) : null}
									</View>
								</BerxSpatialCard>
							))}
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	description: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	participantsRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	list: {padding: spacing.md, gap: spacing.md},
	dayBlock: {gap: spacing.sm, marginBottom: spacing.md},
	dayLabel: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	stopRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	stopBody: {flex: 1, gap: 2},
	stopTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	stopType: {fontSize: typography.sizeXs, color: colors.textFaint},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
