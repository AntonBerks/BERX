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
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxUnvalidatedUser} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

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
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
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
	}, [api, offline]);

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

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Неподтверждённые пользователи" onBack={onBack} />
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
				<BerxEmptyState title="Все пользователи подтверждены" />
			) : (
				<BerxSceneList rows
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
	list: {paddingBottom: spacing.xxxl},
	info: {flex: 1, gap: 2},
	name: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
