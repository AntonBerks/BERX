/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.wrapped() (components/OssnApi/v1/wrapped.php) — pure
 * aggregation over already-real Posts/Trips/Experiences/Events/Places
 * data, no new storage. No AI-generated insight text, no invented
 * "top X%" comparison — honest counts only, or an honest
 * insufficient-data state when there isn't enough real activity.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxWrapped, BerxWrappedPeriod} from '@berx/api/types';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxStatRail} from '../../../../packages/design-system/src/spatial/BerxStatRail';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxSection} from '../../../../packages/design-system/src/spatial/BerxSection';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface WrappedScreenProps {
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

export default function WrappedScreen(props: WrappedScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="temporal" testID="wrapped">
			<WrappedScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function WrappedScreenBody({api, onBack}: WrappedScreenProps) {
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
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				{/* was two <Text> elements with onPress — invisible to a
				    screen reader as controls, and unreachable by keyboard.
				    The archive's segmented control announces the selection. */}
				<View style={styles.tabs}>
					<BerxSegmentTabs
						options={[
							{key: 'week' as BerxWrappedPeriod, label: 'Неделя'},
							{key: 'month' as BerxWrappedPeriod, label: 'Месяц'},
						]}
						value={period}
						onChange={setPeriod}
					/>
				</View>

				{data.insufficient_data ? (
					<BerxEmptyState title="Пока маловато активности" subtitle="Как только вы больше сделаете в BERX, здесь появится ваш реальный итог." />
				) : (
					<View style={styles.list}>
						{/* the period, said once at the size a summary deserves.
						    A year in review that opens on a row of small numbers
						    is a table; this is the one line the screen is about,
						    and it is the real selected period rather than a
						    headline invented to fill the space. */}
						<BerxSection leading>
							<BerxText role="display" heading>
								{period === 'week' ? 'Ваша неделя' : 'Ваш месяц'}
							</BerxText>
							<BerxText role="body" emphasis="secondary">
								Только то, что BERX действительно посчитал.
							</BerxText>
						</BerxSection>

						{/* the archive's own stat rail: real counts only, and a
						    zero is omitted rather than shown as an achievement */}
						<BerxSection label="Итоги">
						<BerxStatRail
							stats={ROWS.map((row) => {
								const value = data[row.key];
								return {
									key: row.key,
									label: row.label,
									value: typeof value === 'number' && value > 0 ? value : undefined,
								};
							})}
						/>
						</BerxSection>
					</View>
				)}
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	tabs: {flexDirection: 'row', gap: spacing.sm, padding: spacing.md},
	list: {paddingHorizontal: spacing.lg},
});
