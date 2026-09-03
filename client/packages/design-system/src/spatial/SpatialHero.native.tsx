/**
 * BERX SPATIAL HERO — NATIVE (True3DRenderer half of SpatialRenderer).
 *
 * Real @react-three/fiber/native + expo-gl scene: a real
 * PerspectiveCamera, real point lights coloured from the active
 * World, a real lit sphere mesh (MeshPhysicalMaterial — roughness/
 * transmission/clearcoat for the same "dark glass, one lit edge"
 * material BerxOrb draws in 2D, here as actual geometry a real camera
 * moves around) plus a torus ring standing in for the BERX plane, and
 * a real continuous rotation driven by useFrame's own delta — not a
 * React Native Animated transform faking rotation on a flat sprite.
 *
 * Only ever bundled by Metro on iOS/Android — React Native's own
 * `.native.` file-extension convention, which this repo's web
 * verification harness (esbuild) does not implement, so that harness
 * always resolves to SpatialHero.tsx (the 2D fallback) instead and
 * never touches this file at all.
 *
 * NOT YET DEVICE-VERIFIED. No iOS/Android simulator is reachable in
 * this environment, so this has not been visually confirmed on a real
 * GL context — stated plainly, not implied otherwise. What IS real:
 * written directly against the installed @react-three/fiber@9.7.0
 * native API (its own shipped native.d.ts / three-types.d.ts, not
 * recalled from memory) and passes the project's real TypeScript
 * check, which is a genuine correctness signal even without a device.
 *
 * ONE WORLD, NOT 200 MINI ENGINES: the camera and the lighting rig are
 * no longer declared here. They come from SpatialStage (spatial/engine)
 * — the single BERX camera language and three-point rig every real 3D
 * surface composes from, so an object here and an object two screens
 * away are lit by the same sun and seen through the same lens. This
 * file now owns only what is genuinely ITS OWN: the geometry, the
 * material and the motion. Quality tiering also moved to the stage.
 */
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber/native';
import type {Mesh} from 'three';
import type {ViewStyle} from 'react-native';
import {SpatialStage} from './engine/SpatialStage';
import {SPATIAL_MOTION, SPATIAL_QUALITY} from './engine/stage';
import type {SpatialQuality} from './engine/stage';

export interface SpatialHeroProps {
	size?: number;
	light?: string;
	fill?: string;
	body?: string;
	ring?: boolean;
	/** Accepted for prop-parity with the 2D fallback; a real scene always casts its own contact shadow via lighting, so there is nothing separate to toggle. */
	shadow?: boolean;
	/** Real cost tier — drives geometry subdivision here and antialias/fill-light on the stage. */
	quality?: SpatialQuality;
	style?: ViewStyle;
}

function OrbMesh({light, fill, body, ring, segments}: {light: string; fill: string; body: string; ring: boolean; segments: number}) {
	const sphere = useRef<Mesh>(null);
	const torus = useRef<Mesh>(null);
	// Real rotation, driven by the renderer's own frame delta — not a
	// fixed-duration Animated loop guessing at frame time.
	useFrame((_state, delta) => {
		if (sphere.current) sphere.current.rotation.y += delta * SPATIAL_MOTION.turnRadPerSec;
		if (torus.current) torus.current.rotation.z += delta * SPATIAL_MOTION.turnRadPerSec;
	});
	return (
		<group>
			<mesh ref={sphere}>
				<sphereGeometry args={[1, segments, segments]} />
				<meshPhysicalMaterial
					color={body}
					emissive={light}
					emissiveIntensity={0.32}
					roughness={0.28}
					metalness={0.08}
					transmission={0.32}
					thickness={1.3}
					clearcoat={0.55}
					clearcoatRoughness={0.25}
				/>
			</mesh>
			{ring ? (
				<mesh ref={torus} rotation={[Math.PI / 2.35, 0, 0]}>
					<torusGeometry args={[1.34, 0.01, 12, Math.max(24, segments)]} />
					<meshStandardMaterial color={fill} emissive={light} emissiveIntensity={0.7} roughness={0.4} />
				</mesh>
			) : null}
		</group>
	);
}

export function SpatialHero({
	size = 200,
	light = '#4FD6E8',
	fill = '#3E8FD9',
	body = '#0B1016',
	ring = true,
	quality = 'high',
	style,
}: SpatialHeroProps) {
	return (
		<SpatialStage camera="hero" quality={quality} width={size} height={size} style={style}>
			<OrbMesh light={light} fill={fill} body={body} ring={ring} segments={SPATIAL_QUALITY[quality].segments} />
		</SpatialStage>
	);
}
