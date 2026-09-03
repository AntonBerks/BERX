/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real, significant gap: api.addTripStop() was
 * always a real, working client method (real POST /trips/{id}/stops,
 * itemExists() re-checked server-side) with zero UI caller anywhere —
 * TripDetailScreen could remove a stop but a trip owner had no way to
 * ADD one at all, so a trip's itinerary could only ever shrink, never
 * be built. One reusable picker screen for any item type (place/
 * event), mirroring AddToCollectionScreen's exact structure.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import {ruPlural} from '@berx/domain';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrip, BerxTripItemType} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	myGuid: number;
	itemType: BerxTripItemType;
	itemGuid: number;
	onCreateTrip: () => void;
	onDone: () => void;
	onBack?: () => void;
}

export default function AddToTripScreen({api, myGuid, itemType, itemGuid, onCreateTrip, onDone, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxTrip[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.trips(myGuid);
			setItems(res.trips);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить поездки');
		} finally {
			setLoading(false);
		}
	}, [api, myGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function addTo(tripId: number) {
		setBusyId(tripId);
		try {
			await api.addTripStop(tripId, itemType, itemGuid);
			setAddedIds((prev: Set<number>) => new Set(prev).add(tripId));
		} catch {
			// real "item_not_found"/forbidden errors surface as a no-op
			// here — the picker stays open rather than pretending success
			// on a genuine server rejection
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Добавить в поездку" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="У вас пока нет поездок" subtitle="Создайте поездку, чтобы добавлять в неё места и события." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(t: BerxTrip) => String(t.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxTrip}) => {
						const added = addedIds.has(item.id);
						return (
							<Pressable style={styles.row} onPress={() => (added ? undefined : addTo(item.id))} disabled={busyId === item.id || added}>
								<View style={styles.rowBody}>
									<Text style={styles.title}>{item.title}</Text>
									<Text style={styles.meta}>{item.stop_count} {ruPlural(item.stop_count, 'место', 'места', 'мест')}</Text>
								</View>
								<Text style={added ? styles.addedText : styles.addText}>
									{busyId === item.id ? '…' : added ? 'Добавлено ✓' : 'Добавить'}
								</Text>
							</Pressable>
						);
					}}
				/>
			)}
			<Pressable style={styles.createRow} onPress={onCreateTrip}>
				<Text style={styles.createText}>+ Новая поездка</Text>
			</Pressable>
			<Pressable style={styles.doneRow} onPress={onDone}>
				<Text style={styles.doneText}>Готово</Text>
			</Pressable>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm},
	rowBody: {gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
	addText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	addedText: {fontSize: typography.sizeSm, color: colors.textFaint},
	createRow: {padding: spacing.md, alignItems: 'center'},
	createText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	doneRow: {padding: spacing.md, alignItems: 'center'},
	doneText: {fontSize: typography.sizeSm, color: colors.textDim},
});
