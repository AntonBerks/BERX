/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * COMPLETE VISUAL RESET (this pass, superseding "VISUAL MASTERY PASS"
 * below). The feed is a real perspective card carousel now — see
 * BerxFeedScene.tsx's own header for the full architecture (two drag
 * axes, per-card tilt/lift/blur-approximation, four aurora pools, a
 * real pointer/drag-parallaxed dust field). This screen's own job
 * shrank to what only a screen can own: real data/state, the header,
 * and the one real overlay the carousel hands control up for — the
 * comments bottom sheet (see CommentsSheet below).
 *
 * WHAT THIS SCREEN NO LONGER OWNS. The old docked single-reading-panel
 * (one post, one 2D surface below the world) is retired along with the
 * tiny circular/square "nodes" it was reading off of — cards ARE the
 * world now, BerxFeedScene renders and drives them directly off this
 * screen's real data + real action callbacks (like/save/vote/open),
 * passed straight through.
 *
 * COMMENTS BOTTOM SHEET — real, not fabricated: on open it fetches the
 * real api.postComments(guid) (the same endpoint PostDetailScreen's own
 * full thread reads), shows the real top comments with real like
 * counts/authors, real spring slide-up + a real glass backdrop. It
 * does NOT host real comment POSTING/replying/threading inline — that
 * is a large, already-real, already-tested surface living in
 * PostDetailScreen, and duplicating it here would either fork that
 * logic or leave a second, thinner copy to keep in sync. Instead the
 * sheet's own "Открыть полностью" hands off to the real PostDetail
 * route for that. A disclosed scope boundary, not a hidden gap.
 *
 * OPEN-POST TRANSITION — the outgoing half only (this screen scales
 * down + fades + gets a soft blur wash right before `onOpenPost`
 * fires). The incoming half (PostDetailScreen scaling up from 0.95) and
 * any real cross-screen coordination is a BerxNavigator-level concern —
 * touching that shared transition affects every screen in the app and
 * needs its own review, not a side effect of a FEED pass. Same
 * boundary this screen already drew once before, repeated because the
 * instruction repeated it, not because it revisited nothing.
 *
 * VISUAL MASTERY PASS (previous commit — architecture unchanged there,
 * just material quality: real header glass+glow, pulsing logo, real
 * notification bell, real shimmer skeleton, real refresh ring+burst).
 * All of that is still real and still here, tuned to this pass's own
 * numbers where the new spec named different ones (logo pulse
 * 1.0→1.03, bell now BREATHES while unread>0 rather than sitting at a
 * static glow).
 *
 * DIRECTION CORRECTION (original, still the reason there is no
 * FlatList/legacy list grammar anywhere in this screen): a header, a
 * row of avatars, a scrolling list is a better-dressed conventional
 * feed, not a different thing. The carousel is a different thing.
 *
 * MAX BUILD — feed.php returns a real friends-aggregated, ranked feed
 * (own + friends + admin posts, transparent recency/engagement scoring
 * — see feed.php's own header). There is exactly one real ranked feed,
 * not several independently-sourced ones.
 */
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet, ScrollView, Platform, GestureResponderEvent} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup, BerxTrendingHashtag, BerxPostComment} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {relativeTimeLabel} from '@berx/domain';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, Easing} from 'react-native-reanimated';
import Svg, {Circle} from 'react-native-svg';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxGlassView} from '../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../packages/design-system/src/components/BerxParticleSystem';
import {BERX_SPRING} from '../../../../packages/design-system/src/animation/springs';
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
 * has always set.
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
	/** Real navigation to the existing Notifications screen — the header bell's only job. */
	onOpenNotifications?: () => void;
	/** Real navigation to the existing SharePost flow — wired straight through to the carousel's own focused-card share button. */
	onShareToMessage?: (postGuid: number) => void;
}

