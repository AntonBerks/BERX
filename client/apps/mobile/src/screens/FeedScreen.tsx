/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Story rail added on top: real data from api.storiesFeed() (built in
 * the Stories phase), not a static mock — tapping a ring opens the
 * real StoryViewer via onOpenStoryGroup. The reference images showed
 * a "Для вас / Подписки / Рядом" tab row above the feed — deliberately
 * NOT copied: feed.php only returns the caller's own wall (see the
 * honest note further down), so tabs implying different underlying
 * feeds would be fake UI with no real data behind two of the three.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, RefreshControl, StyleSheet, Pressable} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState, BerxEmptyState, BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {IconPlus} from '../../../../packages/design-system/src/components/BerxIcons';

interface Props {
	api: BerxApiClient;
	onOpenPost: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onCreatePost: () => void;
	onOpenStoryGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
}

export default function FeedScreen({api, onOpenPost, onOpenProfile, onCreatePost, onOpenStoryGroup, onCreateStory}: Props) {
	const [items, setItems] = useState<BerxFeedItem[]>([]);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const [feedRes, storiesRes] = await Promise.all([
				api.feed(20, 0),
				api.storiesFeed().catch(() => ({feed: []})), // stories failing shouldn't block the feed itself from showing
			]);
			setItems(feedRes.items);
			setStoryGroups(storiesRes.feed);
			setError(null);
		} catch {
			setError('Не удалось загрузить ленту');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	function onRefresh() {
		setRefreshing(true);
		load();
	}

	const header = (
		<View style={styles.header}>
			<Text style={styles.headerTitle}>
				BER<Text style={styles.headerTitleAccent}>X</Text>
			</Text>
			<Pressable onPress={onCreatePost} hitSlop={10} style={styles.headerCreate}>
				<IconPlus size={20} color={colors.accent} />
			</Pressable>
		</View>
	);

	const storyRail = (
		<View style={styles.storyRailWrap}>
			<FlatList
				horizontal
				showsHorizontalScrollIndicator={false}
				data={storyGroups}
				keyExtractor={(g: BerxStoryFeedGroup) => String(g.owner_guid)}
				contentContainerStyle={styles.storyRail}
				ListHeaderComponent={
					<Pressable style={styles.storyItem} onPress={onCreateStory}>
						<View style={styles.addStoryRing}>
							<IconPlus size={18} color={colors.accent} />
						</View>
						<Text style={styles.storyLabel} numberOfLines={1}>
							Ваша история
						</Text>
					</Pressable>
				}
				renderItem={({item}: {item: BerxStoryFeedGroup}) => (
					<Pressable style={styles.storyItem} onPress={() => onOpenStoryGroup(item)}>
						<View style={styles.storyRing}>
							<Text style={styles.storyRingInitial}>{(item.owner_username ?? '?').charAt(0).toUpperCase()}</Text>
						</View>
						<Text style={styles.storyLabel} numberOfLines={1}>
							{item.owner_username ?? `#${item.owner_guid}`}
						</Text>
					</Pressable>
				)}
			/>
		</View>
	);

	if (loading) {
		return (
			<View style={styles.screen}>
				{header}
				{/* Real skeleton shape matching the actual card layout below (avatar + author line + body lines) — BerxSkeleton existed as a real, working, animated component with zero screen actually using it until now. */}
				<View style={styles.skeletonList}>
					{[0, 1, 2, 3].map((i) => (
						<View key={i} style={styles.skeletonCard}>
							<View style={styles.skeletonHeaderRow}>
								<BerxSkeleton width={36} height={36} style={styles.skeletonAvatar} />
								<View style={styles.skeletonAuthorCol}>
									<BerxSkeleton width="40%" height={12} />
									<BerxSkeleton width="25%" height={10} style={styles.skeletonGapSm} />
								</View>
							</View>
							<BerxSkeleton width="90%" height={14} style={styles.skeletonGap} />
							<BerxSkeleton width="60%" height={14} style={styles.skeletonGapSm} />
						</View>
					))}
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.screen}>
				{header}
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			{header}
			<BerxFadeIn style={styles.fadeFlex}>
				<FlatList
					style={styles.list}
					data={items}
					keyExtractor={(item: BerxFeedItem) => String(item.guid)}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
					ListHeaderComponent={storyRail}
					ListEmptyComponent={
						<BerxEmptyState
							title="Пока нет постов"
							subtitle="Честная оговорка: это ваша стена (свои посты + посты друзей на ней), не общая лента всех подписок."
						/>
					}
					renderItem={({item}: {item: BerxFeedItem}) => (
					<Pressable style={styles.card} onPress={() => onOpenPost(item.guid)}>
						<View style={styles.cardHeader}>
							<Pressable
								style={styles.cardAuthorRow}
								onPress={() => item.owner_username && onOpenProfile(item.owner_username)}
								disabled={!item.owner_username}
								hitSlop={8}
							>
								<View style={styles.avatarSmall}>
									<Text style={styles.avatarSmallInitial}>{(item.owner_username ?? 'B').charAt(0).toUpperCase()}</Text>
								</View>
								<View>
									<Text style={styles.author}>{item.owner_username ?? 'BERX'}</Text>
									<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
								</View>
							</Pressable>
						</View>
						<Text style={styles.text}>{item.text}</Text>
					</Pressable>
				)}
				/>
			</BerxFadeIn>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
	},
	headerTitle: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: 1},
	headerTitleAccent: {color: colors.accent},
	headerCreate: {padding: spacing.xs},
	list: {backgroundColor: colors.black},
	storyRailWrap: {borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: spacing.md},
	storyRail: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm},
	storyItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	storyRing: {
		width: 56,
		height: 56,
		borderRadius: 28,
		borderWidth: 2,
		borderColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.graphite,
	},
	storyRingInitial: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	addStoryRing: {
		width: 56,
		height: 56,
		borderRadius: 28,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center',
	},
	storyLabel: {color: colors.textFaint, fontSize: 10, marginTop: spacing.xs, textAlign: 'center'},
	fadeFlex: {flex: 1},
	skeletonList: {flex: 1},
	skeletonCard: {
		backgroundColor: colors.graphite,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		padding: spacing.lg,
		marginHorizontal: spacing.lg,
		marginTop: spacing.md,
	},
	skeletonHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	skeletonAvatar: {borderRadius: radius.pill},
	skeletonAuthorCol: {flex: 1, gap: 4},
	skeletonGap: {marginTop: spacing.md},
	skeletonGapSm: {marginTop: spacing.xs},
	card: {
		backgroundColor: colors.graphite,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		padding: spacing.lg,
		marginHorizontal: spacing.lg,
		marginTop: spacing.md,
	},
	cardHeader: {marginBottom: spacing.sm},
	cardAuthorRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	avatarSmall: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.glass2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarSmallInitial: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	author: {color: colors.text, fontWeight: typography.weightMedium, fontSize: typography.sizeSm},
	text: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	time: {color: colors.textFaint, fontSize: 11, marginTop: 1},
});
