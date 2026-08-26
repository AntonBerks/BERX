/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.wrapped() (components/OssnApi/v1/wrapped.php) — pure
 * aggregation over already-real Posts/Trips/Experiences/Events/Places
 * data, no new storage. No AI-generated insight text, no invented
 * "top X%" comparison — honest counts only, or an honest
 * insufficient-data state when there isn't enough real activity.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxWrapped, BerxWrappedPeriod} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

const ROWS: {key: keyof BerxWrapped; label: string}[] = [
	{key: 'posts_created', label: 'Постов опубликовано'},
	{key: 'trips_created', label: 'Поездок спланировано'},
	{key: 'experiences_count', label: 'Впечатлений'},
	{key: 'events_going', label: 'Событий посещено'},
	{key: 'places_saved', label: 'Мест сохранено'},
];

export default function WrappedScreen({api, onBack}: Props) {
	const [period, setPeriod] = useState<BerxWrappedPeriod>('month');
	const [data, setData] = useState<BerxWrapped | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (p: BerxWrappedPeriod) => {
		setLoading(true);
		setError(null);
		try {
			setData(await api.wrapped(p));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load(period);
	}, [load, period]);

	if (loading) return <BerxLoadingState />;
	if (error || !data) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={() => load(period)} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="BERX Wrapped" onBack={onBack} />
			<View style={styles.tabs}>
				<Text style={[styles.tab, period === 'week' && styles.tabActive]} onPress={() => setPeriod('week')}>Неделя</Text>
				<Text style={[styles.tab, period === 'month' && styles.tabActive]} onPress={() => setPeriod('month')}>Месяц</Text>
			</View>

			{data.insufficient_data ? (
				<BerxEmptyState title="Пока маловато активности" subtitle="Как только вы больше сделаете в BERX, здесь появится ваш реальный итог." />
			) : (
				<View style={styles.list}>
					{ROWS.map((row) => {
						const value = data[row.key];
						if (typeof value !== 'number' || value === 0) return null;
						return (
							<View key={row.key} style={styles.row}>
								<Text style={styles.value}>{value}</Text>
								<Text style={styles.label}>{row.label}</Text>
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	tabs: {flexDirection: 'row', gap: spacing.sm, padding: spacing.md},
	tab: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	tabActive: {color: colors.accent, backgroundColor: colors.accentSoft},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm},
	value: {fontSize: typography.sizeXl, color: colors.white, fontWeight: typography.weightBold},
	label: {fontSize: typography.sizeSm, color: colors.textDim},
});
