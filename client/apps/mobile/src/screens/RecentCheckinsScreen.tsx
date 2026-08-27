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
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxRecentCheckin} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

export default function RecentCheckinsScreen({api, onOpenPlace, onBack}: Props) {
	const [items, setItems] = useState<BerxRecentCheckin[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Мои отметки" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Пока нет отметок" subtitle="Отметьтесь на странице места, когда будете рядом." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(c: BerxRecentCheckin, index: number) => `${c.place.guid}-${c.time}-${index}`}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxRecentCheckin}) => (
						<Pressable style={styles.row} onPress={() => onOpenPlace(item.place.guid)}>
							{item.place.cover_url ? <Image source={{uri: item.place.cover_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
							<View style={styles.rowBody}>
								<Text style={styles.title} numberOfLines={1}>{item.place.title}</Text>
								<Text style={styles.time}>{relativeTimeLabel(item.time)}</Text>
							</View>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	time: {fontSize: typography.sizeXs, color: colors.textFaint},
});