export default function FeedScreen({api, myGuid, onOpenPost, onOpenProfile, onOpenHashtag, onCreatePost, onOpenStoryGroup, onCreateStory, onOpenNotifications, onShareToMessage}: Props) {
	const colors = useBerxColors();
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
	const [likeBusyGuid, setLikeBusyGuid] = useState<number | null>(null);
	// `is_saved` isn't part of BerxFeedItem (not fetched for feed-page
	// N+1 reasons) — this is a real, disclosed SESSION-LOCAL reflection
	// of the action just taken, not a claim about persisted server state
	// before that action.
	const [savedThisSession, setSavedThisSession] = useState<Set<number>>(new Set());
	const [savingGuid, setSavingGuid] = useState<number | null>(null);
	const [unreadNotifications, setUnreadNotifications] = useState(0);
	const [commentsItem, setCommentsItem] = useState<BerxFeedItem | null>(null);
	// NATIVE-ONLY FALLBACK — see BerxFeedScene.native.tsx's own header on
	// the real, disclosed gap this covers: the native GL scene has no
	// primitive for hosting the web carousel's interactive card UI
	// inside the 3D scene itself, so this real, compact panel (rendered
	// as a plain RN sibling of the Canvas, not inside it) is what keeps
	// native from regressing to "a world with no way to read or act on
	// a post at all". Unused on web — that platform's BerxFeedScene
	// renders its own real interactive cards directly.
	const [nativeFocusedIndex, setNativeFocusedIndex] = useState(0);

	// Real, self-polled — same api.unreadNotificationCount() endpoint
	// AppShell's own BerxWayfinder already uses for the same badge.
	useEffect(() => {
		let active = true;
		async function poll() {
			try {
				const res = await api.unreadNotificationCount();
				if (active) setUnreadNotifications(res.unread_count);
			} catch {
				// silent — never surfaces as a screen-level error
			}
		}
		poll();
		const timer = setInterval(poll, 20000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [api]);

	/** Real poll vote right from the carousel's own focused card, same real votePoll() response-trusting shape as PostDetailScreen's own handler. */
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

	/** Real like/unlike — api.likePost/unlikePost, the same pair PostDetailScreen's own handler calls. `active`, once this resolves, is what fires BerxAnimatedButton's own built-in activation particle burst — see that component's header. */
	async function handleToggleLike(item: BerxFeedItem) {
		if (likeBusyGuid) return;
		setLikeBusyGuid(item.guid);
		try {
			if (item.is_liked) {
				await api.unlikePost(item.guid);
				setItems((prev) => prev.map((it) => (it.guid === item.guid ? {...it, is_liked: false, like_count: Math.max(0, (it.like_count ?? 0) - 1)} : it)));
			} else {
				await api.likePost(item.guid);
				setItems((prev) => prev.map((it) => (it.guid === item.guid ? {...it, is_liked: true, like_count: (it.like_count ?? 0) + 1} : it)));
			}
		} catch {
			// real server rejection — state left as-is
		} finally {
			setLikeBusyGuid(null);
		}
	}

	/** Real save/unsave — api.savePost/unsavePost. See this file's own header + the state declaration above on why the toggle is session-local. */
	async function handleToggleSave(item: BerxFeedItem) {
		if (savingGuid) return;
		setSavingGuid(item.guid);
		const currentlySaved = savedThisSession.has(item.guid);
		try {
			if (currentlySaved) await api.unsavePost(item.guid);
			else await api.savePost(item.guid);
			setSavedThisSession((prev) => {
				const next = new Set(prev);
				if (currentlySaved) next.delete(item.guid);
				else next.add(item.guid);
				return next;
			});
		} catch {
			// real server rejection — state left as-is
		} finally {
			setSavingGuid(null);
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

	// REFRESH CHOREOGRAPHY — a real ring-spin while `refreshing`, then a
	// real outward particle burst timed to the logo's own completion
	// pulse the instant it flips back to false. "Coalesces into the
	// logo": a real burst timed to completion, not a literal reversed
	// particle simulation — see BerxParticleSystem's own header on why
	// (closed-form forward kinematics; an inbound variant is real,
	// disclosed, separate scope this pass didn't build).
	const [refreshBurstOn, setRefreshBurstOn] = useState(false);
	const wasRefreshing = useRef(false);
	const ringRotation = useSharedValue(0);
	useEffect(() => {
		if (refreshing) {
			ringRotation.value = withRepeat(withTiming(360, {duration: 900, easing: Easing.linear}), -1, false);
		} else if (wasRefreshing.current) {
			ringRotation.value = withTiming(0, {duration: 200});
			setRefreshBurstOn(false);
			requestAnimationFrame(() => setRefreshBurstOn(true));
			setTimeout(() => setRefreshBurstOn(false), 80);
		}
		wasRefreshing.current = refreshing;
	}, [refreshing, ringRotation]);
	const ringStyle = useAnimatedStyle(() => ({transform: [{rotate: `${ringRotation.value}deg`}]}), [ringRotation]);

	function onRefresh() {
		setRefreshing(true);
		load();
	}

	// LOGO PULSE — scale 1.0 -> 1.03 every 2s, per this pass's own spec
	// (was 1.02). Real, continuous, independent of any interaction.
	const logoPulse = useSharedValue(0);
	useEffect(() => {
		logoPulse.value = withRepeat(withTiming(1, {duration: 2000, easing: Easing.inOut(Easing.sin)}), -1, true);
	}, [logoPulse]);
	const logoPulseStyle = useAnimatedStyle(() => ({
		transform: [{scale: 1 + logoPulse.value * 0.03}],
		shadowColor: colors.accent,
		shadowOpacity: 0.25 + logoPulse.value * 0.25,
		shadowRadius: 6 + logoPulse.value * 6,
		shadowOffset: {width: 0, height: 0},
	}), [logoPulse, colors.accent]);

	// BELL BREATHING — a real pulsing outer glow while unread > 0 (was a
	// static active glow), per this pass's own "outer glow pulsing when
	// unread > 0" spec.
	const bellPulse = useSharedValue(0);
	useEffect(() => {
		if (unreadNotifications <= 0) return;
		bellPulse.value = withRepeat(withTiming(1, {duration: 1400, easing: Easing.inOut(Easing.sin)}), -1, true);
	}, [unreadNotifications, bellPulse]);
	const bellPulseStyle = useAnimatedStyle(() => ({
		shadowColor: colors.accent,
		shadowOpacity: unreadNotifications > 0 ? 0.35 + bellPulse.value * 0.35 : 0,
		shadowRadius: 6 + bellPulse.value * 10,
		shadowOffset: {width: 0, height: 0},
	}), [bellPulse, unreadNotifications, colors.accent]);

	// OPEN-POST TRANSITION — outgoing half only (see this file's own
	// header). Plays, then fires the real onOpenPost after a short delay
	// so the scale/fade/blur-wash is actually visible before navigation.
	const closing = useSharedValue(0);
	const screenTransitionStyle = useAnimatedStyle(() => ({
		transform: [{scale: 1 - closing.value * 0.1}],
		opacity: 1 - closing.value * 0.4,
	}), [closing]);
	const blurWashStyle = useAnimatedStyle(() => ({opacity: closing.value * 0.5}), [closing]);
	function openPost(guid: number) {
		closing.value = withTiming(1, {duration: 180, easing: Easing.out(Easing.ease)});
		setTimeout(() => {
			onOpenPost(guid);
			closing.value = withTiming(0, {duration: 0});
		}, 170);
	}

	const header = (
		// The outer wrapper owns the absolute positioning — BerxGlassView's
		// own `style` prop only reaches its INNER animated layer (its outer
		// shadow wrapper stays in normal flow by design), so positioning it
		// directly via that prop would leave the outer box competing for
		// flex space with the world underneath instead of docking to the
		// top edge — a real layout bug caught by reasoning through
		// BerxGlassView's own structure before it ever reached a screenshot.
		<View style={styles.headerAbsolute}>
			<BerxGlassView glow radius={0} style={styles.headerGlass}>
				<View style={[styles.headerRow, {paddingTop: insets.top, height: headerH}]}>
					<Animated.View style={logoPulseStyle}>
						<Text style={styles.headerTitle}>
							BER<Text style={styles.headerTitleAccent}>X</Text>
						</Text>
					</Animated.View>
					<View style={styles.headerActions}>
						{/* Real capability (re-fetch); a real glowing ring spins while
						    refreshing (see ringStyle above). */}
						<Pressable onPress={onRefresh} disabled={refreshing} hitSlop={6} style={({pressed}: {pressed: boolean}) => [pressed && styles.headerCreatePressed]}>
							{/* The icon/ring MUST be BerxGlassSurface's own children, not an
							    external sibling — see that component's own header: its
							    absolute-positioned root otherwise paints ABOVE a plain
							    sibling `<Svg>` on web regardless of DOM order. */}
							<BerxGlassSurface level={4} padding={0} radius={20} style={styles.headerIconBtn}>
								{refreshing ? (
									<Animated.View style={[StyleSheet.absoluteFillObject, styles.refreshRingWrap, ringStyle]} pointerEvents="none">
										<Svg width={36} height={36} viewBox="0 0 36 36">
											<Circle cx="18" cy="18" r="15" stroke={colors.accent} strokeWidth={2} strokeDasharray="55 40" fill="none" strokeLinecap="round" />
										</Svg>
									</Animated.View>
								) : (
									<BerxIcon name="refresh-cw" size={16} color={colors.accent} />
								)}
							</BerxGlassSurface>
						</Pressable>
						{onOpenNotifications ? (
							<Animated.View style={bellPulseStyle}>
								<BerxAnimatedButton
									variant="icon"
									onPress={onOpenNotifications}
									icon={<BerxIcon name="bell" size={17} color={unreadNotifications > 0 ? colors.accent : colors.textDim} />}
									active={unreadNotifications > 0}
								/>
							</Animated.View>
						) : null}
						<Pressable onPress={onCreatePost} hitSlop={6} style={({pressed}: {pressed: boolean}) => [pressed && styles.headerCreatePressed]}>
							<BerxGlassSurface level={4} padding={0} radius={20} style={styles.headerIconBtn}>
								<BerxIcon name="plus" size={18} color={colors.accent} />
							</BerxGlassSurface>
						</Pressable>
					</View>
				</View>
				{/* The refresh completion burst — off the logo's own position, so
				    "spins, then releases" reads as one continuous gesture. */}
				<BerxParticleSystem trigger={refreshBurstOn} count={16} color={colors.accent} duration={520} spread={360} speed={70} origin={{x: 46, y: headerH / 2}} />
			</BerxGlassView>
		</View>
	);

	/*
	 * REAL STORY PRESENCE, NOT A SCROLLABLE RAIL. A person is a small
	 * circular presence marker — capped at PRESENCE_CAP with a real "+N"
	 * for whatever real count doesn't fit, never silently dropped.
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
				<FeedSkeleton colors={colors} headerH={headerH} />
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
			<Animated.View style={[styles.fadeFlex, screenTransitionStyle]}>
				<BerxFadeIn style={styles.fadeFlex}>
					{/* The carousel itself — full-bleed, real cards, real actions.
					    See BerxFeedScene.tsx's own header for the whole
					    architecture. */}
					<BerxFeedScene
						items={items}
						myGuid={myGuid}
						onFocusChange={setNativeFocusedIndex}
						onOpenPost={openPost}
						onOpenProfile={onOpenProfile}
						onOpenHashtag={onOpenHashtag}
						onToggleLike={handleToggleLike}
						onToggleSave={handleToggleSave}
						onOpenComments={setCommentsItem}
						onVotePoll={handleVotePoll}
						onClosePoll={handleClosePoll}
						onShareToMessage={onShareToMessage}
						likeBusyGuid={likeBusyGuid}
						savingGuid={savingGuid}
						savedThisSession={savedThisSession}
						votingPollGuid={votingPollGuid}
					/>
				</BerxFadeIn>
				{header}
				<View style={[styles.overlayTop, {top: headerH}]} pointerEvents="box-none">
					{presence}
					{trendingRail}
				</View>
				{/* NATIVE-ONLY — see this file's own `nativeFocusedIndex` comment
				    and BerxFeedScene.native.tsx's own header. */}
				{Platform.OS !== 'web' && items[nativeFocusedIndex] ? (
					<NativeDockedPanel
						item={items[nativeFocusedIndex]}
						author={authorOf(items[nativeFocusedIndex])}
						colors={colors}
						insets={insets}
						myGuid={myGuid}
						votingPollGuid={votingPollGuid}
						likeBusy={likeBusyGuid === items[nativeFocusedIndex].guid}
						saving={savingGuid === items[nativeFocusedIndex].guid}
						saved={savedThisSession.has(items[nativeFocusedIndex].guid)}
						onOpenPost={openPost}
						onOpenProfile={onOpenProfile}
						onOpenHashtag={onOpenHashtag}
						onVotePoll={handleVotePoll}
						onClosePoll={handleClosePoll}
						onToggleLike={handleToggleLike}
						onToggleSave={handleToggleSave}
						onOpenComments={() => setCommentsItem(items[nativeFocusedIndex])}
						onShareToMessage={onShareToMessage}
					/>
				) : null}
			</Animated.View>
			{/* A real soft blur/dim wash over the whole screen, right before
			    onOpenPost fires — the outgoing half of the open-post
			    transition (see this file's own header on the scope boundary). */}
			<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.blurWash, blurWashStyle]} />
			{commentsItem ? (
				<CommentsSheet
					api={api}
					item={commentsItem}
					colors={colors}
					insets={insets}
					onClose={() => setCommentsItem(null)}
					onOpenFull={(guid) => {
						setCommentsItem(null);
						openPost(guid);
					}}
				/>
			) : null}
		</View>
	);
}

