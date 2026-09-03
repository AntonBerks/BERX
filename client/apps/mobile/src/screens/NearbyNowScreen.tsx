/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.nearbyNow() (components/OssnApi/v1/nearby.php).
 * Same honest manual-lat/lng pattern as PlacesNearbyScreen (no real
 * device Geolocation library is available in this sandbox). No
 * "Открыто сейчас" is now a real filter, backed by structured
 * ossn_place_hours server-side. Places with no structured hours are
 * never hidden by it — "unknown" is not treated as "closed".
 *
 * BERX WORLD REBUILD — same treatment as PlacesNearbyScreen: a real
 * World-reactive BerxAura ground behind the whole screen instead of a
 * flat opaque background, the coordinate/filter form promoted onto
 * real glass instead of sitting bare in the layout flow. The result
 * list was already on BerxGlassSurface rows from an earlier pass —
 * left as-is.
 */
import {useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNearbyPlaceItem, BerxNearbyEventItem} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';

import {useBerxColors, useBerxScene} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

type Row = {kind: 'place'; item: BerxNearbyPlaceItem} | {kind: 'event'; item: BerxNearbyEventItem};

function fmtWhen(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

export default function NearbyNowScreen({api, onOpenPlace, onOpenEvent, onBack}: Props) {
	const colors = useBerxColors();
	const scene = useBerxScene();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [today, setToday] = useState(false);
	const [openNow, setOpenNow] = useState(false);
	const [places, setPlaces] = useState<BerxNearbyPlaceItem[] | null>(null);
	const [events, setEvents] = useState<BerxNearbyEventItem[]>([]);
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
			const res = await api.nearbyNow(la, ln, 5, today, openNow);
			setPlaces(res.places);
			setEvents(res.events);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
		}
	}

	const rows: Row[] = places === null ? [] : [
		...places.map((p): Row => ({kind: 'place', item: p})),
		...events.map((e): Row => ({kind: 'event', item: e})),
	];

	return (
		<View style={styles.screen}>
			<BerxAura ground={scene.ground} glow={scene.glow} counter={scene.counter} intensity={0.55} at={0.1} />
			{/* Editorial header — same reasoning as PlacesNearbyScreen: a
			    destination, not a pushed detail. Second line is live state. */}
			<View style={styles.head}>
				<BerxEditorialTitle
					topInset={!onBack}
					style={styles.headline}
					accentIndex={1}
					lines={['Рядом сейчас', places === null ? 'живая картина вокруг' : `${rows.length} ${rows.length === 1 ? 'место рядом' : 'мест и событий рядом'}`]}
				/>
				{onBack ? (
					<View style={styles.headActions}>
						<BerxCircleButton icon="chevron-left" onPress={onBack} />
					</View>
				) : null}
			</View>
			<BerxGlassSurface level={3} padding="md" style={styles.form}>
				<View style={styles.row}>
					<View style={styles.half}><BerxInput placeholder="Широта" value={lat} onChangeText={setLat} keyboardType="decimal-pad" /></View>
					<View style={styles.half}><BerxInput placeholder="Долгота" value={lng} onChangeText={setLng} keyboardType="decimal-pad" /></View>
				</View>
				<View style={styles.filterRow}>
					<Pressable onPress={() => setToday(!today)}>
						<Text style={[styles.todayToggleText, today && styles.todayToggleTextActive]}>
							{today ? '✓ События сегодня' : 'События сегодня'}
						</Text>
					</Pressable>
					<Pressable onPress={() => setOpenNow(!openNow)}>
						<Text style={[styles.todayToggleText, openNow && styles.todayToggleTextActive]}>
							{openNow ? '✓ Открыто сейчас' : 'Открыто сейчас'}
						</Text>
					</Pressable>
				</View>
				{error ? <Text style={styles.error}>{error}</Text> : null}
				<BerxButton label="Найти рядом" onPress={search} loading={loading} fullWidth />
			</BerxGlassSurface>

			{places !== null && rows.length === 0 ? (
				<BerxEmptyState title="Рядом ничего не найдено" subtitle="Попробуйте увеличить радиус или другие координаты." />
			) : (
				<BerxFadeIn style={styles.listFade}>
					<FlatList
						data={rows}
						keyExtractor={(row: Row) => `${row.kind}-${row.item.guid}`}
						contentContainerStyle={styles.list}
						renderItem={({item: row}: {item: Row}) =>
							row.kind === 'place' ? (
								<Pressable onPress={() => { api.recordNearbyAction(row.item.guid, 'opened').catch(() => undefined); onOpenPlace(row.item.guid); }}>
									<BerxGlassSurface padding="sm" style={styles.row2}>
										{row.item.cover_url ? <Image source={{uri: row.item.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
										<View style={styles.rowBody}>
											<Text style={styles.title} numberOfLines={1}>{row.item.title}</Text>
											<Text style={styles.meta}>Место · {row.item.distance_km} км{row.item.is_open_now === true ? ' · Открыто' : row.item.is_open_now === false ? ' · Закрыто' : ''}{row.item.friends_count > 0 ? ` · 👥 ${row.item.friends_count}` : ''}</Text>
											{row.item.moments.length > 0 ? <Text style={styles.momentText} numberOfLines={1}>🔥 {row.item.moments[0].text}</Text> : null}
										</View>
									</BerxGlassSurface>
								</Pressable>
							) : (
								<Pressable onPress={() => onOpenEvent(row.item.guid)}>
									<BerxGlassSurface padding="sm" style={styles.row2}>
										<View style={styles.thumbFallback} />
										<View style={styles.rowBody}>
											<Text style={styles.title} numberOfLines={1}>{row.item.title}</Text>
											<Text style={styles.meta}>Событие · {fmtWhen(row.item.starts)} · {row.item.distance_km} км{row.item.friends_count > 0 ? ` · 👥 ${row.item.friends_count}` : ''}</Text>
										</View>
									</BerxGlassSurface>
								</Pressable>
							)
						}
					/>
				</BerxFadeIn>
			)}
		</View>
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
	filterRow: {flexDirection: 'row', gap: 16},
	todayToggleText: {fontSize: typography.sizeSm, color: colors.textFaint},
	todayToggleTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	listFade: {flex: 1},
	list: {padding: spacing.md},
	row2: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
	momentText: {fontSize: typography.sizeXs, color: colors.accent, marginTop: 2},
});
