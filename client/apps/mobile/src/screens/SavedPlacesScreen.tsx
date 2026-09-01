/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.savedPlaces() (components/OssnApi/v1/places.php).
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

export default function SavedPlacesScreen({api, onOpenPlace, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxPlace[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.savedPlaces();
			setItems(res.places);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить сохранённые места');
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

	return (
		<View style={styles.screen}>
			<BerxHeader title="Сохранённые места" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Ничего не сохранено" subtitle="Нажмите «Сохранить» на странице места, чтобы вернуться к нему позже." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(p: BerxPlace) => String(p.guid)}
						numColumns={2}
						contentContainerStyle={styles.grid}
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
						renderItem={({item}: {item: BerxPlace}) => (
							<Pressable style={styles.card} onPress={() => onOpenPlace(item.guid)}>
								{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.cardImage} /> : <View style={styles.cardImageFallback} />}
								<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
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
	grid: {padding: spacing.sm},
	fadeFlex: {flex: 1},
	card: {flex: 1, margin: spacing.xs, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	cardImage: {width: '100%', aspectRatio: 1.3},
	cardImageFallback: {width: '100%', aspectRatio: 1.3, backgroundColor: colors.graphite},
	cardTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium, padding: spacing.sm},
});
