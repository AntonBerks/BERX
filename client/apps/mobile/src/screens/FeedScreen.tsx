/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * DIRECTION CORRECTION — THE WORLD IS THE FEED, NOT A DECORATION ABOVE
 * IT. Every earlier pass on this screen (see git history) improved the
 * MATERIAL of a conventional list — glass, real photos, a real action
 * rail, then a real 3D visualisation bolted above the same FlatList of
 * post cards — without ever touching the actual information
 * architecture: a header, a row of avatars, a scrolling list. That is
 * a better-dressed conventional feed, not a different thing, and was
 * named directly as the mistake to stop making.
 *
 * This is the different thing. There is no FlatList any more. The
 * screen is now: a real spatial world (BerxFeedScene, full-bleed, real
 * geometry/camera/material — see its own header for what z, shape and
 * emissive actually encode) that you DRAG THROUGH, and a docked glass
 * panel at the bottom that shows the one real post currently nearest
 * the camera — reported by the scene itself via `onFocusChange`, the
 * same live relationship the scene's own camera has to its data. There
 * is exactly one reading surface for exactly one focused post at a
 * time, not a list of N pre-rendered ones. Tapping that panel opens
 * the real PostDetailScreen for full reading/commenting, same
 * destination `onOpenPost` always led to.
 *
 * WHAT THIS SCREEN NO LONGER HAS, ON PURPOSE. Pull-to-refresh was a
 * ScrollView/FlatList gesture, not real functionality in itself — the
 * real capability (re-fetch the feed) is preserved as an explicit
 * refresh control in the header instead of an implicit gesture with
 * nothing left to attach it to. The old story rail (BerxStoryRail's
 * squared, scrollable tiles) and the old flat trending-chip row are
 * both retired as the exact "legacy horizontal list" grammar the
 * direction correction named — real story presence and real trending
 * tags are still here, just as a small capped cluster and a slim
 * wrapped strip respectively, never a scrollable rail.
 *
 * Story rail: real data from api.storiesFeed() (built in the Stories
 * phase), not a static mock — tapping a marker opens the real
 * StoryViewer via onOpenStoryGroup.
 *
 * MAX BUILD — feed.php returns a real friends-aggregated, ranked feed
 * (own + friends + admin posts, transparent recency/engagement scoring
 * — see feed.php's own header). The reference images showed a "Для
 * вас / Подписки / Рядом" tab row above the feed — still deliberately
 * NOT copied: there is exactly one real ranked feed, not three
 * independently-sourced ones.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, Image, Pressable, ActivityIndicator, StyleSheet, GestureResponderEvent} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup, BerxTrendingHashtag} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxGlassBar} from '../../../../packages/design-system/src/components/BerxGlassBar';
import BerxFeedScene from '../three/BerxFeedScene';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import {useBerxInsets} from '../../../../packages/design-system/src/insets';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

/** The header's own real content height (title line + vertical padding), not counting the safe-area inset — added separately per device below. */
const HEADER_CONTENT_H = 52;
/** How many real story-having friends the presence cluster shows before folding the rest into a real "+N" count — a cap, not a fabricated ceiling (see the cluster's own comment). */
const PRESENCE_CAP = 7;
/** How many real trending tags the wrapped strip shows. */
const TRENDING_CAP = 6;

