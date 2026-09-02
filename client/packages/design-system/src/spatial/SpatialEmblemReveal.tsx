/**
 * BERX SPATIAL EMBLEM REVEAL — the renderer-abstracted BOOT reveal:
 * the very first meaningful frame of the product (SplashScreen). Same
 * True3D/2D file-level split as SpatialEmblem, for the assembly
 * variant specifically (BerxEmblemReveal — staggered plane drop, ends
 * in the same pose SpatialEmblem/BerxEmblem hold everywhere else).
 *
 * This file is the 2D fallback (wraps the existing, unchanged
 * BerxEmblemReveal — pixel-identical to what Splash already shipped).
 * SpatialEmblemReveal.native.tsx sits beside it for Metro to resolve
 * on iOS/Android; this repo's web harness never sees that file (its
 * esbuild config has no `.native.` resolution).
 */
import {BerxEmblemReveal} from '../components/BerxEmblem';
import type {BerxEmblemRevealProps} from '../components/BerxEmblem';

export type SpatialEmblemRevealProps = BerxEmblemRevealProps;

export function SpatialEmblemReveal(props: SpatialEmblemRevealProps) {
	return <BerxEmblemReveal {...props} />;
}
