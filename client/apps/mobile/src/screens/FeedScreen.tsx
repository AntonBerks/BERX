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
 *
 * BERX WORLD — closes a real rendering gap: feed.php has always
 * returned a real media_url/media_count/like_count/comment_count per
 * item (batched, see BerxFeedItem's own comments), but this editorial
 * unit never rendered any of them — a post with a real photo showed
 * as bare text, and real engagement was invisible until you opened
 * it. A real photo now gets real framed presence (the same "frame,
 * not halo" single hairline the story rail already uses, not a card),
 * and real like/comment counts sit under it as a quiet stat line —
 * PostDetailScreen still owns the actual Like/Comment interaction,
 * this is a reading of what the server already returned, not a new
 * control surface.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Image, FlatList, RefreshControl, StyleSheet, Pressable, GestureResponderEvent} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup, BerxTrendingHashtag} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState, BerxEmptyState, BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {IconPlus, IconHeart, IconMessage} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

/**
 * WHO ACTUALLY WROTE THIS POST.
 *
 * `owner_guid` is the wall the post lives ON, not the person who wrote
 * it. For a Community Wall post that wall is the GROUP, and a group has
 * no username — so `owner_username` is honestly null, and this screen
 * used to fall back to the literal string 'BERX', attributing a real
 * person's post to the product itself. `poster_guid`/`poster_username`
 * is the real, separate author column OssnWall::Post() has always set
 * (see ossn_com.php's own comment on it, and BerxFeedItem's).
 *
 * Falls back to owner_username for the shapes built by endpoints that
 * do not resolve a poster, rather than assuming every caller populates
 * it.
 */
