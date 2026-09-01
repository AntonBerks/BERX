/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.myCommunities() was always a
 * real, working client method (real GET /communities/mine) with zero
 * UI caller — this screen only ever offered a full/searchable browse
 * list, with no way to filter down to communities you're actually a
 * member of.
 *
 * MAX BUILD — real "🔥 В тренде" rail. api.trendingCommunities() wires
 * OssnSignals (BERX Future Core) into a live 7-day engagement ranking
 * over real approved-join activity — same real mechanism as
 * PlacesListScreen/EventsListScreen's own trending rails. Best-effort,
 * hidden entirely when nothing has real signals yet.
 *
 * BERX WORLD TRANSFORMATION — the main list was plain text rows with
 * no image at all, even though every community already has a real
 * cover_url (the trending rail already used it, the main list simply
 * never did). Rebuilt on the same BerxScrimHero language as Places/
 * Events — one consistent grammar across all three discovery lists —
 * so Communities finally shows its own real cover photos instead of
 * being the one list in the app with no visual identity per row.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity} from '@berx/api/types';
import {ruPeopleLabel, ruPlural} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxScrimHero, scrimBadgeStyles} from '../../../../packages/design-system/src/components/BerxScrimHero';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenCommunity: (guid: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

type Tab = 'all' | 'mine';

export default function CommunitiesListScreen({api, onOpenCommunity, onCreate, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [tab, setTab] = useState<Tab>('all');
	const [q, setQ] = useState('');
	const [items, setItems] = useState<BerxCommunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [trending, setTrending] = useState<Array<BerxCommunity & {trending_score: number; distinct_actors: number}>>([]);

	useEffect(() => {
		api.trendingCommunities(10).then((r) => setTrending(r.communities)).catch(() => undefined);
	}, [api]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = tab === 'mine' ? await api.myCommunities() : await api.communities(q || undefined);
			setItems(res.communities);
			setError(null);
		} catch {
			setError('Не удалось загрузить сообщества');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, q, tab]);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab]);

	return (
		<View style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title="" /> : null}
			{/* OPUS 5 — same reference composition as PLACES/EVENTS/MESSAGING.
			    The second line reports only what this screen has actually
			    loaded for the tab it is on. */}
			<View style={styles.head}>
				<BerxEditorialTitle topInset={!onBack}
					style={styles.headline}
					accentIndex={1}
					lines={[
						'Сообщества',
						tab === 'mine'
							? `${items.length} ${ruPlural(items.length, 'твоё', 'твоих', 'твоих')}`
							: trending.length > 0
							? `${trending.length} ${ruPlural(trending.length, 'сообщество', 'сообщества', 'сообществ')} в тренде`
							: items.length > 0
							? `${items.length} ${ruPlural(items.length, 'сообщество', 'сообщества', 'сообществ')}`
							: 'найди своих',
					]}
				/>
				<BerxCircleButton icon="plus" onPress={onCreate} />
			</View>
			<View style={styles.tabRow}>
				<Pressable style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
					<Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Все</Text>
				</Pressable>
				<Pressable style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
					<Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>Мои</Text>
				</Pressable>
			</View>
			{tab === 'all' && trending.length > 0 ? (
				<View>
					<Text style={styles.trendingLabel}>В тренде</Text>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={trending}
						keyExtractor={(c: BerxCommunity & {trending_score: number; distinct_actors: number}) => `trending-${c.guid}`}
						contentContainerStyle={styles.trendingRow}
						renderItem={({item}: {item: BerxCommunity & {trending_score: number; distinct_actors: number}}) => (
							<Pressable style={styles.trendingTile} onPress={() => onOpenCommunity(item.guid)}>
								<BerxScrimHero
									imageUrl={item.cover_url}
									title={item.name}
									subtitle={`🔥 ${ruPeopleLabel(item.distinct_actors)}`}
									height={140}
								/>
							</Pressable>
						)}
					/>
				</View>
			) : null}
			<View style={styles.searchRow}>
				{tab === 'all' ? (
					<View style={styles.searchInput}>
						<BerxInput placeholder="Поиск сообществ..." value={q} onChangeText={setQ} onSubmitEditing={load} />
					</View>
				) : (
					<View style={styles.searchInput} />
				)}
			</View>

			{loading ? (
				<BerxLoadingState label="Загрузка..." />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState
					title={tab === 'mine' ? 'Вы пока не в сообществах' : 'Сообщества не найдены'}
					subtitle={tab === 'mine' ? 'Вступите в сообщество на вкладке «Все» или создайте своё.' : 'Попробуйте другой запрос или создайте своё.'}
				/>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(c: BerxCommunity) => String(c.guid)}
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
						renderItem={({item}: {item: BerxCommunity}) => (
							<Pressable style={styles.tile} onPress={() => onOpenCommunity(item.guid)}>
								<BerxScrimHero
									imageUrl={item.cover_url}
									title={item.name}
									subtitle={item.description ?? undefined}
									height={170}
									badge={
										item.is_member ? (
											<View style={scrimBadgeStyles.badge}>
												<Text style={scrimBadgeStyles.badgeTextAccent}>Вы участник</Text>
											</View>
										) : undefined
									}
								/>
							</Pressable>
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
	headline: {paddingHorizontal: 0, paddingTop: 0, flex: 1},
	tabRow: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
	tab: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim},
	tabTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	trendingLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.lg, paddingTop: spacing.xs},
	trendingRow: {paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm},
	trendingTile: {width: 220, marginRight: spacing.sm, borderRadius: radius.md, overflow: 'hidden'},
	searchRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
	searchInput: {flex: 1},
	fadeFlex: {flex: 1},
	list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
	listSeparator: {height: spacing.md},
	tile: {borderRadius: radius.lg, overflow: 'hidden'},
});
