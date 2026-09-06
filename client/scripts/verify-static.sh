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
grep -qi "#07080A" "$ROOT/packages/design-system/src/tokens/index.ts"
grep -qi "#C9B58A" "$ROOT/packages/design-system/src/tokens/index.ts"

if grep -Eqi "#8b5cf6|#ec4899" "$ROOT/packages/design-system/src/tokens/index.ts"; then
  echo "FORBIDDEN LEGACY PURPLE/PINK ACCENT FOUND"
  exit 1
fi

echo "[BERX] Static checks passed."
