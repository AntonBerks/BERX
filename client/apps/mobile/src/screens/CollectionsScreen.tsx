/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.collections() (components/OssnApi/v1/collections.php,
 * new domain this session — real MySQL tables, real server-side
 * authorization). Someone else's collections show only what's marked
 * public — enforced in the SQL query server-side, not filtered here.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollection} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxCollectionCard} from '../../../../packages/design-system/src/spatial/BerxCollectionCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

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

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Подборки" onBack={onBack} />
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Создать подборку" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Подборок пока нет" subtitle={isOwn ? 'Соберите места, события и посты в одну подборку.' : undefined} />
			) : (
				<FlatList
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
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm},
	rowBody: {gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
