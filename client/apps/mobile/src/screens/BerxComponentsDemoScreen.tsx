/**
 * BERX PREMIUM COMPONENTS DEMO — a real showcase, not a storybook mock.
 *
 * Exercises all four new base components (BerxGlassView,
 * BerxAnimatedButton, BerxParticleSystem, BerxSpatialCard) together on
 * one screen, wired to the SAME live theme every real screen reads, so
 * switching mode/accent in Settings and returning here shows them
 * reacting exactly as any other screen would — the point of building
 * them on top of the theme system rather than beside it.
 */
import {useState} from 'react';
import {ScrollView, Text, View, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxGlassView} from '../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../packages/design-system/src/components/BerxParticleSystem';
import {BerxSpatialCard} from '../../../../packages/design-system/src/components/BerxSpatialCard';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

function SectionLabel({children}: {children: string}) {
	const colors = useBerxColors();
	return <Text style={{color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm}}>{children}</Text>;
}

export default function BerxComponentsDemoScreen() {
	const colors = useBerxColors();
	const styles = buildStyles(colors);
	const [likeBurst, setLikeBurst] = useState(false);
	const [iconActive, setIconActive] = useState(false);

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<Text style={styles.title}>Премиальные компоненты</Text>

			<SectionLabel>GlassView</SectionLabel>
			<View style={styles.row}>
				<BerxGlassView style={styles.glassDemo}>
					<Text style={styles.body}>Обычное стекло</Text>
				</BerxGlassView>
				<BerxGlassView style={styles.glassDemo} glow intensity={35}>
					<Text style={styles.body}>Со свечением</Text>
				</BerxGlassView>
			</View>
			<BerxGlassView style={styles.glassWide} onPress={() => undefined}>
				<Text style={styles.body}>Нажимаемая панель — попробуйте нажать</Text>
			</BerxGlassView>

			<SectionLabel>AnimatedButton</SectionLabel>
			<View style={styles.gap}>
				<BerxAnimatedButton variant="primary" title="Основная кнопка" onPress={() => undefined} />
				<BerxAnimatedButton variant="primary" title="Премиум" premium onPress={() => undefined} />
				<BerxAnimatedButton variant="secondary" title="Вторичная кнопка" onPress={() => undefined} />
				<View style={styles.iconRow}>
					<BerxAnimatedButton variant="icon" icon={<BerxIcon name="heart" size={22} color={colors.textDim} filled={iconActive} />} active={iconActive} onPress={() => setIconActive((v) => !v)} />
					<BerxAnimatedButton variant="icon" icon={<BerxIcon name="plus" size={22} color={colors.text} />} onPress={() => undefined} />
					<BerxAnimatedButton variant="icon" icon={<BerxIcon name="share-2" size={22} color={colors.text} />} disabled onPress={() => undefined} />
				</View>
			</View>

			<SectionLabel>ParticleSystem</SectionLabel>
			<BerxGlassView style={styles.particleDemo} onPress={() => setLikeBurst((v) => !v)}>
				<BerxParticleSystem trigger={likeBurst} count={26} duration={900} spread={140} speed={140} />
				<BerxIcon name="heart" size={32} color={colors.accent} filled />
				<Text style={styles.hint}>Нажмите для эффекта</Text>
			</BerxGlassView>

			<SectionLabel>SpatialCard</SectionLabel>
			<BerxSpatialCard height={160} onPress={() => undefined} style={styles.spatialCard}>
				<View style={styles.spatialCardContent}>
					<Text style={styles.body}>Карточка с параллаксом и наклоном</Text>
					<Text style={styles.hint}>Проведите пальцем / курсором по карточке</Text>
				</View>
			</BerxSpatialCard>
		</ScrollView>
	);
}

function buildStyles(colors: BerxColorTokens) {
	// A plain function (not useMemo) is intentional here — this demo
	// screen re-renders rarely and the style cost is trivial; every
	// OTHER screen's makeStyles(colors) pattern uses useMemo for real
	// screens with real render frequency, which this demo does not need
	// to match to still be a real, correctly-themed showcase.
	return StyleSheet.create({
		screen: {flex: 1, backgroundColor: colors.bg},
		content: {padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl},
		title: {color: colors.text, fontSize: typography.sizeTitle, fontWeight: typography.weightBold},
		row: {flexDirection: 'row', gap: spacing.md},
		gap: {gap: spacing.md},
		glassDemo: {flex: 1, minHeight: 90, alignItems: 'center', justifyContent: 'center'},
		glassWide: {minHeight: 64, alignItems: 'center', justifyContent: 'center'},
		particleDemo: {minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
		body: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium, textAlign: 'center'},
		hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
		iconRow: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs},
		spatialCard: {width: '100%'},
		spatialCardContent: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs},
	});
}
