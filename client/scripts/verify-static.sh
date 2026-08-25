#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[BERX] Checking required mobile files..."
for f in \
  "$ROOT/package.json" \
  "$ROOT/apps/mobile/package.json" \
  "$ROOT/index.js" \
  "$ROOT/babel.config.js" \
  "$ROOT/metro.config.js" \
  "$ROOT/apps/mobile/src/AppShell.tsx" \
  "$ROOT/apps/mobile/src/platform/secureTokenStorage.ts"; do
  test -f "$f" || { echo "MISSING: $f"; exit 1; }
done

grep -q "BerxSecureTokenStorage" "$ROOT/apps/mobile/src/AppShell.tsx"
grep -q "#8b5cf6" "$ROOT/packages/design-system/src/tokens/index.ts"
grep -q "#ec4899" "$ROOT/packages/design-system/src/tokens/index.ts"

echo "[BERX] Static checks passed."
