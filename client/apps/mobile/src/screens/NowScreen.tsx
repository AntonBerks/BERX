/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX NOW — the main screen. Deliberately NOT a feed.
 *
 * A feed answers "what did people post". NOW answers "what is
 * happening around me right now" — which is the whole premise of
 * BERX as a living spatial layer rather than another posting app.
 * The screen is composed top-to-bottom as:
 *
 *   ENVIRONMENT → LIVE NOW → PEOPLE → PLACES → EVENTS → MOMENTS
 *
 * EVERY SECTION IS REAL DATA OR ABSENT. Each block fetches its own
 * real endpoint independently and renders nothing at all when that
 * endpoint returns nothing — there is no placeholder "3 friends
 * nearby" text, no seeded demo place, no invented distance. A quiet
 * BERX (new account, nothing around) honestly shows a quiet NOW.
 *
 * Sections are fetched in parallel and fail independently: stories
 * failing must never blank out places, and vice versa.
 *
 * REAL DISTANCES: the distance-ranked view needs real coordinates,
 * and no device Geolocation module is installable in this sandbox
 * (npm blocked — same constraint PlacesNearbyScreen/NearbyNowScreen
 * already document). So PLACES here shows the real place list and
 * routes to the existing NearbyNow screen for the coordinate-based
 * ranking, instead of printing a fabricated "250 м" nobody measured.
 *
 * The environment strip uses the real, deterministic daypart palette
 * already in tokens (same local hour always resolves to the same
 * daypart — no randomness, no server round-trip).
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, ScrollView, Pressable, Animated, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {
	BerxFeedItem,
	BerxStoryFeedGroup,
	BerxOnlineFriend,
	BerxPeopleSuggestion,
	BerxPlace,
	BerxEvent,
	BerxTrendingHashtag,
} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography, radius, getBerxDaypartPalette} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {IconPlus, IconSearch, IconMessage, IconBell} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';
import {BerxSpatialLayer} from '../../../../packages/design-system/src/components/BerxSpatialLayer';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';
import {BerxPlaceCard, BerxEventCard, BerxPersonCard, BerxLiveDot} from '../../../../packages/design-system/src/components/BerxSpatialCards';

interface Props {
	api: BerxApiClient;
	myGuid?: number;
	onOpenPost: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onOpenHashtag?: (tag: string) => void;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenNearby?: () => void;
	onOpenMessages?: () => void;
	onOpenNotifications?: () => void;
	onOpenSearch?: () => void;
	/** The full Stories rail screen — it left the bottom bar in the spatial nav pass, so LIVE NOW is its real entry point. */
	onOpenStories?: () => void;
	onOpenPeople?: () => void;
	onOpenPlaces?: () => void;
	onOpenEvents?: () => void;
	onCreatePost: () => void;
	onOpenStoryGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
}

const RAIL_CARD_W = 168;

