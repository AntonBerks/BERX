/**
 * BERX-061 — Explore. The EXPLORE family's v9 scene.
 *
 * Four tabs, each backed by a real server scope in
 * components/OssnApi/v1/search.php: /search/users existed already,
 * /search/places, /search/events and /search/communities reuse the
 * same queries the dedicated list screens call with a `q` param. Place
 * and event results are deliberately a lighter shape than the full
 * records — the dispatcher loads one v1 file per request, so
 * search.php cannot reuse places.php's or events.php's JSON builders.
 * Selecting a result opens the real detail screen, which fetches the
 * full record.
 *
 * v9 changes the presentation, not the data: the field is the real
 * search control with a live result count, the tabs are a real filter
 * bar, results are spatial cards on the content plane, and the
 * screen's states go through the seven-state boundary instead of four
 * ad-hoc branches.
 */
import {useCallback, useRef, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceSearchResult, BerxEventSearchResult, BerxCommunitySearchResult} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxSceneHeader} from '../../../../packages/design-system/src/spatial/BerxSceneHeader';
import {BerxSearchField} from '../../../../packages/design-system/src/spatial/BerxSearchField';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxPlaceCard} from '../../../../packages/design-system/src/spatial/BerxPlaceCard';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxObjectCard} from '../../../../packages/design-system/src/spatial/BerxObjectCard';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';

interface SearchResultUser {
	guid: number;
	username: string;
	fullname: string;
}

type Tab = 'users' | 'places' | 'events' | 'communities';

export interface SearchScreenProps {
	api: BerxApiClient;
	onOpenProfile: (username: string) => void;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenCommunity: (guid: number) => void;
}

const DEBOUNCE_MS = 400;
const TABS: {key: Tab; label: string}[] = [
	{key: 'users', label: 'Люди'},
	{key: 'places', label: 'Места'},
	{key: 'events', label: 'События'},
	{key: 'communities', label: 'Сообщества'},
];

export default function SearchScreen(props: SearchScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-061" testID="berx-061">
			<SearchSceneBody {...props} />
		</BerxScreenScene>
	);
}

