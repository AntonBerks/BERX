/**
 * BERX-291 — Business Dashboard. The BUSINESS family's v9 scene.
 *
 * Every number here is a real query or real server-timed state:
 * rating and rating_count, recent reviews, nearby impressions
 * (shown/opened/saved/route), team, and the subscription's real
 * trial dates. There is no engagement score, no growth chart, no
 * visitor analytics and no payment surface, because none of those has
 * a data source or a provider in BERX.
 *
 * Verification is admin-granted and server-enforced — a business can
 * never verify itself — so the badge reflects a real administrative
 * decision.
 *
 * A real bug fixed while bringing this to v9: place moments were
 * fetched only after publishing one, so an owner returning to the
 * dashboard saw an empty Moments list even when moments were live.
 * They are now loaded with the rest of the dashboard.
 *
 * This file is also the single business dashboard. A second,
 * unrouted "design reference" copy existed under screens/business/;
 * it now re-exports this one rather than drifting alongside it.
 */
import {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {
	BerxBusinessDashboard,
	BerxBusinessMoment,
	BerxBusinessSubscription,
	BerxBusinessTeamMember,
	BerxPlaceReview,
} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxBusinessHero} from '../../../../packages/design-system/src/spatial/BerxBusinessHero';
import {BerxStatRail} from '../../../../packages/design-system/src/spatial/BerxStatRail';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxPlaceRating} from '../../../../packages/design-system/src/spatial/BerxPlaceRating';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxScreenScene, useBerxScreen, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface BusinessDashboardScreenProps {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
	none: 'Подписка не активирована',
	trial: 'Пробный период',
	active: 'Активна',
	expired: 'Истекла',
};

/** The real server-side maximum is 24h; two hours is a deliberate, conservative default. */
const MOMENT_WINDOW_SECONDS = 2 * 60 * 60;

function fmtDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'});
}

export default function BusinessDashboardScreen(props: BusinessDashboardScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-291" testID="berx-291">
			<BusinessDashboardSceneBody {...props} />
		</BerxScreenScene>
	);
}

