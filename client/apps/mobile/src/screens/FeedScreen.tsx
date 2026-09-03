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
 * it.
 *
 * RECOMPOSED (not restyled) around media: a photo post used to put its
 * real engagement counts in a flat icon-and-number row printed BELOW
 * the frame, like a caption — the exact generic-list grammar this
 * screen's own header already renamed once and still was. NOW already
 * solved this for real: a floating glass BerxActionRail sitting ON the
 * photograph itself, self-contained for legibility against whatever
 * the photo happens to be (see BerxActionRail's own header — real dark
 * base + hairline per button, not a hope that the photo is dark
 * enough). A feed post's media now uses that SAME rail, at a smaller
 * scale for a card instead of a full-bleed stage, so a photo moment in
 * the feed and a photo moment on NOW read as the same product's two
 * views of one idea rather than two different card languages.
 *
 * PostDetailScreen still owns the actual Like/Comment INTERACTION —
 * that has not changed. Both rail buttons route to onOpenPost, the
 * same as tapping anywhere else on the unit; this is still a reading
 * of real state (count, is_liked), not a new inline toggle. A text-only
 * post (no photo — no surface to float glass on) keeps the plain
 * stat row.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Image, FlatList, RefreshControl, StyleSheet, Pressable, GestureResponderEvent} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup, BerxTrendingHashtag} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState, BerxEmptyState, BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxStoryRail} from '../../../../packages/design-system/src/components/BerxStoryRail';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionRail} from '../../../../packages/design-system/src/components/BerxActionRail';
import type {BerxRailAction} from '../../../../packages/design-system/src/components/BerxActionRail';
import {BlurView} from 'expo-blur';

import {useBerxColors, useBerxGlass} from '../../../../packages/design-system/src/theme';
import {useBerxInsets} from '../../../../packages/design-system/src/insets';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

/**
 * The header's own real content height (title line + vertical padding),
 * NOT counting the safe-area inset — that is added separately per
 * device, below. A fixed number rather than an onLayout measurement:
 * the alternative is a one-frame jump the instant the real height
 * resolves, and the header's content never changes shape, so nothing
 * is actually being guessed here — this is what it measures to.
 */
