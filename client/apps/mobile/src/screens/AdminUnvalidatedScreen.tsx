/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.unvalidatedUsers()/validateUsers() (components/
 * OssnApi/v1/admin.php). Server re-checks ossn_isAdminLoggedin() on
 * every call — reachability of this screen doesn't imply the caller
 * can act. Deliberately no search field: the underlying
 * getUnvalidatedUSERS($search) has a real, disclosed SQL-injection
 * bug in core (see admin.php's header comment) — this screen never
 * forwards a search parameter, matching the API's own restriction.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxUnvalidatedUser} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface AdminUnvalidatedScreenProps {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function AdminUnvalidatedScreen(props: AdminUnvalidatedScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="admin-unvalidated">
			<AdminUnvalidatedScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function AdminUnvalidatedScreenBody({api, onBack}: AdminUnvalidatedScreenProps) {
	const [items, setItems] = useState<BerxUnvalidatedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.unvalidatedUsers();
			setItems(res.users);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить список');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function validate(guid: number) {
		setBusyGuid(guid);
		try {
			await api.validateUsers([guid]);
			setItems((prev: BerxUnvalidatedUser[]) => prev.filter((u: BerxUnvalidatedUser) => u.guid !== guid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось подтвердить пользователя');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Неподтверждённые пользователи" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Все пользователи подтверждены" />
			) : (
				<FlatList
					data={items}
					keyExtractor={(u: BerxUnvalidatedUser) => String(u.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxUnvalidatedUser}) => (
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={item.guid}
								name={item.fullname || item.username}
								handle={item.username}
								subtitle={item.email}
								trailing={
									<BerxButton
										label="Подтвердить"
										loading={busyGuid === item.guid}
										onPress={() => validate(item.guid)}
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
	info: {flex: 1, gap: 2},
	name: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
