/**
 * BERX-091 — BERX NOW. The NOW family's v9 scene.
 *
 * Real data: api.nearbyNow() (components/OssnApi/v1/nearby.php).
 * Coordinates are still entered by hand — no device geolocation
 * library is installed, and asking for a permission the app cannot
 * then use would be worse than asking for two numbers.
 *
 * "Открыто сейчас" is a real server filter backed by structured
 * ossn_place_hours. A place with no structured hours returns
 * is_open_now: null and is never hidden by the filter, because
 * "unknown" is not "closed" — the scene counts those places and says
 * so rather than letting the absence pass as a negative answer.
 *
 * There is no map. react-native-maps is not installed and no tile
 * provider is configured, so the same real coordinates drive a
 * distance-ranked rail instead of an empty map frame (BerxMap and
 * BerxMapPin are recorded BLOCKED in the component map, with this
 * reason).
 */
import {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNearbyPlaceItem, BerxNearbyEventItem} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxNowScene} from '../../../../packages/design-system/src/spatial/BerxNowScene';
import type {BerxNowItem} from '../../../../packages/design-system/src/spatial/BerxNowRail';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {berxAnalytics} from '../spatial/analytics';

export interface NearbyNowScreenProps {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

function whenLabel(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

export default function NearbyNowScreen(props: NearbyNowScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-091" testID="berx-091">
			<NearbyNowSceneBody {...props} />
		</BerxScreenScene>
	);
}

function NearbyNowSceneBody({api, onOpenPlace, onOpenEvent, onBack}: NearbyNowScreenProps) {
	const screen = useBerxScreen();
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [filters, setFilters] = useState<string[]>([]);
	const [places, setPlaces] = useState<BerxNearbyPlaceItem[] | null>(null);
	const [events, setEvents] = useState<BerxNearbyEventItem[]>([]);
	const [state, setState] = useState<BerxScreenState>('empty');
	const [error, setError] = useState<string | null>(null);

	const today = filters.includes('today');
	const openNow = filters.includes('open');

	const search = useCallback(async () => {
		const la = Number(lat);
		const ln = Number(lng);
		if (!Number.isFinite(la) || !Number.isFinite(ln) || lat.trim() === '' || lng.trim() === '') {
			setError('Введите корректные координаты.');
			setState('error');
			return;
		}
		setState('loading');
		setError(null);
		try {
			const res = await api.nearbyNow(la, ln, 5, today, openNow);
			setPlaces(res.places);
			setEvents(res.events);
			setState(res.places.length + res.events.length === 0 ? 'empty' : 'default');
			berxAnalytics.primaryAction(screen);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
			setState('error');
			berxAnalytics.error(screen, 'nearby');
		}
	}, [lat, lng, today, openNow, api, screen]);

	const toggle = useCallback((key: string) => {
		setFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
	}, []);

	const items: BerxNowItem[] = [
		...(places ?? []).map((p): BerxNowItem => ({
			id: `place-${p.guid}`,
			kind: 'place',
			title: p.title,
			subtitle:
				p.moments.length > 0
					? p.moments[0].text
					: p.is_open_now === true
						? 'Открыто'
						: p.is_open_now === false
							? 'Закрыто'
							: undefined,
			distanceM: p.distance_km * 1000,
			/* a place is "live" when the owner has a running moment — real, time-bound server state */
			live: p.moments.length > 0,
			onPress: () => {
				/* real impression logging; a failure here must not block navigation */
				api.recordNearbyAction(p.guid, 'opened').catch(() => undefined);
				onOpenPlace(p.guid);
			},
		})),
		...events.map((e): BerxNowItem => ({
			id: `event-${e.guid}`,
			kind: 'event',
			title: e.title,
			subtitle: whenLabel(e.starts),
			distanceM: e.distance_km * 1000,
			live: e.starts * 1000 <= Date.now(),
			onPress: () => onOpenEvent(e.guid),
		})),
	];

	const liveCount = items.filter((i) => i.live).length;
	const placesWithoutHours = (places ?? []).filter((p) => p.is_open_now === null || p.is_open_now === undefined).length;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Рядом сейчас" onBack={onBack} />

			<View style={styles.form}>
				<View style={styles.coords}>
					<View style={styles.half}>
						<BerxInput placeholder="Широта" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
					</View>
					<View style={styles.half}>
						<BerxInput placeholder="Долгота" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
					</View>
				</View>
				<BerxFilterBar
					options={[
						{key: 'today', label: 'События сегодня'},
						{key: 'open', label: 'Открыто сейчас'},
					]}
					selected={filters}
					onToggle={toggle}
					accessibilityLabel="Фильтры «рядом сейчас»"
				/>
				<BerxButton label="Найти рядом" onPress={search} loading={state === 'loading'} fullWidth />
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={search}
				errorMessage={error ?? undefined}
				emptyTitle={places === null ? 'Что происходит рядом' : 'Рядом ничего не найдено'}
				emptyBody={
					places === null
						? 'Введите координаты, чтобы увидеть места и события вокруг вас прямо сейчас.'
						: 'Попробуйте другие координаты или снимите фильтры.'
				}
				style={styles.body}>
				<BerxNowScene
					items={items}
					liveCount={liveCount}
					placesWithoutHours={placesWithoutHours}
					hasLocation={places !== null}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	form: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm},
	coords: {flexDirection: 'row', gap: spacing.sm},
	half: {flex: 1},
	body: {flex: 1, paddingTop: spacing.lg},
});
