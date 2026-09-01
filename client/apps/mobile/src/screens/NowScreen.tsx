/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX NOW — the primary screen. Deliberately NOT a feed.
 *
 * A feed answers "what did people post". NOW answers "what is
 * happening around me right now", composed exactly in the hierarchy
 * the visual direction calls for:
 *
 *   ENVIRONMENT → LIVE → PEOPLE → PLACES → EVENTS → MOMENTS → ACTION
 *
 * Composition follows the supplied reference set: a greeting row with
 * the caller's own portrait and floating circular utilities, a large
 * two-line editorial headline, a circular live rail, then horizontal
 * rails of tall cinematic cards, and finally full-bleed immersive
 * moment cards whose actions live in a floating rail ON the media.
 *
 * EVERY SECTION IS REAL DATA OR ABSENT. Each block fetches its own
 * real endpoint, fails independently, and renders nothing at all when
 * the server returned nothing. The headline itself is written from
 * live state (real presence, real events, real daypart) — it is never
 * a static marketing line.
 *
 * PHOTOGRAPHY IS REAL OR THE UNIT CHANGES SHAPE. A moment with a real
 * attached image renders immersive; a text moment renders as a
 * typographic unit instead of being given a fake photo plate.
 *
 * REAL DISTANCE is deliberately not printed here: no device
 * Geolocation module is installable in this sandbox (npm blocked,
 * same constraint NearbyNowScreen documents), so distance ranking
 * stays in Nearby rather than being invented.
 */
import {useCallback, useEffect, useRef, useState, useMemo} from 'react';
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
	BerxUser,
} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, typography, radius, getBerxDaypartPalette} from '@berx/design-system/tokens';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxSkeleton} from '../../../../packages/design-system/src/components/BerxStates';
import {IconPlus, IconSearch, IconMessage, IconBell} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxRichText} from '../../../../packages/design-system/src/components/BerxRichText';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';
import {BerxSpatialLayer} from '../../../../packages/design-system/src/components/BerxSpatialLayer';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';
import {BerxStoryRail} from '../../../../packages/design-system/src/components/BerxStoryRail';
import {BerxGreetingHeader, BerxEditorialTitle} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxImmersivePost} from '../../../../packages/design-system/src/components/BerxImmersivePost';
import {BerxPlaceCard, BerxEventCard, BerxPersonCard, BerxLiveDot} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import type {BerxRailAction} from '../../../../packages/design-system/src/components/BerxActionRail';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

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
	onOpenStories?: () => void;
	onOpenPeople?: () => void;
	onOpenPlaces?: () => void;
	onOpenEvents?: () => void;
	onOpenMyProfile?: () => void;
	onCreatePost: () => void;
	onOpenStoryGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
}

const PERSON_CARD_W = 132;
const PLACE_CARD_W = 176;
const EVENT_CARD_W = 286;

