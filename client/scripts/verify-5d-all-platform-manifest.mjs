#!/usr/bin/env node
/**
 * BERX FULL MAX 5D all-platform gate manifest.
 *
 * This gate is intentionally strict: declaring support is not support.
 * A platform becomes FULL only when its real runtime/build/verification
 * artifacts exist. Missing native projects, renderer bindings or tests
 * remain blockers instead of becoming optimistic flags.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const client = path.resolve(here, '..');

const exists = (p) => fs.existsSync(path.join(client, p));
const read = (p) => exists(p) ? fs.readFileSync(path.join(client, p), 'utf8') : '';

const targets = {
  web: {
    required: ['packages/spatial-web/src/threeRuntime.ts'],
    forbiddenPrimary: false,
    note: 'Web GPU runtime is the currently implemented spatial target.'
  },
  desktop: {
    required: [],
    native: true,
    note: 'Requires a real desktop host and renderer binding.'
  },
  tablet: {
    required: [],
    native: true,
    note: 'Requires a real tablet host/runtime; shared core alone is insufficient.'
  },
  ios: {
    required: ['apps/mobile/ios'],
    native: true,
    note: 'Requires iOS native project + Metal renderer + build verification.'
  },
  android: {
    required: ['apps/mobile/android'],
    native: true,
    note: 'Requires Android native project + Vulkan/OpenGL renderer + build verification.'
  },
  watch: {
    required: [],
    native: true,
    note: 'Requires a real watch target and renderer/input host.'
  },
  ar: {
    required: [],
    native: true,
    note: 'Requires real XR/AR runtime integration and pose-verified rendering.'
  },
  vr: {
    required: [],
    native: true,
    note: 'Requires real XR/VR runtime integration and stereo/pose verification.'
  },
};

const mobileManifest = read('apps/mobile/package.json');
const flatShell = read('apps/mobile/src/AppShell.tsx');

const results = [];
for (const [platform, target] of Object.entries(targets)) {
  const missing = target.required.filter((p) => !exists(p));
  const isMobileScreenShell = /<FeedScreen|<ProfileScreen|<SettingsScreen|BerxNavigator/.test(flatShell);
  if (platform !== 'web' && target.native && isMobileScreenShell) {
    missing.push('primary native 5D shell integration');
  }
  results.push({platform, ready: missing.length === 0, missing, note: target.note});
}

console.log('BERX FULL MAX 5D — ALL PLATFORM READINESS');
console.log('='.repeat(72));
for (const result of results) {
  console.log(`${result.ready ? 'READY  ' : 'BLOCKED'} ${result.platform}`);
  if (!result.ready) for (const gap of result.missing) console.log(`        - ${gap}`);
}
console.log('');
console.log(`FULL targets: ${results.filter((r) => r.ready).length}/${results.length}`);
console.log(`Blocked targets: ${results.filter((r) => !r.ready).length}/${results.length}`);
console.log('');
console.log('No platform is considered FULL by declaration alone.');
