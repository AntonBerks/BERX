/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * The reference images showed a stats row (публикации/подписчики/
 * подписки) — deliberately NOT added as follower/following counts
 * (OSSN's real model is mutual friendship, not one-directional follow
 * — see friend.php). What IS now shown: a real `reputation` row (see
 * docs/BERX_FUTURE_LAYER_SPEC.md — Future Identity), both /me and
 * /profiles/{username} return it as of this session, real live
 * COUNT()s, not invented. time_created (real, own-profile-only) is
 * used for an honest "on BERX since {date}" line.
 *
 * Future UI pass: the reputation row now sits on a BerxGlassSurface
 * strip (Future Identity gets real material presence, not a plain
 * text row) and the hero + menu sections get a staggered BerxFadeIn
 * entrance. The menu's own grouped-sheet look (menuGroup) is left as
 * is — it already reads as a distinct surface from the glass cards,
 * which keeps the screen from becoming "everything the same card".
 *
 * MAX BUILD — Future Identity: for the own profile only (GET
 * /identity/me is caller-scoped, there is no cross-user identity in
 * v1), fetched best-effort alongside the profile itself and never
 * blocking it on failure. Renders real level/streak, a horizontal
 * strip of achievements (deterministic thresholds over real counts —
 * see identity.php's own header, never an invented badge), and real
 * interest tags derived from the categories of places the caller has
 * actually saved/reviewed. This is "Profile + Life Graph + Reputation
 * + Experiences = one living identity" — composed into the existing
 * Profile screen rather than a new separate screen. Root View is now
 * a ScrollView: this section makes the page long enough that it
 * needed one (previously it didn't, on some accounts).
 *
 * MAX BUILD — real safety gap closed: block.php/OssnBlock and
 * BlockedUsersScreen (view/unblock) were fully real, but no screen
 * ever called api.blockUser() — there was no way to actually block
 * someone from the app, only to manage an already-existing block.
 * Added "Заблокировать" next to the existing "Пожаловаться" link for
 * other users, with a real native confirm (Alert.alert, no new
 * dependency) since it's a consequential action, then a real
 * navigation back — no reason to keep viewing someone you just
 * blocked.
 *
 * MAX BUILD — real editorial hero pass, user-directed with an explicit
 * reference image. Full-bleed portrait (cover_url when set, otherwise
 * the real avatar itself — never a placeholder image) replaces the
 * small circular-avatar-on-black-background layout; same honest
 * 5-step scrim simulation BerxScrimHero already uses elsewhere (no
 * gradient library installed), inlined here rather than reused
 * because this hero also carries the avatar overlay + stat row +
 * CTA, which BerxScrimHero's own children slot wasn't shaped for.
 * The online dot is real (OssnUser::isOnline(10), profiles.php's own
 * is_online — added this same pass), never decorative. The
 * "Написать"/friend-request action now uses BerxGradientCTA — a real,
 * DELIBERATELY SCOPED violet→orange exception to the cyan-only accent
 * rule, see BERX_DECISIONS.md's own "Editorial CTA gradient" entry —
 * every other control on this screen keeps the systemic cyan accent
 * unchanged.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, ScrollView, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAuthState} from '@berx/auth';
import type {BerxIdentity, BerxIdentityAchievement, BerxIdentityInterest, BerxStorySummary, BerxStoryFeedGroup, BerxPostDetail} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGradientCTA} from '../../../../packages/design-system/src/components/BerxGradientCTA';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {IconHeart, IconLock, IconBell, IconStar, IconUsers, IconChevronRight, IconEdit} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

const HERO_SCRIM_STEPS = [0, 0.12, 0.3, 0.58, 0.9];

interface ProfileData {
	guid?: number;
	username: string;
	fullname: string;
	icon_url: string;
	/** Real profile cover photo (OssnProfile::getCoverURL()) — null/absent until the user actually uploads one. */
	cover_url?: string | null;
	profile_url: string;
	email?: string;
	time_created?: number;
	is_friend?: boolean;
	is_creator?: boolean;
	/** Own profile (/me) only — real signal (Max Build), server re-checks independently on every actual admin route. */
	is_admin?: boolean;
	/** Real moderation state (OssnUser::ban()) — present on both own and non-own profiles. */
	banned?: boolean;
	/** Real presence (OssnUser::isOnline(10)) — absent/undefined on own profile (me.php doesn't return it; showing your own "online" dot to yourself is meaningless). */
	is_online?: boolean;
	reputation?: {places_reviewed: number; events_going: number; trips_created: number; experiences_created: number};
}