function BusinessDashboardSceneBody({api, placeGuid, onBack}: BusinessDashboardScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [data, setData] = useState<BerxBusinessDashboard | null>(null);
	const [cover, setCover] = useState<string | null>(null);
	const [subscription, setSubscription] = useState<BerxBusinessSubscription | null>(null);
	const [team, setTeam] = useState<BerxBusinessTeamMember[]>([]);
	const [moments, setMoments] = useState<BerxBusinessMoment[]>([]);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [trialBusy, setTrialBusy] = useState(false);
	const [momentText, setMomentText] = useState('');
	const [momentBusy, setMomentBusy] = useState(false);

	/* the venue's own cover: a dashboard about a place is still that place */
	useBerxSceneAtmosphere(cover ? {uri: cover} : undefined);

	const load = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const [dashboard, sub, teamRes, momentsRes, place] = await Promise.all([
				api.businessDashboard(placeGuid),
				api.getBusinessSubscription(placeGuid),
				api.businessTeam(placeGuid),
				/* was missing entirely — live moments never appeared until you posted one */
				api.placeMoments(placeGuid).catch(() => ({moments: [] as BerxBusinessMoment[]})),
				/* the venue itself, for the scene's environment: a dashboard
				   about a place is still that place. Never fatal — a failed
				   cover fetch leaves the room lit without it. */
				api.getPlace(placeGuid).catch(() => null),
			]);
			setData(dashboard);
			setCover(place?.cover_url ?? null);
			setSubscription(sub);
			setTeam(teamRes.team);
			setMoments(momentsRes.moments);
			setState('default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'business-dashboard');
		}
	}, [api, placeGuid, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const publishMoment = useCallback(async () => {
		const text = momentText.trim();
		if (!text) return;
		setMomentBusy(true);
		berxAnalytics.mutationStart(screen, placeGuid);
		const started = Date.now();
		try {
			await api.createBusinessMoment(placeGuid, text, Math.floor(Date.now() / 1000) + MOMENT_WINDOW_SECONDS);
			/* cleared and re-read only after the server accepted it */
			setMomentText('');
			const res = await api.placeMoments(placeGuid);
			setMoments(res.moments);
			berxAnalytics.mutationSuccess(screen, Date.now() - started, placeGuid);
		} catch {
			berxAnalytics.mutationError(screen, 'moment-create');
		} finally {
			setMomentBusy(false);
		}
	}, [momentText, api, placeGuid, screen]);

	const removeMoment = useCallback(
		async (id: number) => {
			try {
				await api.deleteBusinessMoment(id);
				setMoments((prev) => prev.filter((x) => x.id !== id));
			} catch {
				/* the list stays as the server left it */
				berxAnalytics.mutationError(screen, 'moment-delete');
			}
		},
		[api, screen],
	);

	const startTrial = useCallback(async () => {
		setTrialBusy(true);
		try {
			setSubscription(await api.startBusinessTrial(placeGuid));
		} catch {
			berxAnalytics.mutationError(screen, 'trial');
		} finally {
			setTrialBusy(false);
		}
	}, [api, placeGuid, screen]);

	const impressions = data?.nearby_impressions ?? null;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Панель бизнеса" onBack={onBack} />
			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle="Панель недоступна"
				style={styles.body}>
				{data ? (
					<ScrollView
						onScroll={onScroll}
						scrollEventThrottle={scrollEventThrottle}
						contentContainerStyle={styles.scroll}
						showsVerticalScrollIndicator={false}>
						<BerxBusinessHero
							placeGuid={data.place_guid}
							name="Панель бизнеса"
							verified={data.verified}
							planLabel={subscription ? STATUS_LABEL[subscription.status] : undefined}
						/>

						<Section title="Репутация">
							<BerxStatRail
								stats={[
									{key: 'rating', label: 'рейтинг', value: data.rating_count > 0 ? data.rating.toFixed(1) : undefined},
									{key: 'reviews', label: 'отзывов', value: data.rating_count},
									{key: 'team', label: 'сотрудников', value: team.length},
								]}
							/>
						</Section>

						{impressions ? (
							<Section title="Рядом сейчас">
								<BerxStatRail
									stats={[
										{key: 'shown', label: 'показов', value: impressions.shown},
										{key: 'opened', label: 'открытий', value: impressions.opened},
										{key: 'saved', label: 'сохранений', value: impressions.saved},
										{key: 'route', label: 'маршрутов', value: impressions.route},
									]}
								/>
								{impressions.shown > 0 ? (
									<BerxText role="meta" emphasis="secondary">
										{Math.round((impressions.opened / impressions.shown) * 100)}% открывают ваш профиль после показа рядом
									</BerxText>
								) : null}
							</Section>
						) : null}

						<Section title="Moment (2 часа)">
							<BerxInput
								placeholder="Например: счастливые часы до 18:00"
								value={momentText}
								onChangeText={setMomentText}
							/>
							<BerxButton
								label="Опубликовать"
								variant="secondary"
								onPress={publishMoment}
								loading={momentBusy}
								disabled={momentText.trim().length === 0}
							/>
							{moments.length === 0 ? (
								<BerxText role="meta" emphasis="tertiary">Сейчас нет активных moments.</BerxText>
							) : (
								moments.map((m) => (
									<BerxSpatialCard key={m.id} depth="D3" padding={spacing.md} radius={16}>
										<View style={styles.momentRow}>
											<BerxText role="meta" style={styles.momentText} numberOfLines={2}>
												{m.text}
											</BerxText>
											<BerxButton label="Убрать" variant="secondary" onPress={() => removeMoment(m.id)} />
										</View>
									</BerxSpatialCard>
								))
							)}
						</Section>

						{subscription ? (
							<Section title="Подписка">
								<BerxSpatialCard depth="D2" padding={spacing.lg}>
									<BerxText role="callout">{STATUS_LABEL[subscription.status]}</BerxText>
									{subscription.status === 'trial' && subscription.trial_ends_at ? (
										<BerxText role="meta" emphasis="secondary">Пробный период до {fmtDate(subscription.trial_ends_at)}</BerxText>
									) : null}
									{subscription.monthly_price_rub ? (
										<BerxText role="meta" emphasis="secondary">{subscription.monthly_price_rub} ₽ / месяц после пробного периода</BerxText>
									) : null}
									{subscription.status === 'none' ? (
										<BerxButton label="Начать 7-дневный пробный период" onPress={startTrial} loading={trialBusy} fullWidth />
									) : null}
									{!subscription.entitled && subscription.status !== 'none' ? (
										<Text style={styles.warning}>Доступ к бизнес-функциям приостановлен.</Text>
									) : null}
								</BerxSpatialCard>
							</Section>
						) : null}

						<Section title="Команда">
							{team.length === 0 ? (
								<BerxText role="meta" emphasis="tertiary">Пока только вы управляете этим местом.</BerxText>
							) : (
								team.map((m) => (
									<BerxSpatialCard key={m.guid} depth="D3" padding={spacing.md} radius={16}>
										<BerxIdentity
											userGuid={m.guid}
											name={m.fullname}
											handle={m.username}
											avatarUrl={m.icon}
											subtitle={m.role === 'manager' ? 'Менеджер' : 'Сотрудник'}
											size={38}
										/>
									</BerxSpatialCard>
								))
							)}
						</Section>

						<Section title="Последние отзывы">
							{data.recent_reviews.length === 0 ? (
								<BerxText role="meta" emphasis="tertiary">Отзывов пока нет.</BerxText>
							) : (
								data.recent_reviews.map((r: BerxPlaceReview) => (
									<BerxSpatialCard key={r.guid} depth="D3" padding={spacing.md} radius={16}>
										<View style={styles.reviewHead}>
											<BerxText role="label">{r.author?.fullname ?? 'Пользователь'}</BerxText>
											<BerxPlaceRating average={r.rating} count={1} compact />
										</View>
										{r.text ? <BerxText role="meta" emphasis="secondary" style={styles.reviewText}>{r.text}</BerxText> : null}
										{r.owner_reply ? (
											<View style={styles.reply}>
												<BerxText role="label" emphasis="accent">Ваш ответ</BerxText>
												<BerxText role="meta" emphasis="secondary" style={styles.reviewText}>{r.owner_reply.text}</BerxText>
											</View>
										) : null}
									</BerxSpatialCard>
								))
							)}
						</Section>
					</ScrollView>
				) : null}
			</BerxDataBoundary>
		</View>
	);
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
	return (
		<View style={styles.section}>
			<BerxText role="micro" emphasis="tertiary" heading>
				{title}
			</BerxText>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	body: {flex: 1},
	scroll: {paddingBottom: spacing.xxxl},
	section: {paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm},
	warning: {color: colors.danger, fontSize: typography.sizeSm},
	momentRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	momentText: {flex: 1},
	reviewHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
	reviewText: {marginTop: 4},
	reply: {marginTop: spacing.sm, paddingLeft: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.borderSoft},
});
