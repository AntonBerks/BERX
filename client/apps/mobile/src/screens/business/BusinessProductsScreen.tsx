/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. No real product/service-catalog backend
 * exists anywhere in BERX yet (checked: no ossn_products table, no
 * /api/v1/products endpoint) — this screen is honestly an empty
 * state, not a fake populated catalog. It establishes the visual
 * shape (list-card language) a real catalog would later fill.
 */

import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';

export interface BusinessProductsScreenProps {
	onBack?: () => void;
}

export default function BusinessProductsScreen(props: BusinessProductsScreenProps = {}) {
	return (
		<BerxFamilyScene family="BUSINESS" testID="business-products">
			<BusinessProductsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BusinessProductsScreenBody({onBack}: BusinessProductsScreenProps) {
	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} />
			<Text style={styles.pageTitle}>Товары и услуги</Text>
			<BerxEyebrow>Каталог</BerxEyebrow>

			<BerxGlassSurface elevated style={styles.emptyCard}>
				<Text style={styles.emptyGlyph}>◇</Text>
				<Text style={styles.emptyTitle}>Каталога пока нет</Text>
				<Text style={styles.emptySubtitle}>
					Здесь появятся товары и услуги вашего бизнеса — с ценами, фото и описанием. Эта функция ещё не подключена к реальным данным BERX.
				</Text>
				<BerxButton label="Добавить позицию" variant="secondary" disabled fullWidth />
			</BerxGlassSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1, padding: spacing.lg, gap: spacing.md},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	emptyCard: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl},
	emptyGlyph: {fontSize: typography.sizeHero, color: colors.accent},
	emptyTitle: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	emptySubtitle: {fontSize: typography.sizeSm, color: colors.textFaint, textAlign: 'center', paddingHorizontal: spacing.md},
});
