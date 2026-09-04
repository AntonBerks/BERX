/**
 * BERX-121 — Profile Overview. The PROFILE family's v9 scene.
 *
 * Before v9 this screen was a vertical stack of full-width buttons on
 * a flat background, with no ScrollView at all — on a phone the lower
 * half of the menu was simply unreachable. It is now a real scene: a
 * profile hero with the cover at the atmosphere layer, identity on
 * the content plane, actions on the control plane, and the navigation
 * grouped into spatial sections that scroll.
 *
 * Data is unchanged and still honest. /me and /profiles/{username}
 * return guid, username, fullname, icon_url, profile_url and (own
 * only) time_created — no counts of any kind. So the stat rail is
 * populated only from endpoints that really exist: the caller's own
 * friend count (GET /friends) and their own points and level
 * (GET /points). Viewing someone else shows no counts, because BERX
 * has none to show, and inventing them here would be the one thing
 * this screen has always refused to do.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View, Pressable} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAuthState} from '@berx/auth';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {
	IconHeart,
	IconLock,
	IconBell,
	IconStar,
	IconUsers,
	IconChevronRight,
} from '../../../../packages/design-system/src/components/BerxIcons';
import {BerxProfileHero} from '../../../../packages/design-system/src/spatial/BerxProfileHero';
import {BerxShareSheet} from '../../../../packages/design-system/src/spatial/BerxShareSheet';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import type {BerxStat} from '../../../../packages/design-system/src/spatial/BerxStatRail';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {berxAnalytics} from '../spatial/analytics';

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
}

export interface ProfileScreenProps {
	api: BerxApiClient;
	authState: BerxAuthState;
	username?: string;
	onBack?: () => void;
	onMessage?: (otherGuid: number, otherUsername: string) => void;
	onOpenNotifications?: () => void;
	/** Sits next to Notifications, where experience and points accumulate. */
	onOpenPoints?: () => void;
	onOpenMemories?: () => void;
	onOpenWrapped?: () => void;
	onOpenDatingPrivacy?: () => void;
	onOpenCommunities?: () => void;
	/** BERX-151 Connections — friends and people search in one place. */
	onOpenConnections?: () => void;
	/** BERX-004 Choose Color Vibe — the app-wide atmosphere. */
	onOpenColorWorld?: () => void;
	/** The v9 archive, browsable: all 300 contracts and the scene each resolves to. */
	onOpenScenes?: () => void;
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
	onReport?: (targetGuid: number) => void;
}

function joinedYear(unixSeconds?: number): string | null {
	if (!unixSeconds) return null;
	return new Date(unixSeconds * 1000).getFullYear().toString();
}