function ruPeople(n: number): string {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return 'человек';
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'человека';
	return 'человек';
}

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
	onOpenMyProfile,
	onCreatePost,
	onOpenStoryGroup,
	onCreateStory,
}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxFeedItem[]>([]);
	const [storyGroups, setStoryGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [online, setOnline] = useState<BerxOnlineFriend[]>([]);
	const [suggestions, setSuggestions] = useState<BerxPeopleSuggestion[]>([]);
	const [places, setPlaces] = useState<BerxPlace[]>([]);
	const [events, setEvents] = useState<BerxEvent[]>([]);
	const [trending, setTrending] = useState<BerxTrendingHashtag[]>([]);
	const [me, setMe] = useState<BerxUser | null>(null);
	const [votingPollGuid, setVotingPollGuid] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	// Messages left the bottom bar in the spatial navigation pass, so
	// NOW carries its real unread count (api.unreadMessageCount()).
	const [unread, setUnread] = useState(0);

	// The single real driver every parallax plane on this screen reads.
	const scrollY = useRef(new Animated.Value(0)).current;

	const daypart = getBerxDaypartPalette(new Date().getHours());

	const load = useCallback(async () => {
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

		api.trendingHashtags().then((r) => setTrending(r.hashtags)).catch(() => undefined);
		api.me().then((u: BerxUser) => setMe(u)).catch(() => undefined);
		if (onlineRes.online.length === 0) {
			api.peopleDiscovery().then((r) => setSuggestions(r.people)).catch(() => undefined);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		let active = true;
		async function poll() {
			try {
				const res = await api.unreadMessageCount();
				if (active) setUnread(res.unread_count);
			} catch {
				// polling failure is silent — never an app-level error
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

	/** Real like toggle — the server is the source of truth; state only moves after it confirms. */
	async function handleToggleLike(item: BerxFeedItem) {
		const liked = !!item.is_liked;
		try {
			if (liked) {
				await api.unlikePost(item.guid);
			} else {
				await api.likePost(item.guid);
			}
			setItems((prev: BerxFeedItem[]) =>
				prev.map((it: BerxFeedItem) =>
					it.guid === item.guid
						? {...it, is_liked: !liked, like_count: Math.max(0, (it.like_count ?? 0) + (liked ? -1 : 1))}
						: it,
				),
			);
		} catch {
			// real server rejection — nothing optimistic was applied
		}
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<View style={styles.skeletonWrap}>
					<BerxSkeleton width="45%" height={16} />
					<BerxSkeleton width="80%" height={30} style={styles.skelGap} />
					<BerxSkeleton width="100%" height={72} style={styles.skelGap} />
					<BerxSkeleton width="100%" height={230} style={styles.skelGap} />
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

	// The headline is written from REAL live state, in priority order:
	// who is actually online now, then what is actually happening, then
	// an honest quiet state. Never a static slogan.
	const headline: {lines: string[]; accentIndex: number} =
		online.length > 0
			? {lines: ['Кто рядом', `${online.length} ${ruPeople(online.length)} сейчас в сети`], accentIndex: 1}
			: events.length > 0
			? {lines: ['Что происходит', `${events.length} ближайших событий`], accentIndex: 1}
			: places.length > 0
			? {lines: ['Куда пойти', 'места вокруг тебя'], accentIndex: 1}
			: {lines: ['Пока тихо', 'здесь появится жизнь вокруг'], accentIndex: 1};

	return (
		<View style={styles.screen}>
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
					{/* ENVIRONMENT — real identity, real daypart, real unread. */}
					<BerxGreetingHeader
						greeting={daypart.label}
						name={me ? me.fullname || me.username : 'BERX'}
						avatarUrl={me ? me.icon_url : null}
						onPressIdentity={onOpenMyProfile}
						actions={[
							...(onOpenSearch ? [{key: 'search', icon: <IconSearch size={17} color={colors.text} />, onPress: onOpenSearch}] : []),
							...(onOpenMessages
								? [{key: 'msg', icon: <IconMessage size={17} color={colors.text} />, badge: unread, onPress: onOpenMessages}]
								: []),
							...(onOpenNotifications
								? [{key: 'bell', icon: <IconBell size={17} color={colors.text} />, onPress: onOpenNotifications}]
								: []),
						]}
					/>
					<BerxEditorialTitle lines={headline.lines} accentIndex={headline.accentIndex} />

					{/* LIVE — real active stories, on the background parallax plane. */}
					{storyGroups.length > 0 || onCreateStory ? (
						<BerxSpatialLayer plane="background" driver={scrollY} range={300} style={styles.liveLayer}>
							<SectionHead title="Прямо сейчас" onMore={onOpenStories} moreLabel="Все истории" />
							<BerxStoryRail
								onCreate={onCreateStory}
								items={storyGroups.map((g: BerxStoryFeedGroup) => ({
									key: String(g.owner_guid),
									label: g.owner_username ?? `#${g.owner_guid}`,
									unseen: true,
									onPress: () => onOpenStoryGroup(g),
								}))}
							/>
						</BerxSpatialLayer>
					) : null}

					{/* PEOPLE — real presence, or real mutual-friend discovery when nobody is online. */}
					{peopleToShow.length > 0 ? (
						<View style={styles.section}>
							<SectionHead
								title={online.length > 0 ? 'Кто рядом сейчас' : 'Возможно, вы знакомы'}
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
											width={PERSON_CARD_W}
											onPress={() => onOpenProfile(p.username)}
										/>
									</View>
								))}
							</ScrollView>
						</View>
					) : null}

					{/* EVENTS — real upcoming events as wide cinematic cards. */}
					{events.length > 0 ? (
						<View style={styles.section}>
							<SectionHead title="Что происходит" onMore={onOpenEvents} />
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
											width={EVENT_CARD_W}
											onPress={() => onOpenEvent(ev.guid)}
										/>
									</View>
								))}
							</ScrollView>
						</View>
					) : null}

					{/* PLACES — real places; distance ranking lives in Nearby (needs real coordinates). */}
					{places.length > 0 ? (
						<View style={styles.section}>
							<SectionHead title="Места вокруг" onMore={onOpenNearby ?? onOpenPlaces} moreLabel={onOpenNearby ? 'Рядом' : undefined} />
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
								{places.slice(0, 8).map((pl: BerxPlace) => (
									<View key={pl.guid} style={styles.railItem}>
										<BerxPlaceCard
											title={pl.title}
											imageUrl={pl.cover_url}
											category={pl.category}
											rating={pl.rating_count > 0 ? pl.rating : undefined}
											width={PLACE_CARD_W}
											onPress={() => onOpenPlace(pl.guid)}
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

					{/* MOMENTS — the real posts. Photography-first when the post genuinely has media. */}
					<View style={styles.section}>
						<SectionHead title="Моменты" />
						{items.length === 0 ? (
							<Text style={styles.quiet}>
								Пока тихо. Это ваша стена — свои посты и посты друзей, а не общая лента всех подписок.
							</Text>
						) : (
							items.map((item: BerxFeedItem) => {
								const actions: BerxRailAction[] = [
									{
										key: 'like',
										glyph: item.is_liked ? '♥' : '♡',
										count: item.like_count,
										active: item.is_liked,
										onPress: () => handleToggleLike(item),
									},
									{key: 'comment', glyph: '◌', count: item.comment_count, onPress: () => onOpenPost(item.guid)},
								];
								const author = item.poster_username ?? item.owner_username ?? 'BERX';
								if (item.media_url) {
									return (
										<View key={item.guid} style={styles.momentWrap}>
											<BerxImmersivePost
												imageUrl={item.media_url}
												mediaCount={item.media_count}
												authorName={author}
												timeLabel={relativeTimeLabel(item.time_created)}
												text={item.text}
												actions={actions}
												onPress={() => onOpenPost(item.guid)}
												onPressAuthor={() => item.poster_username && onOpenProfile(item.poster_username)}>
												{item.poll ? (
													<BerxPollView
														poll={item.poll}
														onVote={(optionIndex: number) => handleVotePoll(item, optionIndex)}
														voting={votingPollGuid === item.guid}
														onClose={myGuid === item.poster_guid ? () => handleClosePoll(item) : undefined}
														closing={votingPollGuid === item.guid}
													/>
												) : null}
											</BerxImmersivePost>
										</View>
									);
								}
								return (
									<Pressable key={item.guid} style={styles.unit} onPress={() => onOpenPost(item.guid)}>
										<Pressable
											style={styles.bylineRow}
											onPress={() => item.poster_username && onOpenProfile(item.poster_username)}
											disabled={!item.poster_username}
											hitSlop={8}>
											<BerxAvatarStack people={[{guid: item.poster_guid, initial: author.charAt(0)}]} size={24} />
											<Text style={styles.byline} numberOfLines={1}>
												{author.toUpperCase()} · {relativeTimeLabel(item.time_created)}
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
										<View style={styles.textActions}>
											<Pressable onPress={() => handleToggleLike(item)} hitSlop={8}>
												<Text style={[styles.textAction, item.is_liked && styles.textActionActive]}>
													{item.is_liked ? '♥' : '♡'}
													{typeof item.like_count === 'number' && item.like_count > 0 ? ` ${item.like_count}` : ''}
												</Text>
											</Pressable>
											<Pressable onPress={() => onOpenPost(item.guid)} hitSlop={8}>
												<Text style={styles.textAction}>
													◌{typeof item.comment_count === 'number' && item.comment_count > 0 ? ` ${item.comment_count}` : ''}
												</Text>
											</Pressable>
										</View>
									</Pressable>
								);
							})
						)}
					</View>

					{/* ACTION — the real create entry, kept at the end of the environment. */}
					<Pressable style={styles.createStrip} onPress={onCreatePost}>
						<IconPlus size={18} color={colors.accent} />
						<Text style={styles.createStripText}>Добавить момент</Text>
					</Pressable>
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
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
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

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	scroll: {flex: 1},
	scrollContent: {paddingBottom: spacing.xxxl},
	skeletonWrap: {padding: spacing.lg, paddingTop: spacing.xl},
	skelGap: {marginTop: spacing.md},

	liveLayer: {marginTop: spacing.xl},

	section: {marginTop: spacing.xl},
	sectionHead: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		marginBottom: spacing.md,
	},
	sectionHeadLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	sectionTitle: {
		color: colors.text,
		fontSize: typography.sizeBase,
		fontWeight: typography.weightBold,
		letterSpacing: -0.2,
	},
	sectionMore: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	rail: {paddingHorizontal: spacing.lg, gap: spacing.md},
	railItem: {marginRight: spacing.md},

	trendingRail: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.xl},
	trendingChip: {
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: radius.pill,
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	trendingChipText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},

	quiet: {color: colors.textDim, fontSize: typography.sizeSm, paddingHorizontal: spacing.lg, lineHeight: 20},
	momentWrap: {paddingHorizontal: spacing.lg, marginBottom: spacing.lg},
	unit: {
		marginHorizontal: spacing.lg,
		marginBottom: spacing.lg,
		padding: spacing.lg,
		borderRadius: radius.lg,
		backgroundColor: colors.glass1,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		gap: spacing.sm,
	},
	bylineRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
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
		letterSpacing: -0.2,
		lineHeight: typography.sizeLg * 1.34,
	},
	textActions: {flexDirection: 'row', gap: spacing.lg, marginTop: 2},
	textAction: {color: colors.textFaint, fontSize: typography.sizeSm},
	textActionActive: {color: colors.accent},

	createStrip: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.sm,
		marginTop: spacing.xl,
		marginHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderRadius: radius.pill,
		backgroundColor: colors.accentSoft,
		borderWidth: 1,
		borderColor: colors.accentSoft,
	},
	createStripText: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
});
