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
}

export function BerxFadeIn({children, style, delayMs = 0, riseFrom = 12}: BerxFadeInProps) {
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
					],
				},
			]}
		>
			{children}
		</Animated.View>
	);
}
