/**
 * Shared elements on React Native — the object survives the navigation.
 *
 * v9 names seven things allowed to travel between scenes as one
 * continuous object: an avatar, hero media, a place pin, an event
 * poster, a message thread, a primary action, a profile header. BERX
 * already tagged all of them and had the FLIP maths in @berx/spatial;
 * what was missing was anything that moved.
 *
 * The web adapter runs this against the DOM, where both elements exist
 * at once. React Native cannot: the outgoing screen is gone by the
 * time the incoming one lays out. So the source records where it was
 * standing at the moment it was pressed — real measured bounds, in
 * window coordinates — and the destination plays the FLIP from there
 * on its first layout. The plan comes from the same planner the web
 * uses, so both platforms travel the same distance over the same
 * curve.
 *
 * A recording is consumed once and expires: opening a place from a
 * list travels, opening the same place from a notification a minute
 * later does not pretend to have come from a card that was never on
 * screen. Under reduced motion the planner returns no travel and this
 * cross-fades — the arrival is still perceptible, it simply stops
 * flying.
 */
import React, {useCallback, useRef, useState} from 'react';
import {Animated, View, type LayoutChangeEvent, type StyleProp, type ViewStyle} from 'react-native';
import {planSharedElementFlip, type BerxRect} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';

/**
 * How long a recorded position stays meaningful. A shared element is
 * a continuation of a gesture, not a bookmark: past this the
 * destination has no honest claim to have come from anywhere.
 */
const RECORDING_TTL_MS = 1200;

interface Recording {
	rect: BerxRect;
	at: number;
}

const recordings = new Map<string, Recording>();

/** Records where a tagged element was, in window coordinates. */
export function recordBerxSharedElement(tag: string, rect: BerxRect): void {
	recordings.set(tag, {rect, at: Date.now()});
}

/** Consumes a recording. Returns null when there is none, or it has expired. */
export function takeBerxSharedElement(tag: string): BerxRect | null {
	const found = recordings.get(tag);
	if (!found) return null;
	recordings.delete(tag);
	if (Date.now() - found.at > RECORDING_TTL_MS) return null;
	return found.rect;
}

/** Test and diagnostic access. Never used to decide rendering. */
export function berxSharedElementCount(): number {
	return recordings.size;
}

/**
 * Measures a tagged element and records it. Call from the press
 * handler that navigates — before the navigation, while the element
 * is still on screen.
 */
export function useBerxSharedElementSource(tag: string | undefined) {
	const ref = useRef<View | null>(null);

	const record = useCallback(() => {
		if (!tag || !ref.current) return;
		ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
			if (width <= 0 || height <= 0) return;
			recordBerxSharedElement(tag, {x, y, width, height});
		});
	}, [tag]);

	return {ref, record};
}

export interface BerxSharedElementTargetProps {
	/** The same tag the source carried. */
	tag: string;
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

/**
 * The destination half. On its first layout it looks for a recording
 * of its own tag and, if there is one, plays the FLIP from those
 * bounds to where it has actually landed.
 */
export function BerxSharedElementTarget({tag, children, style, testID}: BerxSharedElementTargetProps) {
	const {scene} = useBerxScene();
	const progress = useRef(new Animated.Value(1)).current;
	const [flip, setFlip] = useState<ReturnType<typeof planSharedElementFlip> | null>(null);
	const played = useRef(false);

	const onLayout = useCallback(
		(e: LayoutChangeEvent) => {
			if (played.current) return;
			const from = takeBerxSharedElement(tag);
			if (!from) {
				played.current = true;
				return;
			}
			const {x, y, width, height} = e.nativeEvent.layout;
			const plan = planSharedElementFlip(from, {x, y, width, height}, scene.reducedMotion);
			played.current = true;
			setFlip(plan);
			progress.setValue(0);
			Animated.timing(progress, {
				toValue: 1,
				duration: plan.durationMs,
				useNativeDriver: true,
			}).start();
		},
		[tag, scene.reducedMotion, progress],
	);

	const animated: ViewStyle | Record<string, unknown> = flip
		? flip.travels
			? {
					transform: [
						{translateX: progress.interpolate({inputRange: [0, 1], outputRange: [flip.translateX, 0]})},
						{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [flip.translateY, 0]})},
						{scaleX: progress.interpolate({inputRange: [0, 1], outputRange: [flip.scaleX, 1]})},
						{scaleY: progress.interpolate({inputRange: [0, 1], outputRange: [flip.scaleY, 1]})},
					],
			  }
			: {opacity: progress}
		: {};

	return (
		<Animated.View testID={testID} onLayout={onLayout} style={[style, animated]}>
			{children}
		</Animated.View>
	);
}
