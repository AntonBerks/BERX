/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real Business Offers (components/OssnApi/v1/offers.php,
 * classes/OssnBusinessOffers.php). This screen used to be a real,
 * honest "not connected yet" placeholder (no ossn_offers table, no
 * /api/v1/offers endpoint existed at the time) — that backend now
 * exists (a real claim + in-person-fulfill loyalty primitive, no
 * fake payment/coupon system), so the disabled button and "не
 * подключена" copy would now be actively misleading rather than
 * honest. Rebuilt as the real, full management surface: create an
 * offer, see every offer including inactive (owner/team/admin-only
 * allPlaceOffers()), deactivate one, and open its real claimant list
 * to mark a specific customer's claim fulfilled — same real actions
 * already proven on BusinessDashboardScreen.tsx's own inline section,
 * just given the dedicated Spatial Glass surface its "design
 * reference" siblings (BusinessTeamScreen.tsx et al.) already have.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Image, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBusinessOffer, BerxOfferRedemption} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

export default function BusinessOffersScreen({api, placeGuid, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [offers, setOffers] = useState<BerxBusinessOffer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [maxRedemptions, setMaxRedemptions] = useState('');
	const [durationDays, setDurationDays] = useState('');
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [redemptions, setRedemptions] = useState<Record<number, BerxOfferRedemption[]>>({});
	const [redemptionsLoading, setRedemptionsLoading] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [fulfillBusyGuid, setFulfillBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.allPlaceOffers(placeGuid);
			setOffers(res.offers);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить предложения');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleCreate() {
		if (!title.trim()) {
			setCreateError('Введите название предложения.');
			return;
		}
		setCreating(true);
		setCreateError(null);
		try {
			const days = durationDays.trim() ? Number(durationDays) : null;
			const cap = maxRedemptions.trim() ? Number(maxRedemptions) : undefined;
			await api.createOffer(placeGuid, {
				title: title.trim(),
				description: description.trim() || undefined,
				maxRedemptions: cap && Number.isFinite(cap) ? cap : undefined,
				endsAt: days !== null && Number.isFinite(days) ? Math.floor(Date.now() / 1000) + days * 86400 : undefined,
			});
			setTitle('');
			setDescription('');
			setMaxRedemptions('');
			setDurationDays('');
			await load();
		} catch (e) {
			setCreateError(e instanceof Error ? e.message : 'Не удалось создать предложение');
		} finally {
			setCreating(false);
		}
	}

	async function handleDeactivate(offerId: number) {
		setBusyId(offerId);
		try {
			await api.deactivateOffer(offerId);
			setOffers((prev) => prev.map((o) => (o.id === offerId ? {...o, active: false} : o)));
		} catch {
			// real server rejection — list stays as-is
		} finally {
			setBusyId(null);
		}
	}

	async function toggleExpanded(offerId: number) {
		if (expandedId === offerId) {
			setExpandedId(null);
			return;
		}
		setExpandedId(offerId);
		if (!redemptions[offerId]) {
			setRedemptionsLoading(true);
			try {
				const res = await api.offerRedemptions(offerId);
				setRedemptions((prev) => ({...prev, [offerId]: res.redemptions}));
			} catch {
				// leaves the section showing no claimants rather than crashing the screen
			} finally {
				setRedemptionsLoading(false);
			}
		}
	}

	async function handleFulfill(offerId: number, userGuid: number) {
		setFulfillBusyGuid(userGuid);
		try {
			await api.fulfillOffer(offerId, userGuid);
			setRedemptions((prev) => ({
				...prev,
				[offerId]: (prev[offerId] ?? []).map((r) => (r.guid === userGuid ? {...r, fulfilled: true, time_fulfilled: Math.floor(Date.now() / 1000)} : r)),
			}));
		} catch {
			// real server rejection — row stays as unfulfilled
		} finally {
			setFulfillBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<BerxHeader onBack={onBack} />
			<Text style={styles.pageTitle}>Предложения</Text>

			<BerxEyebrow>Новое предложение</BerxEyebrow>
			<BerxGlassSurface style={styles.formCard}>
				<BerxInput placeholder="Название (например: Кофе в подарок)" value={title} onChangeText={setTitle} />
				<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />
				<View style={styles.formRow}>
					<View style={styles.formHalf}><BerxInput placeholder="Лимит (необязательно)" value={maxRedemptions} onChangeText={setMaxRedemptions} keyboardType="number-pad" /></View>
					<View style={styles.formHalf}><BerxInput placeholder="Дней действия (необязательно)" value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad" /></View>
				</View>
				{createError ? <Text style={styles.formError}>{createError}</Text> : null}
				<BerxButton label="Создать" onPress={handleCreate} loading={creating} fullWidth />
			</BerxGlassSurface>

			<BerxEyebrow>{`Все предложения (${offers.length})`}</BerxEyebrow>
			{offers.length === 0 ? (
				<BerxGlassSurface><Text style={styles.emptyText}>Пока нет предложений — создайте первое выше.</Text></BerxGlassSurface>
			) : (
				offers.map((o) => (
					<BerxGlassSurface key={o.id} style={styles.offerCard}>
						<View style={styles.offerHeaderRow}>
							<Text style={styles.offerTitle} numberOfLines={1}>{o.active ? '🎁' : '⏸'} {o.title}</Text>
							{o.active ? (
								<Text style={styles.deactivateLink} onPress={() => handleDeactivate(o.id)}>
									{busyId === o.id ? '…' : 'Остановить'}
								</Text>
							) : (
								<Text style={styles.inactiveLabel}>неактивно</Text>
							)}
						</View>
						{o.description ? <Text style={styles.offerDescription}>{o.description}</Text> : null}
						<View style={styles.offerMetaRow}>
							<Text style={styles.offerMeta}>{o.redemptions_count}{o.max_redemptions !== null ? `/${o.max_redemptions}` : ''} забрали</Text>
							{o.ends_at !== null ? <Text style={styles.offerMeta}>до {new Date(o.ends_at * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}</Text> : null}
						</View>
						<Text style={styles.expandLink} onPress={() => toggleExpanded(o.id)}>
							{expandedId === o.id ? 'Скрыть получателей' : 'Показать получателей'}
						</Text>
						{expandedId === o.id ? (
							redemptionsLoading && !redemptions[o.id] ? (
								<Text style={styles.emptyText}>Загрузка…</Text>
							) : (redemptions[o.id] ?? []).length === 0 ? (
								<Text style={styles.emptyText}>Пока никто не забрал.</Text>
							) : (
								(redemptions[o.id] ?? []).map((r) => (
									<View key={r.guid} style={styles.redemptionRow}>
										<Image source={{uri: r.icon}} style={styles.redemptionAvatar} />
										<Text style={styles.redemptionName} numberOfLines={1}>{r.fullname}</Text>
										{r.fulfilled ? (
											<Text style={styles.fulfilledLabel}>✓ Использовано</Text>
										) : (
											<BerxButton label="Отметить" variant="secondary" loading={fulfillBusyGuid === r.guid} onPress={() => handleFulfill(o.id, r.guid)} />
										)}
									</View>
								))
							)
						) : null}
					</BerxGlassSurface>
				))
			)}
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	formCard: {gap: spacing.sm},
	formRow: {flexDirection: 'row', gap: spacing.sm},
	formHalf: {flex: 1},
	formError: {fontSize: typography.sizeSm, color: colors.danger},
	emptyText: {color: colors.textFaint, fontSize: typography.sizeSm},
	offerCard: {gap: spacing.xs},
	offerHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
	offerTitle: {flex: 1, color: colors.white, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	deactivateLink: {color: colors.danger, fontSize: typography.sizeXs},
	inactiveLabel: {color: colors.textFaint, fontSize: typography.sizeXs},
	offerDescription: {color: colors.textDim, fontSize: typography.sizeSm},
	offerMetaRow: {flexDirection: 'row', gap: spacing.sm},
	offerMeta: {color: colors.textFaint, fontSize: typography.sizeXs},
	expandLink: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	redemptionRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	redemptionAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	redemptionName: {flex: 1, color: colors.white, fontSize: typography.sizeSm},
	fulfilledLabel: {color: colors.accent, fontSize: typography.sizeXs},
});
