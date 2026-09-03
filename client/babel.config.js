module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-reanimated's own documented requirement: this plugin
  // MUST be listed last, or worklets (the functions Reanimated moves
  // onto the UI thread) silently fail to compile correctly on native.
  // NOT verified against a real native build in this container (no
  // ios/android project, no toolchain) — the esbuild-based web harness
  // does not read this file at all (esbuild has its own JSX/TS
  // transform, no babel step), so this specific requirement has no
  // verification path here. If a native build ever reports Reanimated
  // values not updating or a "Reanimated 2" mismatch error, confirm
  // this entry is present and genuinely last before looking elsewhere.
  plugins: ['react-native-reanimated/plugin'],
};
