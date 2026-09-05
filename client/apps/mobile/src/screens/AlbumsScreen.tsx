/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.userAlbums() (components/OssnApi/v1/albums.php,
 * wraps OssnAlbums::GetAlbums() verbatim).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAlbum} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxObjectCard} from '../../../../packages/design-system/src/spatial/BerxObjectCard';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxIconButton} from '../../../../packages/design-system/src/icons';

export interface AlbumsScreenProps {
	api: BerxApiClient;
	userGuid: number;
	isOwn: boolean;
	onOpenAlbum: (guid: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

export default function AlbumsScreen(props: AlbumsScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="immersive" testID="albums">
			<AlbumsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function AlbumsScreenBody({api, userGuid, isOwn, onOpenAlbum, onCreate, onBack}: AlbumsScreenProps) {
	const [items, setItems] = useState<BerxAlbum[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.userAlbums(userGuid);
			setItems(res.albums);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить альбомы');
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
			title="Альбомы" onBack={onBack}
			actions={isOwn ? <BerxIconButton name="plus" accessibilityLabel="Создать альбом" onPress={onCreate} /> : undefined}
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
				<BerxEmptyState title="Альбомов пока нет" subtitle={isOwn ? 'Создайте первый альбом.' : undefined} />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(a: BerxAlbum) => String(a.guid)}
					contentContainerStyle={styles.list}
					removeClippedSubviews
					renderItem={({item}: {item: BerxAlbum}) => (
						<BerxObjectCard title={item.title} onPress={() => onOpenAlbum(item.guid)} />
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
	cardMedia: {width: '100%', aspectRatio: 1, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	cardInitial: {fontSize: typography.sizeXl, color: colors.textFaint},
	cardTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium, padding: spacing.sm},
});
