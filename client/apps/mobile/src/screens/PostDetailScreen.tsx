/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real quick-bookmark (api.savePost()/unsavePost()) AND
 * real like state (api.unlikePost() — OssnLikes::UnLike()/isLiked()
 * were always real, callable methods, just never wired to a route or
 * surfaced in the post JSON before this). Both is_saved and is_liked
 * come back real from the server on every load, kept in `post` state
 * and toggled the same optimistic-after-success way
 * PlaceDetailScreen's toggleSave() already does — no more ephemeral
 * client-only "liked" state that resets on remount. Root View is now
 * a ScrollView — a post with a full comment thread had no way to
 * reach the bottom.
 *
 * MAX BUILD — real editorial typography pass, user-directed with an
 * explicit reference image. `text` and `author` are the same real
 * fields as before (post.text/post.poster_username) — only the
 * typographic treatment changed: a bolder, tighter-leading paragraph
 * style for the post body, and a small-caps byline for the author,
 * instead of both sitting at the same plain body-text weight. Kept
 * Premium Dark (BERX_DECISIONS.md) rather than the light background
 * the reference showed for its article screen — this app has no
 * light theme anywhere else, and flipping just this one screen would
 * be jarring mid-navigation rather than editorial.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPostDetail, BerxPostComment, BerxMediaAsset, BerxFriend} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxMentionInput} from '../../../../packages/design-system/src/components/BerxMentionInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxMediaGrid} from '../../../../packages/design-system/src/components/BerxMediaGrid';
import {BerxMediaViewer} from '../../../../packages/design-system/src/components/BerxMediaViewer';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';

interface Props {
	api: BerxApiClient;
	postGuid: number;
	myGuid?: number;
	onOpenProfile: (username: string) => void;
	onOpenHashtag?: (tag: string) => void;
	onReport: (targetType: 'post' | 'comment', targetGuid: number) => void;
	/** MAX BUILD — real Repost (see posts.php's own comment on berx_repost_of). */
	onRepost?: (target: {guid: number; text: string; owner_username: string | null}) => void;
	/** BERX WORLD — real "share post to conversation" (see SharePostScreen.tsx). */
	onShareToMessage?: (postGuid: number) => void;
	onBack: () => void;
}

