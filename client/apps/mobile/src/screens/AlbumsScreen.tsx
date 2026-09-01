/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.userAlbums() (components/OssnApi/v1/albums.php,
 * wraps OssnAlbums::GetAlbums() verbatim).
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAlbum} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	userGuid: number;
	isOwn: boolean;
	onOpenAlbum: (guid: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

export default function AlbumsScreen({api, userGuid, isOwn, onOpenAlbum, onCreate, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxAlbum[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
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
			setRefreshing(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Альбомы" onBack={onBack} />
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Создать альбом" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Альбомов пока нет" subtitle={isOwn ? 'Создайте первый альбом.' : undefined} />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(a: BerxAlbum) => String(a.guid)}
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
						renderItem={({item}: {item: BerxAlbum}) => (
							<Pressable style={styles.card} onPress={() => onOpenAlbum(item.guid)}>
								<View style={styles.cardMedia}>
									<Text style={styles.cardInitial}>{item.title.charAt(0).toUpperCase()}</Text>
								</View>
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
	toolbar: {padding: spacing.md},
	grid: {padding: spacing.sm},
	fadeFlex: {flex: 1},
	card: {flex: 1, margin: spacing.xs, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface},
	cardMedia: {width: '100%', aspectRatio: 1, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	cardInitial: {fontSize: typography.sizeXl, color: colors.textFaint},
	cardTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium, padding: spacing.sm},
});
