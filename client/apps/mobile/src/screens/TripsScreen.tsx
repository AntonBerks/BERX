/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.trips() (components/OssnApi/v1/trips.php, new
 * domain this session). Own trips call also includes trips you're a
 * real participant on, not just ones you own.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrip} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxTripCard} from '../../../../packages/design-system/src/spatial/BerxTripCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface TripsScreenProps {
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

export default function TripsScreen(props: TripsScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" testID="trips">
			<TripsSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function TripsSceneBody({api, userGuid, isOwn, onOpenTrip, onCreate, onBack}: TripsScreenProps) {
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

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Поездки" onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{header}
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Спланировать поездку" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Поездок пока нет" subtitle={isOwn ? 'Соберите места и события в единый маршрут.' : undefined} />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(t: BerxTrip) => String(t.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxTrip}) => {
						const start = fmtDate(item.start_date);
						const end = fmtDate(item.end_date);
						return (
							<BerxTripCard
								tripGuid={item.id}
								title={item.title}
								datesLabel={[
									start ? `${start}${end ? ` — ${end}` : ''}` : undefined,
									!item.is_own ? 'Совместная' : item.visibility === 'private' ? 'Приватная' : undefined,
								]
									.filter(Boolean)
									.join(' · ')}
								stopCount={item.stop_count}
								onPress={() => onOpenTrip(item.id)}
							/>
						);
					}}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	toolbar: {padding: spacing.md},
	list: {paddingBottom: spacing.xxxl},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
