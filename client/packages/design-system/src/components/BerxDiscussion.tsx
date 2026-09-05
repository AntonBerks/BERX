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
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxObjectComment, BerxCommentableType} from '@berx/api/types';
import {colors, spacing, typography, radius} from '../tokens';
import {BerxInput} from './BerxInput';
import {BerxButton} from './BerxButton';
import {BerxIcon} from '../icons';
import {BerxEyebrow} from './BerxBusinessPrimitives';
import {BerxText} from '../spatial/BerxText';

interface Props {
	api: BerxApiClient;
	type: BerxCommentableType;
	id: number;
	myGuid?: number;
}

export function BerxDiscussion({api, type, id, myGuid}: Props) {
	const [comments, setComments] = useState<BerxObjectComment[]>([]);
	const [loading, setLoading] = useState(true);
	const [text, setText] = useState('');
	const [submitting, setSubmitting] = useState(false);
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

	async function submit() {
		if (text.trim().length === 0) return;
		setSubmitting(true);
		try {
			await api.createObjectComment(type, id, text.trim());
			setText('');
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось отправить комментарий');
		} finally {
			setSubmitting(false);
		}
	}

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
			<BerxEyebrow tone="quiet">Обсуждение ({comments.length})</BerxEyebrow>

			<View style={styles.form}>
				<BerxInput placeholder="Написать комментарий" value={text} onChangeText={setText} />
				<BerxButton label="Отправить" loading={submitting} disabled={text.trim().length === 0} onPress={submit} />
			</View>
			{error ? <Text style={styles.error}>{error}</Text> : null}

			{loading ? (
				<BerxText role="meta" emphasis="tertiary">Загрузка...</BerxText>
			) : comments.length === 0 ? (
				<BerxText role="meta" emphasis="tertiary">Комментариев пока нет.</BerxText>
			) : (
				comments.map((c) => (
					<View key={c.id} style={styles.row}>
						{c.author ? <Image source={{uri: c.author.icon}} style={styles.avatar} /> : <View style={styles.avatarFallback} />}
						<View style={styles.body}>
							<BerxText role="label">{c.author?.fullname ?? 'Пользователь'}</BerxText>
							<BerxText role="meta" emphasis="secondary">{c.text}</BerxText>
						</View>
						{myGuid && c.author?.guid === myGuid ? (
							<Pressable onPress={() => remove(c.id)} hitSlop={8}>
								<BerxIcon name="close" size={14} decorative />
							</Pressable>
						) : null}
					</View>
				))
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	form: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	row: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	avatar: {width: 32, height: 32, borderRadius: radius.pill},
	avatarFallback: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	body: {flex: 1, gap: 2},
	deleteLink: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
