/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data: api.getVideo() (components/OssnApi/v1/videos.php).
 * Comments reuse the EXACT same real system PostDetailScreen already
 * uses (api.postComments/commentOnPost) — a video IS a post, so its
 * comments are real post comments, not a separate "video comments"
 * system. Delete reuses api.deletePost() (author/admin only,
 * server-side), which also cleans up the real attached video file.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxVideoPost, BerxPostComment} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxVideoPlayer} from '../../../../packages/design-system/src/components/BerxVideoPlayer';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface VideoDetailScreenProps {
	api: BerxApiClient;
	postGuid: number;
	myGuid?: number;
	onOpenProfile: (username: string) => void;
	onDeleted: () => void;
	onBack?: () => void;
}

export default function VideoDetailScreen(props: VideoDetailScreenProps) {
	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" testID="video-detail">
			<VideoDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function VideoDetailScreenBody({api, postGuid, myGuid, onOpenProfile, onDeleted, onBack}: VideoDetailScreenProps) {
	const [video, setVideo] = useState<BerxVideoPost | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [liking, setLiking] = useState(false);
	const [liked, setLiked] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [comments, setComments] = useState<BerxPostComment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);
	const [commentText, setCommentText] = useState('');
	const [posting, setPosting] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const v = await api.getVideo(postGuid);
			setVideo(v);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Видео недоступно');
		} finally {
			setLoading(false);
		}
	}, [api, postGuid]);

	const loadComments = useCallback(async () => {
		setCommentsLoading(true);
		try {
			const res = await api.postComments(postGuid);
			setComments(res.comments);
		} catch {
			// real comment list failing to load doesn't block viewing the video itself
		} finally {
			setCommentsLoading(false);
		}
	}, [api, postGuid]);

	useEffect(() => {
		load();
		loadComments();
	}, [load, loadComments]);

	async function handleLike() {
		setLiking(true);
		try {
			await api.likePost(postGuid);
			setLiked(true);
		} catch {
			// same honest limitation as PostDetailScreen — the like response has no updated count to roll back to
		} finally {
			setLiking(false);
		}
	}

	async function handleComment() {
		if (!commentText.trim()) return;
		setPosting(true);
		try {
			await api.commentOnPost(postGuid, commentText.trim());
			setCommentText('');
			await loadComments();
		} catch {
			// comment box stays populated on failure so the user can retry without retyping
		} finally {
			setPosting(false);
		}
	}

	async function handleDelete() {
		setDeleting(true);
		try {
			await api.deletePost(postGuid);
			onDeleted();
		} catch {
			setDeleting(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !video) return <BerxErrorState message={error ?? 'Видео не найдено'} onRetry={load} />;

	const isOwn = myGuid === video.owner_guid;

	return (
		<View style={styles.screen}>
			<BerxHeader title={video.owner_username ?? 'Видео'} onBack={onBack} />
			<BerxVideoPlayer url={video.video.url} />

			<View style={styles.body}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Профиль ${video.owner_username ?? 'BERX'}`}
					onPress={() => video.owner_username && onOpenProfile(video.owner_username)}>
					<BerxText role="subtitle" emphasis="accent">{video.owner_username ?? 'BERX'}</BerxText>
				</Pressable>
				{video.text ? <BerxText role="body">{video.text}</BerxText> : null}
				<BerxText role="meta" emphasis="tertiary">{relativeTimeLabel(video.time_created)}</BerxText>

				<BerxActionShelf variant="anchored">
					<BerxButton label={liked ? 'Понравилось' : 'Нравится'} variant={liked ? 'secondary' : 'primary'} onPress={handleLike} loading={liking} disabled={liked} />
					{isOwn ? <BerxButton label="Удалить" variant="danger" onPress={handleDelete} loading={deleting} /> : null}
				</BerxActionShelf>

				<View style={styles.commentBox}>
					<BerxInput placeholder="Комментарий..." value={commentText} onChangeText={setCommentText} multiline />
					<BerxButton label="Отправить" variant="secondary" onPress={handleComment} loading={posting} />
				</View>

				{commentsLoading ? (
					<BerxText role="meta" emphasis="secondary">Загрузка комментариев...</BerxText>
				) : comments.length === 0 ? (
					<BerxText role="meta" emphasis="secondary">Комментариев пока нет.</BerxText>
				) : (
					comments.map((c) => (
						<View key={c.id} style={styles.commentRow}>
							<BerxText role="label">{c.author?.fullname ?? 'Пользователь'}</BerxText>
							<BerxText role="meta" emphasis="secondary">{c.text}</BerxText>
						</View>
					))
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.lg, gap: spacing.md},
	actions: {flexDirection: 'row', gap: spacing.sm},
	commentBox: {gap: spacing.sm, marginTop: spacing.sm},
	commentRow: {gap: 2, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.glass1},
});