/**
 * WHO ACTUALLY WROTE THIS POST.
 *
 * `owner_guid` is the wall the post lives ON, not the person who wrote
 * it. For a Community Wall post that wall is the GROUP, and a group has
 * no username — so `owner_username` is honestly null. `poster_guid`/
 * `poster_username` is the real, separate author column OssnWall::Post()
 * has always set (see ossn_com.php's own comment on it).
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
	const insets = useBerxInsets();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const headerH = HEADER_CONTENT_H + insets.top;
	const [items, setItems] = useState<BerxFeedItem[]>([]);
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [votingPollGuid, setVotingPollGuid] = useState<number | null>(null);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [trending, setTrending] = useState<BerxTrendingHashtag[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** Real poll vote right from the world's docked panel, same real votePoll() response-trusting shape as PostDetailScreen's own handler. */
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

	/** Real early close, poster_guid-gated server-side regardless of what this button already knows. */
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
			setFocusedIndex(0);
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
		<BerxGlassBar level={2} style={[styles.header, {height: headerH}]}>
			<View style={[styles.headerRow, {paddingTop: insets.top}]}>
				<Text style={styles.headerTitle}>
					BER<Text style={styles.headerTitleAccent}>X</Text>
				</Text>
				<View style={styles.headerActions}>
					{/* Replaces the pull-to-refresh gesture the old FlatList carried
					    — real capability (re-fetch), explicit control now that there
					    is no scrollable list to attach the gesture to. */}
					<Pressable onPress={onRefresh} disabled={refreshing} hitSlop={6} style={({pressed}: {pressed: boolean}) => [pressed && styles.headerCreatePressed]}>
						<BerxGlassSurface level={4} padding={0} radius={20} style={styles.headerIconBtn}>
							{refreshing ? <ActivityIndicator size="small" color={colors.accent} /> : <BerxIcon name="refresh-cw" size={16} color={colors.accent} />}
						</BerxGlassSurface>
					</Pressable>
					<Pressable onPress={onCreatePost} hitSlop={6} style={({pressed}: {pressed: boolean}) => [pressed && styles.headerCreatePressed]}>
						<BerxGlassSurface level={4} padding={0} radius={20} style={styles.headerIconBtn}>
							<BerxIcon name="plus" size={18} color={colors.accent} />
						</BerxGlassSurface>
					</Pressable>
				</View>
			</View>
		</BerxGlassBar>
	);

	/*
	 * REAL STORY PRESENCE, NOT A SCROLLABLE RAIL. BerxStoryRail's squared,
	 * scrollable tiles were the exact "legacy horizontal list" grammar
	 * this build was told to stop reproducing. A person is now a small
	 * circular presence marker — the world's own vocabulary for "a real
	 * person, not a post" — capped at PRESENCE_CAP with a real "+N" for
	 * whatever real count doesn't fit, never silently dropped.
	 */
	const overflowCount = Math.max(0, storyGroups.length - PRESENCE_CAP);
	const presence = (
		<View style={styles.presenceRow}>
			<Pressable onPress={onCreateStory} hitSlop={6}>
				<View style={[styles.presenceMark, styles.presenceCreate]}>
					<BerxIcon name="plus" size={14} color={colors.accent} />
				</View>
			</Pressable>
			{storyGroups.slice(0, PRESENCE_CAP).map((g: BerxStoryFeedGroup) => (
				<Pressable key={String(g.owner_guid)} onPress={() => onOpenStoryGroup(g)} hitSlop={4}>
					<View style={[styles.presenceMark, g.has_unseen && styles.presenceMarkUnseen]}>
						{g.owner_icon ? (
							<Image source={{uri: g.owner_icon}} style={styles.presenceImage} />
						) : (
							<Text style={styles.presenceInitial}>{(g.owner_username ?? '?').charAt(0).toUpperCase()}</Text>
						)}
					</View>
				</Pressable>
			))}
			{overflowCount > 0 ? (
				<View style={[styles.presenceMark, styles.presenceOverflow]}>
					<Text style={styles.presenceOverflowText}>+{overflowCount}</Text>
				</View>
			) : null}
		</View>
	);

	/* A slim wrapped strip, not a scrollable pill row — real glass, same
	   ladder the header's own compose capsule uses. */
	const trendingRail =
		trending.length > 0 && onOpenHashtag ? (
			<View style={styles.trendingRail}>
				{trending.slice(0, TRENDING_CAP).map((h: BerxTrendingHashtag) => (
					<Pressable key={h.hashtag} onPress={() => onOpenHashtag(h.hashtag)}>
						<BerxGlassSurface level={1} padding={0} radius={radius.pill} style={styles.trendingChip}>
							<Text style={styles.trendingChipText}>#{h.hashtag}</Text>
						</BerxGlassSurface>
					</Pressable>
				))}
			</View>
		) : null;

	if (loading) {
		return (
			<View style={styles.screen}>
				<View style={styles.centerFill}>
					<ActivityIndicator size="large" color={colors.accent} />
				</View>
				{header}
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.screen}>
				<View style={{paddingTop: headerH, flex: 1}}>
					<BerxErrorState message={error} onRetry={load} />
				</View>
				{header}
			</View>
		);
	}

	const focusedItem: BerxFeedItem | null = items[focusedIndex] ?? null;
	const focusedAuthor = focusedItem ? authorOf(focusedItem) : null;

	return (
		<View style={styles.screen}>
			<BerxFadeIn style={styles.fadeFlex}>
				{/* The world itself — full-bleed, behind everything else on this
				    screen, and the thing you actually drag. See its own header
				    for what depth/shape/emissive encode. */}
				<BerxFeedScene items={items} onFocusChange={setFocusedIndex} />
			</BerxFadeIn>
			{header}
			<View style={[styles.overlayTop, {top: headerH}]} pointerEvents="box-none">
				{presence}
				{trendingRail}
			</View>
			{/* The one real reading surface — whichever post the camera is
			    currently nearest, never a pre-rendered list of them. */}
			{focusedItem ? (
				<Pressable onPress={() => onOpenPost(focusedItem.guid)} style={[styles.hudWrap, {paddingBottom: insets.bottom || spacing.md}]}>
					<BerxGlassBar level={3} edge="top" style={styles.hud}>
						<Pressable
							style={styles.bylineRow}
							onPress={() => { const a = focusedAuthor; if (a) onOpenProfile(a); }}
							disabled={!focusedAuthor}
							hitSlop={8}>
							<View style={styles.bylineMark}>
								{focusedItem.poster_icon ? (
									<Image source={{uri: focusedItem.poster_icon}} style={styles.bylineMarkImage} />
								) : (
									<Text style={styles.bylineMarkInitial}>{(focusedAuthor ?? 'B').charAt(0).toUpperCase()}</Text>
								)}
							</View>
							{focusedItem.poster_is_creator ? <View style={styles.creatorDot} /> : null}
							<Text style={styles.byline} numberOfLines={1}>
								{(focusedAuthor ?? 'BERX').toUpperCase()} · {relativeTimeLabel(focusedItem.time_created)}
								{focusedItem.is_edited ? ' · ИЗМ.' : ''}
								{focusedItem.repost_of ? ' · РЕПОСТ' : ''}
							</Text>
							{/* The real photo itself is already the sphere this post's
							    node wears out in the world — this is just a pointer to
							    it, never a second copy of the image. */}
							{focusedItem.media_url ? (
								<View style={styles.mediaBadge}>
									<BerxIcon name="camera" size={11} color={colors.accent} />
									{focusedItem.media_count && focusedItem.media_count > 1 ? (
										<Text style={styles.mediaBadgeText}>{focusedItem.media_count}</Text>
									) : null}
								</View>
							) : null}
						</Pressable>
						<View style={styles.hudTextClip}>
							<BerxRichText text={focusedItem.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} />
						</View>
						{focusedItem.track_title ? (
							<View style={styles.trackRow}>
								<BerxIcon name="music" size={13} color={colors.accent} />
								<Text style={styles.trackTitle} numberOfLines={1}>{focusedItem.track_title}</Text>
							</View>
						) : null}
						{focusedItem.poll ? (
							<Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
								<BerxPollView
									poll={focusedItem.poll}
									onVote={(optionIndex) => handleVotePoll(focusedItem, optionIndex)}
									voting={votingPollGuid === focusedItem.guid}
									onClose={myGuid === focusedItem.poster_guid ? () => handleClosePoll(focusedItem) : undefined}
									closing={votingPollGuid === focusedItem.guid}
								/>
							</Pressable>
						) : null}
						{((focusedItem.like_count ?? 0) > 0 || (focusedItem.comment_count ?? 0) > 0) ? (
							<View style={styles.stats}>
								{(focusedItem.like_count ?? 0) > 0 ? (
									<View style={styles.statItem}>
										<BerxIcon name="heart" size={16} color={focusedItem.is_liked ? colors.accent : colors.textFaint} filled />
										<Text style={[styles.statText, focusedItem.is_liked && styles.statTextLiked]}>{focusedItem.like_count}</Text>
									</View>
								) : null}
								{(focusedItem.comment_count ?? 0) > 0 ? (
									<View style={styles.statItem}>
										<BerxIcon name="message-circle" size={15} color={colors.textFaint} />
										<Text style={styles.statText}>{focusedItem.comment_count}</Text>
									</View>
								) : null}
							</View>
						) : null}
					</BerxGlassBar>
				</Pressable>
			) : (
				<View style={[styles.hudWrap, {paddingBottom: insets.bottom || spacing.md}]}>
					<BerxGlassBar level={3} edge="top" style={styles.hud}>
						<BerxEmptyState
							title="Пока нет постов"
							subtitle="Честная оговорка: это ваша стена (свои посты + посты друзей на ней), не общая лента всех подписок."
						/>
					</BerxGlassBar>
				</View>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	fadeFlex: {flex: 1},
	centerFill: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	header: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		overflow: 'hidden',
		zIndex: 10,
	},
	headerRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
	},
	headerActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	headerTitle: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: 1},
	headerTitleAccent: {color: colors.accent},
	headerIconBtn: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
	headerCreatePressed: {opacity: 0.6},
	// Floats over the world, below the header — box-none so drag
	// gestures pass through the empty space between markers/chips to
	// the world underneath.
	overlayTop: {position: 'absolute', left: 0, right: 0, zIndex: 5, gap: spacing.xs, paddingTop: spacing.sm},
	presenceRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg},
	presenceMark: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.5,
		borderColor: colors.borderSoft,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		backgroundColor: colors.glass2,
	},
	presenceCreate: {borderStyle: 'dashed', borderColor: colors.borderStrong},
	presenceMarkUnseen: {borderColor: colors.accent},
	presenceImage: {width: '100%', height: '100%'},
	presenceInitial: {color: colors.textFaint, fontSize: 13, fontWeight: typography.weightBold},
	presenceOverflow: {backgroundColor: colors.glass3},
	presenceOverflowText: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	trendingRail: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg},
	trendingChip: {paddingHorizontal: spacing.sm, paddingVertical: 5},
	trendingChipText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	// Docked at the bottom, over the world — the one real reading
	// surface for whichever post is currently focused.
	hudWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8},
	hud: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md},
	bylineRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
	bylineMark: {
		width: 22,
		height: 22,
		borderRadius: radius.sm / 2,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
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
	mediaBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
	mediaBadgeText: {color: colors.accent, fontSize: 10, fontWeight: typography.weightBold},
	// Capped — a preview panel, not the full reading destination.
	// Tapping anywhere on the panel opens the real PostDetailScreen for
	// the complete text.
	hudTextClip: {maxHeight: 92, overflow: 'hidden'},
	text: {
		color: colors.text,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightMedium,
		letterSpacing: -0.1,
		lineHeight: typography.sizeLg * 1.32,
	},
	trackRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm},
	trackTitle: {flexShrink: 1, color: colors.textDim, fontSize: typography.sizeXs, letterSpacing: 0.2},
	stats: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm},
	statItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	statText: {color: colors.textFaint, fontSize: typography.sizeSm, fontVariant: ['tabular-nums']},
	statTextLiked: {color: colors.accent},
});
