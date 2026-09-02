/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see components/BerxButton.tsx.
 *
 * BERX SAFE AREA — the one place the app asks how much of the screen it
 * is not allowed to draw in.
 *
 * REAL, MEASURED INSETS, NOT A GUESS. This wraps
 * react-native-safe-area-context, which reads the actual window insets
 * from the platform. BERX had NO safe-area handling of any kind before
 * this: every screen's first line of content — the editorial title on
 * NOW, PLACES, CREATE and every other header — was laid out from y=0
 * and therefore sat under the status bar and the notch on every modern
 * device. That is a real rendering defect, not a styling preference,
 * and it is fixed here once rather than by sprinkling magic numbers
 * into each screen.
 *
 * Screens import from HERE, not from the library, so:
 *  - there is exactly one place to change if the provider ever changes;
 *  - the minimum below is applied uniformly. `top` on a device with no
 *    cutout is genuinely 0, and content flush against the physical top
 *    edge looks broken even where it is technically legal, so BERX
 *    keeps a floor of its own.
 */
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {spacing} from './tokens';

export interface BerxInsets {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/** BERX never starts content closer than this to an edge, inset or not. */
const MIN_TOP = spacing.md;
const MIN_BOTTOM = spacing.sm;

export function useBerxInsets(): BerxInsets {
	const insets = useSafeAreaInsets();
	return {
		top: Math.max(insets.top, MIN_TOP),
		bottom: Math.max(insets.bottom, MIN_BOTTOM),
		left: insets.left,
		right: insets.right,
	};
}

export {SafeAreaProvider} from 'react-native-safe-area-context';
