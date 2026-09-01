/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX PEOPLE — people as spatial entities, not a contact list.
 *
 * Four real, already-existing endpoints composed into one surface:
 *   api.onlineFriends()   — real presence (OssnUser::isOnline(10))
 *   api.friends()         — the caller's real friend list
 *   api.peopleDiscovery() — real mutual-friend suggestions
 *   api.searchUsers(q)    — real user search
 *
 * Every number shown is one the server actually returned. There is no
 * fabricated "3 friends nearby" here: real distance needs real
 * coordinates and no device Geolocation module is installable in this
 * sandbox (npm blocked — the same constraint NearbyNowScreen already
 * documents), so proximity lives in Nearby, and this screen states
 * only what it can actually prove: who is online, who you actually
 * know, and how many friends you genuinely share with someone.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxOnlineFriend, BerxFriend, BerxPeopleSuggestion} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxLoadingState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxPersonCard, BerxLiveDot} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';

interface Props {
	api: BerxApiClient;
	onOpenProfile: (username: string) => void;
	onOpenConversation?: (guid: number, username?: string) => void;
	onOpenNearby?: () => void;
	onOpenSocialMap?: () => void;
	onOpenInvite?: () => void;
}

interface SearchRow {
	guid: number;
	username: string;
	fullname: string;
}

const DEBOUNCE_MS = 400;

