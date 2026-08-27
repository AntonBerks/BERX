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
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPostDetail, BerxPostComment, BerxMediaAsset} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxMediaGrid} from '../../../../packages/design-system/src/components/BerxMediaGrid';
import {BerxMediaViewer} from '../../../../packages/design-system/src/components/BerxMediaViewer';

interface Props {
	api: BerxApiClient;
	postGuid: number;
	myGuid?: number;
	onOpenProfile: (username: string) => void;
	onReport: (targetType: 'post' | 'comment', targetGuid: number) => void;
	onBack: () => void;
}

export default function PostDetailScreen({api, postGuid, myGuid, onOpenProfile, onReport, onBack}: Props) {
	const [post, setPost] = useState<BerxPostDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [liking, setLiking] = useState(false);
	const [saving, setSaving] = useState(false);
	const [pinning, setPinning] = useState(false);
	const [commentText, setCommentText] = useState('');
	const [posting, setPosting] = useState(false);
	const [commentStatus, setCommentStatus] = useState<string | null>(null);
	const [comments, setComments] = useState<BerxPostComment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);
	const [media, setMedia] = useState<BerxMediaAsset[]>([]);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [viewerIndex, setViewerIndex] = useState(0);

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

	async function handleComment() {
		if (!commentText.trim()) return;
		setPosting(true);
		setCommentStatus(null);
		try {
			await api.commentOnPost(postGuid, commentText.trim());
			setCommentText('');
			await loadComments();
		} catch {
			setCommentStatus('Не удалось отправить комментарий');
		} finally {
			setPosting(false);
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
			<BerxHeader onBack={onBack} title={post.owner_username ?? undefined} />
			<View style={styles.container}>
				<Pressable onPress={() => post.owner_username && onOpenProfile(post.owner_username)} disabled={!post.owner_username}>
					<Text style={styles.author}>{post.owner_username ?? 'BERX'}</Text>
				</Pressable>
				<Text style={styles.text}>{post.text}</Text>
				<Text style={styles.time}>{relativeTimeLabel(post.time_created)}{post.like_count > 0 ? ` · ${post.like_count} нравится` : ''}</Text>

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
				</View>

				{/* Reporting your own post makes no sense — same real-target-only rule ReportScreen documents for dating/post/comment/user/group. */}
				{myGuid && post.owner_guid !== myGuid ? (
					<Pressable onPress={() => onReport('post', post.guid)} hitSlop={8}>
						<Text style={styles.reportLink}>Пожаловаться на пост</Text>
					</Pressable>
				) : null}

				<View style={styles.commentBox}>
					<BerxInput
						placeholder="Написать комментарий..."
						value={commentText}
						onChangeText={setCommentText}
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
						comments.map((c) => (
							<View key={c.id} style={styles.commentRow}>
								{c.author ? (
									<Pressable onPress={() => onOpenProfile(c.author!.username)}>
										<Image source={{uri: c.author.icon}} style={styles.commentAvatar} />
									</Pressable>
								) : (
									<View style={styles.commentAvatar} />
								)}
								<View style={styles.commentBody}>
									<Text style={styles.commentAuthor}>{c.author?.fullname ?? 'Пользователь'}</Text>
									<Text style={styles.commentText}>{c.text}</Text>
									<Text style={styles.commentTime}>{relativeTimeLabel(c.time)}</Text>
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

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	container: {flex: 1, padding: spacing.lg, gap: spacing.md},
	author: {color: colors.accent, fontWeight: typography.weightMedium, fontSize: typography.sizeLg},
	text: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	mediaWrap: {borderRadius: radius.md, overflow: 'hidden'},
	mediaHint: {fontSize: typography.sizeXs, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xs},
	actions: {flexDirection: 'row', gap: spacing.sm},
	time: {color: colors.textFaint, fontSize: typography.sizeXs},
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
	commentDelete: {color: colors.textFaint, fontSize: typography.sizeSm, padding: 4},
});
