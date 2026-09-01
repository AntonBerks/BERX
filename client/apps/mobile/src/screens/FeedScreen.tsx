/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Story rail: real data from api.storiesFeed() (built in the Stories
 * phase), not a static mock — tapping a tile opens the real
 * StoryViewer via onOpenStoryGroup.
 *
 * MAX BUILD — feed.php now returns a real friends-aggregated, ranked
 * feed (own + friends + admin posts, transparent recency/engagement
 * scoring — see feed.php's own header). The reference images showed
 * a "Для вас / Подписки / Рядом" tab row above the feed — still
 * deliberately NOT copied: there is exactly one real ranked feed, not
 * three independently-sourced ones, so a tab row implying otherwise
 * would be fake UI with no distinct data behind two of the three tabs.
 *
 * BERX WORLD TRANSFORMATION — the post unit was a bordered, shadowed,
 * rounded-rectangle "card" with an avatar-circle + name row: the
 * exact generic-feed-card grammar the directive names directly. This
 * is not a recolor of that card — there is no card anymore. Each post
 * is now an editorial unit (same visual language PostDetailScreen
 * already established this session: a small-caps byline overline,
 * larger/bolder body type carrying the real hierarchy) separated by a
 * hairline rule instead of a boxed, backgrounded rectangle — one
 * consistent visual grammar across feed and detail, not two competing
 * ones. The story rail's circular rings (Instagram's own shape) are
 * now BERX-native squared tiles with a thin single-line frame.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, RefreshControl, StyleSheet, Pressable, GestureResponderEvent} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup, BerxTrendingHashtag} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState, BerxEmptyState, BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {IconPlus} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';

interface Props {
	api: BerxApiClient;
	myGuid?: number;
	onOpenPost: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onOpenHashtag?: (tag: string) => void;
	onCreatePost: () => void;
	onOpenStoryGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
}

