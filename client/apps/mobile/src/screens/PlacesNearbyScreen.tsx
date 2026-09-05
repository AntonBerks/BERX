/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data: api.nearbyPlaces(lat, lng, radius) (components/OssnApi/
 * v1/places.php's /places/nearby, real haversine distance server-side).
 * No react-native-geolocation dependency exists in this sandbox (npm
 * blocked) — origin is manual lat/lng entry, matching the real web
 * page's own "no silent geolocation" principle rather than faking a
 * device location. A real build should add a Geolocation permission
 * flow here later; this does not pretend that already exists.
 */
import React, {useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNearbyPlace} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxChoiceChips} from '../../../../packages/design-system/src/spatial/BerxChoiceChips';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface PlacesNearbyScreenProps {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

const RADII = [1, 3, 5, 10, 25, 50];

export default function PlacesNearbyScreen(props: PlacesNearbyScreenProps) {
	return (
		<BerxFamilyScene family="PLACES" testID="places-nearby">
			<PlacesNearbyScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function PlacesNearbyScreenBody({api, onOpenPlace, onBack}: PlacesNearbyScreenProps) {
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [radiusKm, setRadiusKm] = useState(5);
	const [items, setItems] = useState<BerxNearbyPlace[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);

	async function search() {
		const la = Number(lat);
		const ln = Number(lng);
		if (!Number.isFinite(la) || !Number.isFinite(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
			setError('Введите корректные координаты.');
			return;
		}
		setLoading(true);
		setError(null);
		setSearched(true);
		try {
			const res = await api.nearbyPlaces(la, ln, radiusKm);
			setItems(res.places);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить места рядом');
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Рядом" onBack={onBack} />
			<View style={styles.form}>
				<View style={styles.row}>
					<View style={styles.half}><BerxInput placeholder="Широта" value={lat} onChangeText={setLat} keyboardType="decimal-pad" /></View>
					<View style={styles.half}><BerxInput placeholder="Долгота" value={lng} onChangeText={setLng} keyboardType="decimal-pad" /></View>
				</View>
				<BerxChoiceChips
					accessibilityLabel="Радиус поиска"
					value={radiusKm}
					onChange={setRadiusKm}
					options={RADII.map((r) => ({key: r, label: `${r} км`}))}
				/>
				<BerxButton label="Искать" loading={loading} onPress={search} fullWidth />
			</View>

			{loading ? (
				<BerxLoadingState />
			) : error ? (
				<BerxErrorState message={error} onRetry={search} />
			) : !searched ? (
				<BerxEmptyState title="Укажите точку отсчёта" subtitle="Введите координаты и радиус — покажем, что рядом." />
			) : items.length === 0 ? (
				<BerxEmptyState title="Рядом ничего нет" subtitle="Попробуйте увеличить радиус." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(p: BerxNearbyPlace) => String(p.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxNearbyPlace}) => (
						<BerxSpatialCard
							depth="D3"
							padding={0}
							radius={18}
							onPress={() => onOpenPlace(item.guid)}
							accessibilityLabel={item.title}>
							{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.cardImage} /> : <View style={styles.cardImageFallback} />}
							<View style={styles.cardBody}>
								<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
								<Text style={styles.cardDistance}>{item.distance_km} км</Text>
							</View>
						</BerxSpatialCard>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	form: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', gap: spacing.sm},
	half: {flex: 1},
	list: {padding: spacing.md, gap: spacing.sm},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	card: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.sm},
	cardImage: {width: 56, height: 56, borderRadius: radius.sm},
	cardImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	cardBody: {flex: 1},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	cardDistance: {fontSize: typography.sizeXs, color: colors.accent},
});