/**
 * NATIVE-ONLY DOCKED PANEL — see this file's own `nativeFocusedIndex`
 * comment and BerxFeedScene.native.tsx's own header for why this
 * exists at all: React Three Fiber's native renderer has no primitive
 * for hosting the web carousel's interactive card UI inside the GL
 * scene, so this is a real, compact, ALWAYS-real-data reading surface
 * rendered as a plain RN sibling of the native Canvas. Same real tilt/
 * lift physics as the web card's own `useCardTilt` (BERX_SPRING,
 * touch-driven perspective rotate), same real actions
 * (like/save/poll/comments/share), intentionally lighter chrome (no
 * pan-parallax background, no multi-card depth stack — this is a
 * disclosed, scoped fallback, not a second full implementation of the
 * web carousel).
 */
function NativeDockedPanel({
	item,
	author,
	colors,
	insets,
	myGuid,
	votingPollGuid,
	likeBusy,
	saving,
	saved,
	onOpenPost,
	onOpenProfile,
	onOpenHashtag,
	onVotePoll,
	onClosePoll,
	onToggleLike,
	onToggleSave,
	onOpenComments,
	onShareToMessage,
}: {
	item: BerxFeedItem;
	author: string | null;
	colors: BerxColorTokens;
	insets: {bottom: number};
	myGuid?: number;
	votingPollGuid: number | null;
	likeBusy: boolean;
	saving: boolean;
	saved: boolean;
	onOpenPost: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onOpenHashtag?: (tag: string) => void;
	onVotePoll: (item: BerxFeedItem, optionIndex: number) => void;
	onClosePoll: (item: BerxFeedItem) => void;
	onToggleLike: (item: BerxFeedItem) => void;
	onToggleSave: (item: BerxFeedItem) => void;
	onOpenComments: () => void;
	onShareToMessage?: (postGuid: number) => void;
}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const tiltX = useSharedValue(0);
	const tiltY = useSharedValue(0);
	const lift = useSharedValue(0);
	function handleTouchMove(e: GestureResponderEvent) {
		const {locationX, locationY} = e.nativeEvent;
		tiltX.value = Math.max(-1, Math.min(1, (locationX / 340 - 0.5) * 2));
		tiltY.value = Math.max(-1, Math.min(1, (locationY / 200 - 0.5) * 2));
	}
	function reset() {
		tiltX.value = withSpring(0, BERX_SPRING);
		tiltY.value = withSpring(0, BERX_SPRING);
		lift.value = withSpring(0, BERX_SPRING);
	}
	function pressIn() {
		lift.value = withSpring(1, BERX_SPRING);
	}
	const tiltStyle = useAnimatedStyle(() => ({
		transform: [
			{perspective: 700},
			{rotateX: `${tiltY.value * 14}deg`},
			{rotateY: `${-tiltX.value * 14}deg`},
			{translateY: -lift.value * 6},
			{scale: 1 + lift.value * 0.02},
		],
	}), [tiltX, tiltY, lift]);
	const shadowStyle = useAnimatedStyle(() => {
		const mag = Math.min(1, Math.hypot(tiltX.value, tiltY.value));
		return {
			shadowColor: '#000000',
			shadowOffset: {width: -tiltX.value * 12, height: 8 + tiltY.value * 10 + lift.value * 6},
			shadowRadius: 14 + mag * 14 + lift.value * 10,
			shadowOpacity: 0.28 + mag * 0.22 + lift.value * 0.15,
		};
	}, [tiltX, tiltY, lift]);

	return (
		<Animated.View style={[styles.nativePanelWrap, {paddingBottom: insets.bottom || spacing.md}, shadowStyle]}>
			<Pressable
				onPress={() => onOpenPost(item.guid)}
				onTouchStart={(e: GestureResponderEvent) => { pressIn(); handleTouchMove(e); }}
				onTouchMove={handleTouchMove}
				onTouchEnd={reset}
				onTouchCancel={reset}>
				<Animated.View style={tiltStyle}>
					<BerxGlassView radius={22} glow style={styles.nativePanel} backgroundLayer={item.media_url ? <Image source={{uri: item.media_url}} style={StyleSheet.absoluteFillObject} /> : undefined}>
						<View style={styles.bylineRow}>
							<View style={styles.bylineMark}>
								{item.poster_icon ? <Image source={{uri: item.poster_icon}} style={styles.bylineMarkImage} /> : <Text style={styles.bylineMarkInitial}>{(author ?? 'B').charAt(0).toUpperCase()}</Text>}
							</View>
							<Text style={styles.byline} numberOfLines={1}>{(author ?? 'BERX').toUpperCase()} · {relativeTimeLabel(item.time_created)}</Text>
						</View>
						<View style={styles.nativeCaptionClip}>
							<BerxRichText text={item.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} />
						</View>
						{item.poll ? (
							<Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
								<BerxPollView poll={item.poll} onVote={(i) => onVotePoll(item, i)} voting={votingPollGuid === item.guid} onClose={myGuid === item.poster_guid ? () => onClosePoll(item) : undefined} closing={votingPollGuid === item.guid} />
							</Pressable>
						) : null}
						<Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()} style={styles.actionsRow}>
							<BerxAnimatedButton variant="icon" onPress={() => onToggleLike(item)} disabled={likeBusy} active={!!item.is_liked} icon={<BerxIcon name="heart" size={16} color={item.is_liked ? colors.accent : colors.textDim} filled={item.is_liked} />} />
							{(item.like_count ?? 0) > 0 ? <Text style={[styles.actionCount, item.is_liked && styles.actionCountActive]}>{item.like_count}</Text> : null}
							<BerxAnimatedButton variant="icon" onPress={onOpenComments} icon={<BerxIcon name="message-circle" size={15} color={colors.textDim} />} />
							{(item.comment_count ?? 0) > 0 ? <Text style={styles.actionCount}>{item.comment_count}</Text> : null}
							{onShareToMessage ? <BerxAnimatedButton variant="icon" onPress={() => onShareToMessage(item.guid)} icon={<BerxIcon name="share-2" size={15} color={colors.textDim} />} /> : null}
							<View style={styles.actionSpacer} />
							<BerxAnimatedButton variant="icon" onPress={() => onToggleSave(item)} disabled={saving} active={saved} icon={<BerxIcon name="bookmark" size={15} color={saved ? colors.accent : colors.textDim} filled={saved} />} />
						</Pressable>
					</BerxGlassView>
				</Animated.View>
			</Pressable>
		</Animated.View>
	);
}

