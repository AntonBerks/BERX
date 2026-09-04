/**
 * BERX-176 (thread) — a conversation, as a MESSAGES scene.
 *
 * Real capabilities, all already wired and preserved: typing status
 * (OssnMessageTyping), mark-as-read, and per-message delete with a
 * real server-side participant check. Realtime is POLLING, not a
 * socket — BERX has no WebSocket infrastructure, so typing refreshes
 * on an interval and that limit is disclosed rather than dressed up
 * as live. Message editing does not exist in the OSSN core and is
 * still absent rather than stubbed.
 *
 * Two real defects fixed in the v9 pass:
 *
 *  - Own messages were near-white text (#f5f5f7) on the bright cyan
 *    accent (#4fd6e8) — 1.59:1 measured, far below the 4.5:1 the
 *    accessibility contract targets, and genuinely hard to read. They
 *    now use the control-layer material with an accent tint, which
 *    keeps text on a dark ground and stays well above AA while still
 *    reading as "mine".
 *  - Deleting a message was long-press only, with nothing visible and
 *    no alternative — unreachable by keyboard, switch control, or
 *    anyone who did not already know the gesture. There is now a real
 *    labelled control and an accessibility action, and long-press
 *    still works for those who know it.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMessage} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxMessageBubble} from '../../../../packages/design-system/src/spatial/BerxMessageBubble';
import {BerxComposer} from '../../../../packages/design-system/src/spatial/BerxComposer';
import {BerxTypingIndicator} from '../../../../packages/design-system/src/spatial/BerxTypingIndicator';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {berxAnalytics} from '../spatial/analytics';

export interface ConversationScreenProps {
	api: BerxApiClient;
	myGuid: number;
	otherGuid: number;
	otherUsername?: string;
	onBack: () => void;
}

const TYPING_POLL_MS = 4000;

export default function ConversationScreen(props: ConversationScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-176" trackView={false} testID="berx-176-thread">
			<ConversationSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ConversationSceneBody({api, myGuid, otherGuid, otherUsername, onBack}: ConversationScreenProps) {
	const screen = useBerxScreen();
	const [messages, setMessages] = useState<BerxMessage[]>([]);
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [otherTyping, setOtherTyping] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const listRef = useRef<FlatList<BerxMessage>>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.conversationWith(otherGuid);
			setMessages(res.messages);
			setError(null);
			setState(res.messages.length === 0 ? 'empty' : 'default');
		} catch {
			/**
			 * Real ambiguity this screen cannot resolve: the API returns
			 * the same generic failure whether the thread is empty, the
			 * other user blocked you, or the network failed
			 * (API_SECURITY_MATRIX.md). One honest message beats a
			 * specific reason the API never gave us.
			 */
			setError('Не удалось загрузить переписку');
			setState('error');
			berxAnalytics.error(screen, 'conversation');
		}
	}, [api, otherGuid, screen]);

	useEffect(() => {
		load();
	}, [load]);

	/* real read receipt, best-effort: a failure must not block reading */
	useEffect(() => {
		api.markConversationRead(otherGuid).catch(() => undefined);
	}, [api, otherGuid]);

	/* typing status by polling — no socket infrastructure exists */
	useEffect(() => {
		let active = true;
		const timer = setInterval(async () => {
			try {
				const res = await api.getTypingStatus(otherGuid);
				if (active) setOtherTyping(res.typing);
			} catch {
				/* a polling failure is never surfaced as a conversation error */
			}
		}, TYPING_POLL_MS);
		return () => {
			active = false;
			clearInterval(timer);
			/* never leave a stale "typing" behind us */
			api.setTypingStatus(otherGuid, false).catch(() => undefined);
		};
	}, [api, otherGuid]);

	const send = useCallback(
		async (text: string) => {
			berxAnalytics.mutationStart(screen, otherGuid);
			const started = Date.now();
			await api.sendMessage(otherGuid, text);
			api.setTypingStatus(otherGuid, false).catch(() => undefined);
			/**
			 * Re-fetch rather than appending locally: the send response is
			 * just {status}, with no real id or timestamp echoed back, so
			 * there is nothing honest to construct on the client.
			 */
			await load();
			berxAnalytics.mutationSuccess(screen, Date.now() - started, otherGuid);
		},
		[api, otherGuid, load, screen],
	);

	const remove = useCallback(
		async (messageId: number) => {
			setDeletingId(messageId);
			try {
				await api.deleteMessage(otherGuid, messageId);
				setMessages((prev) => prev.filter((m) => m.id !== messageId));
			} catch {
				/* a real server rejection, e.g. not a participant — nothing optimistic */
				berxAnalytics.mutationError(screen, 'message-delete');
			} finally {
				setDeletingId(null);
			}
		},
		[api, otherGuid, screen],
	);

	const title = otherUsername ?? `Пользователь #${otherGuid}`;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={title} />

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				emptyTitle="Здесь пока пусто"
				emptyBody={`Напишите ${title} первым.`}
				style={styles.body}>
				<FlatList
					ref={listRef}
					data={messages}
					keyExtractor={(m: BerxMessage) => String(m.id)}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
					renderItem={({item}: {item: BerxMessage}) => {
						const own = item.from_guid === myGuid;
						return (
							<BerxMessageBubble
								text={item.text}
								own={own}
								senderName={title}
								timeLabel={relativeTimeLabel(item.time)}
								onDelete={own ? () => remove(item.id) : undefined}
								deleting={deletingId === item.id}
							/>
						);
					}}
				/>
			</BerxDataBoundary>

			<BerxTypingIndicator names={otherTyping ? [title] : []} />

			<View style={styles.composer}>
				<BerxComposer
					onSend={send}
					/* the real outgoing typing signal; the server attributes it to the authenticated user */
					onTyping={() => {
						api.setTypingStatus(otherGuid, true).catch(() => undefined);
					}}
					placeholder="Сообщение"
					accessibilityLabel={`Сообщение для ${title}`}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	body: {flex: 1},
	list: {padding: spacing.md, gap: 2},
	composer: {padding: spacing.md},
});
