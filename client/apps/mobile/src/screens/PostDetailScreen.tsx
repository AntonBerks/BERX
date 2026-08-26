/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
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
			setLiked(true);
		} catch {
			// Real, honest limitation: the API's like response is just
			// {status:string}, no updated like COUNT — so there's
			// nothing to roll back to on failure beyond the boolean
			// itself. A real like counter needs a backend change
			// (posts/{id} would need to return a count), not invented
			// here.
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
				<Pressable onPress={() => post.owner_username && onOpenProfile(post.owner_username)} disabled={!post.owner_username}>
					<Text style={styles.author}>{post.owner_username ?? 'BERX'}</Text>
				</Pressable>
				<Text style={styles.text}>{post.text}</Text>
				<Text style={styles.time}>{relativeTimeLabel(post.time_created)}</Text>

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

				<BerxButton
					label={liked ? 'Понравилось ✓' : 'Нравится'}
					variant={liked ? 'secondary' : 'primary'}
					onPress={handleLike}
					loading={liking}
					disabled={liked}
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
	screen: {flex: 1, backgroundColor: colors.black},
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