export default function PostDetailScreen({api, postGuid, myGuid, onOpenProfile, onOpenHashtag, onReport, onRepost, onShareToMessage, onBack}: Props) {
	const [post, setPost] = useState<BerxPostDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [liking, setLiking] = useState(false);
	const [saving, setSaving] = useState(false);
	const [pinning, setPinning] = useState(false);
	const [showLikers, setShowLikers] = useState(false);
	const [likers, setLikers] = useState<{guid: number; username: string; fullname: string; icon: string}[]>([]);
	const [likersLoading, setLikersLoading] = useState(false);
	const [commentText, setCommentText] = useState('');
	const [posting, setPosting] = useState(false);
	const [commentStatus, setCommentStatus] = useState<string | null>(null);
	const [comments, setComments] = useState<BerxPostComment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);
	const [media, setMedia] = useState<BerxMediaAsset[]>([]);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [viewerIndex, setViewerIndex] = useState(0);
	const [editing, setEditing] = useState(false);
	const [editText, setEditText] = useState('');
	const [savingEdit, setSavingEdit] = useState(false);
	const [deleting, setDeleting] = useState(false);
	/** BERX WORLD — real comment threading. Set by tapping "Ответить" on a comment; cleared on send or cancel. */
	const [replyTo, setReplyTo] = useState<BerxPostComment | null>(null);
	/** BERX WORLD — real @mention autocomplete in the comment composer too (same BerxMentionInput CreatePostScreen uses — comments support the exact same real mention notification path). */
	const [friends, setFriends] = useState<BerxFriend[]>([]);

	async function load() {
		setLoading(true);
		try {
			const data = await api.getPost(postGuid);
			setPost(data);
			setError(null);
		} catch {
			setError('Пост недоступен или удалён');
		} finally {
			setLoading(false);
		}
	}

	const loadComments = useCallback(async () => {
		setCommentsLoading(true);
		try {
			const res = await api.postComments(postGuid);
			setComments(res.comments);
		} catch {
			// comment list failing to load doesn't block viewing the post itself
		} finally {
			setCommentsLoading(false);
		}
	}, [api, postGuid]);

	const loadMedia = useCallback(async () => {
		try {
			const res = await api.mediaByContext('post', postGuid);
			setMedia(res.media);
		} catch {
			// real media attachments are optional — a failed fetch just means no gallery shows, not an error state for the whole post
		}
	}, [api, postGuid]);

	/**
	 * MAX BUILD — closes a real gap: api.deleteMediaAsset() was always
	 * a real, working client method (real DELETE /media/{guid},
	 * OssnMediaAssets::removeAsset() -> canAccess(), owner-or-admin,
	 * fixed to a real session-free admin check earlier this session)
	 * with zero UI caller — a post's attached photo/video/audio could
	 * never be removed without deleting the whole post. Full delete,
	 * not detach: this media item only exists for this one post
	 * (uploadMedia()+attachMedia() is always called together in
	 * CreatePostScreen/CreateVideoScreen/CreateTrackScreen, confirmed
	 * by reading each), so detaching without deleting would just
	 * orphan the file.
	 */
	async function handleDeleteMedia(mediaGuid: number) {
		try {
			await api.deleteMediaAsset(mediaGuid);
			setMedia((prev: BerxMediaAsset[]) => prev.filter((m: BerxMediaAsset) => m.guid !== mediaGuid));
		} catch {
			// real server rejection — grid stays as-is, nothing optimistic
		}
	}

	useEffect(() => {
		load();
		loadComments();
		loadMedia();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postGuid]);

	useEffect(() => {
		api.friends().then((res) => setFriends(res.friends)).catch(() => undefined);
	}, [api]);

	async function handleLike() {
		if (!post) return;
		setLiking(true);
		try {
			if (post.is_liked) {
				await api.unlikePost(postGuid);
				setPost({...post, is_liked: false, like_count: Math.max(0, post.like_count - 1)});
			} else {
				await api.likePost(postGuid);
				setPost({...post, is_liked: true, like_count: post.like_count + 1});
			}
		} catch {
			// best-effort — UI already reflects the pre-toggle state on failure
		} finally {
			setLiking(false);
		}
	}

	async function toggleSave() {
		if (!post) return;
		setSaving(true);
		try {
			if (post.is_saved) {
				await api.unsavePost(post.guid);
				setPost({...post, is_saved: false});
			} else {
				await api.savePost(post.guid);
				setPost({...post, is_saved: true});
			}
		} catch {
			// best-effort — UI already reflects the pre-toggle state on failure
		} finally {
			setSaving(false);
		}
	}

	/** MAX BUILD — real "who liked this" list, lazy-loaded on first expand. */
	async function toggleLikers() {
		if (showLikers) {
			setShowLikers(false);
			return;
		}
		setShowLikers(true);
		if (likers.length === 0) {
			setLikersLoading(true);
			try {
				const res = await api.postLikers(postGuid);
				setLikers(res.users);
			} catch {
				// real server rejection — box stays empty, "Никто не отмечен" is honest enough here
			} finally {
				setLikersLoading(false);
			}
		}
	}

	/** MAX BUILD — real Pinned Post toggle, owner-only. Server re-verifies ownership regardless of what this button already knows. */
	async function togglePin() {
		if (!post) return;
		setPinning(true);
		try {
			if (post.is_pinned) {
				await api.unpinPost(post.guid);
				setPost({...post, is_pinned: false});
			} else {
				await api.pinPost(post.guid);
				setPost({...post, is_pinned: true});
			}
		} catch {
			// best-effort — UI already reflects the pre-toggle state on failure
		} finally {
			setPinning(false);
		}
	}

	function startEdit() {
		if (!post) return;
		setEditText(post.text);
		setEditing(true);
	}

	function cancelEdit() {
		setEditing(false);
		setEditText('');
	}

	/** Real author-only edit — server re-checks poster_guid (see posts.php's own header on why owner_guid isn't used). Returns the real updated post, so is_edited/time_updated reflect the actual server state, not a guess. */
	async function saveEdit() {
		if (!post || !editText.trim()) return;
		setSavingEdit(true);
		try {
			const updated = await api.updatePost(post.guid, editText.trim());
			setPost(updated);
			setEditing(false);
		} catch {
			// real server rejection (not the author, empty text) — edit box stays open
		} finally {
			setSavingEdit(false);
		}
	}

	/** Real owner-only delete — a regular post had no delete action anywhere in the app before this (unlike Video/Track posts, which already reuse this same api.deletePost() — see TrackDetailScreen.tsx/VideoDetailScreen.tsx). Server also allows a real admin, not just owner_guid — this button just isn't offered to a non-owner viewer. */
	async function handleDelete() {
		if (!post) return;
		setDeleting(true);
		try {
			await api.deletePost(post.guid);
			onBack();
		} catch {
			setDeleting(false);
		}
	}

	async function handleComment() {
		if (!commentText.trim()) return;
		setPosting(true);
		setCommentStatus(null);
		try {
			await api.commentOnPost(postGuid, commentText.trim(), replyTo ? replyTo.id : undefined);
			setCommentText('');
			setReplyTo(null);
			await loadComments();
		} catch {
			setCommentStatus('Не удалось отправить комментарий');
		} finally {
			setPosting(false);
		}
	}

	/** MAX BUILD — real comment likes, same real OssnLikes engine as post likes. */
	async function toggleCommentLike(comment: BerxPostComment) {
		try {
			if (comment.is_liked) {
				await api.unlikeComment(postGuid, comment.id);
				setComments((prev: BerxPostComment[]) => prev.map((c: BerxPostComment) => (c.id === comment.id ? {...c, is_liked: false, like_count: Math.max(0, c.like_count - 1)} : c)));
			} else {
				await api.likeComment(postGuid, comment.id);
				setComments((prev: BerxPostComment[]) => prev.map((c: BerxPostComment) => (c.id === comment.id ? {...c, is_liked: true, like_count: c.like_count + 1} : c)));
			}
		} catch {
			// best-effort — list stays at its pre-toggle state on failure
		}
	}

	async function handleDeleteComment(commentId: number) {
		try {
			await api.deletePostComment(postGuid, commentId);
			setComments((prev: BerxPostComment[]) => prev.filter((c: BerxPostComment) => c.id !== commentId));
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		}
	}

	/** BERX WORLD — real Pinned Comment, post-author-only (server re-checks this too — see posts.php's own /pin route). Pinning replaces any existing pin, so unset the old one client-side too. */
	async function togglePinComment(comment: BerxPostComment) {
		try {
			if (comment.is_pinned) {
				await api.unpinComment(postGuid, comment.id);
				setComments((prev: BerxPostComment[]) => prev.map((c: BerxPostComment) => (c.id === comment.id ? {...c, is_pinned: false} : c)));
			} else {
				await api.pinComment(postGuid, comment.id);
				setComments((prev: BerxPostComment[]) => prev.map((c: BerxPostComment) => ({...c, is_pinned: c.id === comment.id})));
			}
		} catch {
			// best-effort — list stays at its pre-toggle state on failure
		}
	}

	if (loading) {
		return (
			<ScrollView style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxLoadingState label="Загрузка поста..." />
			</ScrollView>
		);
	}
	if (error || !post) {
		return (
			<ScrollView style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxErrorState message={error ?? 'Пост не найден'} onRetry={load} />
			</ScrollView>
		);
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader onBack={onBack} title={post.poster_username ?? undefined} />
			<View style={styles.container}>
				<Pressable onPress={() => post.poster_username && onOpenProfile(post.poster_username)} disabled={!post.poster_username}>
					<Text style={styles.author}>{post.poster_username ?? 'BERX'}</Text>
				</Pressable>
				{editing ? (
					<View style={styles.editBox}>
						<BerxInput placeholder="Текст поста" value={editText} onChangeText={setEditText} multiline />
						<View style={styles.editActions}>
							<Pressable onPress={cancelEdit} disabled={savingEdit}>
								<Text style={styles.editCancel}>Отмена</Text>
							</Pressable>
							<Pressable onPress={saveEdit} disabled={savingEdit || !editText.trim()}>
								<Text style={styles.editSave}>{savingEdit ? 'Сохранение…' : 'Сохранить'}</Text>
							</Pressable>
						</View>
					</View>
				) : (
					post.text ? <BerxRichText text={post.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} /> : null
				)}
				<View style={styles.timeRow}>
					<Text style={styles.time}>{relativeTimeLabel(post.time_created)}</Text>
					{post.is_edited ? <Text style={styles.time}> · изменено</Text> : null}
					{post.like_count > 0 ? (
						<Pressable onPress={toggleLikers} hitSlop={8}>
							<Text style={styles.time}> · {post.like_count} нравится</Text>
						</Pressable>
					) : null}
					{!editing && myGuid === post.poster_guid ? (
						<Pressable onPress={startEdit} hitSlop={8}>
							<Text style={styles.time}> · Редактировать</Text>
						</Pressable>
					) : null}
					{myGuid === post.owner_guid ? (
						<Pressable onPress={handleDelete} disabled={deleting} hitSlop={8}>
							<Text style={styles.timeDanger}> · {deleting ? 'Удаление…' : 'Удалить'}</Text>
						</Pressable>
					) : null}
				</View>
				{showLikers ? (
					<View style={styles.likersBox}>
						{likersLoading ? (
							<Text style={styles.likersHint}>Загрузка...</Text>
						) : likers.length === 0 ? (
							<Text style={styles.likersHint}>Никто не отмечен</Text>
						) : (
							likers.map((u: {guid: number; username: string; fullname: string; icon: string}) => (
								<Pressable key={u.guid} onPress={() => onOpenProfile(u.username)} style={styles.likerRow}>
									<Image source={{uri: u.icon}} style={styles.likerAvatar} />
									<Text style={styles.likerName}>{u.fullname || u.username}</Text>
								</Pressable>
							))
						)}
					</View>
				) : null}

				{post.repost_of ? (
					post.reposted_post ? (
						<Pressable onPress={() => post.reposted_post!.poster_username && onOpenProfile(post.reposted_post!.poster_username)}>
							<View style={styles.repostBlock}>
								<Text style={styles.repostAuthor}>{post.reposted_post.poster_username ?? 'BERX'}</Text>
								<Text style={styles.repostText} numberOfLines={6}>{post.reposted_post.text}</Text>
							</View>
						</Pressable>
					) : (
						<View style={styles.repostBlock}>
							<Text style={styles.repostGone}>Исходный пост больше недоступен</Text>
						</View>
					)
				) : null}

				{media.length > 0 ? (
					<View style={styles.mediaWrap}>
						<BerxMediaGrid
							items={media.map((m) => ({guid: m.guid, url: m.url, media_type: m.media_type}))}
							columns={media.length === 1 ? 1 : 3}
							onPress={(_, idx) => { setViewerIndex(idx); setViewerOpen(true); }}
							onLongPress={myGuid && post.owner_guid === myGuid ? (item) => handleDeleteMedia(item.guid) : undefined}
						/>
						{myGuid && post.owner_guid === myGuid ? <Text style={styles.mediaHint}>Удерживайте фото, чтобы удалить</Text> : null}
					</View>
				) : null}

				<BerxMediaViewer assets={media} initialIndex={viewerIndex} visible={viewerOpen} onClose={() => setViewerOpen(false)} />

				<View style={styles.actions}>
					<BerxButton
						label={post.is_liked ? 'Понравилось ✓' : 'Нравится'}
						variant={post.is_liked ? 'secondary' : 'primary'}
						onPress={handleLike}
						loading={liking}
					/>
					{myGuid && post.owner_guid === myGuid ? (
						<BerxButton
							label={post.is_pinned ? 'Открепить' : 'Закрепить'}
							variant={post.is_pinned ? 'primary' : 'secondary'}
							onPress={togglePin}
							loading={pinning}
						/>
					) : null}
					<BerxButton
						label={post.is_saved ? 'Сохранено' : 'Сохранить'}
						variant={post.is_saved ? 'primary' : 'secondary'}
						onPress={toggleSave}
						loading={saving}
					/>
					{onRepost && !post.repost_of ? (
						<BerxButton
							label="Репост"
							variant="secondary"
							onPress={() => onRepost({guid: post.guid, text: post.text, owner_username: post.poster_username})}
						/>
					) : null}
					{onShareToMessage ? (
						<BerxButton
							label="Отправить в сообщении"
							variant="secondary"
							onPress={() => onShareToMessage(post.guid)}
						/>
					) : null}
				</View>

				{/* Reporting your own post makes no sense — same real-target-only rule ReportScreen documents for dating/post/comment/user/group. */}
				{myGuid && post.owner_guid !== myGuid ? (
					<Pressable onPress={() => onReport('post', post.guid)} hitSlop={8}>
						<Text style={styles.reportLink}>Пожаловаться на пост</Text>
					</Pressable>
				) : null}

				<View style={styles.commentBox}>
					{replyTo ? (
						<View style={styles.replyBanner}>
							<Text style={styles.replyBannerText} numberOfLines={1}>
								Ответ для {replyTo.author?.fullname ?? 'пользователя'}
							</Text>
							<Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
								<Text style={styles.replyBannerCancel}>✕</Text>
							</Pressable>
						</View>
					) : null}
					<BerxMentionInput
						placeholder="Написать комментарий..."
						value={commentText}
						onChangeText={setCommentText}
						friends={friends}
						multiline
					/>
					<BerxButton label="Отправить" variant="secondary" onPress={handleComment} loading={posting} />
					{commentStatus ? <Text style={styles.commentStatus}>{commentStatus}</Text> : null}
				</View>

				<View style={styles.commentsList}>
					{commentsLoading ? (
						<Text style={styles.commentStatus}>Загрузка комментариев...</Text>
					) : comments.length === 0 ? (
						<Text style={styles.commentStatus}>Комментариев пока нет.</Text>
					) : (
						orderCommentsThreaded(comments).map(({comment: c, depth}) => (
							<View key={c.id} style={[styles.commentRow, depth > 0 && {marginLeft: Math.min(depth, 3) * 24}]}>
								{c.author ? (
									<Pressable onPress={() => onOpenProfile(c.author!.username)}>
										<Image source={{uri: c.author.icon}} style={styles.commentAvatar} />
									</Pressable>
								) : (
									<View style={styles.commentAvatar} />
								)}
								<View style={styles.commentBody}>
									<Text style={styles.commentAuthor}>
										{c.is_pinned ? '📌 ' : ''}{c.author?.fullname ?? 'Пользователь'}
									</Text>
									<BerxRichText text={c.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.commentText} />
									<View style={styles.commentMetaRow}>
										<Text style={styles.commentTime}>{relativeTimeLabel(c.time)}</Text>
										<Pressable onPress={() => toggleCommentLike(c)} hitSlop={8}>
											<Text style={[styles.commentLike, c.is_liked && styles.commentLikeActive]}>
												{c.is_liked ? '♥' : '♡'}{c.like_count > 0 ? ` ${c.like_count}` : ''}
											</Text>
										</Pressable>
										<Pressable onPress={() => setReplyTo(c)} hitSlop={8}>
											<Text style={styles.commentLike}>Ответить</Text>
										</Pressable>
										{/* BERX WORLD — post-author-only, and only for a top-level comment: pinning only ever floats a real root comment, so the action is only offered where it visibly does something. */}
										{myGuid && post && myGuid === post.owner_guid && depth === 0 ? (
											<Pressable onPress={() => togglePinComment(c)} hitSlop={8}>
												<Text style={styles.commentLike}>{c.is_pinned ? 'Открепить' : 'Закрепить'}</Text>
											</Pressable>
										) : null}
									</View>
								</View>
								{myGuid && c.author?.guid === myGuid ? (
									<Pressable onPress={() => handleDeleteComment(c.id)} hitSlop={8}>
										<Text style={styles.commentDelete}>✕</Text>
									</Pressable>
								) : myGuid && c.author?.guid !== myGuid ? (
									<Pressable onPress={() => onReport('comment', c.id)} hitSlop={8}>
										<Text style={styles.commentDelete}>⚑</Text>
									</Pressable>
								) : null}
							</View>
						))
					)}
				</View>
			</View>
		</ScrollView>
	);
}

