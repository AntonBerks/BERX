/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.socialMap() (components/OssnApi/v1/socialmap.php).
 * Same honest manual-lat/lng pattern as NearbyNowScreen/PlacesNearbyScreen
 * (no real device Geolocation library in this sandbox).
 *
 * OPUS 5 — the pins are now PLOTTED, on BerxMapSurface. That is not a
 * reversal of the old "no fake map canvas" note: there is still no map
 * library and therefore still no basemap (no streets, no coastlines,
 * no labels). What BerxMapSurface draws is a real equirectangular
 * projection of the real lat/lng the API returned, around the real
 * center, scaled by the real queried radius — a radar, labelled as
 * one. Pins the server returned WITHOUT coordinates are excluded from
 * the surface (never dropped at an invented position) and stay in the
 * list below, which is kept for exactly that reason. Friends are still
 * listed and never plotted — no real friend-location data exists or is
 * exposed. See docs/BERX_FUTURE_LAYER_SPEC.md.
 *
 * MAX BUILD — "City + People + Places + Events + Moments = one living
 * environment": City Mode's response now carries the real active
 * Moments themselves (not just a count), rendered here as a "live
 * now" strip right under the stat row — the same real, owner-posted,
 * time-bound announcements Nearby Now already shows per-place, now
 * also visible as one pulse-of-the-city list.
 */
import {useState, useMemo} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxSocialMapPlacePin, BerxSocialMapEventPin, BerxSocialMapFriend, BerxCityModeResponse, BerxCityModeMoment} from '@berx/api/types';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxMapSurface} from '../../../../packages/design-system/src/components/BerxMapSurface';
import type {BerxMapPin} from '../../../../packages/design-system/src/components/BerxMapSurface';
import {BerxContextPanel} from '../../../../packages/design-system/src/components/BerxContextPanel';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onBack?: () => void;
}

type Row = {kind: 'place'; item: BerxSocialMapPlacePin} | {kind: 'event'; item: BerxSocialMapEventPin};

