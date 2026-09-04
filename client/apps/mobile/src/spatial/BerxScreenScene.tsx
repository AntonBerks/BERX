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
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {Platform, StyleSheet, useWindowDimensions, type ImageSourcePropType} from 'react-native';
import {getFamilyContracts, resolveScreen, type BerxResolvedScreen} from '@berx/scenes';
import {berxAtmosphereForFamily} from '@berx/spatial';
import type {BerxAtmosphereKind, BerxFamily} from '@berx/spatial';
import type {BerxColorWorldName, BerxDeviceSignals, BerxPlatform} from '@berx/spatial';
import {BerxSpatialScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxSceneBackdrop} from '../../../../packages/design-system/src/spatial/BerxSceneBackdrop';
import {BerxContentFrame} from '../../../../packages/design-system/src/spatial/BerxResponsive';
import {berxAnalytics} from './analytics';
import {useBerxColorWorld} from './BerxColorWorld';
import {useBerxAccessibility} from './useBerxAccessibility';

const ScreenContext = createContext<BerxResolvedScreen | null>(null);

/**
 * How a screen tells its scene what the environment is made of.
 *
 * A detail screen loads its own domain object — a trip, an album, a
 * business's place — and only then knows what real media the room
 * should be lit by. Hoisting that fetch into the scene wrapper would
 * mean fetching the same object twice, so instead the screen body
 * publishes the media it already has upward.
 *
 * `undefined` is the honest default and stays that way: a screen
 * whose domain object carries no media leaves the scene lit by its
 * family's own atmosphere rather than by a stand-in image.
 */
const AtmosphereContext = createContext<((media: ImageSourcePropType | undefined) => void) | null>(null);

/** Stable identity for a source, so the effect below does not re-fire every render. */
function mediaKey(media: ImageSourcePropType | undefined): string {
	if (media === undefined) return '';
	if (typeof media === 'number') return `asset:${media}`;
	if (Array.isArray(media)) return media.map((m) => m.uri ?? '').join('|');
	return media.uri ?? '';
}

/**
 * Publishes real domain media as this scene's D1 atmosphere for as
 * long as the calling screen is mounted. Pass `undefined` when the
 * object has none — that is a real answer, not a missing one.
 */
export function useBerxSceneAtmosphere(media: ImageSourcePropType | undefined): void {
	const set = useContext(AtmosphereContext);
	const key = mediaKey(media);
	useEffect(() => {
		if (!set) return;
		set(media);
		return () => set(undefined);
		// media is identified by `key`; the object literal is new every render
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [set, key]);
}

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
	/**
	 * The character of the environment. Defaults to the contract
	 * family's — PLACES is lit like a location, MESSAGES like a
	 * conversation — and is named explicitly only when a screen's
	 * content is more specific than its family: a trip inside
	 * PLACES, the wallet inside PROFILE, a story inside SOCIAL.
	 */
	atmosphereKind?: BerxAtmosphereKind;
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
	atmosphereKind,
	scrim,
	colorWorld,
	highContrast,
	reducedMotion,
	trackView = true,
	testID,
}: BerxScreenSceneProps) {
	const {width, height} = useWindowDimensions();
	/**
	 * The device's real settings. Until this landed, the runtime
	 * honoured reduced motion perfectly and nothing on mobile ever
	 * told it the user had asked for it.
	 */
	const preferences = useBerxAccessibility();
	const wantsReducedMotion = reducedMotion ?? preferences.reducedMotion;
	const wantsHighContrast = highContrast ?? preferences.highContrast;
	const isTablet = Math.min(width, height) >= 600;
	/**
	 * The chosen colour world applies to every scene, so personalising
	 * it shifts the whole app's atmosphere rather than one screen's.
	 * An explicit `colorWorld` prop still wins, for previewing a world
	 * before committing to it.
	 */
	const {world} = useBerxColorWorld();
	const activeWorld = colorWorld ?? world;

	/* Media published from inside the screen, once its own data loads. */
	const [liveMedia, setLiveMedia] = useState<ImageSourcePropType | undefined>(undefined);
	const publishMedia = useCallback((m: ImageSourcePropType | undefined) => setLiveMedia(m), []);

	const device = useMemo(
		() => reactNativeDeviceSignals(wantsReducedMotion, isTablet),
		[wantsReducedMotion, isTablet],
	);

	const screen = useMemo(
		() =>
			resolveScreen({
				screen: screenId,
				device,
				viewportWidth: width,
				viewportHeight: height,
				colorWorld: activeWorld,
				highContrast: wantsHighContrast,
			}),
		[screenId, device, width, height, activeWorld, wantsHighContrast],
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
			<AtmosphereContext.Provider value={publishMedia}>
			<BerxSpatialScene
				testID={testID}
				contract={screen.contract}
				device={device}
				colorWorld={activeWorld}
				highContrast={wantsHighContrast}>
				<BerxSceneBackdrop
					media={atmosphere ?? liveMedia}
					kind={atmosphereKind ?? berxAtmosphereForFamily(screen.contract.family)}
					scrim={scrim}
				/>
				{/**
				 * The layout contract every scene carries, applied once
				 * here: content is held to maxContentWidth and centred. A
				 * no-op on a phone, and the difference between a BERX
				 * scene and a stretched mobile app on a desktop.
				 */}
				<BerxContentFrame screen={screen} style={styles.content}>
					{children}
				</BerxContentFrame>
			</BerxSpatialScene>
			</AtmosphereContext.Provider>
		</ScreenContext.Provider>
	);
}

/**
 * A scene for a BERX screen that is not one of the 300.
 *
 * The archive names 29 screens and leaves 271 numbered contracts with
 * no product logic. BERX has real screens the archive never named —
 * a post's detail view, the points ledger, a place's page — and they
 * still belong to a family and still deserve that family's space.
 *
 * This renders the family's *lead* contract, which is the one the
 * archive actually described, and deliberately emits no contract
 * analytics: borrowing BERX-031's spatial definition is honest,
 * reporting a BERX-031 view from a different screen is not. The
 * screen keeps its own naming.
 *
 * It is not a way to quietly claim contract coverage. A screen
 * rendered this way is not counted as one of the 300 anywhere.
 */
export interface BerxFamilySceneProps extends Omit<BerxScreenSceneProps, 'screenId' | 'trackView'> {
	family: BerxFamily;
}

export function BerxFamilyScene({family, children, ...rest}: BerxFamilySceneProps) {
	const lead = getFamilyContracts(family)[0];
	if (!lead) throw new Error(`BERX: family "${family}" has no contracts.`);
	return (
		<BerxScreenScene {...rest} screenId={lead.screenId} trackView={false}>
			{children}
		</BerxScreenScene>
	);
}

const styles = StyleSheet.create({
	content: {flex: 1},
});
