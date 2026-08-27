/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getTrip()/removeTripStop()/addTripParticipant()
 * (components/OssnApi/v1/trips.php). Stops are grouped by
 * day_number client-side from the flat list the server returns
 * (already ordered by day, sort_order) — no separate per-day fetch.
 *
 * MAX BUILD — closes the same class of gap as EditPlaceScreen/
 * EditEventScreen: api.updateTrip()/deleteTrip()/removeTripParticipant()
 * were always real, working client methods with zero UI callers. A
 * trip is simple enough (title/description/visibility, no date-
 * picker-dependent fields — CreateTripScreen already leaves
 * start/end unset for the same disclosed no-picker-library reason)
 * that a full-screen editor would be overkill; the edit form lives
 * inline here instead of as a separate route, same principle as not
 * building empty screens just to hit a number.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, Alert, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTripDetail, BerxTripStop, BerxTripParticipant, BerxFriend, BerxCollectionVisibility} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	id: number;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onDeleted?: () => void;
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

export default function TripDetailScreen({api, id, onOpenPlace, onOpenEvent, onDeleted, onBack}: Props) {
	const [trip, setTrip] = useState<BerxTripDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [busy, setBusy] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editVisibility, setEditVisibility] = useState<BerxCollectionVisibility>('private');
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

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
			setRefreshing(false);
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

	function openEdit() {
		if (!trip) return;
		setEditTitle(trip.title);
		setEditDescription(trip.description ?? '');
		setEditVisibility(trip.visibility);
		setEditError(null);
		setEditing(true);
	}

	async function saveEdit() {
		if (!trip) return;
		if (!editTitle.trim()) {
			setEditError('Введите название поездки.');
			return;
		}
		setSaving(true);
		setEditError(null);
		try {
			const updated = await api.updateTrip(trip.id, {
				title: editTitle.trim(),
				description: editDescription.trim(),
				visibility: editVisibility,
			});
			setTrip({...trip, ...updated});
			setEditing(false);
		} catch (e) {
			setEditError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSaving(false);
		}
	}

	function confirmDeleteTrip() {
		if (!trip) return;
		Alert.alert(
			'Удалить поездку?',
			'Маршрут и список участников будут удалены без возможности восстановления.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteTrip(trip.id);
							if (onDeleted) onDeleted();
							else onBack?.();
						} catch (e) {
							setEditError(e instanceof Error ? e.message : 'Не удалось удалить поездку');
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	}

	async function removeParticipant(guid: number) {
		if (!trip) return;
		try {
			await api.removeTripParticipant(trip.id, guid);
			setTrip({...trip, participants: trip.participants.filter((p: BerxTripParticipant) => p.guid !== guid)});
		} catch {
			// list stays as-is on failure
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
			{!editing && trip.description ? <Text style={styles.description}>{trip.description}</Text> : null}

			{trip.is_own && !editing ? (
				<View style={styles.toolbar}>
					<Pressable onPress={() => setShowPicker(!showPicker)}>
						<Text style={styles.toggleBtnText}>{showPicker ? 'Скрыть друзей' : 'Пригласить друга'}</Text>
					</Pressable>
					<Pressable onPress={openEdit}>
						<Text style={styles.toggleBtnText}>Редактировать</Text>
					</Pressable>
				</View>
			) : null}

			{editing ? (
				<View style={styles.editForm}>
					<BerxInput placeholder="Название поездки" value={editTitle} onChangeText={setEditTitle} />
					<BerxInput placeholder="Описание" value={editDescription} onChangeText={setEditDescription} multiline />
					<View style={styles.row}>
						<Pressable style={[styles.chip, editVisibility === 'private' && styles.chipActive]} onPress={() => setEditVisibility('private')}>
							<Text style={[styles.chipText, editVisibility === 'private' && styles.chipTextActive]}>Приватная</Text>
						</Pressable>
						<Pressable style={[styles.chip, editVisibility === 'public' && styles.chipActive]} onPress={() => setEditVisibility('public')}>
							<Text style={[styles.chipText, editVisibility === 'public' && styles.chipTextActive]}>Открытая</Text>
						</Pressable>
					</View>
					{editError ? <Text style={styles.error}>{editError}</Text> : null}
					<BerxButton label="Сохранить" loading={saving} onPress={saveEdit} fullWidth />
					<Pressable onPress={() => setEditing(false)} disabled={saving}>
						<Text style={styles.toggleBtnText}>Отмена</Text>
					</Pressable>
					<Pressable onPress={confirmDeleteTrip} disabled={deleting} hitSlop={8}>
						<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить поездку'}</Text>
					</Pressable>
				</View>
			) : null}

			{!editing && showPicker ? (
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

			{!editing && trip.participants.length > 0 ? (
				<View style={styles.participantsRow}>
					{trip.participants.map((p: BerxTripParticipant) =>
						trip.is_own ? (
							<Pressable key={p.guid} onPress={() => removeParticipant(p.guid)} hitSlop={4}>
								<Image source={{uri: p.icon}} style={styles.participantAvatar} />
							</Pressable>
						) : (
							<Image key={p.guid} source={{uri: p.icon}} style={styles.participantAvatar} />
						)
					)}
				</View>
			) : null}
			{!editing && trip.is_own && trip.participants.length > 0 ? (
				<Text style={styles.hint}>Нажмите на участника, чтобы удалить его из поездки.</Text>
			) : null}

			{editing ? null : days.length === 0 ? (
				<BerxEmptyState title="Маршрут пока пуст" subtitle="Добавляйте места и события со страниц Places/Events." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={days}
						keyExtractor={([day]: [number, BerxTripStop[]]) => String(day)}
						contentContainerStyle={styles.list}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
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
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	description: {fontSize: typography.sizeSm, color: colors.textDim, paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	toolbar: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	toggleBtnText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	editForm: {padding: spacing.md, gap: spacing.md},
	row: {flexDirection: 'row', gap: spacing.sm},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	participantsRow: {flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: -8},
	participantAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite, borderWidth: 2, borderColor: colors.bg, marginRight: -8},
	list: {padding: spacing.md, gap: spacing.md},
	fadeFlex: {flex: 1},
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
