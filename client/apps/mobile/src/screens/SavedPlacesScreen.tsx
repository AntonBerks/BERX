/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.savedPlaces() (components/OssnApi/v1/places.php).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxPlaceCard} from '../../../../packages/design-system/src/spatial/BerxPlaceCard';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface SavedPlacesScreenProps {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

export default function SavedPlacesScreen(props: SavedPlacesScreenProps) {
	return (
		<BerxFamilyScene family="PLACES" testID="saved-places">
			<SavedPlacesScreenBody {...props} />
		</BerxFamilyScene>
	);
}

/** The first saved place that has a cover. */
function firstCover(items: readonly {cover_url: string | null}[]): {uri: string} | undefined {
	const url = items.find((i) => i.cover_url)?.cover_url;
	return url ? {uri: url} : undefined;
}

function SavedPlacesScreenBody({api, onOpenPlace, onBack}: SavedPlacesScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();
	const [items, setItems] = useState<BerxPlace[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* saved places are still places — the first cover lights the room */
	useBerxSceneAtmosphere(firstCover(items));

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.savedPlaces();
			setItems(res.places);
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
		<BerxHeader title="Сохранённые места" onBack={onBack} />
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
				<BerxEmptyState title="Ничего не сохранено" subtitle="Нажмите «Сохранить» на странице места, чтобы вернуться к нему позже." />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(p: BerxPlace) => String(p.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					renderItem={({item}: {item: BerxPlace}) => (
						<BerxPlaceCard
							placeGuid={item.guid}
							name={item.title}
							category={item.address ?? undefined}
							cover={item.cover_url ? {uri: item.cover_url} : undefined}
							rating={item.rating_count > 0 ? item.rating : undefined}
							ratingCount={item.rating_count}
							onPress={() => onOpenPlace(item.guid)}
						/>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	list: {paddingBottom: spacing.xxxl},
	cardImage: {width: '100%', aspectRatio: 1.3},
	cardImageFallback: {width: '100%', aspectRatio: 1.3, backgroundColor: colors.graphite},
	cardTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium, padding: spacing.sm},
});
