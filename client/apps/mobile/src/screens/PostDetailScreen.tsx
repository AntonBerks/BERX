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
import {View, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPostDetail, BerxPostComment, BerxMediaAsset} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxComposer} from '../../../../packages/design-system/src/spatial/BerxComposer';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxMediaGrid} from '../../../../packages/design-system/src/components/BerxMediaGrid';
import {BerxMediaViewer} from '../../../../packages/design-system/src/components/BerxMediaViewer';
import {BerxReactionPicker} from '../../../../packages/design-system/src/spatial/BerxReactionPicker';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxMediaWell} from '../../../../packages/design-system/src/spatial/BerxMediaWell';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

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

	/* The composer owns the field, the send state and the error, and
	   clears the text only once this resolves — so a failed comment
	   keeps what was written instead of losing it to an optimistic
	   reset. Rejecting is how it is told the send failed. */
	async function handleComment(text: string) {
		await api.commentOnPost(postGuid, text);
		await loadComments();
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
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.container}>
					<BerxSpatialCard depth="D3" padding={spacing.lg}>
						<BerxIdentity
							userGuid={post.owner_guid}
							name={post.owner_username ?? 'BERX'}
							subtitle={relativeTimeLabel(post.time_created)}
							onPress={post.owner_username ? () => onOpenProfile(post.owner_username as string) : undefined}
						/>
						<BerxText role="body">{post.text}</BerxText>
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
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Пожаловаться на пост"
							onPress={() => onReport('post', post.guid)}
							hitSlop={8}>
							<BerxText role="meta" emphasis="tertiary" style={styles.reportLink}>Пожаловаться на пост</BerxText>
						</Pressable>
					) : null}

					{/* D4 — the archive's own composer, not a grey box with a
					    button in it: writing a comment holds the scene's
					    focus, so the post steps back while you answer it and
					    comes forward again when you leave the field. */}
					<View style={styles.commentBox}>
						<BerxComposer
							onSend={handleComment}
							placeholder="Написать комментарий..."
							accessibilityLabel="Текст комментария"
							testID="post-comment"
						/>
					</View>

					<View style={styles.commentsList}>
						{commentsLoading ? (
							<BerxText role="meta" emphasis="secondary">Загрузка комментариев...</BerxText>
						) : comments.length === 0 ? (
							<BerxText role="meta" emphasis="secondary">Комментариев пока нет.</BerxText>
						) : (
							comments.map((c) => (
								/* D3 — what someone said is an object standing in the
								   room, not a paragraph between two hairlines */
								<BerxSpatialCard key={c.id} depth="D3" padding={spacing.md} radius={16}>
								<View style={styles.commentRow}>
									{c.author ? (
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={`Профиль ${c.author.fullname || c.author.username}`}
											onPress={() => onOpenProfile(c.author!.username)}>
											<Image source={{uri: c.author.icon}} style={styles.commentAvatar} />
										</Pressable>
									) : (
										<BerxMediaWell radius={radius.pill} style={styles.commentAvatar} />
									)}
									<View style={styles.commentBody}>
										<BerxText role="label">{c.author?.fullname ?? 'Пользователь'}</BerxText>
										<BerxText role="meta" emphasis="secondary">{c.text}</BerxText>
										<BerxText role="meta" emphasis="tertiary">{relativeTimeLabel(c.time)}</BerxText>
									</View>
									{myGuid && c.author?.guid === myGuid ? (
										<Pressable
											accessibilityRole="button"
											accessibilityLabel="Удалить комментарий"
											onPress={() => handleDeleteComment(c.id)}
											hitSlop={8}>
											<BerxIcon name="close" size={14} decorative />
										</Pressable>
									) : myGuid && c.author?.guid !== myGuid ? (
										<Pressable
											accessibilityRole="button"
											accessibilityLabel="Пожаловаться на комментарий"
											onPress={() => onReport('comment', c.id)}
											hitSlop={8}>
											<BerxIcon name="warning" size={14} decorative />
										</Pressable>
									) : null}
								</View>
								{/* the photograph the server returns on the comment
								    itself — real media BERX was fetching and never
								    drawing, so a comment that was a picture showed
								    up as its caption or as nothing at all */}
								{c.photo_url ? (
									<Image
										source={{uri: c.photo_url}}
										style={styles.commentPhoto}
										resizeMode="cover"
										accessibilityRole="image"
										accessibilityLabel={`Фото в комментарии от ${c.author?.fullname ?? 'пользователя'}`}
									/>
								) : null}
								</BerxSpatialCard>
							))
						)}
					</View>
				</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	container: {flex: 1, padding: spacing.lg, gap: spacing.md},
	author: {color: colors.accent, fontWeight: typography.weightMedium, fontSize: typography.sizeLg},
	mediaWrap: {borderRadius: radius.md, overflow: 'hidden'},
	time: {color: colors.textFaint, fontSize: typography.sizeXs},
	commentBox: {marginTop: spacing.lg},
	reportLink: {textDecorationLine: 'underline'},
	commentsList: {marginTop: spacing.md, gap: spacing.sm},
	commentRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm},
	/* the photo runs the width of the comment it belongs to, inside
	   the object's own radius */
	commentPhoto: {width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginTop: spacing.sm},
	commentAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.glass2},
	commentBody: {flex: 1, gap: 2},
	commentDelete: {padding: 4},
});
