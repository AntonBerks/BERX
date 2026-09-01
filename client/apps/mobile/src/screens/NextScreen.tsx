/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX Next — the forward-looking counterpart to LifeGraphScreen (see
 * that screen's own header for the backward-looking one). Real data
 * only: api.next() (components/OssnApi/v1/next.php). Three separate
 * real sections, not one merged feed — a pending Plan/World invite
 * has no real "when" until answered; an Event does. Forcing them into
 * one sorted list would fabricate a false single order.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Pressable, ScrollView, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxNextResponse, BerxNextPlanInvite, BerxNextWorldInvite, BerxNextEvent} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPlan: (id: number) => void;
	onOpenWorld: (id: number) => void;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

export default function NextScreen({api, onOpenPlan, onOpenWorld, onOpenEvent, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [data, setData] = useState<BerxNextResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setData(await api.next());
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error || !data) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	const empty = data.pending_plan_invites.length === 0 && data.pending_world_invites.length === 0 && data.upcoming_events.length === 0;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Дальше" onBack={onBack} />
			{empty ? (
				<BerxEmptyState title="Пока ничего не ждёт ответа" subtitle="Здесь появятся приглашения и ближайшие события." />
			) : (
				<ScrollView
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
				>
					<BerxFadeIn style={styles.body}>
						{data.pending_plan_invites.length > 0 ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Ждут ответа — планы</Text>
								{data.pending_plan_invites.map((invite: BerxNextPlanInvite) => (
									<Pressable key={invite.id} style={styles.row} onPress={() => onOpenPlan(invite.id)}>
										<View style={styles.rowMain}>
											<Text style={styles.rowTitle} numberOfLines={1}>{invite.title}</Text>
											<Text style={styles.rowMeta}>{invite.owner_username ?? `#${invite.owner_guid}`} · {relativeTimeLabel(invite.time_created)}</Text>
										</View>
										<Text style={styles.rowArrow}>→</Text>
									</Pressable>
								))}
							</View>
						) : null}

						{data.pending_world_invites.length > 0 ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Ждут ответа — миры</Text>
								{data.pending_world_invites.map((invite: BerxNextWorldInvite) => (
									<Pressable key={invite.id} style={styles.row} onPress={() => onOpenWorld(invite.id)}>
										<View style={styles.rowMain}>
											<Text style={styles.rowTitle} numberOfLines={1}>{invite.title}</Text>
											<Text style={styles.rowMeta}>{invite.owner_username ?? `#${invite.owner_guid}`} · {relativeTimeLabel(invite.time_created)}</Text>
										</View>
										<Text style={styles.rowArrow}>→</Text>
									</Pressable>
								))}
							</View>
						) : null}

						{data.upcoming_events.length > 0 ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Скоро</Text>
								{data.upcoming_events.map((event: BerxNextEvent) => (
									<Pressable key={event.guid} style={styles.row} onPress={() => onOpenEvent(event.guid)}>
										<View style={styles.rowMain}>
											<Text style={styles.rowTitle} numberOfLines={1}>{event.title}</Text>
											<Text style={styles.rowMeta}>
												{new Date(event.starts * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
												{event.place_title ? ` · ${event.place_title}` : ''}
											</Text>
										</View>
										{event.has_checked_in ? <Text style={styles.rowChip}>отмечен</Text> : <Text style={styles.rowArrow}>→</Text>}
									</Pressable>
								))}
							</View>
						) : null}
					</BerxFadeIn>
				</ScrollView>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.lg, gap: spacing.lg},
	section: {gap: spacing.xs},
	sectionTitle: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	rowMain: {flex: 1, gap: 2},
	rowTitle: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	rowMeta: {color: colors.textDim, fontSize: typography.sizeSm},
	rowArrow: {color: colors.textFaint, fontSize: typography.sizeBase},
	rowChip: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2},
});