export default function NowScreen({
	api,
	myGuid,
	onOpenPost,
	onOpenProfile,
	onOpenHashtag,
	onOpenPlace,
	onOpenEvent,
	onOpenNearby,
	onOpenMessages,
	onOpenNotifications,
	onOpenSearch,
	onOpenStories,
	onOpenPeople,
	onOpenPlaces,
	onOpenEvents,
	onCreatePost,
	onOpenStoryGroup,
	onCreateStory,
}: Props) {
	const [items, setItems] = useState<BerxFeedItem[]>([]);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [online, setOnline] = useState<BerxOnlineFriend[]>([]);
	const [suggestions, setSuggestions] = useState<BerxPeopleSuggestion[]>([]);
	const [places, setPlaces] = useState<BerxPlace[]>([]);
	const [events, setEvents] = useState<BerxEvent[]>([]);
	const [trending, setTrending] = useState<BerxTrendingHashtag[]>([]);
	const [votingPollGuid, setVotingPollGuid] = useState<number | null>(null);
	// Messages left the bottom bar in the spatial navigation pass, so
	// NOW carries its real unread count itself (api.unreadMessageCount()
	// — the same real endpoint the old tab badge used). Nothing about
	// messaging was removed; only where its entry point lives changed.
	const [unread, setUnread] = useState(0);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Real scroll offset — the single driver every parallax plane on
	// this screen reads from. Nothing animates on its own here.
	const scrollY = useRef(new Animated.Value(0)).current;

	const daypart = getBerxDaypartPalette(new Date().getHours());

	const load = useCallback(async () => {
		// Every section is independent: one failing endpoint must never
		// blank out the others, so each catch resolves to an empty real
		// result rather than rejecting the whole screen.
		const [feedRes, storiesRes, onlineRes, placesRes, eventsRes] = await Promise.all([
			api.feed(20, 0).catch(() => ({items: [] as BerxFeedItem[], limit: 20, offset: 0})),
			api.storiesFeed().catch(() => ({feed: [] as BerxStoryFeedGroup[]})),
			api.onlineFriends().catch(() => ({online: [] as BerxOnlineFriend[]})),
			api.places().catch(() => ({places: [] as BerxPlace[]})),
			api.events().catch(() => ({events: [] as BerxEvent[]})),
		]);
		setItems(feedRes.items);
		setStoryGroups(storiesRes.feed);
		setOnline(onlineRes.online);
		setPlaces(placesRes.places);
		setEvents(eventsRes.events.filter((e: BerxEvent) => !e.has_ended).slice(0, 8));
		setLoading(false);
		setRefreshing(false);

		// Secondary, additive signals — never block the primary render.
		api.trendingHashtags().then((r) => setTrending(r.hashtags)).catch(() => undefined);
		if (onlineRes.online.length === 0) {
			api.peopleDiscovery().then((r) => setSuggestions(r.people)).catch(() => undefined);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	// Real unread-messages poll — moved here from AppShell's tab bar
	// when Messages left the bottom bar for this strip. Same real
	// endpoint, same honest 20s POLLING disclosure (no WebSocket infra
	// exists in BERX), never a guessed count.
	useEffect(() => {
		let active = true;
		async function poll() {
			try {
				const res = await api.unreadMessageCount();
				if (active) setUnread(res.unread_count);
			} catch {
				// polling failure is silent — never surfaces as an app-level error
			}
		}
		poll();
		const timer = setInterval(poll, 20000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [api]);

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

	if (loading) {
		return (
			<View style={styles.screen}>
				<View style={styles.envStrip}>
					<Text style={styles.wordmark}>
						BER<Text style={{color: daypart.accent}}>X</Text>
					</Text>
				</View>
				<View style={styles.skeletonWrap}>
					<BerxSkeleton width="55%" height={14} />
					<BerxSkeleton width="100%" height={190} style={styles.skelGap} />
					<BerxSkeleton width="40%" height={14} style={styles.skelGap} />
					<BerxSkeleton width="100%" height={140} style={styles.skelGapSm} />
				</View>
			</View>
		);
	}

	const peopleToShow: {key: string; name: string; username: string; icon: string; online: boolean; mutual?: number}[] =
		online.length > 0
			? online.map((o: BerxOnlineFriend) => ({key: `o${o.guid}`, name: o.fullname, username: o.username, icon: o.icon, online: true}))
			: suggestions.map((s: BerxPeopleSuggestion) => ({
					key: `s${s.guid}`,
					name: s.fullname,
					username: s.username,
					icon: s.icon,
					online: false,
					mutual: s.mutual_count,
			  }));

	return (
		<View style={styles.screen}>
			{/* ENVIRONMENT — the fixed top plane. Real daypart, real time. */}
			<View style={[styles.envStrip, {borderBottomColor: daypart.accentSoft}]}>
				<View style={styles.envLeft}>
					<Text style={styles.wordmark}>
						BER<Text style={{color: daypart.accent}}>X</Text>
					</Text>
					<Text style={styles.envLabel}>{daypart.label.toUpperCase()}</Text>
				</View>
				<View style={styles.envActions}>
					{onOpenSearch ? (
						<Pressable onPress={onOpenSearch} hitSlop={10} style={styles.envAction}>
							<IconSearch size={19} color={colors.textDim} />
						</Pressable>
					) : null}
					{onOpenMessages ? (
						<Pressable onPress={onOpenMessages} hitSlop={10} style={styles.envAction}>
							<IconMessage size={19} color={colors.textDim} />
							{unread > 0 ? (
								<View style={styles.badge}>
									<Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
								</View>
							) : null}
						</Pressable>
					) : null}
					{onOpenNotifications ? (
						<Pressable onPress={onOpenNotifications} hitSlop={10} style={styles.envAction}>
							<IconBell size={19} color={colors.textDim} />
						</Pressable>
					) : null}
					<Pressable onPress={onCreatePost} hitSlop={10} style={styles.envAction}>
						<IconPlus size={20} color={daypart.accent} />
					</Pressable>
				</View>
			</View>

			<Animated.ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={16}
				onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: true})}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => {
							setRefreshing(true);
							load();
						}}
						tintColor={daypart.accent}
					/>
				}>
				<BerxFadeIn>
					{/* LIVE NOW — real active stories, as spatial tiles on the background plane. */}
					<BerxSpatialLayer plane="background" driver={scrollY} range={280}>
						{onOpenStories ? <SectionHead title="Прямо сейчас" onMore={onOpenStories} moreLabel="Все истории" /> : null}
						<View style={styles.storyRail}>
							<Pressable style={styles.storyItem} onPress={onCreateStory}>
								<View style={styles.addStoryTile}>
									<IconPlus size={18} color={colors.accent} />
								</View>
								<Text style={styles.storyLabel} numberOfLines={1}>
									Ваша история
								</Text>
							</Pressable>
							{storyGroups.map((g: BerxStoryFeedGroup) => (
								<Pressable key={g.owner_guid} style={styles.storyItem} onPress={() => onOpenStoryGroup(g)}>
									<View style={styles.storyTile}>
										<Text style={styles.storyTileInitial}>{(g.owner_username ?? '?').charAt(0).toUpperCase()}</Text>
									</View>
									<Text style={styles.storyLabel} numberOfLines={1}>
										{g.owner_username ?? `#${g.owner_guid}`}
									</Text>
								</Pressable>
							))}
						</View>
					</BerxSpatialLayer>

					{/* PEOPLE — real presence first, real mutual-friend discovery when nobody is online. */}
					{peopleToShow.length > 0 ? (
						<View style={styles.section}>
							<SectionHead
								title={online.length > 0 ? 'Сейчас в сети' : 'Возможно, вы знакомы'}
								count={online.length > 0 ? online.length : undefined}
								live={online.length > 0}
								onMore={onOpenPeople}
							/>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
								{peopleToShow.slice(0, 10).map((p) => (
									<View key={p.key} style={styles.railItem}>
										<BerxPersonCard
											fullname={p.name}
											username={p.username}
											imageUrl={p.icon}
											isOnline={p.online}
											mutualCount={p.mutual}
											width={124}
											onPress={() => onOpenProfile(p.username)}
										/>
									</View>
								))}
							</ScrollView>
						</View>
					) : null}

					{/* PLACES — real places. Distance ranking lives in Nearby (needs real coordinates). */}
					{places.length > 0 ? (
						<View style={styles.section}>
							<SectionHead title="Места" onMore={onOpenNearby ?? onOpenPlaces} moreLabel={onOpenNearby ? 'Рядом' : undefined} />
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
								{places.slice(0, 8).map((pl: BerxPlace) => (
									<View key={pl.guid} style={styles.railItem}>
										<BerxPlaceCard
											title={pl.title}
											imageUrl={pl.cover_url}
											category={pl.category}
											rating={pl.rating}
											width={RAIL_CARD_W}
											onPress={() => onOpenPlace(pl.guid)}
										/>
									</View>
								))}
							</ScrollView>
						</View>
					) : null}

					{/* EVENTS — real upcoming events, cinematic 16:9. */}
					{events.length > 0 ? (
						<View style={styles.section}>
							<SectionHead title="События" onMore={onOpenEvents} />
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
								{events.map((ev: BerxEvent) => (
									<View key={ev.guid} style={styles.railItem}>
										<BerxEventCard
											title={ev.title}
											imageUrl={ev.cover_url}
											starts={ev.starts}
											placeTitle={ev.place ? ev.place.title : ev.location}
											attendeeCount={ev.attendee_count}
											friendsGoingCount={ev.friends_going_count}
											seatsLeft={ev.seats_left}
											isGoing={ev.is_going}
											width={268}
											onPress={() => onOpenEvent(ev.guid)}
										/>
									</View>
								))}
							</ScrollView>
						</View>
					) : null}

					{/* SOCIAL CONTEXT — real trending tags from real posts. */}
					{trending.length > 0 && onOpenHashtag ? (
						<View style={styles.trendingRail}>
							{trending.slice(0, 8).map((h: BerxTrendingHashtag) => (
								<Pressable key={h.hashtag} style={styles.trendingChip} onPress={() => onOpenHashtag(h.hashtag)}>
									<Text style={styles.trendingChipText}>#{h.hashtag}</Text>
								</Pressable>
							))}
						</View>
					) : null}

					{/* MOMENTS — the real posts, kept in full (nothing from the old feed is lost). */}
					<View style={styles.section}>
						<SectionHead title="Моменты" />
						{items.length === 0 ? (
							<Text style={styles.quiet}>
								Пока тихо. Это ваша стена — свои посты и посты друзей, а не общая лента всех подписок.
							</Text>
						) : (
							items.map((item: BerxFeedItem) => (
								<Pressable key={item.guid} style={styles.unit} onPress={() => onOpenPost(item.guid)}>
									<Pressable
										style={styles.bylineRow}
										onPress={() => item.owner_username && onOpenProfile(item.owner_username)}
										disabled={!item.owner_username}
										hitSlop={8}>
										<BerxAvatarStack
											people={[{guid: item.poster_guid, initial: (item.poster_username ?? item.owner_username ?? 'B').charAt(0)}]}
											size={22}
										/>
										<Text style={styles.byline} numberOfLines={1}>
											{(item.poster_username ?? item.owner_username ?? 'BERX').toUpperCase()} · {relativeTimeLabel(item.time_created)}
										</Text>
									</Pressable>
									<BerxRichText text={item.text} onOpenProfile={onOpenProfile} onOpenHashtag={onOpenHashtag} style={styles.unitText} />
									{item.poll ? (
										<BerxPollView
											poll={item.poll}
											onVote={(optionIndex: number) => handleVotePoll(item, optionIndex)}
											voting={votingPollGuid === item.guid}
											onClose={myGuid === item.poster_guid ? () => handleClosePoll(item) : undefined}
											closing={votingPollGuid === item.guid}
										/>
									) : null}
								</Pressable>
							))
						)}
					</View>
				</BerxFadeIn>
			</Animated.ScrollView>
		</View>
	);
}

