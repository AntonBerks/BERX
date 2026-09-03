/**
 * BERX MATCH SCENE — real native 3D. The moment a mutual match becomes
 * real, rendered as two identities actually meeting.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * See BERX_DECISIONS.md ("3D / spatial rendering"). Nothing here has
 * been run on a GL context.
 *
 * WHY THIS IS 3D WITH PURPOSE, AND WHY IT IS TWO ORBS, NOT TWO FACES.
 *
 * BERX Match's real backend keeps profile photos server-side private
 * until a separate photo-request/grant flow is used — see
 * DatingDiscoverScreen's own header. At the moment a match happens,
 * this screen has real identities (two real guids, a real mutual
 * like just recorded server-side) but NO consented photo for the
 * other person. Rendering a fabricated face, or reusing a stock
 * silhouette as if it were their photo, would misrepresent a real
 * privacy boundary the backend enforces on purpose. So both people are
 * drawn the same way BERX already draws "an identity" elsewhere
 * (BerxOrb/SpatialHero — the same object PROFILE/BERX ID uses): a lit
 * glass sphere. Two real identities, honestly not-yet-pictured.
 *
 * THE EVENT ITSELF is the one real thing this scene has to show, and
 * depth is what makes it legible: the two identities start apart
 * along Z — one at the camera (you), one deep in the scene (them) —
 * and travel toward each other in real time, meeting at the midpoint.
 * No compatibility score, no invented "match strength" is rendered;
 * the only real fact is that a mutual like just happened, which is
 * exactly what the convergence performs.
 *
 * Deceleration only, same rule SpatialEmblemReveal's own header
 * states: the two spheres ease into contact and settle — they do not
 * overshoot or bounce, which would read as a toy.
 */
import {useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {Mesh} from 'three';
import {SpatialStage} from '@berx/design-system/spatial/engine/SpatialStage';
import {useSpatialGlass, useSpatialKeyLight} from '@berx/design-system/spatial/engine/quality';
import {SPATIAL_FILL_LIGHT, SPATIAL_EMISSIVE} from '@berx/design-system/spatial/engine/stage';

const APPROACH_DURATION = 1.1; // seconds — the two identities closing the distance
const SETTLE_DURATION = 0.6; // the brief emissive spark once they meet
const START_OFFSET = 1.9; // world units each sphere starts from centre

function easeOutCubic(t: number): number {
	const c = Math.min(1, Math.max(0, t));
	return 1 - Math.pow(1 - c, 3);
}

function IdentitySphere({side, light}: {side: 1 | -1; light: string}) {
	const ref = useRef<Mesh>(null);
	const glass = useSpatialGlass();
	const startedAt = useRef<number | null>(null);

	useFrame((state) => {
		if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;
		const t = state.clock.elapsedTime - startedAt.current;
		const mesh = ref.current;
		if (!mesh) return;

		const approach = easeOutCubic(t / APPROACH_DURATION);
		mesh.position.x = side * START_OFFSET * (1 - approach);
		// A small real rotation the whole time it travels — an object
		// arriving, not a flat sprite sliding.
		mesh.rotation.y = t * 0.6;

		const mat = mesh.material as unknown as {emissiveIntensity: number};
		if (mat) {
			if (t < APPROACH_DURATION) {
				mat.emissiveIntensity = SPATIAL_EMISSIVE.quiet;
			} else {
				// The spark: a real emissive spike at contact, decaying back to
				// a steady "matched" glow — never a bounce, only a decay.
				const settleT = (t - APPROACH_DURATION) / SETTLE_DURATION;
				const spike = Math.max(0, 1 - settleT) * SPATIAL_EMISSIVE.live;
				mat.emissiveIntensity = SPATIAL_EMISSIVE.present + spike;
			}
		}
	});

	return (
		<mesh ref={ref} position={[side * START_OFFSET, 0, 0]}>
			<sphereGeometry args={[0.62, 48, 48]} />
			{/* The shared BERX glass. These two spheres are the most-looked-at
			    3D objects in the product — the moment a match resolves — so they
			    are the LAST place a private, nearly-identical material set
			    belongs. `thickness` is the one honest override: these are large
			    bodies, and the attenuation tint should have real depth to
			    develop across. */}
			<meshPhysicalMaterial
				{...glass}
				color="#0B1016"
				emissive={light}
				emissiveIntensity={SPATIAL_EMISSIVE.quiet}
				thickness={1.2}
			/>
		</mesh>
	);
}

export default function BerxMatchScene() {
	const keyLight = useSpatialKeyLight();
	return (
		<View style={styles.wrap}>
			<SpatialStage camera="hero" style={StyleSheet.absoluteFillObject as never}>
				{/* You, arriving from the camera side, and them, arriving from
				    depth — both real, neither pictured (see header). */}
				<IdentitySphere side={-1} light={keyLight} />
				<IdentitySphere side={1} light={SPATIAL_FILL_LIGHT} />
			</SpatialStage>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {width: '100%', aspectRatio: 1.15},
});
