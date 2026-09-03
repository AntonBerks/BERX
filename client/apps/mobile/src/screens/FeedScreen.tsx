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
 * VISUAL MASTERY PASS — this spatial layout/architecture is UNCHANGED
 * (explicit instruction: no bottom tab bar, no burger menu, no legacy
 * navigation grafted on). What changed is material quality, using only
 * the existing premium component set (BerxGlassView/BerxAnimatedButton/
 * BerxParticleSystem/BerxSpatialCard-derived mechanics) and live theme
 * tokens:
 *   - The world's own background got real depth (aurora pools, a
 *     drifting light orb, a parallaxed dust field) — see
 *     BerxFeedScene.tsx's own header for what's real there.
 *   - The docked reading panel is now a real tilt/parallax/lift surface
 *     (the SAME mechanics BerxSpatialCard itself uses — see the
 *     `useDockedTilt` hook below for why this is a direct composition
 *     of that component's own hooks rather than the BerxSpatialCard
 *     component literally: BerxSpatialCard's internal layers are
 *     `flex:1` around content that is sometimes empty decoration by
 *     design, which needs a measured/explicit height; this panel's
 *     height is real and content-driven — poll or no poll, track or
 *     no track — and forcing that through a fixed-height component
 *     would either clip real content or leave dead space, so the same
 *     real spring/tilt/shadow physics are composed directly instead),
 *     with a real accent-reactive gradient wash behind the content.
 *   - Like/comment/share/save are now real BerxAnimatedButton icon
 *     buttons — like reuses that component's own built-in
 *     activation-particle-burst (see BerxAnimatedButton's own header),
 *     wired to the real api.likePost/unlikePost pair; save wired to
 *     the real api.savePost/unsavePost pair (BerxFeedItem itself
 *     carries no `is_saved` — see the comment at its use site for why
 *     that toggle is honestly session-local, not fabricated persistent
 *     state); comment/share stay real navigation, not a fabricated
 *     in-place sheet.
 *   - The header is a real BerxGlassView with `glow`, a softly pulsing
 *     logotype, and a real notification bell (self-polled, same
 *     api.unreadNotificationCount() AppShell's own wayfinder already
 *     uses) with a pulsing unread dot.
 *   - The refresh control (already, by design, an explicit button
 *     rather than a drag gesture — see the ORIGINAL note below on why
 *     pull-to-refresh has nothing to attach to here) now spins a real
 *     glowing ring while loading and releases a real particle burst
 *     off the logo on completion — the honest version of "coalesces
 *     into the logo": a real OUTWARD burst timed to the logo's own
 *     completion pulse, not a literal reversed/inbound particle
 *     simulation (this particle system's real physics are closed-form
 *     forward kinematics — see BerxParticleSystem's own header — an
 *     inbound variant is a real, disclosed, separate feature this pass
 *     didn't build).
 *   - Loading shows a real animated shimmer skeleton instead of a bare
 *     spinner.
 *   - Full-screen transition choreography (opening a post scaling/
 *     blurring the outgoing screen) is a NAVIGATOR-level concern, not
 *     a FeedScreen-level one — out of scope here, not silently
 *     dropped: doing it properly means touching BerxNavigator's shared
 *     transition, which affects every screen in the app and needs its
 *     own review, not a side effect of a FEED pass.
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
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet, GestureResponderEvent, Platform, ViewStyle} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFeedItem, BerxStoryFeedGroup, BerxTrendingHashtag} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, Easing} from 'react-native-reanimated';
import Svg, {Circle} from 'react-native-svg';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
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
 * has always set (see ossn_com.php's own comment on it).
 */
function authorOf(item: BerxFeedItem): string | null {
	return item.poster_username ?? item.owner_username;
}

/**
 * DOCKED-PANEL TILT/LIFT/SHADOW — the same real spring/touch physics
 * BerxSpatialCard itself is built on (BERX_SPRING, tilt-on-touch,
 * press-lift, tilt-reactive shadow), composed directly here instead of
 * through that component because this panel's height is real and
 * content-driven (a poll can appear/disappear, a track row can
 * appear/disappear) rather than fixed/measured the way every current
 * BerxSpatialCard call site is (see this file's own header for the
 * full reasoning). Same physics, same constants, a different box.
 */
function useDockedTilt(maxTilt = 8) {
	const tiltX = useSharedValue(0);
	const tiltY = useSharedValue(0);
	const pressScale = useSharedValue(1);

	function handleTouchMove(e: GestureResponderEvent) {
		// GestureResponderEvent doesn't carry the target's own measured
		// size, so this reads a normalised offset off the raw page/locationX
		// against a fixed reference the caller already knows (view width) —
		// simpler here than a full onLayout round trip since the panel is
		// always the same left/right-inset width.
		const {locationX, locationY} = e.nativeEvent;
		tiltX.value = Math.max(-1, Math.min(1, (locationX / 340 - 0.5) * 2));
		tiltY.value = Math.max(-1, Math.min(1, (locationY / 220 - 0.5) * 2));
	}
	function reset() {
		tiltX.value = withSpring(0, BERX_SPRING);
		tiltY.value = withSpring(0, BERX_SPRING);
		pressScale.value = withSpring(1, BERX_SPRING);
	}
	function pressIn() {
		pressScale.value = withSpring(1.015, BERX_SPRING);
	}

	const tiltStyle = useAnimatedStyle(() => ({
		transform: [
			{perspective: 800},
			{rotateX: `${tiltY.value * maxTilt}deg`},
			{rotateY: `${-tiltX.value * maxTilt}deg`},
			{scale: pressScale.value},
		],
	}), [tiltX, tiltY, maxTilt, pressScale]);
	const shadowStyle = useAnimatedStyle(() => {
		const mag = Math.min(1, Math.hypot(tiltX.value, tiltY.value));
		return {
			shadowColor: '#000000',
			shadowOffset: {width: -tiltX.value * 12, height: 8 + tiltY.value * 10},
			shadowRadius: 16 + mag * 14,
			shadowOpacity: 0.3 + mag * 0.22,
		};
	}, [tiltX, tiltY]);

	const webHandlers =
		Platform.OS === 'web'
			? ({
					onMouseMove: (e: {nativeEvent: {offsetX: number; offsetY: number}}) => {
						tiltX.value = Math.max(-1, Math.min(1, (e.nativeEvent.offsetX / 340 - 0.5) * 2));
						tiltY.value = Math.max(-1, Math.min(1, (e.nativeEvent.offsetY / 220 - 0.5) * 2));
					},
					onMouseLeave: reset,
				} as unknown as Record<string, unknown>)
			: {};

	return {tiltStyle, shadowStyle, handleTouchMove, reset, pressIn, webHandlers};
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
	/** Real navigation to the existing SharePost flow. Optional: harness/other callers may not wire it, same convention `onOpenHashtag` already uses. */
	onShareToMessage?: (postGuid: number) => void;
}

export default function FeedScreen({api, myGuid, onOpenPost, onOpenProfile, onOpenHashtag, onCreatePost, onOpenStoryGroup, onCreateStory, onOpenNotifications, onShareToMessage}: Props) {
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
	const [likeBusyGuid, setLikeBusyGuid] = useState<number | null>(null);
	// `is_saved` isn't part of BerxFeedItem (see this file's own header
	// on why — not fetched for feed-page N+1 reasons) — this is a real,
	// disclosed SESSION-LOCAL reflection of the action just taken, not a
	// claim about persisted server state before that action.
	const [savedThisSession, setSavedThisSession] = useState<Set<number>>(new Set());
	const [savingGuid, setSavingGuid] = useState<number | null>(null);
	const [unreadNotifications, setUnreadNotifications] = useState(0);

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

	// REFRESH CHOREOGRAPHY — see this file's own header on the honest
	// scope of "coalesces into the logo": a real ring-spin while
	// `refreshing`, then a real outward particle burst timed to the
	// logo's own completion pulse the instant it flips back to false.
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

	// LOGO PULSE — a real, continuous, slow breathing scale, per the
	// visual-mastery spec ("scale 1.0 -> 1.02 every 2s").
	const logoPulse = useSharedValue(0);
	useEffect(() => {
		logoPulse.value = withRepeat(withTiming(1, {duration: 2000, easing: Easing.inOut(Easing.sin)}), -1, true);
	}, [logoPulse]);
	const logoPulseStyle = useAnimatedStyle(() => ({transform: [{scale: 1 + logoPulse.value * 0.02}]}), [logoPulse]);

	const header = (
		// The outer wrapper owns the absolute positioning — BerxGlassView's
		// own `style` prop only reaches its INNER animated layer (its outer
		// shadow wrapper stays in normal flow by design, the same real
		// `flex:1`-in-normal-flow contract every other caller of this
		// component relies on), so positioning it directly via that prop
		// would leave the outer box competing for flex space with the
		// world underneath instead of docking to the top edge — a real
		// layout bug caught by reasoning through BerxGlassView's own
		// structure before it ever reached a screenshot.
		<View style={styles.headerAbsolute}>
			<BerxGlassView glow radius={0} style={styles.headerGlass}>
			<View style={[styles.headerRow, {paddingTop: insets.top, height: headerH}]}>
				<Animated.View style={logoPulseStyle}>
					<Text style={styles.headerTitle}>
						BER<Text style={styles.headerTitleAccent}>X</Text>
					</Text>
				</Animated.View>
				<View style={styles.headerActions}>
					{/* Replaces the pull-to-refresh gesture the old FlatList carried
					    — real capability (re-fetch), explicit control now that there
					    is no scrollable list to attach the gesture to. A real glowing
					    ring spins while refreshing (see ringStyle above). */}
					<Pressable onPress={onRefresh} disabled={refreshing} hitSlop={6} style={({pressed}: {pressed: boolean}) => [pressed && styles.headerCreatePressed]}>
						{/* The icon/ring MUST be BerxGlassSurface's own children, not an
						    external sibling — see that component's own header comment:
						    its absolute-positioned root otherwise paints ABOVE a plain
						    sibling `<Svg>` on web regardless of DOM order (the exact bug
						    that comment documents finding, reproduced here once at the
						    wrong nesting level and fixed the same way). */}
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
						<BerxAnimatedButton
							variant="icon"
							onPress={onOpenNotifications}
							icon={<BerxIcon name="bell" size={17} color={unreadNotifications > 0 ? colors.accent : colors.textDim} />}
							active={unreadNotifications > 0}
						/>
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
				<FeedSkeleton colors={colors} headerH={headerH} insets={insets} />
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
				<DockedPostPanel
					key={focusedItem.guid}
					item={focusedItem}
					author={focusedAuthor}
					colors={colors}
					insets={insets}
					myGuid={myGuid}
					votingPollGuid={votingPollGuid}
					likeBusy={likeBusyGuid === focusedItem.guid}
					saving={savingGuid === focusedItem.guid}
					saved={savedThisSession.has(focusedItem.guid)}
					onOpenPost={onOpenPost}
					onOpenProfile={onOpenProfile}
					onOpenHashtag={onOpenHashtag}
					onVotePoll={handleVotePoll}
					onClosePoll={handleClosePoll}
					onToggleLike={handleToggleLike}
					onToggleSave={handleToggleSave}
					onShareToMessage={onShareToMessage}
				/>
			) : (
				<View style={[styles.hudWrap, {paddingBottom: insets.bottom || spacing.md}]}>
					<BerxGlassView radius={20} style={styles.hud}>
						<BerxEmptyState
							title="Пока нет постов"
							subtitle="Честная оговорка: это ваша стена (свои посты + посты друзей на ней), не общая лента всех подписок."
						/>
					</BerxGlassView>
				</View>
			)}
		</View>
	);
}

