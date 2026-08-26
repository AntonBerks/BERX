/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.trips() (components/OssnApi/v1/trips.php, new
 * domain this session). Own trips call also includes trips you're a
 * real participant on, not just ones you own.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrip} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	userGuid?: number;
	isOwn: boolean;
	onOpenTrip: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

function fmtDate(unix: number | null): string | null {
	if (!unix) return null;
	return new Date(unix * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
}

export default function TripsScreen({api, userGuid, isOwn, onOpenTrip, onCreate, onBack}: Props) {
	const [items, setItems] = useState<BerxTrip[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.trips(userGuid);
			setItems(res.trips);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить поездки');
		} finally {
			setLoading(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Поездки" onBack={onBack} />
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Спланировать поездку" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Поездок пока нет" subtitle={isOwn ? 'Соберите места и события в единый маршрут.' : undefined} />
			) : (
				<FlatList
					data={items}
					keyExtractor={(t: BerxTrip) => String(t.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxTrip}) => {
						const start = fmtDate(item.start_date);
						const end = fmtDate(item.end_date);
						return (
							<Pressable style={styles.row} onPress={() => onOpenTrip(item.id)}>
								<Text style={styles.title} numberOfLines={1}>{item.title}</Text>
								<Text style={styles.meta}>
									{item.stop_count} {item.stop_count === 1 ? 'точка' : 'точек'}
									{start ? ` · ${start}${end ? ` — ${end}` : ''}` : ''}
									{!item.is_own ? ' · Совместная' : item.visibility === 'private' ? ' · Приватная' : ''}
								</Text>
							</Pressable>
						);
					}}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
