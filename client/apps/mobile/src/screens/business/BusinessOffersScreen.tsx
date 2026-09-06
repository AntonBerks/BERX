/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. No real offers/promotions backend exists
 * yet (no ossn_offers table, no /api/v1/offers endpoint) — honest
 * empty state, same reasoning as BusinessProductsScreen.
 */

import {View, StyleSheet} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxDataBoundary} from '../../../../../packages/design-system/src/spatial/BerxDataBoundary';

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
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<BerxText role="title">Предложения</BerxText>
				<BerxEyebrow>Акции и скидки</BerxEyebrow>

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
					unsupportedTitle="Предложений пока нет"
					unsupportedReason="В BERX нет ресурса акций: ни таблицы предложений, ни эндпойнта для их создания. Реальные скидки появятся здесь, когда появятся на сервере — до тех пор это честная граница, а не пустая форма."
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
