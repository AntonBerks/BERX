/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — Plans. A genuinely new BERX object, not a redesign of
 * an existing screen — see classes/OssnPlans.php's own header for the
 * full domain rationale. Real data only: api.myPlans() (GET
 * /plans/mine) merges plans the caller owns with plans they're
 * invited to, real per-invitee RSVP state.
 *
 * Deliberately a DIFFERENT visual grammar from Places/Events/
 * Communities discovery (BerxScrimHero full-bleed photo tiles): a
 * Plan is about PEOPLE and STATUS, not imagery — most plans have no
 * photo at all (no cover_url concept exists for a Plan), so a
 * chronological status list with a real invitee-avatar cluster is the
 * honest presentation, not a photo grid with fallback initials
 * everywhere. Directive: different object types get different visual
 * grammars, not one template repeated everywhere.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlan} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlan: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

const STATUS_LABEL: Record<BerxPlan['status'], string> = {
	active: 'Активен',
	cancelled: 'Отменён',
	converted: 'Стал событием',
};

function planTimeLabel(plan: BerxPlan): string {
	if (plan.starts_at) {
		return new Date(plan.starts_at * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
	}
	return 'Время пока не решено';
}

export default function PlansScreen({api, onOpenPlan, onCreate, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxPlan[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.myPlans();
			setItems(res.plans);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить планы');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Планы" />
			<View style={styles.toolbar}>
				<Text style={styles.hint}>Люди · время · место — до того, как это стало событием.</Text>
				<BerxButton label="Новый план" onPress={onCreate} />
			</View>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Пока нет планов" subtitle="Предложите что-нибудь друзьям — время и место можно решить позже." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(p: BerxPlan) => String(p.id)}
						contentContainerStyle={styles.list}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
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
						renderItem={({item}: {item: BerxPlan}) => {
							const accepted = item.invites.filter((i) => i.status === 'accepted').length;
							const pending = item.invites.filter((i) => i.status === 'invited').length;
							return (
								<Pressable style={styles.row} onPress={() => onOpenPlan(item.id)}>
									<View style={styles.rowMain}>
										<Text style={styles.title} numberOfLines={1}>{item.title}</Text>
										<Text style={styles.meta} numberOfLines={1}>
											{planTimeLabel(item)}
											{item.place_title ? ` · ${item.place_title}` : ''}
										</Text>
										<View style={styles.statusRow}>
											<View style={[styles.statusDot, item.status === 'active' && styles.statusDotActive, item.status === 'converted' && styles.statusDotConverted]} />
											<Text style={styles.statusText}>
												{STATUS_LABEL[item.status]}
												{item.status === 'active' ? ` · ${accepted} готовы${pending > 0 ? `, ${pending} ждём` : ''}` : ''}
											</Text>
										</View>
									</View>
									<View style={styles.avatarCluster}>
										{item.invites.slice(0, 4).map((invite, i) => (
											<View key={invite.user_guid} style={[styles.avatarClusterItem, {marginLeft: i === 0 ? 0 : -12, zIndex: 10 - i}]}>
												<BerxAvatar iconUrl={invite.icon} fallbackInitial={(invite.username ?? '#').charAt(0)} size={28} />
											</View>
										))}
									</View>
								</Pressable>
							);
						}}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	toolbar: {paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs},
	fadeFlex: {flex: 1},
	list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
	separator: {height: 1, backgroundColor: colors.borderSoft},
	row: {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md},
	rowMain: {flex: 1, gap: 3},
	title: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	meta: {color: colors.textDim, fontSize: typography.sizeSm},
	statusRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2},
	statusDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint},
	statusDotActive: {backgroundColor: colors.accent},
	statusDotConverted: {backgroundColor: colors.success},
	statusText: {color: colors.textFaint, fontSize: typography.sizeXs},
	avatarCluster: {flexDirection: 'row', alignItems: 'center'},
	avatarClusterItem: {borderRadius: radius.pill, borderWidth: 2, borderColor: colors.black},
});