interface Props {
	api: BerxApiClient;
	authState: BerxAuthState;
	username?: string;
	onBack?: () => void;
	onMessage?: (otherGuid: number, otherUsername: string) => void;
	onOpenNotifications?: () => void;
	/** Placed right next to Notifications in the menu — real request: "меню рядом с уведомлением где копится опыт и баллы". */
	onOpenPoints?: () => void;
	onOpenMissions?: () => void;
	onOpenLifeGraph?: () => void;
	onOpenMemories?: () => void;
	onOpenWrapped?: () => void;
	onOpenDatingPrivacy?: () => void;
	onOpenDatingProfile?: () => void;
	onOpenDatingPhotos?: () => void;
	onOpenCommunities?: () => void;
	onOpenPlans?: () => void;
	onOpenWorlds?: () => void;
	onOpenNext?: () => void;
	onOpenMyMoments?: () => void;
	onOpenDating?: () => void;
	onOpenPlaces?: () => void;
	onOpenEvents?: () => void;
	onOpenSettings?: () => void;
	onOpenBERXWorld?: () => void;
	onOpenAlbums?: (userGuid: number, isOwn: boolean) => void;
	onOpenCollections?: (userGuid: number, isOwn: boolean) => void;
	onOpenTrips?: (userGuid: number, isOwn: boolean) => void;
	onOpenExperiences?: (userGuid: number, isOwn: boolean) => void;
	onOpenCreatorProfile?: () => void;
	onOpenCreatorSettings?: () => void;
	onOpenMyVideos?: (userGuid: number, isOwn: boolean) => void;
	onOpenMyTracks?: (userGuid: number, isOwn: boolean) => void;
	/** Own-only quick bookmark list (Max Build) — separate from onOpenCollections, which is viewable for others too. */
	onOpenSavedPosts?: () => void;
	onOpenEditProfile?: () => void;
	onOpenMyPlaceClaims?: () => void;
	onOpenRecentCheckins?: () => void;
	onOpenAdminPlaceClaims?: () => void;
	/** Real is_admin-gated section (Max Build) — see me.php's own header for why the client can finally know this. */
	onOpenAdminUnvalidated?: () => void;
	onOpenAdminReports?: () => void;
	onReport?: (targetGuid: number) => void;
	/** MAX BUILD — real Story Highlights rail (see classes/OssnStories.php's own header). Opens the same StoryViewer route the main Stories rail already uses. */
	onOpenStoryGroup?: (group: BerxStoryFeedGroup) => void;
	/** MAX BUILD — real Pinned Post card (see posts.php's own header for the pin mechanism). */
	onOpenPost?: (guid: number) => void;
}

function joinedYear(unixSeconds?: number): string | null {
	if (!unixSeconds) return null;
	return new Date(unixSeconds * 1000).getFullYear().toString();
}

