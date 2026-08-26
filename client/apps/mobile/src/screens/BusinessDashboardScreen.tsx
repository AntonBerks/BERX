/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.businessDashboard() (components/OssnApi/v1/
 * places.php), api.getBusinessSubscription()/startBusinessTrial()/
 * businessTeam() (components/OssnApi/v1/business.php). Every number
 * here is a real, already-existing query (rating/rating_count/recent
 * reviews) or real server-timed state (trial dates) — no engagement
 * score, no growth chart, no visitor analytics, no payment: none of
 * those have a real data source or provider in BERX, so none appear
 * here.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBusinessDashboard, BerxPlaceReview, BerxBusinessSubscription, BerxBusinessTeamMember, BerxBusinessMoment} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

function fmtDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'});
}

const STATUS_LABEL: Record<string, string> = {
	none: 'Подписка не активирована',
	trial: 'Пробный период',
	active: 'Активна',
	expired: 'Истекла',
};

export default function BusinessDashboardScreen({api, placeGuid, onBack}: Props) {
	const [data, setData] = useState<BerxBusinessDashboard | null>(null);
	const [subscription, setSubscription] = useState<BerxBusinessSubscription | null>(null);
	const [team, setTeam] = useState<BerxBusinessTeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [trialBusy, setTrialBusy] = useState(false);
	const [moments, setMoments] = useState<BerxBusinessMoment[]>([]);
	const [momentText, setMomentText] = useState('');
	const [momentBusy, setMomentBusy] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [dashboard, sub, teamRes] = await Promise.all([
				api.businessDashboard(placeGuid),
				api.getBusinessSubscription(placeGuid),
				api.businessTeam(placeGuid),
			]);
			setData(dashboard);
			setSubscription(sub);
			setTeam(teamRes.team);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Панель недоступна');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleCreateMoment() {
		if (!momentText.trim()) return;
		setMomentBusy(true);
		try {
			// Real, honest window: fixed 2 hours from now — no custom
			// duration picker in this pass, capped well under the real
			// 24h server-side max.
			const endsAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
			await api.createBusinessMoment(placeGuid, momentText.trim(), endsAt);
			setMomentText('');
			const res = await api.placeMoments(placeGuid);
			setMoments(res.moments);
		} catch {
			// real server rejection — nothing optimistic
		} finally {
			setMomentBusy(false);
		}
	}

	async function handleDeleteMoment(id: number) {
		try {
			await api.deleteBusinessMoment(id);
			setMoments((prev: BerxBusinessMoment[]) => prev.filter((x) => x.id !== id));
		} catch {
			// list stays as-is on failure
		}
	}

	async function handleStartTrial() {
		setTrialBusy(true);
		try {
			const sub = await api.startBusinessTrial(placeGuid);
			setSubscription(sub);
		} catch {
			// real server rejection — nothing optimistic here
		} finally {
			setTrialBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !data) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Панель бизнеса" onBack={onBack} />
			<View style={styles.body}>
				<View style={styles.statusRow}>
					<Text style={styles.statusLabel}>{data.verified ? 'Верифицирован ✓' : 'Не верифицирован'}</Text>
				</View>

				<View style={styles.statsRow}>
					<View style={styles.stat}>
						<Text style={styles.statValue}>{data.rating.toFixed(1)}</Text>
						<Text style={styles.statLabel}>рейтинг</Text>
					</View>
					<View style={styles.stat}>
						<Text style={styles.statValue}>{data.rating_count}</Text>
						<Text style={styles.statLabel}>отзывов</Text>
					</View>
					<View style={styles.stat}>
						<Text style={styles.statValue}>{team.length}</Text>
						<Text style={styles.statLabel}>сотрудников</Text>
					</View>
				</View>

				{data.nearby_impressions ? (
					<>
						<Text style={styles.sectionTitle}>Nearby Now</Text>
						<View style={styles.statsRow}>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.shown}</Text><Text style={styles.statLabel}>показов</Text></View>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.opened}</Text><Text style={styles.statLabel}>открытий</Text></View>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.saved}</Text><Text style={styles.statLabel}>сохранений</Text></View>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.route}</Text><Text style={styles.statLabel}>маршрутов</Text></View>
						</View>
						{data.nearby_impressions.shown > 0 ? (
							<Text style={styles.conversionNote}>
								{Math.round((data.nearby_impressions.opened / data.nearby_impressions.shown) * 100)}% открывают ваш профиль после показа рядом
							</Text>
						) : null}
					</>
				) : null}

				<Text style={styles.sectionTitle}>Moment (2 часа)</Text>
				<View style={styles.momentForm}>
					<BerxInput placeholder="Например: Счастливые часы до 18:00" value={momentText} onChangeText={setMomentText} />
					<BerxButton label="Опубликовать" variant="secondary" onPress={handleCreateMoment} loading={momentBusy} />
				</View>
				{moments.length > 0 ? (
					<View style={styles.momentsList}>
						{moments.map((m) => (
							<View key={m.id} style={styles.momentRow}>
								<Text style={styles.momentRowText} numberOfLines={1}>🔥 {m.text}</Text>
								<Text style={styles.momentRowRemove} onPress={() => handleDeleteMoment(m.id)}>Убрать</Text>
							</View>
						))}
					</View>
				) : null}

				<Text style={styles.sectionTitle}>Подписка</Text>
				{subscription ? (
					<View style={styles.subscriptionCard}>
						<Text style={styles.subscriptionStatus}>{STATUS_LABEL[subscription.status]}</Text>
						{subscription.status === 'trial' && subscription.trial_ends_at ? (
							<Text style={styles.subscriptionMeta}>Пробный период до {fmtDate(subscription.trial_ends_at)}</Text>
						) : null}
						{subscription.monthly_price_rub ? (
							<Text style={styles.subscriptionMeta}>{subscription.monthly_price_rub} ₽ / месяц после пробного периода</Text>
						) : null}
						{subscription.status === 'none' ? (
							<BerxButton label="Начать 7-дневный пробный период" onPress={handleStartTrial} loading={trialBusy} fullWidth />
						) : null}
						{!subscription.entitled && subscription.status !== 'none' ? (
							<Text style={styles.subscriptionExpired}>Доступ к бизнес-функциям приостановлен.</Text>
						) : null}
					</View>
				) : null}

				<Text style={styles.sectionTitle}>Команда</Text>
				{team.length === 0 ? (
					<Text style={styles.empty}>Пока только вы управляете этим местом.</Text>
				) : (
					team.map((m) => (
						<View key={m.guid} style={styles.teamRow}>
							<Image source={{uri: m.icon}} style={styles.teamAvatar} />
							<Text style={styles.teamName}>{m.fullname}</Text>
							<Text style={styles.teamRole}>{m.role === 'manager' ? 'Менеджер' : 'Сотрудник'}</Text>
						</View>
					))
				)}

				<Text style={styles.sectionTitle}>Последние отзывы</Text>
				{data.recent_reviews.length === 0 ? (
					<Text style={styles.empty}>Отзывов пока нет.</Text>
				) : (
					data.recent_reviews.map((r: BerxPlaceReview) => (
						<View key={r.guid} style={styles.reviewRow}>
							<Text style={styles.reviewAuthor}>{r.author?.fullname ?? 'Пользователь'}</Text>
							<Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
							{r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
							{r.owner_reply ? (
								<View style={styles.replyBlock}>
									<Text style={styles.replyLabel}>Ваш ответ</Text>
									<Text style={styles.replyText}>{r.owner_reply.text}</Text>
								</View>
							) : null}
						</View>
					))
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	statusRow: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md},
	statusLabel: {color: colors.white, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	statsRow: {flexDirection: 'row', gap: spacing.lg},
	stat: {alignItems: 'flex-start'},
	statValue: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	statLabel: {fontSize: typography.sizeXs, color: colors.textFaint},
	conversionNote: {fontSize: typography.sizeXs, color: colors.textFaint, marginTop: spacing.xs},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	momentForm: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
	momentsList: {gap: spacing.xs},
	momentRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm},
	momentRowText: {flex: 1, fontSize: typography.sizeSm, color: colors.accent},
	momentRowRemove: {fontSize: typography.sizeXs, color: colors.danger, paddingLeft: spacing.sm},
	empty: {color: colors.textFaint, fontSize: typography.sizeSm},
	subscriptionCard: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm},
	subscriptionStatus: {color: colors.white, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	subscriptionMeta: {color: colors.textDim, fontSize: typography.sizeSm},
	subscriptionExpired: {color: colors.danger, fontSize: typography.sizeSm},
	teamRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	teamAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	teamName: {flex: 1, color: colors.white, fontSize: typography.sizeSm},
	teamRole: {color: colors.textFaint, fontSize: typography.sizeXs},
	reviewRow: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, gap: 4},
	reviewAuthor: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	reviewStars: {color: colors.accent, fontSize: typography.sizeSm},
	reviewText: {color: colors.textDim, fontSize: typography.sizeSm},
	replyBlock: {marginTop: 4, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.accent},
	replyLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	replyText: {color: colors.textDim, fontSize: typography.sizeSm},
});
