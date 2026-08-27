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
import {View, Text, FlatList, Image, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunityRequest} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	guid: number;
	onBack?: () => void;
}

export default function CommunityRequestsScreen({api, guid, onBack}: Props) {
	const [items, setItems] = useState<BerxCommunityRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.communityRequests(guid);
			setItems(res.requests);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить заявки');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, guid]);

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

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Заявки на вступление" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Заявок нет" subtitle="Новые заявки на вступление появятся здесь." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(r: BerxCommunityRequest) => String(r.guid)}
						contentContainerStyle={styles.list}
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
						renderItem={({item}: {item: BerxCommunityRequest}) => (
							<View style={styles.row}>
								<Image source={{uri: item.icon}} style={styles.avatar} />
								<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
								<View style={styles.actions}>
									<BerxButton label="Принять" loading={busyGuid === item.guid} onPress={() => respond(item.guid, true)} />
									<BerxButton label="Отклонить" variant="secondary" loading={busyGuid === item.guid} onPress={() => respond(item.guid, false)} />
								</View>
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	actions: {flexDirection: 'row', gap: spacing.xs},
});
