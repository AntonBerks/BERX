/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Every field rendered here (with_username, last_message, time)
 * traces to conversations.php's real JSON response — no mock data.
 * Two distinct search surfaces, both real: the inline field below is
 * a client-side quick filter over the already-loaded list; "Поиск по
 * всем сообщениям" opens MessageSearchScreen, backed by the real
 * /api/v1/messagesearch endpoint (searches message CONTENT across all
 * conversations, not just usernames in this list). An honest
 * "Личные" tab only, no "Групповые" tab: the real API has no group
 * messaging, so a second tab would have nothing behind it.
 *
 * BERX WORLD MAX BUILD -- real "В сети" rail: api.onlineFriends() (GET
 * /presence) always existed -- real ossn_users.last_activity, the same
 * 100s threshold OssnUser::isOnline() itself uses -- but had zero
 * client caller anywhere. Messaging is exactly where "who can I talk
 * to right now" matters most, so it surfaces here rather than a new
 * standalone screen. Best-effort, never blocks the conversation list.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, Text, View, Image, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxConversationSummary, BerxOnlineFriend} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername?: string) => void;
	/** Real endpoint (components/OssnApi/v1/messagesearch.php) — distinct from this screen's own client-side quick filter below, which only filters the already-loaded list by username. */
	onOpenMessageSearch?: () => void;
}

export default function ConversationListScreen({api, onOpenConversation, onOpenMessageSearch}: Props) {
	const [items, setItems] = useState<BerxConversationSummary[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [unread, setUnread] = useState(0);
	const [online, setOnline] = useState<BerxOnlineFriend[]>([]);

	const load = useCallback(async () => {
		try {
			const [res, unreadRes] = await Promise.all([
				api.conversations(),
				// Real badge count — best-effort: a failed count must
				// never prevent the conversation list itself loading.
				api.unreadMessageCount().catch(() => ({unread_count: 0})),
			]);
			setItems(res.conversations);
			setUnread(unreadRes.unread_count);
			setError(null);
			// Real presence — best-effort, never blocks the list itself.
			api.onlineFriends().then((r) => setOnline(r.online)).catch(() => undefined);
		} catch {
			setError('Не удалось загрузить диалоги');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => {
		if (!query.trim()) return items;
		const q = query.trim().toLowerCase();
		return items.filter((it) => (it.with_username ?? '').toLowerCase().includes(q));
	}, [items, query]);

	if (loading) return <BerxLoadingState label="Загрузка диалогов..." />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<View style={styles.titleRow}>
				<Text style={styles.title}>Сообщения{unread > 0 ? ` (${unread})` : ''}</Text>
				{onOpenMessageSearch ? (
					<Pressable onPress={onOpenMessageSearch} hitSlop={12}>
						<Text style={styles.searchAllLink}>Поиск по всем сообщениям</Text>
					</Pressable>
				) : null}
			</View>
			{online.length > 0 ? (
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={online}
					keyExtractor={(f: BerxOnlineFriend) => String(f.guid)}
					contentContainerStyle={styles.onlineRow}
					renderItem={({item}: {item: BerxOnlineFriend}) => (
						<Pressable style={styles.onlineItem} onPress={() => onOpenConversation(item.guid, item.username)}>
							<View style={styles.onlineAvatarWrap}>
								<Image source={{uri: item.icon}} style={styles.onlineAvatar} />
								<View style={styles.onlineDot} />
							</View>
							<Text style={styles.onlineName} numberOfLines={1}>{item.fullname || item.username}</Text>
						</Pressable>
					)}
				/>
			) : null}

			<View style={styles.searchBar}>
				<BerxInput placeholder="Фильтр по списку" value={query} onChangeText={setQuery} autoCapitalize="none" />
			</View>

			{items.length === 0 ? (
				<BerxEmptyState title="Пока нет диалогов" subtitle="Начните переписку через профиль пользователя." />
			) : filtered.length === 0 ? (
				<BerxEmptyState title="Никого не нашлось" />
			) : (
				<BerxFadeIn style={styles.listFade}>
					<FlatList
						style={styles.list}
						data={filtered}
						keyExtractor={(item: BerxConversationSummary) => String(item.with_guid)}
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
						renderItem={({item}: {item: BerxConversationSummary}) => (
							<Pressable
								style={styles.row}
								onPress={() => onOpenConversation(item.with_guid, item.with_username ?? undefined)}
							>
								<BerxAvatar fallbackInitial={(item.with_username ?? '#').charAt(0)} size={48} />
								<View style={styles.rowText}>
									<Text style={styles.username}>{item.with_username ?? `Пользователь #${item.with_guid}`}</Text>
									<Text style={styles.lastMessage} numberOfLines={1}>
										{item.last_message}
									</Text>
								</View>
								<Text style={styles.time}>{relativeTimeLabel(item.time)}</Text>
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
	titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md},
	title: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	searchAllLink: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	onlineRow: {paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm},
	onlineItem: {alignItems: 'center', width: 60, marginRight: spacing.xs},
	onlineAvatarWrap: {width: 48, height: 48},
	onlineAvatar: {width: 48, height: 48, borderRadius: 24, backgroundColor: colors.graphite},
	onlineDot: {position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.black},
	onlineName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	searchBar: {padding: spacing.lg, paddingBottom: spacing.sm},
	listFade: {flex: 1},
	list: {backgroundColor: colors.black, flex: 1},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
	},
	rowText: {flex: 1},
	username: {color: colors.text, fontWeight: typography.weightMedium},
	lastMessage: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: 2},
	time: {color: colors.textFaint, fontSize: typography.sizeXs},
});
