/**
 * BERX SPATIAL STAGE — 2D fallback.
 *
 * The web/harness half of the True3D/2D file split. This repo's
 * esbuild harness has no `.native.` resolution (see build-harness.mjs),
 * so it always lands here and NEVER parses SpatialStage.native.tsx —
 * which is why native-only GL code can live beside this file without
 * any risk of reaching the web bundle.
 *
 * There is no meaningful 2D equivalent of "a lit 3D stage", so this
 * renders nothing but the sized box. Callers are expected to be
 * object components (SpatialHero, SpatialBeacon, …) whose OWN .tsx
 * fallback draws the real 2D object — this file is only ever reached
 * when something asks for the raw stage on web.
 */
import {View, ViewStyle} from 'react-native';
import type {ReactNode} from 'react';
import type {SpatialQuality} from './stage';

export interface SpatialStageProps {
	children?: ReactNode;
	/** Which camera language this scene speaks. */
	camera?: 'object' | 'hero' | 'scene';
	quality?: SpatialQuality;
	/** Scales the whole lighting rig on native. No-op here — 2D has no rig. */
	intensity?: number;
	/**
	 * Draws the contact disc under the subject on native. No-op here.
	 *
	 * Declared even though it is unused because TypeScript resolves the
	 * `.tsx` half of this split, not the `.native.tsx` one: a prop that
	 * exists only on the native half is a type error at every call site
	 * that passes it. Accept-and-ignore keeps the two halves one type.
	 */
	grounded?: boolean;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export function SpatialStage({width, height, style}: SpatialStageProps) {
	return <View pointerEvents="none" style={[{width, height}, style]} />;
}
