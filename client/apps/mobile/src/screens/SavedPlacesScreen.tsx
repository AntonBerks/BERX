/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.savedPlaces() (components/OssnApi/v1/places.php).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {BerxPlaceCard} from '../../../../packages/design-system/src/spatial/BerxPlaceCard';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';

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
			setError(e instanceof Error ? e.message : 'Не удалось загрузить сохранённые места');
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
			<BerxHeader title="Сохранённые места" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Ничего не сохранено" subtitle="Нажмите «Сохранить» на странице места, чтобы вернуться к нему позже." />
			) : (
				<FlatList
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
	list: {padding: spacing.lg, gap: spacing.md},
	cardImage: {width: '100%', aspectRatio: 1.3},
	cardImageFallback: {width: '100%', aspectRatio: 1.3, backgroundColor: colors.graphite},
	cardTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium, padding: spacing.sm},
});
