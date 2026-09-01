/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — real hashtag feed. api.postsForHashtag() (GET
 * /posts/hashtag/{tag}, classes/OssnHashtags.php) — real posts
 * carrying this exact tag, re-verified for the caller's own
 * visibility on every read (a tagged post can be deleted/blocked/
 * visibility-narrowed after it was tagged). Same "editorial unit"
 * visual grammar FeedScreen already established for a post — a
 * hashtag feed is still real posts, not a new kind of card.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPostDetail} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	tag: string;
	onOpenPost: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onOpenHashtag: (tag: string) => void;
	onBack?: () => void;
}

export default function HashtagScreen({api, tag, onOpenPost, onOpenProfile, onOpenHashtag, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [posts, setPosts] = useState<BerxPostDetail[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.postsForHashtag(tag);
			setPosts(res.posts);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, tag]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={`#${tag}`} />
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : posts.length === 0 ? (
				<BerxEmptyState title="Пока ничего нет" subtitle={`Постов с #${tag} пока не нашлось.`} />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={posts}
						keyExtractor={(p: BerxPostDetail) => String(p.guid)}
						contentContainerStyle={styles.list}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
						renderItem={({item}: {item: BerxPostDetail}) => (
							<Pressable style={styles.unit} onPress={() => onOpenPost(item.guid)}>
								<Text style={styles.byline} numberOfLines={1}>
									{(item.poster_username ?? 'BERX').toUpperCase()} · {relativeTimeLabel(item.time_created)}
								</Text>
								<BerxRichText text={item.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} />
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	fadeFlex: {flex: 1},
	list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
	separator: {height: 1, backgroundColor: colors.borderSoft},
	unit: {paddingVertical: spacing.md, gap: spacing.xs},
	byline: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, letterSpacing: 0.5},
	text: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
});
