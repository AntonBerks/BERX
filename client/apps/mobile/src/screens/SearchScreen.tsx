/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Four real tabs, each backed by a real server scope in
 * components/OssnApi/v1/search.php (/search/users existed already;
 * /search/places, /search/events, /search/communities were added
 * this session, reusing OssnPlaces::listPlaces()/OssnEvents::
 * listEvents()/OssnGroup::searchGroups() — the exact same query the
 * dedicated list screens call with a `q` param, not new logic). Place
 * and event results are intentionally a lighter shape than the full
 * records those dedicated screens show — the API dispatcher loads
 * exactly one v1 file per request, so search.php can't reuse places.
 * php's/events.php's full JSON builder functions. Selecting a result
 * here navigates to the real detail screen, which fetches the full
 * record.
 *
 * MAX BUILD — Places/Events/Communities results are now already
 * server-sorted friends-first (real friends_count social-relevance
 * signal, same mechanism Nearby Now uses — Communities added in the
 * BERX World pass, closing the one search scope that was still a flat
 * DB-order list); a small drawn people-count badge surfaces that same signal here,
 * same convention as NearbyNowScreen's own badge.
 *
 * "Discover + Nearby + Social Map + Events = one contextual discovery
 * engine" continued: the empty Users tab (previously a bare "start
 * typing" prompt) now shows real mutual-friend suggestions
 * (api.peopleDiscovery()) — reusing this screen's own existing real
 * estate for meaningful social discovery instead of a new screen.
 */
import {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {View, ScrollView, Text, FlatList, Pressable, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceSearchResult, BerxEventSearchResult, BerxCommunitySearchResult, BerxPeopleSuggestion, BerxTrendingHashtag} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {ruPlural} from '@berx/domain';
import {BerxAuroraField} from '../../../../packages/design-system/src/components/BerxAuroraField';
import {BerxLightField} from '../../../../packages/design-system/src/components/BerxLightField';
import {depthShadowV9} from '../../../../packages/design-system/src/v9/depth';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/v9/BerxV9Live';
import {useBerxSpatialSignal} from '../../../../packages/design-system/src/v9/useBerxSpatialSignal';
import {useWindowDimensions} from 'react-native';
import {BerxSpatialScene, BerxDepthLayer} from '../../../../packages/design-system/src/v9/BerxSpatialScene';
import {BerxSearchField} from '../../../../packages/design-system/src/v9/BerxV9Primitives';
import {useBerxReducedMotion} from '../../../../packages/design-system/src/v9/BerxBoundaries';
import {BerxEmptyState, BerxErrorState, BerxLoadingState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxEdgeFade} from '../../../../packages/design-system/src/components/BerxEdgeFade';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors, useBerxScene, useBerxGlass} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens, BerxGlassLevelTokens, BerxGlassLevel} from '@berx/design-system/tokens';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

interface SearchResultUser {
	guid: number;
	username: string;
	fullname: string;
	/** The user's own real avatar (OssnUser::iconURL()). Null only if the account no longer exists. */
	icon?: string | null;
}

type Tab = 'users' | 'places' | 'events' | 'communities' | 'hashtags';

interface Props {
	api: BerxApiClient;
	onOpenProfile: (username: string) => void;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenCommunity: (guid: number) => void;
	onOpenHashtag?: (tag: string) => void;
}

const DEBOUNCE_MS = 400;
const TABS: {key: Tab; label: string}[] = [
	{key: 'users', label: 'Люди'},
	{key: 'places', label: 'Места'},
	{key: 'events', label: 'События'},
	{key: 'communities', label: 'Сообщества'},
	{key: 'hashtags', label: 'Теги'},
];

