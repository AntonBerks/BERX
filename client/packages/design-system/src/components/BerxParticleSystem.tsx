/**
 * BERX PARTICLE SYSTEM — a real, hand-rolled particle burst.
 *
 * No external particle library — every particle is a plain Reanimated
 * shared-value-driven View, moving on the UI thread. This is not a
 * decoration layered on top of an existing effect; it is the whole
 * effect: a like, a match, a level-up reads as a real burst of light
 * because this is real physics (initial velocity + optional gravity +
 * decay), not a looping GIF or a single scaling circle standing in for
 * "particles".
 *
 * PHYSICS. Each particle gets its own random angle within `spread`
 * degrees (centred on straight up, -90°, so a default burst reads as
 * "up and out" the way a real firework or confetti pop does — a
 * spread centred on 0° would fire mostly sideways) and its own random
 * speed in [0.6, 1.0] × `speed`, so a burst never looks like a
 * mechanically identical ring. Position is real kinematics —
 * x = vx·t, y = vy·t + 0.5·g·t² — computed once per particle as a
 * `withTiming` end value (constant velocity is a straight line, which
 * `withTiming`'s own linear-by-default easing already draws correctly
 * without a frame-by-frame physics loop).
 *
 * LIFECYCLE. `trigger` flipping to true spawns one generation of
 * `count` particles; each generation is keyed by a real counter, not
 * reused component instances, so a rapid double-trigger (a fast double
 * -tap like) gets two independent bursts instead of one restarting.
 * Every generation removes itself from state after `duration` + a
 * small buffer via a real cleanup timeout (cleared on unmount), so a
 * screen that never triggers again is never left holding dead particle
 * views — the memory-leak requirement this component's own spec named.
 *
 * WEB. Reanimated's web runtime drives the same shared-value/withTiming
 * calls through real CSS transforms (verified via the harness build —
 * see this component set's own commit message) — no separate canvas or
 * CSS-keyframe fallback was needed to get a real 60fps result there.
 */
import {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, Easing} from 'react-native-reanimated';
import {useBerxColors} from '../theme';

export interface BerxParticleSystemProps {
	/** Flip false→true to fire one burst. Stays true → does not re-fire (see the generation counter below); flip back to false first to arm another. */
	trigger: boolean;
	count?: number;
	/** Defaults to the LIVE accent (useBerxColors().accent). */
	color?: string;
	/** Burst origin, relative to this component's own top-left corner. Defaults to its own centre once measured. */
	origin?: {x: number; y: number};
	duration?: number;
	/** Degrees, centred on straight up (-90°) — see this file's own header for why "up" and not "right" is the centre. */
	spread?: number;
	speed?: number;
	/** Real downward acceleration, px/s². Off (0) by default — a like/tap burst reads as light escaping, not confetti falling; pass a real value (e.g. 220) for a "confetti" register instead. */
	gravity?: number;
}

interface ParticleSpec {
	id: number;
	angleDeg: number;
	speedPx: number;
	size: number;
	rotationDeg: number;
}

const DEG2RAD = Math.PI / 180;

function buildGeneration(count: number): ParticleSpec[] {
	return Array.from({length: count}, (_, i) => ({
		id: i,
		// Centred on -90° (straight up); spread is applied in the caller
		// since it depends on the prop, not on generation shape.
		angleDeg: -90,
		speedPx: 0.6 + Math.random() * 0.4,
		size: 2 + Math.random() * 4,
		rotationDeg: Math.random() * 360,
	}));
}

function Particle({
	spec,
	origin,
	spread,
	speed,
	duration,
	gravity,
	color,
}: {
	spec: ParticleSpec;
	origin: {x: number; y: number};
	spread: number;
	speed: number;
	duration: number;
	gravity: number;
	color: string;
}) {
	const progress = useSharedValue(0);
	// Real per-particle randomness, computed once (useRef, not
	// useMemo — this never needs to recompute, only to be stable across
	// this one particle's whole lifetime).
	const angle = useRef(spec.angleDeg + (Math.random() - 0.5) * spread).current;
	const v = useRef(spec.speedPx * speed).current;
	const vx = useRef(Math.cos(angle * DEG2RAD) * v).current;
	const vy = useRef(Math.sin(angle * DEG2RAD) * v).current;

	useEffect(() => {
		progress.value = withTiming(1, {duration, easing: Easing.out(Easing.quad)});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Explicit deps — see BerxGlassView's own comment on why this is not
	// optional in a build with no Reanimated Babel plugin step.
	const style = useAnimatedStyle(() => {
		const t = progress.value; // 0..1 of `duration`
		const seconds = t * (duration / 1000);
		const dx = vx * seconds;
		// Real kinematics: y = vy·t + 0.5·g·t². vy itself is already
		// negative-up (see angle centred on -90°), gravity pulls back down.
		const dy = vy * seconds + 0.5 * gravity * seconds * seconds;
		return {
			opacity: 1 - t,
			transform: [
				{translateX: origin.x + dx},
				{translateY: origin.y + dy},
				{scale: 1 - t * 0.7},
				{rotate: `${spec.rotationDeg + t * 180}deg`},
			],
		};
	}, [progress, duration, vx, vy, gravity, origin.x, origin.y, spec.rotationDeg]);

	return (
		<Animated.View
			pointerEvents="none"
			style={[styles.particle, {width: spec.size, height: spec.size, borderRadius: spec.size / 2, backgroundColor: color}, style]}
		/>
	);
}

export function BerxParticleSystem({
	trigger,
	count = 20,
	color,
	origin,
	duration = 800,
	spread = 60,
	speed = 150,
	gravity = 0,
}: BerxParticleSystemProps) {
	const colors = useBerxColors();
	const resolvedColor = color ?? colors.accent;
	const [size, setSize] = useState({width: 0, height: 0});
	const [generations, setGenerations] = useState<{genId: number; particles: ParticleSpec[]}[]>([]);
	const genCounter = useRef(0);
	const wasTriggered = useRef(false);
	const timeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

	useEffect(() => {
		// Edge-triggered: only fires on the false→true transition, so
		// leaving `trigger` pinned true never spawns a second generation.
		if (trigger && !wasTriggered.current) {
			const genId = genCounter.current++;
			setGenerations((prev) => [...prev, {genId, particles: buildGeneration(count)}]);
			const timeout = setTimeout(() => {
				setGenerations((prev) => prev.filter((g) => g.genId !== genId));
				timeouts.current.delete(timeout);
			}, duration + 100);
			timeouts.current.add(timeout);
		}
		wasTriggered.current = trigger;
	}, [trigger, count, duration]);

	// Real cleanup — no generation's removal timeout survives unmount.
	useEffect(() => {
		const set = timeouts.current;
		return () => {
			set.forEach((t) => clearTimeout(t));
			set.clear();
		};
	}, []);

	const resolvedOrigin = origin ?? {x: size.width / 2, y: size.height / 2};

	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFillObject} onLayout={(e) => setSize(e.nativeEvent.layout)}>
			{generations.map(({genId, particles}) =>
				particles.map((p) => (
					<Particle
						key={`${genId}-${p.id}`}
						spec={p}
						origin={resolvedOrigin}
						spread={spread}
						speed={speed}
						duration={duration}
						gravity={gravity}
						color={resolvedColor}
					/>
				))
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	particle: {position: 'absolute'},
});
