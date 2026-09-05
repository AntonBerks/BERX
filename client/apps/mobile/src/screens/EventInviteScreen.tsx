/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.friends() (new — components/OssnApi/v1/friends.php,
 * added this batch specifically because this screen needs it) +
 * api.inviteToEvent() (components/OssnApi/v1/events.php). Only real
 * friends are listed — nobody can be invited who the caller isn't
 * actually connected to; the server re-checks this regardless.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface EventInviteScreenProps {
	api: BerxApiClient;
	guid: number;
	onBack?: () => void;
}

export default function EventInviteScreen(props: EventInviteScreenProps) {
	return (
		<BerxFamilyScene family="EVENTS" testID="event-invite">
			<EventInviteScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function EventInviteScreenBody({api, guid, onBack}: EventInviteScreenProps) {
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [invited, setInvited] = useState<Set<number>>(new Set());
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.friends();
			setFriends(res.friends);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить друзей');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function invite(friendGuid: number) {
		setBusyGuid(friendGuid);
		try {
			await api.inviteToEvent(guid, friendGuid);
			setInvited((prev: Set<number>) => new Set(prev).add(friendGuid));
		} catch (e) {
			// Real server rejection (already going / already invited /
			// event ended) surfaces as-is — never silently marked invited.
			setError(e instanceof Error ? e.message : 'Не удалось отправить приглашение');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && friends.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Пригласить друзей" onBack={onBack} />
			{friends.length === 0 ? (
				<BerxEmptyState title="Друзей пока нет" subtitle="Как только у вас появятся друзья на BERX, вы сможете приглашать их на события." />
			) : (
				<BerxSceneList rows
					data={friends}
					keyExtractor={(f: BerxFriend) => String(f.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxFriend}) => (
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={item.guid}
								name={item.fullname}
								avatarUrl={item.icon}
								trailing={
									invited.has(item.guid) ? (
										<BerxText role="meta" emphasis="tertiary">Приглашён</BerxText>
									) : (
										<BerxButton
											label="Пригласить"
											loading={busyGuid === item.guid}
											onPress={() => invite(item.guid)}
										/>
									)
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
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
});