export default function ProfileScreen({api, authState, username, onBack, onMessage, onOpenNotifications, onOpenPoints, onOpenMissions, onOpenLifeGraph, onOpenMemories, onOpenWrapped, onOpenDatingPrivacy, onOpenDatingProfile, onOpenDatingPhotos, onOpenCommunities, onOpenPlans, onOpenWorlds, onOpenNext, onOpenMyMoments, onOpenDating, onOpenPlaces, onOpenEvents, onOpenSettings, onOpenBERXWorld, onOpenAlbums, onOpenCollections, onOpenTrips, onOpenExperiences, onOpenCreatorProfile, onOpenCreatorSettings, onOpenMyVideos, onOpenMyTracks, onOpenSavedPosts, onOpenEditProfile, onOpenMyPlaceClaims, onOpenRecentCheckins, onOpenAdminUnvalidated, onOpenAdminReports, onOpenAdminPlaceClaims, onReport, onOpenStoryGroup, onOpenPost}: Props) {
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [identity, setIdentity] = useState<BerxIdentity | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [friendBusy, setFriendBusy] = useState(false);
	const [blocking, setBlocking] = useState(false);
	const [pokeBusy, setPokeBusy] = useState(false);
	const [pokeStatus, setPokeStatus] = useState<string | null>(null);
	const [banBusy, setBanBusy] = useState(false);
	const [unreadNotifications, setUnreadNotifications] = useState(0);
	const [nextCount, setNextCount] = useState(0);
	const [highlights, setHighlights] = useState<BerxStorySummary[]>([]);
	const [storyAuthHeaders, setStoryAuthHeaders] = useState<Record<string, string>>({});
	const [pinnedPost, setPinnedPost] = useState<BerxPostDetail | null>(null);
	const isOwn = !username;

	async function load() {
		setLoading(true);
		try {
			const data = isOwn ? await api.me() : await api.getProfile(username!);
			setProfile(data);
			setError(null);
			// Future Identity — own profile only, best-effort: a failed
			// fetch must never block the profile itself from showing.
			if (isOwn) {
				api.identity().then((res) => setIdentity(res.identity)).catch(() => undefined);
				// MAX BUILD — real unread badge (unreadNotificationCount()
				// was always a real client method with zero callers).
				api.unreadNotificationCount().then((res) => setUnreadNotifications(res.unread_count)).catch(() => undefined);
				// BERX Next — real count of things actually waiting on a
				// response (pending Plan/World invites), NOT upcoming events —
				// an event doesn't need a decision, an invite does.
				api.next().then((res) => setNextCount(res.pending_plan_invites.length + res.pending_world_invites.length)).catch(() => undefined);
			}
			// MAX BUILD — real Story Highlights rail, best-effort: a failed
			// fetch must never block the profile itself from showing.
			if (data.guid) {
				api.storyHighlights(data.guid).then((res) => setHighlights(res.stories)).catch(() => undefined);
				api.getAuthHeaders().then(setStoryAuthHeaders).catch(() => undefined);
				api.pinnedPost(data.guid).then((res) => setPinnedPost(res.post)).catch(() => undefined);
			}
		} catch {
			setError(isOwn ? 'Не удалось загрузить профиль' : 'Профиль недоступен');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [username]);

	async function toggleFriend() {
		if (!profile?.guid) return;
		setFriendBusy(true);
		try {
			if (profile.is_friend) {
				await api.removeFriend(profile.guid);
				setProfile({...profile, is_friend: false});
			} else {
				await api.addFriend(profile.guid);
				// Real state: the request may still be one-directional
				// (pending) if the other side hasn't confirmed —
				// re-fetching rather than optimistically marking
				// is_friend=true, which would claim mutual friendship
				// before the server actually confirms it.
				await load();
			}
		} catch {
			// state left as-is on failure — never optimistically flipped before the server confirms
		} finally {
			setFriendBusy(false);
		}
	}

	/**
	 * MAX BUILD — closes a real gap found by an orphan-method sweep:
	 * api.pokeUser() (real POST /poke/{guid}, OssnPoke::addPoke(), a
	 * real notification for the target — see poke.php) was always a
	 * real, working client method with zero UI caller anywhere.
	 * Server-side cooldown (429, one real poke per pair per 24h,
	 * poke.php) is surfaced honestly rather than silently swallowed.
	 */
	async function handlePoke() {
		if (!profile?.guid) return;
		setPokeBusy(true);
		setPokeStatus(null);
		try {
			await api.pokeUser(profile.guid);
			setPokeStatus('Отправлено!');
		} catch (e) {
			setPokeStatus(e instanceof BerxApiError && e.code === 'rate_limited' ? 'Вы уже толкали этого пользователя недавно' : 'Не удалось отправить');
		} finally {
			setPokeBusy(false);
		}
	}

	/**
	 * MAX BUILD — real admin moderation action (OssnUser::ban()/
	 * unban(), see report.php's own user-report action and
	 * admin.php's /admin/ban and /admin/unban routes). Gated here by
	 * the CALLER's own is_admin (authState's real /me-sourced value,
	 * same pattern AppShell already uses for isAdmin on
	 * PlaceDetailScreen) — profile.is_admin on a non-own profile would
	 * be the VIEWED user's admin status, not the caller's, so it's
	 * deliberately not used for this gate.
	 */
	function confirmBanToggle() {
		if (!profile?.guid) return;
		const willBan = !profile.banned;
		Alert.alert(
			willBan ? 'Забанить пользователя?' : 'Разбанить пользователя?',
			willBan
				? `${profile.fullname || profile.username} больше не сможет войти в BERX ни с одного устройства.`
				: `${profile.fullname || profile.username} снова сможет пользоваться BERX.`,
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: willBan ? 'Забанить' : 'Разбанить',
					style: willBan ? 'destructive' : 'default',
					onPress: async () => {
						if (!profile.guid) return;
						setBanBusy(true);
						try {
							if (willBan) {
								await api.banUser(profile.guid);
							} else {
								await api.unbanUser(profile.guid);
							}
							setProfile({...profile, banned: willBan});
						} catch {
							// real server rejection — state left as-is
						} finally {
							setBanBusy(false);
						}
					},
				},
			]
		);
	}

	function handleBlock() {
		if (!profile?.guid) return;
		Alert.alert(
			'Заблокировать пользователя?',
			`${profile.fullname || profile.username} больше не сможет писать вам и видеть ваш профиль. Вы сможете отменить это в любой момент в настройках.`,
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Заблокировать',
					style: 'destructive',
					onPress: async () => {
						setBlocking(true);
						try {
							await api.blockUser(profile.guid!);
							onBack?.();
						} catch {
							// real server rejection — nothing optimistic, user stays on the profile
						} finally {
							setBlocking(false);
						}
					},
				},
			]
		);
	}

	if (loading) {
		return (
			<ScrollView style={styles.screen}>
				{onBack ? <BerxHeader onBack={onBack} /> : null}
				<BerxLoadingState label="Загрузка профиля..." />
			</ScrollView>
		);
	}
	if (error || !profile) {
		return (
			<ScrollView style={styles.screen}>
				{onBack ? <BerxHeader onBack={onBack} /> : null}
				<BerxErrorState message={error ?? 'Профиль не найден'} onRetry={load} />
			</ScrollView>
		);
	}

	const year = joinedYear(profile.time_created);

	return (
		<ScrollView style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title={profile.username} /> : null}

			<BerxFadeIn riseFrom={0}>
				<View style={styles.hero}>
					{profile.cover_url || profile.icon_url ? (
						<Image source={{uri: profile.cover_url ?? profile.icon_url}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
					) : (
						<View style={[StyleSheet.absoluteFillObject, styles.heroFallback]}>
							<Text style={styles.heroFallbackGlyph}>{profile.username.charAt(0).toUpperCase()}</Text>
						</View>
					)}
					<View style={StyleSheet.absoluteFillObject} pointerEvents="none">
						{HERO_SCRIM_STEPS.map((opacity, i) => (
							<View key={i} style={[styles.heroScrimStep, {height: `${100 - i * 18}%`, backgroundColor: `rgba(5,5,5,${opacity})`}]} />
						))}
					</View>

					{!isOwn && typeof profile.is_online === 'boolean' ? (
						<View style={styles.onlineBadgeWrap}>
							<View style={[styles.onlineDot, profile.is_online ? styles.onlineDotActive : styles.onlineDotOffline]} />
						</View>
					) : null}

					<View style={styles.heroContent}>
						{profile.cover_url ? (
							<Berx3DTilt style={styles.heroAvatarRing} maxAngle={12}>
								<Image source={{uri: profile.icon_url}} style={styles.heroAvatar} />
							</Berx3DTilt>
						) : null}
						<Text style={styles.heroWordmark}>{profile.fullname || profile.username}</Text>
						<Text style={styles.heroUsername}>@{profile.username}</Text>
						{!isOwn && (profile.mutual_friends_count > 0 || profile.mutual_communities_count > 0) ? (
							<Text style={styles.mutualFriends}>
								{[
									profile.mutual_friends_count > 0 ? (profile.mutual_friends_count === 1 ? '1 общий друг' : `${profile.mutual_friends_count} общих друзей`) : null,
									profile.mutual_communities_count > 0 ? (profile.mutual_communities_count === 1 ? '1 общее сообщество' : `${profile.mutual_communities_count} общих сообществ`) : null,
								].filter(Boolean).join(' · ')}
							</Text>
						) : null}
						{year ? <Text style={styles.joined}>На BERX с {year} года</Text> : null}

						{profile.reputation ? (
							<View style={styles.reputationRow}>
								{profile.reputation.places_reviewed > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.places_reviewed}</Text><Text style={styles.reputationLabel}>отзывов</Text></View> : null}
								{profile.reputation.events_going > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.events_going}</Text><Text style={styles.reputationLabel}>событий</Text></View> : null}
								{profile.reputation.trips_created > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.trips_created}</Text><Text style={styles.reputationLabel}>поездок</Text></View> : null}
								{profile.reputation.experiences_created > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.experiences_created}</Text><Text style={styles.reputationLabel}>впечатлений</Text></View> : null}
								{profile.reputation.checkins_count > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.checkins_count}</Text><Text style={styles.reputationLabel}>отметок</Text></View> : null}
								{profile.reputation.worlds_created > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.worlds_created}</Text><Text style={styles.reputationLabel}>миров</Text></View> : null}
							</View>
						) : null}

						{!isOwn && profile.guid && onMessage ? (
							<BerxGradientCTA label="Написать" onPress={() => onMessage(profile.guid!, profile.username)} fullWidth />
						) : null}
					</View>
				</View>
			</BerxFadeIn>

			{highlights.length > 0 && onOpenStoryGroup && profile.guid ? (
				<BerxFadeIn style={styles.highlightsRail} delayMs={40}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{highlights.map((s: BerxStorySummary) => (
							<Pressable
								key={s.id}
								style={styles.highlightItem}
								onPress={() =>
									onOpenStoryGroup({
										owner_guid: profile.guid!,
										owner_username: profile.username,
										stories: [s],
									})
								}
							>
								<View style={styles.highlightRing}>
									{s.mime_type === 'video/mp4' ? (
										<View style={styles.highlightVideoFallback}><Text style={styles.highlightVideoIcon}>▶</Text></View>
									) : (
										<Image source={{uri: api.storyMediaUrl(s.id), headers: storyAuthHeaders}} style={styles.highlightThumb} />
									)}
								</View>
								{s.caption ? <Text style={styles.highlightLabel} numberOfLines={1}>{s.caption}</Text> : null}
							</Pressable>
						))}
					</ScrollView>
				</BerxFadeIn>
			) : null}

			{pinnedPost && onOpenPost ? (
				<BerxFadeIn style={styles.pinnedSection} delayMs={50}>
					<Pressable onPress={() => onOpenPost(pinnedPost.guid)}>
						<BerxGlassSurface elevated padding="md" style={styles.pinnedCard}>
							<Text style={styles.pinnedLabel}>📌 Закреплено</Text>
							<Text style={styles.pinnedText} numberOfLines={3}>{pinnedPost.text}</Text>
						</BerxGlassSurface>
					</Pressable>
				</BerxFadeIn>
			) : null}

			{isOwn && identity ? (
				<BerxFadeIn style={styles.identitySection} delayMs={60}>
					{identity.current_streak > 0 || identity.level > 1 ? (
						<BerxGlassSurface elevated padding="sm" style={styles.levelRow}>
							<Text style={styles.levelText}>Уровень {identity.level}</Text>
							{identity.current_streak > 0 ? <Text style={styles.streakText}>🔥 {identity.current_streak} {identity.current_streak === 1 ? 'день' : 'дней'} подряд</Text> : null}
						</BerxGlassSurface>
					) : null}

					{identity.achievements.some((a: BerxIdentityAchievement) => a.tier > 0) ? (
						<View>
							<Text style={styles.identitySectionTitle}>Достижения</Text>
							<View style={styles.achievementRow}>
								{identity.achievements.filter((a: BerxIdentityAchievement) => a.tier > 0).map((a: BerxIdentityAchievement) => (
									<View key={a.key} style={styles.achievementChipWrap}>
										<BerxGlassSurface padding="sm" style={styles.achievementChip}>
											<Text style={styles.achievementTitle} numberOfLines={1}>{a.tier_label}</Text>
											<Text style={styles.achievementSubtitle} numberOfLines={1}>{a.label}</Text>
										</BerxGlassSurface>
									</View>
								))}
							</View>
						</View>
					) : null}

					{identity.interests.length > 0 ? (
						<View>
							<Text style={styles.identitySectionTitle}>Интересы</Text>
							<View style={styles.interestRow}>
								{identity.interests.map((it: BerxIdentityInterest) => (
									<View key={it.category} style={styles.interestPill}>
										<Text style={styles.interestPillText}>{it.category}</Text>
									</View>
								))}
							</View>
						</View>
					) : null}
				</BerxFadeIn>
			) : null}

			{!isOwn && profile.guid ? (
				<View style={styles.actionRow}>
					<BerxButton
						label={profile.is_friend ? 'Удалить из друзей' : 'Добавить в друзья'}
						variant="secondary"
						loading={friendBusy}
						onPress={toggleFriend}
						fullWidth
					/>
				</View>
			) : null}

			{!isOwn && profile.guid ? (
				<View style={styles.actionRow}>
					<BerxButton label="👋 Толкнуть" variant="secondary" loading={pokeBusy} onPress={handlePoke} fullWidth />
					{pokeStatus ? <Text style={styles.pokeStatus}>{pokeStatus}</Text> : null}
				</View>
			) : null}

			{!isOwn && profile.banned ? (
				<View style={styles.actionRow}>
					<Text style={styles.bannedBanner}>⛔ Аккаунт заблокирован администрацией BERX</Text>
				</View>
			) : null}

			{!isOwn && profile.guid && authState.getSnapshot().user?.is_admin ? (
				<View style={styles.actionRow}>
					<BerxButton
						label={profile.banned ? 'Разбанить' : 'Забанить'}
						variant={profile.banned ? 'secondary' : 'danger'}
						loading={banBusy}
						onPress={confirmBanToggle}
						fullWidth
					/>
				</View>
			) : null}

			{profile.guid && onOpenAlbums ? (
				<View style={styles.actionRow}>
					<BerxButton label="Альбомы" variant="secondary" onPress={() => onOpenAlbums(profile.guid!, isOwn)} fullWidth />
				</View>
			) : null}

			{profile.guid && onOpenCollections ? (
				<View style={styles.actionRow}>
					<BerxButton label="Подборки" variant="secondary" onPress={() => onOpenCollections(profile.guid!, isOwn)} fullWidth />
				</View>
			) : null}

			{profile.guid && onOpenTrips ? (
				<View style={styles.actionRow}>
					<BerxButton label="Поездки" variant="secondary" onPress={() => onOpenTrips(profile.guid!, isOwn)} fullWidth />
				</View>
			) : null}

			{profile.guid && onOpenExperiences ? (
				<View style={styles.actionRow}>
					<BerxButton label="Впечатления" variant="secondary" onPress={() => onOpenExperiences(profile.guid!, isOwn)} fullWidth />
				</View>
			) : null}

			{isOwn && onOpenCreatorSettings ? (
				<View style={styles.actionRow}>
					<BerxButton label="Режим автора" variant="secondary" onPress={onOpenCreatorSettings} fullWidth />
				</View>
			) : null}

			{!isOwn && profile.is_creator && onOpenCreatorProfile ? (
				<View style={styles.actionRow}>
					<BerxButton label="Профиль автора" variant="secondary" onPress={onOpenCreatorProfile} fullWidth />
				</View>
			) : null}

			{profile.guid && onOpenMyVideos ? (
				<View style={styles.actionRow}>
					<BerxButton label={isOwn ? 'Мои видео' : 'Видео'} variant="secondary" onPress={() => onOpenMyVideos(profile.guid!, isOwn)} fullWidth />
				</View>
			) : null}

			{profile.guid && onOpenMyTracks ? (
				<View style={styles.actionRow}>
					<BerxButton label={isOwn ? 'Мои треки' : 'Треки'} variant="secondary" onPress={() => onOpenMyTracks(profile.guid!, isOwn)} fullWidth />
				</View>
			) : null}

			{!isOwn && profile.guid ? (
				<View style={styles.actionRow}>
					<Pressable onPress={handleBlock} hitSlop={8} disabled={blocking}>
						<Text style={styles.blockLink}>{blocking ? 'Блокировка…' : 'Заблокировать пользователя'}</Text>
					</Pressable>
				</View>
			) : null}

			{!isOwn && profile.guid && onReport ? (
				<View style={styles.actionRow}>
					<Pressable onPress={() => onReport(profile.guid!)} hitSlop={8}>
						<Text style={styles.reportLink}>Пожаловаться на пользователя</Text>
					</Pressable>
				</View>
			) : null}

			{isOwn ? (
				<BerxFadeIn style={styles.menuList} delayMs={100}>
					<Text style={styles.sectionLabel}>Аккаунт</Text>
					<View style={styles.menuGroup}>
						{onOpenEditProfile ? <MenuRow label="Редактировать профиль" icon={<IconEdit size={18} color={colors.text} />} onPress={onOpenEditProfile} isFirst isLast /> : null}
					</View>

					<Text style={styles.sectionLabel}>Знакомства</Text>
					<View style={styles.menuGroup}>
						{onOpenDating ? <MenuRow label="Discover" icon={<IconHeart size={18} color={colors.text} />} onPress={onOpenDating} isFirst /> : null}
						{onOpenDatingProfile ? <MenuRow label="Анкета" icon={<IconHeart size={18} color={colors.text} />} onPress={onOpenDatingProfile} /> : null}
						{onOpenDatingPhotos ? <MenuRow label="Приватные фото" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenDatingPhotos} /> : null}
						{onOpenDatingPrivacy ? <MenuRow label="Приватность" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenDatingPrivacy} isLast /> : null}
					</View>

					<Text style={styles.sectionLabel}>BERX World</Text>
					<View style={styles.menuGroup}>
						{onOpenBERXWorld ? <MenuRow label="Обзор" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenBERXWorld} isFirst /> : null}
						{onOpenPlaces ? <MenuRow label="Места" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenPlaces} /> : null}
						{onOpenEvents ? <MenuRow label="События" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenEvents} /> : null}
						{onOpenCommunities ? <MenuRow label="Сообщества" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenCommunities} /> : null}
						{onOpenPlans ? <MenuRow label="Планы" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenPlans} /> : null}
						{onOpenWorlds ? <MenuRow label="Миры" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenWorlds} /> : null}
						{onOpenNext ? <MenuRow label="Дальше" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenNext} badge={nextCount} /> : null}
						{onOpenMyMoments ? <MenuRow label="Мои моменты" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenMyMoments} isLast /> : null}
					</View>

					<Text style={styles.sectionLabel}>Активность</Text>
					<View style={styles.menuGroup}>
						{onOpenNotifications ? <MenuRow label={unreadNotifications > 0 ? `Уведомления (${unreadNotifications})` : 'Уведомления'} icon={<IconBell size={18} color={colors.text} />} onPress={onOpenNotifications} isFirst /> : null}
						{onOpenPoints ? <MenuRow label="Баллы и уровень" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenPoints} /> : null}
						{onOpenMissions ? <MenuRow label="Задания дня" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenMissions} /> : null}
						{onOpenLifeGraph ? <MenuRow label="Ваш путь в BERX" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenLifeGraph} /> : null}
						{onOpenMemories ? <MenuRow label="Воспоминания" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenMemories} /> : null}
						{onOpenRecentCheckins ? <MenuRow label="Мои отметки" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenRecentCheckins} /> : null}
						{onOpenSavedPosts ? <MenuRow label="Сохранённые посты" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenSavedPosts} /> : null}
						{onOpenMyPlaceClaims ? <MenuRow label="Мои заявки на бизнес" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenMyPlaceClaims} /> : null}
						{onOpenWrapped ? <MenuRow label="BERX Wrapped" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenWrapped} /> : null}
						{onOpenSettings ? <MenuRow label="Настройки" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenSettings} isLast /> : null}
					</View>

					{profile.is_admin && (onOpenAdminUnvalidated || onOpenAdminReports || onOpenAdminPlaceClaims) ? (
						<>
							<Text style={styles.sectionLabel}>Администрирование</Text>
							<View style={styles.menuGroup}>
								{onOpenAdminUnvalidated ? <MenuRow label="Неподтверждённые пользователи" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenAdminUnvalidated} isFirst /> : null}
								{onOpenAdminReports ? <MenuRow label="Жалобы" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenAdminReports} /> : null}
								{onOpenAdminPlaceClaims ? <MenuRow label="Заявки на бизнес" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenAdminPlaceClaims} isLast /> : null}
							</View>
						</>
					) : null}

					<View style={styles.logoutWrap}>
						<BerxButton
							label="Выйти"
							variant="danger"
							onPress={() => authState.logout()}
							loading={authState.getSnapshot().status === 'loggingOut'}
							fullWidth
						/>
					</View>
				</BerxFadeIn>
			) : null}
		</ScrollView>
	);
}

