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
import {BerxPrimaryAction, BerxQuietAction} from '../../../../packages/design-system/src/components/BerxActions';
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
				<Text style={styles.title}>Это совпадение</Text>
				{/* The one accent word on the screen is the person's name — the
				    only part of this sentence that is actually about them. */}
				<Text style={styles.subtitle}>
					Вы понравились друг другу с <Text style={styles.subtitleName}>{otherUsername}</Text>
				</Text>
			</BerxFadeIn>

			<BerxFadeIn delayMs={320} style={styles.actionsWrap}>
				{/* No glass box around the actions. It drew a rectangle around
				    two buttons that were already complete objects, and put a
				    second container edge inside a screen that has no other
				    edges — the primary action IS the emphasis. Same pair
				    Welcome uses, so the product's first screen and its most
				    emotional one speak with one control language. */}
				<BerxPrimaryAction label="Написать" onPress={onMessage} />
				<BerxQuietAction label="Продолжить просмотр" onPress={onContinueBrowsing} />
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
	// White, not accent. A hero-sized headline in the brand colour spends
	// the entire accent budget of the screen on decoration, and then the
	// primary action — the thing the user is actually meant to press —
	// has to compete with it in the same colour. The headline is the
	// event; the accent belongs on the button. (Same rule WelcomeScreen's
	// header states: worth more spent on one word than smeared over a
	// template.) Dropped the exclamation mark with it: the composition
	// already carries the moment.
	title: {color: colors.text, fontSize: typography.sizeHero, fontWeight: typography.weightBold, letterSpacing: -1, marginBottom: spacing.sm, textAlign: 'center'},
	subtitle: {color: colors.textDim, fontSize: typography.sizeBase, lineHeight: 22, textAlign: 'center'},
	subtitleName: {color: colors.accent, fontWeight: typography.weightMedium},
	actionsWrap: {width: '100%', gap: spacing.sm},
});
