/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.reportQueue()/resolveReport()/deleteReportedContent()
 * (components/OssnApi/v1/report.php). Server re-checks
 * ossn_api_is_admin($api_user_guid) on every call — reachability of
 * this screen doesn't imply the caller can act.
 *
 * MAX BUILD — closes two real gaps found together: (1) this screen
 * never existed, so submitted reports had no real way to ever be
 * reviewed from the app; (2) the admin gate itself was silently
 * broken (report.php/admin.php called ossn_isAdminLoggedin(), which
 * needs $_SESSION populated — never true for a bearer-token API
 * request — so every real admin request 403'd regardless of who was
 * calling; fixed to ossn_api_is_admin($api_user_guid), a real
 * guid-scoped DB lookup).
 *
 * "Удалить контент" is only offered for post/comment/group reports —
 * report.php itself returns a real 501 for user/dating_profile (no
 * removal mechanism exists for those target types), shown honestly
 * rather than offering a button that would always fail.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxReportQueueItem} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

const REASON_LABELS: Record<string, string> = {
	spam: 'Спам',
	fake_profile: 'Фейковый профиль',
	harassment: 'Домогательства',
	inappropriate_content: 'Неприемлемый контент',
	underage: 'Несовершеннолетний',
	other: 'Другое',
};

const TARGET_LABELS: Record<string, string> = {
	dating_profile: 'Анкета знакомств',
	post: 'Пост',
	comment: 'Комментарий',
	user: 'Пользователь',
	group: 'Сообщество',
};

const REMOVABLE_TYPES = new Set(['post', 'comment', 'group']);

export default function AdminReportsScreen({api, onBack}: Props) {
	const [items, setItems] = useState<BerxReportQueueItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.reportQueue();
			setItems(res.reports);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить жалобы');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleResolve(id: number, status: 'reviewed' | 'dismissed') {
		setBusyId(id);
		try {
			await api.resolveReport(id, status);
			setItems((prev: BerxReportQueueItem[]) => prev.filter((r) => r.id !== id));
		} catch {
			// real server rejection — item stays in the queue, nothing optimistic
		} finally {
			setBusyId(null);
		}
	}

	async function handleDeleteContent(id: number) {
		setBusyId(id);
		try {
			await api.deleteReportedContent(id);
			setItems((prev: BerxReportQueueItem[]) => prev.filter((r) => r.id !== id));
		} catch {
			// real server rejection (e.g. content already gone) — item stays in the queue
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Жалобы" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Жалоб нет" subtitle="Все поданные жалобы рассмотрены." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(r: BerxReportQueueItem) => String(r.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxReportQueueItem}) => (
						<View style={styles.card}>
							<Text style={styles.target}>{TARGET_LABELS[item.target_type] ?? item.target_type} #{item.target_guid}</Text>
							<Text style={styles.reason}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
							{item.note ? <Text style={styles.note}>{item.note}</Text> : null}
							<Text style={styles.time}>{relativeTimeLabel(item.time_created)}</Text>
							<View style={styles.actions}>
								{REMOVABLE_TYPES.has(item.target_type) ? (
									<BerxButton label="Удалить контент" variant="danger" loading={busyId === item.id} onPress={() => handleDeleteContent(item.id)} />
								) : null}
								<BerxButton label="Отклонить" variant="secondary" loading={busyId === item.id} onPress={() => handleResolve(item.id, 'dismissed')} />
								<BerxButton label="Принято" loading={busyId === item.id} onPress={() => handleResolve(item.id, 'reviewed')} />
							</View>
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
	card: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4, marginBottom: spacing.sm},
	target: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	reason: {fontSize: typography.sizeSm, color: colors.accent},
	note: {fontSize: typography.sizeSm, color: colors.textDim},
	time: {fontSize: typography.sizeXs, color: colors.textFaint},
	actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm},
});
