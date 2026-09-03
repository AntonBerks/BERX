/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX Future UI foundation piece: a real cinematic entrance (fade +
 * slight rise), not a generic screen-transition library — RN's own
 * Animated API (already used elsewhere, e.g. DatingDiscoverScreen/
 * StoryViewerScreen — no new dependency) driven by the motion tokens
 * that already existed in tokens/index.ts (easeControlPoints/
 * durationSlow) but were never actually used anywhere until this.
 * Wrap the top-level content of a screen in this once, instead of
 * hand-rolling Animated.Value plumbing per screen.
 */
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ViewStyle} from 'react-native';
import {motion} from '../tokens';

export interface BerxFadeInProps {
	children: React.ReactNode;
	style?: ViewStyle;
	/** Stagger multiple BerxFadeIn regions on one screen (hero first, then body) — real ms, added on top of durationSlow's own delay-free start. */
	delayMs?: number;
	/** Rise distance in px — 0 for a pure fade (e.g. a full-bleed hero where a rise would clip). */
	riseFrom?: number;
	/**
	 * BERX WORLD TRANSFORMATION — optional starting scale (default 1 =
	 * no scale, every existing caller unaffected). A real "emergence"
	 * feel for entry sequences (directive §12/§14: material appearing
	 * from depth, not just fading in place) — e.g. 0.92 makes content
	 * grow slightly into view alongside the existing fade+rise.
	 */
	scaleFrom?: number;
}

export function BerxFadeIn({children, style, delayMs = 0, riseFrom = 12, scaleFrom = 1}: BerxFadeInProps) {
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(progress, {
			toValue: 1,
			duration: motion.durationSlow,
			delay: delayMs,
			easing: Easing.bezier(...motion.easeControlPoints),
			useNativeDriver: true,
		}).start();
	}, [progress, delayMs]);

	return (
		<Animated.View
			style={[
				style,
				{
					opacity: progress,
					transform: [
						{
							translateY: progress.interpolate({inputRange: [0, 1], outputRange: [riseFrom, 0]}),
						},
						{
							scale: progress.interpolate({inputRange: [0, 1], outputRange: [scaleFrom, 1]}),
						},
					],
				},
			]}
		>
			{/* React.Children.toArray, not a bare {children}: a caller writing
			    <BerxFadeIn>{a}{b}{c}</BerxFadeIn> hands us props.children as a
			    plain UNKEYED array, and passing that straight through as this
			    View's single child makes React reconcile it as a keyed list —
			    which logged a "unique key" warning on every screen that wraps
			    more than one element (most of them). toArray() is the API for
			    exactly this: it assigns stable keys and drops null/undefined
			    holes. Dev-only noise, but it was masking real warnings. */}
			{React.Children.toArray(children)}
		</Animated.View>
	);
}
