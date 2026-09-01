/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — closes a real gap the same shape as AddToTripScreen's
 * own: api.addWorldItem() was a real, working client method (real
 * POST /worlds/{id}/items, existence + visibility re-checked server-
 * side — see OssnWorlds::realItemExistsAndVisible()) reachable only
 * from inside WorldDetailScreen's own picker, so a Place/Event page
 * had no way to offer "add this to a world" itself. Mirrors
 * AddToTripScreen.tsx's exact structure — one reusable picker for
 * place/event, not a new pattern.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxWorld} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	itemType: 'place' | 'event';
	itemGuid: number;
	onCreateWorld: () => void;
	onDone: () => void;
	onBack?: () => void;
}

export default function AddToWorldScreen({api, itemType, itemGuid, onCreateWorld, onDone, onBack}: Props) {
	const [items, setItems] = useState<BerxWorld[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.myWorlds();
			setItems(res.worlds);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить миры');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function addTo(worldId: number) {
		setBusyId(worldId);
		try {
			await api.addWorldItem(worldId, itemType, itemGuid);
			setAddedIds((prev: Set<number>) => new Set(prev).add(worldId));
		} catch {
			// Real "invalid_item"/forbidden rejections surface as a no-op
			// here — the picker stays open rather than pretending success
			// on a genuine server rejection, same convention as AddToTripScreen.
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Добавить в мир" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="У вас пока нет миров" subtitle="Создайте мир, чтобы объединять в нём места и события." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(w: BerxWorld) => String(w.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxWorld}) => {
						const added = addedIds.has(item.id);
						return (
							<Pressable style={styles.row} onPress={() => (added ? undefined : addTo(item.id))} disabled={busyId === item.id || added}>
								<View style={styles.rowBody}>
									<Text style={styles.title}>{item.title}</Text>
									<Text style={styles.meta}>{item.items.length} {item.items.length === 1 ? 'объект' : 'объектов'} · {item.visibility === 'public' ? 'открытый' : 'закрытый'}</Text>
								</View>
								<Text style={added ? styles.addedText : styles.addText}>
									{busyId === item.id ? '…' : added ? 'Добавлено ✓' : 'Добавить'}
								</Text>
							</Pressable>
						);
					}}
				/>
			)}
			<Pressable style={styles.createRow} onPress={onCreateWorld}>
				<Text style={styles.createText}>+ Новый мир</Text>
			</Pressable>
			<Pressable style={styles.doneRow} onPress={onDone}>
				<Text style={styles.doneText}>Готово</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
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
