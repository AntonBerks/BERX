/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.myGoingEvents() (components/OssnApi/v1/events.php).
 */
import {berxPlural} from '@berx/domain';
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent} from '@berx/api/types';
import {sharedElementTag} from '@berx/spatial';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxObjectCard} from '../../../../packages/design-system/src/spatial/BerxObjectCard';
import {BerxCountdown} from '../../../../packages/design-system/src/spatial/BerxCountdown';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

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
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
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
	}, [api, offline]);

	useEffect(() => {
		load();
	}, [load]);

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Я иду" onBack={onBack} />
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
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{header}
			{items.length === 0 ? (
				<BerxEmptyState title="Вы никуда не записаны" subtitle="Нажмите «Пойду» на странице события, чтобы оно появилось здесь." />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(e: BerxEvent) => String(e.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxEvent}) => {
						const date = new Date(item.starts * 1000);
						return (
							<BerxObjectCard
								/* the poster travels into the event's hero */
								sharedTag={sharedElementTag('eventPoster', item.guid)}
								title={item.title}
								subtitle={date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}
								media={item.cover_url ? {uri: item.cover_url} : undefined}
								mediaAlt={item.cover_url ? `Афиша события ${item.title}` : undefined}
								/* only counts the server returns */
								facts={[{label: berxPlural(item.attendee_count, 'идёт', 'идут', 'идут'), value: item.attendee_count}]}
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
	list: {paddingBottom: spacing.xxxl},
	cardImage: {width: 56, height: 56, borderRadius: radius.sm},
	cardImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	cardBody: {flex: 1},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	cardMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
