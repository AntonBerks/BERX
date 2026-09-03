/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD REBUILD — was the old visual identity outright: the
 * header used to describe "orange glow" (a retired accent, gone
 * before this session), and the body never used real data at all —
 * two empty circular placeholders with no props to ever fill them,
 * static, no motion, a plain accent-soft glow behind static text.
 *
 * Real spatial 3D now carries the one real event this screen exists
 * to show: two identities, previously apart, meeting (BerxMatchScene
 * — see its own header for exactly why it draws two abstract identity
 * spheres rather than two photos: BERX Match's real backend withholds
 * profile photos until a separate consented grant flow, so a
 * fabricated face here would misrepresent a real privacy boundary,
 * not just look worse). No compatibility score is invented — the
 * convergence performs the one real fact available: a mutual like
 * just happened.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import BerxMatchScene from '../three/BerxMatchScene';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	otherUsername: string;
	onMessage: () => void;
	onContinueBrowsing: () => void;
}

export default function DatingMatchScreen({otherUsername, onMessage, onContinueBrowsing}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.screen}>
			<BerxFadeIn riseFrom={0} style={styles.sceneWrap}>
				<BerxMatchScene />
			</BerxFadeIn>

			<BerxFadeIn delayMs={180} style={styles.copy}>
				<Text style={styles.title}>Это совпадение!</Text>
				<Text style={styles.subtitle}>Вы понравились друг другу с {otherUsername}</Text>
			</BerxFadeIn>

			<BerxFadeIn delayMs={320} style={styles.actionsWrap}>
				<BerxGlassSurface padding="lg" style={styles.actions}>
					<BerxButton label="Написать" onPress={onMessage} fullWidth />
					<BerxButton label="Продолжить просмотр" variant="secondary" onPress={onContinueBrowsing} fullWidth />
				</BerxGlassSurface>
			</BerxFadeIn>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.bg,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
	},
	sceneWrap: {width: '76%', maxWidth: 320},
	copy: {alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl},
	title: {color: colors.accent, fontSize: typography.sizeHero, fontWeight: typography.weightBold, marginBottom: spacing.sm, textAlign: 'center'},
	subtitle: {color: colors.textDim, fontSize: typography.sizeBase, textAlign: 'center'},
	actionsWrap: {width: '100%'},
	actions: {width: '100%', gap: spacing.md},
});
