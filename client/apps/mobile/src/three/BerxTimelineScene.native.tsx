/**
 * BERX TIMELINE SCENE — real native 3D. Your history, with time as
 * actual depth.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * See BERX_DECISIONS.md ("3D / spatial rendering") for the precise,
 * evidence-based native-build status. Nothing here has been run.
 *
 * WHY THIS IS 3D AND NOT DECORATION (master directive §9). Depth here
 * IS the data: z is time. The most recent thing you did sits at the
 * camera; older events recede down the axis, getting smaller and
 * dimmer exactly as distance would make them. That is the one shape a
 * flat list genuinely cannot show — a list tells you the ORDER of your
 * history, this tells you its SHAPE: where the dense bursts were, how
 * long the quiet stretches ran, how far back the whole thing goes.
 * Nothing is invented to fill the scene; every node is one real
 * BerxLifeGraphEdge the server returned.
 *
 * Drag horizontally to dolly the camera ALONG the time axis — real
 * camera translation through the scene, which is what "moving through
 * your history" should feel like. The gesture is RN's own
 * PanResponder (no gesture library), driving camera.position.z each
 * frame via useFrame.
 *
 * Reward edges (those carrying a real `amount`) render as a brighter,
 * smaller node: they are moments the system gave you something, not
 * places you went, and they should not read as equal in weight to a
 * real visit.
 */
import {useRef} from 'react';
import type {MutableRefObject} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {RootState} from '@react-three/fiber/native';
import type {Group} from 'three';
import type {BerxLifeGraphEdge} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {SpatialStage} from '@berx/design-system/spatial/engine/SpatialStage';
import {useSpatialGlass} from '@berx/design-system/spatial/engine/quality';
import {useSpatialDrag} from '@berx/design-system/spatial/engine/useSpatialDrag';
import {
	SPATIAL_KEY_LIGHT,
	SPATIAL_FILL_LIGHT,
	SPATIAL_EMISSIVE,
	SPATIAL_MOTION,
} from '@berx/design-system/spatial/engine/stage';

/** How far apart consecutive events sit on the time axis, in world units. */
const SPACING_Z = 0.85;
/** Cap the node count so a long history can't uncap the frame cost. */
const MAX_NODES = 40;

function EventNode({edge, index}: {edge: BerxLifeGraphEdge; index: number}) {
	const ref = useRef<Group>(null);
	const isReward = typeof edge.amount === 'number';
	// Alternate sides of the axis so nodes never occlude each other
	// straight down the barrel of the camera.
	const side = index % 2 === 0 ? 1 : -1;
	const x = side * (0.55 + (index % 3) * 0.12);
	const z = -index * SPACING_Z;

	const glass = useSpatialGlass();

	useFrame((state: RootState) => {
		if (!ref.current) return;
		ref.current.rotation.y = state.clock.elapsedTime * SPATIAL_MOTION.driftRadPerSec + index;
	});

	return (
		<group ref={ref} position={[x, 0, z]}>
			<mesh>
				{isReward ? <octahedronGeometry args={[0.1, 0]} /> : <boxGeometry args={[0.18, 0.18, 0.18]} />}
				{/* Same BERX glass as every other object in the app — a reward
				    and a visit differ in emissive strength and silhouette, not
				    in what they are made of. */}
				<meshPhysicalMaterial
					{...glass}
					color={isReward ? SPATIAL_KEY_LIGHT : SPATIAL_FILL_LIGHT}
					emissive={SPATIAL_KEY_LIGHT}
					emissiveIntensity={isReward ? SPATIAL_EMISSIVE.live : SPATIAL_EMISSIVE.quiet}
				/>
			</mesh>
			{/* A stem down to the axis, so each event reads as attached to the
			    timeline rather than floating loose beside it. */}
			<mesh position={[-x / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.004, 0.004, Math.abs(x), 6]} />
				<meshBasicMaterial color={SPATIAL_KEY_LIGHT} transparent opacity={0.28} />
			</mesh>
		</group>
	);
}

/** The time axis itself — one long line receding from the camera into the past. */
function TimeAxis({length}: {length: number}) {
	return (
		<mesh position={[0, 0, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.008, 0.008, length, 8]} />
			<meshBasicMaterial color={SPATIAL_KEY_LIGHT} transparent opacity={0.35} />
		</mesh>
	);
}

function Scene({edges, dollyRef, advance}: {edges: BerxLifeGraphEdge[]; dollyRef: MutableRefObject<number>; advance: (d: number) => void}) {
	// Real camera translation along the time axis — the user is moving
	// THROUGH their history, not spinning it in front of them.
	useFrame((state: RootState, delta: number) => {
		advance(delta);
		state.camera.position.z = 2.2 - dollyRef.current;
		state.camera.lookAt(0, 0, state.camera.position.z - 3);
	});
	const length = Math.max(edges.length, 1) * SPACING_Z + 2;
	return (
		<>
			<TimeAxis length={length} />
			{edges.map((edge: BerxLifeGraphEdge, i: number) => (
				<EventNode key={`${edge.type}-${edge.target_guid ?? i}-${edge.time}`} edge={edge} index={i} />
			))}
		</>
	);
}

interface Props {
	edges: BerxLifeGraphEdge[];
}

export default function BerxTimelineScene({edges}: Props) {
	const shown = edges.slice(0, MAX_NODES);
	// A flick now coasts back through history and decelerates, instead of
	// stopping the instant the finger lifts. Still clamped to the REAL
	// extent of the REAL history: momentum cannot carry the camera past
	// the beginning or the end of what actually happened, and hitting
	// either end kills the velocity rather than bouncing off it.
	const {panHandlers, valueRef: dollyRef, advance} = useSpatialDrag({
		sensitivity: 0.02,
		min: 0,
		max: Math.max(shown.length - 1, 0) * SPACING_Z,
		invert: true,
	});

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox} {...panHandlers}>
				<SpatialStage camera="scene" style={StyleSheet.absoluteFillObject as never}>
					<Scene edges={shown} dollyRef={dollyRef} advance={advance} />
				</SpatialStage>
			</View>
			<Text style={styles.hint}>Проведите пальцем — камера движется вглубь вашей истории</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {
		height: 300,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.bg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
});
