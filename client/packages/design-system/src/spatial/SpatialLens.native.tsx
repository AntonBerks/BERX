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
import {View, ViewStyle} from 'react-native';
import {Canvas, useFrame} from '@react-three/fiber/native';
import type {Mesh} from 'three';

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
		<View style={[{width: size, height: size}, style]}>
			<Canvas camera={{position: [0, 0, 3.2], fov: 34}}>
				<ambientLight intensity={0.06} />
				{/* The single "edge the light comes from" — low, off to the
				    upper-left, matching BerxLens's own 2D gradient angle. */}
				<pointLight position={[-1.6, 1.3, 1.8]} color={light} intensity={0.9 * k} />
				<LensMesh light={light} body={body} presence={k} />
			</Canvas>
		</View>
	);
}
