/**
 * BERX SPATIAL LENS — the renderer-abstracted, RESTRAINED BERX object
 * (Welcome's own mood, distinct from SpatialHero's confident World
 * Select orb — see BerxLens.tsx's own header for why the two are
 * deliberately different objects, not one component with a knob).
 *
 * Same split as SpatialHero: this file is the 2D fallback (wraps the
 * existing, unchanged BerxLens); SpatialLens.native.tsx is picked up
 * automatically by Metro on iOS/Android and is never seen by this
 * repo's web verification harness (its esbuild config has no
 * `.native.` resolution at all).
 */
import {BerxLens} from '../components/BerxLens';
import type {BerxLensProps} from '../components/BerxLens';

export type SpatialLensProps = BerxLensProps;

export function SpatialLens(props: SpatialLensProps) {
	return <BerxLens {...props} />;
}