export default function SearchScreen({api, onOpenProfile, onOpenPlace, onOpenEvent, onOpenCommunity, onOpenHashtag}: Props) {
	const colors = useBerxColors();
	// The real OS setting, read once at the root by BerxReducedMotionGate.
	const reducedMotion = useBerxReducedMotion();
	const win = useWindowDimensions();
	// The scene's own light colours — the same pools every BERX surface
	// is lit with, so Explore is lit like the rest of the product.
	const scene = useBerxScene();
	const glass = useBerxGlass();
	// Real interaction: gyroscope on device, pointer on web, zero when the
	// OS asks for reduced motion (enforced inside the hook).
	const signal = useBerxSpatialSignal();
	const styles = useMemo(() => makeStyles(colors, glass), [colors, glass]);
	const [tab, setTab] = useState<Tab>('users');
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<SearchResultUser[]>([]);
	const [places, setPlaces] = useState<BerxPlaceSearchResult[]>([]);
	const [events, setEvents] = useState<BerxEventSearchResult[]>([]);
	const [communities, setCommunities] = useState<BerxCommunitySearchResult[]>([]);
	const [hashtags, setHashtags] = useState<BerxTrendingHashtag[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);
	const [suggestions, setSuggestions] = useState<BerxPeopleSuggestion[] | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Real mutual-friend suggestions — best-effort, fetched once, never
	// blocks search itself if it fails.
	useEffect(() => {
		api.peopleDiscovery().then((res) => setSuggestions(res.people)).catch(() => setSuggestions([]));
	}, [api]);

	const runSearch = useCallback(
		async (q: string, activeTab: Tab) => {
			if (!q.trim()) {
				setUsers([]);
				setPlaces([]);
				setEvents([]);
				setCommunities([]);
				setHashtags([]);
				setSearched(false);
				return;
			}
			setLoading(true);
			try {
				if (activeTab === 'users') {
					const res = await api.searchUsers(q.trim());
					setUsers(res.users);
				} else if (activeTab === 'places') {
					const res = await api.searchPlaces(q.trim());
					setPlaces(res.places);
				} else if (activeTab === 'events') {
					const res = await api.searchEvents(q.trim());
					setEvents(res.events);
				} else if (activeTab === 'communities') {
					const res = await api.searchCommunities(q.trim());
					setCommunities(res.communities);
				} else {
					const res = await api.searchHashtags(q.trim());
					setHashtags(res.hashtags);
				}
				setError(null);
			} catch {
				setError('Не удалось выполнить поиск');
			} finally {
				setLoading(false);
				setSearched(true);
			}
		},
		[api]
	);

	function handleChange(text: string) {
		setQuery(text);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => runSearch(text, tab), DEBOUNCE_MS);
	}

	function switchTab(next: Tab) {
		setTab(next);
		if (query.trim()) runSearch(query, next);
	}

	const currentCount = tab === 'users' ? users.length : tab === 'places' ? places.length : tab === 'events' ? events.length : tab === 'communities' ? communities.length : hashtags.length;

	/* Which tab is showing, as a word — the scene's own structural
	   typography at D2. It is derived from real state, so the plane
	   behind the results always names what you are looking through. */
	const structuralWord = TABS.find((t) => t.key === tab)?.label ?? 'Поиск';

	/* EXPLORE — a full six-plane V9 scene.
	   This screen was the discovery surface with no depth at all: a flat
	   View, a bare input and pill tabs painted straight onto the ground,
	   so the one place in BERX whose whole job is "look outward into the
	   world" read as the flattest.

	   Every plane below carries something REAL — none is an empty
	   container, which is the failure mode a bordered glass box the
	   length of the viewport already demonstrated here once:

	     D0  environment — a lit room. Real light sources with real
	         falloff (BerxLightField), keyed above the search field so the
	         scene has a direction the light comes FROM.
	     D1  atmosphere  — the dust field, moving on the real interaction
	         signal, so the air between the planes is visible.
	     D2  structure   — the current scope as huge, low-contrast type.
	         This is what the results are seen THROUGH; it names the
	         scene and gives the eye a far plane to measure depth against.
	     D3  results     — the subject. Real rows on the focal plane.
	     D4  actions     — the field and its filters, genuinely floating
	         above the results they act on.
	     D5  energy      — a live halo on the field while a query is
	         actually running, and only then.

	   The camera, the parallax factors and the entry choreography are the
	   system's, not this screen's: BerxSpatialScene owns the perspective
	   and BerxDepthLayer places each plane at its own z. */
	return (
		<BerxSpatialScene
			reducedMotion={reducedMotion}
			signalX={signal.x}
			signalY={signal.y}
			bind={signal.bind}
			style={styles.screen}>

			{/* D0 — ENVIRONMENT. Two real sources: a key light behind the
			    search field (this scene's light comes from where you act on
			    it) and a cooler counter pool low and off-axis so the ground
			    is not evenly washed. The vignette is what keeps it a lit
			    room instead of a tinted rectangle. */}
			<BerxDepthLayer depth="D0" fill animateEntry={false}>
				<BerxLightField
					style={styles.fieldFill}
					ground={colors.bg}
					vignette={0.9}
					horizon={0.18}
					sources={[
						{x: 0.5, y: 0.1, r: 0.95, color: scene.glow, intensity: 0.55, falloff: 2.2, stretch: 0.6},
						{x: 0.12, y: 0.62, r: 0.85, color: scene.counter, intensity: 0.3, falloff: 2.4},
						{x: 0.9, y: 0.92, r: 0.7, color: scene.fill, intensity: 0.18, falloff: 2.8},
					]}
				/>
			</BerxDepthLayer>

			{/* D1 — ATMOSPHERE. The dust is bound to the same real signal the
			    camera uses, so it drifts WITH the scene rather than beside it. */}
			<BerxDepthLayer depth="D1" fill animateEntry={false} style={styles.atmosphere}>
				<BerxAuroraField width={win.width} height={win.height} parallax={{x: signal.x, y: signal.y}} />
			</BerxDepthLayer>

			{/* D2 — STRUCTURE. The scope, as type large enough to be
			    architecture rather than a label. It sits far back and moves
			    least, which is exactly what makes the rows in front of it
			    read as near. */}
			<BerxDepthLayer depth="D2" fill animateEntry={false} style={styles.structure}>
				<Text style={styles.structureWord} numberOfLines={1}>{structuralWord.toUpperCase()}</Text>
			</BerxDepthLayer>

			{/* D4 — ACTIONS. The field and the filters act ON the results, so
			    they sit in front of them. D5 rides with the field: the halo
			    is lit only while a real request is in flight. */}
			<BerxDepthLayer depth="D4" style={styles.searchBar}>
				<BerxEnergyHalo energy={loading ? 1 : 0} size={999}>
					<BerxSearchField
						placeholder="Поиск"
						value={query}
						onChangeText={handleChange}
						accessibilityLabel="Поиск по BERX"
					/>
				</BerxEnergyHalo>
			</BerxDepthLayer>

			{/* Five tabs do not fit the width: "Теги" used to be cut off by
			    the screen edge and its right half could not be tapped at all
			    — a whole search category unreachable. Real horizontal scroll
			    with the shared edge affordance. */}
			<BerxDepthLayer depth="D4" style={styles.tabRowWrap}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
					{TABS.map((t) => (
						<Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => switchTab(t.key)}>
							<Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
							{/* D5 energy, at the size it belongs at: one lit edge under
							    the scope you are actually in. */}
							{tab === t.key ? <View style={styles.tabEnergy} /> : null}
						</Pressable>
					))}
				</ScrollView>
				<BerxEdgeFade color={colors.bg} width={32} />
			</BerxDepthLayer>

			{/* D3 — RESULTS. The subject of the scene, on the focal plane. */}
			<BerxDepthLayer depth="D3" style={styles.results}>
			{error ? (
				<BerxErrorState message={error} onRetry={() => runSearch(query, tab)} />
			) : loading ? (
				/* Was the bare string "Поиск..." — the one screen in the product
				   that answered a wait with typed-out text instead of the shared
				   loading state every other screen uses. */
				<BerxLoadingState label="Ищем" />
			) : searched && currentCount === 0 ? (
				<BerxEmptyState title="Ничего не найдено" />
			) : !searched && tab === 'users' && suggestions && suggestions.length > 0 ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={suggestions}
						keyExtractor={(p: BerxPeopleSuggestion) => String(p.guid)}
						contentContainerStyle={styles.suggestionsList}
						ListHeaderComponent={<Text style={styles.suggestionsTitle}>Возможно, вы знакомы</Text>}
						renderItem={({item}: {item: BerxPeopleSuggestion}) => (
							<Pressable style={styles.row} onPress={() => onOpenProfile(item.username)}>
								<Text style={styles.fullname}>{item.fullname || item.username}</Text>
								<View style={styles.metaRow}>
									<Text style={styles.username}>
										@{item.username} · {item.mutual_count} общих {ruPlural(item.mutual_count, 'друг', 'друга', 'друзей')}
									</Text>
									{item.mutual_communities_count > 0 ? (
										<View style={styles.metaChip}>
											<BerxIcon name="users" size={13} color={colors.textFaint}  />
											<Text style={styles.username}>{item.mutual_communities_count}</Text>
										</View>
									) : null}
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : !searched ? (
				<BerxEmptyState title="Начните вводить запрос" />
			) : tab === 'users' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={users}
						keyExtractor={(u: SearchResultUser) => String(u.guid)}
						renderItem={({item}: {item: SearchResultUser}) => (
							/* A people-search result list was the only list of humans in
							   BERX with no faces in it — places and events beside it
							   already showed a thumbnail. The avatar was not being
							   dropped by this screen; search.php simply never sent one,
							   which is now fixed at the source rather than papered over
							   with a permanent initial. */
							<Pressable style={styles.mediaRow} onPress={() => onOpenProfile(item.username)}>
								{item.icon ? (
									<Image source={{uri: item.icon}} style={styles.avatar} />
								) : (
									<View style={[styles.avatar, styles.avatarFallback]}>
										<Text style={styles.avatarInitial}>{(item.fullname || item.username).charAt(0).toUpperCase()}</Text>
									</View>
								)}
								<View style={styles.mediaBody}>
									<Text style={styles.fullname} numberOfLines={1}>{item.fullname || item.username}</Text>
									<Text style={styles.username}>@{item.username}</Text>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'places' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={places}
						keyExtractor={(p: BerxPlaceSearchResult) => String(p.guid)}
						renderItem={({item}: {item: BerxPlaceSearchResult}) => (
							<Pressable style={styles.mediaRow} onPress={() => onOpenPlace(item.guid)}>
								{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.mediaBody}>
									<Text style={styles.fullname} numberOfLines={1}>{item.title}</Text>
									<View style={styles.metaRow}>
										{item.category ? <Text style={styles.username}>{item.category}</Text> : null}
										{item.friends_count > 0 ? (
											<View style={styles.metaChip}>
												<BerxIcon name="users" size={13} color={colors.textFaint}  />
												<Text style={styles.username}>{item.friends_count}</Text>
											</View>
										) : null}
									</View>
								</View>
								{item.rating > 0 ? (
									<View style={styles.metaChip}>
										<BerxIcon name="star" size={13} color={colors.accent}  filled />
										<Text style={styles.rating}>{item.rating}</Text>
									</View>
								) : null}
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'events' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={events}
						keyExtractor={(e: BerxEventSearchResult) => String(e.guid)}
						renderItem={({item}: {item: BerxEventSearchResult}) => (
							<Pressable style={styles.mediaRow} onPress={() => onOpenEvent(item.guid)}>
								{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.mediaBody}>
									<Text style={styles.fullname} numberOfLines={1}>{item.title}</Text>
									<View style={styles.metaRow}>
									<Text style={styles.username}>{new Date(item.starts * 1000).toLocaleDateString('ru-RU')}</Text>
									{item.friends_count > 0 ? (
										<View style={styles.metaChip}>
											<BerxIcon name="users" size={13} color={colors.textFaint}  />
											<Text style={styles.username}>{item.friends_count}</Text>
										</View>
									) : null}
								</View>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'communities' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={communities}
						keyExtractor={(c: BerxCommunitySearchResult) => String(c.guid)}
						renderItem={({item}: {item: BerxCommunitySearchResult}) => (
							<Pressable style={styles.row} onPress={() => onOpenCommunity(item.guid)}>
								<Text style={styles.fullname}>{item.title}</Text>
								<View style={styles.metaRow}>
								<Text style={styles.username}>
									{item.members} {ruPlural(item.members, 'участник', 'участника', 'участников')}{item.owner ? ` · ${item.owner}` : ''}
								</Text>
								{item.friends_count > 0 ? (
									<View style={styles.metaChip}>
										<BerxIcon name="users" size={13} color={colors.textFaint}  />
										<Text style={styles.username}>{item.friends_count}</Text>
									</View>
								) : null}
							</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={hashtags}
						keyExtractor={(h: BerxTrendingHashtag) => h.hashtag}
						renderItem={({item}: {item: BerxTrendingHashtag}) => (
							<Pressable style={styles.row} onPress={() => onOpenHashtag && onOpenHashtag(item.hashtag)}>
								<Text style={styles.fullname}>#{item.hashtag}</Text>
								<Text style={styles.username}>{item.post_count} {ruPlural(item.post_count, 'пост', 'поста', 'постов')}</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
			</BerxDepthLayer>
		</BerxSpatialScene>
	);
}

const makeStyles = (colors: BerxColorTokens, glass: Record<BerxGlassLevel, BerxGlassLevelTokens>) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	// D3 carries DEPTH here, not a painted panel. A `material` on a
	// flex-filling list plane draws a bordered box the length of the
	// viewport, which with three results is a large empty rectangle — the
	// generic glassmorphism the brief rules out. The separation on this
	// scene comes from layer order, entry choreography and the atmosphere
	// behind it; the rows keep their hairline rhythm.
	results: {flex: 1},
	fieldFill: {...StyleSheet.absoluteFillObject},
	// The dust reads as air, not as confetti — it must sit under the
	// threshold where individual motes become countable.
	atmosphere: {opacity: 0.42},
	// D2 structural type. Deliberately just above the ground in
	// luminance: it has to be legible as architecture and invisible as
	// content, or it competes with the results it sits behind.
	// Anchored to the bottom-left and allowed to bleed off the edge. Its
	// first position (centred, 128px down) put it exactly through the
	// first result row, so the type fought the content instead of
	// sitting behind it. Down here it occupies the part of the scene the
	// list genuinely does not reach.
	structure: {justifyContent: 'flex-end', alignItems: 'flex-start', overflow: 'hidden'},
	structureWord: {
		color: colors.text,
		opacity: 0.045,
		fontSize: 108,
		lineHeight: 112,
		marginLeft: -10,
		marginBottom: 40,
		fontWeight: typography.weightBold,
		letterSpacing: -5,
	},
	// D5 — one lit edge under the active scope. Not a glow around the
	// whole chip: energy marks WHERE you are, it does not decorate.
	tabEnergy: {
		position: 'absolute',
		left: spacing.md,
		right: spacing.md,
		bottom: 2,
		height: 2,
		borderRadius: 2,
		backgroundColor: colors.accent,
	},
	searchBar: {padding: spacing.lg, paddingBottom: spacing.sm},
	tabRowWrap: {paddingBottom: spacing.sm},
	tabRow: {flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingRight: spacing.xxl},
	tab: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: radius.pill,
		backgroundColor: colors.glass2,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.borderSoft,
	},
	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim},
	tabTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	hint: {color: colors.textDim, textAlign: 'center', marginTop: spacing.xl, fontSize: typography.sizeBase},
	fadeFlex: {flex: 1},
	metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap'},
	// A count with its own glyph, kept together so it never wraps apart
	// from the thing it counts.
	metaChip: {flexDirection: 'row', alignItems: 'center', gap: 4},
	avatar: {width: 44, height: 44, borderRadius: 22},
	avatarFallback: {backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	avatarInitial: {color: colors.textDim, fontSize: typography.sizeBase, fontWeight: typography.weightBold},
	suggestionsList: {paddingBottom: spacing.xl},
	suggestionsTitle: {color: colors.textFaint, fontSize: typography.sizeXs, textTransform: 'uppercase', padding: spacing.lg, paddingBottom: spacing.xs},
	// MATERIAL RESPONSE. A row is a real object on the focal plane, so it
	// gets the two things a lit object has and a flat list row does not:
	// a bright top edge where the key light above catches it, and a
	// shadow beneath it. The bottom hairline stays as the rhythm of the
	// list; the top hairline is the light.
	// A result is an OBJECT on the focal plane, so it is inset and
	// rounded with a lit top edge and a shadow beneath — not a full-bleed
	// band with a divider, which is what a table row looks like and what
	// this was. The light comes from above the search field, so the
	// highlight goes on top.
	row: {
		padding: spacing.lg,
		marginHorizontal: spacing.md,
		marginBottom: spacing.sm,
		borderRadius: radius.lg,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.borderSoft,
		borderTopColor: glass[1].hairline,
		backgroundColor: colors.glass2,
		// The system's own D3 standoff shadow, not hand-picked numbers:
		// depthShadowV9 derives opacity, radius and offset from the real
		// z-gap between D2 and D3, so a card here casts the same shadow a
		// card at the same depth casts anywhere else in BERX.
		...depthShadowV9('D3', colors.mediaScrim),
	},
	fullname: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	username: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	mediaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		padding: spacing.lg,
		marginHorizontal: spacing.md,
		marginBottom: spacing.sm,
		borderRadius: radius.lg,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.borderSoft,
		borderTopColor: glass[1].hairline,
		backgroundColor: colors.glass2,
		// The system's own D3 standoff shadow, not hand-picked numbers:
		// depthShadowV9 derives opacity, radius and offset from the real
		// z-gap between D2 and D3, so a card here casts the same shadow a
		// card at the same depth casts anywhere else in BERX.
		...depthShadowV9('D3', colors.mediaScrim),
	},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	mediaBody: {flex: 1},
	rating: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