function authorOf(item: BerxFeedItem): string | null {
	return item.poster_username ?? item.owner_username;
}

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
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
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
						{/* has_unseen is real per-viewer state from the ossn_stories_views
						    rows markViewed() has always written, and the rail was
						    ignoring it: EVERY tile got the accent frame, so a rail
						    where you had already watched everything looked exactly
						    like one full of new stories. The frame is the whole
						    point of a story rail — it is the only thing that says
						    "there is something here for you". Seen groups keep a
						    quiet border: still present, no longer calling. */}
						<View style={[styles.storyTile, item.has_unseen ? styles.storyTileUnseen : styles.storyTileSeen]}>
							{item.owner_icon ? (
								<Image
									source={{uri: item.owner_icon}}
									style={[styles.storyTileImage, !item.has_unseen && styles.storyTileImageSeen]}
								/>
							) : (
								<Text style={styles.storyTileInitial}>{(item.owner_username ?? '?').charAt(0).toUpperCase()}</Text>
							)}
						</View>
						<Text style={[styles.storyLabel, item.has_unseen && styles.storyLabelUnseen]} numberOfLines={1}>
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
				{/* The skeleton has to be the shape of the thing that arrives, or
				    the content visibly jumps when it lands. This one had drifted:
				    it drew a 36px avatar over a two-line author column, which was
				    the old card layout — the editorial unit has a 22px squared
				    mark and a SINGLE byline line. Matched back to it, including a
				    media block on the units likeliest to have one, so the page
				    settles instead of reflowing. */}
				<View style={styles.skeletonList}>
					{[0, 1, 2].map((i) => (
						<View key={i} style={styles.skeletonCard}>
							<View style={styles.skeletonHeaderRow}>
								<BerxSkeleton width={22} height={22} style={styles.skeletonAvatar} />
								<BerxSkeleton width="46%" height={11} />
							</View>
							<BerxSkeleton width="92%" height={16} style={styles.skeletonGap} />
							<BerxSkeleton width="58%" height={16} style={styles.skeletonGapSm} />
							{i === 0 ? <BerxSkeleton width="100%" height={220} style={styles.skeletonMedia} /> : null}
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
					<Pressable
						style={({pressed}: {pressed: boolean}) => [styles.unit, pressed && styles.unitPressed]}
						onPress={() => onOpenPost(item.guid)}>
						<Pressable
							style={styles.bylineRow}
							onPress={() => { const a = authorOf(item); if (a) onOpenProfile(a); }}
							disabled={!authorOf(item)}
							hitSlop={8}
						>
							{/* The author's real face, in BERX's own squared mark rather than
							    the circular avatar this screen deliberately moved away from.
							    poster_icon has been on every feed item all along (ossn_com.php's
							    own comment: "it was simply never sent, which is why every feed
							    byline rendered an initial instead of a face") — the initial is
							    now the FALLBACK for a deleted account, not everyone's default. */}
							<View style={styles.bylineMark}>
								{item.poster_icon ? (
									<Image source={{uri: item.poster_icon}} style={styles.bylineMarkImage} />
								) : (
									<Text style={styles.bylineMarkInitial}>{(authorOf(item) ?? 'B').charAt(0).toUpperCase()}</Text>
								)}
							</View>
							{/* Real creator status, batched page-wide by feed.php and never
							    rendered until now. One accent dot, immediately after the
							    name it describes — parked at the far right of the row it
							    read as an unread indicator instead of as a fact about
							    the author. */}
							{item.poster_is_creator ? <View style={styles.creatorDot} /> : null}
							<Text style={styles.byline} numberOfLines={1}>
								{(authorOf(item) ?? 'BERX').toUpperCase()} · {relativeTimeLabel(item.time_created)}
								{item.is_edited ? ' · ИЗМ.' : ''}
								{item.repost_of ? ' · РЕПОСТ' : ''}
							</Text>
						</Pressable>
						<BerxRichText text={item.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} />
						{item.media_url ? (
							<View style={styles.mediaFrame}>
								<Image source={{uri: item.media_url}} style={styles.media} resizeMode="cover" />
								{item.media_count && item.media_count > 1 ? (
									<View style={styles.mediaCountBadge}>
										<Text style={styles.mediaCountText}>1/{item.media_count}</Text>
									</View>
								) : null}
							</View>
						) : null}
						{/* Real attached soundtrack. track_title is resolved server-side
						    once per distinct track on the page and was never displayed,
						    so a post WITH music looked identical to one without. */}
						{item.track_title ? (
							<View style={styles.trackRow}>
								<View style={styles.trackMark} />
								<Text style={styles.trackTitle} numberOfLines={1}>{item.track_title}</Text>
							</View>
						) : null}
						{/* Drawn with the product's own icon geometry, not emoji. A
						    heart glyph and 💬 render in the OS emoji font — a foreign
						    object, at a size and weight BERX does not control, sitting
						    inside a product built on its own drawn icon set. `is_liked`
						    now reads as colour (the heart is solid either way), which
						    is the honest distinction on a filled mark. */}
						{(item.like_count ?? 0) > 0 || (item.comment_count ?? 0) > 0 ? (
							<View style={styles.stats}>
								{(item.like_count ?? 0) > 0 ? (
									<View style={styles.statItem}>
										<IconHeart size={16} color={item.is_liked ? colors.accent : colors.textFaint} />
										<Text style={[styles.statText, item.is_liked && styles.statTextLiked]}>{item.like_count}</Text>
									</View>
								) : null}
								{(item.comment_count ?? 0) > 0 ? (
									<View style={styles.statItem}>
										<IconMessage size={15} color={colors.textFaint} />
										<Text style={styles.statText}>{item.comment_count}</Text>
									</View>
								) : null}
							</View>
						) : null}
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

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
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
	list: {backgroundColor: colors.bg},
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
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.graphite,
		overflow: 'hidden',
	},
	storyTileUnseen: {borderColor: colors.accent},
	// Not invisible — watched, which is a different thing from absent.
	storyTileSeen: {borderColor: colors.borderSoft},
	storyTileImage: {width: '100%', height: '100%', resizeMode: 'cover'},
	// A watched story reads back a step. Real state, expressed as
	// presence rather than as a badge.
	storyTileImageSeen: {opacity: 0.45},
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
	storyLabelUnseen: {color: colors.textDim, fontWeight: typography.weightMedium},
	fadeFlex: {flex: 1},
	skeletonList: {flex: 1},
	skeletonCard: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.lg,
	},
	skeletonHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	// radius.sm/2 — the same squared mark the real byline uses, not a circle.
	skeletonAvatar: {borderRadius: radius.sm / 2},
	skeletonGap: {marginTop: spacing.md},
	skeletonGapSm: {marginTop: spacing.xs},
	skeletonMedia: {marginTop: spacing.md, borderRadius: radius.md},
	// The editorial unit — no card, no border, no background fill.
	// Same visual grammar as PostDetailScreen's own byline/paragraph
	// treatment, applied here for the first time so feed and detail
	// read as one consistent language rather than a card-grid feed
	// leading into an editorial detail screen.
	unit: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.lg,
	},
	// Real press feedback. A tappable unit that does not acknowledge the
	// touch reads as broken for the frame before the next screen arrives.
	unitPressed: {backgroundColor: colors.glass2},
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
	bylineMarkImage: {width: '100%', height: '100%', resizeMode: 'cover'},
	creatorDot: {width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent},
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
	// Same "frame, not halo" language as the story rail's own squared
	// tile — a single thin hairline, never a shadowed card, so a real
	// photo gets real presence without reintroducing the boxed-card
	// grammar this screen already moved past.
	mediaFrame: {
		marginTop: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		overflow: 'hidden',
		backgroundColor: colors.graphite,
	},
	media: {width: '100%', aspectRatio: 1.3},
	mediaCountBadge: {position: 'absolute', top: spacing.sm, right: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.55)'},
	mediaCountText: {color: colors.white, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	trackRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md},
	// A short accent bar, the same "one line of light" mark the rest of
	// the spatial system uses — not a musical note glyph from a font.
	trackMark: {width: 2, height: 14, borderRadius: 1, backgroundColor: colors.accent},
	trackTitle: {flex: 1, color: colors.textDim, fontSize: typography.sizeXs, letterSpacing: 0.2},
	stats: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md},
	statItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	statText: {color: colors.textFaint, fontSize: typography.sizeSm, fontVariant: ['tabular-nums']},
	statTextLiked: {color: colors.accent},
	separator: {height: 1, backgroundColor: colors.borderSoft, marginHorizontal: spacing.lg},
});
