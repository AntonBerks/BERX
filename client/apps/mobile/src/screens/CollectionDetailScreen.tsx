/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getCollection()/removeCollectionItem()
 * (components/OssnApi/v1/collections.php). Tapping an item navigates
 * to its real detail screen (Place/Event) — Posts are shown but not
 * yet navigable from here (no PostDetail route param path wired for
 * this screen; not faked as clickable when it wouldn't do anything).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollectionDetail, BerxCollectionItem} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';

export interface CollectionDetailScreenProps {
	api: BerxApiClient;
	id: number;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenPost: (guid: number) => void;
	onBack?: () => void;
}

export default function CollectionDetailScreen(props: CollectionDetailScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" atmosphereKind="location" testID="collection-detail">
			<CollectionDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

/** The first saved item carrying an image. */
function collectionMedia(collection: BerxCollectionDetail | null): {uri: string} | undefined {
	const item = collection?.items.find((i) => i.image_url);
	return item?.image_url ? {uri: item.image_url} : undefined;
}

function CollectionDetailScreenBody({api, id, onOpenPlace, onOpenEvent, onOpenPost, onBack}: CollectionDetailScreenProps) {
	const [collection, setCollection] = useState<BerxCollectionDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* the collection is about places and events — the first one with an image lights it */
	useBerxSceneAtmosphere(collectionMedia(collection));

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.getCollection(id);
			setCollection(res);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Подборка недоступна');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function removeItem(item: BerxCollectionItem) {
		if (!collection) return;
		try {
			await api.removeCollectionItem(collection.id, item.item_type, item.item_guid);
			setCollection({
				...collection,
				items: collection.items.filter((i: BerxCollectionItem) => !(i.item_type === item.item_type && i.item_guid === item.item_guid)),
			});
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		}
	}

	function openItem(item: BerxCollectionItem) {
		if (item.item_type === 'place') onOpenPlace(item.item_guid);
		else if (item.item_type === 'event') onOpenEvent(item.item_guid);
		else onOpenPost(item.item_guid);
	}

	if (loading) return <BerxLoadingState />;
	if (error || !collection) return <BerxErrorState message={error ?? 'Подборка не найдена'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title={collection.title} onBack={onBack} />
			{collection.description ? <Text style={styles.description}>{collection.description}</Text> : null}
			{collection.items.length === 0 ? (
				<BerxEmptyState title="Пока пусто" subtitle="Добавляйте места и события в эту подборку с их страниц." />
			) : (
				<FlatList
					data={collection.items}
					keyExtractor={(i: BerxCollectionItem) => `${i.item_type}-${i.item_guid}`}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCollectionItem}) => (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.md}
							radius={18}
							onPress={() => openItem(item)}
							accessibilityLabel={item.title}>
							<View style={styles.row}>
							{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
							<View style={styles.rowBody}>
								<Text style={styles.title} numberOfLines={1}>{item.title}</Text>
								<Text style={styles.type}>{item.item_type === 'place' ? 'Место' : item.item_type === 'event' ? 'Событие' : 'Пост'}</Text>
							</View>
							{collection.is_own ? (
								<Pressable onPress={() => removeItem(item)} hitSlop={8}>
									<Text style={styles.remove}>✕</Text>
								</Pressable>
							) : null}
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
	description: {fontSize: typography.sizeSm, color: colors.textDim, paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	type: {fontSize: typography.sizeXs, color: colors.textFaint},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
