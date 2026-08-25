/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. Real data: api.businessDashboard()/
 * getBusinessSubscription()/businessTeam() — identical calls to the
 * already-wired apps/mobile/src/screens/BusinessDashboardScreen.tsx,
 * restyled to the Spatial Glass language. That original file is left
 * untouched and still routed in AppShell; this is the reference for
 * when it's time to swap it in.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBusinessDashboard, BerxBusinessSubscription, BerxBusinessTeamMember, BerxPlaceReview} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxStatTile, BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	placeGuid: number;
}

const STATUS_LABEL: Record<string, string> = {none: 'Не активирована', trial: 'Пробный период', active: 'Активна', expired: 'Истекла'};

function fmtDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'});
}

export default function BusinessDashboardScreen({api, placeGuid}: Props) {
	const [data, setData] = useState<BerxBusinessDashboard | null>(null);
	const [subscription, setSubscription] = useState<BerxBusinessSubscription | null>(null);
	const [team, setTeam] = useState<BerxBusinessTeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [trialBusy, setTrialBusy] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [d, s, t] = await Promise.all([api.businessDashboard(placeGuid), api.getBusinessSubscription(placeGuid), api.businessTeam(placeGuid)]);
			setData(d);
			setSubscription(s);
			setTeam(t.team);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Панель недоступна');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleStartTrial() {
		setTrialBusy(true);
		try {
			setSubscription(await api.startBusinessTrial(placeGuid));
		} catch {
			// real server rejection — nothing optimistic
		} finally {
			setTrialBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !data) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<Text style={styles.pageTitle}>Дашборд</Text>

			<View style={styles.statsRow}>
				<BerxStatTile label="рейтинг" value={data.rating.toFixed(1)} />
				<BerxStatTile label="отзывов" value={String(data.rating_count)} />
				<BerxStatTile label="в команде" value={String(team.length)} />
			</View>

			<BerxEyebrow>Подписка</BerxEyebrow>
			{subscription ? (
				<BerxGlassSurface elevated style={styles.subCard}>
					<Text style={styles.subStatus}>{STATUS_LABEL[subscription.status]}</Text>
					{subscription.status === 'trial' && subscription.trial_ends_at ? (
						<Text style={styles.subMeta}>Пробный период до {fmtDate(subscription.trial_ends_at)}</Text>
					) : null}
					{subscription.monthly_price_rub ? (
						<Text style={styles.subMeta}>{subscription.monthly_price_rub} ₽ / месяц после пробного периода</Text>
					) : null}
					{subscription.status === 'none' ? (
						<BerxButton label="Начать 7-дневный пробный период" onPress={handleStartTrial} loading={trialBusy} fullWidth />
					) : null}
				</BerxGlassSurface>
			) : null}

			<BerxEyebrow>Команда</BerxEyebrow>
			{team.length === 0 ? (
				<BerxGlassSurface><Text style={styles.emptyText}>Пока только вы управляете этим местом.</Text></BerxGlassSurface>
			) : (
				<BerxGlassSurface style={styles.teamCard}>
					{team.map((m) => (
						<View key={m.guid} style={styles.teamRow}>
							<Image source={{uri: m.icon}} style={styles.teamAvatar} />
							<Text style={styles.teamName}>{m.fullname}</Text>
							<Text style={styles.teamRole}>{m.role === 'manager' ? 'Менеджер' : 'Сотрудник'}</Text>
						</View>
					))}
				</BerxGlassSurface>
			)}

			<BerxEyebrow>Последние отзывы</BerxEyebrow>
			{data.recent_reviews.length === 0 ? (
				<BerxGlassSurface><Text style={styles.emptyText}>Отзывов пока нет.</Text></BerxGlassSurface>
			) : (
				data.recent_reviews.map((r: BerxPlaceReview) => (
					<BerxGlassSurface key={r.guid} style={styles.reviewCard}>
						<Text style={styles.reviewAuthor}>{r.author?.fullname ?? 'Пользователь'}</Text>
						<Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
						{r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
						{r.owner_reply ? (
							<View style={styles.replyBlock}>
								<Text style={styles.replyLabel}>Ваш ответ</Text>
								<Text style={styles.replyText}>{r.owner_reply.text}</Text>
							</View>
						) : null}
					</BerxGlassSurface>
				))
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	statsRow: {flexDirection: 'row', gap: spacing.sm},
	subCard: {gap: spacing.sm},
	subStatus: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	subMeta: {fontSize: typography.sizeSm, color: colors.textDim},
	teamCard: {gap: spacing.sm},
	teamRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	teamAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	teamName: {flex: 1, color: colors.white, fontSize: typography.sizeSm},
	teamRole: {color: colors.textFaint, fontSize: typography.sizeXs},
	reviewCard: {gap: 4},
	reviewAuthor: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	reviewStars: {color: colors.accent, fontSize: typography.sizeSm},
	reviewText: {color: colors.textDim, fontSize: typography.sizeSm},
	replyBlock: {marginTop: 4, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.accent},
	replyLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightBold},
	replyText: {color: colors.textDim, fontSize: typography.sizeSm},
	emptyText: {color: colors.textFaint, fontSize: typography.sizeSm},
});