function SearchSceneBody({api, onOpenProfile, onOpenPlace, onOpenEvent, onOpenCommunity}: SearchScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [tab, setTab] = useState<Tab>('users');
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<SearchResultUser[]>([]);
	const [places, setPlaces] = useState<BerxPlaceSearchResult[]>([]);
	const [events, setEvents] = useState<BerxEventSearchResult[]>([]);
	const [communities, setCommunities] = useState<BerxCommunitySearchResult[]>([]);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('empty');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [searched, setSearched] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const runSearch = useCallback(
		async (q: string, activeTab: Tab) => {
			const term = q.trim();
			if (!term) {
				setUsers([]);
				setPlaces([]);
				setEvents([]);
				setCommunities([]);
				setSearched(false);
				setState('empty');
				return;
			}
			setState('loading');
			try {
				let count = 0;
				if (activeTab === 'users') {
					const res = await api.searchUsers(term);
					setUsers(res.users);
					count = res.users.length;
				} else if (activeTab === 'places') {
					const res = await api.searchPlaces(term);
					setPlaces(res.places);
					count = res.places.length;
				} else if (activeTab === 'events') {
					const res = await api.searchEvents(term);
					setEvents(res.events);
					count = res.events.length;
				} else {
					const res = await api.searchCommunities(term);
					setCommunities(res.communities);
					count = res.communities.length;
				}
				setError(null);
				setState(count === 0 ? 'empty' : 'default');
			} catch (e) {
				/* the real reason, not one generic error: an expired session,
				   a forbidden resource and a dead server are different
				   problems, and being offline is a fourth */
				const failure = classifyFailure(e, offline);
				setError(failure.message);
				setRetryable(failure.retryable);
				setState(failure.state);
				berxAnalytics.error(screen, `search:${activeTab}`);
			} finally {
				setSearched(true);
			}
		},
		[api, screen, offline],
	);

	const handleChange = useCallback(
		(text: string) => {
			setQuery(text);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => runSearch(text, tab), DEBOUNCE_MS);
		},
		[runSearch, tab],
	);

	const switchTab = useCallback(
		(next: string) => {
			const key = next as Tab;
			setTab(key);
			if (query.trim()) runSearch(query, key);
		},
		[query, runSearch],
	);

	const count =
		tab === 'users' ? users.length : tab === 'places' ? places.length : tab === 'events' ? events.length : communities.length;

	const listProps = {
		onScroll,
		scrollEventThrottle,
		contentContainerStyle: styles.list,
		removeClippedSubviews: true,
		windowSize: Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3)),
		maxToRenderPerBatch: 8,
	};

	return (
		<View style={styles.screen}>
			{/* the explore scene names itself before it asks a question:
			    a search field alone at the top of a room reads as a
			    widget, not as a place */}
			<BerxSceneHeader overline="BERX" title="Поиск" testID="explore-header" />
			<View style={styles.controls}>
				<BerxSearchField
					value={query}
					onChangeText={handleChange}
					onSubmit={() => runSearch(query, tab)}
					accessibilityLabel="Поиск по BERX"
					/* only after a real search — never a count of nothing */
					resultCount={searched && state !== 'loading' ? count : undefined}
					testID="explore-search"
				/>
				<BerxFilterBar
					options={TABS.map((t) => ({key: t.key, label: t.label}))}
					selected={[tab]}
					onToggle={switchTab}
					multiple={false}
					accessibilityLabel="Что искать"
				/>
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={() => runSearch(query, tab)}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle={searched ? 'Ничего не найдено' : 'Что вы ищете?'}
				emptyBody={
					searched
						? 'Попробуйте другой запрос или другую вкладку.'
						: 'Люди, места, события и сообщества — всё, что уже есть в BERX.'
				}
				style={styles.body}>
				{tab === 'users' ? (
					<FlatList
						{...listProps}
						data={users}
						keyExtractor={(u: SearchResultUser) => String(u.guid)}
						renderItem={({item}: {item: SearchResultUser}) => (
							<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
								<BerxIdentity
									userGuid={item.guid}
									name={item.fullname || item.username}
									handle={item.username}
									onPress={() => onOpenProfile(item.username)}
								/>
							</BerxSpatialCard>
						)}
					/>
				) : tab === 'places' ? (
					<FlatList
						{...listProps}
						data={places}
						keyExtractor={(p: BerxPlaceSearchResult) => String(p.guid)}
						renderItem={({item}: {item: BerxPlaceSearchResult}) => (
							<BerxPlaceCard
								placeGuid={item.guid}
								name={item.title}
								category={item.category ?? undefined}
								cover={item.cover_url ? {uri: item.cover_url} : undefined}
								/* search.php returns an average with no count — show the star only when there is one */
								rating={item.rating > 0 ? item.rating : undefined}
								ratingCount={item.rating > 0 ? 1 : 0}
								onPress={() => onOpenPlace(item.guid)}
							/>
						)}
					/>
				) : tab === 'events' ? (
					<FlatList
						{...listProps}
						data={events}
						keyExtractor={(e: BerxEventSearchResult) => String(e.guid)}
						renderItem={({item}: {item: BerxEventSearchResult}) => (
							<BerxObjectCard
								title={item.title}
								subtitle={new Date(item.starts * 1000).toLocaleDateString('ru-RU')}
								media={item.cover_url ? {uri: item.cover_url} : undefined}
								mediaAlt={item.cover_url ? `Афиша события ${item.title}` : undefined}
								onPress={() => onOpenEvent(item.guid)}
							/>
						)}
					/>
				) : (
					<FlatList
						{...listProps}
						data={communities}
						keyExtractor={(c: BerxCommunitySearchResult) => String(c.guid)}
						renderItem={({item}: {item: BerxCommunitySearchResult}) => (
							<BerxObjectCard
								title={item.title}
								subtitle={item.owner ? `${item.members} участников · ${item.owner}` : `${item.members} участников`}
								facts={[{label: 'участников', value: item.members}]}
								onPress={() => onOpenCommunity(item.guid)}
							/>
						)}
					/>
				)}
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	controls: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm},
	body: {flex: 1},
	list: {padding: spacing.lg, gap: spacing.md},
});
