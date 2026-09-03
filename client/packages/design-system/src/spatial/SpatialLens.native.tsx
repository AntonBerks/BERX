/**
 * BERX SPATIAL LENS — NATIVE. The restrained object's real 3D form:
 * ONE flattened disc of dark glass and ONE low, off-centre light —
 * deliberately not the richer multi-light/ring treatment
 * SpatialHero.native.tsx uses, because BerxLens's whole point (see
 * its own header) is "you should have to look at it to be sure it is
 * there" — a second light or a ring mesh here would be the exact
 * decoration this object is built to refuse.
 *
 * NOT YET DEVICE-VERIFIED (no iOS/Android simulator reachable in this
 * environment) — type-checked against the real, installed
 * @react-three/fiber@9.7.0 API, not device-rendered. See
 * SpatialHero.native.tsx's header for the fuller disclosure; the same
 * applies here.
 */
import {useRef} from 'react';
import type {ViewStyle} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {Mesh} from 'three';
import {SpatialStage} from './engine/SpatialStage';

export interface SpatialLensProps {
	size?: number;
	light?: string;
	body?: string;
	/** 0..1 how present the object is — mirrors BerxLens's own prop; here it scales the single light's intensity, the one thing that actually reads as "presence" on a form this quiet. */
	presence?: number;
	style?: ViewStyle;
}

function LensMesh({light, body, presence}: {light: string; body: string; presence: number}) {
	const mesh = useRef<Mesh>(null);
	// Barely-there rotation — this object earns attention by being
	// looked at twice, not by moving; a fast spin would contradict that.
	useFrame((_state, delta) => {
		if (mesh.current) mesh.current.rotation.y += delta * 0.05;
	});
	return (
		<mesh ref={mesh} scale={[1, 1, 0.16]}>
			<sphereGeometry args={[1, 48, 48]} />
			<meshPhysicalMaterial
				color={body}
				emissive={light}
				emissiveIntensity={0.06 * presence}
				roughness={0.5}
				metalness={0.05}
				transmission={0.1}
				clearcoat={0.3}
			/>
		</mesh>
	);
}

export function SpatialLens({size = 240, light = '#7FE8F2', body = '#10151C', presence = 1, style}: SpatialLensProps) {
	const k = Math.max(0, Math.min(1, presence));
	return (
		// The shared BERX rig, turned right down (intensity 0.18): this
		// object is deliberately the quietest thing in the product — "one
		// object so quiet you have to look twice" — and that restraint is
		// now a dimmer setting on the ONE rig rather than a private
		// lighting setup of its own.
		<SpatialStage camera="object" intensity={0.18} width={size} height={size} style={style}>
			{/* The one scene-local light, and the one thing the stage
			    deliberately does not own: light DIRECTION. This object's
			    key comes from the upper-LEFT because its 2D twin (BerxLens)
			    is drawn with its gradient at that angle — the 3D and 2D
			    renderings of the same object must agree about where the
			    light is, so this stays bound to the 2D artwork, not to the
			    rig's default upper-right key. */}
			<pointLight position={[-1.6, 1.3, 1.8]} color={light} intensity={0.9 * k} />
			<LensMesh light={light} body={body} presence={k} />
		</SpatialStage>
	);
}
