/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Four real tabs, each backed by a real server scope in
 * components/OssnApi/v1/search.php (/search/users existed already;
 * /search/places, /search/events, /search/communities were added
 * this session, reusing OssnPlaces::listPlaces()/OssnEvents::
 * listEvents()/OssnGroup::searchGroups() — the exact same query the
 * dedicated list screens call with a `q` param, not new logic). Place
 * and event results are intentionally a lighter shape than the full
 * records those dedicated screens show — the API dispatcher loads
 * exactly one v1 file per request, so search.php can't reuse places.
 * php's/events.php's full JSON builder functions. Selecting a result
 * here navigates to the real detail screen, which fetches the full
 * record.
 *
 * MAX BUILD — Places/Events/Communities results are now already
 * server-sorted friends-first (real friends_count social-relevance
 * signal, same mechanism Nearby Now uses — Communities added in the
 * BERX World pass, closing the one search scope that was still a flat
 * DB-order list); a small "👥 N" badge surfaces that same signal here,
 * same convention as NearbyNowScreen's own badge.
 *
 * "Discover + Nearby + Social Map + Events = one contextual discovery
 * engine" continued: the empty Users tab (previously a bare "start
 * typing" prompt) now shows real mutual-friend suggestions
 * (api.peopleDiscovery()) — reusing this screen's own existing real
 * estate for meaningful social discovery instead of a new screen.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, FlatList, Pressable, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceSearchResult, BerxEventSearchResult, BerxCommunitySearchResult, BerxPeopleSuggestion, BerxTrendingHashtag} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxEmptyState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface SearchResultUser {
	guid: number;
	username: string;
	fullname: string;
}

type Tab = 'users' | 'places' | 'events' | 'communities' | 'hashtags';

interface Props {
	api: BerxApiClient;
	onOpenProfile: (username: string) => void;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenCommunity: (guid: number) => void;
	onOpenHashtag?: (tag: string) => void;
}

const DEBOUNCE_MS = 400;
const TABS: {key: Tab; label: string}[] = [
	{key: 'users', label: 'Люди'},
	{key: 'places', label: 'Места'},
	{key: 'events', label: 'События'},
	{key: 'communities', label: 'Сообщества'},
	{key: 'hashtags', label: 'Теги'},
];

