/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. No real product/service-catalog backend
 * exists anywhere in BERX yet (checked: no ossn_products table, no
 * /api/v1/products endpoint) — this screen is honestly an empty
 * state, not a fake populated catalog. It establishes the visual
 * shape (list-card language) a real catalog would later fill.
 */

import {View, StyleSheet} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../../packages/design-system/src/spatial/BerxSceneScroll';

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
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<BerxText role="title">Товары и услуги</BerxText>
				<BerxEyebrow>Каталог</BerxEyebrow>

				<BerxGlassSurface elevated style={styles.emptyCard}>
					<BerxText role="display" emphasis="accent">◇</BerxText>
					<BerxText role="heading">Каталога пока нет</BerxText>
					<BerxText role="meta" emphasis="tertiary" style={styles.emptySubtitle}>
						Здесь появятся товары и услуги вашего бизнеса — с ценами, фото и описанием. Эта функция ещё не подключена к реальным данным BERX.
					</BerxText>
					<BerxButton label="Добавить позицию" variant="secondary" disabled fullWidth />
				</BerxGlassSurface>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1, padding: spacing.lg, gap: spacing.md},
	emptyCard: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl},
	emptySubtitle: {textAlign: 'center', paddingHorizontal: spacing.md},
});
