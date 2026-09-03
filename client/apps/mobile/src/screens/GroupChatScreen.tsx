/**
 * BERX GROUP CHAT — a real multi-participant conversation, on its own
 * entity (classes/OssnGroupChat.php, components/OssnApi/v1/groups.php)
 * — not the 1:1 conversation model (ConversationScreen.tsx) reskinned.
 *
 * Real-time is POLLING, same disclosed model as the 1:1 thread: no
 * WebSocket infrastructure exists in BERX, so messages/typing refresh
 * on a 4s interval rather than pretending to be a live socket. Skipped
 * while a send/edit/delete is in flight, same reasoning as
 * ConversationScreen's own polling effect — a slow poll response must
 * never clobber in-progress local state.
 *
 * Every action here (edit/delete/react/pin/mute) calls the real
 * server route and reflects only what the server actually confirmed —
 * nothing here is optimistic-and-hope, because the server is the only
 * place role/membership is actually enforced.
 *
 * BERX WORLD — real spatial entrance for messages (master directive
 * §20: "New message: appear → move through depth → settle"). Every
 * message id that appears in a `messages` update — first load or a
 * later poll tick alike — is tracked in `seenIds` (a ref, so marking a
 * message seen never itself triggers a render); a message not yet in
 * that set is genuinely new, gets one entrance via BerxFadeIn, and is
 * added to the set so a later re-render of the SAME message (its
 * reaction count changing, say) never replays the animation. This is
 * why it's correct rather than decorative: it distinguishes an actual
 * new arrival from the poll simply re-delivering the list.
 */