export default function SocialMapScreen({api, onOpenPlace, onOpenEvent, onOpenProfile, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [places, setPlaces] = useState<BerxSocialMapPlacePin[] | null>(null);
	const [events, setEvents] = useState<BerxSocialMapEventPin[]>([]);
	const [friends, setFriends] = useState<BerxSocialMapFriend[]>([]);
	const [city, setCity] = useState<BerxCityModeResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// The real center the last successful query actually used — kept
	// separately from the input text so the surface never projects
	// against a coordinate the server was not asked about.
	const [center, setCenter] = useState<{lat: number; lng: number; radiusKm: number} | null>(null);
	const [selected, setSelected] = useState<Row | null>(null);

	async function search() {
		const la = Number(lat);
		const ln = Number(lng);
		if (!Number.isFinite(la) || !Number.isFinite(ln)) {
			setError('Введите корректные координаты.');
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const res = await api.socialMap(la, ln, 5);
			setCenter({lat: la, lng: ln, radiusKm: res.radius_km});
			setSelected(null);
			setPlaces(res.places);
			setEvents(res.events);
			setFriends(res.friends_online);
			// City Mode — best-effort, same real lat/lng, never blocks the map itself.
			api.cityMode(la, ln, 5).then(setCity).catch(() => undefined);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
		}
	}

	const rows: Row[] = places === null ? [] : [
		...places.map((p: BerxSocialMapPlacePin): Row => ({kind: 'place', item: p})),
		...events.map((e: BerxSocialMapEventPin): Row => ({kind: 'event', item: e})),
	];

	// Only rows that carry REAL coordinates can be plotted. Places may
	// legitimately have a null lat/lng (the server types it that way);
	// those keep their place in the list below instead of being given a
	// position they don't have.
	const mapPins: BerxMapPin[] = rows
		.filter((r: Row) => typeof r.item.lat === 'number' && typeof r.item.lng === 'number')
		.map((r: Row) => ({
			key: `${r.kind}-${r.item.guid}`,
			lat: r.item.lat as number,
			lng: r.item.lng as number,
			label: r.item.title,
			kind: r.kind,
			onPress: () => setSelected(r),
		}));
	const unplottable = rows.length - mapPins.length;
	const selectedKey = selected ? `${selected.kind}-${selected.item.guid}` : null;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Карта BERX" onBack={onBack} />
			<View style={styles.form}>
				<BerxInput placeholder="Широта" keyboardType="numeric" value={lat} onChangeText={setLat} style={styles.input} />
				<BerxInput placeholder="Долгота" keyboardType="numeric" value={lng} onChangeText={setLng} style={styles.input} />
				{error ? <Text style={styles.error}>{error}</Text> : null}
				<BerxButton label="Показать" onPress={search} loading={loading} fullWidth />
			</View>

			{center && rows.length > 0 ? (
				<BerxFadeIn style={styles.mapFade}>
					<BerxMapSurface
						centerLat={center.lat}
						centerLng={center.lng}
						radiusKm={center.radiusKm}
						pins={mapPins}
						selectedKey={selectedKey}
						height={280}
					/>
					<Text style={styles.mapNote}>
						Реальная проекция координат вокруг вашей точки. Базовой карты нет.
						{unplottable > 0 ? ` ${unplottable} без координат — ниже списком.` : ''}
					</Text>
				</BerxFadeIn>
			) : null}

			{selected ? (
				<BerxContextPanel
					style={styles.contextPanel}
					eyebrow={selected.kind === 'place' ? 'Место' : 'Событие'}
					title={selected.item.title}
					subtitle={selected.kind === 'place' ? (selected.item as BerxSocialMapPlacePin).category : null}
					onClose={() => setSelected(null)}
					actions={[
						{
							key: 'open',
							label: 'Открыть',
							primary: true,
							onPress: () =>
								selected.kind === 'place' ? onOpenPlace(selected.item.guid) : onOpenEvent(selected.item.guid),
						},
					]}
				/>
			) : null}

			{city ? (
				<BerxFadeIn style={styles.cityFade}>
					<BerxGlassSurface elevated padding="sm" style={styles.cityRow}>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.places_count}</Text><Text style={styles.cityLabel}>мест</Text></View>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.events_count}</Text><Text style={styles.cityLabel}>событий</Text></View>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.active_moments_count}</Text><Text style={styles.cityLabel}>анонсов</Text></View>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.friends_online_count}</Text><Text style={styles.cityLabel}>друзей онлайн</Text></View>
					</BerxGlassSurface>
				</BerxFadeIn>
			) : null}

			{city && city.moments.length > 0 ? (
				<View style={styles.momentsSection}>
					<Text style={styles.sectionTitle}>Сейчас в городе</Text>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={city.moments}
						keyExtractor={(m: BerxCityModeMoment) => String(m.id)}
						contentContainerStyle={styles.momentsList}
						renderItem={({item}: {item: BerxCityModeMoment}) => (
							<View onTouchEnd={() => onOpenPlace(item.place_guid)}>
								<BerxGlassSurface padding="sm" style={styles.momentCard}>
									<Text style={styles.momentText} numberOfLines={2}>🔥 {item.text}</Text>
									<Text style={styles.momentPlace} numberOfLines={1}>{item.place_title}</Text>
								</BerxGlassSurface>
							</View>
						)}
					/>
				</View>
			) : null}

			{friends.length > 0 ? (
				<View style={styles.friendsRow}>
					<Text style={styles.sectionTitle}>Друзья онлайн</Text>
					<FlatList
						horizontal
						data={friends}
						keyExtractor={(f: BerxSocialMapFriend) => String(f.guid)}
						renderItem={({item}: {item: BerxSocialMapFriend}) => (
							<View style={styles.friendItem} onTouchEnd={() => onOpenProfile(item.username)}>
								<BerxAvatar iconUrl={item.icon} fallbackInitial={item.username.charAt(0)} size={48} />
								<Text style={styles.friendName} numberOfLines={1}>{item.fullname}</Text>
							</View>
						)}
					/>
				</View>
			) : null}

			{places === null ? null : rows.length === 0 ? (
				<BerxEmptyState title="Пока ничего рядом" subtitle="Попробуйте другие координаты или увеличьте радиус." />
			) : (
				<BerxFadeIn style={styles.pinsFade} delayMs={80}>
					<FlatList
						data={rows}
						keyExtractor={(r: Row) => `${r.kind}-${r.item.guid}`}
						renderItem={({item}: {item: Row}) => (
							<View onTouchEnd={() => (item.kind === 'place' ? onOpenPlace(item.item.guid) : onOpenEvent(item.item.guid))}>
								<BerxGlassSurface padding="md" style={styles.pin}>
									<Text style={styles.pinKind}>{item.kind === 'place' ? 'Место' : 'Событие'}</Text>
									<Text style={styles.pinTitle}>{item.item.title}</Text>
								</BerxGlassSurface>
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	form: {padding: spacing.md, gap: spacing.sm},
	input: {marginBottom: 0},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	sectionTitle: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, marginBottom: spacing.xs},
	cityFade: {marginHorizontal: spacing.md},
	cityRow: {flexDirection: 'row', justifyContent: 'space-around'},
	cityStat: {alignItems: 'center'},
	cityValue: {fontSize: typography.sizeLg, color: colors.accent, fontWeight: typography.weightBold},
	cityLabel: {fontSize: typography.sizeXs, color: colors.textFaint},
	momentsSection: {paddingVertical: spacing.sm},
	momentsList: {paddingHorizontal: spacing.md, gap: spacing.sm},
	momentCard: {width: 200, marginRight: spacing.sm, gap: 4},
	momentText: {fontSize: typography.sizeSm, color: colors.accent},
	momentPlace: {fontSize: typography.sizeXs, color: colors.textFaint},
	friendsRow: {paddingVertical: spacing.sm},
	friendItem: {alignItems: 'center', width: 64, marginHorizontal: spacing.xs, gap: spacing.xs},
	friendName: {fontSize: typography.sizeSm, color: colors.textDim},
	mapFade: {paddingHorizontal: spacing.md, gap: spacing.xs},
	mapNote: {fontSize: typography.sizeXs, color: colors.textFaint, paddingBottom: spacing.sm},
	contextPanel: {marginHorizontal: spacing.md, marginBottom: spacing.sm},
	pinsFade: {flex: 1},
	pin: {marginHorizontal: spacing.md, marginBottom: spacing.sm, gap: 4},
	pinKind: {fontSize: typography.sizeSm, color: colors.accent},
	pinTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
});