function MenuRow({
	label,
	icon,
	onPress,
	isFirst,
	isLast,
	badge,
}: {
	label: string;
	icon: React.ReactNode;
	onPress: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	/** Real, honest count — omit or 0 renders nothing, never a fake "1". */
	badge?: number;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[
				styles.menuRow,
				!isFirst && styles.menuRowDivider,
				isFirst && styles.menuRowFirst,
				isLast && styles.menuRowLast,
			]}
		>
			<View style={styles.menuRowIcon}>{icon}</View>
			<Text style={styles.menuRowLabel}>{label}</Text>
			{badge ? (
				<View style={styles.menuRowBadge}>
					<Text style={styles.menuRowBadgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
				</View>
			) : null}
			<IconChevronRight size={16} color={colors.textFaint} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	hero: {height: 460, backgroundColor: colors.graphite, justifyContent: 'flex-end', overflow: 'hidden'},
	heroFallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	heroFallbackGlyph: {fontSize: typography.sizeHero, color: colors.textFaint, fontWeight: typography.weightBold},
	heroScrimStep: {position: 'absolute', left: 0, right: 0, bottom: 0},
	onlineBadgeWrap: {position: 'absolute', top: spacing.xl, right: spacing.lg},
	onlineDot: {width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.black},
	onlineDotActive: {backgroundColor: colors.success},
	onlineDotOffline: {backgroundColor: colors.textFaint},
	heroContent: {padding: spacing.xl, gap: spacing.xs},
	heroAvatarRing: {
		width: 72,
		height: 72,
		borderRadius: 36,
		borderWidth: 2,
		borderColor: colors.white,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: spacing.sm,
		backgroundColor: colors.black,
	},
	heroAvatar: {width: 64, height: 64, borderRadius: 32, backgroundColor: colors.graphite},
	heroWordmark: {
		color: colors.white,
		fontSize: typography.sizeHero,
		fontWeight: typography.weightBold,
		letterSpacing: -0.5,
	},
	heroUsername: {color: colors.textDim, fontSize: typography.sizeBase, marginTop: 2},
	highlightsRail: {paddingHorizontal: spacing.lg, marginBottom: spacing.md},
	highlightItem: {alignItems: 'center', width: 68, marginRight: spacing.md},
	highlightRing: {width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
	highlightThumb: {width: 54, height: 54, borderRadius: 27},
	highlightVideoFallback: {width: 54, height: 54, borderRadius: 27, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	highlightVideoIcon: {color: colors.white, fontSize: typography.sizeBase},
	highlightLabel: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4, textAlign: 'center'},
	pinnedSection: {paddingHorizontal: spacing.lg, marginBottom: spacing.md},
	pinnedCard: {gap: 4},
	pinnedLabel: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	pinnedText: {fontSize: typography.sizeSm, color: colors.text},
	identitySection: {paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.md},
	levelRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	levelText: {color: colors.white, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	streakText: {color: colors.textDim, fontSize: typography.sizeSm},
	identitySectionTitle: {color: colors.textFaint, fontSize: typography.sizeXs, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: spacing.xs},
	achievementRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
	achievementChipWrap: {width: '31%'},
	achievementChip: {gap: 2, minHeight: 60},
	achievementTitle: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	achievementSubtitle: {color: colors.textFaint, fontSize: 10},
	interestRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	interestPill: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	interestPillText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	joined: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.sm},
	mutualFriends: {color: colors.accent, fontSize: typography.sizeSm, marginTop: spacing.xs, fontWeight: typography.weightMedium},
	pokeStatus: {color: colors.textDim, fontSize: typography.sizeXs, textAlign: 'center', marginTop: spacing.xs},
	bannedBanner: {color: colors.danger, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, textAlign: 'center'},
	reputationRow: {flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm},
	reputationStat: {alignItems: 'flex-start'},
	reputationValue: {color: colors.white, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	reputationLabel: {color: colors.textDim, fontSize: typography.sizeXs},
	actionRow: {paddingHorizontal: spacing.xl},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center'},
	blockLink: {color: colors.danger, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center'},
	menuList: {paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md},
	sectionLabel: {color: colors.textFaint, fontSize: typography.sizeXs, marginBottom: spacing.xs, marginLeft: spacing.xs, textTransform: 'uppercase' as const, letterSpacing: 0.5},
	menuGroup: {
		backgroundColor: colors.graphite,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		overflow: 'hidden',
	},
	menuRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
	},
	menuRowFirst: {borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md},
	menuRowLast: {borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md},
	menuRowDivider: {borderTopWidth: 1, borderTopColor: colors.borderSoft},
	menuRowIcon: {width: 24, alignItems: 'center'},
	menuRowLabel: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
	menuRowBadge: {minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginRight: spacing.xs},
	menuRowBadgeText: {color: colors.black, fontSize: 11, fontWeight: typography.weightBold},
	logoutWrap: {marginTop: spacing.md},
});
