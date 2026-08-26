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
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxSession} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

function fmtTime(unix: number | null): string {
	if (!unix) return 'ещё не использовалось';
	return new Date(unix * 1000).toLocaleString('ru-RU');
}

export default function DeviceSessionsScreen({api, onBack}: Props) {
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
				<FlatList
					data={items}
					keyExtractor={(s: BerxSession) => String(s.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxSession}) => (
						<View style={styles.row}>
							<View style={styles.info}>
								<Text style={styles.label}>{item.device_label ?? 'Неизвестное устройство'}</Text>
								<Text style={styles.meta}>Вход: {fmtTime(item.created_at)}</Text>
								<Text style={styles.meta}>Активность: {fmtTime(item.last_used_at)}</Text>
							</View>
							<BerxButton label="Выйти" variant="secondary" loading={busyId === item.id} onPress={() => revoke(item.id)} />
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm},
	info: {flex: 1, gap: 2},
	label: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
