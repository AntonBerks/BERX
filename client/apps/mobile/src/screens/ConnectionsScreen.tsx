/**
 * BERX-151 — Connections. The SOCIAL family's v9 scene.
 *
 * This screen did not exist. Every capability it needs was already
 * real and reachable — GET /friends, GET /search/users,
 * POST/DELETE /friend/{guid}, POST /block — but the only way to add
 * or remove a friend was to navigate into that person's profile
 * first. The archive names this contract; the backend already
 * supported it; nothing was here.
 *
 * Two lists, both real:
 *  - "Друзья" is GET /friends, which is caller-scoped by design. There
 *    is no by-user friends resource, so this is the viewer's own list
 *    and the screen says so rather than implying it is anyone's.
 *  - "Поиск" is the real user search. A result's friendship state is
 *    derived from the friends list already loaded, not guessed: a
 *    person who is not in it is shown as "not a friend", which is
 *    exactly what the data supports.
 *
 * Removing a friend re-reads the list rather than splicing locally,
 * and adding one re-reads too — POST /friend/{guid} may leave a
 * one-directional request pending, and claiming mutual friendship
 * before the server agrees is the small lie this project does not
 * ship.
 */
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFriend} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSearchField} from '../../../../packages/design-system/src/spatial/BerxSearchField';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
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

type Tab = 'friends' | 'search';

const DEBOUNCE_MS = 400;

export interface ConnectionsScreenProps {
	api: BerxApiClient;
	onOpenProfile: (username: string) => void;
	onMessage?: (otherGuid: number, otherUsername: string) => void;
	onBack?: () => void;
}

