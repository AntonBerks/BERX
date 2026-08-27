/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.pendingPlaceClaims()/approvePlaceClaim()/
 * rejectPlaceClaim() (components/OssnApi/v1/business.php). Server
 * re-checks ossn_api_is_admin($api_user_guid) on every call —
 * reachability of this screen doesn't imply the caller can act.
 *
 * MAX BUILD — closes a real, significant gap found in the zero-UI-
 * caller sweep: these three were always real, working client methods
 * with zero UI caller — a business owner could submit a claim (once
 * submitPlaceClaim() gets a real caller too, see PlaceDetailScreen)
 * but it could never actually be reviewed from the app. Approval's
 * real effect: OssnBusiness::reviewClaim() reassigns the place's
 * actual owner_guid to the requester — this isn't a status flag, it's
 * a real ownership transfer, confirmed by reading reviewClaim()
 * directly before building this screen.
 *
 * Also found and fixed in the same investigation (separate commit):
 * reviewClaim() itself called ossn_isAdminLoggedin(), which needs
 * $_SESSION populated — never true for a bearer-token API request —
 * so approve/reject 403'd for every caller, admin included, until
 * fixed to ossn_api_is_admin($adminGuid).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceClaim} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenPlace?: (guid: number) => void;
	onBack?: () => void;
}

export default function AdminPlaceClaimsScreen({api, onOpenPlace, onBack}: Props) {
	const [items, setItems] = useState<BerxPlaceClaim[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.pendingPlaceClaims();
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

	async function handleApprove(id: number) {
		setBusyId(id);
		try {
			await api.approvePlaceClaim(id);
			setItems((prev: BerxPlaceClaim[]) => prev.filter((c: BerxPlaceClaim) => c.id !== id));
		} catch {
			// real server rejection — item stays in the queue, nothing optimistic
		} finally {
			setBusyId(null);
		}
	}

	async function handleReject(id: number) {
		setBusyId(id);
		try {
			await api.rejectPlaceClaim(id);
			setItems((prev: BerxPlaceClaim[]) => prev.filter((c: BerxPlaceClaim) => c.id !== id));
		} catch {
			// real server rejection — item stays in the queue
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Заявки на бизнес" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Заявок нет" subtitle="Все поданные заявки на владение местами рассмотрены." />
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
							<View style={styles.card}>
								<Text style={styles.target} onPress={onOpenPlace ? () => onOpenPlace(item.place_guid) : undefined}>
									Место #{item.place_guid}
								</Text>
								<Text style={styles.meta}>От пользователя #{item.requester_guid}</Text>
								{item.message ? <Text style={styles.note}>{item.message}</Text> : null}
								<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
								<View style={styles.actions}>
									<BerxButton label="Отклонить" variant="secondary" loading={busyId === item.id} onPress={() => handleReject(item.id)} />
									<BerxButton label="Одобрить" loading={busyId === item.id} onPress={() => handleApprove(item.id)} />
								</View>
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
	card: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4, marginBottom: spacing.sm},
	target: {fontSize: typography.sizeBase, color: colors.accent, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeSm, color: colors.textDim},
	note: {fontSize: typography.sizeSm, color: colors.textDim},
	time: {fontSize: typography.sizeXs, color: colors.textFaint},
	actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm},
});