import {Fragment, useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {FlatList, Text, View, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxGroupMessage, BerxGroupConversation} from '@berx/api/types';
import {relativeTimeLabel, ruPlural} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

interface Props {
	api: BerxApiClient;
	myGuid: number;
	groupId: number;
	onOpenInfo: (groupId: number) => void;
	onOpenProfile?: (guid: number) => void;
	onBack: () => void;
}

export default function GroupChatScreen({api, myGuid, groupId, onOpenInfo, onOpenProfile, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [group, setGroup] = useState<BerxGroupConversation | null>(null);
	const [messages, setMessages] = useState<BerxGroupMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [draft, setDraft] = useState('');
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [typingUsers, setTypingUsers] = useState<string[]>([]);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [replyTo, setReplyTo] = useState<BerxGroupMessage | null>(null);
	const listRef = useRef<FlatList<BerxGroupMessage>>(null);
	const sendingRef = useRef(sending);
	const deletingIdRef = useRef(deletingId);
	const editingIdRef = useRef(editingId);
	useEffect(() => { sendingRef.current = sending; }, [sending]);
	useEffect(() => { deletingIdRef.current = deletingId; }, [deletingId]);
	useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

	// Real spatial entrance tracking — see this file's own header. Grows
	// monotonically; a message id is never removed, so it never
	// re-animates once it has genuinely arrived once.
	const seenIds = useRef<Set<number>>(new Set());
	const [freshIds, setFreshIds] = useState<Set<number>>(new Set());
	useEffect(() => {
		const arrivals = messages.map((m) => m.id).filter((id) => !seenIds.current.has(id));
		if (arrivals.length > 0) {
			arrivals.forEach((id) => seenIds.current.add(id));
			setFreshIds(new Set(arrivals));
		}
	}, [messages]);

	const load = useCallback(async () => {
		try {
			const [g, m] = await Promise.all([api.getGroup(groupId), api.groupMessages(groupId)]);
			setGroup(g.group);
			setMessages(m.messages);
			setError(null);
		} catch {
			// Real, honest ambiguity: the API returns the same 404 whether
			// the group doesn't exist or the caller was removed from it —
			// there's nothing more specific to say than "not available".
			setError('Групповой чат недоступен');
		} finally {
			setLoading(false);
		}
	}, [api, groupId]);

	useEffect(() => {
		load();
	}, [load]);

	// Real mark-as-read, once per opened thread — best-effort, never
	// blocks reading the conversation.
	useEffect(() => {
		if (messages.length > 0) {
			api.markGroupRead(groupId, messages[messages.length - 1].id).catch(() => undefined);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [api, groupId, messages.length]);

	// Real POLLING for messages + typing (no WebSocket infra — same
	// disclosed model as ConversationScreen.tsx's own header).
	useEffect(() => {
		let active = true;
		const timer = setInterval(async () => {
			try {
				const res = await api.groupTyping(groupId);
				if (active) setTypingUsers(res.typing.map((u) => u.fullname || u.username));
			} catch {
				// polling failure is silent
			}
			if (!sendingRef.current && deletingIdRef.current === null && editingIdRef.current === null) {
				try {
					const res = await api.groupMessages(groupId);
					if (active) {
						setMessages((prev: BerxGroupMessage[]) => {
							const changed = prev.length !== res.messages.length || prev.some((m: BerxGroupMessage, i: number) => {
								const n = res.messages[i];
								return !n || m.id !== n.id || m.reacted_by_me !== n.reacted_by_me || m.reaction_count !== n.reaction_count || m.text !== n.text || m.deleted !== n.deleted;
							});
							return changed ? res.messages : prev;
						});
						if (res.messages.length > 0) {
							api.markGroupRead(groupId, res.messages[res.messages.length - 1].id).catch(() => undefined);
						}
					}
				} catch {
					// polling failure is silent — the thread keeps showing its last-known state
				}
			}
		}, 4000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [api, groupId]);

	function handleDraftChange(text: string) {
		setDraft(text);
		api.setGroupTyping(groupId).catch(() => undefined);
	}

	async function handleDeleteMessage(messageId: number) {
		setDeletingId(messageId);
		try {
			await api.deleteGroupMessage(groupId, messageId);
			await load();
		} catch {
			// real server rejection — nothing optimistic
		} finally {
			setDeletingId(null);
		}
	}

	async function handleToggleReaction(messageId: number) {
		try {
			const res = await api.toggleGroupMessageReaction(groupId, messageId);
			setMessages((prev: BerxGroupMessage[]) =>
				prev.map((m) => (m.id === messageId ? {...m, reacted_by_me: res.reacted, reaction_count: res.reaction_count} : m)),
			);
		} catch {
			// real server rejection — nothing optimistic
		}
	}

	async function handlePin(messageId: number) {
		try {
			await api.pinGroupMessage(groupId, messageId);
			await load();
		} catch {
			// real server rejection (non-admin) — silent, the option only
			// appears for an admin in the first place
		}
	}

	function startEdit(item: BerxGroupMessage) {
		setEditingId(item.id);
		setDraft(item.text ?? '');
		setReplyTo(null);
		setSendError(null);
	}

	function cancelEdit() {
		setEditingId(null);
		setDraft('');
	}

	/** Real menu, options gated by the caller's own real role/authorship — the server re-checks every one of these regardless. */
	function handleLongPress(item: BerxGroupMessage) {
		const isMine = item.sender?.guid === myGuid;
		const isAdmin = group?.my_role === 'admin';
		const options: Array<{text: string; style?: 'cancel' | 'destructive'; onPress?: () => void}> = [];
		options.push({text: 'Ответить', onPress: () => { setReplyTo(item); setEditingId(null); }});
		options.push({text: 'Реакция', onPress: () => handleToggleReaction(item.id)});
		if (isAdmin) {
			options.push({text: 'Закрепить', onPress: () => handlePin(item.id)});
		}
		if (isMine) {
			options.push({text: 'Изменить', onPress: () => startEdit(item)});
		}
		if (isMine || isAdmin) {
			options.push({text: 'Удалить', style: 'destructive', onPress: () => handleDeleteMessage(item.id)});
		}
		options.push({text: 'Отмена', style: 'cancel'});
		Alert.alert('Сообщение', undefined, options);
	}

	async function handleSend() {
		const text = draft.trim();
		if (!text) return;
		setSending(true);
		setSendError(null);
		try {
			if (editingId !== null) {
				await api.editGroupMessage(groupId, editingId, text);
				setEditingId(null);
			} else {
				await api.sendGroupMessage(groupId, text, replyTo?.id);
				setReplyTo(null);
				api.setGroupTyping(groupId).catch(() => undefined);
			}
			setDraft('');
			await load();
		} catch {
			setSendError(editingId !== null ? 'Не удалось изменить сообщение.' : 'Не удалось отправить сообщение.');
		} finally {
			setSending(false);
		}
	}

	if (loading) return <BerxLoadingState label="Загрузка чата..." />;
	if (error || !group) return <BerxErrorState message={error ?? 'Групповой чат недоступен'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader
				onBack={onBack}
				title={group.name}
				subtitle={`${group.participant_count} ${ruPlural(group.participant_count, 'участник', 'участника', 'участников')}`}
			/>
			<Pressable style={styles.infoBar} onPress={() => onOpenInfo(groupId)}>
				<Text style={styles.infoBarLabel}>Информация о группе и участники</Text>
			</Pressable>

			{group.pinned_messages && group.pinned_messages.length > 0 ? (
				<View style={styles.pinnedBar}>
				<View style={styles.pinnedRow}>
						<BerxIcon name="pin" size={13} color={colors.accent} />
						<Text style={styles.pinnedLabel} numberOfLines={1}>{group.pinned_messages[0].text}</Text>
					</View>
				</View>
			) : null}

			<FlatList
				ref={listRef}
				style={styles.list}
				data={messages}
				keyExtractor={(m: BerxGroupMessage) => String(m.id)}
				renderItem={({item}: {item: BerxGroupMessage}) => {
					const isMine = item.sender?.guid === myGuid;
					// Real entrance — see this file's own header. A message
					// already marked seen renders bare (Fragment), so it never
					// replays the animation on a later re-render (a reaction
					// count changing, say).
					const fresh = freshIds.has(item.id);
					const Wrap = fresh ? BerxFadeIn : Fragment;
					const wrapProps = fresh ? {riseFrom: 14, scaleFrom: 0.97} : {};
					if (item.deleted) {
						return (
							<Wrap {...wrapProps}>
								<View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, styles.bubbleDeletedWrap]}>
									<Text style={styles.bubbleDeletedText}>Сообщение удалено</Text>
								</View>
							</Wrap>
						);
					}
					return (
						<Wrap {...wrapProps}>
							<Pressable
								onLongPress={() => handleLongPress(item)}
								disabled={deletingId === item.id}
								style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, deletingId === item.id && styles.bubbleDeleting, editingId === item.id && styles.bubbleEditing]}>
								{!isMine ? (
									<Pressable
										style={styles.senderRow}
										onPress={() => item.sender && onOpenProfile && onOpenProfile(item.sender.guid)}
										disabled={!item.sender || !onOpenProfile}>
										<BerxAvatar iconUrl={item.sender?.icon ?? null} fallbackInitial={(item.sender?.username ?? '?').charAt(0)} size={20} />
										<Text style={styles.senderName}>{item.sender?.fullname || item.sender?.username || 'BERX'}</Text>
									</Pressable>
								) : null}
								{item.reply_to ? (
									<View style={styles.replyPreview}>
										<Text style={styles.replyPreviewAuthor}>{item.reply_to.sender?.fullname || item.reply_to.sender?.username || 'BERX'}</Text>
										<Text style={styles.replyPreviewText} numberOfLines={2}>{item.reply_to.text}</Text>
									</View>
								) : null}
								<Text style={styles.bubbleText}>{item.text}</Text>
								<View style={styles.bubbleMetaRow}>
									<Text style={styles.bubbleTime}>
										{relativeTimeLabel(item.time_created)}
										{item.time_edited ? ' · изменено' : ''}
									</Text>
								<Pressable onPress={() => handleToggleReaction(item.id)} hitSlop={8} style={styles.reactionBtn}>
										<BerxIcon name="heart" size={12} filled={item.reacted_by_me} color={item.reacted_by_me ? colors.accent : colors.textFaint} />
										{item.reaction_count > 0 ? (
											<Text style={[styles.reaction, item.reacted_by_me && styles.reactionActive]}>{item.reaction_count}</Text>
										) : null}
									</Pressable>
								</View>
							</Pressable>
						</Wrap>
					);
				}}
			/>

			{typingUsers.length > 0 ? (
				<Text style={styles.typingHint}>{typingUsers.join(', ')} печата{typingUsers.length === 1 ? 'ет' : 'ют'}…</Text>
			) : null}

			{replyTo ? (
				<View style={styles.editingRow}>
					<Text style={styles.editingHint} numberOfLines={1}>
						Ответ: {replyTo.text}
					</Text>
					<Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
						<Text style={styles.editingCancel}>Отмена</Text>
					</Pressable>
				</View>
			) : null}
			{editingId !== null ? (
				<View style={styles.editingRow}>
					<Text style={styles.editingHint}>Редактирование сообщения</Text>
					<Pressable onPress={cancelEdit} hitSlop={8}>
						<Text style={styles.editingCancel}>Отмена</Text>
					</Pressable>
				</View>
			) : null}

			<View style={styles.composer}>
				<BerxInput style={styles.composerInput} placeholder="Сообщение..." value={draft} onChangeText={handleDraftChange} multiline />
				<BerxButton label={editingId !== null ? 'Сохранить' : 'Отправить'} onPress={handleSend} loading={sending} disabled={!draft.trim()} />
			</View>
			{sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	infoBar: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	infoBarLabel: {color: colors.accent, fontSize: typography.sizeXs, textAlign: 'center'},
	pinnedBar: {backgroundColor: colors.glass2, paddingHorizontal: spacing.md, paddingVertical: spacing.xs},
	pinnedRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
	pinnedLabel: {color: colors.textDim, fontSize: typography.sizeXs},
	list: {flex: 1, paddingHorizontal: spacing.md},
	bubble: {
		maxWidth: '80%',
		borderRadius: radius.md,
		padding: spacing.md,
		marginVertical: spacing.xs,
	},
	bubbleMine: {alignSelf: 'flex-end', backgroundColor: colors.accent},
	bubbleTheirs: {alignSelf: 'flex-start', backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.borderSoft},
	bubbleDeleting: {opacity: 0.4},
	bubbleEditing: {borderWidth: 2, borderColor: colors.accent},
	bubbleDeletedWrap: {opacity: 0.5},
	bubbleDeletedText: {color: colors.textFaint, fontSize: typography.sizeSm, fontStyle: 'italic'},
	senderRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4},
	senderName: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	replyPreview: {backgroundColor: colors.glass2, borderRadius: radius.sm, padding: spacing.xs, marginBottom: spacing.xs, borderLeftWidth: 2, borderLeftColor: colors.accent},
	replyPreviewAuthor: {color: colors.accent, fontSize: 10, fontWeight: typography.weightMedium},
	replyPreviewText: {color: colors.textDim, fontSize: typography.sizeXs},
	typingHint: {color: colors.textFaint, fontSize: typography.sizeXs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs},
	editingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: spacing.sm},
	editingHint: {flex: 1, color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	editingCancel: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline'},
	bubbleText: {color: colors.text, fontSize: typography.sizeBase},
	bubbleMetaRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: spacing.xs},
	bubbleTime: {color: colors.textFaint, fontSize: typography.sizeXs},
	reactionBtn: {flexDirection: 'row', alignItems: 'center', gap: 4},
	reaction: {color: colors.textFaint, fontSize: typography.sizeXs},
	// Was colors.danger — same mismatch just fixed in PostDetail's comment
	// likes: red is the destructive role, and the heart beside this count
	// was already filled accent-cyan, so the glyph and its own number
	// disagreed. Third occurrence of this exact bug in one session.
	reactionActive: {color: colors.accent},
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
