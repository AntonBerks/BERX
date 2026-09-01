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
import {View, Text, Pressable, Dimensions, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxSocialMapPlacePin, BerxSocialMapEventPin, BerxCityModeResponse} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxMapSurface} from '../../../../packages/design-system/src/components/BerxMapSurface';
import type {BerxMapPin} from '../../../../packages/design-system/src/components/BerxMapSurface';
import {BerxContextPanel} from '../../../../packages/design-system/src/components/BerxContextPanel';
import {BerxEditorialTitle} from '../../../../packages/design-system/src/components/BerxGreetingHeader';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

type Row = {kind: 'place'; item: BerxSocialMapPlacePin} | {kind: 'event'; item: BerxSocialMapEventPin};

// The map is the screen, so the surface takes the whole window.
const FULL_H = Dimensions.get('window').height;

export default function SocialMapScreen({api, onOpenPlace, onOpenEvent, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [places, setPlaces] = useState<BerxSocialMapPlacePin[] | null>(null);
	const [events, setEvents] = useState<BerxSocialMapEventPin[]>([]);
	const [city, setCity] = useState<BerxCityModeResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// The real center the last successful query actually used — kept
	// separately from the input text so the surface never projects
	// against a coordinate the server was not asked about.
	const [center, setCenter] = useState<{lat: number; lng: number; radiusKm: number} | null>(null);
	const [selected, setSelected] = useState<Row | null>(null);
	// The coordinate form is only in the way once a real center exists.
	const [showForm, setShowForm] = useState(false);

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
			setShowForm(false);
			setSelected(null);
			setPlaces(res.places);
			setEvents(res.events);
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
			imageUrl: r.kind === 'place' ? r.item.cover_url : null,
			kind: r.kind,
			onPress: () => setSelected(r),
		}));
	const unplottable = rows.length - mapPins.length;
	const offMap = rows.filter((r: Row) => typeof r.item.lat !== 'number' || typeof r.item.lng !== 'number');
	const selectedKey = selected ? `${selected.kind}-${selected.item.guid}` : null;

	return (
		<View style={styles.screen}>
			{/* Reference composition: the surface IS the screen, and every
			    control floats over it. The coordinate form stays because
			    there is no geolocation module here — it collapses once a
			    real center has been submitted, rather than occupying the
			    top of the map for the rest of the session. */}
			{center ? (
				<BerxMapSurface
					centerLat={center.lat}
					centerLng={center.lng}
					radiusKm={center.radiusKm}
					pins={mapPins}
					selectedKey={selectedKey}
					height={FULL_H}
					style={styles.mapFill}
				/>
			) : null}

			<View style={styles.topBar} pointerEvents="box-none">
				<BerxHeader title="" onBack={onBack} />
				<BerxEditorialTitle
					style={styles.mapTitle}
					accentIndex={1}
					lines={[
						'Кто рядом',
						center
							? `${mapPins.length} на карте · ${center.radiusKm} км${unplottable > 0 ? ` · ${unplottable} без координат` : ''}`
							: 'укажите точку, чтобы увидеть окружение',
					]}
				/>
			</View>

			{!center || showForm ? (
				<View style={styles.formFloat}>
					<BerxGlassSurface level={4} padding="md" radius={radius.xl}>
						<View style={styles.formRow}>
							<BerxInput placeholder="Широта" keyboardType="numeric" value={lat} onChangeText={setLat} style={styles.input} />
							<BerxInput placeholder="Долгота" keyboardType="numeric" value={lng} onChangeText={setLng} style={styles.input} />
						</View>
						{error ? <Text style={styles.error}>{error}</Text> : null}
						<BerxButton label="Показать" onPress={search} loading={loading} fullWidth />
					</BerxGlassSurface>
				</View>
			) : (
				<Pressable style={styles.recenter} onPress={() => setShowForm(true)}>
					<Text style={styles.recenterGlyph}>⌖</Text>
				</Pressable>
			)}

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

			{/* City stats as one floating strip, the way the reference keeps
			    its chrome over the map instead of stacking lists on top of
			    it. */}
			{city ? (
				<BerxFadeIn style={styles.cityFloat}>
					<BerxGlassSurface level={3} padding="sm" radius={radius.xl} style={styles.cityRow}>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.places_count}</Text><Text style={styles.cityLabel}>мест</Text></View>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.events_count}</Text><Text style={styles.cityLabel}>событий</Text></View>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.active_moments_count}</Text><Text style={styles.cityLabel}>анонсов</Text></View>
						<View style={styles.cityStat}><Text style={styles.cityValue}>{city.friends_online_count}</Text><Text style={styles.cityLabel}>друзей</Text></View>
					</BerxGlassSurface>
				</BerxFadeIn>
			) : null}

			{/* Everything the projection genuinely cannot place. Kept as a
			    floating sheet so those rows stay reachable without covering
			    the map with a list. */}
			{center && offMap.length > 0 ? (
				<View style={styles.offMapFloat}>
					<BerxGlassSurface level={4} padding="md" radius={radius.xl}>
						<Text style={styles.offMapTitle}>Без координат</Text>
						{offMap.map((r: Row) => (
							<Pressable
								key={`off-${r.kind}-${r.item.guid}`}
								style={styles.offMapRow}
								onPress={() => (r.kind === 'place' ? onOpenPlace(r.item.guid) : onOpenEvent(r.item.guid))}>
								<Text style={styles.offMapKind}>{r.kind === 'place' ? 'Место' : 'Событие'}</Text>
								<Text style={styles.offMapName} numberOfLines={1}>{r.item.title}</Text>
							</Pressable>
						))}
					</BerxGlassSurface>
				</View>
			) : null}

		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	mapFill: {position: 'absolute', left: 0, right: 0, top: 0, borderRadius: 0, borderWidth: 0},
	topBar: {position: 'absolute', left: 0, right: 0, top: 0},
	mapTitle: {paddingHorizontal: spacing.lg},
	formFloat: {position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 120},
	formRow: {flexDirection: 'row', gap: spacing.sm},
	recenter: {
		position: 'absolute',
		right: spacing.lg,
		bottom: 140,
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.glass3,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	recenterGlyph: {color: colors.accent, fontSize: 20},
	cityFloat: {position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 96},
	offMapFloat: {position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 176},
	offMapTitle: {color: colors.textFaint, fontSize: typography.sizeXs, textTransform: 'uppercase', marginBottom: spacing.xs},
	offMapRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6},
	offMapKind: {color: colors.accent, fontSize: typography.sizeXs},
	offMapName: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, flex: 1},
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
