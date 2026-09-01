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
import {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxOnlineFriend, BerxFriend, BerxPeopleSuggestion} from '@berx/api/types';
import {ruPlural} from '@berx/domain';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxEditorialTitle} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxLoadingState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxPersonCard, BerxLiveDot} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

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

// One person-card width across every band on this screen. The rails used
// 124 while the friends grid used a percentage, so the least important
// band rendered the biggest faces.
const PERSON_W = 148;

export default function PeopleScreen({api, onOpenProfile, onOpenConversation, onOpenNearby, onOpenSocialMap, onOpenInvite}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
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
	const offlineFriends = friends.filter((f: BerxFriend) => !onlineGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			<View style={styles.head}>
				{/* Same editorial header as NOW. A small plain title here made
				    PEOPLE read as a different product from the screen one tab
				    away. The second line is live state, as it is on NOW. */}
				<BerxEditorialTitle
					style={styles.headTitles}
					accentIndex={1}
					lines={[
						'Люди',
						online.length > 0
							? `${online.length} в сети · ${friends.length} ${ruPlural(friends.length, 'друг', 'друга', 'друзей')}`
							: `${friends.length} ${ruPlural(friends.length, 'друг', 'друга', 'друзей')}`,
					]}
				/>
				<View style={styles.headActions}>
					{onOpenSocialMap ? (
						<Pressable style={styles.circleButton} onPress={onOpenSocialMap} hitSlop={6}>
							<Text style={styles.circleGlyph}>◎</Text>
						</Pressable>
					) : null}
					{onOpenNearby ? (
						<Pressable style={styles.circleButton} onPress={onOpenNearby} hitSlop={6}>
							<Text style={styles.circleGlyph}>⌖</Text>
						</Pressable>
					) : null}
					{onOpenInvite ? (
						<Pressable style={styles.circleButton} onPress={onOpenInvite} hitSlop={6}>
							<Text style={styles.circleGlyph}>+</Text>
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
									<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railScroll} contentContainerStyle={styles.rail}>
										{online.map((o: BerxOnlineFriend) => (
											<View key={o.guid} style={styles.railItem}>
												<BerxPersonCard
													fullname={o.fullname}
													username={o.username}
													imageUrl={o.icon}
													isOnline
													width={PERSON_W}
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
									<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railScroll} contentContainerStyle={styles.rail}>
										{suggestions.map((s: BerxPeopleSuggestion) => (
											<View key={s.guid} style={styles.railItem}>
												<BerxPersonCard
													fullname={s.fullname}
													username={s.username}
													imageUrl={s.icon}
													mutualCount={s.mutual_count}
													contextLine={
														s.mutual_count === 0 && s.mutual_communities_count > 0
															? `${s.mutual_communities_count} ${ruPlural(s.mutual_communities_count, 'общее сообщество', 'общих сообщества', 'общих сообществ')}`
															: undefined
													}
													width={PERSON_W}
													onPress={() => onOpenProfile(s.username)}
												/>
											</View>
										))}
									</ScrollView>
								</View>
							) : null}

							{/* The online band above already shows these faces; repeating
							    them here made the same two people fill the screen twice.
							    Whoever is online is presented THERE, and this band is
							    honestly labelled as the rest. */}
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>
									{online.length > 0 && offlineFriends.length > 0 ? 'Остальные друзья' : 'Друзья'}
								</Text>
								{friends.length === 0 ? (
									<Text style={styles.quiet}>Друзей пока нет — найдите людей через поиск выше.</Text>
								) : offlineFriends.length === 0 ? (
									<Text style={styles.quiet}>Все ваши друзья сейчас в сети — они выше.</Text>
								) : (
									<View style={styles.grid}>
										{offlineFriends.map((f: BerxFriend) => (
											<View key={f.guid} style={styles.gridCell}>
												<BerxPersonCard
													fullname={f.fullname}
													username={f.username}
													imageUrl={f.icon}
													isOnline={false}
													contextLine={onOpenConversation ? 'Написать' : undefined}
													onPress={() => onOpenProfile(f.username)}
												/>
												{onOpenConversation ? (
													<Pressable style={styles.gridAction} onPress={() => onOpenConversation(f.guid, f.username)} hitSlop={6}>
														<Text style={styles.gridActionText}>Написать</Text>
													</Pressable>
												) : null}
											</View>
										))}
									</View>
								)}
							</View>
						</>
					)}
				</BerxFadeIn>
			</ScrollView>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	railScroll: {flexGrow: 0, flexShrink: 0},
	screen: {flex: 1, backgroundColor: colors.bg},
	head: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md},
	headTitles: {flex: 1, paddingHorizontal: 0, paddingTop: 0},
	subtitle: {color: colors.textFaint, fontSize: typography.sizeXs},
	circleButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	circleGlyph: {color: colors.text, fontSize: 16},
	grid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md},
	gridCell: {width: PERSON_W, gap: spacing.xs},
	gridAction: {alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.accentSoft},
	gridActionText: {color: colors.accent, fontSize: 11, fontWeight: typography.weightMedium},
	title: {color: colors.text, fontSize: typography.sizeTitle, fontWeight: typography.weightBold, letterSpacing: -0.4},
	headActions: {flexDirection: 'row', gap: spacing.md},
	searchWrap: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs},
	scroll: {paddingBottom: spacing.xxl},
	section: {marginTop: spacing.xl},
	sectionHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, gap: spacing.sm},
	sectionTitle: {
		color: colors.text,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightBold,
		letterSpacing: -0.4,
		paddingHorizontal: spacing.lg,
		marginBottom: spacing.md,
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
	quiet: {color: colors.textDim, fontSize: typography.sizeSm, paddingHorizontal: spacing.lg, lineHeight: 20},
});
