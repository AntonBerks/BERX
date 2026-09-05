/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getCollection()/removeCollectionItem()
 * (components/OssnApi/v1/collections.php). Tapping an item navigates
 * to its real detail screen (Place/Event) — Posts are shown but not
 * yet navigable from here (no PostDetail route param path wired for
 * this screen; not faked as clickable when it wouldn't do anything).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Image, Pressable, StyleSheet} from 'react-native';
import {BerxMediaWell} from '../../../../packages/design-system/src/spatial/BerxMediaWell';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollectionDetail, BerxCollectionItem} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

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
			{collection.description ? <BerxText role="meta" emphasis="secondary" style={styles.description}>{collection.description}</BerxText> : null}
			{collection.items.length === 0 ? (
				<BerxEmptyState title="Пока пусто" subtitle="Добавляйте места и события в эту подборку с их страниц." />
			) : (
				<BerxSceneList
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
							{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <BerxMediaWell radius={radius.sm} style={styles.thumbFallback} />}
							<View style={styles.rowBody}>
								<BerxText role="callout" numberOfLines={1}>{item.title}</BerxText>
								<BerxText role="meta" emphasis="tertiary">{item.item_type === 'place' ? 'Место' : item.item_type === 'event' ? 'Событие' : 'Пост'}</BerxText>
							</View>
							{collection.is_own ? (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Убрать ${item.title} из подборки`}
									onPress={() => removeItem(item)}
									hitSlop={8}>
									<BerxIcon name="close" size={15} decorative />
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
	description: {paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	list: {paddingBottom: spacing.xxxl},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48},
	rowBody: {flex: 1, gap: 2},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
