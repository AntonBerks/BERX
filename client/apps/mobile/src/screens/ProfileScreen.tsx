/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * The reference images showed a stats row (публикации/подписчики/
 * подписки) — deliberately NOT added: /me and /profiles/{username}
 * return guid/username/fullname/icon_url/profile_url(/email) only,
 * no counts of any kind (checked packages/api/src/types.ts directly
 * before writing this, not from memory). Showing fake numbers there
 * would be exactly the kind of fabricated UI this project has avoided
 * all session. time_created (real, own-profile-only) is used instead
 * for an honest "on BERX since {date}" line.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {IconHeart, IconLock, IconBell, IconStar, IconUsers, IconChevronRight} from '../../../../packages/design-system/src/components/BerxIcons';

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
	onReport?: (targetGuid: number) => void;
}

function joinedYear(unixSeconds?: number): string | null {
	if (!unixSeconds) return null;
	return new Date(unixSeconds * 1000).getFullYear().toString();
}

export default function ProfileScreen({api, authState, username, onBack, onMessage, onOpenNotifications, onOpenPoints, onOpenMissions, onOpenMemories, onOpenWrapped, onOpenDatingPrivacy, onOpenCommunities, onOpenDating, onOpenPlaces, onOpenEvents, onOpenSettings, onOpenBERXWorld, onOpenAlbums, onOpenCollections, onOpenTrips, onOpenExperiences, onOpenCreatorProfile, onOpenCreatorSettings, onOpenMyVideos, onOpenMyTracks, onReport}: Props) {
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [friendBusy, setFriendBusy] = useState(false);
	const isOwn = !username;

	async function load() {
		setLoading(true);
		try {
			const data = isOwn ? await api.me() : await api.getProfile(username!);
			setProfile(data);
			setError(null);
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

	if (loading) {
		return (
			<View style={styles.screen}>
				{onBack ? <BerxHeader onBack={onBack} /> : null}
				<BerxLoadingState label="Загрузка профиля..." />
			</View>
		);
	}
	if (error || !profile) {
		return (
			<View style={styles.screen}>
				{onBack ? <BerxHeader onBack={onBack} /> : null}
				<BerxErrorState message={error ?? 'Профиль не найден'} onRetry={load} />
			</View>
		);
	}

	const year = joinedYear(profile.time_created);

	return (
		<View style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title={profile.username} /> : null}
			<View style={styles.hero}>
				<View style={styles.avatarRing}>
					<Image source={{uri: profile.icon_url}} style={styles.avatar} />
				</View>
				<Text style={styles.fullname}>{profile.fullname}</Text>
				<Text style={styles.username}>@{profile.username}</Text>
				{year ? <Text style={styles.joined}>На BERX с {year} года</Text> : null}
			</View>

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

			{!isOwn && profile.guid && onReport ? (
				<View style={styles.actionRow}>
					<Pressable onPress={() => onReport(profile.guid!)} hitSlop={8}>
						<Text style={styles.reportLink}>Пожаловаться на пользователя</Text>
					</Pressable>
				</View>
			) : null}

			{isOwn ? (
				<View style={styles.menuList}>
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
						{onOpenMemories ? <MenuRow label="Воспоминания" icon={<IconStar size={18} color={colors.text} />} onPress={onOpenMemories} /> : null}
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
				</View>
			) : null}
		</View>
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
	fullname: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	username: {color: colors.textDim, fontSize: typography.sizeBase, marginTop: 2},
	joined: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.sm},
	actionRow: {paddingHorizontal: spacing.xl},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center'},
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
