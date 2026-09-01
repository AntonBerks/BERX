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
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxEventCard} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onCreate: () => void;
	onOpenMine: () => void;
	onBack?: () => void;
}

export default function EventsListScreen({api, onOpenEvent, onCreate, onOpenMine, onBack}: Props) {
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

	return (
		<View style={styles.screen}>
			<BerxHeader title="События" onBack={onBack} />
			<View style={styles.toolbar}>
				<View style={styles.tabRow}>
					<Pressable style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
						<Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Предстоящие</Text>
					</Pressable>
					<Pressable style={[styles.tab, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
						<Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Прошедшие</Text>
					</Pressable>
					<Pressable style={styles.tab} onPress={onOpenMine}>
						<Text style={styles.tabText}>Я иду</Text>
					</Pressable>
				</View>
				<BerxButton label="Создать событие" onPress={onCreate} fullWidth />
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
									width={220}
									onPress={() => onOpenEvent(item.guid)}
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
				<BerxEmptyState title={tab === 'upcoming' ? 'Событий пока нет' : 'Прошедших событий нет'} subtitle="Создайте первое — оно появится здесь." />
			) : (
				<BerxFadeIn style={styles.listFade} delayMs={60}>
					<FlatList
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
						renderItem={({item}: {item: BerxEvent}) => (
							<View style={styles.tile}>
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
							</View>
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
	tabRow: {flexDirection: 'row', gap: spacing.xs},
	tab: {flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim, fontWeight: typography.weightMedium},
	tabTextActive: {color: colors.accent},
	trendingLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	trendingRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm},
	trendingTile: {width: 220, marginRight: spacing.sm, borderRadius: radius.md, overflow: 'hidden'},
	chipRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	listFade: {flex: 1},
	list: {padding: spacing.md},
	listSeparator: {height: spacing.md},
	tile: {borderRadius: radius.lg, overflow: 'hidden'},
	// The "ticket stub" idea, rebuilt as a real overlay chip pair on
	// the photo instead of a separate flat column beside a thumbnail.
	badgeRow: {flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap'},
	dateChip: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.pill,
		backgroundColor: colors.accent,
	},
	dateChipText: {fontSize: typography.sizeXs, color: colors.black, fontWeight: typography.weightBold},
});
