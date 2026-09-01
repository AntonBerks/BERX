/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.events(), api.eventCategories() (components/OssnApi/
 * v1/events.php). No ticket/payment UI anywhere — that backend does
 * not exist (see BERX_DECISIONS.md).
 *
 * MAX BUILD — real "🔥 В тренде" rail. api.trendingEvents() wires
 * OssnSignals (BERX Future Core) into a live 7-day engagement ranking
 * over real RSVP activity — same real mechanism as PlacesListScreen's
 * own trending rail. Best-effort, hidden entirely when nothing has
 * real signals yet.
 *
 * BERX WORLD TRANSFORMATION — was a small-thumbnail ticket-stub row
 * (64x64 square image + a separate date column). Directive §20: "an
 * event is an experience, not merely a calendar item" — a 64px thumb
 * reads as the opposite. Rebuilt on the same full-bleed BerxScrimHero
 * language PlacesListScreen now uses (one consistent grammar across
 * both discovery lists), with the date as a real overlay chip on the
 * photo itself and attendee count as a second scrim badge — the
 * "ticket stub" idea survives as a chip on a real photo, not a
 * separate flat column doing the work instead of the photo.
 *
 * OPUS 5 — reference composition, matching PlacesListScreen exactly so
 * the two discovery surfaces read as one product: live editorial
 * headline + circular glass utilities instead of a title bar and a
 * full-width button. The headline is computed from this screen's own
 * real state (the active tab, the active category, what actually came
 * back), never fixed copy.
 */
import {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {View, Text, FlatList, ScrollView, Pressable, RefreshControl, Animated, Dimensions, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxPlaceCategory} from '@berx/api/types';
import {ruPlural} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxDepthCard} from '../../../../packages/design-system/src/components/BerxDepthCard';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxEventCard} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

// Reference lead plate: one dominant card, nearly the full width.
const LEAD_W = Math.round(Dimensions.get('window').width - 32);

interface Props {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onCreate: () => void;
	onOpenMine: () => void;
	onBack?: () => void;
}

export default function EventsListScreen({api, onOpenEvent, onCreate, onOpenMine, onBack}: Props) {
	const colors = useBerxColors();
	// Real scroll driver for the list's card depth (BerxDepthCard).
	const listScroll = useRef(new Animated.Value(0)).current;
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [trending, setTrending] = useState<Array<BerxEvent & {trending_score: number; distinct_actors: number}>>([]);

	useEffect(() => {
		api.eventCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
		api.trendingEvents(10).then((r) => setTrending(r.events)).catch(() => undefined);
	}, [api]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.events({category, past: tab === 'past'});
			setItems(res.events);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить события');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, category, tab]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading && items.length === 0) return <BerxLoadingState />;

	const activeCategory = category ? categories.find((c: BerxPlaceCategory) => c.slug === category) : undefined;
	const headline: {lines: string[]; accentIndex: number} =
		tab === 'past'
			? {lines: ['Что было', `${items.length} ${ruPlural(items.length, 'событие', 'события', 'событий')} позади`], accentIndex: 1}
			: activeCategory
			? {lines: ['Что происходит', activeCategory.label.toLowerCase()], accentIndex: 1}
			: trending.length > 0
			? {lines: ['Что происходит', `${trending.length} ${ruPlural(trending.length, 'событие', 'события', 'событий')} в тренде`], accentIndex: 1}
			: items.length > 0
			? {lines: ['Что происходит', `${items.length} ${ruPlural(items.length, 'событие', 'события', 'событий')} впереди`], accentIndex: 1}
			: {lines: ['Что происходит', 'создай первое событие'], accentIndex: 1};

	return (
		<View style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title="" /> : null}
			<View style={styles.head}>
				<BerxEditorialTitle lines={headline.lines} accentIndex={headline.accentIndex} style={styles.headline} />
			</View>
			{/* Utilities ride the tab row rather than taking a row of their own,
			    so the first photograph arrives where the reference has it. */}
			<View style={styles.toolbar}>
				<View style={styles.tabRow}>
					<Pressable style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
						<Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Предстоящие</Text>
					</Pressable>
					<Pressable style={[styles.tab, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
						<Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Прошедшие</Text>
					</Pressable>
					<View style={styles.utilities}>
						<BerxCircleButton icon="check" onPress={onOpenMine} />
						<BerxCircleButton icon="plus" onPress={onCreate} />
					</View>
				</View>
			</View>
			{trending.length > 0 ? (
				<View>
					<Text style={styles.trendingLabel}>В тренде</Text>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={trending}
						keyExtractor={(e: BerxEvent & {trending_score: number; distinct_actors: number}) => `trending-${e.guid}`}
						contentContainerStyle={styles.trendingRow}
						renderItem={({item}: {item: BerxEvent & {trending_score: number; distinct_actors: number}}) => (
							<View style={styles.trendingTile}>
								<BerxEventCard
									title={item.title}
									imageUrl={item.cover_url}
									starts={item.starts}
									placeTitle={item.place ? item.place.title : item.location}
									attendeeCount={item.attendee_count}
									friendsGoingCount={item.friends_going_count}
									isGoing={item.is_going}
									width={LEAD_W}
									onPress={() => onOpenEvent(item.guid)}
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
				<BerxEmptyState title={tab === 'upcoming' ? 'Событий пока нет' : 'Прошедших событий нет'} subtitle="Создайте первое — оно появится здесь." />
			) : (
				<BerxFadeIn style={styles.listFade} delayMs={60}>
					<Animated.FlatList
						data={items}
						keyExtractor={(e: BerxEvent) => String(e.guid)}
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
						renderItem={({item}: {item: BerxEvent}) => (
							<BerxDepthCard driver={listScroll} style={styles.tile}>
								<BerxEventCard
									title={item.title}
									imageUrl={item.cover_url}
									starts={item.starts}
									placeTitle={item.place ? item.place.title : item.location}
									attendeeCount={item.attendee_count}
									friendsGoingCount={item.friends_going_count}
									seatsLeft={item.seats_left}
									isGoing={item.is_going}
									onPress={() => onOpenEvent(item.guid)}
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
	utilities: {flexDirection: 'row', gap: 2, marginLeft: 'auto'},
	toolbar: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
	tabRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	tab: {flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim, fontWeight: typography.weightMedium},
	tabTextActive: {color: colors.accent},
	trendingLabel: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold, letterSpacing: -0.4, paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
	trendingRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md},
	trendingTile: {width: LEAD_W, marginRight: spacing.md},
	chipRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: 'center'},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	listFade: {flex: 1},
	list: {padding: spacing.md},
	listSeparator: {height: spacing.md},
	tile: {marginBottom: spacing.md},
	// The "ticket stub" idea, rebuilt as a real overlay chip pair on
	// the photo instead of a separate flat column beside a thumbnail.
	badgeRow: {flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap'},
	dateChip: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.pill,
		backgroundColor: colors.accent,
	},
	dateChipText: {fontSize: typography.sizeXs, color: colors.onAccent, fontWeight: typography.weightBold},
});
