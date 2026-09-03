/**
 * BERX SPATIAL EMBLEM — NATIVE. Real @react-three/fiber/native + expo-gl
 * scene: three real stacked plane meshes (BoxGeometry, thin) instead
 * of three flat SVG polygons under a CSS perspective transform — an
 * actual camera looking at actual depth-offset geometry, not a 2D
 * illusion of one. `tilt` maps the same way BerxEmblem's own rotateX/
 * rotateY transform does, so the object leans the same amount either
 * renderer draws it with.
 *
 * Only ever bundled by Metro on iOS/Android (React Native's `.native.`
 * resolution) — this repo's web verification harness (esbuild) has no
 * such convention and always resolves to SpatialEmblem.tsx instead.
 *
 * NOT YET DEVICE-VERIFIED — no iOS/Android simulator is reachable in
 * this environment. Written directly against the real, installed
 * @react-three/fiber@9.7.0 native API and passes this project's real
 * TypeScript check (see SpatialHero.native.tsx's header for how that
 * was confirmed to actually catch errors, not silently pass).
 */
import {useRef} from 'react';
import type {ViewStyle} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {Group} from 'three';
import {SpatialStage} from './engine/SpatialStage';
import {useSpatialGlass} from './engine/quality';

export interface SpatialEmblemProps {
	size?: number;
	tilt?: number;
	light?: string;
	style?: ViewStyle;
}

const DEG = Math.PI / 180;

function PlaneStack({light, tilt}: {light: string; tilt: number}) {
	const group = useRef<Group>(null);
	const glass = useSpatialGlass();
	useFrame((_state, delta) => {
		// Slow, continuous — "subtle movement" per the master directive,
		// not the tumbling BerxEmblem's own header explicitly refuses.
		if (group.current) group.current.rotation.y += delta * 0.06;
	});
	// Back to front: dimmest to the lit top plane, same order BerxEmblem
	// draws in (its own comment: "the lowest plane is the dimmest").
	const planes = [
		{z: -0.36, emissive: 0.05, color: '#4a4f57'},
		{z: -0.18, emissive: 0.12, color: '#6b7078'},
		{z: 0, emissive: 0.9, color: light},
	];
	return (
		<group ref={group} rotation={[(8 + tilt) * DEG, (-10 + tilt) * DEG, 0]}>
			{planes.map((p, i) => (
				<mesh key={i} position={[0, -i * 0.12, p.z]}>
					<boxGeometry args={[1.5, 1.5, 0.06]} />
						{/* The shared BERX glass — the emblem's planes are made of the
					    same substance as every other BERX object, so its edges
					    catch the rim light and its body carries the attenuation
					    tint instead of reading as flat painted card. */}
					<meshPhysicalMaterial {...glass} color={p.color} emissive={light} emissiveIntensity={p.emissive} />
				</mesh>
			))}
		</group>
	);
}

export function SpatialEmblem({size = 120, tilt = 0, light = '#4FD6E8', style}: SpatialEmblemProps) {
	return (
		// Camera and lights come from the one shared BERX rig — this
		// object's previous private camera/lights were already identical to
		// it, so composing from the stage changes nothing visually and
		// makes the emblem provably lit by the same sun as every other
		// real 3D object in the app.
		<SpatialStage camera="object" width={size} height={size} style={style}>
			<PlaneStack light={light} tilt={tilt} />
		</SpatialStage>
	);
}