const HEADER_CONTENT_H = 52;

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
	const glass = useBerxGlass();
	const insets = useBerxInsets();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const headerH = HEADER_CONTENT_H + insets.top;
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

	/*
	 * RECOMPOSED, not just restyled. The header used to be a plain
	 * in-flow View — flush black on black, no depth from the content
	 * beneath it, and laid out from y=0 with no safe-area awareness at
	 * all, so on any real device with a notch or status bar the BERX
	 * wordmark sat partly under it. `useBerxInsets()` has existed in
	 * this package since it was written specifically to fix that exact
	 * defect, and no screen had ever actually called it — a real, live
	 * rendering bug, not a styling preference.
	 *
	 * It now floats ABOVE the scrolling feed on real glass — a genuine
	 * BlurView backdrop (see BerxGlassSurface's own header for what that
	 * means), so content visibly softens as it passes underneath rather
	 * than vanishing behind a flat panel. The bar composes the SAME
	 * level-2 recipe BerxGlassSurface uses (blur + fill + hairline) but
	 * by hand rather than through that component: BerxGlassSurface
	 * draws a border on all four edges, which is correct for a floating
	 * panel and wrong for a full-bleed bar — it would draw a visible
	 * hairline down the screen's own left/right edges. A bar gets a
	 * hairline on its bottom edge only, the edge that actually separates
	 * it from the content sliding underneath.
	 *
	 * The compose control IS a floating panel — a real glass capsule,
	 * not a bare glyph adrift on the background. That one legitimately
	 * uses BerxGlassSurface as designed.
	 */
	const barGlass = glass[2];
	const header = (
		<View style={[styles.header, {height: headerH}]}>
			<BlurView pointerEvents="none" style={StyleSheet.absoluteFillObject} intensity={barGlass.blurRadius} tint="dark" />
			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {backgroundColor: barGlass.fill}]} />
			<View pointerEvents="none" style={[styles.headerHairline, {backgroundColor: barGlass.border}]} />
			<View style={[styles.headerRow, {paddingTop: insets.top}]}>
				<Text style={styles.headerTitle}>
					BER<Text style={styles.headerTitleAccent}>X</Text>
				</Text>
				<Pressable onPress={onCreatePost} hitSlop={6} style={({pressed}: {pressed: boolean}) => [pressed && styles.headerCreatePressed]}>
					<BerxGlassSurface level={3} padding={0} radius={20} style={styles.headerCreate}>
						<BerxIcon name="plus" size={18} color={colors.accent} />
					</BerxGlassSurface>
				</Pressable>
			</View>
		</View>
	);

	/*
	 * ONE story rail, not two. This screen reimplemented the rail inline
	 * — its own FlatList, its own tiles, its own eleven styles — while
	 * BerxStoryRail already existed and NOW was using it. Two
	 * implementations of the same concept, showing the same data, and
	 * they did not even agree on the SHAPE: squared tiles here, circular
	 * portraits there.
	 *
	 * Both shapes carried a written justification and the two
	 * contradicted each other. Resolved toward the shared component: it
	 * is the better implementation (real unseen state, create AND
	 * see-all tiles, media-ink switching), its shape cites the reference
	 * set, and one shape on both screens beats a per-screen preference on
	 * either.
	 */
	const storyRail = (
		<View style={styles.storyRailWrap}>
			<BerxStoryRail
				onCreate={onCreateStory}
				createLabel="Ваша история"
				items={storyGroups.map((g: BerxStoryFeedGroup) => ({
					key: String(g.owner_guid),
					label: g.owner_username ?? `#${g.owner_guid}`,
					iconUrl: g.owner_icon,
					unseen: g.has_unseen,
					onPress: () => onOpenStoryGroup(g),
				}))}
			/>
		</View>
	);


	/*
	 * Real glass pills, not the flat `colors.surface` fill they used to
	 * carry. Material consistency: a chip and the header's own compose
	 * capsule are both level-1/3 glass now instead of two different
	 * ad-hoc fills that happened to both be roundish.
	 */
	const trendingRail =
		trending.length > 0 && onOpenHashtag ? (
			<View style={styles.trendingRail}>
				{trending.slice(0, 8).map((h: BerxTrendingHashtag) => (
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
				{/* The skeleton has to be the shape of the thing that arrives, or
				    the content visibly jumps when it lands. This one had drifted:
				    it drew a 36px avatar over a two-line author column, which was
				    the old card layout — the editorial unit has a 22px squared
				    mark and a SINGLE byline line. Matched back to it, including a
				    media block on the units likeliest to have one, so the page
				    settles instead of reflowing. */}
				<View style={[styles.skeletonList, {paddingTop: headerH}]}>
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

	return (
		<View style={styles.screen}>
			<BerxFadeIn style={styles.fadeFlex}>
				<FlatList
					style={styles.list}
					contentContainerStyle={{paddingTop: headerH}}
					data={items}
					keyExtractor={(item: BerxFeedItem) => String(item.guid)}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} progressViewOffset={headerH} />}
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
							/* A single hairline in one flat colour used to be the whole
							   edge treatment — a real photo just stopped at a grey line.
							   The lit top edge is the same "one light source wrapping
							   one edge" language BerxOrb/BerxGlassPanel already use
							   product-wide, applied here without turning this into a
							   full glass panel (a photo needs to stay legible, not sit
							   behind a translucent tint). Not wrapped in Berx3DTilt: this
							   whole card is already one Pressable that opens the post,
							   and Berx3DTilt installs its own touch responder — nesting
							   it here would make ONLY the photo silently stop opening
							   the post, a real interaction regression for a decorative
							   touch. Real 3D depth response belongs on a surface that
							   owns its own touch, not one already claimed by a parent. */
							<View style={styles.mediaFrame}>
								<Image source={{uri: item.media_url}} style={styles.media} resizeMode="cover" />
								<View pointerEvents="none" style={styles.mediaEdgeLight} />
								{item.media_count && item.media_count > 1 ? (
									<View style={styles.mediaCountBadge}>
										<Text style={styles.mediaCountText}>1/{item.media_count}</Text>
									</View>
								) : null}
								{/* Real engagement, floating ON the photograph — the same
								    BerxActionRail NOW's own stage uses, at card scale
								    instead of full-bleed. Both buttons route to onOpenPost,
								    same as tapping anywhere else on the unit: this reads
								    real state (count, is_liked), it does not add a new
								    inline like/comment control that didn't exist before. */}
								<BerxActionRail
									size={34}
									style={styles.mediaRail}
									actions={
										[
											{key: 'like', icon: 'heart', count: item.like_count, active: item.is_liked, onPress: () => onOpenPost(item.guid)},
											{key: 'comment', icon: 'message-circle', count: item.comment_count, onPress: () => onOpenPost(item.guid)},
										] as BerxRailAction[]
									}
								/>
							</View>
						) : null}
						{/* Real attached soundtrack. track_title is resolved server-side
						    once per distinct track on the page and was never displayed,
						    so a post WITH music looked identical to one without.

						    Marked with the family's own `music` glyph. I first drew an
						    abstract accent bar here, before finding the licensed family
						    — the same mistake as the hand-drawn icons, and NOW showed
						    the same data with a third treatment again. */}
						{item.track_title ? (
							<BerxGlassSurface level={1} padding={0} radius={radius.pill} style={styles.trackRow}>
								<BerxIcon name="music" size={13} color={colors.accent} />
								<Text style={styles.trackTitle} numberOfLines={1}>{item.track_title}</Text>
							</BerxGlassSurface>
						) : null}
						{/* Drawn with the product's own icon geometry, not emoji. A
						    heart glyph and 💬 render in the OS emoji font — a foreign
						    object, at a size and weight BERX does not control, sitting
						    inside a product built on its own drawn icon set. `is_liked`
						    now reads as colour (the heart is solid either way), which
						    is the honest distinction on a filled mark.

						    MEDIA POSTS SKIP THIS: their engagement now lives on the
						    photo's own floating rail above, so printing the same two
						    numbers again here would just repeat them under the frame.
						    A text-only post has no photo to float glass on, so it
						    keeps the plain row — the right call for a surface that IS
						    just background, not a claim that this row is somehow
						    more honest than the rail. */}
						{!item.media_url && ((item.like_count ?? 0) > 0 || (item.comment_count ?? 0) > 0) ? (
							<View style={styles.stats}>
								{(item.like_count ?? 0) > 0 ? (
									<View style={styles.statItem}>
										<BerxIcon name="heart" size={16} color={item.is_liked ? colors.accent : colors.textFaint}  filled />
										<Text style={[styles.statText, item.is_liked && styles.statTextLiked]}>{item.like_count}</Text>
									</View>
								) : null}
								{(item.comment_count ?? 0) > 0 ? (
									<View style={styles.statItem}>
										<BerxIcon name="message-circle" size={15} color={colors.textFaint}  />
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
			{header}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	// Floats ABOVE the scroll content on real glass — position:absolute
	// + a fixed pixel height (rather than intrinsic sizing) because the
	// FlatList content below needs to know exactly how much top padding
	// clears it, and an intrinsically-sized sibling can't be measured
	// before its own first paint without a layout-shift flash.
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
	// The one edge that actually separates the bar from the content
	// sliding underneath it — not a border on all four sides, which is
	// what BerxGlassSurface draws and why this bar composes the same
	// blur+fill recipe by hand instead of reusing that component.
	headerHairline: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 1},
	headerTitle: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: 1},
	headerTitleAccent: {color: colors.accent},
	headerCreate: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
	headerCreatePressed: {opacity: 0.6},
	list: {backgroundColor: colors.bg},
	storyRailWrap: {borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: spacing.md},
	trendingRail: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	trendingChip: {paddingHorizontal: spacing.sm, paddingVertical: 5},
	trendingChipText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
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
	// One light source wrapping the top edge only — the same restrained
	// "brightest at one edge, gone by the opposite corner" language
	// BerxOrb/BerxGlassPanel use, scaled down to a hairline so the photo
	// underneath stays fully legible instead of sitting behind a tint.
	mediaEdgeLight: {position: 'absolute', top: 0, left: spacing.lg, right: spacing.lg, height: 1, backgroundColor: 'rgba(255,255,255,0.4)'},
	mediaCountBadge: {position: 'absolute', top: spacing.sm, right: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.55)'},
	mediaCountText: {color: colors.white, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	// Bottom-right — clear of the media-count badge, which sits top-right.
	mediaRail: {position: 'absolute', right: spacing.sm, bottom: spacing.sm},
	trackRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		alignSelf: 'flex-start',
		marginTop: spacing.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		maxWidth: '100%',
	},
	trackTitle: {flexShrink: 1, color: colors.textDim, fontSize: typography.sizeXs, letterSpacing: 0.2},
	stats: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md},
	statItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	statText: {color: colors.textFaint, fontSize: typography.sizeSm, fontVariant: ['tabular-nums']},
	statTextLiked: {color: colors.accent},
	separator: {height: 1, backgroundColor: colors.borderSoft, marginHorizontal: spacing.lg},
});
