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
			setError(e instanceof Error ? e.message : 'Не удалось загрузить устройства');
		} finally {
			setLoading(false);
		}
	}, [api]);

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

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Устройства и сессии" onBack={onBack} />
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
