/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.communityModerators/addCommunityModerator/
 * removeCommunityModerator (components/OssnApi/v1/communities.php),
 * backed by the real OssnGroup::isModerator() implementation added
 * this session (a 'group:moderator' relation, checked server-side).
 * Owner/admin only, enforced server-side.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxGroupModerator} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	guid: number;
	onBack?: () => void;
}

export default function CommunityModeratorsScreen({api, guid, onBack}: Props) {
	const [items, setItems] = useState<BerxGroupModerator[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.communityModerators(guid);
			setItems(res.moderators);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить список модераторов');
		} finally {
			setLoading(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	async function remove(userGuid: number) {
		setBusyGuid(userGuid);
		try {
			await api.removeCommunityModerator(guid, userGuid);
			setItems((prev: BerxGroupModerator[]) => prev.filter((m: BerxGroupModerator) => m.guid !== userGuid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось снять права модератора');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Модераторы" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Модераторов нет" subtitle="Назначьте модератора из списка участников сообщества." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(m: BerxGroupModerator) => String(m.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxGroupModerator}) => (
						<View style={styles.row}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
							<BerxButton label="Снять" variant="secondary" loading={busyGuid === item.guid} onPress={() => remove(item.guid)} />
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
});
