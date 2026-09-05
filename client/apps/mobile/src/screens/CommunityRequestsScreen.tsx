/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.communityRequests/approveCommunityRequest/
 * declineCommunityRequest (components/OssnApi/v1/communities.php).
 * Server re-checks owner/admin/moderator on every call — this screen
 * being reachable at all doesn't imply the caller can act; a 403
 * still surfaces as a real error if permission was misjudged
 * client-side.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunityRequest} from '@berx/api/types';
import {colors, spacing, radius} from '@berx/design-system/tokens';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface CommunityRequestsScreenProps {
	api: BerxApiClient;
	guid: number;
	onBack?: () => void;
}

export default function CommunityRequestsScreen(props: CommunityRequestsScreenProps) {
	return (
		<BerxFamilyScene family="COMMUNITY" testID="community-requests">
			<CommunityRequestsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CommunityRequestsScreenBody({api, guid, onBack}: CommunityRequestsScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	/* the rule between two entries is the structure plane's own edge:
	   a fixed grey hairline belongs to no plane and does not change
	   with the colour world */
	const dividerColor = useBerxScene().scene.layers.D2.surface.borderColor;
	const [items, setItems] = useState<BerxCommunityRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.communityRequests(guid);
			setItems(res.requests);
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

	async function respond(userGuid: number, approve: boolean) {
		setBusyGuid(userGuid);
		try {
			if (approve) {
				await api.approveCommunityRequest(guid, userGuid);
			} else {
				await api.declineCommunityRequest(guid, userGuid);
			}
			setItems((prev: BerxCommunityRequest[]) => prev.filter((r: BerxCommunityRequest) => r.guid !== userGuid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось обработать заявку');
		} finally {
			setBusyGuid(null);
		}
	}

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Заявки на вступление" onBack={onBack} />
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
				<BerxEmptyState title="Заявок нет" subtitle="Новые заявки на вступление появятся здесь." />
			) : (
				<BerxSceneList rows
					data={items}
					keyExtractor={(r: BerxCommunityRequest) => String(r.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCommunityRequest}) => (
						<View style={[styles.row, {borderBottomColor: dividerColor}]}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<BerxText role="callout" style={styles.name} numberOfLines={1}>{item.fullname}</BerxText>
							<BerxActionShelf variant="anchored">
								<BerxButton label="Принять" loading={busyGuid === item.guid} onPress={() => respond(item.guid, true)} />
								<BerxButton label="Отклонить" variant="secondary" loading={busyGuid === item.guid} onPress={() => respond(item.guid, false)} />
							</BerxActionShelf>
						</View>
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
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1},
	actions: {flexDirection: 'row', gap: spacing.xs},
});
