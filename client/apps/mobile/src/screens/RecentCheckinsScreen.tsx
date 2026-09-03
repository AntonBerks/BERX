/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.recentCheckins() was always a
 * real, working client method (real GET /places/checkins, backed by
 * OssnPlaces::recentCheckins() — the real geo-verified check-in
 * system built earlier this session) with zero UI caller. Life
 * Graph's own `checked_in` edges surface check-ins as one signal
 * among many in a broader graph, not a dedicated place-by-place
 * history — this screen is that history, real check-in timestamp per
 * real place, mirroring SavedPlacesScreen's structure exactly.
 *
 * BERX SPATIAL ENGINE — real 3D, REUSED not rebuilt. This screen's
 * data (real place + real timestamp, nothing else) is exactly the
 * shape BerxTimelineScene already renders for Life Graph — z = time —
 * so it composes the SAME scene component rather than a second
 * "mini timeline engine" (master directive §27/§30: reuse, don't
 * fabricate a parallel system). Each BerxRecentCheckin is mapped to
 * the same edge shape BerxTimelineScene consumes; no field is
 * invented in the mapping.
 *
 * The rows were also the old generic-list pattern (a flat
 * colors.surface box) — converted to real BerxGlassSurface cards, and
 * the plain BerxHeader replaced with the same editorial header
 * language every other personal-history destination (People/Circles/
 * Life Graph) now uses.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxRecentCheckin, BerxLifeGraphEdge} from '@berx/api/types';
import {relativeTimeLabel, ruPlural} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import BerxTimelineScene from '../three/BerxTimelineScene';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

export default function RecentCheckinsScreen({api, onOpenPlace, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxRecentCheckin[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	/** Off by default, same as every other spatial view: the list stays the dependable read. */
	const [spatial, setSpatial] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.recentCheckins();
			setItems(res.checkins);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить отметки');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	// Real data only: place identity + real timestamp, nothing invented —
	// same edge shape BerxTimelineScene already renders for Life Graph.
	const edges: BerxLifeGraphEdge[] = items.map((c) => ({
		type: 'checked_in',
		target_type: 'place',
		target_guid: c.place.guid,
		target_title: c.place.title,
		time: c.time,
	}));

	return (
		<View style={styles.screen}>
			<View style={styles.head}>
				<BerxEditorialTitle
					topInset={!onBack}
					style={styles.headline}
					accentIndex={1}
					lines={['Мои отметки', items.length > 0 ? `${items.length} ${ruPlural(items.length, 'место', 'места', 'мест')}` : 'пока пусто']}
				/>
				<View style={styles.headActions}>
					{items.length > 0 ? (
						<Pressable style={styles.spatialToggle} onPress={() => setSpatial((v: boolean) => !v)}>
							<Text style={styles.spatialToggleText}>{spatial ? 'Списком' : 'Во времени'}</Text>
						</Pressable>
					) : null}
					{onBack ? <BerxCircleButton icon="chevron-left" onPress={onBack} /> : null}
				</View>
			</View>

			{items.length === 0 ? (
				<BerxEmptyState title="Пока нет отметок" subtitle="Отметьтесь на странице места, когда будете рядом." />
			) : spatial ? (
				<View style={styles.spatialWrap}>
					<BerxTimelineScene edges={edges} />
				</View>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(c: BerxRecentCheckin, index: number) => `${c.place.guid}-${c.time}-${index}`}
						contentContainerStyle={styles.list}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
						renderItem={({item}: {item: BerxRecentCheckin}) => (
							<Pressable onPress={() => onOpenPlace(item.place.guid)}>
								<BerxGlassSurface padding="sm" style={styles.row}>
									{item.place.cover_url ? <Image source={{uri: item.place.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
									<View style={styles.rowBody}>
										<Text style={styles.title} numberOfLines={1}>{item.place.title}</Text>
										<Text style={styles.time}>{relativeTimeLabel(item.time)}</Text>
									</View>
								</BerxGlassSurface>
							</Pressable>
						)}
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
	headActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	spatialToggle: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999, backgroundColor: colors.accentSoft},
	spatialToggleText: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	spatialWrap: {padding: spacing.md},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	time: {fontSize: typography.sizeXs, color: colors.textFaint},
});
