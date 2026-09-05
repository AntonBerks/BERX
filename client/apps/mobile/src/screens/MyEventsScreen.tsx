/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.myGoingEvents() (components/OssnApi/v1/events.php).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {BerxObjectCard} from '../../../../packages/design-system/src/spatial/BerxObjectCard';
import {BerxCountdown} from '../../../../packages/design-system/src/spatial/BerxCountdown';

export interface MyEventsScreenProps {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

export default function MyEventsScreen(props: MyEventsScreenProps) {
	return (
		<BerxFamilyScene family="EVENTS" testID="my-events">
			<MyEventsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

/** The first of your events that has a poster. */
function firstCover(items: readonly {cover_url: string | null}[]): {uri: string} | undefined {
	const url = items.find((i) => i.cover_url)?.cover_url;
	return url ? {uri: url} : undefined;
}

function MyEventsScreenBody({api, onOpenEvent, onBack}: MyEventsScreenProps) {
	const [items, setItems] = useState<BerxEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* the first of your events with a poster lights the room */
	useBerxSceneAtmosphere(firstCover(items));

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.myGoingEvents();
			setItems(res.events);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить события');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Я иду" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Вы никуда не записаны" subtitle="Нажмите «Пойду» на странице события, чтобы оно появилось здесь." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(e: BerxEvent) => String(e.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxEvent}) => {
						const date = new Date(item.starts * 1000);
						return (
							<BerxObjectCard
								title={item.title}
								subtitle={date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}
								media={item.cover_url ? {uri: item.cover_url} : undefined}
								mediaAlt={item.cover_url ? `Афиша события ${item.title}` : undefined}
								/* only counts the server returns */
								facts={[{label: 'идут', value: item.attendee_count}]}
								badges={item.has_ended ? undefined : <BerxCountdown startsAtUnix={item.starts} />}
								onPress={() => onOpenEvent(item.guid)}
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
	list: {padding: spacing.md, gap: spacing.sm},
	cardImage: {width: 56, height: 56, borderRadius: radius.sm},
	cardImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	cardBody: {flex: 1},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	cardMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
