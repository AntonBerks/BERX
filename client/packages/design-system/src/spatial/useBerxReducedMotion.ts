/**
 * Whether motion should stop, for a component that may be outside a
 * scene.
 *
 * A scene already resolves this — `scene.reducedMotion` is what the
 * runtime removes parallax, tilt and ambient loops from — so inside
 * one that answer wins, unchanged and free.
 *
 * Outside a scene the answer was previously "no", by omission. That
 * is how the loading glyph came to spin forever for someone who had
 * asked the OS to stop animations: its own header documented that it
 * stops under reduced motion, and nothing was reading the setting.
 * The skeleton blocks pulsed through it for the same reason.
 *
 * So a component with no scene above it asks the OS directly, through
 * the same React Native API the app's own preference hook uses, and
 * subscribes rather than reading once — the setting can change while
 * the app is open.
 */
import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';
import {useBerxSceneOptional} from './BerxSpatialScene';

export function useBerxReducedMotion(): boolean {
	const scene = useBerxSceneOptional();
	const inScene = scene !== null;
	const [systemPreference, setSystemPreference] = useState(false);

	useEffect(() => {
		/* inside a scene the resolved value is authoritative; asking the
		   OS again would be a second source for one answer */
		if (inScene) return;
		let cancelled = false;

		AccessibilityInfo.isReduceMotionEnabled()
			.then((enabled) => {
				if (!cancelled) setSystemPreference(enabled);
			})
			.catch(() => undefined);

		const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
			if (!cancelled) setSystemPreference(enabled);
		});

		return () => {
			cancelled = true;
			sub?.remove();
		};
	}, [inScene]);

	return scene?.scene.reducedMotion ?? systemPreference;
}
