/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. Real data: api.getPlace()/setBusinessType()/
 * getBusinessSubscription()/startBusinessTrial(). No "pay"/"upgrade"
 * action exists — no real payment provider is integrated, so none is
 * shown here; price is informational only, matching
 * BusinessDashboardScreen's existing, established honesty.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxBusinessSubscription, BerxBusinessType, BerxOpeningInterval} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';

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

	if (loading) return <BerxLoadingState />;
	if (error || !place) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<BerxHeader onBack={onBack} />
			<Text style={styles.pageTitle}>Настройки бизнеса</Text>

			<BerxEyebrow>Тип бизнеса</BerxEyebrow>
			<View style={styles.typeGrid}>
				{TYPES.map((t) => {
					const active = place.business_type === t.key;
					return (
						<Pressable key={t.key} disabled={typeBusy} onPress={() => handleSetType(t.key)} style={[styles.typeChip, active && styles.typeChipActive]}>
							<Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t.label}</Text>
						</Pressable>
					);
				})}
			</View>

			<BerxEyebrow>Часы работы</BerxEyebrow>
			<BerxGlassSurface style={styles.hoursCard}>
				{WEEKDAYS.map((wd) => {
					const d = week[wd.key];
					return (
						<View key={wd.key} style={styles.dayRow}>
							<Pressable style={styles.dayToggle} onPress={() => toggleDay(wd.key)}>
								<Text style={[styles.dayLabel, d.enabled && styles.dayLabelActive]}>{wd.label}</Text>
							</Pressable>
							{d.enabled ? (
								<View style={styles.hourControls}>
									<Pressable onPress={() => adjustHour(wd.key, 'openHour', -1)}><Text style={styles.hourBtn}>−</Text></Pressable>
									<Text style={styles.hourValue}>{String(d.openHour).padStart(2, '0')}:00</Text>
									<Pressable onPress={() => adjustHour(wd.key, 'openHour', 1)}><Text style={styles.hourBtn}>+</Text></Pressable>
									<Text style={styles.hourDash}>—</Text>
									<Pressable onPress={() => adjustHour(wd.key, 'closeHour', -1)}><Text style={styles.hourBtn}>−</Text></Pressable>
									<Text style={styles.hourValue}>{String(d.closeHour).padStart(2, '0')}:00</Text>
									<Pressable onPress={() => adjustHour(wd.key, 'closeHour', 1)}><Text style={styles.hourBtn}>+</Text></Pressable>
								</View>
							) : (
								<Text style={styles.dayClosedLabel}>Выходной</Text>
							)}
						</View>
					);
				})}
				{hoursSaved ? <Text style={styles.hoursSavedNote}>✓ Сохранено</Text> : null}
				<BerxButton label="Сохранить часы работы" variant="secondary" onPress={handleSaveHours} loading={hoursBusy} fullWidth />
			</BerxGlassSurface>

			<BerxEyebrow>Подписка</BerxEyebrow>
			<BerxGlassSurface elevated style={styles.subCard}>
				<Text style={styles.subStatus}>{subscription ? STATUS_LABEL[subscription.status] : STATUS_LABEL.none}</Text>
				{subscription?.monthly_price_rub ? (
					<Text style={styles.subMeta}>{subscription.monthly_price_rub} ₽ / месяц после пробного периода</Text>
				) : null}
				{(!subscription || subscription.status === 'none') ? (
					<BerxButton label="Начать 7-дневный пробный период" onPress={handleStartTrial} loading={trialBusy} fullWidth />
				) : null}
			</BerxGlassSurface>

			<BerxEyebrow>Верификация</BerxEyebrow>
			<BerxGlassSurface style={styles.verifyCard}>
				<Text style={styles.verifyStatus}>{place.verified ? '✓ Бизнес верифицирован' : 'Не верифицирован'}</Text>
				<Text style={styles.verifyHint}>Верификацию проводит команда BERX вручную — заявок из этого экрана пока нет.</Text>
			</BerxGlassSurface>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	hoursCard: {gap: spacing.sm},
	dayRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs},
	dayToggle: {width: 40},
	dayLabel: {fontSize: typography.sizeSm, color: colors.textFaint, fontWeight: typography.weightMedium},
	dayLabelActive: {color: colors.accent},
	dayClosedLabel: {fontSize: typography.sizeSm, color: colors.textFaint},
	hourControls: {flexDirection: 'row', alignItems: 'center', gap: 6},
	hourBtn: {fontSize: typography.sizeBase, color: colors.accent, paddingHorizontal: 6},
	hourValue: {fontSize: typography.sizeSm, color: colors.white, minWidth: 44, textAlign: 'center'},
	hourDash: {fontSize: typography.sizeSm, color: colors.textFaint},
	hoursSavedNote: {fontSize: typography.sizeXs, color: colors.success},
	screen: {flex: 1, backgroundColor: colors.bg},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	typeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	typeChip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.glass1},
	typeChipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	typeChipText: {fontSize: typography.sizeSm, color: colors.textDim},
	typeChipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	subCard: {gap: spacing.sm},
	subStatus: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	subMeta: {fontSize: typography.sizeSm, color: colors.textDim},
	verifyCard: {gap: 4},
	verifyStatus: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	verifyHint: {fontSize: typography.sizeXs, color: colors.textFaint},
});