export default function FeedScreen({api, myGuid, onOpenPost, onOpenProfile, onOpenHashtag, onCreatePost, onOpenStoryGroup, onCreateStory}: Props) {
	const [items, setItems] = useState<BerxFeedItem[]>([]);
	const [votingPollGuid, setVotingPollGuid] = useState<number | null>(null);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [trending, setTrending] = useState<BerxTrendingHashtag[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** BERX WORLD — real poll vote right from the feed card, same real votePoll() response-trusting shape as PostDetailScreen's own handler. */
	async function handleVotePoll(item: BerxFeedItem, optionIndex: number) {
		setVotingPollGuid(item.guid);
		try {
			const res = await api.votePoll(item.guid, optionIndex);
			setItems((prev: BerxFeedItem[]) => prev.map((it: BerxFeedItem) => (it.guid === item.guid ? {...it, poll: res.poll} : it)));
		} catch {
			// real server rejection — state left as-is
		} finally {
			setVotingPollGuid(null);
		}
	}

	/** BERX WORLD — real early close, poster_guid-gated server-side regardless of what this button already knows. */
	async function handleClosePoll(item: BerxFeedItem) {
		setVotingPollGuid(item.guid);
		try {
			const res = await api.closePoll(item.guid);
			setItems((prev: BerxFeedItem[]) => prev.map((it: BerxFeedItem) => (it.guid === item.guid ? {...it, poll: res.poll} : it)));
		} catch {
			// real server rejection — state left as-is
		} finally {
			setVotingPollGuid(null);
		}
	}

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
		// Real trending hashtags — best-effort, additive, never blocks the feed itself.
		api.trendingHashtags().then((res) => setTrending(res.hashtags)).catch(() => undefined);
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
						<View style={styles.addStoryTile}>
							<IconPlus size={18} color={colors.accent} />
						</View>
						<Text style={styles.storyLabel} numberOfLines={1}>
							Ваша история
						</Text>
					</Pressable>
				}
				renderItem={({item}: {item: BerxStoryFeedGroup}) => (
					<Pressable style={styles.storyItem} onPress={() => onOpenStoryGroup(item)}>
						<View style={styles.storyTile}>
							<Text style={styles.storyTileInitial}>{(item.owner_username ?? '?').charAt(0).toUpperCase()}</Text>
						</View>
						<Text style={styles.storyLabel} numberOfLines={1}>
							{item.owner_username ?? `#${item.owner_guid}`}
						</Text>
					</Pressable>
				)}
			/>
		</View>
	);

	const trendingRail =
		trending.length > 0 && onOpenHashtag ? (
			<View style={styles.trendingRail}>
				{trending.slice(0, 8).map((h: BerxTrendingHashtag) => (
					<Pressable key={h.hashtag} style={styles.trendingChip} onPress={() => onOpenHashtag(h.hashtag)}>
						<Text style={styles.trendingChipText}>#{h.hashtag}</Text>
					</Pressable>
				))}
			</View>
		) : null;

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
					ListHeaderComponent={
						<>
							{storyRail}
							{trendingRail}
						</>
					}
					ListEmptyComponent={
						<BerxEmptyState
							title="Пока нет постов"
							subtitle="Честная оговорка: это ваша стена (свои посты + посты друзей на ней), не общая лента всех подписок."
						/>
					}
					renderItem={({item}: {item: BerxFeedItem}) => (
					<Pressable style={styles.unit} onPress={() => onOpenPost(item.guid)}>
						<Pressable
							style={styles.bylineRow}
							onPress={() => item.owner_username && onOpenProfile(item.owner_username)}
							disabled={!item.owner_username}
							hitSlop={8}
						>
							<View style={styles.bylineMark}>
								<Text style={styles.bylineMarkInitial}>{(item.owner_username ?? 'B').charAt(0).toUpperCase()}</Text>
							</View>
							<Text style={styles.byline} numberOfLines={1}>
								{(item.owner_username ?? 'BERX').toUpperCase()} · {relativeTimeLabel(item.time_created)}
							</Text>
						</Pressable>
						<BerxRichText text={item.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} />
						{item.poll ? (
							<Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
								<BerxPollView
								poll={item.poll}
								onVote={(optionIndex) => handleVotePoll(item, optionIndex)}
								voting={votingPollGuid === item.guid}
								onClose={myGuid === item.poster_guid ? () => handleClosePoll(item) : undefined}
								closing={votingPollGuid === item.guid}
							/>
							</Pressable>
						) : null}
					</Pressable>
				)}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
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
	},
	headerTitle: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: 1},
	headerTitleAccent: {color: colors.accent},
	headerCreate: {padding: spacing.xs},
	list: {backgroundColor: colors.black},
	storyRailWrap: {borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: spacing.md},
	trendingRail: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	trendingChip: {paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surface},
	trendingChipText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	storyRail: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm},
	storyItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	// BERX-native tile, not Instagram's circular ring: a squared frame
	// (radius.sm, not a pill) with a single thin accent line, not a
	// thick ring — the same "frame, not halo" language as
	// BerxWayfinder's own restrained use of the accent.
	storyTile: {
		width: 56,
		height: 56,
		borderRadius: radius.sm,
		borderWidth: 1,
		borderColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.graphite,
	},
	storyTileInitial: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	addStoryTile: {
		width: 56,
		height: 56,
		borderRadius: radius.sm,
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
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.lg,
	},
	skeletonHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	skeletonAvatar: {borderRadius: radius.sm},
	skeletonAuthorCol: {flex: 1, gap: 4},
	skeletonGap: {marginTop: spacing.md},
	skeletonGapSm: {marginTop: spacing.xs},
	// The editorial unit — no card, no border, no background fill.
	// Same visual grammar as PostDetailScreen's own byline/paragraph
	// treatment, applied here for the first time so feed and detail
	// read as one consistent language rather than a card-grid feed
	// leading into an editorial detail screen.
	unit: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.lg,
	},
	bylineRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
	bylineMark: {
		width: 22,
		height: 22,
		borderRadius: radius.sm / 2,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bylineMarkInitial: {color: colors.accent, fontSize: 10, fontWeight: typography.weightBold},
	byline: {
		flex: 1,
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		fontWeight: typography.weightBold,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	text: {
		color: colors.text,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightMedium,
		letterSpacing: -0.1,
		lineHeight: typography.sizeLg * 1.32,
	},
	separator: {height: 1, backgroundColor: colors.borderSoft, marginHorizontal: spacing.lg},
});
