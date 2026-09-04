/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN — establishes the "Spatial Glass" visual
 * language for Business. Real data via api.getPlace()/
 * businessDashboard()/getBusinessSubscription(). Not yet wired into
 * AppShell/routes — this pass is visual-system-first, per the
 * request; navigation wiring is a following step, not skipped
 * silently.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxBusinessDashboard, BerxBusinessSubscription} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxScrimHero, scrimBadgeStyles} from '../../../../../packages/design-system/src/components/BerxScrimHero';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxStatTile, BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';

export interface BusinessHomeScreenProps {
	api: BerxApiClient;
	placeGuid: number;
	onOpenProfile: () => void;
	onOpenDashboard: () => void;
	onOpenProducts: () => void;
	onOpenOffers: () => void;
	onOpenTeam: () => void;
	onOpenSettings: () => void;
}

const NAV_CARDS = [
	{key: 'profile', title: 'Профиль', subtitle: 'Как вас видят клиенты'},
	{key: 'dashboard', title: 'Дашборд', subtitle: 'Рейтинг, отзывы, команда'},
	{key: 'products', title: 'Товары и услуги', subtitle: 'Каталог вашего бизнеса'},
	{key: 'offers', title: 'Предложения', subtitle: 'Акции и специальные условия'},
	{key: 'team', title: 'Команда', subtitle: 'Кто управляет местом'},
	{key: 'settings', title: 'Настройки', subtitle: 'Тип бизнеса, подписка'},
] as const;

export default function BusinessHomeScreen(props: BusinessHomeScreenProps) {
	return (
		<BerxFamilyScene family="BUSINESS" testID="business-home">
			<BusinessHomeScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BusinessHomeScreenBody({api, placeGuid, onOpenProfile, onOpenDashboard, onOpenProducts, onOpenOffers, onOpenTeam, onOpenSettings}: BusinessHomeScreenProps) {
	const [place, setPlace] = useState<BerxPlace | null>(null);
	const [dashboard, setDashboard] = useState<BerxBusinessDashboard | null>(null);
	const [subscription, setSubscription] = useState<BerxBusinessSubscription | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, d, s] = await Promise.all([
				api.getPlace(placeGuid),
				api.businessDashboard(placeGuid),
				api.getBusinessSubscription(placeGuid),
			]);
			setPlace(p);
			setDashboard(d);
			setSubscription(s);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	const nav: Record<string, () => void> = {
		profile: onOpenProfile,
		dashboard: onOpenDashboard,
		products: onOpenProducts,
		offers: onOpenOffers,
		team: onOpenTeam,
		settings: onOpenSettings,
	};

	if (loading) return <BerxLoadingState />;
	if (error || !place || !dashboard) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
			<BerxScrimHero
				imageUrl={place.cover_url}
				title={place.title}
				subtitle={place.category ?? undefined}
				height={260}
				badge={
					<View style={scrimBadgeStyles.badge}>
						<Text style={dashboard.verified ? scrimBadgeStyles.badgeTextAccent : scrimBadgeStyles.badgeText}>
							{dashboard.verified ? '✓ Верифицированный бизнес' : 'Бизнес-аккаунт'}
						</Text>
					</View>
				}
			/>

			<View style={styles.body}>
				<View style={styles.statsRow}>
					<BerxStatTile label="рейтинг" value={dashboard.rating.toFixed(1)} />
					<BerxStatTile label="отзывов" value={String(dashboard.rating_count)} />
					<BerxStatTile
						label="подписка"
						value={subscription?.status === 'trial' ? 'Пробный период' : subscription?.status === 'active' ? 'Активна' : subscription?.status === 'expired' ? 'Истекла' : 'Не начата'}
					/>
				</View>

				<BerxEyebrow>Управление бизнесом</BerxEyebrow>
				<View style={styles.grid}>
					{NAV_CARDS.map((card) => (
						<Pressable key={card.key} onPress={nav[card.key]} style={styles.cardWrap}>
							<BerxGlassSurface padding="md" style={styles.card}>
								<Text style={styles.cardTitle}>{card.title}</Text>
								<Text style={styles.cardSubtitle}>{card.subtitle}</Text>
							</BerxGlassSurface>
						</Pressable>
					))}
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	scrollContent: {paddingBottom: spacing.xxxl},
	body: {padding: spacing.lg, gap: spacing.lg, marginTop: -spacing.xl},
	statsRow: {flexDirection: 'row', gap: spacing.sm},
	grid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
	cardWrap: {width: '48%'},
	card: {gap: 4, minHeight: 92, justifyContent: 'center'},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
	cardSubtitle: {fontSize: typography.sizeXs, color: colors.textFaint},
});
