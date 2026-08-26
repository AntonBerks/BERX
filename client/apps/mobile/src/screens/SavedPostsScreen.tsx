/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes routes.ts's long-disclosed "Post/wall
 * bookmarking has no API endpoint" gap. Real data: api.savedPosts()
 * (components/OssnApi/v1/posts.php's saved-list route, which
 * re-verifies visibility/blocks on every read — a stale save can
 * never leak a post the caller shouldn't see anymore). Deliberately
 * separate from Collections (which already handles curated,
 * nameable, possibly-public collections of places/events/posts) —
 * this is the quick one-tap personal bookmark list.
 */
import {useCallback, useEffect, useState} from 'react';
import {Text, Pressable, View, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPostDetail} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenPost: (guid: number) => void;
	onBack?: () => void;
}

export default function SavedPostsScreen({api, onOpenPost, onBack}: Props) {
	const [items, setItems] = useState<BerxPostDetail[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [removingGuid, setRemovingGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.savedPosts();
			setItems(res.posts);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить сохранённые посты');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleUnsave(guid: number) {
		setRemovingGuid(guid);
		try {
			await api.unsavePost(guid);
			setItems((prev: BerxPostDetail[]) => prev.filter((p) => p.guid !== guid));
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		} finally {
			setRemovingGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Сохранённые посты" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Ничего не сохранено" subtitle="Нажмите «Сохранить» на посте, чтобы вернуться к нему позже." />
			) : (
				<BerxFadeIn style={styles.listFade}>
					<FlatList
						data={items}
						keyExtractor={(p: BerxPostDetail) => String(p.guid)}
						contentContainerStyle={styles.list}
						renderItem={({item}: {item: BerxPostDetail}) => (
							<View>
								<BerxGlassSurface padding="md" style={styles.card}>
									<Pressable onPress={() => onOpenPost(item.guid)}>
										<Text style={styles.author}>{item.owner_username ?? 'BERX'}</Text>
										<Text style={styles.text} numberOfLines={3}>{item.text}</Text>
										<Text style={styles.meta}>{relativeTimeLabel(item.time_created)} · {item.like_count} нравится · {item.comment_count} комментариев</Text>
									</Pressable>
									<Pressable onPress={() => handleUnsave(item.guid)} hitSlop={8} disabled={removingGuid === item.guid}>
										<Text style={styles.remove}>{removingGuid === item.guid ? '…' : 'Убрать'}</Text>
									</Pressable>
								</BerxGlassSurface>
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	listFade: {flex: 1},
	list: {padding: spacing.md, gap: spacing.sm},
	card: {gap: spacing.xs, marginBottom: spacing.sm},
	author: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	text: {color: colors.white, fontSize: typography.sizeBase},
	meta: {color: colors.textFaint, fontSize: typography.sizeXs},
	remove: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs, textDecorationLine: 'underline'},
});
