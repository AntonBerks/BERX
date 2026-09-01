/**
 * BERX WORLD — real feed Mute management. Real data: api.mutedUsers()/
 * unmuteUser() (components/OssnApi/v1/mute.php). Same real shape as
 * BlockedUsersScreen.tsx, deliberately kept a separate screen — muting
 * someone never touches the friendship, messaging, or their visibility
 * of your profile, only what shows in YOUR OWN feed, so it belongs in
 * its own list rather than folded into Blocked.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMutedUser} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function MutedUsersScreen({api, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxMutedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.mutedUsers();
			setItems(res.muted);
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

	async function unmute(guid: number) {
		setBusyGuid(guid);
		try {
			await api.unmuteUser(guid);
			setItems((prev: BerxMutedUser[]) => prev.filter((u: BerxMutedUser) => u.guid !== guid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось убрать из заглушённых');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Заглушённые" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Никто не заглушён" subtitle="Заглушённые пользователи остаются вашими друзьями — просто их посты не показываются в ленте." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(u: BerxMutedUser) => String(u.guid)}
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
						renderItem={({item}: {item: BerxMutedUser}) => (
							<View style={styles.row}>
								<Image source={{uri: item.icon}} style={styles.avatar} />
								<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
								<BerxButton label="Убрать" variant="secondary" loading={busyGuid === item.guid} onPress={() => unmute(item.guid)} />
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
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
});
