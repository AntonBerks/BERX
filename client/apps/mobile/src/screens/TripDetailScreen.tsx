/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getTrip()/removeTripStop()/addTripParticipant()
 * (components/OssnApi/v1/trips.php). Stops are grouped by
 * day_number client-side from the flat list the server returns
 * (already ordered by day, sort_order) — no separate per-day fetch.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import {BerxMediaWell} from '../../../../packages/design-system/src/spatial/BerxMediaWell';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTripDetail, BerxTripStop, BerxTripParticipant, BerxFriend} from '@berx/api/types';
import {sharedElementTag} from '@berx/spatial';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxConfirm} from '../../../../packages/design-system/src/spatial/BerxConfirm';
import {BerxEditSheet} from '../../../../packages/design-system/src/spatial/BerxEditSheet';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxSceneHero} from '../../../../packages/design-system/src/spatial/BerxSceneHero';
import {BerxAvatarCluster} from '../../../../packages/design-system/src/spatial/BerxAvatarCluster';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {berxCount} from '@berx/domain';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

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
	if (trip.stop_count > 0) parts.push(berxCount(trip.stop_count, 'точка', 'точки', 'точек'));
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
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [editing, setEditing] = useState(false);
	const [retryable, setRetryable] = useState(true);
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
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different problems,
			   and being offline is a fourth. A 403 or a 404 also stops
			   offering a Retry that cannot work. */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
		} finally {
			setLoading(false);
		}
	}, [api, id, offline]);

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

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	async function removeIt() {
		await api.deleteTrip(id);
		/* only once the server has confirmed it is gone */
		onBack?.();
	}

	/* `updateTrip` is a real PATCH that nothing reached. The dates are
	   sent as null when cleared, which is what the client turns into the
	   empty string the endpoint reads as "unset" — a trip whose dates
	   moved could not be corrected at all before this. The stops and
	   participants are not in the returned row and are kept. */
	async function saveEdits(changed: Record<string, string | number | null>) {
		const updated = await api.updateTrip(id, {
			...(typeof changed.title === 'string' ? {title: changed.title} : {}),
			...(typeof changed.description === 'string' ? {description: changed.description} : {}),
			...(changed.visibility === 'private' || changed.visibility === 'public' ? {visibility: changed.visibility} : {}),
			...('startDate' in changed ? {startDate: typeof changed.startDate === 'number' ? changed.startDate : null} : {}),
			...('endDate' in changed ? {endDate: typeof changed.endDate === 'number' ? changed.endDate : null} : {}),
		});
		setTrip((prev) => (prev ? {...updated, stops: prev.stops, participants: prev.participants} : prev));
	}

	const header = (
		<BerxHeader onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error || !trip)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error ?? 'Поездка не найдена'} onRetry={retryable ? load : undefined} />
			</View>
		);

	const days = groupByDay(trip.stops);
	const participantGuids = new Set(trip.participants.map((p: BerxTripParticipant) => p.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !participantGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			{/* the title lives in the hero, so the way back does not
			    repeat it */}
			{header}

			{/* the journey as the scene's subject. A trip has no cover in
			    the API, and the hero is built for that: it renders the
			    room's own lit surface rather than a borrowed photograph.
			    Its meta is the two real facts a trip has — how many stops
			    it holds and when it runs. */}
			<BerxSceneHero
				/* the same object the list card sent forward */
				sharedTag={sharedElementTag('heroMedia', id)}
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
					<BerxText role="meta" emphasis="tertiary" style={styles.hint}>Все друзья уже участвуют.</BerxText>
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
								<BerxText role="meta" emphasis="secondary" style={styles.pickerName} numberOfLines={1}>{item.fullname}</BerxText>
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
				<BerxSceneList rows
					data={days}
					keyExtractor={([day]: [number, BerxTripStop[]]) => String(day)}
					contentContainerStyle={styles.list}
					renderItem={({item: [day, stops]}: {item: [number, BerxTripStop[]]}) => (
						<View style={styles.dayBlock}>
							<BerxText role="micro" emphasis="tertiary">День {day}</BerxText>
							{stops.map((s: BerxTripStop) => (
								<BerxSpatialCard
									key={s.stop_id}
									depth="D3"
									padding={spacing.md}
									radius={18}
									onPress={() => (s.item_type === 'place' ? onOpenPlace(s.item_guid) : onOpenEvent(s.item_guid))}
									accessibilityLabel={`${s.title}, ${s.item_type === 'place' ? 'место' : 'событие'}, день ${day}`}>
									<View style={styles.stopRow}>
									{s.image_url ? <Image source={{uri: s.image_url}} style={styles.thumb} /> : <BerxMediaWell radius={radius.sm} style={styles.thumbFallback} />}
									<View style={styles.stopBody}>
										<BerxText role="callout" numberOfLines={1}>{s.title}</BerxText>
										<BerxText role="meta" emphasis="tertiary">{s.item_type === 'place' ? 'Место' : 'Событие'}</BerxText>
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

				{/* The owner can take it down. `deleteTrip` is real and
				    ownership-checked on the server, and no screen in BERX
				    called it — you could make one of these and never remove
				    it. */}
				{trip.is_own ? (
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton label="Изменить поездку" variant="secondary" onPress={() => setEditing(true)} fullWidth />
						<BerxButton label="Удалить поездку" variant="danger" onPress={() => setConfirmDelete(true)} fullWidth />
					</BerxActionShelf>
				) : null}

				<BerxEditSheet
					visible={editing}
					title="Изменить поездку"
					offline={offline}
					fields={[
						{key: 'title', kind: 'text', label: 'Название', value: trip.title, required: true},
						{key: 'description', kind: 'multiline', label: 'Описание', value: trip.description},
						{
							key: 'visibility',
							kind: 'choice',
							label: 'Кто увидит',
							value: trip.visibility,
							options: [
								{key: 'private', label: 'Только я'},
								{key: 'public', label: 'Все'},
							],
						},
						{key: 'startDate', kind: 'moment', label: 'Начало', value: trip.start_date, clearable: true},
						{key: 'endDate', kind: 'moment', label: 'Конец', value: trip.end_date, clearable: true},
					]}
					onSave={saveEdits}
					onClose={() => setEditing(false)}
					testID="trip-edit"
				/>

				<BerxConfirm
					visible={confirmDelete}
					title={`Удалить «${trip.title}»?`}
					body="Поездка исчезнет вместе со всеми остановками и участниками. Это нельзя отменить."
					confirmLabel="Удалить"
					destructive
					onConfirm={removeIt}
					onCancel={() => setConfirmDelete(false)}
					testID="trip-delete-confirm"
				/>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	description: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
	hint: {paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {marginTop: 4},
	participantsRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	list: {paddingBottom: spacing.xxxl},
	dayBlock: {gap: spacing.sm, marginBottom: spacing.md},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	stopRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48},
	stopBody: {flex: 1, gap: 2},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