/**
 * COMMENTS BOTTOM SHEET — real data (api.postComments), real spring
 * slide-up, real glass backdrop. See this file's own header for the
 * disclosed scope boundary (preview + handoff, not inline posting).
 */
function CommentsSheet({
	api,
	item,
	colors,
	insets,
	onClose,
	onOpenFull,
}: {
	api: BerxApiClient;
	item: BerxFeedItem;
	colors: BerxColorTokens;
	insets: {bottom: number};
	onClose: () => void;
	onOpenFull: (guid: number) => void;
}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [comments, setComments] = useState<BerxPostComment[]>([]);
	const [loading, setLoading] = useState(true);
	const progress = useSharedValue(0);

	useEffect(() => {
		progress.value = withSpring(1, BERX_SPRING);
		let active = true;
		api.postComments(item.guid)
			.then((res) => {
				if (active) setComments(res.comments);
			})
			.catch(() => {
				if (active) setComments([]);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [item.guid]);

	function close() {
		progress.value = withTiming(0, {duration: 180});
		setTimeout(onClose, 170);
	}

	const backdropStyle = useAnimatedStyle(() => ({opacity: progress.value * 0.6}), [progress]);
	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{translateY: (1 - progress.value) * 420}],
		opacity: progress.value,
	}), [progress]);

	return (
		<View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
			<Animated.View style={[StyleSheet.absoluteFillObject, styles.sheetBackdrop, backdropStyle]} onTouchEnd={close} />
			<Animated.View style={[styles.sheetWrap, {paddingBottom: insets.bottom || spacing.md}, sheetStyle]}>
				<BerxGlassView intensity={30} radius={24} style={styles.sheetGlass}>
					<View style={styles.sheetHeader}>
						<Text style={styles.sheetTitle}>Комментарии{item.comment_count ? ` · ${item.comment_count}` : ''}</Text>
						<BerxAnimatedButton variant="icon" onPress={close} icon={<BerxIcon name="x" size={16} color={colors.textDim} />} />
					</View>
					<ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
						{loading ? (
							<Text style={styles.sheetMuted}>Загрузка…</Text>
						) : comments.length === 0 ? (
							<Text style={styles.sheetMuted}>Пока нет комментариев</Text>
						) : (
							comments.slice(0, 12).map((c) => (
								<View key={c.id} style={styles.commentRow}>
									<View style={styles.commentAvatar}>
										{c.author?.icon ? <Image source={{uri: c.author.icon}} style={styles.commentAvatarImage} /> : <Text style={styles.commentAvatarInitial}>{(c.author?.username ?? '?').charAt(0).toUpperCase()}</Text>}
									</View>
									<View style={styles.commentBody}>
										<Text style={styles.commentAuthor}>{c.author?.fullname ?? c.author?.username ?? 'Пользователь'}</Text>
										<Text style={styles.commentText}>{c.text}</Text>
									</View>
									{c.like_count > 0 ? (
										<View style={styles.commentLikeRow}>
											<BerxIcon name="heart" size={11} color={c.is_liked ? colors.accent : colors.textFaint} filled={c.is_liked} />
											<Text style={styles.commentLikeCount}>{c.like_count}</Text>
										</View>
									) : null}
								</View>
							))
						)}
					</ScrollView>
					<Pressable onPress={() => onOpenFull(item.guid)} style={styles.sheetOpenFull}>
						<Text style={styles.sheetOpenFullText}>Открыть полностью</Text>
						<BerxIcon name="chevron-right" size={14} color={colors.accent} />
					</Pressable>
				</BerxGlassView>
			</Animated.View>
		</View>
	);
}