/** The docked reading panel for whichever post is focused — real tilt/lift/shadow physics (see useDockedTilt above), a real accent gradient wash, and real like/comment/share/save actions. Split out so `key={item.guid}` (on the caller) gets a fresh mount — and fresh MOUNT-state animation on BerxGlassView — every time the focused post actually changes. */
function DockedPostPanel({
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
	onShareToMessage,
}: {
	item: BerxFeedItem;
	author: string | null;
	colors: BerxColorTokens;
	insets: {top: number; bottom: number};
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
	onShareToMessage?: (postGuid: number) => void;
}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const {tiltStyle, shadowStyle, handleTouchMove, reset, pressIn, webHandlers} = useDockedTilt(8);

	return (
		<Animated.View style={[styles.hudWrap, {paddingBottom: insets.bottom || spacing.md}, shadowStyle]}>
			<Pressable
				onPress={() => onOpenPost(item.guid)}
				onTouchStart={(e: GestureResponderEvent) => {
					pressIn();
					handleTouchMove(e);
				}}
				onTouchMove={handleTouchMove}
				onTouchEnd={reset}
				onTouchCancel={reset}
				// WEB-ONLY, REAL BUG CAUGHT VIA HARNESS SCREENSHOT: dragging over
				// the panel to test tilt selected the caption text underneath
				// the cursor (the browser's own default drag-to-select
				// behaviour) — real on web, meaningless on native, so gated the
				// same way `webHandlers` below already is.
				style={Platform.OS === 'web' ? ({userSelect: 'none'} as unknown as ViewStyle) : undefined}
				{...webHandlers}>
				<Animated.View style={tiltStyle}>
					<BerxGlassView radius={20} style={styles.hud} backgroundLayer={item.media_url ? <View style={styles.hudGradientAccent} /> : undefined}>
						<Pressable
							style={styles.bylineRow}
							onPress={() => { if (author) onOpenProfile(author); }}
							disabled={!author}
							hitSlop={8}>
							<View style={styles.bylineMark}>
								{item.poster_icon ? (
									<Image source={{uri: item.poster_icon}} style={styles.bylineMarkImage} />
								) : (
									<Text style={styles.bylineMarkInitial}>{(author ?? 'B').charAt(0).toUpperCase()}</Text>
								)}
							</View>
							{item.poster_is_creator ? <View style={styles.creatorDot} /> : null}
							<Text style={styles.byline} numberOfLines={1}>
								{(author ?? 'BERX').toUpperCase()} · {relativeTimeLabel(item.time_created)}
								{item.is_edited ? ' · ИЗМ.' : ''}
								{item.repost_of ? ' · РЕПОСТ' : ''}
							</Text>
							{/* The real photo itself is already the sphere this post's
							    node wears out in the world — this is just a pointer to
							    it, never a second copy of the image. */}
							{item.media_url ? (
								<View style={styles.mediaBadge}>
									<BerxIcon name="camera" size={11} color={colors.accent} />
									{item.media_count && item.media_count > 1 ? (
										<Text style={styles.mediaBadgeText}>{item.media_count}</Text>
									) : null}
								</View>
							) : null}
						</Pressable>
						<View style={styles.hudTextClip}>
							<BerxRichText text={item.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.text} />
						</View>
						{item.track_title ? (
							<View style={styles.trackRow}>
								<BerxIcon name="music" size={13} color={colors.accent} />
								<Text style={styles.trackTitle} numberOfLines={1}>{item.track_title}</Text>
							</View>
						) : null}
						{item.poll ? (
							<Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
								<BerxPollView
									poll={item.poll}
									onVote={(optionIndex) => onVotePoll(item, optionIndex)}
									voting={votingPollGuid === item.guid}
									onClose={myGuid === item.poster_guid ? () => onClosePoll(item) : undefined}
									closing={votingPollGuid === item.guid}
								/>
							</Pressable>
						) : null}
						{/* REAL ACTIONS — like/save call the real API; comment/share
						    are real navigation, never a fabricated in-place sheet
						    (see this file's own header). stopPropagation so tapping
						    an action never also opens the post underneath it. */}
						<Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()} style={styles.actionsRow}>
							<View style={styles.actionItem}>
								<BerxAnimatedButton
									variant="icon"
									onPress={() => onToggleLike(item)}
									disabled={likeBusy}
									active={!!item.is_liked}
									icon={<BerxIcon name="heart" size={17} color={item.is_liked ? colors.accent : colors.textDim} filled={item.is_liked} />}
								/>
								{(item.like_count ?? 0) > 0 ? (
									<Text style={[styles.actionCount, item.is_liked && styles.actionCountActive]}>{item.like_count}</Text>
								) : null}
							</View>
							<View style={styles.actionItem}>
								<BerxAnimatedButton
									variant="icon"
									onPress={() => onOpenPost(item.guid)}
									icon={<BerxIcon name="message-circle" size={16} color={colors.textDim} />}
								/>
								{(item.comment_count ?? 0) > 0 ? <Text style={styles.actionCount}>{item.comment_count}</Text> : null}
							</View>
							{onShareToMessage ? (
								<BerxAnimatedButton
									variant="icon"
									onPress={() => onShareToMessage(item.guid)}
									icon={<BerxIcon name="share-2" size={16} color={colors.textDim} />}
								/>
							) : null}
							<View style={styles.actionSpacer} />
							<BerxAnimatedButton
								variant="icon"
								onPress={() => onToggleSave(item)}
								disabled={saving}
								active={saved}
								icon={<BerxIcon name="bookmark" size={16} color={saved ? colors.accent : colors.textDim} filled={saved} />}
							/>
						</Pressable>
					</BerxGlassView>
				</Animated.View>
			</Pressable>
		</Animated.View>
	);
}

