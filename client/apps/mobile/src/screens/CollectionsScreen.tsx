/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.collections() (components/OssnApi/v1/collections.php,
 * new domain this session — real MySQL tables, real server-side
 * authorization). Someone else's collections show only what's marked
 * public — enforced in the SQL query server-side, not filtered here.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollection} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxCollectionCard} from '../../../../packages/design-system/src/spatial/BerxCollectionCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxIconButton} from '../../../../packages/design-system/src/icons';

export interface CollectionsScreenProps {
	api: BerxApiClient;
	userGuid?: number;
	isOwn: boolean;
	onOpenCollection: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

export default function CollectionsScreen(props: CollectionsScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" atmosphereKind="location" testID="collections">
			<CollectionsSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function CollectionsSceneBody({api, userGuid, isOwn, onOpenCollection, onCreate, onBack}: CollectionsScreenProps) {
	const [items, setItems] = useState<BerxCollection[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.collections(userGuid);
			setItems(res.collections);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить подборки');
		} finally {
			setLoading(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader
			title="Подборки" onBack={onBack}
			actions={isOwn ? <BerxIconButton name="plus" accessibilityLabel="Создать подборку" onPress={onCreate} /> : undefined}
		/>
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
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{/* one creation control, on the control plane beside the scene's
			    name — a full-width button across the top of a list is a
			    banner, and it pushed the first real object off the fold */}
			{header}
			{items.length === 0 ? (
				<BerxEmptyState title="Подборок пока нет" subtitle={isOwn ? 'Соберите места, события и посты в одну подборку.' : undefined} />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(c: BerxCollection) => String(c.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCollection}) => (
						<BerxCollectionCard
							collectionGuid={item.id}
							title={item.title}
							itemCount={item.item_count}
							/* real visibility, shown because a user who cannot tell
							   will eventually share something they meant to keep */
							visibility={item.visibility}
							onPress={() => onOpenCollection(item.id)}
						/>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	list: {paddingBottom: spacing.xxxl},
	rowBody: {gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
