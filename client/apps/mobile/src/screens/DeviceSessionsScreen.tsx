/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.sessions()/revokeSession() (components/OssnApi/v1/
 * me.php), backed by the real ossn_api_tokens table — the same rows
 * a device's own login created. No fake "current session" row: OSSN's
 * PHP session cookie isn't tracked in this table (see the class
 * comment on OssnApiToken::listSessions()), so this list is real API
 * logins only, honestly, not a fabricated "this device" entry.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxSession} from '@berx/api/types';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxListGroup, BerxListRow} from '../../../../packages/design-system/src/spatial/BerxListGroup';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface DeviceSessionsScreenProps {
	api: BerxApiClient;
	onBack?: () => void;
}

function fmtTime(unix: number | null): string {
	if (!unix) return 'ещё не использовалось';
	return new Date(unix * 1000).toLocaleString('ru-RU');
}

export default function DeviceSessionsScreen(props: DeviceSessionsScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="device-sessions">
			<DeviceSessionsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function DeviceSessionsScreenBody({api, onBack}: DeviceSessionsScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [items, setItems] = useState<BerxSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.sessions();
			setItems(res.sessions);
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

	async function revoke(id: number) {
		setBusyId(id);
		try {
			await api.revokeSession(id);
			setItems((prev: BerxSession[]) => prev.filter((s: BerxSession) => s.id !== id));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось завершить сессию');
		} finally {
			setBusyId(null);
		}
	}

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Устройства и сессии" onBack={onBack} />
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
				<BerxEmptyState title="Активных устройств нет" />
			) : (
				<BerxSceneScroll contentContainerStyle={styles.list}>
					{/* one structural group on D2, its sessions as content rows
					    on D3, and the revoke control on D4 where it belongs */}
					<BerxListGroup label={`Активные сессии: ${items.length}`}>
						{items.map((item: BerxSession, i: number) => (
							<BerxListRow
								key={item.id}
								label={item.device_label ?? 'Неизвестное устройство'}
								detail={`Вход: ${fmtTime(item.created_at)} · Активность: ${fmtTime(item.last_used_at)}`}
								last={i === items.length - 1}
								trailing={
									<BerxButton
										label="Выйти"
										variant="secondary"
										loading={busyId === item.id}
										onPress={() => revoke(item.id)}
									/>
								}
							/>
						))}
					</BerxListGroup>
				</BerxSceneScroll>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	list: {padding: spacing.md, gap: spacing.sm},
});
