/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX ENTRY — the visual benchmark for the whole product.
 *
 * The priority order this screen is built to, in order, is:
 * composition, media, lighting, depth, glass, typography, 3D,
 * controls. 3D is a material inside the design, not the design.
 *
 * WHAT THE PREVIOUS TWO VERSIONS GOT WRONG, so neither returns:
 *
 * 1. Flat black. Before there were real gradients, the "glow" was a
 *    low-opacity circle, so the screen was black with a cyan wordmark
 *    on it — nothing was lit because nothing could be.
 * 2. Flat teal. The first light field used four stops with 45% of peak
 *    still at 45% of the radius, and four large sources stacked into an
 *    even fog that filled the frame. Light everywhere reads exactly
 *    like light nowhere; the screen got BRIGHTER and no less flat.
 *
 * What is here instead: one dominant key low-left with real (1-t)^k
 *  falloff and a vignette pulling the corners back to near-black, so
 * there is dark for the light to be light against; original horizon
 * geometry (BerxHorizon) giving the frame receding distance a gradient
 * cannot; grain over all of it so the ramps read as air; the BERX
 * object standing IN that light rather than floating on a backdrop;
 * and editorial left-aligned display type instead of a centred
 * wordmark stack.
 *
 * There is no photograph here and no placeholder standing in for one:
 * this screen runs before any account exists, so there is no user
 * media, and every field the API serves is behind a bearer token
 * (components/OssnApi/ossn_com.php gates every resource except
 * `auth`). The ground is therefore original artwork drawn at runtime,
 * not stock imagery and not a grey box.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography, getBerxDaypartPalette} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {BerxEmblem} from '../../../../packages/design-system/src/components/BerxEmblem';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	onLogin: () => void;
	onRegister: () => void;
}

const daypart = getBerxDaypartPalette(new Date().getHours());

export default function WelcomeScreen({onLogin, onRegister}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<BerxStage depth={0} seed={19}>
			{/* The object sits high and off-centre, in the light, above the
			    ridge line — not centred over its own wordmark. */}
			<BerxFadeIn riseFrom={26} scaleFrom={0.84} style={styles.objectSlot}>
				<BerxEmblem size={168} light={colors.accent} />
			</BerxFadeIn>

			{/* Editorial block, bottom-left. A centred wordmark stack is the
			    generic app splash this screen exists to stop being. */}
			<View style={styles.copy}>
				<BerxFadeIn delayMs={220} riseFrom={22}>
					<Text style={styles.eyebrow}>{daypart.label} · BERX</Text>
				</BerxFadeIn>
				<BerxFadeIn delayMs={320} riseFrom={30}>
					<Text style={styles.display}>Мир,</Text>
					<Text style={styles.display}>который</Text>
					<Text style={[styles.display, styles.displayAccent]}>вы найдёте</Text>
				</BerxFadeIn>
				<BerxFadeIn delayMs={460} riseFrom={18}>
					<Text style={styles.tagline}>Места, события и люди вокруг вас — в одном месте.</Text>
				</BerxFadeIn>
			</View>

			{/* CONTROLS — quiet, last in the hierarchy, on the dark floor
			    rather than inside a glass card competing with the sky. */}
			<BerxFadeIn delayMs={600} riseFrom={34} style={styles.actions}>
				<BerxButton label="Создать аккаунт" onPress={onRegister} fullWidth />
				<BerxButton label="У меня уже есть BERX" variant="secondary" onPress={onLogin} fullWidth />
			</BerxFadeIn>
		</BerxStage>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	// The object stands in the sky above the horizon, off-centre and
	// large enough to be the focal point — not a small mark parked in a
	// corner of dead space.
	objectSlot: {position: 'absolute', top: '18%', right: '8%'},
	copy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 236},
	eyebrow: {
		fontSize: typography.sizeXs,
		color: colors.accentOnMedia,
		textTransform: 'uppercase',
		letterSpacing: 2.4,
		marginBottom: spacing.md,
	},
	display: {
		fontSize: 46,
		lineHeight: 50,
		fontWeight: typography.weightBold,
		color: colors.onMedia,
		letterSpacing: -1.6,
	},
	displayAccent: {color: colors.accentOnMedia},
	tagline: {
		fontSize: typography.sizeBase,
		lineHeight: 22,
		color: colors.onMediaDim,
		marginTop: spacing.lg,
		maxWidth: 280,
	},
	actions: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl, gap: spacing.sm},
});
