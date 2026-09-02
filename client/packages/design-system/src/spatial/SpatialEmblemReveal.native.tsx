/**
 * BERX SPATIAL EMBLEM REVEAL — NATIVE. The real @react-three/fiber/
 * native counterpart of BerxEmblemReveal's staggered plane-drop: three
 * real meshes falling into their final depth-offset positions and
 * fading in, back plane first, then the whole stack settling from a
 * lean — the same choreography, driven by the Three.js clock instead
 * of RN's Animated API (which has no meaning inside a Canvas). This is
 * the FIRST FRAME of the product on a real device: a real camera
 * looking at real geometry assembling, not a flat logo cross-fading in.
 *
 * Deceleration-only, same as the 2D version's own comment: planes
 * land, they do not overshoot or bounce — a bouncing logo reads as a
 * toy.
 *
 * Only ever bundled by Metro on iOS/Android; this repo's web
 * verification harness always resolves to SpatialEmblemReveal.tsx
 * instead (its esbuild config has no `.native.` resolution).
 *
 * NOT YET DEVICE-VERIFIED — no iOS/Android simulator reachable in this
 * environment. Type-checked against the real, installed
 * @react-three/fiber@9.7.0 API (see SpatialHero.native.tsx's header
 * for how that check was confirmed to actually catch errors).
 */
import {useEffect, useRef} from 'react';
import {View, ViewStyle} from 'react-native';
import {Canvas, useFrame} from '@react-three/fiber/native';
import type {Group, Mesh} from 'three';

export interface SpatialEmblemRevealProps {
	size?: number;
	tilt?: number;
	light?: string;
	delayMs?: number;
	onSettled?: () => void;
	style?: ViewStyle;
}

const DEG = Math.PI / 180;
const PLANE_DURATION = 0.62; // seconds, matches BerxEmblemReveal's own 620ms
const PLANE_STAGGER = 0.15; // matches Animated.stagger(150, ...)
const SETTLE_DURATION = 0.52; // matches the 2D version's settle timing

/** Deceleration curve, no overshoot — a cubic ease-out is the real-time equivalent of the 2D version's Easing.bezier(0.16, 1, 0.3, 1). */
function easeOutCubic(t: number): number {
	const c = Math.min(1, Math.max(0, t));
	return 1 - Math.pow(1 - c, 3);
}

function RevealStack({light, tilt, delayMsSeconds}: {light: string; tilt: number; delayMsSeconds: number}) {
	const group = useRef<Group>(null);
	const meshes = useRef<(Mesh | null)[]>([null, null, null]);
	// Captured on the first real frame rather than threaded in as a prop
	// from outside the Canvas — a ref set inside onCreated/useEffect and
	// read as a prop at render time would freeze at its initial value,
	// since mutating a ref never triggers a re-render.
	const startedAt = useRef<number | null>(null);
	// Back to front — the lowest plane drops first and travels furthest,
	// so the stack reads as depth resolving (same order/reasoning as the
	// 2D BerxEmblemReveal).
	const planes = [
		{z: -0.36, drop: 1.4, color: '#4a4f57', emissive: 0.05},
		{z: -0.18, drop: 1.0, color: '#6b7078', emissive: 0.12},
		{z: 0, drop: 0.65, color: light, emissive: 0.9},
	];

	useFrame((state) => {
		if (startedAt.current === null) {
			startedAt.current = state.clock.elapsedTime + delayMsSeconds;
		}
		const t = state.clock.elapsedTime - startedAt.current;
		planes.forEach((p, i) => {
			const localT = (t - i * PLANE_STAGGER) / PLANE_DURATION;
			const progress = easeOutCubic(localT);
			const mesh = meshes.current[i];
			if (mesh) {
				mesh.position.y = -i * 0.12 + p.drop * (1 - progress);
				const mat = mesh.material as unknown as {opacity: number};
				if (mat) mat.opacity = Math.max(0, Math.min(1, localT * 1.4));
			}
		});
		if (group.current) {
			// The whole stack settles from a lean (-38deg) into its final
			// rotateY, starting once all three planes have landed.
			const settleT = (t - planes.length * PLANE_STAGGER) / SETTLE_DURATION;
			const settleProgress = easeOutCubic(settleT);
			const fromDeg = -38;
			const toDeg = -10 + tilt;
			group.current.rotation.y = (fromDeg + (toDeg - fromDeg) * settleProgress) * DEG;
			group.current.rotation.x = (8 + tilt) * DEG;
		}
	});

	return (
		<group ref={group}>
			{planes.map((p, i) => (
				<mesh key={i} ref={(m) => { meshes.current[i] = m; }} position={[0, -i * 0.12 + p.drop, p.z]}>
					<boxGeometry args={[1.5, 1.5, 0.06]} />
					<meshStandardMaterial color={p.color} emissive={light} emissiveIntensity={p.emissive} roughness={0.5} metalness={0.15} transparent opacity={0} />
				</mesh>
			))}
		</group>
	);
}

export function SpatialEmblemReveal({size = 120, tilt = 0, light = '#4FD6E8', delayMs = 0, onSettled, style}: SpatialEmblemRevealProps) {
	const settledRef = useRef(false);

	useEffect(() => {
		// A plain RN-side timer for the completion callback rather than
		// tying it to the Three.js clock inside the Canvas — onSettled
		// only needs to fire at roughly the right real-world moment, and
		// this total matches the same real durations the scene itself
		// animates on (delay + 3 staggered plane drops + the settle turn).
		const totalMs = delayMs + 3 * PLANE_STAGGER * 1000 + PLANE_DURATION * 1000 + SETTLE_DURATION * 1000;
		const timer = setTimeout(() => {
			if (!settledRef.current) {
				settledRef.current = true;
				onSettled?.();
			}
		}, totalMs);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<View style={[{width: size, height: size}, style]}>
			<Canvas camera={{position: [0, 0, 3.2], fov: 32}}>
				<ambientLight intensity={0.3} />
				<pointLight position={[1.6, 1.4, 2.2]} color={light} intensity={1.1} />
				<RevealStack light={light} tilt={tilt} delayMsSeconds={delayMs / 1000} />
			</Canvas>
		</View>
	);
}
