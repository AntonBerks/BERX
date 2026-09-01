/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data only: api.places(q, category) -> BerxPlace[]
 * (components/OssnApi/v1/places.php). Category filter uses the real
 * server whitelist via api.placeCategories(), not a hardcoded list.
 *
 * MAX BUILD — real "🔥 В тренде" rail. api.trendingPlaces() wires
 * OssnSignals (BERX Future Core) into a live 7-day engagement
 * ranking. Best-effort, never blocks the list itself; hidden entirely
 * when nothing has real signals yet (never shown as a fake all-zero
 * ranking).
 *
 * BERX WORLD TRANSFORMATION — was a 2-column square photo grid with
 * text below each image in a bordered card: the exact "generic grid"
 * pattern the directive names directly. Replaced with a single-column
 * feed of full-bleed cinematic tiles built on BerxScrimHero (reused,
 * not duplicated — the same real hero component ProfileScreen/
 * PlaceDetailScreen already use) — title/rating/address live ON the
 * photo via the real scrim, not in a caption strip beneath a boxed
 * thumbnail. Directive §19: "the Place should feel alive," not sit in
 * an album-grid cell.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceCategory} from '@berx/api/types';
import {ruPeopleLabel, ruPlural} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxPlaceCard} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onCreate: () => void;
	onOpenNearby: () => void;
	onOpenSaved: () => void;
	onBack?: () => void;
}

export default function PlacesListScreen({api, onOpenPlace, onCreate, onOpenNearby, onOpenSaved, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxPlace[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [trending, setTrending] = useState<Array<BerxPlace & {trending_score: number; distinct_actors: number}>>([]);

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

	// Live headline, from this screen's own real state only. Each branch
	// states something the screen can actually prove right now.
	const activeCategory = category ? categories.find((c: BerxPlaceCategory) => c.slug === category) : undefined;
	const headline: {lines: string[]; accentIndex: number} = activeCategory
		? {lines: ['Куда пойти', activeCategory.label.toLowerCase()], accentIndex: 1}
		: trending.length > 0
		? {lines: ['Куда пойти', `${trending.length} мест сейчас в тренде`], accentIndex: 1}
		: items.length > 0
		? {lines: ['Куда пойти', `${items.length} ${ruPlural(items.length, 'место', 'места', 'мест')} рядом`], accentIndex: 1}
		: {lines: ['Куда пойти', 'найди своё место'], accentIndex: 1};

	return (
		<View style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title="" /> : null}
			<View style={styles.head}>
				<BerxEditorialTitle lines={headline.lines} accentIndex={headline.accentIndex} style={styles.headline} />
				<View style={styles.utilities}>
					<BerxCircleButton glyph="◎" label="Рядом" onPress={onOpenNearby} />
					<BerxCircleButton glyph="♡" label="Сохранённые" onPress={onOpenSaved} />
					<BerxCircleButton glyph="+" label="Добавить" onPress={onCreate} />
				</View>
			</View>
			<View style={styles.toolbar}>
				<BerxInput placeholder="Поиск мест" value={query} onChangeText={setQuery} onSubmitEditing={load} />
			</View>
			{trending.length > 0 ? (
				<View>
					<Text style={styles.trendingLabel}>В тренде</Text>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={trending}
						keyExtractor={(p: BerxPlace & {trending_score: number; distinct_actors: number}) => `trending-${p.guid}`}
						contentContainerStyle={styles.trendingRow}
						renderItem={({item}: {item: BerxPlace & {trending_score: number; distinct_actors: number}}) => (
							<View style={styles.trendingTile}>
								<BerxPlaceCard
									title={item.title}
									imageUrl={item.cover_url}
									category={item.category}
									rating={item.rating_count > 0 ? item.rating : undefined}
									liveLabel={ruPeopleLabel(item.distinct_actors)}
									width={220}
									onPress={() => onOpenPlace(item.guid)}
								/>
							</View>
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
						contentContainerStyle={styles.list}
						ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
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
							<View style={styles.tile}>
								<BerxPlaceCard
									title={item.title}
									imageUrl={item.cover_url}
									category={item.category ?? item.address}
									rating={item.rating_count > 0 ? item.rating : undefined}
									onPress={() => onOpenPlace(item.guid)}
								/>
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	head: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md},
	headline: {flex: 1},
	utilities: {flexDirection: 'row', gap: spacing.xs},
	toolbar: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm},
	toolbarRow: {flexDirection: 'row', gap: spacing.sm},
	trendingLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	trendingRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	trendingTile: {width: 220, marginRight: spacing.sm, borderRadius: radius.md, overflow: 'hidden'},
	chipRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	gridFade: {flex: 1},
	list: {paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.sm},
	listSeparator: {height: spacing.md},
	tile: {borderRadius: radius.lg, overflow: 'hidden'},
});
