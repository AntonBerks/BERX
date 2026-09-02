/**
 * BERX SPATIAL EMBLEM — the renderer-abstracted BERX architectural
 * object (three stacked planes — Discover's per-page icon-object and
 * Splash's reveal use this form; see BerxEmblem.tsx's own header for
 * why it is a plane stack rather than the Lens disc or the Hero
 * sphere — three distinct, deliberate objects, not one component with
 * a mode switch).
 *
 * Same file-level True3D/2D split as SpatialHero/SpatialLens: this
 * file is the 2D fallback (wraps the existing, unchanged BerxEmblem —
 * what this repo's web verification harness always resolves to, since
 * its esbuild config has no `.native.` resolution at all).
 * SpatialEmblem.native.tsx sits beside it for Metro to pick up on iOS/
 * Android.
 */
import {BerxEmblem} from '../components/BerxEmblem';
import type {BerxEmblemProps} from '../components/BerxEmblem';

export type SpatialEmblemProps = BerxEmblemProps;

export function SpatialEmblem(props: SpatialEmblemProps) {
	return <BerxEmblem {...props} />;
}
