/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getTrack(). Comments reuse the exact same real
 * system PostDetailScreen/VideoDetailScreen already use — a track IS
 * a post. Delete reuses api.deletePost() (author/admin only), which
 * also cleans up the real attached audio file.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrackPost, BerxPostComment} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing} from '@berx/design-system/tokens';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxAudioPlayer} from '../../../../packages/design-system/src/components/BerxAudioPlayer';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxSection} from '../../../../packages/design-system/src/spatial/BerxSection';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {berxCount} from '@berx/domain';

export interface TrackDetailScreenProps {
	api: BerxApiClient;
	postGuid: number;
	myGuid?: number;
	onOpenProfile: (username: string) => void;
	onDeleted: () => void;
	onBack?: () => void;
}

export default function TrackDetailScreen(props: TrackDetailScreenProps) {
	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" testID="track-detail">
			<TrackDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function TrackDetailScreenBody({api, postGuid, myGuid, onOpenProfile, onDeleted, onBack}: TrackDetailScreenProps) {
	/* the rule between two entries is the structure plane's own edge:
	   a fixed grey hairline belongs to no plane and does not change
	   with the colour world */
	const dividerColor = useBerxScene().scene.layers.D2.surface.borderColor;
	const [track, setTrack] = useState<BerxTrackPost | null>(null);
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
			const t = await api.getTrack(postGuid);
			setTrack(t);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Трек недоступен');
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
			// real comment list failing to load doesn't block viewing the track itself
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
			// same honest limitation as PostDetailScreen — no updated count to roll back to
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
	if (error || !track) return <BerxErrorState message={error ?? 'Трек не найден'} onRetry={load} />;

	const isOwn = myGuid === track.owner_guid;

	return (
		<BerxSceneScroll style={styles.screen} contentContainerStyle={styles.scroll}>
			{/* the track is the subject; the way back does not name it twice.
			    It scrolls now — the comments used to run off the bottom with
			    nothing to scroll. */}
			<BerxHeader onBack={onBack} />
			<View style={styles.body}>
				<BerxSection leading>
					<BerxAudioPlayer url={track.track.url} />
					<BerxIdentity
						userGuid={track.owner_guid}
						name={track.owner_username ?? 'BERX'}
						subtitle={relativeTimeLabel(track.time_created)}
						size={40}
						onPress={track.owner_username ? () => onOpenProfile(track.owner_username as string) : undefined}
					/>
					{track.text ? <BerxText role="body">{track.text}</BerxText> : null}

					<BerxActionShelf variant="anchored">
						<BerxButton label={liked ? 'Понравилось' : 'Нравится'} variant={liked ? 'secondary' : 'primary'} onPress={handleLike} loading={liking} disabled={liked} />
						{isOwn ? <BerxButton label="Удалить" variant="danger" onPress={handleDelete} loading={deleting} /> : null}
					</BerxActionShelf>
				</BerxSection>

				<BerxSection label="Комментарии" detail={comments.length > 0 ? berxCount(comments.length, 'комментарий', 'комментария', 'комментариев') : undefined}>
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
							<View key={c.id} style={[styles.commentRow, {borderTopColor: dividerColor}]}>
								<BerxText role="label">{c.author?.fullname ?? 'Пользователь'}</BerxText>
								<BerxText role="meta" emphasis="secondary">{c.text}</BerxText>
							</View>
						))
					)}
				</BerxSection>
			</View>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	scroll: {paddingBottom: spacing.xxxl},
	body: {paddingHorizontal: spacing.lg},
	actions: {flexDirection: 'row', gap: spacing.sm},
	commentBox: {gap: spacing.sm, marginTop: spacing.sm},
	commentRow: {gap: 2, paddingVertical: spacing.xs, borderTopWidth: 1},
});
