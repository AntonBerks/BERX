/**
 * BERX DEPTH SCENE — real native 3D. A World's real contents, placed
 * in real depth.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * See SpatialStage.native.tsx's header for the full, evidence-based
 * status (deps satisfied on disk; no ios/ or android/ project exists in
 * this repo and no native toolchain in this container, so nothing here
 * has been run).
 *
 * WHAT WAS WRONG BEFORE, and is fixed here:
 *   1. It imported `@react-three/fiber` — the WEB entry — in a file
 *      meant for native. Native must import `@react-three/fiber/native`
 *      (that's the entry that wires expo-gl's GL context). The old
 *      import would not have produced a working native canvas.
 *   2. It hardcoded a warm-gold palette (#D9A93F) from the retired
 *      gold-accent era. BERX has one accent, cyan #4FD6E8, and this
 *      scene is now lit by it like everything else.
 *   3. It was a single .tsx, so the web harness bundled it against the
 *      three/expo-gl stubs and rendered a dead canvas. It is now a
 *      real True3D/2D split: this file is native-only, and
 *      BerxDepthScene.tsx draws a real 2D depth fallback.
 *
 * WHAT THE SCENE MEANS (3D with purpose — master directive §9): a
 * World's real items are placed at a depth per item_type that encodes
 * the same "how committed is this, in time" idea the object model
 * itself carries — a real Place anchors the scene at z=0; an
 * Experience sits just off it; an Event sits further out (scheduled,
 * not yet checkpointed); a Plan sits furthest out and renders as a dim
 * wireframe, because it has no fixed place or time yet. Depth here is
 * DATA, not decoration.
 *
 * Drag horizontally to orbit the cluster — one real gesture via RN's
 * own PanResponder driving the group's rotation each frame through
 * useFrame. Real camera-relative motion, not a CSS trick.
 */
import {useMemo, useRef} from 'react';
import type {MutableRefObject} from 'react';
import {View, PanResponder, StyleSheet, Text, GestureResponderEvent, PanResponderGestureState} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {RootState} from '@react-three/fiber/native';
import type {Group, Mesh} from 'three';
import type {BerxWorld, BerxWorldItem, BerxWorldItemType} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {SpatialStage} from '@berx/design-system/spatial/engine/SpatialStage';
import {
	SPATIAL_KEY_LIGHT,
	SPATIAL_FILL_LIGHT,
	SPATIAL_EMISSIVE,
	SPATIAL_MOTION,
} from '@berx/design-system/spatial/engine/stage';

/**
 * Depth per item_type — the same "how real, how committed" idea the
 * object model itself encodes (see classes/OssnPlans.php,
 * classes/OssnWorlds.php): a Place is the anchor; further out is
 * looser / less yet-confirmed.
 */
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

function ItemNode({item, index, total}: {item: BerxWorldItem; index: number; total: number}) {
	const ref = useRef<Mesh>(null);
	const z = DEPTH_BY_TYPE[item.item_type];
	const angle = (index / Math.max(total, 1)) * Math.PI * 2;
	const orbit = 1.5 + z * 0.35;
	const x = Math.cos(angle) * orbit;
	const y = Math.sin(angle) * orbit * 0.32;
	const isPlan = item.item_type === 'plan';

	useFrame((state: RootState) => {
		if (!ref.current) return;
		ref.current.rotation.y = state.clock.elapsedTime * SPATIAL_MOTION.turnRadPerSec * 3.5 + index;
		ref.current.rotation.x = state.clock.elapsedTime * SPATIAL_MOTION.driftRadPerSec * 3.5;
		if (isPlan) {
			// A Plan has no fixed place or time — the one node allowed to drift.
			ref.current.position.y = y + Math.sin(state.clock.elapsedTime * 1.4 + index) * 0.07;
		}
	});

	return (
		<mesh ref={ref} position={[x, y, z]}>
			<octahedronGeometry args={[0.22, 0]} />
			<meshStandardMaterial
				color={isPlan ? SPATIAL_FILL_LIGHT : SPATIAL_KEY_LIGHT}
				emissive={SPATIAL_KEY_LIGHT}
				emissiveIntensity={isPlan ? SPATIAL_EMISSIVE.dormant : SPATIAL_EMISSIVE.present}
				wireframe={isPlan}
				transparent
				opacity={isPlan ? 0.6 : 0.94}
			/>
		</mesh>
	);
}

/** Two crossed rings — the World's own boundary, so the cluster reads as contained rather than floating in nothing. */
function WorldShell() {
	return (
		<>
			<mesh rotation={[Math.PI / 2.4, 0, 0]}>
				<torusGeometry args={[2.3, 0.006, 8, 64]} />
				<meshBasicMaterial color={SPATIAL_KEY_LIGHT} transparent opacity={0.22} />
			</mesh>
			<mesh rotation={[0, Math.PI / 2.4, 0]}>
				<torusGeometry args={[2.05, 0.006, 8, 64]} />
				<meshBasicMaterial color={SPATIAL_KEY_LIGHT} transparent opacity={0.17} />
			</mesh>
		</>
	);
}

function Scene({items, rotationRef}: {items: BerxWorldItem[]; rotationRef: MutableRefObject<number>}) {
	const groupRef = useRef<Group>(null);
	useFrame(() => {
		if (groupRef.current) groupRef.current.rotation.y = rotationRef.current;
	});
	return (
		<>
			{/* The ground plane grid — a real horizon so depth has somewhere to recede to. */}
			<gridHelper args={[10, 20, SPATIAL_KEY_LIGHT, '#12181F']} position={[0, -1.2, 0]} />
			<group ref={groupRef}>
				{items.length > 0 ? <WorldShell /> : null}
				{items.length > 0 ? (
					items.slice(0, 12).map((item, i) => (
						<ItemNode key={`${item.item_type}-${item.item_id}`} item={item} index={i} total={Math.min(items.length, 12)} />
					))
				) : (
					<mesh>
						<octahedronGeometry args={[0.24, 0]} />
						<meshStandardMaterial color={SPATIAL_KEY_LIGHT} emissive={SPATIAL_KEY_LIGHT} emissiveIntensity={SPATIAL_EMISSIVE.present} />
					</mesh>
				)}
			</group>
		</>
	);
}

interface Props {
	world: BerxWorld;
}

export default function BerxDepthScene({world}: Props) {
	const rotationRef = useRef(0);
	const lastDx = useRef(0);

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onPanResponderGrant: () => {
					lastDx.current = 0;
				},
				onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
					rotationRef.current += (gesture.dx - lastDx.current) * 0.008;
					lastDx.current = gesture.dx;
				},
			}),
		[]
	);

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox} {...panResponder.panHandlers}>
				{/* One shared stage: BERX's camera language and three-point rig,
				    not a scene-local set of lights. */}
				<SpatialStage camera="scene" style={StyleSheet.absoluteFillObject as never}>
					<Scene items={world.items} rotationRef={rotationRef} />
				</SpatialStage>
			</View>
			<Text style={styles.hint}>Проведите пальцем — сцена повернётся вокруг мира</Text>
			{world.items.length > 0 ? (
				<View style={styles.legend}>
					{world.items.map((item) => (
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

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {height: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderSoft},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
	legend: {gap: spacing.xs},
	legendRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	legendDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
	legendDotPlan: {backgroundColor: colors.textFaint, borderWidth: 1, borderColor: colors.accent},
	legendType: {color: colors.textFaint, fontSize: typography.sizeXs, width: 90},
	legendTitle: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
});