export default function SearchScreen({api, onOpenProfile, onOpenPlace, onOpenEvent, onOpenCommunity, onOpenHashtag}: Props) {
	const [tab, setTab] = useState<Tab>('users');
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<SearchResultUser[]>([]);
	const [places, setPlaces] = useState<BerxPlaceSearchResult[]>([]);
	const [events, setEvents] = useState<BerxEventSearchResult[]>([]);
	const [communities, setCommunities] = useState<BerxCommunitySearchResult[]>([]);
	const [hashtags, setHashtags] = useState<BerxTrendingHashtag[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);
	const [suggestions, setSuggestions] = useState<BerxPeopleSuggestion[] | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Real mutual-friend suggestions — best-effort, fetched once, never
	// blocks search itself if it fails.
	useEffect(() => {
		api.peopleDiscovery().then((res) => setSuggestions(res.people)).catch(() => setSuggestions([]));
	}, [api]);

	const runSearch = useCallback(
		async (q: string, activeTab: Tab) => {
			if (!q.trim()) {
				setUsers([]);
				setPlaces([]);
				setEvents([]);
				setCommunities([]);
				setHashtags([]);
				setSearched(false);
				return;
			}
			setLoading(true);
			try {
				if (activeTab === 'users') {
					const res = await api.searchUsers(q.trim());
					setUsers(res.users);
				} else if (activeTab === 'places') {
					const res = await api.searchPlaces(q.trim());
					setPlaces(res.places);
				} else if (activeTab === 'events') {
					const res = await api.searchEvents(q.trim());
					setEvents(res.events);
				} else if (activeTab === 'communities') {
					const res = await api.searchCommunities(q.trim());
					setCommunities(res.communities);
				} else {
					const res = await api.searchHashtags(q.trim());
					setHashtags(res.hashtags);
				}
				setError(null);
			} catch {
				setError('Не удалось выполнить поиск');
			} finally {
				setLoading(false);
				setSearched(true);
			}
		},
		[api]
	);

	function handleChange(text: string) {
		setQuery(text);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => runSearch(text, tab), DEBOUNCE_MS);
	}

	function switchTab(next: Tab) {
		setTab(next);
		if (query.trim()) runSearch(query, next);
	}

	const currentCount = tab === 'users' ? users.length : tab === 'places' ? places.length : tab === 'events' ? events.length : tab === 'communities' ? communities.length : hashtags.length;

	return (
		<View style={styles.screen}>
			<View style={styles.searchBar}>
				<BerxInput
					placeholder="Поиск"
					value={query}
					onChangeText={handleChange}
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>

			<View style={styles.tabRow}>
				{TABS.map((t) => (
					<Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => switchTab(t.key)}>
						<Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
					</Pressable>
				))}
			</View>

			{error ? (
				<BerxErrorState message={error} onRetry={() => runSearch(query, tab)} />
			) : loading ? (
				<Text style={styles.hint}>Поиск...</Text>
			) : searched && currentCount === 0 ? (
				<BerxEmptyState title="Ничего не найдено" />
			) : !searched && tab === 'users' && suggestions && suggestions.length > 0 ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={suggestions}
						keyExtractor={(p: BerxPeopleSuggestion) => String(p.guid)}
						contentContainerStyle={styles.suggestionsList}
						ListHeaderComponent={<Text style={styles.suggestionsTitle}>Возможно, вы знакомы</Text>}
						renderItem={({item}: {item: BerxPeopleSuggestion}) => (
							<Pressable style={styles.row} onPress={() => onOpenProfile(item.username)}>
								<Text style={styles.fullname}>{item.fullname || item.username}</Text>
								<Text style={styles.username}>
									@{item.username} · {item.mutual_count} общих {item.mutual_count === 1 ? 'друг' : 'друзей'}
									{item.mutual_communities_count > 0 ? ` · 👥 ${item.mutual_communities_count}` : ''}
								</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : !searched ? (
				<BerxEmptyState title="Начните вводить запрос" />
			) : tab === 'users' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={users}
						keyExtractor={(u: SearchResultUser) => String(u.guid)}
						renderItem={({item}: {item: SearchResultUser}) => (
							<Pressable style={styles.row} onPress={() => onOpenProfile(item.username)}>
								<Text style={styles.fullname}>{item.fullname || item.username}</Text>
								<Text style={styles.username}>@{item.username}</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'places' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={places}
						keyExtractor={(p: BerxPlaceSearchResult) => String(p.guid)}
						renderItem={({item}: {item: BerxPlaceSearchResult}) => (
							<Pressable style={styles.mediaRow} onPress={() => onOpenPlace(item.guid)}>
								{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.mediaBody}>
									<Text style={styles.fullname} numberOfLines={1}>{item.title}</Text>
									<Text style={styles.username}>{item.category ?? ''}{item.friends_count > 0 ? `${item.category ? ' · ' : ''}👥 ${item.friends_count}` : ''}</Text>
								</View>
								{item.rating > 0 ? <Text style={styles.rating}>★ {item.rating}</Text> : null}
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'events' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={events}
						keyExtractor={(e: BerxEventSearchResult) => String(e.guid)}
						renderItem={({item}: {item: BerxEventSearchResult}) => (
							<Pressable style={styles.mediaRow} onPress={() => onOpenEvent(item.guid)}>
								{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.mediaBody}>
									<Text style={styles.fullname} numberOfLines={1}>{item.title}</Text>
									<Text style={styles.username}>{new Date(item.starts * 1000).toLocaleDateString('ru-RU')}{item.friends_count > 0 ? ` · 👥 ${item.friends_count}` : ''}</Text>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'communities' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={communities}
						keyExtractor={(c: BerxCommunitySearchResult) => String(c.guid)}
						renderItem={({item}: {item: BerxCommunitySearchResult}) => (
							<Pressable style={styles.row} onPress={() => onOpenCommunity(item.guid)}>
								<Text style={styles.fullname}>{item.title}</Text>
								<Text style={styles.username}>{item.members} участников{item.owner ? ` · ${item.owner}` : ''}{item.friends_count > 0 ? ` · 👥 ${item.friends_count}` : ''}</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={hashtags}
						keyExtractor={(h: BerxTrendingHashtag) => h.hashtag}
						renderItem={({item}: {item: BerxTrendingHashtag}) => (
							<Pressable style={styles.row} onPress={() => onOpenHashtag && onOpenHashtag(item.hashtag)}>
								<Text style={styles.fullname}>#{item.hashtag}</Text>
								<Text style={styles.username}>{item.post_count} {item.post_count === 1 ? 'пост' : 'постов'}</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	searchBar: {padding: spacing.lg, paddingBottom: spacing.sm},
	tabRow: {flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
	tab: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim},
	tabTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	hint: {color: colors.textDim, textAlign: 'center', marginTop: spacing.xl, fontSize: typography.sizeBase},
	fadeFlex: {flex: 1},
	suggestionsList: {paddingBottom: spacing.xl},
	suggestionsTitle: {color: colors.textFaint, fontSize: typography.sizeXs, textTransform: 'uppercase', padding: spacing.lg, paddingBottom: spacing.xs},
	row: {padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	fullname: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	username: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	mediaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	mediaBody: {flex: 1},
	rating: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