function SectionHead({
	title,
	count,
	live,
	onMore,
	moreLabel,
}: {
	title: string;
	count?: number;
	live?: boolean;
	onMore?: () => void;
	moreLabel?: string;
}) {
	return (
		<View style={styles.sectionHead}>
			<View style={styles.sectionHeadLeft}>
				<Text style={styles.sectionTitle}>{title}</Text>
				{live && typeof count === 'number' ? <BerxLiveDot label={String(count)} /> : null}
			</View>
			{onMore ? (
				<Pressable onPress={onMore} hitSlop={8}>
					<Text style={styles.sectionMore}>{moreLabel ?? 'Все'}</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	envStrip: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
	},
	envLeft: {flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm},
	wordmark: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, letterSpacing: 1},
	envLabel: {color: colors.textFaint, fontSize: 10, fontWeight: typography.weightBold, letterSpacing: 1.4},
	envActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	envAction: {padding: spacing.xs},
	badge: {
		position: 'absolute',
		top: 0,
		right: 0,
		minWidth: 15,
		height: 15,
		paddingHorizontal: 3,
		borderRadius: 8,
		backgroundColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
	},
	badgeText: {color: colors.black, fontSize: 9, fontWeight: typography.weightBold},
	scroll: {flex: 1},
	scrollContent: {paddingBottom: spacing.xxl},
	skeletonWrap: {padding: spacing.lg},
	skelGap: {marginTop: spacing.md},
	skelGapSm: {marginTop: spacing.sm},

	storyRail: {flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm, flexWrap: 'nowrap'},
	storyItem: {alignItems: 'center', width: 60},
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

	section: {marginTop: spacing.xl},
	sectionHead: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		marginBottom: spacing.sm,
	},
	sectionHeadLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	sectionTitle: {
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		fontWeight: typography.weightBold,
		letterSpacing: 1.2,
		textTransform: 'uppercase',
	},
	sectionMore: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	rail: {paddingHorizontal: spacing.lg, gap: spacing.sm},
	railItem: {marginRight: spacing.sm},

	trendingRail: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.xl},
	trendingChip: {paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surface},
	trendingChipText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},

	quiet: {color: colors.textDim, fontSize: typography.sizeSm, paddingHorizontal: spacing.lg, lineHeight: 20},
	unit: {paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	bylineRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
	byline: {
		flex: 1,
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		fontWeight: typography.weightBold,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	unitText: {
		color: colors.text,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightMedium,
		letterSpacing: -0.1,
		lineHeight: typography.sizeLg * 1.32,
	},
});
