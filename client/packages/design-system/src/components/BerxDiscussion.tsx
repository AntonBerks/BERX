/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header
 * (apps/mobile/src/screens/LoginScreen.tsx) for the sandbox-wide
 * disclosure this inherits.
 *
 * Real data: api.objectComments/createObjectComment/deleteObjectComment
 * (components/OssnApi/v1/comments.php). One implementation shared by
 * PlaceDetailScreen and EventDetailScreen — both needed identical
 * comment-list + post + delete-own UI, so this is built once rather
 * than duplicated. Delete is only offered on the caller's own
 * comments (myGuid === comment.author.guid) — the server re-checks
 * this regardless, this is just not showing a control that would 403.
 *
 * Two things this was dropping, both of them real:
 *
 * comments.php returns `photo_url` on every row, and BERX rendered
 * only the text — so a comment that was a photograph of the place
 * showed up as whatever caption came with it, or as an empty line. It
 * is drawn now, as part of the comment object rather than as an
 * attachment stuck under it.
 *
 * And a comment was a paragraph between two hairlines. A rule between
 * two comments is a list; a conversation about a place is made of
 * things people said, and each of those is an object standing on the
 * content plane, lit by the room the place is in.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxObjectComment, BerxCommentableType} from '@berx/api/types';
import {colors, spacing, typography, radius} from '../tokens';
import {BerxIcon} from '../icons';
import {BerxEyebrow} from './BerxBusinessPrimitives';
import {BerxText} from '../spatial/BerxText';
import {BerxMediaWell} from '../spatial/BerxMediaWell';
import {BerxSpatialCard} from '../spatial/BerxSpatialCard';
import {BerxComposer} from '../spatial/BerxComposer';
import {berxCount} from '@berx/domain';

interface Props {
	api: BerxApiClient;
	type: BerxCommentableType;
	id: number;
	myGuid?: number;
}

export function BerxDiscussion({api, type, id, myGuid}: Props) {
	const [comments, setComments] = useState<BerxObjectComment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.objectComments(type, id);
			setComments(res.comments);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить комментарии');
		} finally {
			setLoading(false);
		}
	}, [api, type, id]);

	useEffect(() => {
		load();
	}, [load]);

	/* The composer owns the field, the pending state and the failure,
	   and clears the text only once this resolves — so a comment that
	   the server refused is still there to send again. Rejecting is
	   how it is told. */
	const submit = useCallback(
		async (text: string) => {
			await api.createObjectComment(type, id, text);
			await load();
		},
		[api, type, id, load],
	);

	async function remove(commentId: number) {
		try {
			await api.deleteObjectComment(commentId);
			setComments((prev: BerxObjectComment[]) => prev.filter((c: BerxObjectComment) => c.id !== commentId));
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		}
	}

	return (
		<View style={styles.wrap}>
			<BerxEyebrow tone="quiet">
				{comments.length > 0 ? berxCount(comments.length, 'комментарий', 'комментария', 'комментариев') : 'Обсуждение'}
			</BerxEyebrow>

			{/* D4 — the archive's composer, on the control plane, holding
			    the scene's focus while you are writing into it */}
			<BerxComposer
				onSend={submit}
				placeholder="Написать комментарий"
				accessibilityLabel="Текст комментария"
				testID={`discussion-${type}-${id}`}
			/>
			{error ? (
				<Text accessibilityLiveRegion="polite" style={styles.error}>
					{error}
				</Text>
			) : null}

			{loading ? (
				<BerxText role="meta" emphasis="tertiary">Загрузка...</BerxText>
			) : comments.length === 0 ? (
				<BerxText role="meta" emphasis="tertiary">Комментариев пока нет.</BerxText>
			) : (
				comments.map((c) => (
					/* D3 — what someone said is an object in the room, not a
					   paragraph between two rules */
					<BerxSpatialCard key={c.id} depth="D3" padding={spacing.md} radius={16}>
						<View style={styles.row}>
							{c.author ? (
								<Image source={{uri: c.author.icon}} style={styles.avatar} />
							) : (
								<BerxMediaWell radius={radius.pill} style={styles.avatarFallback} />
							)}
							<View style={styles.body}>
								<BerxText role="label">{c.author?.fullname ?? 'Пользователь'}</BerxText>
								{c.text ? <BerxText role="body" emphasis="secondary">{c.text}</BerxText> : null}
							</View>
							{myGuid && c.author?.guid === myGuid ? (
								<Pressable
									onPress={() => remove(c.id)}
									hitSlop={8}
									accessibilityRole="button"
									accessibilityLabel="Удалить комментарий">
									<BerxIcon name="close" size={14} decorative />
								</Pressable>
							) : null}
						</View>
						{/* the photograph the server actually returned, as part of
						    what was said rather than an attachment below it */}
						{c.photo_url ? (
							<Image
								source={{uri: c.photo_url}}
								style={styles.photo}
								resizeMode="cover"
								accessibilityRole="image"
								accessibilityLabel={`Фото в комментарии от ${c.author?.fullname ?? 'пользователя'}`}
							/>
						) : null}
					</BerxSpatialCard>
				))
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	row: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm},
	avatar: {width: 32, height: 32, borderRadius: radius.pill},
	avatarFallback: {width: 32, height: 32},
	body: {flex: 1, gap: 2},
	/* the photo runs the width of the comment it belongs to, inside
	   the object's own radius */
	photo: {width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginTop: spacing.sm},
});
