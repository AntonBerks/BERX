/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — Plan detail. Real actions only, all server-verdict-
 * driven (is_owner/my_invite_status/status come from the server, not
 * inferred client-side — see components/OssnApi/v1/plans.php's own
 * ossn_api_plan_json()):
 *   - an invitee with my_invite_status === 'invited' gets real
 *     Accept/Decline buttons (api.respondToPlan);
 *   - the owner gets Cancel (while active) and Convert to Event
 *     (only once a real place AND time exist — the server enforces
 *     this too, this is just not offering a button that would 422);
 *   - a converted plan shows its real created_event_guid as a real
 *     "Open the event" link, not a dead end.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlan} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	id: number;
	onOpenEvent: (guid: number) => void;
	onAddToWorld?: () => void;
	onBack?: () => void;
}

const INVITE_STATUS_LABEL: Record<string, string> = {
	invited: 'Ждём ответа',
	accepted: 'Идёт',
	declined: 'Не идёт',
};

export default function PlanDetailScreen({api, id, onOpenEvent, onAddToWorld, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [plan, setPlan] = useState<BerxPlan | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await api.getPlan(id);
			setPlan(res.plan);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить план');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function respond(accept: boolean) {
		setBusy(true);
		try {
			await api.respondToPlan(id, accept);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось ответить');
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			await api.cancelPlan(id);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось отменить план');
		} finally {
			setBusy(false);
		}
	}

	async function convert() {
		setBusy(true);
		try {
			const res = await api.convertPlanToEvent(id);
			onOpenEvent(res.event_guid);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось превратить план в событие');
		} finally {
			setBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !plan) return <BerxErrorState message={error ?? 'План недоступен'} onRetry={load} />;

	const canConvert = plan.is_owner && plan.status === 'active' && !!plan.place_guid && !!plan.starts_at;

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title={plan.title} onBack={onBack} />
			<BerxFadeIn style={styles.body}>
				<View style={styles.metaRow}>
					<Text style={styles.meta}>
						{plan.starts_at
							? new Date(plan.starts_at * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})
							: 'Время пока не решено'}
					</Text>
					{plan.place_title ? <Text style={styles.meta}>{plan.place_title}</Text> : null}
					<Text style={styles.owner}>Организатор: {plan.owner_username ?? `#${plan.owner_guid}`}</Text>
				</View>

				{plan.notes ? <Text style={styles.notes}>{plan.notes}</Text> : null}

				{plan.status === 'converted' && plan.created_event_guid ? (
					<View style={styles.convertedBanner}>
						<Text style={styles.convertedText}>Этот план стал событием</Text>
						<Pressable onPress={() => onOpenEvent(plan.created_event_guid as number)}>
							<Text style={styles.convertedLink}>Открыть событие →</Text>
						</Pressable>
					</View>
				) : null}
				{plan.status === 'cancelled' ? <Text style={styles.cancelledText}>План отменён</Text> : null}

				{onAddToWorld ? <BerxButton label="В мир" variant="secondary" onPress={onAddToWorld} /> : null}

				<Text style={styles.sectionTitle}>Участники</Text>
				<View style={styles.inviteList}>
					{plan.invites.length === 0 ? (
						<Text style={styles.meta}>Никто пока не приглашён.</Text>
					) : (
						plan.invites.map((invite: BerxPlan['invites'][number]) => (
							<View key={invite.user_guid} style={styles.inviteRow}>
								<BerxAvatar iconUrl={invite.icon} fallbackInitial={(invite.username ?? '#').charAt(0)} size={36} />
								<Text style={styles.inviteName} numberOfLines={1}>{invite.username ?? `#${invite.user_guid}`}</Text>
								<Text style={[styles.inviteStatus, invite.status === 'accepted' && styles.inviteStatusAccepted]}>
									{INVITE_STATUS_LABEL[invite.status]}
								</Text>
							</View>
						))
					)}
				</View>

				{plan.status === 'active' && (plan.my_invite_status === 'invited') ? (
					<View style={styles.actions}>
						<BerxButton label="Не иду" variant="secondary" onPress={() => respond(false)} disabled={busy} />
						<BerxButton label="Иду" onPress={() => respond(true)} disabled={busy} />
					</View>
				) : null}

				{plan.is_owner && plan.status === 'active' ? (
					<View style={styles.ownerActions}>
						{canConvert ? (
							<BerxButton label="Превратить в событие" onPress={convert} loading={busy} fullWidth />
						) : (
							<Text style={styles.hint}>Чтобы превратить план в событие, укажите место и время.</Text>
						)}
						<BerxButton label="Отменить план" variant="secondary" onPress={cancel} disabled={busy} fullWidth />
					</View>
				) : null}
			</BerxFadeIn>
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.lg, gap: spacing.md},
	metaRow: {gap: 2},
	meta: {color: colors.textDim, fontSize: typography.sizeSm},
	owner: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
	notes: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	convertedBanner: {backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, gap: 4},
	convertedText: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	convertedLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	cancelledText: {color: colors.danger, fontSize: typography.sizeSm},
	sectionTitle: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm},
	inviteList: {gap: spacing.sm},
	inviteRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	inviteName: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
	inviteStatus: {color: colors.textFaint, fontSize: typography.sizeXs},
	inviteStatusAccepted: {color: colors.accent, fontWeight: typography.weightMedium},
	actions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm},
	ownerActions: {gap: spacing.sm, marginTop: spacing.md},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
});
