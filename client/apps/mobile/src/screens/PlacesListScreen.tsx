/**
 * BERX-201 — Places Discovery. The PLACES family's v9 scene.
 *
 * Real data only: api.places(q, category) from
 * components/OssnApi/v1/places.php, with the category filter driven
 * by the real server whitelist (api.placeCategories()) rather than a
 * hardcoded list — a filter the backend would not honour is a filter
 * that lies.
 *
 * Save state is real too: /places/saved is the caller's own list, so
 * a place shows as saved only when the server says it is, and the
 * toggle updates only after the server confirms.
 *
 * No map. react-native-maps is not installed and no tile provider is
 * configured; BerxMap and BerxMapPin are recorded BLOCKED with that
 * reason, and "Рядом" opens the real distance-ranked nearby scene
 * instead of an empty map frame.
 */
import {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceCategory} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSearchField} from '../../../../packages/design-system/src/spatial/BerxSearchField';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxPlaceCard} from '../../../../packages/design-system/src/spatial/BerxPlaceCard';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxScreenScene, useBerxScreen, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {berxAnalytics} from '../spatial/analytics';

export interface PlacesListScreenProps {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onCreate: () => void;
	onOpenNearby: () => void;
	onOpenSaved: () => void;
	onBack?: () => void;
}

export default function PlacesListScreen(props: PlacesListScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-201" testID="berx-201">
			<PlacesSceneBody {...props} />
		</BerxScreenScene>
	);
}

/** The first item in a list that carries a cover — a real one or none. */
function firstCover(items: readonly {cover_url: string | null}[]): {uri: string} | undefined {
	const url = items.find((i) => i.cover_url)?.cover_url;
	return url ? {uri: url} : undefined;
}

function PlacesSceneBody({api, onOpenPlace, onCreate, onOpenNearby, onOpenSaved, onBack}: PlacesListScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxPlace[]>([]);
	const [savedGuids, setSavedGuids] = useState<ReadonlySet<number>>(new Set());
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		/* the real server whitelist; a failure just means no filter bar */
		api
			.placeCategories()
			.then((r) => setCategories(r.categories))
			.catch(() => undefined);
		/* the caller's real saved list, so the heart reflects the server */
		api
			.savedPlaces()
			.then((r) => setSavedGuids(new Set(r.places.map((p) => p.guid))))
			.catch(() => undefined);
	}, [api]);

	/* the list is about these places; the first one with a cover is the room */
	useBerxSceneAtmosphere(firstCover(items));

	const load = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const res = await api.places(query || undefined, category);
			setItems(res.places);
			setState(res.places.length === 0 ? 'empty' : 'default');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить места');
			setState('error');
			berxAnalytics.error(screen, 'places');
		}
	}, [api, query, category, screen]);

	useEffect(() => {
		load();
	}, [load]);

	const toggleSaved = useCallback(
		async (guid: number) => {
			const wasSaved = savedGuids.has(guid);
			berxAnalytics.mutationStart(screen, guid);
			const started = Date.now();
			try {
				if (wasSaved) await api.unsavePlace(guid);
				else await api.savePlace(guid);
				/* only now — the set follows the server, never precedes it */
				setSavedGuids((prev) => {
					const next = new Set(prev);
					if (wasSaved) next.delete(guid);
					else next.add(guid);
					return next;
				});
				berxAnalytics.mutationSuccess(screen, Date.now() - started, guid);
			} catch {
				berxAnalytics.mutationError(screen, 'save-place');
			}
		},
		[api, savedGuids, screen],
	);

	return (
		<View style={styles.screen}>
			<BerxHeader title="Места" onBack={onBack} />

			<View style={styles.toolbar}>
				<BerxSearchField
					value={query}
					onChangeText={setQuery}
					onSubmit={load}
					placeholder="Поиск мест"
					accessibilityLabel="Поиск мест"
					resultCount={state === 'default' ? items.length : undefined}
				/>
				<View style={styles.actions}>
					<BerxButton label="Рядом" variant="secondary" onPress={onOpenNearby} />
					<BerxButton label="Сохранённые" variant="secondary" onPress={onOpenSaved} />
					<BerxButton label="Добавить" onPress={onCreate} />
				</View>
				<BerxFilterBar
					options={categories.map((c) => ({key: c.slug, label: c.label}))}
					selected={category ? [category] : []}
					onToggle={(key) => setCategory(category === key ? undefined : key)}
					multiple={false}
					accessibilityLabel="Категории мест"
				/>
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				emptyTitle="Мест не найдено"
				emptyBody="Попробуйте другой запрос или добавьте первое место."
				emptyAction={{label: 'Добавить место', onPress: onCreate}}
				style={styles.body}>
				<FlatList
					data={items}
					keyExtractor={(p: BerxPlace) => String(p.guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
					renderItem={({item}: {item: BerxPlace}) => (
						<BerxPlaceCard
							placeGuid={item.guid}
							name={item.title}
							category={item.address ?? undefined}
							cover={item.cover_url ? {uri: item.cover_url} : undefined}
							rating={item.rating_count > 0 ? item.rating : undefined}
							ratingCount={item.rating_count}
							onPress={() => onOpenPlace(item.guid)}
							trailing={
								<BerxButton
									label={savedGuids.has(item.guid) ? 'Сохранено' : 'Сохранить'}
									variant="secondary"
									onPress={() => toggleSaved(item.guid)}
								/>
							}
						/>
					)}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	toolbar: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm},
	actions: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap'},
	body: {flex: 1},
	list: {padding: spacing.lg, gap: spacing.md},
});
