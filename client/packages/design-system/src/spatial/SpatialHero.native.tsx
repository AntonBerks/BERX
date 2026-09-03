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
import {useSpatialGlass, useSpatialQuality} from './engine/quality';
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

function OrbMesh({light, fill, body, ring}: {light: string; fill: string; body: string; ring: boolean}) {
	const sphere = useRef<Mesh>(null);
	const torus = useRef<Mesh>(null);
	// Both read from the stage this object is standing on, so the hero
	// cannot silently disagree with its own canvas about what tier it is
	// being drawn at.
	const glass = useSpatialGlass();
	const segments = SPATIAL_QUALITY[useSpatialQuality()].segments;
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
				{/* The shared BERX glass recipe, not a private set of numbers.
				    This object used to carry its own roughness/transmission/
				    clearcoat values that were close to, but not the same as,
				    every other BERX object's — which is exactly how a product
				    stops looking like it is made of one material. `thickness`
				    is the one honest override: this is the largest BERX object
				    on screen, and attenuation is a function of how far light
				    actually travels through the body. */}
				<meshPhysicalMaterial
					{...glass}
					color={body}
					emissive={light}
					emissiveIntensity={0.32}
					thickness={1.4}
				/>
			</mesh>
			{ring ? (
				<mesh ref={torus} rotation={[Math.PI / 2.35, 0, 0]}>
					<torusGeometry args={[1.34, 0.01, 12, Math.max(24, segments)]} />
					{/* The ring stays a simple emissive band on purpose: it is a
					    line of light, not a body with an inside. */}
					<meshStandardMaterial color={fill} emissive={light} emissiveIntensity={0.7} roughness={0.4} />
				</mesh>
			) : null}
		</group>
	);
}

export function SpatialHero({
	size = 200,
	light = '#00E5CC',
	fill = '#3E8FD9',
	body = '#0B1016',
	ring = true,
	quality = 'high',
	style,
}: SpatialHeroProps) {
	return (
		// grounded: this is a single hero object sitting at the origin —
		// exactly the case the contact disc is for. It is what stops the
		// orb reading as a sticker floating on the background.
		<SpatialStage camera="hero" quality={quality} grounded width={size} height={size} style={style}>
			<OrbMesh light={light} fill={fill} body={body} ring={ring} />
		</SpatialStage>
	);
}
