/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.communityModerators/addCommunityModerator/
 * removeCommunityModerator (components/OssnApi/v1/communities.php),
 * backed by the real OssnGroup::isModerator() implementation added
 * this session (a 'group:moderator' relation, checked server-side).
 * Owner/admin only, enforced server-side.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxGroupModerator} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface CommunityModeratorsScreenProps {
	api: BerxApiClient;
	guid: number;
	onBack?: () => void;
}

export default function CommunityModeratorsScreen(props: CommunityModeratorsScreenProps) {
	return (
		<BerxFamilyScene family="COMMUNITY" testID="community-moderators">
			<CommunityModeratorsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CommunityModeratorsScreenBody({api, guid, onBack}: CommunityModeratorsScreenProps) {
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
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={item.guid}
								name={item.fullname}
								avatarUrl={item.icon}
								subtitle="модератор"
								trailing={
									<BerxButton
										label="Снять"
										variant="secondary"
										loading={busyGuid === item.guid}
										onPress={() => remove(item.guid)}
									/>
								}
							/>
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
	list: {padding: spacing.md, gap: spacing.sm},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
});
