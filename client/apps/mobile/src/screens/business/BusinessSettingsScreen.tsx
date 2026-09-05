/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. Real data: api.getPlace()/setBusinessType()/
 * getBusinessSubscription()/startBusinessTrial(). No "pay"/"upgrade"
 * action exists — no real payment provider is integrated, so none is
 * shown here; price is informational only, matching
 * BusinessDashboardScreen's existing, established honesty.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxBusinessSubscription, BerxBusinessType, BerxOpeningInterval} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {useBerxScene} from '../../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxIcon} from '../../../../../packages/design-system/src/icons';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxChoiceChips} from '../../../../../packages/design-system/src/spatial/BerxChoiceChips';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface BusinessSettingsScreenProps {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

const TYPES: {key: BerxBusinessType; label: string}[] = [
	{key: 'restaurant', label: 'Ресторан'}, {key: 'cafe', label: 'Кафе'}, {key: 'bar', label: 'Бар'},
	{key: 'hotel', label: 'Отель'}, {key: 'shop', label: 'Магазин'}, {key: 'beauty', label: 'Красота'},
	{key: 'fitness', label: 'Фитнес'}, {key: 'entertainment', label: 'Развлечения'}, {key: 'events', label: 'События'},
	{key: 'services', label: 'Услуги'}, {key: 'creators', label: 'Автор'}, {key: 'other', label: 'Другое'},
];

const STATUS_LABEL: Record<string, string> = {none: 'Не активирована', trial: 'Пробный период', active: 'Активна', expired: 'Истекла'};

const WEEKDAYS = [
	{key: 0, label: 'Вс'}, {key: 1, label: 'Пн'}, {key: 2, label: 'Вт'}, {key: 3, label: 'Ср'},
	{key: 4, label: 'Чт'}, {key: 5, label: 'Пт'}, {key: 6, label: 'Сб'},
];

/** Real, editable per-day state — hours as plain 0-23 integers for a simple UI; converted to real minutes-from-midnight only when saving. */
interface DayState {
	enabled: boolean;
	openHour: number;
	closeHour: number;
}

function emptyWeek(): DayState[] {
	return WEEKDAYS.map(() => ({enabled: false, openHour: 9, closeHour: 18}));
}

function intervalsToWeek(intervals: BerxOpeningInterval[]): DayState[] {
	const week = emptyWeek();
	for (const i of intervals) {
		if (i.weekday >= 0 && i.weekday <= 6) {
			week[i.weekday] = {enabled: true, openHour: Math.floor(i.open / 60), closeHour: Math.floor(i.close / 60)};
		}
	}
	return week;
}

function weekToIntervals(week: DayState[]): BerxOpeningInterval[] {
	const out: BerxOpeningInterval[] = [];
	week.forEach((d, weekday) => {
		if (d.enabled && d.closeHour > d.openHour) {
			out.push({weekday, open: d.openHour * 60, close: d.closeHour * 60});
		}
	});
	return out;
}

export default function BusinessSettingsScreen(props: BusinessSettingsScreenProps) {
	return (
		<BerxFamilyScene family="BUSINESS" testID="business-settings">
			<BusinessSettingsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BusinessSettingsScreenBody({api, placeGuid, onBack}: BusinessSettingsScreenProps) {
	/* the scene's own accent: the token is one colour in every colour
	   world, and a mark that ignores the room it stands in is exactly
	   the flattening the Color World system exists to prevent */
	const accent = useBerxScene().scene.accent;
	const [place, setPlace] = useState<BerxPlace | null>(null);
	const [subscription, setSubscription] = useState<BerxBusinessSubscription | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [typeBusy, setTypeBusy] = useState(false);
	const [trialBusy, setTrialBusy] = useState(false);
	const [week, setWeek] = useState<DayState[]>(emptyWeek());
	const [hoursBusy, setHoursBusy] = useState(false);
	const [hoursSaved, setHoursSaved] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, s, h] = await Promise.all([api.getPlace(placeGuid), api.getBusinessSubscription(placeGuid), api.placeHours(placeGuid)]);
			setPlace(p);
			setSubscription(s);
			setWeek(intervalsToWeek(h.intervals));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleSetType(type: BerxBusinessType) {
		setTypeBusy(true);
		try {
			await api.setBusinessType(placeGuid, type);
			setPlace((prev) => (prev ? {...prev, business_type: type} : prev));
		} catch {
			// real server rejection — nothing optimistic
		} finally {
			setTypeBusy(false);
		}
	}

	async function handleStartTrial() {
		setTrialBusy(true);
		try {
			setSubscription(await api.startBusinessTrial(placeGuid));
		} catch {
			// real server rejection
		} finally {
			setTrialBusy(false);
		}
	}

	function toggleDay(weekday: number) {
		setWeek((prev) => prev.map((d, i) => (i === weekday ? {...d, enabled: !d.enabled} : d)));
		setHoursSaved(false);
	}

	function adjustHour(weekday: number, field: 'openHour' | 'closeHour', delta: number) {
		setWeek((prev) => prev.map((d, i) => {
			if (i !== weekday) return d;
			const next = Math.max(0, Math.min(23, d[field] + delta));
			return {...d, [field]: next};
		}));
		setHoursSaved(false);
	}

	async function handleSaveHours() {
		setHoursBusy(true);
		setHoursSaved(false);
		try {
			await api.savePlaceHours(placeGuid, weekToIntervals(week));
			setHoursSaved(true);
		} catch {
			// real server rejection (e.g. close <= open on a real invalid day) — nothing optimistic
		} finally {
			setHoursBusy(false);
		}
	}

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error || !place)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />
			</View>
		);

	return (
		<BerxSceneScroll style={styles.screen} contentContainerStyle={styles.content}>
			{header}
			<BerxText role="title">Настройки бизнеса</BerxText>

			<BerxEyebrow>Тип бизнеса</BerxEyebrow>
			<BerxChoiceChips
				accessibilityLabel="Тип бизнеса"
				disabled={typeBusy}
				value={place.business_type ?? undefined}
				onChange={(key) => handleSetType(key as BerxBusinessType)}
				options={TYPES.map((t) => ({key: t.key as string, label: t.label}))}
			/>

			<BerxEyebrow>Часы работы</BerxEyebrow>
			<BerxGlassSurface style={styles.hoursCard}>
				{WEEKDAYS.map((wd) => {
					const d = week[wd.key];
					return (
						<View key={wd.key} style={styles.dayRow}>
							<Pressable
								style={styles.dayToggle}
								accessibilityRole="switch"
								accessibilityLabel={wd.label}
								accessibilityState={{checked: d.enabled}}
								onPress={() => toggleDay(wd.key)}>
								<Text style={[styles.dayLabel, d.enabled && [styles.dayLabelActive, {color: accent}]]}>{wd.label}</Text>
							</Pressable>
							{/* forty-two identical ± controls, one per hour per day,
							    every one of them announced as nothing. Each now says
							    which day and which end of the day it moves, and the
							    values are announced as adjustable. */}
							{d.enabled ? (
								<View style={styles.hourControls}>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={`${wd.label}: открытие на час раньше`}
										onPress={() => adjustHour(wd.key, 'openHour', -1)}>
										<BerxText role="body" emphasis="accent" style={styles.hourBtn}>−</BerxText>
									</Pressable>
									<Text
										accessibilityRole="adjustable"
										accessibilityLabel={`${wd.label}: открытие в ${String(d.openHour).padStart(2, '0')}:00`}
										style={styles.hourValue}>
										{String(d.openHour).padStart(2, '0')}:00
									</Text>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={`${wd.label}: открытие на час позже`}
										onPress={() => adjustHour(wd.key, 'openHour', 1)}>
										<BerxText role="body" emphasis="accent" style={styles.hourBtn}>+</BerxText>
									</Pressable>
									<BerxText role="meta" emphasis="tertiary" decorative>
										—
									</BerxText>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={`${wd.label}: закрытие на час раньше`}
										onPress={() => adjustHour(wd.key, 'closeHour', -1)}>
										<BerxText role="body" emphasis="accent" style={styles.hourBtn}>−</BerxText>
									</Pressable>
									<Text
										accessibilityRole="adjustable"
										accessibilityLabel={`${wd.label}: закрытие в ${String(d.closeHour).padStart(2, '0')}:00`}
										style={styles.hourValue}>
										{String(d.closeHour).padStart(2, '0')}:00
									</Text>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={`${wd.label}: закрытие на час позже`}
										onPress={() => adjustHour(wd.key, 'closeHour', 1)}>
										<BerxText role="body" emphasis="accent" style={styles.hourBtn}>+</BerxText>
									</Pressable>
								</View>
							) : (
								<BerxText role="meta" emphasis="tertiary">Выходной</BerxText>
							)}
						</View>
					);
				})}
				{hoursSaved ? (
					<View style={styles.hoursSavedNote}>
						<BerxIcon name="check" size={13} state="active" decorative />
						<Text style={styles.hoursSavedText}>Сохранено</Text>
					</View>
				) : null}
				<BerxButton label="Сохранить часы работы" variant="secondary" onPress={handleSaveHours} loading={hoursBusy} fullWidth />
			</BerxGlassSurface>

			<BerxEyebrow>Подписка</BerxEyebrow>
			<BerxGlassSurface elevated style={styles.subCard}>
				<BerxText role="callout">{subscription ? STATUS_LABEL[subscription.status] : STATUS_LABEL.none}</BerxText>
				{subscription?.monthly_price_rub ? (
					<BerxText role="meta" emphasis="secondary">{subscription.monthly_price_rub} ₽ / месяц после пробного периода</BerxText>
				) : null}
				{(!subscription || subscription.status === 'none') ? (
					<BerxButton label="Начать 7-дневный пробный период" onPress={handleStartTrial} loading={trialBusy} fullWidth />
				) : null}
			</BerxGlassSurface>

			<BerxEyebrow>Верификация</BerxEyebrow>
			<BerxGlassSurface style={styles.verifyCard}>
				<View style={styles.verifyStatus}>
					{place.verified ? <BerxIcon name="verified" size={13} state="active" decorative /> : null}
					<BerxText role="callout">{place.verified ? 'Бизнес верифицирован' : 'Не верифицирован'}</BerxText>
				</View>
				<BerxText role="meta" emphasis="tertiary">Верификацию проводит команда BERX вручную — заявок из этого экрана пока нет.</BerxText>
			</BerxGlassSurface>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	hoursCard: {gap: spacing.sm},
	dayRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs},
	dayToggle: {width: 40},
	dayLabel: {fontSize: typography.sizeSm, color: colors.textFaint, fontWeight: typography.weightMedium},
	dayLabelActive: {},
	hourControls: {flexDirection: 'row', alignItems: 'center', gap: 6},
	hourBtn: {paddingHorizontal: 6},
	hourValue: {fontSize: typography.sizeSm, color: colors.white, minWidth: 44, textAlign: 'center'},
	hoursSavedNote: {flexDirection: 'row', alignItems: 'center', gap: 5},
	hoursSavedText: {fontSize: typography.sizeXs, color: colors.success},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	typeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	subCard: {gap: spacing.sm},
	verifyCard: {gap: 4},
	verifyStatus: {flexDirection: 'row', alignItems: 'center', gap: 6},
});
