/**
 * BERX TRIP SCENE — real native 3D. An itinerary as real depth.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * See BERX_DECISIONS.md ("3D / spatial rendering"). Nothing here has
 * been run on a GL context.
 *
 * WHY THIS IS 3D WITH PURPOSE. `BerxTripStop.day_number` is a real,
 * server-assigned field (components/OssnApi/v1/trips.php) — literally
 * which day of the trip each stop belongs to. That is an honest
 * SEQUENCE, the same category of real fact BerxTimelineScene renders
 * for Life Graph (there: recency; here: itinerary order) and
 * BerxDepthScene renders for Worlds (there: commitment). So z is
 * day_number: Day 1 sits nearest the camera, later days recede.
 * Stops sharing a day sit at the SAME depth, arranged in a small row —
 * they belong to one day, not to a ranking within it (there is no
 * real intra-day order field, so none is invented).
 *
 * A thin ring at each real day's depth is the one purely-structural
 * addition: it marks where one day ends and the next begins, the same
 * role BerxDepthScene's WorldShell plays for its own real boundary.
 *
 * Interaction: dragging dollies the camera ALONG the day axis — the
 * same real camera-translation-through-the-scene BerxTimelineScene
 * uses, because a trip's days ARE a sequence you move through, not a
 * cluster you orbit. Clamped to the real number of days — you cannot
 * travel past the trip's actual last day.
 */
import {useRef} from 'react';
import type {MutableRefObject} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {RootState} from '@react-three/fiber/native';
import type {Group} from 'three';
import type {BerxTripStop} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {SpatialStage} from '@berx/design-system/spatial/engine/SpatialStage';
import {useSpatialGlass} from '@berx/design-system/spatial/engine/quality';
import {useSpatialDrag} from '@berx/design-system/spatial/engine/useSpatialDrag';
import {SPATIAL_KEY_LIGHT, SPATIAL_FILL_LIGHT, SPATIAL_EMISSIVE, SPATIAL_MOTION} from '@berx/design-system/spatial/engine/stage';

const DAY_SPACING = 1.5;
const MAX_STOPS = 40;

/** One day's ring — the real boundary between it and the next. */
function DayRing({z}: {z: number}) {
	return (
		<mesh position={[0, 0, -z]} rotation={[Math.PI / 2, 0, 0]}>
			<torusGeometry args={[0.85, 0.004, 8, 48]} />
			<meshBasicMaterial color={SPATIAL_KEY_LIGHT} transparent opacity={0.22} />
		</mesh>
	);
}

function StopNode({x, z, isEvent, index}: {x: number; z: number; isEvent: boolean; index: number}) {
	const ref = useRef<Group>(null);
	// The one BERX glass recipe, at whatever tier the stage resolved.
	const glass = useSpatialGlass();
	useFrame((state: RootState) => {
		if (!ref.current) return;
		ref.current.rotation.y = state.clock.elapsedTime * SPATIAL_MOTION.driftRadPerSec + index;
	});
	return (
		<group ref={ref} position={[x, 0, -z]}>
			<mesh>
				{isEvent ? <boxGeometry args={[0.16, 0.16, 0.16]} /> : <sphereGeometry args={[0.11, 32, 32]} />}
				{/* Physical, not standard: these stops are the same dark BERX
				    glass as every other object in the app, so light passes
				    through them and picks up the attenuation tint on the way. */}
				<meshPhysicalMaterial
					{...glass}
					color={isEvent ? SPATIAL_FILL_LIGHT : SPATIAL_KEY_LIGHT}
					emissive={SPATIAL_KEY_LIGHT}
					emissiveIntensity={SPATIAL_EMISSIVE.present}
				/>
			</mesh>
		</group>
	);
}

function Scene({days, dollyRef, advance}: {days: [number, BerxTripStop[]][]; dollyRef: MutableRefObject<number>; advance: (d: number) => void}) {
	useFrame((state: RootState, delta: number) => {
		// Momentum is advanced here rather than in its own loop, so the
		// coast after a flick is in lockstep with the frames drawing it.
		advance(delta);
		state.camera.position.z = 2.4 - dollyRef.current;
		state.camera.lookAt(0, 0, state.camera.position.z - 3);
	});

	const minDay = days.length > 0 ? days[0][0] : 0;
	let nodeIndex = 0;

	return (
		<>
			{days.map(([day, stops]) => {
				const z = (day - minDay) * DAY_SPACING;
				return (
					<group key={day}>
						<DayRing z={z} />
						{stops.slice(0, MAX_STOPS).map((s: BerxTripStop, i: number) => {
							const spread = (i - (stops.length - 1) / 2) * 0.36;
							nodeIndex += 1;
							return <StopNode key={s.stop_id} x={spread} z={z} isEvent={s.item_type !== 'place'} index={nodeIndex} />;
						})}
					</group>
				);
			})}
		</>
	);
}

interface Props {
	days: [number, BerxTripStop[]][];
}

export default function BerxTripScene({days}: Props) {
	// Travel along the itinerary now carries momentum: a flick coasts
	// through the days and decelerates, instead of stopping the instant
	// the finger leaves the glass. Still clamped to the trip's REAL day
	// count in both directions — coasting cannot invent a Day 9.
	const {panHandlers, valueRef: dollyRef, advance} = useSpatialDrag({
		sensitivity: 0.02,
		min: 0,
		max: Math.max(days.length - 1, 0) * DAY_SPACING,
		invert: true,
	});

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox} {...panHandlers}>
				<SpatialStage camera="scene" style={StyleSheet.absoluteFillObject as never}>
					<Scene days={days} dollyRef={dollyRef} advance={advance} />
				</SpatialStage>
			</View>
			<Text style={styles.hint}>Проведите пальцем — камера движется по дням маршрута</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {
		height: 280,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.bg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
});
