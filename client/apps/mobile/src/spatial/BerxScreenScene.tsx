/**
 * BerxScreenScene — how a BERX screen becomes a v9 scene.
 *
 * A screen names its contract id and gets the whole resolution: the
 * spatial scene, the depth layers, the state set, the analytics
 * contract, the navigation shell and the list of components the
 * backend cannot support. Screens do not assemble any of that
 * themselves, which is what stops 300 contracts becoming 300 slightly
 * different implementations.
 *
 * Device signals are stated honestly for React Native: no backdrop
 * filter without a native module, and no deviceMemory or
 * hardwareConcurrency to read. The performance resolver treats the
 * absence of signals as a reason to be conservative rather than
 * optimistic.
 */
import React, {createContext, useContext, useEffect, useMemo} from 'react';
import {Platform, StyleSheet, View, useWindowDimensions, type ImageSourcePropType} from 'react-native';
import {resolveScreen, type BerxResolvedScreen} from '@berx/scenes';
import type {BerxColorWorldName, BerxDeviceSignals, BerxPlatform} from '@berx/spatial';
import {BerxSpatialScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxSceneBackdrop} from '../../../../packages/design-system/src/spatial/BerxSceneBackdrop';
import {berxAnalytics} from './analytics';

const ScreenContext = createContext<BerxResolvedScreen | null>(null);

/**
 * Throws outside a scene, deliberately: a screen that reads its
 * contract must have one. Silently defaulting is how a screen ends up
 * with the wrong analytics ids and nobody notices.
 */
export function useBerxScreen(): BerxResolvedScreen {
	const value = useContext(ScreenContext);
	if (!value) throw new Error('BERX: useBerxScreen() called outside <BerxScreenScene>.');
	return value;
}

export function useBerxScreenOptional(): BerxResolvedScreen | null {
	return useContext(ScreenContext);
}

/**
 * React Native tells us very little about the device, and nothing at
 * all about GPU headroom. Rather than guess, the unknowns are left
 * unknown — resolvePerformanceBudget reads that as "be conservative".
 */
export function reactNativeDeviceSignals(reducedMotion: boolean, isTablet: boolean): BerxDeviceSignals {
	const platform: BerxPlatform = isTablet ? 'tablet' : Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
	return {
		platform,
		/* no backdrop filter without a native blur module; the material
		   resolver substitutes an opaque surface at the same elevation */
		supportsBackdropBlur: false,
		prefersReducedMotion: reducedMotion,
	};
}

export interface BerxScreenSceneProps {
	/** Contract id, e.g. 'BERX-031'. Resolved from @berx/scenes. */
	screenId: string;
	children: React.ReactNode;
	/** Real environmental media for D1. Omitted when the screen has none. */
	atmosphere?: ImageSourcePropType;
	/** Extra darkening for text-heavy scenes. */
	scrim?: number;
	colorWorld?: BerxColorWorldName;
	highContrast?: boolean;
	reducedMotion?: boolean;
	/** Emits the contract's screen_view once per mount. */
	trackView?: boolean;
	testID?: string;
}

export function BerxScreenScene({
	screenId,
	children,
	atmosphere,
	scrim,
	colorWorld,
	highContrast,
	reducedMotion = false,
	trackView = true,
	testID,
}: BerxScreenSceneProps) {
	const {width, height} = useWindowDimensions();
	const isTablet = Math.min(width, height) >= 600;

	const device = useMemo(() => reactNativeDeviceSignals(reducedMotion, isTablet), [reducedMotion, isTablet]);

	const screen = useMemo(
		() => resolveScreen({screen: screenId, device, viewportWidth: width, viewportHeight: height, colorWorld, highContrast}),
		[screenId, device, width, height, colorWorld, highContrast],
	);

	useEffect(() => {
		if (screen && trackView) berxAnalytics.screenView(screen);
	}, [screen, trackView]);

	if (!screen) {
		/**
		 * An unknown contract id is a programming error, not a user
		 * state. Rendering nothing is preferable to rendering a scene
		 * that pretends to be the requested one.
		 */
		throw new Error(`BERX: no v9 contract for "${screenId}".`);
	}

	return (
		<ScreenContext.Provider value={screen}>
			<BerxSpatialScene
				testID={testID}
				contract={screen.contract}
				device={device}
				colorWorld={colorWorld}
				highContrast={highContrast}>
				<BerxSceneBackdrop media={atmosphere} scrim={scrim} />
				<View style={styles.content}>{children}</View>
			</BerxSpatialScene>
		</ScreenContext.Provider>
	);
}

const styles = StyleSheet.create({
	content: {flex: 1},
});
