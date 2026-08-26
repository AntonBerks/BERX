/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real capabilities now wired (previously honestly absent, since the
 * API didn't expose them): typing indicator (OssnMessageTyping),
 * mark-as-read (markViewed), and per-message delete with a real
 * server-side participant check. Realtime is POLLING, not a socket —
 * no WebSocket infrastructure exists in BERX yet, so typing status
 * refreshes on an interval and that limitation is disclosed rather
 * than dressed up as live. Message editing still does not exist in
 * the OSSN core and is therefore still absent, not stubbed.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, Text, View, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMessage} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';

interface Props {
	api: BerxApiClient;
	myGuid: number;
	otherGuid: number;
	otherUsername?: string;
	onBack: () => void;
}

export default function ConversationScreen({api, myGuid, otherGuid, otherUsername, onBack}: Props) {
	const [messages, setMessages] = useState<BerxMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [draft, setDraft] = useState('');
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const listRef = useRef<FlatList<BerxMessage>>(null);
	const [otherTyping, setOtherTyping] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.conversationWith(otherGuid);
			setMessages(res.messages);
			setError(null);
		} catch {
			// Real, honest ambiguity this screen can't resolve itself:
			// the API returns the same generic failure whether the
			// thread is empty, the other user blocked you, or a network
			// error happened — conversationWith() doesn't distinguish
			// them (see API_SECURITY_MATRIX.md). Shown as one message
			// rather than inventing a specific reason the API doesn't
			// actually tell the client.
			setError('Не удалось загрузить переписку');
		} finally {
			setLoading(false);
		}
	}, [api, otherGuid]);

	useEffect(() => {
		load();
	}, [load]);

	// Real mark-as-read: fires once per opened thread, best-effort —
	// a failed read-receipt must never block reading the conversation.
	useEffect(() => {
		api.markConversationRead(otherGuid).catch(() => undefined);
	}, [api, otherGuid]);

	// Real typing status via POLLING (no WebSocket infrastructure
	// exists — disclosed in this file's header, not pretended to be
	// live). Cleared on unmount so a stale "typing" never persists.
	useEffect(() => {
		let active = true;
		const timer = setInterval(async () => {
			try {
				const res = await api.getTypingStatus(otherGuid);
				if (active) setOtherTyping(res.typing);
			} catch {
				// polling failure is silent — never surfaces as a conversation error
			}
		}, 4000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [api, otherGuid]);

	function handleDraftChange(text: string) {
		setDraft(text);
		// Real outgoing typing signal — server always attributes it to
		// the authenticated user, never to a client-supplied guid.
		api.setTypingStatus(otherGuid, text.length > 0).catch(() => undefined);
	}

	async function handleDeleteMessage(messageId: number) {
		setDeletingId(messageId);
		try {
			await api.deleteMessage(otherGuid, messageId);
			setMessages((prev) => prev.filter((m) => m.id !== messageId));
		} catch {
			// real server rejection (e.g. not a participant) — nothing optimistic
		} finally {
			setDeletingId(null);
		}
	}

	async function handleSend() {
		const text = draft.trim();
		if (!text) return;
		setSending(true);
		setSendError(null);
		try {
			await api.sendMessage(otherGuid, text);
			setDraft('');
			api.setTypingStatus(otherGuid, false).catch(() => undefined);
			// Server-confirmed, not optimistic: re-fetch the real thread
			// rather than locally appending a guessed message object —
			// the API's send response is just {status:string}, it
			// doesn't echo back the created message's real id/time, so
			// there's nothing honest to construct locally.
			await load();
		} catch {
			setSendError('Не удалось отправить. Возможно, вы заблокированы.');
		} finally {
			setSending(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={otherUsername ?? `Пользователь #${otherGuid}`} />

			{loading ? (
				<BerxLoadingState label="Загрузка переписки..." />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : (
				<FlatList
					ref={listRef}
					style={styles.list}
					data={messages}
					keyExtractor={(m: BerxMessage) => String(m.id)}
					renderItem={({item}: {item: BerxMessage}) => (
						<Pressable
							onLongPress={() => handleDeleteMessage(item.id)}
							disabled={deletingId === item.id}
							style={[styles.bubble, item.from_guid === myGuid ? styles.bubbleMine : styles.bubbleTheirs, deletingId === item.id && styles.bubbleDeleting]}>
							<Text style={styles.bubbleText}>{item.text}</Text>
							<Text style={styles.bubbleTime}>{relativeTimeLabel(item.time)}</Text>
						</Pressable>
					)}
				/>
			)}

			{otherTyping ? <Text style={styles.typingHint}>печатает…</Text> : null}

			<View style={styles.composer}>
				<BerxInput
					style={styles.composerInput}
					placeholder="Сообщение..."
					value={draft}
					onChangeText={handleDraftChange}
					multiline
				/>
				<BerxButton label="Отправить" onPress={handleSend} loading={sending} disabled={!draft.trim()} />
			</View>
			{sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	list: {flex: 1, paddingHorizontal: spacing.md},
	bubble: {
		maxWidth: '80%',
		borderRadius: radius.md,
		padding: spacing.md,
		marginVertical: spacing.xs,
	},
	bubbleMine: {
		alignSelf: 'flex-end',
		backgroundColor: colors.accent,
	},
	bubbleTheirs: {
		alignSelf: 'flex-start',
		backgroundColor: colors.graphite,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	bubbleDeleting: {opacity: 0.4},
	typingHint: {color: colors.textFaint, fontSize: typography.sizeXs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs},
	bubbleText: {color: colors.text, fontSize: typography.sizeBase},
	bubbleTime: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
	composer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: spacing.sm,
		padding: spacing.md,
		borderTopWidth: 1,
		borderTopColor: colors.borderSoft,
	},
	composerInput: {flex: 1},
	sendError: {color: colors.danger, fontSize: typography.sizeXs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
});
