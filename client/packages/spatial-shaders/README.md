# @berx/spatial-shaders

`world.wgsl` is the BERX forward pass, and it is the only copy of it.

Two backends run it: `@berx/spatial-web`'s WebGPU renderer, which imports
`BERX_WORLD_WGSL` from `src/index.ts`, and the native `berx-spatial-native`
crate, which `include_str!`s the `.wgsl` file directly.

`src/index.ts` is generated from `world.wgsl` by
`npm run generate:shaders`, because TypeScript cannot import a `.wgsl`
file without a bundler loader in every one of the places that bundle this
code. It is checked in so the build needs no extra step, and
`npm run verify:5d-shared-core` fails if the two ever stop matching — a
shader that has drifted between backends is exactly the kind of quiet
divergence the cross-renderer comparison exists to catch.

Edit `world.wgsl`. Never edit `src/index.ts`.
