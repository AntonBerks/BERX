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
 *
 * Future UI pass: this was still the pre-Phase-4 flat colors.surface
 * look (the sibling "Spatial Glass" screens live in screens/business/
 * now). Status/stats/subscription move onto BerxGlassSurface, the
 * team list gets one grouped glass container instead of per-row
 * boxes, and the whole body gets a BerxFadeIn entrance. Also switched
 * the root View to a ScrollView -- this screen had no scroll
 * container at all, unlike every sibling detail screen (Place/Event),
 * so a business with a longer team/review list had no way to reach
 * the bottom; a real bug fix, not a style choice. Review rows are
 * left as plain divided rows, matching PlaceDetailScreen's own
 * convention (not every list needs to be a card).
 *
 * MAX BUILD — "Business + Places + Moments + Events + Offers +
 * Reputation = one real-world business ecosystem": the dashboard now
 * also shows the business's own upcoming events at this place
 * (upcoming_events, real OssnEvents filtered by place_guid) and real
 * customer activity (recent_checkins — who actually, geo-verified,
 * showed up, via the new check-in system). Both were previously
 * invisible from this screen even though the underlying data was
 * real (events already supported place_guid on create).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBusinessDashboard, BerxPlaceReview, BerxBusinessSubscription, BerxBusinessTeamMember, BerxBusinessMoment, BerxEvent, BerxBusinessCheckin} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

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
		<ScrollView style={styles.screen}>
			<BerxHeader title="Панель бизнеса" onBack={onBack} />
			<BerxFadeIn style={styles.body}>
				<BerxGlassSurface elevated padding="md" style={styles.statusRow}>
					<Text style={styles.statusLabel}>{data.verified ? 'Верифицирован ✓' : 'Не верифицирован'}</Text>
				</BerxGlassSurface>

				<BerxGlassSurface padding="md" style={styles.statsRow}>
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
				</BerxGlassSurface>

				{data.nearby_impressions ? (
					<>
						<Text style={styles.sectionTitle}>Nearby Now</Text>
						<BerxGlassSurface padding="md" style={styles.statsRow}>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.shown}</Text><Text style={styles.statLabel}>показов</Text></View>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.opened}</Text><Text style={styles.statLabel}>открытий</Text></View>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.saved}</Text><Text style={styles.statLabel}>сохранений</Text></View>
							<View style={styles.stat}><Text style={styles.statValue}>{data.nearby_impressions.route}</Text><Text style={styles.statLabel}>маршрутов</Text></View>
						</BerxGlassSurface>
						{data.nearby_impressions.shown > 0 ? (
							<Text style={styles.conversionNote}>
								{Math.round((data.nearby_impressions.opened / data.nearby_impressions.shown) * 100)}% открывают ваш профиль после показа рядом
							</Text>
						) : null}
					</>
				) : null}

				<Text style={styles.sectionTitle}>Ближайшие события</Text>
				{data.upcoming_events.length === 0 ? (
					<Text style={styles.empty}>Нет запланированных событий в этом месте.</Text>
				) : (
					data.upcoming_events.map((e: BerxEvent) => (
						<View key={e.guid} style={styles.eventRow}>
							<Text style={styles.eventTitle} numberOfLines={1}>{e.title}</Text>
							<Text style={styles.eventMeta}>{new Date(e.starts * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})} · {e.attendee_count} идут</Text>
						</View>
					))
				)}

				<Text style={styles.sectionTitle}>Активность гостей</Text>
				{data.recent_checkins.length === 0 ? (
					<Text style={styles.empty}>Пока никто не отмечался здесь.</Text>
				) : (
					<View style={styles.checkinsRow}>
						{data.recent_checkins.slice(0, 8).map((c: BerxBusinessCheckin) => (
							<View key={`${c.guid}-${c.time}`} style={styles.checkinItem}>
								<Image source={{uri: c.icon}} style={styles.checkinAvatar} />
								<Text style={styles.checkinName} numberOfLines={1}>{c.fullname}</Text>
								<Text style={styles.checkinTime}>{relativeTimeLabel(c.time)}</Text>
							</View>
						))}
					</View>
				)}

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
					<BerxGlassSurface elevated padding="md" style={styles.subscriptionCard}>
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
					</BerxGlassSurface>
				) : null}

				<Text style={styles.sectionTitle}>Команда</Text>
				{team.length === 0 ? (
					<Text style={styles.empty}>Пока только вы управляете этим местом.</Text>
				) : (
					<BerxGlassSurface padding="sm" style={styles.teamGroup}>
						{team.map((m: BerxBusinessTeamMember, i: number) => (
							<View key={m.guid} style={[styles.teamRow, i > 0 && styles.teamRowDivider]}>
								<Image source={{uri: m.icon}} style={styles.teamAvatar} />
								<Text style={styles.teamName}>{m.fullname}</Text>
								<Text style={styles.teamRole}>{m.role === 'manager' ? 'Менеджер' : 'Сотрудник'}</Text>
							</View>
						))}
					</BerxGlassSurface>
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
			</BerxFadeIn>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	statusRow: {},
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
	eventRow: {gap: 2, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	eventTitle: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	eventMeta: {color: colors.textFaint, fontSize: typography.sizeXs},
	checkinsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md},
	checkinItem: {alignItems: 'center', width: 68},
	checkinAvatar: {width: 44, height: 44, borderRadius: 22, backgroundColor: colors.graphite},
	checkinName: {color: colors.textDim, fontSize: typography.sizeXs, marginTop: 4, textAlign: 'center'},
	checkinTime: {color: colors.textFaint, fontSize: 10},
	subscriptionCard: {gap: spacing.sm},
	subscriptionStatus: {color: colors.white, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	subscriptionMeta: {color: colors.textDim, fontSize: typography.sizeSm},
	subscriptionExpired: {color: colors.danger, fontSize: typography.sizeSm},
	teamGroup: {gap: 0},
	teamRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm},
	teamRowDivider: {borderTopWidth: 1, borderTopColor: colors.borderSoft},
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
