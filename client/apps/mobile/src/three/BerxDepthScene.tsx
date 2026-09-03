/**
 * BERX DEPTH SCENE — 2D spatial fallback.
 *
 * The web/harness half of the True3D/2D split. This file used to BE
 * the 3D scene, importing three/@react-three/fiber directly — which
 * meant the web harness bundled it against the GL stubs and rendered a
 * dead canvas, and native got the WEB fiber entry (wrong one). The
 * real GL scene now lives in BerxDepthScene.native.tsx; Metro picks
 * that up on iOS/Android and never sees this file, while the esbuild
 * harness (no `.native.` resolution) always lands here.
 *
 * This is a REAL fallback, not a placeholder: it encodes the exact
 * same idea the 3D scene does — a World's items placed by how
 * committed they are in time (Place anchors the centre; Experience,
 * then Event, then Plan recede outward) — using concentric depth rings
 * and real scale/opacity falloff instead of a GL camera. Same real
 * data, same meaning, cheaper renderer. A Plan still reads as the
 * loosest thing in the world: dashed, dimmest, furthest out.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxWorld, BerxWorldItem, BerxWorldItemType} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {useBerxColors} from '@berx/design-system/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

/** Same depth ordering the 3D scene uses — one source of meaning, two renderers. */
const DEPTH_BY_TYPE: Record<BerxWorldItemType, number> = {
	place: 0,
	experience: 0.6,
	event: 1.35,
	plan: 2.1,
};

const TYPE_LABEL: Record<BerxWorldItemType, string> = {
	place: 'Место',
	event: 'Событие',
	plan: 'План',
	experience: 'Впечатление',
};

const BOX = 300;
const MAX_DEPTH = 2.1;

interface Props {
	world: BerxWorld;
}

export default function BerxDepthScene({world}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const items = world.items.slice(0, 12);

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox}>
				{/* The World's boundary — the 2D counterpart of the 3D shell's
				    crossed rings, so the cluster reads as contained. */}
				{items.length > 0 ? (
					<>
						<View style={[styles.ring, styles.ringOuter]} />
						<View style={[styles.ring, styles.ringInner]} />
					</>
				) : null}

				{items.length === 0 ? (
					<View style={styles.emptyNode} />
				) : (
					items.map((item: BerxWorldItem, i: number) => {
						const z = DEPTH_BY_TYPE[item.item_type];
						// Depth -> position/scale/opacity: further out is smaller and
						// dimmer, the same falloff a real camera would give it.
						const t = z / MAX_DEPTH;
						const angle = (i / Math.max(items.length, 1)) * Math.PI * 2;
						const orbit = (BOX * 0.16) + z * (BOX * 0.09);
						const size = 22 - t * 8;
						const isPlan = item.item_type === 'plan';
						return (
							<View
								key={`${item.item_type}-${item.item_id}`}
								style={[
									styles.node,
									{
										width: size,
										height: size,
										borderRadius: size / 2,
										opacity: 1 - t * 0.55,
										transform: [
											{translateX: Math.cos(angle) * orbit},
											{translateY: Math.sin(angle) * orbit * 0.32},
										],
									},
									isPlan && styles.nodePlan,
								]}
							/>
						);
					})
				)}
			</View>
			<Text style={styles.hint}>Глубина: чем дальше — тем менее закреплено во времени</Text>
			{world.items.length > 0 ? (
				<View style={styles.legend}>
					{world.items.map((item: BerxWorldItem) => (
						<View key={`${item.item_type}-${item.item_id}`} style={styles.legendRow}>
							<View style={[styles.legendDot, item.item_type === 'plan' && styles.legendDotPlan]} />
							<Text style={styles.legendType}>{TYPE_LABEL[item.item_type]}</Text>
							<Text style={styles.legendTitle} numberOfLines={1}>{item.title ?? `#${item.item_id}`}</Text>
						</View>
					))}
				</View>
			) : null}
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
	ring: {position: 'absolute', borderWidth: 1, borderColor: colors.accent},
	ringOuter: {width: BOX * 0.78, height: BOX * 0.34, borderRadius: BOX * 0.39, opacity: 0.22},
	ringInner: {width: BOX * 0.52, height: BOX * 0.23, borderRadius: BOX * 0.26, opacity: 0.16},
	node: {position: 'absolute', backgroundColor: colors.accent},
	nodePlan: {backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent},
	emptyNode: {width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, opacity: 0.9},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
	legend: {gap: spacing.xs},
	legendRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	legendDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
	legendDotPlan: {backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent},
	legendType: {color: colors.textFaint, fontSize: typography.sizeXs, width: 90},
	legendTitle: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
});