export default function PeopleScreen({api, onOpenProfile, onOpenConversation, onOpenNearby, onOpenSocialMap, onOpenInvite}: Props) {
	const [online, setOnline] = useState<BerxOnlineFriend[]>([]);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [suggestions, setSuggestions] = useState<BerxPeopleSuggestion[]>([]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchRow[] | null>(null);
	const [loading, setLoading] = useState(true);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const load = useCallback(async () => {
		const [onlineRes, friendsRes, discoveryRes] = await Promise.all([
			api.onlineFriends().catch(() => ({online: [] as BerxOnlineFriend[]})),
			api.friends().catch(() => ({friends: [] as BerxFriend[]})),
			api.peopleDiscovery().catch(() => ({people: [] as BerxPeopleSuggestion[]})),
		]);
		setOnline(onlineRes.online);
		setFriends(friendsRes.friends);
		setSuggestions(discoveryRes.people);
		setLoading(false);
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	function handleQuery(text: string) {
		setQuery(text);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!text.trim()) {
			setResults(null);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			try {
				const res = await api.searchUsers(text.trim());
				setResults(res.users);
			} catch {
				setResults([]);
			}
		}, DEBOUNCE_MS);
	}

	if (loading) return <BerxLoadingState />;

	const onlineGuids = new Set(online.map((o: BerxOnlineFriend) => o.guid));

	return (
		<View style={styles.screen}>
			<View style={styles.head}>
				<Text style={styles.title}>Люди</Text>
				<View style={styles.headActions}>
					{onOpenSocialMap ? (
						<Pressable onPress={onOpenSocialMap} hitSlop={8}>
							<Text style={styles.headLink}>Граф</Text>
						</Pressable>
					) : null}
					{onOpenNearby ? (
						<Pressable onPress={onOpenNearby} hitSlop={8}>
							<Text style={styles.headLink}>Рядом</Text>
						</Pressable>
					) : null}
				</View>
			</View>

			<View style={styles.searchWrap}>
				<BerxInput placeholder="Найти человека" value={query} onChangeText={handleQuery} autoCapitalize="none" autoCorrect={false} />
			</View>

			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<BerxFadeIn>
					{results !== null ? (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Результаты</Text>
							{results.length === 0 ? (
								<Text style={styles.quiet}>Никого не найдено.</Text>
							) : (
								results.map((u: SearchRow) => (
									<Pressable key={u.guid} style={styles.row} onPress={() => onOpenProfile(u.username)}>
										<BerxAvatarStack people={[{guid: u.guid, initial: (u.fullname || u.username).charAt(0)}]} size={36} />
										<View style={styles.rowBody}>
											<Text style={styles.rowName} numberOfLines={1}>{u.fullname || u.username}</Text>
											<Text style={styles.rowMeta} numberOfLines={1}>@{u.username}</Text>
										</View>
									</Pressable>
								))
							)}
						</View>
					) : (
						<>
							{online.length > 0 ? (
								<View style={styles.section}>
									<View style={styles.sectionHead}>
										<Text style={styles.sectionTitle}>Сейчас в сети</Text>
										<BerxLiveDot label={String(online.length)} />
									</View>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
										{online.map((o: BerxOnlineFriend) => (
											<View key={o.guid} style={styles.railItem}>
												<BerxPersonCard
													fullname={o.fullname}
													username={o.username}
													imageUrl={o.icon}
													isOnline
													width={124}
													onPress={() => onOpenProfile(o.username)}
												/>
											</View>
										))}
									</ScrollView>
								</View>
							) : null}

							{suggestions.length > 0 ? (
								<View style={styles.section}>
									<Text style={styles.sectionTitle}>Возможно, вы знакомы</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
										{suggestions.map((s: BerxPeopleSuggestion) => (
											<View key={s.guid} style={styles.railItem}>
												<BerxPersonCard
													fullname={s.fullname}
													username={s.username}
													imageUrl={s.icon}
													mutualCount={s.mutual_count}
													contextLine={
														s.mutual_communities_count > 0
															? `${s.mutual_count} общих · ${s.mutual_communities_count} сообществ`
															: undefined
													}
													width={124}
													onPress={() => onOpenProfile(s.username)}
												/>
											</View>
										))}
									</ScrollView>
								</View>
							) : null}

							<View style={styles.section}>
								<View style={styles.sectionHead}>
									<Text style={styles.sectionTitle}>Друзья</Text>
									{onOpenInvite ? (
										<Pressable onPress={onOpenInvite} hitSlop={8}>
											<Text style={styles.headLink}>Пригласить</Text>
										</Pressable>
									) : null}
								</View>
								{friends.length === 0 ? (
									<Text style={styles.quiet}>Друзей пока нет — найдите людей через поиск выше.</Text>
								) : (
									friends.map((f: BerxFriend) => (
										<Pressable key={f.guid} style={styles.row} onPress={() => onOpenProfile(f.username)}>
											<BerxAvatarStack people={[{guid: f.guid, icon: f.icon, initial: (f.fullname || f.username).charAt(0)}]} size={36} />
											<View style={styles.rowBody}>
												<Text style={styles.rowName} numberOfLines={1}>{f.fullname || f.username}</Text>
												<Text style={styles.rowMeta} numberOfLines={1}>
													{onlineGuids.has(f.guid) ? 'в сети' : `@${f.username}`}
												</Text>
											</View>
											{onlineGuids.has(f.guid) ? <View style={styles.onlineDot} /> : null}
											{onOpenConversation ? (
												<Pressable onPress={() => onOpenConversation(f.guid, f.username)} hitSlop={8}>
													<Text style={styles.rowAction}>Написать</Text>
												</Pressable>
											) : null}
										</Pressable>
									))
								)}
							</View>
						</>
					)}
				</BerxFadeIn>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	head: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg},
	title: {color: colors.text, fontSize: typography.sizeTitle, fontWeight: typography.weightBold, letterSpacing: -0.4},
	headActions: {flexDirection: 'row', gap: spacing.md},
	headLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	searchWrap: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
	scroll: {paddingBottom: spacing.xxl},
	section: {marginTop: spacing.xl},
	sectionHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, gap: spacing.sm},
	sectionTitle: {
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		fontWeight: typography.weightBold,
		letterSpacing: 1.2,
		textTransform: 'uppercase',
		paddingHorizontal: spacing.lg,
		marginBottom: spacing.sm,
	},
	rail: {paddingHorizontal: spacing.lg, gap: spacing.sm},
	railItem: {marginRight: spacing.sm},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderTopWidth: 1,
		borderTopColor: colors.borderSoft,
	},
	rowBody: {flex: 1},
	rowName: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	rowMeta: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: 2},
	rowAction: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	onlineDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
	quiet: {color: colors.textDim, fontSize: typography.sizeSm, paddingHorizontal: spacing.lg, lineHeight: 20},
});
