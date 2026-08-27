/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.blockedUsers()/unblockUser() (components/OssnApi/v1/
 * block.php, wraps OssnBlock::getBlocking()/removeBlock() verbatim).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBlockedUser} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function BlockedUsersScreen({api, onBack}: Props) {
	const [items, setItems] = useState<BerxBlockedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
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
			setRefreshing(false);
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
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(u: BerxBlockedUser) => String(u.guid)}
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
						renderItem={({item}: {item: BerxBlockedUser}) => (
							<View style={styles.row}>
								<Image source={{uri: item.icon}} style={styles.avatar} />
								<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
								<BerxButton label="Разблокировать" variant="secondary" loading={busyGuid === item.guid} onPress={() => unblock(item.guid)} />
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
});
