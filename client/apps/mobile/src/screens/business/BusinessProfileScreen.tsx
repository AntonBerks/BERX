/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. Real data via api.getPlace(). This is the
 * owner's editorial view of how the business appears to customers —
 * same real fields PlaceDetailScreen already reads (address/phone/
 * hours/website/category), presented with the Spatial Glass language.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxScrimHero, scrimBadgeStyles} from '../../../../../packages/design-system/src/components/BerxScrimHero';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';

export interface BusinessProfileScreenProps {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

const TYPE_LABEL: Record<string, string> = {
	restaurant: 'Ресторан', cafe: 'Кафе', bar: 'Бар', hotel: 'Отель', shop: 'Магазин',
	beauty: 'Красота', fitness: 'Фитнес', entertainment: 'Развлечения', events: 'События',
	services: 'Услуги', creators: 'Автор', other: 'Другое',
};

function InfoRow({icon, label}: {icon: string; label: string}) {
	return (
		<View style={styles.infoRow}>
			<Text style={styles.infoIcon}>{icon}</Text>
			<Text style={styles.infoText}>{label}</Text>
		</View>
	);
}

export default function BusinessProfileScreen(props: BusinessProfileScreenProps) {
	return (
		<BerxFamilyScene family="BUSINESS" testID="business-profile">
			<BusinessProfileScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BusinessProfileScreenBody({api, placeGuid, onBack}: BusinessProfileScreenProps) {
	const [place, setPlace] = useState<BerxPlace | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* the venue's own cover, same as the public place scene uses */
	useBerxSceneAtmosphere(place?.cover_url ? {uri: place.cover_url} : undefined);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setPlace(await api.getPlace(placeGuid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error || !place) return <BerxErrorState message={error ?? 'Профиль недоступен'} onRetry={load} />;

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader onBack={onBack} />
			<BerxScrimHero
				imageUrl={place.cover_url}
				title={place.title}
				height={320}
				badge={
					place.business_type ? (
						<View style={scrimBadgeStyles.badge}>
							<Text style={scrimBadgeStyles.badgeTextAccent}>{TYPE_LABEL[place.business_type] ?? place.business_type}</Text>
						</View>
					) : undefined
				}
			/>
			<View style={styles.body}>
				{place.description ? <Text style={styles.description}>{place.description}</Text> : null}

				<BerxEyebrow>Контакты</BerxEyebrow>
				<BerxGlassSurface style={styles.infoCard}>
					{place.address ? <InfoRow icon="📍" label={place.address} /> : null}
					{place.hours ? <InfoRow icon="🕐" label={place.hours} /> : null}
					{place.phone ? <InfoRow icon="📞" label={place.phone} /> : null}
					{place.website ? <InfoRow icon="🔗" label={place.website} /> : null}
					{!place.address && !place.hours && !place.phone && !place.website ? (
						<Text style={styles.emptyInfo}>Контакты ещё не заполнены.</Text>
					) : null}
				</BerxGlassSurface>

				<BerxEyebrow>Рейтинг</BerxEyebrow>
				<BerxGlassSurface style={styles.ratingCard}>
					<Text style={styles.ratingValue}>{place.rating.toFixed(1)}</Text>
					<View>
						<Text style={styles.ratingStars}>{'★'.repeat(Math.round(place.rating))}{'☆'.repeat(5 - Math.round(place.rating))}</Text>
						<Text style={styles.ratingCount}>{place.rating_count} {place.rating_count === 1 ? 'отзыв' : 'отзывов'}</Text>
					</View>
				</BerxGlassSurface>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.lg, gap: spacing.md, marginTop: -spacing.lg},
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	infoCard: {gap: spacing.sm},
	infoRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	infoIcon: {fontSize: typography.sizeBase},
	infoText: {fontSize: typography.sizeSm, color: colors.textDim, flex: 1},
	emptyInfo: {fontSize: typography.sizeSm, color: colors.textFaint},
	ratingCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	ratingValue: {fontSize: typography.sizeHero, color: colors.white, fontWeight: typography.weightBold},
	ratingStars: {fontSize: typography.sizeBase, color: colors.accent},
	ratingCount: {fontSize: typography.sizeXs, color: colors.textFaint},
});
