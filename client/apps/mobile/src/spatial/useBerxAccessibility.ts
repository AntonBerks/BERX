/**
 * The device's real accessibility preferences.
 *
 * The spatial runtime already honours reduced motion and high
 * contrast — it removes parallax, tilt and ambient loops, and forces
 * opaque surfaces — but nothing was reading the settings on mobile:
 * BerxScreenScene took `reducedMotion` as a prop that defaulted to
 * false, so on iOS and Android the preference was silently ignored no
 * matter what the user had set.
 *
 * React Native exposes both for real:
 *   AccessibilityInfo.isReduceMotionEnabled()      — iOS + Android
 *   AccessibilityInfo.isReduceTransparencyEnabled() — iOS
 *
 * Reduce Transparency is exactly the archive's "opaque surface mode":
 * a person who has asked the OS to stop layering translucency should
 * not get glass from BERX either. Android has no equivalent setting,
 * so it stays false there rather than being guessed from something
 * else.
 *
 * Both are also subscribed to, not read once — someone can change
 * either while the app is open, and the scene re-resolves when they
 * do.
 */
import {useEffect, useState} from 'react';
import {AccessibilityInfo, Platform} from 'react-native';

export interface BerxAccessibilityPreferences {
	/** The OS "reduce motion" setting. */
	reducedMotion: boolean;
	/** iOS "reduce transparency" — the archive's opaque surface mode. */
	highContrast: boolean;
	/** True once both have actually been read; the defaults hold until then. */
	loaded: boolean;
}

export function useBerxAccessibility(): BerxAccessibilityPreferences {
	const [reducedMotion, setReducedMotion] = useState(false);
	const [highContrast, setHighContrast] = useState(false);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const readAll = async () => {
			const [motion, transparency] = await Promise.all([
				AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
				/* iOS-only; asking on Android returns nothing meaningful */
				Platform.OS === 'ios'
					? AccessibilityInfo.isReduceTransparencyEnabled().catch(() => false)
					: Promise.resolve(false),
			]);
			if (cancelled) return;
			setReducedMotion(motion);
			setHighContrast(transparency);
			setLoaded(true);
		};

		readAll();

		/* the preference can change while the app is open */
		const motionSub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
			if (!cancelled) setReducedMotion(enabled);
		});
		const transparencySub =
			Platform.OS === 'ios'
				? AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
						if (!cancelled) setHighContrast(enabled);
					})
				: null;

		return () => {
			cancelled = true;
			motionSub?.remove();
			transparencySub?.remove();
		};
	}, []);

	return {reducedMotion, highContrast, loaded};
}
