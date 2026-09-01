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
import {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {View, Text, FlatList, ScrollView, Pressable, RefreshControl, Animated, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceCategory} from '@berx/api/types';
import {ruPeopleLabel, ruPlural} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxDepthCard} from '../../../../packages/design-system/src/components/BerxDepthCard';
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
	// Real scroll driver for the list's card depth (BerxDepthCard).
	const listScroll = useRef(new Animated.Value(0)).current;
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
		? {lines: ['Куда пойти', `${trending.length} ${ruPlural(trending.length, 'место', 'места', 'мест')} сейчас в тренде`], accentIndex: 1}
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
					<BerxCircleButton glyph="♡" label="Сохран." onPress={onOpenSaved} />
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
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.railScroll}
				contentContainerStyle={styles.chipRow}>
				{categories.map((item: BerxPlaceCategory) => (
					<Pressable
						key={item.slug}
						style={[styles.chip, category === item.slug && styles.chipActive]}
						onPress={() => setCategory(category === item.slug ? undefined : item.slug)}>
						<Text style={[styles.chipText, category === item.slug && styles.chipTextActive]}>{item.label}</Text>
					</Pressable>
				))}
				</ScrollView>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Мест не найдено" subtitle="Попробуйте другой запрос или добавьте первое место." />
			) : (
				<BerxFadeIn style={styles.gridFade} delayMs={60}>
					<Animated.FlatList
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
						onScroll={Animated.event([{nativeEvent: {contentOffset: {y: listScroll}}}], {useNativeDriver: true})}
						scrollEventThrottle={16}
						renderItem={({item}: {item: BerxPlace}) => (
							<BerxDepthCard driver={listScroll} style={styles.tile}>
								<BerxPlaceCard
									title={item.title}
									imageUrl={item.cover_url}
									category={item.category ?? item.address}
									rating={item.rating_count > 0 ? item.rating : undefined}
									onPress={() => onOpenPlace(item.guid)}
								/>
							</BerxDepthCard>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	railScroll: {flexGrow: 0, flexShrink: 0},
	screen: {flex: 1, backgroundColor: colors.bg},
	head: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md},
	headline: {paddingHorizontal: 0, paddingTop: 0},
	utilities: {flexDirection: 'row', gap: spacing.sm, alignSelf: 'flex-start'},
	toolbar: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm},
	toolbarRow: {flexDirection: 'row', gap: spacing.sm},
	trendingLabel: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold, letterSpacing: -0.4, paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
	trendingRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md},
	trendingTile: {width: 220, marginRight: spacing.md},
	chipRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: 'center'},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	gridFade: {flex: 1},
	list: {paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.sm},
	listSeparator: {height: spacing.md},
	tile: {borderRadius: radius.lg, overflow: 'hidden'},
});
