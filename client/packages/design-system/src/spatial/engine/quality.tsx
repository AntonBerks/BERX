/**
 * BERX SPATIAL ENGINE — quality, published to the scene graph.
 *
 * SpatialStage already resolves which tier a scene runs at. Without
 * this, that answer stayed inside the stage: any object that wanted to
 * pick a cheaper material or a coarser sphere had to be handed a
 * `quality` prop by its parent, which meant every scene re-threading
 * the same value through every node it draws — and meant a scene could
 * silently disagree with the stage it was standing on.
 *
 * One provider at the stage, one hook at the object. There is exactly
 * one answer per canvas and nobody has to carry it.
 *
 * PLATFORM: this file has NO `.native` twin and needs none — it imports
 * only React, so the same module is correct on iOS, Android and the web
 * harness. Keeping it out of stage.ts is deliberate: stage.ts is plain
 * dependency-free data, and a context is not data.
 */
import {createContext, useContext} from 'react';
import type {ReactNode} from 'react';
import {SPATIAL_GLASS_BY_QUALITY, SPATIAL_KEY_LIGHT} from './stage';
import type {SpatialQuality} from './stage';
import {useBerxColors} from '../../theme';

const SpatialQualityContext = createContext<SpatialQuality>('high');

export function SpatialQualityProvider({value, children}: {value: SpatialQuality; children: ReactNode}) {
	return <SpatialQualityContext.Provider value={value}>{children}</SpatialQualityContext.Provider>;
}

/**
 * The tier this object is being drawn at. Defaults to 'high' outside a
 * stage — a bare object rendered somewhere unexpected should look
 * right, not degraded.
 */
export function useSpatialQuality(): SpatialQuality {
	return useContext(SpatialQualityContext);
}

/**
 * The BERX glass recipe for the current tier, ready to spread onto a
 * <meshPhysicalMaterial>. This is the call site an object should use
 * rather than importing SPATIAL_GLASS_MATERIAL directly, so that
 * turning quality down actually reaches the materials.
 */
export function useSpatialGlass() {
	return SPATIAL_GLASS_BY_QUALITY[useSpatialQuality()];
}

/**
 * The LIVE key light — every real BERX 3D scene's brand accent, as
 * whichever of the five Obsidian & Aurora accents is actually
 * selected (useBerxColors().accent — see theme/index.tsx for the
 * switching itself), not stage.ts's own fixed SPATIAL_KEY_LIGHT
 * constant. stage.ts stays dependency-free on purpose (no React
 * import, so the web bundle can read its plain data without pulling
 * the native GL stack in) — this hook is the reactive call site a real
 * scene COMPONENT should use instead of importing that constant
 * directly, the same relationship useSpatialGlass() already has to
 * SPATIAL_GLASS_BY_QUALITY. Falls back to stage.ts's own constant
 * outside a BerxThemeProvider, so a scene rendered somewhere
 * unexpected still lights correctly rather than reading undefined.
 */
export function useSpatialKeyLight(): string {
	return useBerxColors().accent ?? SPATIAL_KEY_LIGHT;
}
