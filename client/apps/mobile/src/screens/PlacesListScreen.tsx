/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data only: api.places(q, category) -> BerxPlace[]
 * (components/OssnApi/v1/places.php). Category filter uses the real
 * server whitelist via api.placeCategories(), not a hardcoded list.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet, Image} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onCreate: () => void;
	onOpenNearby: () => void;
	onOpenSaved: () => void;
	onBack?: () => void;
}

export default function PlacesListScreen({api, onOpenPlace, onCreate, onOpenNearby, onOpenSaved, onBack}: Props) {
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxPlace[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.placeCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
	}, [api]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.places(query || undefined, category);
			setItems(res.places);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить места');
		} finally {
			setLoading(false);
		}
	}, [api, query, category]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading && items.length === 0) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Места" onBack={onBack} />
			<View style={styles.toolbar}>
				<BerxInput placeholder="Поиск мест" value={query} onChangeText={setQuery} onSubmitEditing={load} />
				<View style={styles.toolbarRow}>
					<BerxButton label="Рядом" variant="secondary" onPress={onOpenNearby} />
					<BerxButton label="Сохранённые" variant="secondary" onPress={onOpenSaved} />
					<BerxButton label="Добавить" onPress={onCreate} />
				</View>
			</View>
			<FlatList
				horizontal
				showsHorizontalScrollIndicator={false}
				data={categories}
				keyExtractor={(c: BerxPlaceCategory) => c.slug}
				contentContainerStyle={styles.chipRow}
				renderItem={({item}: {item: BerxPlaceCategory}) => (
					<Pressable
						style={[styles.chip, category === item.slug && styles.chipActive]}
						onPress={() => setCategory(category === item.slug ? undefined : item.slug)}>
						<Text style={[styles.chipText, category === item.slug && styles.chipTextActive]}>{item.label}</Text>
					</Pressable>
				)}
			/>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Мест не найдено" subtitle="Попробуйте другой запрос или добавьте первое место." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(p: BerxPlace) => String(p.guid)}
					numColumns={2}
					contentContainerStyle={styles.grid}
					renderItem={({item}: {item: BerxPlace}) => (
						<Pressable style={styles.card} onPress={() => onOpenPlace(item.guid)}>
							<View style={styles.cardMedia}>
								{item.cover_url ? (
									<Image source={{uri: item.cover_url}} style={styles.cardImage} />
								) : (
									<View style={styles.cardMediaFallback}>
										<Text style={styles.cardMediaInitial}>{item.title.charAt(0).toUpperCase()}</Text>
									</View>
								)}
								{item.rating_count > 0 ? (
									<View style={styles.ratingBadge}>
										<Text style={styles.ratingText}>★ {item.rating}</Text>
									</View>
								) : null}
							</View>
							<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
							{item.address ? <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text> : null}
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm},
	toolbarRow: {flexDirection: 'row', gap: spacing.sm},
	chipRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	grid: {paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl},
	card: {flex: 1, margin: spacing.xs, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	cardMedia: {aspectRatio: 1.3, backgroundColor: colors.graphite},
	cardImage: {width: '100%', height: '100%'},
	cardMediaFallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	cardMediaInitial: {fontSize: typography.sizeTitle, color: colors.textFaint},
	ratingBadge: {position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(5,5,5,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill},
	ratingText: {fontSize: typography.sizeXs, color: colors.white},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium, paddingHorizontal: spacing.sm, paddingTop: spacing.xs},
	cardAddress: {fontSize: typography.sizeXs, color: colors.textFaint, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm},
});
