/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.unvalidatedUsers()/validateUsers() (components/
 * OssnApi/v1/admin.php). Server re-checks ossn_isAdminLoggedin() on
 * every call — reachability of this screen doesn't imply the caller
 * can act.
 *
 * BERX WORLD MAX BUILD — real search box added: the underlying
 * getUnvalidatedUSERS($search) SQL-injection primitive that made this
 * screen deliberately withhold a search parameter is now fixed server-
 * side (OssnUser::getUnvalidatedUSERS() delegates to searchUsers()'s
 * already-safe, parameterized 'keyword' path instead of hand-building
 * raw SQL), so the restriction this screen previously documented no
 * longer applies.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxUnvalidatedUser} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function AdminUnvalidatedScreen({api, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxUnvalidatedUser[]>([]);
	const [q, setQ] = useState('');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.unvalidatedUsers(q || undefined);
			setItems(res.users);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить список');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, q]);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

	return (
		<View style={styles.screen}>
			<BerxHeader title="Неподтверждённые пользователи" onBack={onBack} />
			<View style={styles.searchRow}>
				<View style={styles.searchInput}>
					<BerxInput placeholder="Поиск по имени, логину, email" value={q} onChangeText={setQ} onSubmitEditing={load} autoCapitalize="none" />
				</View>
				<BerxButton label="Найти" loading={loading} onPress={load} />
			</View>
			{loading ? (
				<BerxLoadingState />
			) : error && items.length === 0 ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title={q ? 'Никого не найдено' : 'Все пользователи подтверждены'} />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(u: BerxUnvalidatedUser) => String(u.guid)}
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
						renderItem={({item}: {item: BerxUnvalidatedUser}) => (
							<View style={styles.row}>
								<View style={styles.info}>
									<Text style={styles.name} numberOfLines={1}>{item.fullname || item.username}</Text>
									<Text style={styles.meta}>{item.email}</Text>
								</View>
								<BerxButton label="Подтвердить" loading={busyGuid === item.guid} onPress={() => validate(item.guid)} />
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	searchRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	searchInput: {flex: 1},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm},
	info: {flex: 1, gap: 2},
	name: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
