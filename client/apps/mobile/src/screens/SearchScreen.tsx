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
 */
import {useCallback, useRef, useState} from 'react';
import {View, Text, FlatList, Pressable, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceSearchResult, BerxEventSearchResult, BerxCommunitySearchResult} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxEmptyState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

interface SearchResultUser {
	guid: number;
	username: string;
	fullname: string;
}

type Tab = 'users' | 'places' | 'events' | 'communities';

interface Props {
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

export default function SearchScreen({api, onOpenProfile, onOpenPlace, onOpenEvent, onOpenCommunity}: Props) {
	const [tab, setTab] = useState<Tab>('users');
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<SearchResultUser[]>([]);
	const [places, setPlaces] = useState<BerxPlaceSearchResult[]>([]);
	const [events, setEvents] = useState<BerxEventSearchResult[]>([]);
	const [communities, setCommunities] = useState<BerxCommunitySearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const runSearch = useCallback(
		async (q: string, activeTab: Tab) => {
			if (!q.trim()) {
				setUsers([]);
				setPlaces([]);
				setEvents([]);
				setCommunities([]);
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
				} else {
					const res = await api.searchCommunities(q.trim());
					setCommunities(res.communities);
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

	const currentCount = tab === 'users' ? users.length : tab === 'places' ? places.length : tab === 'events' ? events.length : communities.length;

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
			) : !searched ? (
				<BerxEmptyState title="Начните вводить запрос" />
			) : tab === 'users' ? (
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
			) : tab === 'places' ? (
				<FlatList
					data={places}
					keyExtractor={(p: BerxPlaceSearchResult) => String(p.guid)}
					renderItem={({item}: {item: BerxPlaceSearchResult}) => (
						<Pressable style={styles.mediaRow} onPress={() => onOpenPlace(item.guid)}>
							{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
							<View style={styles.mediaBody}>
								<Text style={styles.fullname} numberOfLines={1}>{item.title}</Text>
								{item.category ? <Text style={styles.username}>{item.category}</Text> : null}
							</View>
							{item.rating > 0 ? <Text style={styles.rating}>★ {item.rating}</Text> : null}
						</Pressable>
					)}
				/>
			) : tab === 'events' ? (
				<FlatList
					data={events}
					keyExtractor={(e: BerxEventSearchResult) => String(e.guid)}
					renderItem={({item}: {item: BerxEventSearchResult}) => (
						<Pressable style={styles.mediaRow} onPress={() => onOpenEvent(item.guid)}>
							{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
							<View style={styles.mediaBody}>
								<Text style={styles.fullname} numberOfLines={1}>{item.title}</Text>
								<Text style={styles.username}>{new Date(item.starts * 1000).toLocaleDateString('ru-RU')}</Text>
							</View>
						</Pressable>
					)}
				/>
			) : (
				<FlatList
					data={communities}
					keyExtractor={(c: BerxCommunitySearchResult) => String(c.guid)}
					renderItem={({item}: {item: BerxCommunitySearchResult}) => (
						<Pressable style={styles.row} onPress={() => onOpenCommunity(item.guid)}>
							<Text style={styles.fullname}>{item.title}</Text>
							<Text style={styles.username}>{item.members} участников{item.owner ? ` · ${item.owner}` : ''}</Text>
						</Pressable>
					)}
				/>
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
	row: {padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	fullname: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	username: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	mediaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	mediaBody: {flex: 1},
	rating: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
