/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. No real product/service-catalog backend
 * exists anywhere in BERX yet (checked: no ossn_products table, no
 * /api/v1/products endpoint) — this screen is honestly an empty
 * state, not a fake populated catalog. It establishes the visual
 * shape (list-card language) a real catalog would later fill.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';

import {useBerxColors} from '../../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

export default function BusinessProductsScreen({onBack}: {onBack?: () => void} = {}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
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

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	emptyCard: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl},
	emptyGlyph: {fontSize: typography.sizeHero, color: colors.accent},
	emptyTitle: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	emptySubtitle: {fontSize: typography.sizeSm, color: colors.textFaint, textAlign: 'center', paddingHorizontal: spacing.md},
});
