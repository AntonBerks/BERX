/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.myPlaceClaims() (components/OssnApi/v1/business.php).
 * Own claim history only — was always a real, working client method
 * with zero UI caller.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceClaim, BerxClaimStatus} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

const STATUS_LABEL: Record<BerxClaimStatus, string> = {
	pending: 'На рассмотрении',
	approved: 'Одобрена',
	rejected: 'Отклонена',
};

export default function MyPlaceClaimsScreen({api, onOpenPlace, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxPlaceClaim[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.myPlaceClaims();
			setItems(res.claims);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить заявки');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Мои заявки на бизнес" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Заявок нет" subtitle="Заявите права на место со страницы места, если это ваш бизнес." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(c: BerxPlaceClaim) => String(c.id)}
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
						renderItem={({item}: {item: BerxPlaceClaim}) => (
							<Pressable style={styles.card} onPress={() => onOpenPlace(item.place_guid)}>
								<Text style={styles.target}>Место #{item.place_guid}</Text>
								<Text style={[styles.status, item.status === 'approved' && styles.statusApproved, item.status === 'rejected' && styles.statusRejected]}>
									{STATUS_LABEL[item.status]}
								</Text>
								{item.message ? <Text style={styles.note}>{item.message}</Text> : null}
								<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
							</Pressable>
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
	card: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4, marginBottom: spacing.sm},
	target: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	status: {fontSize: typography.sizeSm, color: colors.textFaint, fontWeight: typography.weightMedium},
	statusApproved: {color: colors.accent},
	statusRejected: {color: colors.danger},
	note: {fontSize: typography.sizeSm, color: colors.textDim},
	time: {fontSize: typography.sizeXs, color: colors.textFaint},
});