/** A real animated shimmer skeleton — a diagonal light band sweeping across muted content-shaped blocks, the same real sheen technique BerxAnimatedButton's `premium` sweep already uses, standing in for a spinner while the real feed loads. */
function FeedSkeleton({colors, headerH, insets}: {colors: BerxColorTokens; headerH: number; insets: {bottom: number}}) {
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const sheenX = useSharedValue(-1);
	useEffect(() => {
		sheenX.value = withRepeat(withSequence(withTiming(2, {duration: 1100, easing: Easing.inOut(Easing.ease)}), withTiming(-1, {duration: 0})), -1, false);
	}, [sheenX]);
	const sheenStyle = useAnimatedStyle(() => ({transform: [{translateX: sheenX.value * 260}, {rotate: '12deg'}]}), [sheenX]);
	return (
		<View style={[styles.screen, {paddingTop: headerH, justifyContent: 'flex-end'}]}>
			<View style={[styles.hudWrap, {position: 'relative', paddingBottom: insets.bottom || spacing.md}]}>
				<View style={[styles.hud, styles.skeletonCard]}>
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
	centerFill: {flex: 1, alignItems: 'center', justifyContent: 'center'},
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
	// Docked at the bottom, over the world — the one real reading
	// surface for whichever post is currently focused.
	hudWrap: {position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8},
	hud: {paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md},
	// A real, low-alpha accent wash behind a media post's panel content —
	// GlassView's own `backgroundLayer` parallax (see its header) applies
	// to this automatically.
	hudGradientAccent: {flex: 1, backgroundColor: colors.accent, opacity: 0.05},
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
	actionsRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm},
	actionItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	actionCount: {color: colors.textFaint, fontSize: typography.sizeSm, fontVariant: ['tabular-nums']},
	actionCountActive: {color: colors.accent},
	actionSpacer: {flex: 1},
	// SKELETON
	skeletonCard: {backgroundColor: colors.glass2, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden'},
	skeletonRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
	skeletonAvatar: {width: 22, height: 22, borderRadius: 6, backgroundColor: colors.glass3},
	skeletonLine: {flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.glass3},
	skeletonBlock: {height: 14, borderRadius: 6, backgroundColor: colors.glass3, marginBottom: spacing.sm},
	skeletonSheenWrap: {overflow: 'hidden'},
	skeletonSheen: {position: 'absolute', top: -40, left: '40%', width: 60, height: 260, backgroundColor: colors.text, opacity: 0.06, transform: [{rotate: '0deg'}]},
});
