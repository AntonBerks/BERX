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
 *
 * MAX BUILD — real editorial "People" discovery rail, user-directed
 * with an explicit reference image. api.peopleDiscovery() (GET
 * /discovery/people) was always a real, working client method — real
 * mutual-friend/mutual-community overlap (discovery.php's own header),
 * never a guessed "similar interests" score — with zero UI caller
 * anywhere. Surfaces here because starting a new conversation with
 * someone you might know is exactly this screen's job. Each card's
 * portrait is the person's own real avatar (no separate "cover photo"
 * concept exists for a suggestion), filled full-bleed rather than
 * shown as a small circle — same honest scrim-simulation technique as
 * ProfileScreen's new hero (no gradient library installed).
 *
 * BERX WORLD TRANSFORMATION — the conversation row was the universal
 * chat-app row (bold name, dim message preview, small unread dot) —
 * directive names this pattern directly ("generic chat bubbles").
 * Inverted the hierarchy: the message preview is now the dominant
 * line (what you actually scan a conversation list for), the
 * username+time moved to a small-caps byline above it — the same
 * editorial byline language FeedScreen already uses. Unread state
 * reads on the avatar itself (a real accent ring) instead of a
 * separate dot bolted on beside the text.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, Text, View, Image, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxConversationSummary, BerxOnlineFriend, BerxPeopleSuggestion} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {ruPlural} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxErrorState, BerxEmptyState, BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const PEOPLE_SCRIM_STEPS = [0, 0.2, 0.45, 0.75, 0.95];

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername?: string) => void;
	/** Real endpoint (components/OssnApi/v1/messagesearch.php) — distinct from this screen's own client-side quick filter below, which only filters the already-loaded list by username. */
	onOpenMessageSearch?: () => void;
}

