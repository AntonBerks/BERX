/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getTrack(). Comments reuse the exact same real
 * system PostDetailScreen/VideoDetailScreen already use — a track IS
 * a post. Delete reuses api.deletePost() (author/admin only), which
 * also cleans up the real attached audio file.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxTrackPost, BerxPostComment} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxAudioPlayer} from '../../../../packages/design-system/src/components/BerxAudioPlayer';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

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
		<View style={styles.screen}>
			<BerxHeader title={track.owner_username ?? 'Трек'} onBack={onBack} />
			<View style={styles.body}>
				<BerxAudioPlayer url={track.track.url} />

				<Pressable onPress={() => track.owner_username && onOpenProfile(track.owner_username)}>
					<Text style={styles.author}>{track.owner_username ?? 'BERX'}</Text>
				</Pressable>
				{track.text ? <Text style={styles.text}>{track.text}</Text> : null}
				<Text style={styles.time}>{relativeTimeLabel(track.time_created)}</Text>

				<View style={styles.actions}>
					<BerxButton label={liked ? 'Понравилось ✓' : 'Нравится'} variant={liked ? 'secondary' : 'primary'} onPress={handleLike} loading={liking} disabled={liked} />
					{isOwn ? <BerxButton label="Удалить" variant="danger" onPress={handleDelete} loading={deleting} /> : null}
				</View>

				<View style={styles.commentBox}>
					<BerxInput placeholder="Комментарий..." value={commentText} onChangeText={setCommentText} multiline />
					<BerxButton label="Отправить" variant="secondary" onPress={handleComment} loading={posting} />
				</View>

				{commentsLoading ? (
					<Text style={styles.commentMeta}>Загрузка комментариев...</Text>
				) : comments.length === 0 ? (
					<Text style={styles.commentMeta}>Комментариев пока нет.</Text>
				) : (
					comments.map((c) => (
						<View key={c.id} style={styles.commentRow}>
							<Text style={styles.commentAuthor}>{c.author?.fullname ?? 'Пользователь'}</Text>
							<Text style={styles.commentText}>{c.text}</Text>
						</View>
					))
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	body: {padding: spacing.lg, gap: spacing.md},
	author: {color: colors.accent, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	text: {color: colors.text, fontSize: typography.sizeBase},
	time: {color: colors.textFaint, fontSize: typography.sizeXs},
	actions: {flexDirection: 'row', gap: spacing.sm},
	commentBox: {gap: spacing.sm, marginTop: spacing.sm},
	commentMeta: {color: colors.textDim, fontSize: typography.sizeXs},
	commentRow: {gap: 2, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.glass1},
	commentAuthor: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	commentText: {color: colors.textDim, fontSize: typography.sizeSm},
});
