/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.lifeGraph() (components/OssnApi/v1/lifegraph.php) —
 * see docs/BERX_FUTURE_LAYER_SPEC.md. Every edge is a real, existing
 * fact (a save, an RSVP, a review, a membership, a creation, a reward,
 * a co-attended friend) — pure real history, not an AI-generated
 * narrative.
 *
 * Future UI pass: summary stats and history rows now sit on
 * BerxGlassSurface with a staggered BerxFadeIn entrance (stats first,
 * then the timeline), matching the rest of the Future Layer screens.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxLifeGraphEdge, BerxLifeGraphResponse} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

const EDGE_LABELS: Record<string, string> = {
	saved_place: 'Сохранили место',
	going_event: 'Собираетесь на событие',
	attended_event: 'Побывали на событии',
	reviewed_place: 'Оставили отзыв о месте',
	joined_community: 'Вступили в сообщество',
	created_trip: 'Спланировали поездку',
	created_experience: 'Создали впечатление',
	earned_reward: 'Заработали баллы',
	met_person: 'Познакомились на событии',
	checked_in: 'Отметились на месте',
	event_checkpoint: 'Подтвердили присутствие на событии',
	plan_created: 'Создали план',
	plan_converted: 'План стал событием',
	moment_created: 'Записали момент',
	memory_saved: 'Сохранили воспоминание',
};

const SUMMARY_ROWS: {key: keyof BerxLifeGraphResponse['summary']; label: string}[] = [
	{key: 'places_saved', label: 'Мест сохранено'},
	{key: 'places_reviewed', label: 'Отзывов написано'},
	{key: 'events_going', label: 'Событий в планах'},
	{key: 'communities_joined', label: 'Сообществ'},
	{key: 'trips_created', label: 'Поездок'},
	{key: 'experiences_created', label: 'Впечатлений'},
	{key: 'plans_created', label: 'Планов'},
	{key: 'event_checkins_count', label: 'Подтверждённых событий'},
	{key: 'moments_created', label: 'Моментов'},
	{key: 'memories_saved', label: 'Воспоминаний'},
];

export default function LifeGraphScreen({api, onBack}: Props) {
	const [data, setData] = useState<BerxLifeGraphResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setData(await api.lifeGraph());
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error || !data) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Ваш путь в BERX" onBack={onBack} />
			<BerxFadeIn style={styles.summaryGrid}>
				{SUMMARY_ROWS.map((row) => {
					const value = data.summary[row.key];
					if (!value) return null;
					return (
						<View key={row.key} style={styles.summaryCard}>
							<BerxGlassSurface padding="md">
								<Text style={styles.summaryValue}>{value}</Text>
								<Text style={styles.summaryLabel}>{row.label}</Text>
							</BerxGlassSurface>
						</View>
					);
				})}
			</BerxFadeIn>
			{data.edges.length === 0 ? (
				<BerxEmptyState title="Пока пусто" subtitle="Сохраняйте места, ходите на события — здесь появится ваша реальная история." />
			) : (
				<BerxFadeIn style={styles.list} delayMs={90}>
					{data.edges.map((edge: BerxLifeGraphEdge, i: number) => (
						<View key={`${edge.type}-${edge.target_guid ?? i}-${edge.time}`}>
							<BerxGlassSurface padding="md" style={styles.row}>
								<Text style={styles.rowKind}>{EDGE_LABELS[edge.type] ?? edge.type}</Text>
								<Text style={styles.rowTitle}>{edge.target_title}{edge.amount ? ` · +${edge.amount}` : ''}</Text>
								<Text style={styles.rowTime}>{relativeTimeLabel(edge.time)}</Text>
							</BerxGlassSurface>
						</View>
					))}
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	summaryGrid: {flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm},
	summaryCard: {minWidth: '30%', flexGrow: 1},
	summaryValue: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	summaryLabel: {fontSize: typography.sizeSm, color: colors.textDim},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {gap: spacing.xs},
	rowKind: {fontSize: typography.sizeSm, color: colors.accent},
	rowTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
	rowTime: {fontSize: typography.sizeSm, color: colors.textFaint},
});
