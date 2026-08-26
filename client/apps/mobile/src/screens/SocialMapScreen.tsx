/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.socialMap() (components/OssnApi/v1/socialmap.php).
 * Same honest manual-lat/lng pattern as NearbyNowScreen/PlacesNearbyScreen
 * (no real device Geolocation library in this sandbox). No fake map
 * canvas either — no map-rendering library is confirmed installed
 * here, so this is a real list of real pins, not a pretend map view;
 * see docs/BERX_FUTURE_LAYER_SPEC.md. Friends are listed separately,
 * never plotted — no real friend-location data exists or is exposed.
 *
 * MAX BUILD — "City + People + Places + Events + Moments = one living
 * environment": City Mode's response now carries the real active
 * Moments themselves (not just a count), rendered here as a "live
 * now" strip right under the stat row — the same real, owner-posted,
 * time-bound announcements Nearby Now already shows per-place, now
 * also visible as one pulse-of-the-city list.
 */
import {useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxSocialMapPlacePin, BerxSocialMapEventPin, BerxSocialMapFriend, BerxCityModeResponse, BerxCityModeMoment} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenProfile: (username: string) => void;
	onBack?: () => void;
}

type Row = {kind: 'place'; item: BerxSocialMapPlacePin} | {kind: 'event'; item: BerxSocialMapEventPin};

export default function SocialMapScreen({api, onOpenPlace, onOpenEvent, onOpenProfile, onBack}: Props) {
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [places, setPlaces] = useState<BerxSocialMapPlacePin[] | null>(null);
	const [events, setEvents] = useState<BerxSocialMapEventPin[]>([]);
	const [friends, setFriends] = useState<BerxSocialMapFriend[]>([]);
	const [city, setCity] = useState<BerxCityModeResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	return (
		<View style={styles.screen}>
			<BerxHeader title="Карта BERX" onBack={onBack} />
			<View style={styles.form}>
				<BerxInput placeholder="Широта" keyboardType="numeric" value={lat} onChangeText={setLat} style={styles.input} />
				<BerxInput placeholder="Долгота" keyboardType="numeric" value={lng} onChangeText={setLng} style={styles.input} />
				{error ? <Text style={styles.error}>{error}</Text> : null}
				<BerxButton label="Показать" onPress={search} loading={loading} fullWidth />
			</View>

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

const styles = StyleSheet.create({
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
	pinsFade: {flex: 1},
	pin: {marginHorizontal: spacing.md, marginBottom: spacing.sm, gap: 4},
	pinKind: {fontSize: typography.sizeSm, color: colors.accent},
	pinTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
});