export default function ConnectionsScreen(props: ConnectionsScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-151" testID="berx-151">
			<ConnectionsSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ConnectionsSceneBody({api, onOpenProfile, onMessage, onBack}: ConnectionsScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [tab, setTab] = useState<Tab>('friends');
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResultUser[]>([]);
	const [searched, setSearched] = useState(false);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loadFriends = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const res = await api.friends();
			setFriends(res.friends);
			setState(res.friends.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'friends');
		}
	}, [api, screen, offline]);

	useEffect(() => {
		loadFriends();
	}, [loadFriends]);

	/** Friendship state comes from the loaded list — never guessed. */
	const friendGuids = useMemo(() => new Set(friends.map((f) => f.guid)), [friends]);

	const runSearch = useCallback(
		async (q: string) => {
			const term = q.trim();
			if (!term) {
				setResults([]);
				setSearched(false);
				setState('empty');
				return;
			}
			setState('loading');
			try {
				const res = await api.searchUsers(term);
				setResults(res.users);
				setError(null);
				setState(res.users.length === 0 ? 'empty' : 'default');
			} catch (e) {
				/* the real reason, not one generic error: an expired session,
				   a forbidden resource and a dead server are different
				   problems, and being offline is a fourth */
				const failure = classifyFailure(e, offline);
				setError(failure.message);
				setRetryable(failure.retryable);
				setState(failure.state);
				berxAnalytics.error(screen, 'search-users');
			} finally {
				setSearched(true);
			}
		},
		[api, screen, offline],
	);

	const changeQuery = useCallback(
		(text: string) => {
			setQuery(text);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
		},
		[runSearch],
	);

	const switchTab = useCallback(
		(next: string) => {
			const key = next as Tab;
			setTab(key);
			if (key === 'friends') loadFriends();
			else if (query.trim()) runSearch(query);
			else setState('empty');
		},
		[loadFriends, runSearch, query],
	);

	const toggleFriend = useCallback(
		async (guid: number) => {
			const wasFriend = friendGuids.has(guid);
			setBusyGuid(guid);
			berxAnalytics.mutationStart(screen, guid);
			const started = Date.now();
			try {
				if (wasFriend) await api.removeFriend(guid);
				else await api.addFriend(guid);
				/**
				 * Re-read: adding may leave a one-directional request the
				 * other side has not confirmed, and only the server knows
				 * whether this person is now genuinely a friend.
				 */
				const res = await api.friends();
				setFriends(res.friends);
				if (tab === 'friends') setState(res.friends.length === 0 ? 'empty' : 'default');
				berxAnalytics.mutationSuccess(screen, Date.now() - started, guid);
			} catch {
				/* nothing optimistic — the list stays as the server left it */
				berxAnalytics.mutationError(screen, 'friend');
			} finally {
				setBusyGuid(null);
			}
		},
		[api, friendGuids, screen, tab],
	);

	const listProps = {
		onScroll,
		scrollEventThrottle,
		contentContainerStyle: styles.list,
		removeClippedSubviews: true,
		windowSize: Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3)),
	};

	const searchedToNothing = tab === 'search' && searched && results.length === 0;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Связи" onBack={onBack} />

			<View style={styles.toolbar}>
				<BerxFilterBar
					options={[
						{key: 'friends', label: 'Друзья', count: friends.length},
						{key: 'search', label: 'Поиск'},
					]}
					selected={[tab]}
					onToggle={switchTab}
					multiple={false}
					accessibilityLabel="Друзья или поиск людей"
				/>
				{tab === 'search' ? (
					<View style={styles.search}>
						<BerxSearchField
							value={query}
							onChangeText={changeQuery}
							onSubmit={() => runSearch(query)}
							placeholder="Имя или логин"
							accessibilityLabel="Поиск людей в BERX"
							resultCount={searched && state !== 'loading' ? results.length : undefined}
						/>
					</View>
				) : null}
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={tab === 'friends' ? loadFriends : () => runSearch(query)}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle={
					tab === 'friends' ? 'Пока никого' : searchedToNothing ? 'Никого не нашлось' : 'Кого вы ищете?'
				}
				emptyBody={
					tab === 'friends'
						? 'Это ваш собственный список друзей — BERX не публикует чужие списки. Найдите людей во вкладке «Поиск».'
						: searchedToNothing
							? 'Попробуйте другое имя или логин.'
							: 'Ищите людей по имени или логину.'
				}
				emptyAction={tab === 'friends' ? {label: 'Найти людей', onPress: () => switchTab('search')} : undefined}
				style={styles.body}>
				{tab === 'friends' ? (
					<FlatList
						{...listProps}
						data={friends}
						keyExtractor={(f: BerxFriend) => String(f.guid)}
						renderItem={({item}: {item: BerxFriend}) => (
							<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
								<BerxIdentity
									userGuid={item.guid}
									name={item.fullname || item.username}
									handle={item.username}
									avatarUrl={item.icon}
									relationship="friend"
									onPress={() => onOpenProfile(item.username)}
									trailing={
										<View style={styles.rowActions}>
											{onMessage ? (
												<BerxButton
													label="Написать"
													variant="secondary"
													onPress={() => onMessage(item.guid, item.username)}
												/>
											) : null}
											<BerxButton
												label="Удалить"
												variant="secondary"
												loading={busyGuid === item.guid}
												onPress={() => toggleFriend(item.guid)}
											/>
										</View>
									}
								/>
							</BerxSpatialCard>
						)}
					/>
				) : (
					<FlatList
						{...listProps}
						data={results}
						keyExtractor={(u: SearchResultUser) => String(u.guid)}
						renderItem={({item}: {item: SearchResultUser}) => {
							const isFriend = friendGuids.has(item.guid);
							return (
								<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
									<BerxIdentity
										userGuid={item.guid}
										name={item.fullname || item.username}
										handle={item.username}
										relationship={isFriend ? 'friend' : 'none'}
										onPress={() => onOpenProfile(item.username)}
										trailing={
											<BerxButton
												label={isFriend ? 'Удалить' : 'Добавить'}
												variant={isFriend ? 'secondary' : 'primary'}
												loading={busyGuid === item.guid}
												onPress={() => toggleFriend(item.guid)}
											/>
										}
									/>
								</BerxSpatialCard>
							);
						}}
					/>
				)}
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	toolbar: {paddingTop: spacing.sm, gap: spacing.sm},
	search: {paddingHorizontal: spacing.lg},
	body: {flex: 1},
	list: {padding: spacing.lg, gap: spacing.md},
	rowActions: {flexDirection: 'row', gap: spacing.sm},
});
