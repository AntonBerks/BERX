/**
 * BERX-176 — Messages. The MESSAGES family's v9 scene.
 *
 * Every field traces to conversations.php's real response:
 * with_username, last_message, time, plus the real unread count from
 * /conversations/unread-count.
 *
 * Two search surfaces, both real and deliberately distinct: the field
 * here is a client-side filter over the already-loaded list, while
 * "Поиск по всем сообщениям" opens the real /api/v1/messagesearch
 * endpoint, which searches message content across every conversation.
 *
 * One tab, "Личные", because that is all the API has. There is no
 * group messaging resource, so a "Групповые" tab would have nothing
 * behind it. There is also no call surface: BERX has no signalling,
 * media server or call-session resource anywhere under /api/v1/, so
 * BerxCallSurface stays BLOCKED rather than shipping a call button
 * that cannot place a call.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxConversationSummary} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing} from '@berx/design-system/tokens';
import {BerxSearchField} from '../../../../packages/design-system/src/spatial/BerxSearchField';
import {BerxChatRow} from '../../../../packages/design-system/src/spatial/BerxChatRow';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxPartialNotice} from '../../../../packages/design-system/src/spatial/BerxPartialNotice';
import {BerxSceneHeader} from '../../../../packages/design-system/src/spatial/BerxSceneHeader';
import {BerxIconButton} from '../../../../packages/design-system/src/icons';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';

export interface ConversationListScreenProps {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername?: string) => void;
	/** The real content search (components/OssnApi/v1/messagesearch.php), not this screen's local filter. */
	onOpenMessageSearch?: () => void;
}

export default function ConversationListScreen(props: ConversationListScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-176" testID="berx-176">
			<ConversationListSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ConversationListSceneBody({api, onOpenConversation, onOpenMessageSearch}: ConversationListScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [items, setItems] = useState<BerxConversationSummary[]>([]);
	const [query, setQuery] = useState('');
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	/**
	 * `null` means the count did not load. It used to fall back to 0,
	 * which is not a degradation — it is a wrong number, and the one
	 * number on this screen a person acts on.
	 */
	const [unread, setUnread] = useState<number | null>(0);

	const load = useCallback(async () => {
		try {
			const [res, unreadRes] = await Promise.all([
				api.conversations(),
				/* best-effort: a failed count must never stop the list loading */
				api.unreadMessageCount().catch(() => null),
			]);
			setItems(res.conversations);
			setUnread(unreadRes ? unreadRes.unread_count : null);
			setError(null);
			setState(res.conversations.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'conversations');
		} finally {
			setRefreshing(false);
		}
	}, [api, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter((it) => (it.with_username ?? '').toLowerCase().includes(q));
	}, [items, query]);

	/**
	 * A filter that matches nothing is a different state from having no
	 * conversations, and the two need different words — "никого не
	 * нашлось" is useless advice to someone who has never written to
	 * anyone.
	 */
	const listState: BerxScreenState = state === 'default' && filtered.length === 0 ? 'empty' : state;
	const filteredToNothing = state === 'default' && filtered.length === 0;

	return (
		<View style={styles.screen}>
			{/* the scene names itself: where you are as the overline, the
			    room's own name at display size, and the real unread count
			    as context under it — never a zero standing in for a count
			    that did not load */}
			<BerxSceneHeader
				mark
				title="Сообщения"
				subtitle={unread !== null && unread > 0 ? `${unread} непрочитанных` : undefined}
				actions={
					onOpenMessageSearch ? (
						<BerxIconButton
							name="search"
							accessibilityLabel="Поиск по всем сообщениям"
							accessibilityHint="Ищет по тексту сообщений во всех диалогах"
							onPress={onOpenMessageSearch}
						/>
					) : null
				}
				testID="conversations-header"
			/>
			{/* the count did not load; showing 0 would be a wrong number
			    rather than a degraded one */}
			{unread === null ? (
				<View style={styles.headerNotice}>
					<BerxPartialNotice message="Счётчик непрочитанных недоступен" onRetry={load} testID="conversations-unread-partial" />
				</View>
			) : null}

			<View style={styles.filter}>
				<BerxSearchField
					value={query}
					onChangeText={setQuery}
					placeholder="Фильтр по списку"
					accessibilityLabel="Фильтр списка диалогов по имени"
					resultCount={query.trim() ? filtered.length : undefined}
				/>
			</View>

			<BerxDataBoundary
				state={listState}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle={filteredToNothing ? 'Никого не нашлось' : 'Пока нет диалогов'}
				emptyBody={
					filteredToNothing
						? 'Попробуйте другое имя, или поищите по тексту сообщений.'
						: 'Начните переписку из профиля пользователя.'
				}
				emptyAction={filteredToNothing ? {label: 'Сбросить фильтр', onPress: () => setQuery('')} : undefined}
				style={styles.body}>
				<FlatList
					data={filtered}
					keyExtractor={(item: BerxConversationSummary) => String(item.with_guid)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
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
						<BerxChatRow
							conversationGuid={item.with_guid}
							name={item.with_username ?? `Пользователь #${item.with_guid}`}
							preview={item.last_message}
							timeLabel={relativeTimeLabel(item.time)}
							onPress={() => onOpenConversation(item.with_guid, item.with_username ?? undefined)}
						/>
					)}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	headerNotice: {paddingHorizontal: spacing.lg},
	filter: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
	body: {flex: 1},
	list: {padding: spacing.lg, gap: spacing.sm},
});
