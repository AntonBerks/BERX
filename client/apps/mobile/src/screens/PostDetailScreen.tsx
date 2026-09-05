/**
 * Post detail — a moment, opened. A HOME-family scene.
 *
 * This screen is not one of the 300: the archive names 29 screens and
 * leaves the rest as numbered contracts with no product logic, and
 * inventing one for post detail would be inventing product logic. It
 * borrows the HOME family's spatial definition through
 * <BerxFamilyScene> and keeps its own naming, and it is not counted
 * as contract coverage anywhere.
 *
 * The like count here is real, unlike on the feed: GET /posts/{id}
 * returns like_count (feed.php deliberately omits it to avoid an N+1
 * per item). After a like the post is re-read, so the number shown is
 * the server's, never a local increment.
 *
 * The API still does not tell the client whether the viewer has
 * already liked a post, so "liked" is only what happened in this
 * session — and the control disables itself afterwards rather than
 * offering an unlike the endpoint may not perform.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
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
import {BerxReactionPicker} from '../../../../packages/design-system/src/spatial/BerxReactionPicker';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface PostDetailScreenProps {
	api: BerxApiClient;
	postGuid: number;
	myGuid?: number;
	onOpenProfile: (username: string) => void;
	onReport: (targetType: 'post' | 'comment', targetGuid: number) => void;
	onBack: () => void;
}

export default function PostDetailScreen(props: PostDetailScreenProps) {
	/**
	 * A post's own first image becomes the scene's atmosphere.
	 *
	 * Media is BERX's primary visual element and the glass supports it
	 * (BERX_DECISIONS.md), so on a post that has media the whole scene
	 * sits inside it — dimmed, parallaxed behind the content, scrimmed
	 * hard enough that reading never depends on the picture. A text
	 * post gets no atmosphere rather than a decorative stand-in.
	 */
	const [atmosphere, setAtmosphere] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		props.api
			.mediaByContext('post', props.postGuid)
			.then((res) => {
				const first = res.media.find((m) => m.media_type === 'image');
				if (!cancelled) setAtmosphere(first?.url ?? null);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [props.api, props.postGuid]);

	return (
		<BerxFamilyScene
			family="HOME"
			atmosphere={atmosphere ? {uri: atmosphere} : undefined}
			testID="post-detail">
			<PostDetailSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function PostDetailSceneBody({api, postGuid, myGuid, onOpenProfile, onReport, onBack}: PostDetailScreenProps) {
	const [post, setPost] = useState<BerxPostDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [liking, setLiking] = useState(false);
	const [liked, setLiked] = useState(false);
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

	useEffect(() => {
		load();
		loadComments();
		loadMedia();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postGuid]);

	async function handleLike() {
		setLiking(true);
		try {
			await api.likePost(postGuid);
			/**
			 * The like response is just {status}, with no count — but
			 * GET /posts/{id} does return like_count, so the real number
			 * comes from re-reading the post rather than from a local
			 * increment that could drift from the server.
			 */
			const fresh = await api.getPost(postGuid);
			setPost(fresh);
			setLiked(true);
		} catch {
			/* nothing optimistic: the count stays where the server left it */
		} finally {
			setLiking(false);
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
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxLoadingState label="Загрузка поста..." />
			</View>
		);
	}
	if (error || !post) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxErrorState message={error ?? 'Пост не найден'} onRetry={load} />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={post.owner_username ?? undefined} />
			<View style={styles.container}>
				<BerxSpatialCard depth="D3" padding={spacing.lg}>
					<BerxIdentity
						userGuid={post.owner_guid}
						name={post.owner_username ?? 'BERX'}
						subtitle={relativeTimeLabel(post.time_created)}
						onPress={post.owner_username ? () => onOpenProfile(post.owner_username as string) : undefined}
					/>
					<Text style={styles.text}>{post.text}</Text>
				</BerxSpatialCard>

				{media.length > 0 ? (
					<View style={styles.mediaWrap}>
						<BerxMediaGrid
							items={media.map((m) => ({guid: m.guid, url: m.url, media_type: m.media_type}))}
							columns={media.length === 1 ? 1 : 3}
							onPress={(_, idx) => { setViewerIndex(idx); setViewerOpen(true); }}
						/>
					</View>
				) : null}

				<BerxMediaViewer assets={media} initialIndex={viewerIndex} visible={viewerOpen} onClose={() => setViewerOpen(false)} />

				<BerxReactionPicker
					liked={liked}
					/* the server's own count, re-read after every like */
					count={post.like_count}
					onToggle={handleLike}
					disabled={liked || liking}
					disabledReason={
						liked
							? 'Отметка «нравится» уже сохранена. Снять её через API пока нельзя.'
							: undefined
					}
					testID="post-like"
				/>

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
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	container: {flex: 1, padding: spacing.lg, gap: spacing.md},
	author: {color: colors.accent, fontWeight: typography.weightMedium, fontSize: typography.sizeLg},
	text: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	mediaWrap: {borderRadius: radius.md, overflow: 'hidden'},
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
