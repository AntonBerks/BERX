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
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxConfirm} from '../../../../packages/design-system/src/spatial/BerxConfirm';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
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
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [retryable, setRetryable] = useState(true);
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
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different problems,
			   and being offline is a fourth. A 403 or a 404 also stops
			   offering a Retry that cannot work. */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
		} finally {
			setLoading(false);
		}
	}, [api, id, offline]);

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

	/* The way back stays on screen while the scene is loading and after
	   it fails. It used to be inside the branch that only rendered once
	   the data had arrived, so an error left the person on a screen with
	   no exit — the dead end the archive forbids, on a screen reached by
	   a push. The name arrives when the data does. */
	async function removeIt() {
		await api.deleteCollection(id);
		/* only once the server has confirmed it is gone */
		onBack?.();
	}

	const header = <BerxHeader title={collection?.title} onBack={onBack} />;

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error || !collection)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error ?? 'Подборка не найдена'} onRetry={retryable ? load : undefined} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{header}
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

				{/* The owner can take it down. `deleteCollection` is real and
				    ownership-checked on the server, and no screen in BERX
				    called it — you could make one of these and never remove
				    it. */}
				{collection.is_own ? (
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton label="Удалить подборку" variant="danger" onPress={() => setConfirmDelete(true)} fullWidth />
					</BerxActionShelf>
				) : null}

				<BerxConfirm
					visible={confirmDelete}
					title={`Удалить «${collection.title}»?`}
					body="Подборка исчезнет вместе со всем, что вы в неё добавили. Сами места, события и посты останутся."
					confirmLabel="Удалить"
					destructive
					onConfirm={removeIt}
					onCancel={() => setConfirmDelete(false)}
					testID="collection-delete-confirm"
				/>
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
