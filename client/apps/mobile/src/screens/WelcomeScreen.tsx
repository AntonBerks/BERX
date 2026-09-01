/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD TRANSFORMATION — the entry sequence, redesigned from
 * first principles (directive §12 "BERX Entry Experience", §13
 * "Registration is critical"). The previous version was a centered
 * wordmark + tagline + two stacked full-width buttons — a generic
 * app-splash composition. This is not a recolor of that layout: the
 * composition itself changed.
 *
 * What's different, concretely:
 * - Asymmetric, three-layer depth field (large glow bottom-left bleeds
 *   off-screen, a counter-glow top-right, a tight "core light" behind
 *   the wordmark) instead of the old top/bottom mirrored pair — reads
 *   as an environment with a real light source, not a decorative
 *   backdrop centered for its own sake.
 * - The wordmark emerges letter by letter (each glyph its own
 *   BerxFadeIn: fade + rise + real scale-in via the new scaleFrom
 *   prop), the X landing last and largest — an emblem assembling
 *   itself, not four characters of one static string appearing at
 *   once.
 * - Actions live inside a raised glass entry panel anchored at the
 *   bottom rather than floating bare in space — literal spatial
 *   hierarchy between "the world behind" and "the door in front of
 *   you" (directive §13: "the user should feel that they are
 *   entering a world, not filling out a form").
 *
 * Real device-time daypart palette (getBerxDaypartPalette(), now
 * shifted through the gold family — see tokens/index.ts) still drives
 * the glow/wordmark accent, same as before this pass.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography, radius, getBerxDaypartPalette} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

const daypart = getBerxDaypartPalette(new Date().getHours());
const LETTERS = ['B', 'E', 'R', 'X'];

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.screen}>
			{/* Depth field — three asymmetric light sources, not a mirrored pair. */}
			<View style={[styles.glowCore, {backgroundColor: daypart.accentSoft}]} />
			<View style={[styles.glowLarge, {backgroundColor: daypart.accentSoft}]} />
			<View style={[styles.glowSmall, {backgroundColor: daypart.accentSoft}]} />

			<View style={styles.center}>
				<View style={styles.wordmarkRow}>
					{LETTERS.map((letter, i) => {
						const isAccent = letter === 'X';
						return (
							// key lives on this host View, not on BerxFadeIn itself —
							// see BerxWayfinder.tsx's own header for why a locally
							// mapped custom component's `key` prop doesn't typecheck
							// cleanly in this sandbox's no-@types/react tsc setup.
							<View key={letter}>
								<BerxFadeIn delayMs={i * 110} riseFrom={30} scaleFrom={isAccent ? 0.7 : 0.85}>
									<Text
										style={[
											styles.wordmarkLetter,
											isAccent && [styles.wordmarkAccentLetter, {color: daypart.accent}],
										]}
									>
										{letter}
									</Text>
								</BerxFadeIn>
							</View>
						);
					})}
				</View>
				<BerxFadeIn delayMs={LETTERS.length * 110 + 100} riseFrom={16}>
					<Text style={styles.tagline}>Место, где люди находят впечатления</Text>
					<Text style={styles.daypart}>{daypart.label} · BERX уже рядом</Text>
				</BerxFadeIn>
			</View>

			<BerxFadeIn delayMs={LETTERS.length * 110 + 260} riseFrom={40} style={styles.panelWrap}>
				<BerxGlassSurface elevated padding="lg" style={styles.panel}>
					<Text style={styles.panelHint}>Войдите в мир BERX</Text>
					<View style={styles.actions}>
						<BerxButton label="Войти" onPress={onLogin} fullWidth />
						<BerxButton label="Регистрация" variant="secondary" onPress={onRegister} fullWidth />
					</View>
				</BerxGlassSurface>
			</BerxFadeIn>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, overflow: 'hidden'},
	glowCore: {
		position: 'absolute',
		top: '32%',
		left: '50%',
		marginLeft: -110,
		width: 220,
		height: 220,
		borderRadius: 110,
		opacity: 0.5,
	},
	glowLarge: {
		position: 'absolute',
		bottom: -180,
		left: -140,
		width: 420,
		height: 420,
		borderRadius: 210,
		opacity: 0.55,
	},
	glowSmall: {
		position: 'absolute',
		top: -80,
		right: -60,
		width: 200,
		height: 200,
		borderRadius: 100,
		opacity: 0.4,
	},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl},
	wordmarkRow: {flexDirection: 'row', alignItems: 'flex-end'},
	wordmarkLetter: {
		fontSize: 52,
		fontWeight: typography.weightBold,
		color: colors.text,
		letterSpacing: 1,
	},
	wordmarkAccentLetter: {
		fontSize: 62,
	},
	tagline: {fontSize: typography.sizeBase, color: colors.textDim, textAlign: 'center', marginTop: spacing.lg},
	daypart: {fontSize: typography.sizeXs, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, textAlign: 'center'},
	panelWrap: {paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl},
	panel: {borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg},
	panelHint: {fontSize: typography.sizeXs, color: colors.textFaint, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md},
	actions: {gap: spacing.md},
});
