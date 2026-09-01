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
import {View, Text, Image, ScrollView, Pressable, Animated, RefreshControl, Dimensions, StyleSheet} from 'react-native';
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
import {BerxDepthCard} from '../../../../packages/design-system/src/components/BerxDepthCard';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';
import {BerxStoryRail} from '../../../../packages/design-system/src/components/BerxStoryRail';
import {BerxGreetingHeader, BerxEditorialTitle} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxImmersivePost} from '../../../../packages/design-system/src/components/BerxImmersivePost';
import {BerxPlaceCard, BerxEventCard, BerxPersonCard, BerxLiveDot} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import type {BerxRailAction} from '../../../../packages/design-system/src/components/BerxActionRail';
import {BerxActionRail} from '../../../../packages/design-system/src/components/BerxActionRail';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';
import {BerxScrim} from '../../../../packages/design-system/src/components/BerxScrim';

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
	/** Real "share this post into a conversation" (SharePostScreen). */
	onShareToMessage?: (postGuid: number) => void;
}

// Media scale. The previous values (132/176/286) made every band the
// same small carousel, which is exactly the generic-feed read the
// reference set does not have: there, one object dominates and the rest
// support it. Person stays the smallest (a face needs less area than a
// place), places get real photographic area, and an event is a wide
// cinematic plate that nearly fills the screen.
// The reference home screen IS the photograph: it fills the device, and
// the chrome floats on it. 0.92 leaves the floating nav visible over the
// image's own bottom edge rather than cropping into it.
const STAGE_H = Dimensions.get('window').height;

