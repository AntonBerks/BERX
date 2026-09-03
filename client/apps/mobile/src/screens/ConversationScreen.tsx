/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real capabilities now wired (previously honestly absent, since the
 * API didn't expose them): typing indicator (OssnMessageTyping),
 * mark-as-read (markViewed), and per-message delete with a real
 * server-side participant check. Realtime is POLLING, not a socket —
 * no WebSocket infrastructure exists in BERX yet, so typing status
 * refreshes on an interval and that limitation is disclosed rather
 * than dressed up as live.
 *
 * MAX BUILD — real message editing (OssnMessages::editMessage(),
 * sender-only) closes what was previously a real, honestly-disclosed
 * gap. Long-press on your own message now offers Изменить/Удалить
 * instead of deleting immediately; an edited message always shows
 * "(изменено)" — never a silent rewrite of what was actually said.
 *
 * MAX BUILD — real read receipts (✓ sent / ✓✓ seen) on your own
 * messages. `viewed` was already a real, already-maintained column —
 * the whole pipeline (markViewed() on thread open) was real end-to-end
 * before this, it just never reached the JSON or the UI.
 *
 * MAX BUILD — real message polling: the thread now re-fetches
 * alongside the existing typing-status interval (same 4s cadence,
 * same POLLING-not-socket disclosure — no WebSocket infrastructure
 * exists in BERX), so a reply from the other side now actually
 * appears while the screen stays open, not only on next open/send.
 * Skipped while a send/edit/delete is in flight to avoid clobbering
 * that in-progress local state.
 *
 * MAX BUILD — real Message Attachments + presence. OssnMessages::send()
 * already uploads $_FILES['attachment'] server-side, read back and
 * exposed via conversations.php (previously wired to a real download
 * route, components/OssnMessages/ossn_com.php, with no JSON API
 * caller at all). with_online mirrors real OssnUser::isOnline(10).
 *
 * MAX BUILD — real GIF picker (OssnGiphy, a real server-side proxy to
 * api.giphy.com with an admin-configured key), previously wired only
 * to a session-cookie web action. A picked GIF is downloaded to a
 * real Blob client-side (fetch().blob()) and sent through the exact
 * same real attachment upload path as a picked photo — not a special
 * case, just a different file part.
 *
 * BERX WORLD — real spatial entrance for messages (master directive
 * §20: "New message: appear → move through depth → settle"), same
 * mechanism as GroupChatScreen's own (see its header): `seenIds` grows
 * monotonically, so a message already displayed once never replays
 * its entrance just because a later poll re-delivers the same list
 * (its own read-receipt flipping, say) — only a genuinely new message
 * id gets the BerxFadeIn treatment.
 */
import {Fragment, useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {FlatList, Text, View, Image, Pressable, Alert, StyleSheet, Linking} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxMessage, BerxGifResult} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {GifPickerModal} from '../../../../packages/design-system/src/components/GifPickerModal';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

interface Props {
	api: BerxApiClient;
	myGuid: number;
	otherGuid: number;
	otherUsername?: string;
	pickImage?: () => Promise<BerxFilePart | null>;
	/** BERX WORLD — real "share post to conversation" tap-through (see SharePostScreen.tsx / message.shared_post). */
	onOpenPost?: (guid: number) => void;
	/** BERX WORLD — tap-through on a shared story's byline (see message.shared_story). */
	onOpenProfile?: (username: string) => void;
	/**
	 * "Direct Message → Group creation" (master build directive §56):
	 * turns this 1:1 into a real group by seeding the new group's
	 * participant picker with the person you're already talking to —
	 * a real guid/username/fullname, not a re-search of someone you
	 * just had open.
	 */
	onCreateGroup?: (preselect: {guid: number; username: string; fullname: string}) => void;
	onBack: () => void;
}

export default function ConversationScreen({api, myGuid, otherGuid, otherUsername, pickImage, onOpenPost, onOpenProfile, onCreateGroup, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [messages, setMessages] = useState<BerxMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [draft, setDraft] = useState('');
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [pendingAttachment, setPendingAttachment] = useState<BerxFilePart | null>(null);
	const [pendingAttachmentLabel, setPendingAttachmentLabel] = useState<string | null>(null);
	const [withOnline, setWithOnline] = useState(false);
	const [gifPickerOpen, setGifPickerOpen] = useState(false);
	const [gifDownloading, setGifDownloading] = useState(false);
	const listRef = useRef<FlatList<BerxMessage>>(null);
	const [otherTyping, setOtherTyping] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [editingId, setEditingId] = useState<number | null>(null);
	// Ref mirrors of state the message-polling interval below needs to
	// read at call time (not at effect-creation time) — a plain
	// closure over these would poll a stale snapshot from mount.
	const sendingRef = useRef(sending);
	const deletingIdRef = useRef(deletingId);
	const editingIdRef = useRef(editingId);
	useEffect(() => { sendingRef.current = sending; }, [sending]);
	useEffect(() => { deletingIdRef.current = deletingId; }, [deletingId]);
	useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

	// Real spatial entrance for messages (master directive §20: "New
	// message: appear → move through depth → settle"), same real
	// mechanism as GroupChatScreen's own — see its header for why a
	// monotonically-growing seen-set (not a per-render flag) is what
	// makes this correct rather than decorative: a message already
	// marked seen never replays the animation just because a later poll
	// re-delivers the same list (e.g. its own read-receipt flipping).
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
			const res = await api.conversationWith(otherGuid);
			setMessages(res.messages);
			setWithOnline(res.with_online);
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
			// Real message refresh, same tick — skipped while a
			// send/edit/delete is in flight so a slow poll response can
			// never overwrite that in-progress local state.
			if (!sendingRef.current && deletingIdRef.current === null && editingIdRef.current === null) {
				try {
					const res = await api.conversationWith(otherGuid);
					if (active) {
						setMessages((prev: BerxMessage[]) => {
							const changed = prev.length !== res.messages.length || prev.some((m: BerxMessage, i: number) => {
								const n = res.messages[i];
								return !n || m.id !== n.id || m.viewed !== n.viewed || m.edited !== n.edited || m.text !== n.text;
							});
							return changed ? res.messages : prev;
						});
						setWithOnline(res.with_online);
						// A reply arriving while the thread is open is real,
						// unread-until-now — best-effort, mirrors the mount-time mark-as-read above.
						api.markConversationRead(otherGuid).catch(() => undefined);
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
	}, [api, otherGuid]);

	async function handlePickAttachment() {
		if (!pickImage) return;
		const picked = await pickImage();
		if (picked) {
			setPendingAttachment(picked);
			setPendingAttachmentLabel('name' in picked ? picked.name : 'вложение');
		}
	}

	/** Real download — the picker only ever hands back Giphy's own real gif_url; this fetches the actual bytes and feeds them through the same real attachment path a picked photo uses. */
	async function handleSelectGif(gif: BerxGifResult) {
		setGifPickerOpen(false);
		setGifDownloading(true);
		try {
			const res = await fetch(gif.gif_url);
			const blob = await res.blob();
			setPendingAttachment(blob);
			setPendingAttachmentLabel(`GIF ${gif.id}`);
		} catch {
			Alert.alert('Не удалось загрузить GIF', 'Попробуйте другой вариант.');
		} finally {
			setGifDownloading(false);
		}
	}

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

	function startEdit(item: BerxMessage) {
		setEditingId(item.id);
		setDraft(item.text);
		setSendError(null);
	}

	function cancelEdit() {
		setEditingId(null);
		setDraft('');
	}

	/** Real menu — Изменить only offered for the caller's own messages (server also re-checks: editMessage() is sender-only). */
	function handleLongPress(item: BerxMessage) {
		const options: Array<{text: string; style?: 'cancel' | 'destructive'; onPress?: () => void}> = [];
		if (item.from_guid === myGuid) {
			options.push({text: 'Изменить', onPress: () => startEdit(item)});
		}
		options.push({text: 'Удалить', style: 'destructive', onPress: () => handleDeleteMessage(item.id)});
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
				await api.editMessage(otherGuid, editingId, text);
				setEditingId(null);
			} else {
				await api.sendMessage(otherGuid, text, pendingAttachment ?? undefined);
				setPendingAttachment(null);
				setPendingAttachmentLabel(null);
				api.setTypingStatus(otherGuid, false).catch(() => undefined);
			}
			setDraft('');
			// Server-confirmed, not optimistic: re-fetch the real thread
			// rather than locally appending a guessed message object —
			// the API's send response is just {status:string}, it
			// doesn't echo back the created/edited message's real fields,
			// so there's nothing honest to construct locally.
			await load();
		} catch {
			setSendError(editingId !== null ? 'Не удалось изменить сообщение.' : 'Не удалось отправить. Возможно, вы заблокированы.');
		} finally {
			setSending(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={otherUsername ?? `Пользователь #${otherGuid}`} subtitle={withOnline ? 'в сети' : undefined} />
			{onCreateGroup ? (
				<Pressable
					style={styles.createGroupRow}
					onPress={() => onCreateGroup({guid: otherGuid, username: otherUsername ?? `#${otherGuid}`, fullname: ''})}>
					<Text style={styles.createGroupText}>+ Создать группу с {otherUsername ?? `#${otherGuid}`}</Text>
				</Pressable>
			) : null}

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
					renderItem={({item}: {item: BerxMessage}) => {
						// Real entrance — see this file's own header. A message
						// already marked seen renders bare (Fragment), so it never
						// replays the animation on a later re-render.
						const fresh = freshIds.has(item.id);
						const Wrap = fresh ? BerxFadeIn : Fragment;
						const wrapProps = fresh ? {riseFrom: 14, scaleFrom: 0.97} : {};
						return (
						<Wrap {...wrapProps}>
						<Pressable
							onLongPress={() => handleLongPress(item)}
							disabled={deletingId === item.id}
							style={[styles.bubble, item.from_guid === myGuid ? styles.bubbleMine : styles.bubbleTheirs, deletingId === item.id && styles.bubbleDeleting, editingId === item.id && styles.bubbleEditing]}>
							{item.attachment ? (
								item.attachment.type === 'image' ? (
									<Pressable onPress={() => Linking.openURL(item.attachment!.url)}>
										<Image source={{uri: item.attachment.url}} style={styles.attachmentImage} />
									</Pressable>
								) : (
									<Pressable style={styles.attachmentFile} onPress={() => Linking.openURL(item.attachment!.url)}>
									<View style={styles.attachmentFileRow}>
										<BerxIcon name="paperclip" size={14} color={colors.textDim} />
										<Text style={styles.attachmentFileLabel} numberOfLines={1}>{item.attachment.name}</Text>
									</View>
									</Pressable>
								)
							) : null}
							{item.shared_post ? (
								<Pressable style={styles.sharedPost} onPress={() => onOpenPost && onOpenPost(item.shared_post!.guid)}>
									<Text style={styles.sharedPostAuthor}>{item.shared_post.poster_username ?? 'BERX'}</Text>
									<Text style={styles.sharedPostText} numberOfLines={3}>{item.shared_post.text ?? '(без текста)'}</Text>
								</Pressable>
							) : null}
							{item.shared_story ? (
								<Pressable style={styles.sharedPost} onPress={() => item.shared_story!.owner_username && onOpenProfile && onOpenProfile(item.shared_story!.owner_username)}>
								<View style={styles.attachmentFileRow}>
										<BerxIcon name="image" size={13} color={colors.accent} />
										<Text style={styles.sharedPostAuthor}>История · {item.shared_story.owner_username ?? 'BERX'}</Text>
									</View>
									{item.shared_story.caption ? <Text style={styles.sharedPostText} numberOfLines={3}>{item.shared_story.caption}</Text> : null}
								</Pressable>
							) : null}
							<Text style={styles.bubbleText}>{item.text}</Text>
							<View style={styles.bubbleMetaRow}>
								<Text style={styles.bubbleTime}>
									{relativeTimeLabel(item.time)}
									{item.edited ? ' · изменено' : ''}
								</Text>
								{item.from_guid === myGuid ? (
									<Text style={[styles.readMark, item.viewed && styles.readMarkSeen]}>{item.viewed ? '✓✓' : '✓'}</Text>
								) : null}
							</View>
						</Pressable>
						</Wrap>
						);
					}}
				/>
			)}

			{otherTyping ? <Text style={styles.typingHint}>печатает…</Text> : null}

			{editingId !== null ? (
				<View style={styles.editingRow}>
					<Text style={styles.editingHint}>Редактирование сообщения</Text>
					<Pressable onPress={cancelEdit} hitSlop={8}>
						<Text style={styles.editingCancel}>Отмена</Text>
					</Pressable>
				</View>
			) : null}

			{gifDownloading ? (
				<View style={styles.pendingAttachmentRow}>
					<Text style={styles.pendingAttachmentLabel}>Загрузка GIF…</Text>
				</View>
			) : pendingAttachment ? (
				<View style={styles.pendingAttachmentRow}>
				<View style={styles.attachmentFileRow}>
						<BerxIcon name="paperclip" size={14} color={colors.textDim} />
						<Text style={styles.pendingAttachmentLabel} numberOfLines={1}>{pendingAttachmentLabel ?? 'вложение'}</Text>
					</View>
					<Pressable onPress={() => { setPendingAttachment(null); setPendingAttachmentLabel(null); }} hitSlop={8}>
						<Text style={styles.editingCancel}>Убрать</Text>
					</Pressable>
				</View>
			) : null}

			<View style={styles.composer}>
				{pickImage && editingId === null ? (
					<Pressable style={styles.attachButton} onPress={handlePickAttachment} hitSlop={8}>
					<BerxIcon name="paperclip" size={18} color={colors.textDim} />
					</Pressable>
				) : null}
				{editingId === null ? (
					<Pressable style={styles.attachButton} onPress={() => setGifPickerOpen(true)} hitSlop={8}>
						<Text style={styles.gifButtonLabel}>GIF</Text>
					</Pressable>
				) : null}
				<BerxInput
					style={styles.composerInput}
					placeholder="Сообщение..."
					value={draft}
					onChangeText={handleDraftChange}
					multiline
				/>
				<BerxButton label={editingId !== null ? 'Сохранить' : 'Отправить'} onPress={handleSend} loading={sending} disabled={!draft.trim()} />
			</View>
			{sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}

			<GifPickerModal
				visible={gifPickerOpen}
				onClose={() => setGifPickerOpen(false)}
				onSelect={handleSelectGif}
				search={(q) => api.giphySearch(q)}
				trending={() => api.giphyTrending()}
			/>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	createGroupRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs},
	createGroupText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
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
	bubbleEditing: {borderWidth: 2, borderColor: colors.accent},
	typingHint: {color: colors.textFaint, fontSize: typography.sizeXs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs},
	editingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xs},
	editingHint: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	editingCancel: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline'},
	bubbleText: {color: colors.text, fontSize: typography.sizeBase},
	bubbleMetaRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs},
	bubbleTime: {color: colors.textFaint, fontSize: typography.sizeXs},
	/** Real read receipt — single check = sent, double = the other side has actually opened the thread (OssnMessages::markViewed()), never a fake "delivered" guess. */
	readMark: {color: colors.textFaint, fontSize: typography.sizeXs},
	readMarkSeen: {color: colors.accent},
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
	attachmentImage: {width: 180, height: 180, borderRadius: radius.sm, marginBottom: spacing.xs},
	attachmentFile: {backgroundColor: colors.glass2, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs},
	attachmentFileRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
	attachmentFileLabel: {color: colors.text, fontSize: typography.sizeSm},
	sharedPost: {backgroundColor: colors.glass2, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs, gap: 2},
	sharedPostAuthor: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	sharedPostText: {color: colors.textDim, fontSize: typography.sizeSm},
	attachButton: {width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass2, borderWidth: 1, borderColor: colors.borderSoft},
	attachButtonLabel: {fontSize: typography.sizeBase},
	gifButtonLabel: {fontSize: typography.sizeXs, fontWeight: typography.weightBold, color: colors.accent},
	pendingAttachmentRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xs},
	pendingAttachmentLabel: {color: colors.textDim, fontSize: typography.sizeXs, flex: 1, marginRight: spacing.sm},
});
