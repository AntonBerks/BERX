/**
 * BERX TIMELINE SCENE — 2D spatial fallback.
 *
 * The web/harness half of the True3D/2D split (Metro takes
 * BerxTimelineScene.native.tsx on iOS/Android; the esbuild harness has
 * no `.native.` resolution and always lands here).
 *
 * A real fallback, not a placeholder: it carries the same idea the GL
 * scene does — time as depth — using the one thing 2D genuinely has,
 * which is perspective foreshortening faked by scale and opacity.
 * Recent events are large, bright and wide; older ones step smaller,
 * dimmer and narrower toward a vanishing point, alternating sides of a
 * central axis exactly as the 3D nodes do. Reward edges (a real
 * `amount`) stay the brighter, smaller mark in both renderers.
 *
 * Every node is one real BerxLifeGraphEdge. Nothing is invented to
 * fill the frame — an empty history renders an empty axis and says so.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxLifeGraphEdge} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {useBerxColors} from '@berx/design-system/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const BOX = 300;
/** Matches the native scene's own node cap. */
const MAX_NODES = 40;
/** How many are actually legible in 300px of 2D depth before they stack into mush. */
const VISIBLE = 9;

interface Props {
	edges: BerxLifeGraphEdge[];
}

export default function BerxTimelineScene({edges}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const shown = edges.slice(0, Math.min(VISIBLE, MAX_NODES));

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox}>
				{/* The time axis — the same single line the 3D scene recedes along. */}
				<View style={styles.axis} />
				{shown.map((edge: BerxLifeGraphEdge, i: number) => {
					// Depth 0..1, near -> far. Same alternating sides as the 3D nodes.
					const t = shown.length > 1 ? i / (shown.length - 1) : 0;
					const side = i % 2 === 0 ? 1 : -1;
					const isReward = typeof edge.amount === 'number';
					const size = (isReward ? 12 : 18) * (1 - t * 0.6);
					const offset = side * (BOX * 0.16) * (1 - t * 0.55);
					return (
						<View
							key={`${edge.type}-${edge.target_guid ?? i}-${edge.time}`}
							style={[
								styles.node,
								{
									width: size,
									height: size,
									borderRadius: isReward ? size / 2 : 3,
									opacity: 1 - t * 0.62,
									transform: [
										{translateX: offset},
										// Further back = higher in frame, the 2D read of "receding".
										{translateY: -t * (BOX * 0.30) + BOX * 0.10},
									],
								},
								isReward && styles.nodeReward,
							]}
						/>
					);
				})}
				{shown.length === 0 ? <Text style={styles.empty}>История пока пуста</Text> : null}
			</View>
			<Text style={styles.hint}>Глубина — это время: ближе к вам то, что произошло недавно</Text>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {
		height: BOX,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.bg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	axis: {position: 'absolute', width: 1, height: BOX * 0.62, backgroundColor: colors.accent, opacity: 0.3},
	node: {position: 'absolute', backgroundColor: colors.accent},
	nodeReward: {backgroundColor: colors.white},
	empty: {color: colors.textFaint, fontSize: typography.sizeSm},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
});