export default function ProfileScreen(props: ProfileScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-121" testID="berx-121">
			<ProfileSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ProfileSceneBody(props: ProfileScreenProps) {
	const {api, authState, username, onBack, onMessage, onReport} = props;
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const isOwn = !username;
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [stats, setStats] = useState<BerxStat[]>([]);
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [friendBusy, setFriendBusy] = useState(false);

	const load = useCallback(async () => {
		setState('loading');
		try {
			const data = isOwn ? await api.me() : await api.getProfile(username as string);
			setProfile(data);
			setError(null);
			setState('default');

			/**
			 * Counts only for the caller, and only from endpoints that
			 * return them. Both are best-effort: a failing stat must not
			 * take the profile down, and a stat that did not load is
			 * omitted rather than shown as zero.
			 */
			if (isOwn) {
				const [friends, points] = await Promise.all([
					api.friends().catch(() => null),
					api.pointsBalance().catch(() => null),
				]);
				const next: BerxStat[] = [];
				if (friends) next.push({key: 'friends', label: 'друзей', value: friends.friends.length});
				if (points) {
					next.push({key: 'level', label: 'уровень', value: points.level});
					next.push({key: 'points', label: 'баллов', value: points.balance});
					if (points.current_streak > 0) {
						next.push({key: 'streak', label: 'дней подряд', value: points.current_streak});
					}
				}
				setStats(next);
			} else {
				setStats([]);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : isOwn ? 'Не удалось загрузить профиль' : 'Профиль недоступен');
			setState('error');
			berxAnalytics.error(screen, 'profile');
		}
	}, [api, isOwn, username, screen]);

	useEffect(() => {
		load();
	}, [load]);

	const toggleFriend = useCallback(async () => {
		if (!profile?.guid) return;
		setFriendBusy(true);
		berxAnalytics.mutationStart(screen, profile.guid);
		const started = Date.now();
		try {
			if (profile.is_friend) {
				await api.removeFriend(profile.guid);
				setProfile({...profile, is_friend: false});
			} else {
				await api.addFriend(profile.guid);
				/**
				 * Re-fetch rather than optimistically setting is_friend:
				 * the request may still be one-directional, and claiming
				 * mutual friendship before the server agrees is exactly
				 * the kind of small lie this project does not ship.
				 */
				await load();
			}
			berxAnalytics.mutationSuccess(screen, Date.now() - started, profile.guid);
		} catch {
			/* state untouched on failure — never flipped ahead of the server */
			berxAnalytics.mutationError(screen, 'friend');
		} finally {
			setFriendBusy(false);
		}
	}, [profile, api, load, screen]);

	const year = joinedYear(profile?.time_created);
	const heroStats: BerxStat[] = year ? [...stats, {key: 'joined', label: 'на BERX с', value: year}] : stats;

	return (
		<View style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title={profile?.username} /> : null}
			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				emptyTitle="Профиль не найден"
				style={styles.body}>
				{profile ? (
					<ScrollView
						onScroll={onScroll}
						scrollEventThrottle={scrollEventThrottle}
						contentContainerStyle={styles.scroll}
						showsVerticalScrollIndicator={false}>
						<BerxProfileHero
							userGuid={profile.guid ?? 0}
							name={profile.fullname}
							handle={profile.username}
							avatarUrl={profile.icon_url}
							stats={heroStats}
							actions={
								<>
									<ProfileActions
										profile={profile}
										isOwn={isOwn}
										friendBusy={friendBusy}
										onMessage={onMessage}
										onToggleFriend={toggleFriend}
									/>
									{/**
									 * profile_url is the one canonical, publicly
									 * reachable BERX URL the API actually returns,
									 * so this is the one place a share is real.
									 * Posts, places and events have no such field
									 * and therefore get no share control.
									 */}
									{profile.profile_url ? (
										<BerxShareSheet
											url={profile.profile_url}
											title={profile.fullname || profile.username}
											label="Поделиться"
										/>
									) : null}
								</>
							}
						/>

						<ProfileSections {...props} profile={profile} isOwn={isOwn} />

						{!isOwn && profile.guid && onReport ? (
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Пожаловаться на пользователя"
								onPress={() => onReport(profile.guid as number)}
								style={styles.reportRow}>
								<Text style={styles.reportLink}>Пожаловаться на пользователя</Text>
							</Pressable>
						) : null}

						{isOwn ? (
							<View style={styles.logoutWrap}>
								<BerxButton
									label="Выйти"
									variant="danger"
									onPress={() => authState.logout()}
									loading={authState.getSnapshot().status === 'loggingOut'}
									fullWidth
								/>
							</View>
						) : null}
					</ScrollView>
				) : null}
			</BerxDataBoundary>
		</View>
	);
}

function ProfileActions({
	profile,
	isOwn,
	friendBusy,
	onMessage,
	onToggleFriend,
}: {
	profile: ProfileData;
	isOwn: boolean;
	friendBusy: boolean;
	onMessage?: (guid: number, username: string) => void;
	onToggleFriend: () => void;
}) {
	if (isOwn || !profile.guid) return null;
	return (
		<>
			{onMessage ? (
				<BerxButton label="Написать" onPress={() => onMessage(profile.guid as number, profile.username)} />
			) : null}
			<BerxButton
				label={profile.is_friend ? 'Удалить из друзей' : 'Добавить в друзья'}
				variant="secondary"
				loading={friendBusy}
				onPress={onToggleFriend}
			/>
		</>
	);
}

interface SectionItem {
	key: string;
	label: string;
	icon: React.ReactNode;
	onPress: () => void;
}

/**
 * The navigation, grouped. Every entry is conditional on the callback
 * the host actually passed, so a section with nothing real behind it
 * does not render at all — the same rule the old menu followed, kept
 * intact through the redesign.
 */
