/**
 * BERX SPATIAL HERO — the renderer-abstracted BERX 3D identity object.
 * Same call shape as BerxOrb (light/fill/body/size/ring/shadow) so
 * it's a drop-in for every place BerxOrb already stands in as "the
 * object" (WorldSelectScreen).
 *
 * THIS FILE is the 2D-fallback half of the SpatialRenderer split.
 * SpatialHero.native.tsx (real @react-three/fiber/native + expo-gl
 * Three.js scene — camera, lit geometry, real rotation) sits beside
 * it and is picked automatically by Metro's own platform-extension
 * resolution on iOS/Android — that is what makes this a *fallback*
 * rather than the only implementation. This project's own web
 * verification harness (esbuild, build-harness.mjs) does not know
 * the `.native.` convention at all — its resolveExtensions list is
 * `.web.tsx → .tsx`, nothing else — so it never even sees the native
 * file; it always resolves straight to this one. Nothing here is
 * stubbed or gated at runtime: the split happens at the FILE level,
 * before either bundler even starts.
 *
 * Renders the same real, already-shipped BerxOrb (rim/terminator/
 * core/specular light model, real SVG gradients) every 2D scene in
 * BERX already uses — this file changes nothing about what ships to
 * web today, it only gives native somewhere real to diverge to.
 */
import {BerxOrb} from '../components/BerxOrb';
import type {BerxOrbProps} from '../components/BerxOrb';

export type SpatialHeroProps = BerxOrbProps;

export function SpatialHero(props: SpatialHeroProps) {
	return <BerxOrb {...props} />;
}
