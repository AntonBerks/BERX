/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.blockedUsers()/unblockUser() (components/OssnApi/v1/
 * block.php, wraps OssnBlock::getBlocking()/removeBlock() verbatim).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBlockedUser} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';

export interface BlockedUsersScreenProps {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function BlockedUsersScreen(props: BlockedUsersScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="blocked-users">
			<BlockedUsersScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BlockedUsersScreenBody({api, onBack}: BlockedUsersScreenProps) {
	const [items, setItems] = useState<BerxBlockedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.blockedUsers();
			setItems(res.blocked);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить список');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function unblock(guid: number) {
		setBusyGuid(guid);
		try {
			await api.unblockUser(guid);
			setItems((prev: BerxBlockedUser[]) => prev.filter((u: BerxBlockedUser) => u.guid !== guid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось разблокировать');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Заблокированные" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Никого не заблокировано" />
			) : (
				<FlatList
					data={items}
					keyExtractor={(u: BerxBlockedUser) => String(u.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxBlockedUser}) => (
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={item.guid}
								name={item.fullname}
								avatarUrl={item.icon}
								subtitle="заблокирован"
								trailing={
									<BerxButton
										label="Разблокировать"
										variant="secondary"
										loading={busyGuid === item.guid}
										onPress={() => unblock(item.guid)}
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
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
});