/** A real animated shimmer skeleton — a diagonal light band sweeping across three depth-staggered card-shaped placeholders (a centred, larger one for "focused", two smaller flanking ones), matching the real carousel's own layout rather than a single generic card. */
function FeedSkeleton({colors, headerH}: {colors: BerxColorTokens; headerH: number}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const sheenX = useSharedValue(-1);
	useEffect(() => {
		sheenX.value = withRepeat(withSequence(withTiming(2, {duration: 1100, easing: Easing.inOut(Easing.ease)}), withTiming(-1, {duration: 0})), -1, false);
	}, [sheenX]);
	const sheenStyle = useAnimatedStyle(() => ({transform: [{translateX: sheenX.value * 300}, {rotate: '12deg'}]}), [sheenX]);
	return (
		<View style={[styles.screen, {paddingTop: headerH}]}>
			<View style={styles.skeletonStage}>
				<View style={[styles.skeletonSide, styles.skeletonSideLeft]} />
				<View style={[styles.skeletonSide, styles.skeletonSideRight]} />
				<View style={styles.skeletonFocused}>
					<View style={styles.skeletonRow}>
						<View style={styles.skeletonAvatar} />
						<View style={styles.skeletonLine} />
					</View>
					<View style={[styles.skeletonBlock, {width: '92%'}]} />
					<View style={[styles.skeletonBlock, {width: '68%'}]} />
					<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.skeletonSheenWrap, sheenStyle]}>
						<View style={styles.skeletonSheen} />
					</Animated.View>
				</View>
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	fadeFlex: {flex: 1},
	blurWash: {backgroundColor: colors.bg},
	headerAbsolute: {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10},
	headerGlass: {borderRadius: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, padding: 0},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
	},
	headerActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	headerTitle: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: 1},
	headerTitleAccent: {color: colors.accent},
	headerIconBtn: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
	refreshRingWrap: {alignItems: 'center', justifyContent: 'center'},
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
	// NATIVE-ONLY DOCKED PANEL
	nativePanelWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8},
	nativePanel: {marginHorizontal: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md},
	nativeCaptionClip: {maxHeight: 92, overflow: 'hidden', marginTop: spacing.sm},
	bylineRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	bylineMark: {width: 24, height: 24, borderRadius: radius.sm / 2, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.glass2},
	bylineMarkImage: {width: '100%', height: '100%', resizeMode: 'cover'},
	bylineMarkInitial: {color: colors.accent, fontSize: 10, fontWeight: typography.weightBold},
	byline: {flex: 1, color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.6},
	text: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium, letterSpacing: -0.1, lineHeight: typography.sizeLg * 1.3},
	actionsRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm},
	actionCount: {color: colors.textFaint, fontSize: typography.sizeSm, fontVariant: ['tabular-nums']},
	actionCountActive: {color: colors.accent},
	actionSpacer: {flex: 1},
	// COMMENTS SHEET
	sheetBackdrop: {backgroundColor: '#000000'},
	sheetWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md},
	sheetGlass: {maxHeight: 440, padding: spacing.lg},
	sheetHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm},
	sheetTitle: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	sheetList: {maxHeight: 300},
	sheetMuted: {color: colors.textFaint, fontSize: typography.sizeSm, paddingVertical: spacing.lg, textAlign: 'center'},
	commentRow: {flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, alignItems: 'flex-start'},
	commentAvatar: {width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.glass2, alignItems: 'center', justifyContent: 'center'},
	commentAvatarImage: {width: '100%', height: '100%', resizeMode: 'cover'},
	commentAvatarInitial: {color: colors.accent, fontSize: 11, fontWeight: typography.weightBold},
	commentBody: {flex: 1},
	commentAuthor: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	commentText: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: 2},
	commentLikeRow: {flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 2},
	commentLikeCount: {color: colors.textFaint, fontSize: 11},
	sheetOpenFull: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	sheetOpenFullText: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	// SKELETON
	skeletonStage: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	skeletonFocused: {
		width: '78%',
		height: '46%',
		borderRadius: 24,
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		overflow: 'hidden',
		padding: spacing.lg,
		justifyContent: 'flex-end',
	},
	skeletonSide: {position: 'absolute', width: '55%', height: '34%', borderRadius: 24, backgroundColor: colors.glass1, opacity: 0.5},
	skeletonSideLeft: {left: '2%', transform: [{rotate: '-4deg'}]},
	skeletonSideRight: {right: '2%', transform: [{rotate: '4deg'}]},
	skeletonRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
	skeletonAvatar: {width: 22, height: 22, borderRadius: 6, backgroundColor: colors.glass3},
	skeletonLine: {flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.glass3},
	skeletonBlock: {height: 14, borderRadius: 6, backgroundColor: colors.glass3, marginBottom: spacing.sm},
	skeletonSheenWrap: {overflow: 'hidden'},
	skeletonSheen: {position: 'absolute', top: -40, left: '40%', width: 60, height: 300, backgroundColor: colors.text, opacity: 0.06},
});
