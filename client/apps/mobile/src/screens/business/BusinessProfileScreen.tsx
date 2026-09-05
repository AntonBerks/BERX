/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. Real data via api.getPlace(). This is the
 * owner's editorial view of how the business appears to customers —
 * same real fields PlaceDetailScreen already reads (address/phone/
 * hours/website/category), presented with the Spatial Glass language.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace} from '@berx/api/types';
import {BerxStars} from '../../../../../packages/design-system/src/spatial/BerxStars';
import {BerxIcon, type BerxIconName} from '../../../../../packages/design-system/src/icons';
import {spacing} from '@berx/design-system/tokens';
import {BerxScrimHero, scrimBadgeStyles} from '../../../../../packages/design-system/src/components/BerxScrimHero';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxSection} from '../../../../../packages/design-system/src/spatial/BerxSection';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {berxCount} from '@berx/domain';

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

/**
 * A contact line, with the icon set's own drawing rather than an
 * emoji. An emoji is a colour image from the platform's font: it does
 * not take the scene's colour, does not match the 24 grid or the 1.7
 * stroke of every other glyph in BERX, and looks different on every
 * device the app runs on.
 */
function InfoRow({icon, label}: {icon: BerxIconName; label: string}) {
	return (
		<View style={styles.infoRow}>
			<View style={styles.infoIcon}>
				<BerxIcon name={icon} size={16} decorative />
			</View>
			<BerxText role="meta" emphasis="secondary" style={styles.infoText}>{label}</BerxText>
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
		<BerxSceneScroll style={styles.screen}>
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
				{place.description ? (
					<BerxSection leading>
						<BerxText role="body">{place.description}</BerxText>
					</BerxSection>
				) : null}

				<BerxSection label="Контакты">
				<BerxGlassSurface style={styles.infoCard}>
					{place.address ? <InfoRow icon="location" label={place.address} /> : null}
					{place.hours ? <InfoRow icon="clock" label={place.hours} /> : null}
					{place.phone ? <InfoRow icon="phone" label={place.phone} /> : null}
					{place.website ? <InfoRow icon="globe" label={place.website} /> : null}
					{!place.address && !place.hours && !place.phone && !place.website ? (
						<BerxText role="meta" emphasis="tertiary">Контакты ещё не заполнены.</BerxText>
					) : null}
				</BerxGlassSurface>
				</BerxSection>

				<BerxSection label="Рейтинг" detail={(place.rating_count > 0 ? berxCount(place.rating_count, 'отзыв', 'отзыва', 'отзывов') : undefined)}>
				<BerxGlassSurface style={styles.ratingCard}>
					<BerxText role="display">{place.rating.toFixed(1)}</BerxText>
					<BerxStars value={place.rating} />
				</BerxGlassSurface>
				</BerxSection>
			</View>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.lg, gap: spacing.md, marginTop: -spacing.lg},
	infoCard: {gap: spacing.sm},
	infoRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	/* a fixed column, so contact lines share one left edge */
	infoIcon: {width: 22, alignItems: 'center'},
	infoText: {flex: 1},
	ratingCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
});
