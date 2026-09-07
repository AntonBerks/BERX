/**
 * BERX V9 SPATIAL SIGNAL — the one real interaction input every scene
 * drives its camera from.
 *
 * The 5D system's fifth dimension is USER INTERACTION, and a scene that
 * parallaxes on a timer is not interactive — it is an animation. So the
 * signal here comes from real hardware or real pointer movement and
 * from nothing else:
 *
 *   native — expo-sensors Gyroscope, guarded by isAvailableAsync(), at
 *            the same 32ms interval and clamp BerxSpatialCard already
 *            established in this codebase;
 *   web    — real pointer position over the scene's own measured box.
 *
 * When neither exists (a device with no gyroscope, a touch-only web
 * session that has not been touched) the signal simply stays at zero
 * and every layer sits at its resting z. That is the honest default: a
 * still scene, not a faked drift.
 *
 * REDUCED MOTION is enforced HERE rather than by each caller, because a
 * caller that forgets is a caller that violates the accessibility
 * contract silently. When the OS asks for less motion the listeners are
 * never attached at all — no sensor is powered, no pointer handler is
 * bound — so the cost goes to zero as well as the movement.
 *
 * This was previously a private hook inside the onboarding folder
 * (CinematicShared's `useAmbientParallax`). It is promoted here because
 * every V9 scene needs it and the brief forbids a second copy.
 */
import {useEffect, useMemo} from 'react';
import {Platform} from 'react-native';
import {useSharedValue, withTiming, type SharedValue} from 'react-native-reanimated';
import {Gyroscope} from 'expo-sensors';
import type {Subscription as GyroscopeSubscription} from 'expo-sensors/build/Pedometer';
import {useBerxReducedMotion} from './BerxBoundaries';

/** Signals are normalised to [-1, 1]; the clamp keeps a violent gesture from throwing the scene. */
const CLAMP = 1;
const SENSITIVITY = 0.6;
/** Matches the tier the movement belongs to: this is a response to input, not a content change. */
const FOLLOW_MS = 140;

export interface BerxSpatialSignal {
	x: SharedValue<number>;
	y: SharedValue<number>;
	/** Spread onto the scene root. Empty on native, where the gyroscope is the input. */
	bind: Record<string, unknown>;
}

function clamp(v: number): number {
	return Math.max(-CLAMP, Math.min(CLAMP, v));
}

export function useBerxSpatialSignal(): BerxSpatialSignal {
	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const reducedMotion = useBerxReducedMotion();

	useEffect(() => {
		if (reducedMotion || Platform.OS === 'web') return;
		let sub: GyroscopeSubscription | null = null;
		let cancelled = false;
		Gyroscope.isAvailableAsync()
			.then((available) => {
				if (!available || cancelled) return;
				Gyroscope.setUpdateInterval(32);
				sub = Gyroscope.addListener(({x: gx, y: gy}) => {
					x.value = withTiming(clamp(gx * SENSITIVITY), {duration: FOLLOW_MS});
					y.value = withTiming(clamp(gy * SENSITIVITY), {duration: FOLLOW_MS});
				});
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
			sub?.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reducedMotion]);

	const bind = useMemo(() => {
		if (reducedMotion || Platform.OS !== 'web') return {};
		return {
			onMouseMove: (e: {nativeEvent: {offsetX: number; offsetY: number}; currentTarget?: {clientWidth?: number; clientHeight?: number}}) => {
				// Measured against the scene's OWN box rather than a guessed
				// phone size, so the same hook is correct on a tablet and on a
				// desktop window instead of saturating at the edges.
				const w = e.currentTarget?.clientWidth || 400;
				const h = e.currentTarget?.clientHeight || 860;
				x.value = withTiming(clamp((e.nativeEvent.offsetX / w - 0.5) * 2), {duration: FOLLOW_MS});
				y.value = withTiming(clamp((e.nativeEvent.offsetY / h - 0.5) * 2), {duration: FOLLOW_MS});
			},
			onMouseLeave: () => {
				// Returning to rest is part of the interaction: a scene frozen
				// at the last known angle reads as broken, not as still.
				x.value = withTiming(0, {duration: 420});
				y.value = withTiming(0, {duration: 420});
			},
		} as Record<string, unknown>;
	}, [reducedMotion, x, y]);

	return {x, y, bind};
}
