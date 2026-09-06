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
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxDataBoundary} from '../../../../../packages/design-system/src/spatial/BerxDataBoundary';

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

				{/* Not an empty list — there is no list. BERX has no such
				    resource on the server, so this is the `unsupported`
				    state, which names the missing capability instead of
				    describing a feature as though it were nearly here. The
				    disabled "add" button that used to sit under this text
				    went with it: a control that can never work is an orphan
				    action, and offering one is how a gap starts looking like
				    a feature. */}
				<BerxDataBoundary
					state="unsupported"
					unsupportedTitle="Каталога пока нет"
					unsupportedReason="В BERX нет ресурса каталога: ни таблицы ossn_products, ни эндпойнта /api/v1/products. Пока его не существует на сервере, показывать здесь позиции было бы выдумкой, а кнопка «добавить» вела бы в никуда."
					testID="capability-boundary">
					{null}
				</BerxDataBoundary>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1, padding: spacing.lg, gap: spacing.md},
});
