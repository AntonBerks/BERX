/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.communityModerators/addCommunityModerator/
 * removeCommunityModerator (components/OssnApi/v1/communities.php),
 * backed by the real OssnGroup::isModerator() implementation added
 * this session (a 'group:moderator' relation, checked server-side).
 * Owner/admin only, enforced server-side.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxGroupModerator} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

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
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
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
	}, [api, guid, offline]);

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

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Модераторы" onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error && items.length === 0)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{header}
			{items.length === 0 ? (
				<BerxEmptyState title="Модераторов нет" subtitle="Назначьте модератора из списка участников сообщества." />
			) : (
				<BerxSceneList rows
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
	list: {paddingBottom: spacing.xxxl},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
});
