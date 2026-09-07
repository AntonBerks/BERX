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
 *
 * BERX WORLD REBUILD — this was a plain search-form-over-flat-list
 * utility screen: opaque background, plain `colors.surface` boxes for
 * both the form and the result cards. There is no photo to build a
 * cinematic hero from here (it's a coordinate search, not a place),
 * so the spatial treatment is the ambient one instead: a real
 * World-reactive BerxAura ground behind the whole screen (the same
 * scene primitive BerxStage itself draws from, at a restrained
 * intensity so it stays a felt light, not a wallpaper), the locator
 * form promoted onto real glass, and each result a BerxGlassSurface
 * card instead of a flat colored box.
 */
import {useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import {ruPlural} from '@berx/domain';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNearbyPlace} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {BerxSpatialScene, BerxDepthLayer} from '../../../../packages/design-system/src/v9/BerxSpatialScene';
import {useBerxSpatialSignal} from '../../../../packages/design-system/src/v9/useBerxSpatialSignal';
import {useBerxReducedMotion} from '../../../../packages/design-system/src/v9/BerxBoundaries';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';

import {useBerxColors, useBerxScene} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

const RADII = [1, 3, 5, 10, 25, 50];

export default function PlacesNearbyScreen({api, onOpenPlace, onBack}: Props) {
	const colors = useBerxColors();
	const scene = useBerxScene();
	const reducedMotion = useBerxReducedMotion();
	const signal = useBerxSpatialSignal();
	const styles = useMemo(() => makeStyles(colors), [colors]);
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

	/* PLACES, brought inside the V9 spatial architecture. It had a real
	   aura and real glass already, but no camera and no depth planes at
	   all — the runtime probe measured zero perspective layers here while
	   every other key scene had them, which meant the aura was a painted
	   backdrop rather than an environment the content sits IN. */
	return (
		<BerxSpatialScene
			reducedMotion={reducedMotion}
			signalX={signal.x}
			signalY={signal.y}
			bind={signal.bind}
			style={styles.screen}>
			<BerxDepthLayer depth="D0" fill animateEntry={false}>
				<BerxAura ground={scene.ground} glow={scene.glow} counter={scene.counter} intensity={0.55} at={0.1} />
			</BerxDepthLayer>
			{/* Editorial header, not a title bar: this is a destination you
			    navigate TO, like People or Circles — not a detail pushed off a
			    list, where a back-bar is the right weight. The second line is
			    live state, never fixed copy. */}
			<BerxDepthLayer depth="D4" style={styles.head}>
				<BerxEditorialTitle
					topInset={!onBack}
					style={styles.headline}
					accentIndex={1}
					lines={['Рядом', searched ? `${items.length} ${ruPlural(items.length, 'место', 'места', 'мест')} в ${radiusKm} км` : 'что вокруг вас прямо сейчас']}
				/>
				{onBack ? (
					<View style={styles.headActions}>
						<BerxCircleButton icon="chevron-left" onPress={onBack} />
					</View>
				) : null}
			</BerxDepthLayer>
			{/* The search form ACTS on the results, so it sits in front of
			    them on the controls plane. */}
			<BerxDepthLayer depth="D4">
			<BerxGlassSurface level={3} padding="md" style={styles.form}>
				<View style={styles.row}>
					<View style={styles.half}><BerxInput placeholder="Широта" value={lat} onChangeText={setLat} keyboardType="decimal-pad" /></View>
					<View style={styles.half}><BerxInput placeholder="Долгота" value={lng} onChangeText={setLng} keyboardType="decimal-pad" /></View>
				</View>
				<View style={styles.chipRow}>
					{RADII.map((r) => (
						<Pressable key={r} style={[styles.chip, radiusKm === r && styles.chipActive]} onPress={() => setRadiusKm(r)}>
							<Text style={[styles.chipText, radiusKm === r && styles.chipTextActive]}>{r} км</Text>
						</Pressable>
					))}
				</View>
				<BerxButton label="Искать" loading={loading} onPress={search} fullWidth />
			</BerxGlassSurface>
			</BerxDepthLayer>

			{/* D3 — the places themselves, on the focal plane. */}
			<BerxDepthLayer depth="D3" style={styles.fadeFlex}>
			{loading ? (
				<BerxLoadingState />
			) : error ? (
				<BerxErrorState message={error} onRetry={search} />
			) : !searched ? (
				<BerxEmptyState title="Укажите точку отсчёта" subtitle="Введите координаты и радиус — покажем, что рядом." />
			) : items.length === 0 ? (
				<BerxEmptyState title="Рядом ничего нет" subtitle="Попробуйте увеличить радиус." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(p: BerxNearbyPlace) => String(p.guid)}
						contentContainerStyle={styles.list}
						renderItem={({item}: {item: BerxNearbyPlace}) => (
							<Pressable onPress={() => onOpenPlace(item.guid)}>
								<BerxGlassSurface padding="sm" style={styles.card}>
									{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.cardImage} /> : <View style={styles.cardImageFallback} />}
									<View style={styles.cardBody}>
										<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
										<Text style={styles.cardDistance}>{item.distance_km} км</Text>
									</View>
								</BerxGlassSurface>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
			</BerxDepthLayer>
		</BerxSpatialScene>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	head: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md},
	headline: {flex: 1, paddingHorizontal: 0, paddingTop: 0},
	headActions: {flexDirection: 'row', gap: spacing.sm},
	form: {margin: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', gap: spacing.sm},
	half: {flex: 1},
	chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)'},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	card: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
	cardImage: {width: 56, height: 56, borderRadius: radius.sm},
	cardImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	cardBody: {flex: 1},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	cardDistance: {fontSize: typography.sizeXs, color: colors.accent},
});
