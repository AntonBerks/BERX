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
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, ScrollView, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAuthState} from '@berx/auth';
import type {BerxIdentity, BerxIdentityAchievement, BerxIdentityInterest} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {IconHeart, IconLock, IconBell, IconStar, IconUsers, IconChevronRight} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface ProfileData {
	guid?: number;
	username: string;
	fullname: string;
	icon_url: string;
	profile_url: string;
	email?: string;
	time_created?: number;
	is_friend?: boolean;
	is_creator?: boolean;
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
	onOpenCommunities?: () => void;
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
	onReport?: (targetGuid: number) => void;
}

function joinedYear(unixSeconds?: number): string | null {
	if (!unixSeconds) return null;
	return new Date(unixSeconds * 1000).getFullYear().toString();
}

export default function ProfileScreen({api, authState, username, onBack, onMessage, onOpenNotifications, onOpenPoints, onOpenMissions, onOpenLifeGraph, onOpenMemories, onOpenWrapped, onOpenDatingPrivacy, onOpenCommunities, onOpenDating, onOpenPlaces, onOpenEvents, onOpenSettings, onOpenBERXWorld, onOpenAlbums, onOpenCollections, onOpenTrips, onOpenExperiences, onOpenCreatorProfile, onOpenCreatorSettings, onOpenMyVideos, onOpenMyTracks, onOpenSavedPosts, onReport}: Props) {
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [identity, setIdentity] = useState<BerxIdentity | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [friendBusy, setFriendBusy] = useState(false);
	const [blocking, setBlocking] = useState(false);
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
			<BerxFadeIn style={styles.hero} riseFrom={16}>
				<View style={styles.avatarRing}>
					<Image source={{uri: profile.icon_url}} style={styles.avatar} />
				</View>
				<Text style={styles.fullname}>{profile.fullname}</Text>
				<Text style={styles.username}>@{profile.username}</Text>
				{year ? <Text style={styles.joined}>На BERX с {year} года</Text> : null}
				{profile.reputation ? (
					<BerxGlassSurface elevated padding="sm" style={styles.reputationRow}>
						{profile.reputation.places_reviewed > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.places_reviewed}</Text><Text style={styles.reputationLabel}>отзывов</Text></View> : null}
						{profile.reputation.events_going > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.events_going}</Text><Text style={styles.reputationLabel}>событий</Text></View> : null}
						{profile.reputation.trips_created > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.trips_created}</Text><Text style={styles.reputationLabel}>поездок</Text></View> : null}
						{profile.reputation.experiences_created > 0 ? <View style={styles.reputationStat}><Text style={styles.reputationValue}>{profile.reputation.experiences_created}</Text><Text style={styles.reputationLabel}>впечатлений</Text></View> : null}
					</BerxGlassSurface>
				) : null}
			</BerxFadeIn>

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

			{!isOwn && profile.guid && onMessage ? (
				<View style={styles.actionRow}>
					<BerxButton label="Написать" onPress={() => onMessage(profile.guid!, profile.username)} fullWidth />
				</View>
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
					<Text style={styles.sectionLabel}>Знакомства</Text>
					<View style={styles.menuGroup}>
						{onOpenDating ? <MenuRow label="Discover" icon={<IconHeart size={18} color={colors.text} />} onPress={onOpenDating} isFirst /> : null}
						{onOpenDatingPrivacy ? <MenuRow label="Приватность" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenDatingPrivacy} isLast /> : null}
					</View>

					<Text style={styles.sectionLabel}>BERX World</Text>
					<View style={styles.menuGroup}>
						{onOpenBERXWorld ? <MenuRow label="Обзор" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenBERXWorld} isFirst /> : null}
						{onOpenPlaces ? <MenuRow label="Места" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenPlaces} /> : null}
						{onOpenEvents ? <MenuRow label="События" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenEvents} /> : null}
						{onOpenCommunities ? <MenuRow label="Сообщества" icon={<IconUsers size={18} color={colors.text} />} onPress={onOpenCommunities} isLast /> : null}
					</View>

					<Text style={styles.sectionLabel}>Активность</Text>
					<View style={styles.menuGroup}>
						{onOpenNotifications ? <MenuRow label="Уведомления" icon={<IconBell size={18} color={colors.text} />} onPress={onOpenNotifications} isFirst /> : null}
						{onOpenPoints ? <MenuRow label="Баллы и уровень" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenPoints} /> : null}
						{onOpenMissions ? <MenuRow label="Задания дня" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenMissions} /> : null}
						{onOpenLifeGraph ? <MenuRow label="Ваш путь в BERX" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenLifeGraph} /> : null}
						{onOpenMemories ? <MenuRow label="Воспоминания" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenMemories} /> : null}
						{onOpenSavedPosts ? <MenuRow label="Сохранённые посты" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenSavedPosts} /> : null}
						{onOpenWrapped ? <MenuRow label="BERX Wrapped" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenWrapped} /> : null}
						{onOpenSettings ? <MenuRow label="Настройки" icon={<IconLock size={18} color={colors.text} />} onPress={onOpenSettings} isLast /> : null}
					</View>

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
}: {
	label: string;
	icon: React.ReactNode;
	onPress: () => void;
	isFirst?: boolean;
	isLast?: boolean;
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
			<IconChevronRight size={16} color={colors.textFaint} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	hero: {alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl},
	avatarRing: {
		width: 108,
		height: 108,
		borderRadius: 54,
		borderWidth: 2,
		borderColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: spacing.md,
	},
	avatar: {width: 96, height: 96, borderRadius: 48, backgroundColor: colors.graphite},
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
	fullname: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	username: {color: colors.textDim, fontSize: typography.sizeBase, marginTop: 2},
	joined: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.sm},
	reputationRow: {flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm},
	reputationStat: {alignItems: 'center'},
	reputationValue: {color: colors.accent, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	reputationLabel: {color: colors.textFaint, fontSize: typography.sizeXs},
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
	logoutWrap: {marginTop: spacing.md},
});
