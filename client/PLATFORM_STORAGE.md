# BERX — Platform Token Storage Strategy

`@berx/core`'s `BerxTokenStorage` interface is the only thing every
platform must implement. `BerxInMemoryTokenStorage` (same package) is
**development-only** — see its doc comment. None of the real platform
implementations below have been built yet: this sandbox has no npm
registry access (confirmed via a real `npm view` call returning 403),
so none of the packages they'd need can be installed or their real
behavior verified here.

| Platform | Real implementation to use | Status |
|---|---|---|
| iOS / Android (React Native) | `expo-secure-store` (Keychain/Keystore-backed) | Not built — package not installable here |
| Web | `localStorage` wrapped behind the same interface, or an httpOnly-cookie-issued session if the API grows one later | Not built |
| Windows / macOS / Linux (desktop) | Depends on the desktop shell chosen (Electron `safeStorage`, Tauri's stronghold, etc.) — no desktop shell has been chosen yet | Not built, blocked on a desktop-framework decision this session hasn't made |

## What "implement `BerxTokenStorage`" actually means

Each real implementation is expected to be roughly this shape (shown,
not built, since it needs a package this sandbox can't install):

```ts
// apps/mobile — once expo-secure-store is actually installable
import * as SecureStore from 'expo-secure-store';
import type { BerxTokenStorage } from '@berx/core';

export const secureTokenStorage: BerxTokenStorage = {
	getToken: () => SecureStore.getItemAsync('berx_token'),
	setToken: (token) =>
		token
			? SecureStore.setItemAsync('berx_token', token)
			: SecureStore.deleteItemAsync('berx_token'),
};
```

This snippet is illustrative, not shipped code — it's not in any
`packages/` or `apps/` file, specifically so it can't be mistaken for
something already built and verified.
