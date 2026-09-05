/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. No real offers/promotions backend exists
 * yet (no ossn_offers table, no /api/v1/offers endpoint) — honest
 * empty state, same reasoning as BusinessProductsScreen.
 */

import {View, StyleSheet} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';

export interface BusinessOffersScreenProps {
	onBack?: () => void;
}

export default function BusinessOffersScreen(props: BusinessOffersScreenProps = {}) {
	return (
		<BerxFamilyScene family="BUSINESS" testID="business-offers">
			<BusinessOffersScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BusinessOffersScreenBody({onBack}: BusinessOffersScreenProps) {
	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} />
			<BerxText role="title">Предложения</BerxText>
			<BerxEyebrow>Акции и скидки</BerxEyebrow>

			<BerxGlassSurface elevated style={styles.emptyCard}>
				<BerxText role="display" emphasis="accent">✦</BerxText>
				<BerxText role="heading">Предложений пока нет</BerxText>
				<BerxText role="meta" emphasis="tertiary" style={styles.emptySubtitle}>
					Здесь можно будет создавать реальные акции и специальные условия для клиентов BERX. Функция ещё не подключена к реальным данным.
				</BerxText>
				<BerxButton label="Создать предложение" variant="secondary" disabled fullWidth />
			</BerxGlassSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1, padding: spacing.lg, gap: spacing.md},
	emptyCard: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl},
	emptySubtitle: {textAlign: 'center', paddingHorizontal: spacing.md},
});