const PERSON_CARD_W = 148;
const PLACE_CARD_W = 214;
const EVENT_CARD_W = 320;

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
	onShareToMessage,
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
	// Real save state for posts saved during THIS session. The feed
	// response does not carry is_saved, so nothing is assumed about posts
	// the user has not touched here — the rail simply reads "сохранить"
	// until the server confirms a save.
	const [savedGuids, setSavedGuids] = useState<Set<number>>(new Set());

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

	// Real device-local date, recomputed on each render of the screen.
	const todayLabel = new Date()
		.toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long'})
		.replace(/^./, (c: string) => c.toUpperCase());

	/**
	 * The reference rails carry four actions, in this order: like, comment,
	 * save, send. All four are real here — like and comment already were,
	 * save is POST /posts/{id}/save, and send opens the real share-to-
	 * conversation screen. Save shows a label rather than a count because
	 * the feed genuinely does not carry is_saved (it is a detail-only
	 * field, see BerxPostDetail) — a count there would be invented.
	 */
	function railFor(item: BerxFeedItem): BerxRailAction[] {
		return [
			{
				key: 'like',
				icon: 'heart' as const,
				count: item.like_count,
				active: item.is_liked,
				onPress: () => handleToggleLike(item),
			},
			{key: 'comment', icon: 'message-circle' as const, count: item.comment_count, onPress: () => onOpenPost(item.guid)},
			{
				key: 'save',
				icon: 'bookmark' as const,
				label: savedGuids.has(item.guid) ? 'Сохр.' : 'Сохр.',
				active: savedGuids.has(item.guid),
				onPress: () => handleToggleSave(item),
			},
			...(onShareToMessage
				? [{key: 'send', icon: 'send' as const, label: 'Отпр.', onPress: () => onShareToMessage(item.guid)}]
				: []),
		];
	}

	async function handleToggleSave(item: BerxFeedItem) {
		try {
			const res = savedGuids.has(item.guid) ? await api.unsavePost(item.guid) : await api.savePost(item.guid);
			setSavedGuids((prev: Set<number>) => {
				const next = new Set(prev);
				if (res.is_saved) next.add(item.guid);
				else next.delete(item.guid);
				return next;
			});
		} catch {
			// Real server rejection — nothing optimistic.
		}
	}

	// ENVIRONMENT LEAD — the reference set never opens on a strip of
	// small circles; it opens on one dominant photographic object. The
	// lead is the newest REAL post that actually carries media. It is
	// removed from the Moments band below so nothing renders twice, and
	// when no post has media there is simply no lead — never a
	// placeholder plate.
	const leadIndex = items.findIndex((it: BerxFeedItem) => !!it.media_url);
	const lead = leadIndex >= 0 ? items[leadIndex] : null;
	const restItems = lead ? items.filter((_it: BerxFeedItem, i: number) => i !== leadIndex) : items;

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
				{/* ================= REFERENCE COMPOSITION =================
				    The reference home screen is a PHOTOGRAPH that fills the
				    device, with every control floating on top of it: identity
				    and utilities at the top, the story rail under them, the
				    action rail down the right edge, and the author, caption and
				    comment composer along the bottom. BERX previously stacked
				    those as separate blocks above a card; they are now layers
				    over one full-screen image.

				    With no post carrying media there is nothing to fill the
				    screen with, so the same elements fall back to the flat
				    header they had before rather than opening on a black
				    rectangle. ============================================= */}
				{lead ? (
					<View style={styles.stage}>
						<BerxSpatialLayer plane="background" driver={scrollY} range={220} style={styles.stageMediaLayer}>
							<Image
								source={{uri: lead.media_url as string}}
								style={styles.stageMedia}
								resizeMode="cover"
							/>
						</BerxSpatialLayer>
						<BerxScrim coverage={0.42} strength={0.86} from="top" />
						<BerxScrim coverage={0.58} strength={0.94} />

						<View style={styles.stageTop} pointerEvents="box-none">
							<BerxGreetingHeader
								greeting={daypart.label}
								name={me ? me.fullname || me.username : 'BERX'}
								avatarUrl={me ? me.icon_url : null}
								onPressIdentity={onOpenMyProfile}
								actions={[
									...(onOpenSearch ? [{key: 'search', icon: <IconSearch size={17} color={colors.onMedia} />, onPress: onOpenSearch}] : []),
									...(onOpenMessages
										? [{key: 'msg', icon: <IconMessage size={17} color={colors.onMedia} />, badge: unread, onPress: onOpenMessages}]
										: []),
									...(onOpenNotifications
										? [{key: 'bell', icon: <IconBell size={17} color={colors.onMedia} />, onPress: onOpenNotifications}]
										: []),
								]}
								onMedia
							/>
							{storyGroups.length > 0 || onCreateStory ? (
								<BerxStoryRail
									style={styles.stageStories}
									onCreate={onCreateStory}
									onMore={onOpenStories}
									onMedia
									items={storyGroups.map((g: BerxStoryFeedGroup) => ({
										key: String(g.owner_guid),
										label: g.owner_username ?? `#${g.owner_guid}`,
										iconUrl: g.owner_icon,
										unseen: g.has_unseen,
										onPress: () => onOpenStoryGroup(g),
									}))}
								/>
							) : null}
						</View>

						<BerxActionRail actions={railFor(lead)} style={styles.stageRail} />

						<View style={styles.stageBottom} pointerEvents="box-none">
							<Pressable
								style={styles.stageAuthor}
								onPress={() => lead.poster_username && onOpenProfile(lead.poster_username)}
								disabled={!lead.poster_username}>
								{lead.poster_icon ? (
									<Image source={{uri: lead.poster_icon}} style={styles.stageAvatar} />
								) : null}
								<Text style={styles.stageName} numberOfLines={1}>
									{lead.poster_username ?? lead.owner_username ?? 'BERX'}
								</Text>
								{lead.poster_is_creator ? <Text style={styles.stageVerified}>✓</Text> : null}
								<Text style={styles.stageTime}>{relativeTimeLabel(lead.time_created)}</Text>
							</Pressable>
							{lead.text ? (
								<Text style={styles.stageCaption} numberOfLines={2}>
									{lead.text}
								</Text>
							) : null}
							{lead.track_title ? (
								<Pressable
									style={styles.stageTrack}
									onPress={lead.track_guid ? () => onOpenPost(lead.track_guid as number) : undefined}
									disabled={!lead.track_guid}>
									<Text style={styles.stageTrackText} numberOfLines={1}>
										♪  {lead.track_title}
									</Text>
								</Pressable>
							) : null}
							<Pressable style={styles.stageComment} onPress={() => onOpenPost(lead.guid)}>
								<Text style={styles.stageCommentText}>Добавить комментарий</Text>
								<View style={styles.stageSend}>
									<BerxIcon name="send" size={16} color={colors.onAccent} />
								</View>
							</Pressable>
						</View>
					</View>
				) : (
					<BerxFadeIn>
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
						<Text style={styles.dateLine}>{todayLabel}</Text>
						<BerxEditorialTitle lines={headline.lines} accentIndex={headline.accentIndex} style={styles.headline} />
						{storyGroups.length > 0 || onCreateStory ? (
							<BerxStoryRail
								style={styles.liveLayer}
								onCreate={onCreateStory}
								onMore={onOpenStories}
								items={storyGroups.map((g: BerxStoryFeedGroup) => ({
									key: String(g.owner_guid),
									label: g.owner_username ?? `#${g.owner_guid}`,
									iconUrl: g.owner_icon,
									unseen: g.has_unseen,
									onPress: () => onOpenStoryGroup(g),
								}))}
							/>
						) : null}
					</BerxFadeIn>
				)}

				<BerxFadeIn>
					{/* PEOPLE — real presence, or real mutual-friend discovery when nobody is online. */}
					{peopleToShow.length > 0 ? (
						<BerxDepthCard driver={scrollY} maxAngle={4} depthScale={0.03} elevation={1} style={styles.section}>
							<SectionHead
								title={online.length > 0 ? 'Кто рядом сейчас' : 'Возможно, вы знакомы'}
								count={online.length > 0 ? online.length : undefined}
								live={online.length > 0}
								onMore={onOpenPeople}
							/>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railScroll} contentContainerStyle={styles.rail}>
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
						</BerxDepthCard>
					) : null}

					{/* PLACES — real places; distance ranking lives in Nearby (needs real coordinates). */}
					{places.length > 0 ? (
						<BerxDepthCard driver={scrollY} maxAngle={4} depthScale={0.03} elevation={1} style={styles.section}>
							<SectionHead title="Места вокруг" onMore={onOpenNearby ?? onOpenPlaces} moreLabel={onOpenNearby ? 'Рядом' : undefined} />
							<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railScroll} contentContainerStyle={styles.rail}>
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
						</BerxDepthCard>
					) : null}

					{/* EVENTS — real upcoming events as wide cinematic cards. */}
					{events.length > 0 ? (
						<BerxDepthCard driver={scrollY} maxAngle={4} depthScale={0.03} elevation={1} style={styles.section}>
							<SectionHead title="Что происходит" onMore={onOpenEvents} />
							<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railScroll} contentContainerStyle={styles.rail}>
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
						</BerxDepthCard>
					) : null}

					{/* SOCIAL CONTEXT — real trending tags from real posts. */}
					{trending.length > 0 && onOpenHashtag ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.railScroll}
							contentContainerStyle={styles.trendingRail}>
							{trending.slice(0, 8).map((h: BerxTrendingHashtag) => (
								<Pressable key={h.hashtag} style={styles.trendingChip} onPress={() => onOpenHashtag(h.hashtag)}>
									<Text style={styles.trendingChipText}>#{h.hashtag}</Text>
								</Pressable>
							))}
						</ScrollView>
					) : null}

					{/* MOMENTS — the real posts. Photography-first when the post genuinely has media. */}
					<View style={styles.section}>
						<SectionHead title="Моменты" />
						{restItems.length === 0 ? (
							<Text style={styles.quiet}>
								{lead
									? 'Это всё за сейчас. Ваша стена — свои посты и посты друзей, а не общая лента всех подписок.'
									: 'Пока тихо. Это ваша стена — свои посты и посты друзей, а не общая лента всех подписок.'}
							</Text>
						) : (
							restItems.map((item: BerxFeedItem) => {
								const actions = railFor(item);
								const author = item.poster_username ?? item.owner_username ?? 'BERX';
								if (item.media_url) {
									return (
										<BerxDepthCard key={item.guid} driver={scrollY} elevation={3} style={styles.momentWrap}>
											<BerxImmersivePost
												imageUrl={item.media_url}
												mediaCount={item.media_count}
												authorName={author}
												authorIcon={item.poster_icon}
												authorVerified={item.poster_is_creator}
												timeLabel={relativeTimeLabel(item.time_created)}
												text={item.text}
												actions={actions}
												onPress={() => onOpenPost(item.guid)}
												onPressAuthor={() => item.poster_username && onOpenProfile(item.poster_username)}
												trackTitle={item.track_title}
												onOpenTrack={item.track_guid ? () => onOpenPost(item.track_guid as number) : undefined}
												onOpenComments={() => onOpenPost(item.guid)}>
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
										</BerxDepthCard>
									);
								}
								return (
									<BerxDepthCard key={item.guid} driver={scrollY} elevation={1} maxAngle={5}>
									<Pressable style={styles.unit} onPress={() => onOpenPost(item.guid)}>
										<Pressable
											style={styles.bylineRow}
											onPress={() => item.poster_username && onOpenProfile(item.poster_username)}
											disabled={!item.poster_username}
											hitSlop={8}>
											<BerxAvatarStack
												people={[{guid: item.poster_guid, icon: item.poster_icon, initial: author.charAt(0)}]}
												size={26}
											/>
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
									</BerxDepthCard>
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
				<Pressable onPress={onMore} hitSlop={8} style={styles.sectionMorePill}>
					<Text style={styles.sectionMore}>{moreLabel ?? 'Все'}</Text>
					<Text style={styles.sectionMoreArrow}>›</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	railScroll: {flexGrow: 0, flexShrink: 0},
	screen: {flex: 1, backgroundColor: colors.bg},
	scroll: {flex: 1},
	scrollContent: {paddingBottom: 132},
	skeletonWrap: {padding: spacing.lg, paddingTop: spacing.xl},
	skelGap: {marginTop: spacing.md},

	stage: {height: STAGE_H, overflow: 'hidden', backgroundColor: colors.mediaScrim},
	stageMediaLayer: {position: 'absolute', left: 0, right: 0, top: 0, height: STAGE_H + 220},
	stageMedia: {width: '100%', height: '100%'},
	stageTop: {position: 'absolute', left: 0, right: 0, top: 0},
	stageStories: {marginTop: spacing.md},
	stageRail: {position: 'absolute', right: spacing.md, top: '34%'},
	stageBottom: {position: 'absolute', left: 0, right: 0, bottom: 108, paddingHorizontal: spacing.lg, gap: spacing.sm},
	stageAuthor: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	stageAvatar: {width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)'},
	stageName: {color: colors.onMedia, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	stageVerified: {
		color: colors.onAccent,
		fontSize: 10,
		fontWeight: typography.weightBold,
		backgroundColor: colors.accent,
		width: 15,
		height: 15,
		borderRadius: 8,
		textAlign: 'center',
		lineHeight: 15,
		overflow: 'hidden',
	},
	stageTime: {color: colors.onMediaDim, fontSize: typography.sizeXs},
	stageCaption: {color: colors.onMedia, fontSize: typography.sizeLg, fontWeight: typography.weightMedium, lineHeight: 23},
	stageTrack: {
		alignSelf: 'flex-start',
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(255,255,255,0.14)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.22)',
		maxWidth: '82%',
	},
	stageTrackText: {color: colors.onMedia, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	stageComment: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.xs,
		paddingLeft: spacing.lg,
		paddingRight: 5,
		paddingVertical: 5,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(255,255,255,0.12)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.22)',
	},
	stageCommentText: {flex: 1, color: colors.onMediaDim, fontSize: typography.sizeSm},
	stageSend: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.accent,
	},
	stageSendGlyph: {color: colors.onAccent, fontSize: 15},
	dateLine: {
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		fontWeight: typography.weightMedium,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
	},
	headline: {paddingTop: 2, paddingBottom: 0},
	liveLayer: {marginTop: spacing.md},
	leadLayer: {marginTop: spacing.md, paddingHorizontal: spacing.sm},

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
		fontSize: typography.sizeLg,
		fontWeight: typography.weightBold,
		letterSpacing: -0.4,
	},
	sectionMorePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
		paddingLeft: spacing.md,
		paddingRight: spacing.sm,
		paddingVertical: 6,
		borderRadius: radius.pill,
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	sectionMore: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	sectionMoreArrow: {color: colors.accent, fontSize: typography.sizeSm, lineHeight: 15},
	rail: {paddingHorizontal: spacing.lg, gap: spacing.md},
	railItem: {marginRight: spacing.md},

	trendingRail: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.xl},
	trendingChip: {
		paddingHorizontal: spacing.lg,
		paddingVertical: 9,
		borderRadius: radius.pill,
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	trendingChipText: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},

	quiet: {color: colors.textDim, fontSize: typography.sizeSm, paddingHorizontal: spacing.lg, lineHeight: 20},
	momentWrap: {paddingHorizontal: spacing.sm, marginBottom: spacing.lg},
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
