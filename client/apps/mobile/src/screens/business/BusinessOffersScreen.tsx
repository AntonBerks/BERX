/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. No real offers/promotions backend exists
 * yet (no ossn_offers table, no /api/v1/offers endpoint) — honest
 * empty state, same reasoning as BusinessProductsScreen.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';

export default function BusinessOffersScreen({onBack}: {onBack?: () => void} = {}) {
	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} />
			<Text style={styles.pageTitle}>Предложения</Text>
			<BerxEyebrow>Акции и скидки</BerxEyebrow>

			<BerxGlassSurface elevated style={styles.emptyCard}>
				<Text style={styles.emptyGlyph}>✦</Text>
				<Text style={styles.emptyTitle}>Предложений пока нет</Text>
				<Text style={styles.emptySubtitle}>
					Здесь можно будет создавать реальные акции и специальные условия для клиентов BERX. Функция ещё не подключена к реальным данным.
				</Text>
				<BerxButton label="Создать предложение" variant="secondary" disabled fullWidth />
			</BerxGlassSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	emptyCard: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl},
	emptyGlyph: {fontSize: typography.sizeHero, color: colors.accent},
	emptyTitle: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	emptySubtitle: {fontSize: typography.sizeSm, color: colors.textFaint, textAlign: 'center', paddingHorizontal: spacing.md},
});
