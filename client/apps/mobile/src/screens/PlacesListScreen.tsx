/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data only: api.places(q, category) -> BerxPlace[]
 * (components/OssnApi/v1/places.php). Category filter uses the real
 * server whitelist via api.placeCategories(), not a hardcoded list.
 *
 * Future UI pass: kept the photo-first grid cards as-is (a media grid
 * reading as glass would be worse, not better — real variety of
 * surfaces on purpose) and instead gave the grid a real BerxFadeIn
 * entrance, so Places doesn't feel like a static admin list on open.
 *
 * MAX BUILD — real "🔥 В тренде" rail. api.trendingPlaces() wires
 * OssnSignals (BERX Future Core — previously built, migrated, and
 * never once instantiated anywhere) into a live 7-day engagement
 * ranking. Best-effort, never blocks the list itself; hidden entirely
 * when nothing has real signals yet (never shown as a fake all-zero
 * ranking).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet, Image} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onCreate: () => void;
	onOpenNearby: () => void;
	onOpenSaved: () => void;
	onBack?: () => void;
}

export default function PlacesListScreen({api, onOpenPlace, onCreate, onOpenNearby, onOpenSaved, onBack}: Props) {
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxPlace[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [trending, setTrending] = useState<Array<BerxPlace & {trending_score: number}>>([]);

	useEffect(() => {
		api.placeCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
		api.trendingPlaces(10).then((r) => setTrending(r.places)).catch(() => undefined);
	}, [api]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.places(query || undefined, category);
			setItems(res.places);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить места');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, query, category]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading && items.length === 0) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Места" onBack={onBack} />
			<View style={styles.toolbar}>
				<BerxInput placeholder="Поиск мест" value={query} onChangeText={setQuery} onSubmitEditing={load} />
				<View style={styles.toolbarRow}>
					<BerxButton label="Рядом" variant="secondary" onPress={onOpenNearby} />
					<BerxButton label="Сохранённые" variant="secondary" onPress={onOpenSaved} />
					<BerxButton label="Добавить" onPress={onCreate} />
				</View>
			</View>
			{trending.length > 0 ? (
				<View>
					<Text style={styles.trendingLabel}>В тренде</Text>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={trending}
						keyExtractor={(p: BerxPlace & {trending_score: number}) => `trending-${p.guid}`}
						contentContainerStyle={styles.trendingRow}
						renderItem={({item}: {item: BerxPlace & {trending_score: number}}) => (
							<Pressable style={styles.trendingCard} onPress={() => onOpenPlace(item.guid)}>
								{item.cover_url ? (
									<Image source={{uri: item.cover_url}} style={styles.trendingImage} />
								) : (
									<View style={styles.trendingImageFallback}>
										<Text style={styles.cardMediaInitial}>{item.title.charAt(0).toUpperCase()}</Text>
									</View>
								)}
								<Text style={styles.trendingTitle} numberOfLines={1}>🔥 {item.title}</Text>
							</Pressable>
						)}
					/>
				</View>
			) : null}
			<FlatList
				horizontal
				showsHorizontalScrollIndicator={false}
				data={categories}
				keyExtractor={(c: BerxPlaceCategory) => c.slug}
				contentContainerStyle={styles.chipRow}
				renderItem={({item}: {item: BerxPlaceCategory}) => (
					<Pressable
						style={[styles.chip, category === item.slug && styles.chipActive]}
						onPress={() => setCategory(category === item.slug ? undefined : item.slug)}>
						<Text style={[styles.chipText, category === item.slug && styles.chipTextActive]}>{item.label}</Text>
					</Pressable>
				)}
			/>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Мест не найдено" subtitle="Попробуйте другой запрос или добавьте первое место." />
			) : (
				<BerxFadeIn style={styles.gridFade} delayMs={60}>
					<FlatList
						data={items}
						keyExtractor={(p: BerxPlace) => String(p.guid)}
						numColumns={2}
						contentContainerStyle={styles.grid}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
						renderItem={({item}: {item: BerxPlace}) => (
							<Pressable style={styles.card} onPress={() => onOpenPlace(item.guid)}>
								<View style={styles.cardMedia}>
									{item.cover_url ? (
										<Image source={{uri: item.cover_url}} style={styles.cardImage} />
									) : (
										<View style={styles.cardMediaFallback}>
											<Text style={styles.cardMediaInitial}>{item.title.charAt(0).toUpperCase()}</Text>
										</View>
									)}
									{item.rating_count > 0 ? (
										<View style={styles.ratingBadge}>
											<Text style={styles.ratingText}>★ {item.rating}</Text>
										</View>
									) : null}
								</View>
								<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
								{item.address ? <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text> : null}
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm},
	toolbarRow: {flexDirection: 'row', gap: spacing.sm},
	trendingLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	trendingRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	trendingCard: {width: 140, marginRight: spacing.sm},
	trendingImage: {width: 140, height: 90, borderRadius: radius.md, backgroundColor: colors.graphite},
	trendingImageFallback: {width: 140, height: 90, borderRadius: radius.md, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	trendingTitle: {color: colors.text, fontSize: typography.sizeXs, marginTop: 4},
	chipRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	gridFade: {flex: 1},
	grid: {paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl},
	card: {flex: 1, margin: spacing.xs, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	cardMedia: {aspectRatio: 1.3, backgroundColor: colors.graphite},
	cardImage: {width: '100%', height: '100%'},
	cardMediaFallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	cardMediaInitial: {fontSize: typography.sizeTitle, color: colors.textFaint},
	ratingBadge: {position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(5,5,5,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill},
	ratingText: {fontSize: typography.sizeXs, color: colors.white},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium, paddingHorizontal: spacing.sm, paddingTop: spacing.xs},
	cardAddress: {fontSize: typography.sizeXs, color: colors.textFaint, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm},
});