function ProfileSections(props: ProfileScreenProps & {profile: ProfileData; isOwn: boolean}) {
	const {profile, isOwn} = props;
	const guid = profile.guid;

	const content: SectionItem[] = [];
	if (guid && props.onOpenAlbums) {
		content.push({key: 'albums', label: 'Альбомы', icon: <IconStar size={18} color={colors.text} />, onPress: () => props.onOpenAlbums?.(guid, isOwn)});
	}
	if (guid && props.onOpenCollections) {
		content.push({key: 'collections', label: 'Подборки', icon: <IconStar size={18} color={colors.text} />, onPress: () => props.onOpenCollections?.(guid, isOwn)});
	}
	if (guid && props.onOpenTrips) {
		content.push({key: 'trips', label: 'Поездки', icon: <IconUsers size={18} color={colors.text} />, onPress: () => props.onOpenTrips?.(guid, isOwn)});
	}
	if (guid && props.onOpenExperiences) {
		content.push({key: 'experiences', label: 'Впечатления', icon: <IconStar size={18} color={colors.text} />, onPress: () => props.onOpenExperiences?.(guid, isOwn)});
	}
	if (guid && props.onOpenMyVideos) {
		content.push({key: 'videos', label: isOwn ? 'Мои видео' : 'Видео', icon: <IconStar size={18} color={colors.text} />, onPress: () => props.onOpenMyVideos?.(guid, isOwn)});
	}
	if (guid && props.onOpenMyTracks) {
		content.push({key: 'tracks', label: isOwn ? 'Мои треки' : 'Треки', icon: <IconStar size={18} color={colors.text} />, onPress: () => props.onOpenMyTracks?.(guid, isOwn)});
	}
	if (isOwn && props.onOpenCreatorSettings) {
		content.push({key: 'creator-settings', label: 'Режим автора', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenCreatorSettings});
	}
	if (!isOwn && profile.is_creator && props.onOpenCreatorProfile) {
		content.push({key: 'creator', label: 'Профиль автора', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenCreatorProfile});
	}

	const dating: SectionItem[] = [];
	const world: SectionItem[] = [];
	const activity: SectionItem[] = [];
	if (isOwn) {
		if (props.onOpenDating) dating.push({key: 'dating', label: 'Discover', icon: <IconHeart size={18} color={colors.text} />, onPress: props.onOpenDating});
		if (props.onOpenDatingPrivacy) dating.push({key: 'dating-privacy', label: 'Приватность', icon: <IconLock size={18} color={colors.text} />, onPress: props.onOpenDatingPrivacy});
		if (props.onOpenBERXWorld) world.push({key: 'world', label: 'Обзор', icon: <IconUsers size={18} color={colors.text} />, onPress: props.onOpenBERXWorld});
		if (props.onOpenPlaces) world.push({key: 'places', label: 'Места', icon: <IconUsers size={18} color={colors.text} />, onPress: props.onOpenPlaces});
		if (props.onOpenEvents) world.push({key: 'events', label: 'События', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenEvents});
		if (props.onOpenCommunities) world.push({key: 'communities', label: 'Сообщества', icon: <IconUsers size={18} color={colors.text} />, onPress: props.onOpenCommunities});
		if (props.onOpenConnections) world.push({key: 'connections', label: 'Связи', icon: <IconUsers size={18} color={colors.text} />, onPress: props.onOpenConnections});
		if (props.onOpenNotifications) activity.push({key: 'notifications', label: 'Уведомления', icon: <IconBell size={18} color={colors.text} />, onPress: props.onOpenNotifications});
		if (props.onOpenPoints) activity.push({key: 'points', label: 'Баллы и уровень', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenPoints});
		if (props.onOpenMemories) activity.push({key: 'memories', label: 'Воспоминания', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenMemories});
		if (props.onOpenWrapped) activity.push({key: 'wrapped', label: 'BERX Wrapped', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenWrapped});
		if (props.onOpenColorWorld) activity.push({key: 'color-world', label: 'Цветовой мир', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenColorWorld});
		if (props.onOpenSettings) activity.push({key: 'settings', label: 'Настройки', icon: <IconLock size={18} color={colors.text} />, onPress: props.onOpenSettings});
		if (props.onOpenScenes) activity.push({key: 'scenes', label: 'Сцены BERX', icon: <IconStar size={18} color={colors.text} />, onPress: props.onOpenScenes});
	}

	return (
		<View style={styles.sections}>
			<Section title="Контент" items={content} />
			<Section title="Знакомства" items={dating} />
			<Section title="BERX World" items={world} />
			<Section title="Активность" items={activity} />
		</View>
	);
}

function Section({title, items}: {title: string; items: SectionItem[]}) {
	if (items.length === 0) return null;
	return (
		<View style={styles.section}>
			<Text style={styles.sectionLabel} accessibilityRole="header">
				{title}
			</Text>
			<BerxSpatialCard depth="D2" padding={0} radius={18}>
				{items.map((item, index) => (
					<Pressable
						key={item.key}
						accessibilityRole="button"
						accessibilityLabel={item.label}
						onPress={item.onPress}
						style={({pressed}) => [styles.row, index > 0 ? styles.rowDivider : null, {opacity: pressed ? 0.7 : 1}]}>
						<View style={styles.rowIcon}>{item.icon}</View>
						<Text style={styles.rowLabel}>{item.label}</Text>
						<IconChevronRight size={16} color={colors.textFaint} />
					</Pressable>
				))}
			</BerxSpatialCard>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	body: {flex: 1},
	/* the screen genuinely scrolls now — the menu used to run off the bottom */
	scroll: {paddingBottom: spacing.xxxl},
	sections: {paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg},
	section: {gap: spacing.sm},
	sectionLabel: {
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		marginLeft: spacing.xs,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	/* 44dp rows */
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.lg},
	rowDivider: {borderTopWidth: 1, borderTopColor: colors.borderSoft},
	rowIcon: {width: 24, alignItems: 'center'},
	rowLabel: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
	reportRow: {minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline'},
	logoutWrap: {paddingHorizontal: spacing.lg, marginTop: spacing.xl},
});