export default function ConversationListScreen({api, onOpenConversation, onOpenMessageSearch}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxConversationSummary[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [unread, setUnread] = useState(0);
	const [online, setOnline] = useState<BerxOnlineFriend[]>([]);
	const [people, setPeople] = useState<BerxPeopleSuggestion[]>([]);

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
			api.peopleDiscovery().then((r) => setPeople(r.people)).catch(() => undefined);
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

	if (loading) {
		return (
			<View style={styles.screen}>
				<View style={styles.titleRow}>
					<Text style={styles.title}>Сообщения</Text>
				</View>
				<View style={styles.list}>
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<View key={i} style={styles.row}>
							<BerxSkeleton width={48} height={48} style={styles.skeletonAvatar} />
							<View style={styles.rowText}>
								<BerxSkeleton width="45%" height={14} />
								<BerxSkeleton width="70%" height={12} style={styles.skeletonGap} />
							</View>
						</View>
					))}
				</View>
			</View>
		);
	}
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			{/* OPUS 5 — reference composition: the same live editorial
			    headline + circular glass utility the other non-feed surfaces
			    use, so MESSAGING stops being the one screen with a plain text
			    title bar. Both the second line and the search badge are real
			    loaded counts — the unread total the same poll already tracks,
			    and how many friends the presence endpoint actually returned. */}
			<View style={styles.head}>
				<BerxEditorialTitle
					style={styles.headline}
					accentIndex={1}
					lines={[
						'Сообщения',
						unread > 0
							? `${unread} ${ruPlural(unread, 'новое', 'новых', 'новых')}`
							: online.length > 0
							? `${online.length} ${ruPlural(online.length, 'друг', 'друга', 'друзей')} в сети`
							: 'все прочитано',
					]}
				/>
				{onOpenMessageSearch ? (
					<BerxCircleButton glyph="⌕" label="Поиск" onPress={onOpenMessageSearch} />
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

			{people.length > 0 ? (
				<View style={styles.peopleSection}>
					<Text style={styles.peopleLabel}>Люди</Text>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={people}
						keyExtractor={(p: BerxPeopleSuggestion) => `people-${p.guid}`}
						contentContainerStyle={styles.peopleRow}
						renderItem={({item}: {item: BerxPeopleSuggestion}) => (
							<Pressable style={styles.peopleCard} onPress={() => onOpenConversation(item.guid, item.username)}>
								<Image source={{uri: item.icon}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
								<View style={StyleSheet.absoluteFillObject} pointerEvents="none">
									{PEOPLE_SCRIM_STEPS.map((opacity, i) => (
										<View key={i} style={[styles.peopleScrimStep, {height: `${100 - i * 16}%`, backgroundColor: `rgba(5,5,5,${opacity})`}]} />
									))}
								</View>
								<View style={styles.peopleCardContent}>
									<Text style={styles.peopleName} numberOfLines={1}>{item.fullname || item.username}</Text>
									<Text style={styles.peopleMeta} numberOfLines={1}>
										{item.mutual_count === 1 ? '1 общий друг' : `${item.mutual_count} общих друзей`}
									</Text>
								</View>
							</Pressable>
						)}
					/>
				</View>
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
								<View style={[styles.rowAvatarWrap, item.has_unread && styles.rowAvatarWrapUnread]}>
									<BerxAvatar fallbackInitial={(item.with_username ?? '#').charAt(0)} size={48} />
									{item.with_online ? <View style={styles.rowOnlineDot} /> : null}
								</View>
								<View style={styles.rowText}>
									<Text style={styles.byline} numberOfLines={1}>
										{(item.with_username ?? `#${item.with_guid}`).toUpperCase()} · {relativeTimeLabel(item.time)}
									</Text>
									<Text style={[styles.lastMessage, item.has_unread && styles.lastMessageUnread]} numberOfLines={1}>
										{item.last_message}
									</Text>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md},
	title: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	onlineRow: {paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm},
	onlineItem: {alignItems: 'center', width: 60, marginRight: spacing.xs},
	onlineAvatarWrap: {width: 48, height: 48},
	onlineAvatar: {width: 48, height: 48, borderRadius: 24, backgroundColor: colors.graphite},
	onlineDot: {position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.black},
	onlineName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	peopleSection: {marginTop: spacing.sm},
	peopleLabel: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: spacing.lg, marginBottom: spacing.xs},
	peopleRow: {paddingHorizontal: spacing.lg, gap: spacing.sm},
	peopleCard: {width: 148, height: 190, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.graphite, marginRight: spacing.sm, justifyContent: 'flex-end'},
	peopleScrimStep: {position: 'absolute', left: 0, right: 0, bottom: 0},
	peopleCardContent: {padding: spacing.sm, gap: 2},
	peopleName: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	peopleMeta: {color: colors.textDim, fontSize: typography.sizeXs},
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
	rowAvatarWrap: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'},
	// BERX WORLD TRANSFORMATION — unread state reads on the object
	// itself (a real accent ring around the avatar) instead of a
	// separate dot bolted on beside the text — same "the object
	// changes, not a decoration next to it" principle as
	// BerxWayfinder's sliding indicator.
	rowAvatarWrapUnread: {borderWidth: 2, borderColor: colors.accent},
	/** Real per-row presence — same OssnUser::isOnline(10) signal as the "В сети" rail above, just also on the row itself. */
	rowOnlineDot: {position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.black},
	rowText: {flex: 1, gap: 3},
	skeletonAvatar: {borderRadius: 26},
	skeletonGap: {marginTop: 4},
	// Message-forward hierarchy, inverted from the universal chat-app
	// convention (bold name, dim message): the byline (who + when) is
	// the small overline, matching Feed's own byline language; the
	// message preview is the dominant line — what you're scanning a
	// conversation list FOR.
	byline: {
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		fontWeight: typography.weightBold,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	lastMessage: {color: colors.textDim, fontSize: typography.sizeBase},
	lastMessageUnread: {color: colors.text, fontWeight: typography.weightMedium},
});