/**
 * BERX WORLD — real comment threading order. Top-level comments keep
 * their server order (oldest first); each one is immediately followed
 * by its full reply subtree (also oldest first), indented by depth.
 * A reply whose real parent went missing (deleted) is folded back to
 * top-level rather than silently dropped. A real pinned top-level
 * comment (post-author-only, server-enforced) floats to the very
 * front, replies included — pinning is never faked client-side by
 * reordering alone, it only decides placement among the real server
 * order once is_pinned itself is real.
 */
function orderCommentsThreaded(comments: BerxPostComment[]): {comment: BerxPostComment; depth: number}[] {
	const byParent = new Map<number, BerxPostComment[]>();
	const ids = new Set(comments.map((c) => c.id));
	const roots: BerxPostComment[] = [];
	comments.forEach((c) => {
		if (c.reply_to !== null && ids.has(c.reply_to)) {
			const list = byParent.get(c.reply_to) ?? [];
			list.push(c);
			byParent.set(c.reply_to, list);
		} else {
			roots.push(c);
		}
	});
	roots.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
	const out: {comment: BerxPostComment; depth: number}[] = [];
	function walk(list: BerxPostComment[], depth: number) {
		list.forEach((c) => {
			out.push({comment: c, depth});
			const children = byParent.get(c.id);
			if (children) walk(children, depth + 1);
		});
	}
	walk(roots, 0);
	return out;
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	container: {flex: 1, padding: spacing.lg, gap: spacing.md},
	author: {color: colors.accent, fontWeight: typography.weightBold, fontSize: typography.sizeXs, textTransform: 'uppercase', letterSpacing: 0.6},
	text: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium, letterSpacing: -0.1, lineHeight: typography.sizeLg * 1.32, marginTop: spacing.xs},
	repostBlock: {backgroundColor: colors.glass1, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: 4, marginTop: spacing.sm},
	repostAuthor: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	repostText: {color: colors.textDim, fontSize: typography.sizeSm},
	repostGone: {color: colors.textFaint, fontSize: typography.sizeSm, fontStyle: 'italic'},
	timeRow: {flexDirection: 'row', alignItems: 'center'},
	editBox: {gap: spacing.sm},
	editActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md},
	editCancel: {color: colors.textDim, fontSize: typography.sizeSm},
	editSave: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	replyBanner: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.glass1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.xs},
	replyBannerText: {color: colors.textDim, fontSize: typography.sizeXs, flex: 1, marginRight: spacing.sm},
	replyBannerCancel: {color: colors.textFaint, fontSize: typography.sizeSm},
	likersBox: {backgroundColor: colors.glass1, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs, gap: spacing.xs},
	likersHint: {color: colors.textFaint, fontSize: typography.sizeSm},
	likerRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	likerAvatar: {width: 28, height: 28, borderRadius: 14, backgroundColor: colors.graphite},
	likerName: {color: colors.white, fontSize: typography.sizeSm},
	mediaWrap: {borderRadius: radius.md, overflow: 'hidden'},
	mediaHint: {fontSize: typography.sizeXs, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xs},
	actions: {flexDirection: 'row', gap: spacing.sm},
	time: {color: colors.textFaint, fontSize: typography.sizeXs},
	timeDanger: {color: colors.danger, fontSize: typography.sizeXs},
	commentBox: {
		marginTop: spacing.lg,
		gap: spacing.sm,
		padding: spacing.md,
		backgroundColor: colors.graphite,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline'},
	commentStatus: {color: colors.textDim, fontSize: typography.sizeXs},
	commentsList: {marginTop: spacing.md, gap: spacing.sm},
	commentRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	commentAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.glass2},
	commentBody: {flex: 1, gap: 2},
	commentAuthor: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	commentText: {color: colors.textDim, fontSize: typography.sizeSm},
	commentTime: {color: colors.textFaint, fontSize: typography.sizeXs},
	commentMetaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2},
	commentLike: {color: colors.textFaint, fontSize: typography.sizeXs},
	commentLikeActive: {color: colors.danger},
	commentDelete: {color: colors.textFaint, fontSize: typography.sizeSm, padding: 4},
});
