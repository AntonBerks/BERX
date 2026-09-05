/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.collections()/addCollectionItem() (components/OssnApi/
 * v1/collections.php). One reusable screen for adding any item type
 * (place/event/post) to any of the caller's own collections — shown
 * as a picker, not duplicated per source screen.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollection, BerxCollectionItemType} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface AddToCollectionScreenProps {
	api: BerxApiClient;
	myGuid: number;
	itemType: BerxCollectionItemType;
	itemGuid: number;
	onCreateCollection: () => void;
	onDone: () => void;
	onBack?: () => void;
}

export default function AddToCollectionScreen(props: AddToCollectionScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" atmosphereKind="location" testID="add-to-collection">
			<AddToCollectionScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function AddToCollectionScreenBody({api, myGuid, itemType, itemGuid, onCreateCollection, onDone, onBack}: AddToCollectionScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	/* the scene's own accent: the token is one colour in every colour
	   world, and a mark that ignores the room it stands in is exactly
	   the flattening the Color World system exists to prevent */
	const accent = useBerxScene().scene.accent;
	const [items, setItems] = useState<BerxCollection[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.collections(myGuid);
			setItems(res.collections);
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
	}, [api, myGuid, offline]);

	useEffect(() => {
		load();
	}, [load]);

	async function addTo(collectionId: number) {
		setBusyId(collectionId);
		try {
			await api.addCollectionItem(collectionId, itemType, itemGuid);
			setAddedIds((prev: Set<number>) => new Set(prev).add(collectionId));
		} catch {
			// real "already_added"/"item_not_found" errors surface as a
			// no-op here — the picker stays open rather than pretending
			// success on a genuine server rejection
		} finally {
			setBusyId(null);
		}
	}

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Добавить в подборку" onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{header}
			<View style={styles.toolbar}>
				<BerxButton label="Новая подборка" variant="secondary" onPress={onCreateCollection} fullWidth />
			</View>
			{items.length === 0 ? (
				<BerxEmptyState title="Подборок пока нет" subtitle="Создайте первую, чтобы сохранить это." />
			) : (
				<BerxSceneList rows
					data={items}
					keyExtractor={(c: BerxCollection) => String(c.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCollection}) => {
						const added = addedIds.has(item.id);
						return (
							<BerxSpatialCard
								depth="D3"
								padding={spacing.md}
								radius={18}
								disabled={added}
								onPress={() => addTo(item.id)}
								accessibilityLabel={added ? `${item.title}, уже добавлено` : `Добавить в ${item.title}`}>
								<View style={styles.row}>
									<BerxText role="callout">{item.title}</BerxText>
									<Text style={added ? styles.added : busyId === item.id ? styles.busy : [styles.action, {color: accent}]}>
										{added ? 'Добавлено' : busyId === item.id ? '...' : 'Добавить'}
									</Text>
								</View>
							</BerxSpatialCard>
						);
					}}
				/>
			)}
			<View style={styles.footer}>
				<BerxButton label="Готово" onPress={onDone} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	toolbar: {padding: spacing.md},
	list: {paddingHorizontal: spacing.md, gap: spacing.sm},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, marginBottom: spacing.sm},
	action: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	busy: {fontSize: typography.sizeSm, color: colors.textFaint},
	added: {fontSize: typography.sizeSm, color: colors.textFaint},
	footer: {padding: spacing.md},
});
