/**
 * BERX SPATIAL ENGINE — interaction physics for scenes you move through.
 *
 * THE PROBLEM THIS FIXES. Every draggable BERX scene (Worlds depth,
 * Life Graph time, People orbit, Trip days) read the finger's delta
 * straight into a camera or rotation value. That works, and it feels
 * dead: the moment the finger lifts, motion stops in the same frame.
 * Nothing physical does that. A flick that ends in a hard stop reads as
 * a scrubber being dragged, not as a world with mass being moved — and
 * "the scene has mass" is precisely the thing a spatial product has to
 * sell in the first second of touching it.
 *
 * WHAT IT DOES INSTEAD. Velocity carries past the release and decays
 * exponentially, so a flick coasts and a slow drag doesn't. The release
 * velocity is PanResponder's own `vx`/`vy` (RN measures it across the
 * real gesture; a hand-rolled last-two-frames estimate is noisier and
 * spikes on a stuttered frame), and decay is framerate-independent —
 * `exp(-k·dt)` rather than a per-frame multiplier, which would coast
 * further on a 120Hz phone than on a 60Hz one.
 *
 * AT THE BOUNDS: velocity is killed, not reversed. BERX motion
 * decelerates, it never bounces — a rubber-band overshoot is a
 * consumer-app gesture and the wrong register for this product.
 *
 * NO SECOND ANIMATION LOOP. The decay is advanced by the scene's own
 * useFrame via `advance(delta)`. A hook that ran its own
 * requestAnimationFrame would tick out of phase with the renderer and
 * produce visible judder on exactly the slow, deliberate motion this
 * engine is built around.
 */
import {useCallback, useMemo, useRef} from 'react';
import {PanResponder} from 'react-native';
import type {GestureResponderEvent, PanResponderGestureState} from 'react-native';

export interface SpatialDragOptions {
	/** Scene units per pixel of finger travel. */
	sensitivity: number;
	/** Lowest value the axis may reach. */
	min?: number;
	/** Highest value the axis may reach. */
	max?: number;
	/**
	 * Exponential decay constant, per second. Higher stops sooner.
	 * ~3.2 gives roughly a second of readable coast — long enough to
	 * feel like momentum, short enough that it never feels out of
	 * control or like the scene is drifting on its own.
	 */
	decay?: number;
	/** Drag along Y instead of X (a scene whose axis runs up the screen). */
	axis?: 'x' | 'y';
	/** Finger right/down should DECREASE the value. */
	invert?: boolean;
}

export interface SpatialDrag {
	/** Spread onto the View wrapping the canvas. */
	panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
	/** Current axis value. Read inside useFrame; never triggers a re-render. */
	valueRef: React.MutableRefObject<number>;
	/** Call once per frame from the scene's useFrame with R3F's delta. */
	advance: (delta: number) => void;
}

export function useSpatialDrag({
	sensitivity,
	min = -Infinity,
	max = Infinity,
	decay = 3.2,
	axis = 'x',
	invert = false,
}: SpatialDragOptions): SpatialDrag {
	const valueRef = useRef(0);
	const velocityRef = useRef(0);
	const lastRef = useRef(0);
	const draggingRef = useRef(false);

	// Read through refs inside the frame callback so `advance` never has to
	// be re-created when a bound changes, which would otherwise churn the
	// useFrame closure in every consuming scene.
	const boundsRef = useRef({min, max, decay, sensitivity, invert});
	boundsRef.current = {min, max, decay, sensitivity, invert};

	/** Clamps and reports whether it had to — a hit bound kills momentum. */
	const clamp = useCallback((v: number) => {
		const {min: lo, max: hi} = boundsRef.current;
		if (v < lo) return {value: lo, hit: true};
		if (v > hi) return {value: hi, hit: true};
		return {value: v, hit: false};
	}, []);

	const advance = useCallback(
		(delta: number) => {
			// A finger on the glass IS the physics. Momentum only exists
			// after release.
			if (draggingRef.current || velocityRef.current === 0) return;
			const {decay: k} = boundsRef.current;
			const next = clamp(valueRef.current + velocityRef.current * delta);
			valueRef.current = next.value;
			if (next.hit) {
				velocityRef.current = 0;
				return;
			}
			velocityRef.current *= Math.exp(-k * delta);
			// Below this the movement is sub-pixel; keeping it alive would
			// spin the decay forever for motion nobody can see.
			if (Math.abs(velocityRef.current) < 0.0005) velocityRef.current = 0;
		},
		[clamp]
	);

	const panHandlers = useMemo(() => {
		const read = (g: PanResponderGestureState) => (axis === 'x' ? g.dx : g.dy);
		const readVelocity = (g: PanResponderGestureState) => (axis === 'x' ? g.vx : g.vy);

		return PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				draggingRef.current = true;
				lastRef.current = 0;
				// Grabbing a coasting scene stops it dead, the way catching a
				// spinning globe does.
				velocityRef.current = 0;
			},
			onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
				const {sensitivity: s, invert: inv} = boundsRef.current;
				const travel = read(g) - lastRef.current;
				lastRef.current = read(g);
				valueRef.current = clamp(valueRef.current + travel * s * (inv ? -1 : 1)).value;
			},
			onPanResponderRelease: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
				draggingRef.current = false;
				const {sensitivity: s, invert: inv} = boundsRef.current;
				// RN reports vx/vy in px per MILLISECOND; everything here is
				// per second.
				velocityRef.current = readVelocity(g) * 1000 * s * (inv ? -1 : 1);
			},
			// A gesture the system takes away (a parent scroll view winning
			// the responder) must not leave the scene stuck in "dragging"
			// forever — that would silently disable momentum for good.
			onPanResponderTerminate: () => {
				draggingRef.current = false;
				velocityRef.current = 0;
			},
		}).panHandlers;
	}, [axis, clamp]);

	return {panHandlers, valueRef, advance};
}
