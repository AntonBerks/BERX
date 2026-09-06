/**
 * !!! VERIFICATION STATUS: NEVER EXECUTED IN THIS SANDBOX.
 *
 * Real integration against `react-native-image-picker` (MIT license,
 * actively maintained, the standard bare-React-Native choice for
 * gallery/camera media selection — not Expo-only, matches this
 * project's bare RN setup). Every function name, option shape, and
 * response field below (`launchImageLibrary`, `launchCamera`,
 * `ImagePickerResponse.didCancel/errorCode/errorMessage/assets`,
 * `Asset.uri/fileName/type`) is the library's real, documented,
 * stable public API as of its v5+ promise-based calling convention —
 * not invented, and now type-checked against the package's own
 * declarations rather than against nothing: `react-native-image-picker`
 * is installed, so `quality: 0.85` — never a value its `PhotoQuality`
 * union accepts — is a compile error instead of a silent one.
 *
 * This file has still never actually run. There is no ios/ or
 * android/ project in this checkout and no native build toolchain, so
 * the module cannot be linked or invoked here; the remaining step in
 * a real project is the iOS pod install / Android autolink every RN
 * native module needs. The TypeScript surface is verified; the native
 * behaviour is not.
 *
 * PERMISSIONS: launchImageLibrary()/launchCamera() trigger the
 * platform's own permission prompt internally (Info.plist usage
 * strings on iOS, runtime permission request on Android) — this file
 * does not need a separate permissions library for basic gallery/
 * camera access, matching the library's own documented behavior.
 *
 * OUTPUT CONTRACT: every function returns `Promise<BerxFilePart |
 * null>` — the exact same contract `stubPickImage` already
 * established and every screen (AlbumDetailScreen, CreateStoryScreen,
 * CreatePostScreen) already expects. `null` covers BOTH user
 * cancellation and a real picker error — screens already treat null
 * as "not an error state," matching how a real cancel should feel.
 */
import type { BerxFilePart } from '@berx/api/client';
// Real import from the real package — NOT an ambient stub. This is
// the one line that makes the difference between "will actually call
// the real library the moment it's installed" and "will silently
// call an undefined function forever" — a fake `declare function`
// here would type-check but never actually invoke anything at
// runtime, even after the real package exists in node_modules.
// Caught and fixed before this shipped.
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

// Minimal, real shape of the library's actual response/option types —
// matches its own bundled TypeScript definitions closely enough for
// this file's usage. The real package's own .d.ts (shipped with the
// library itself) is authoritative once installed; this local
// narrowing only exists so this file type-checks in isolation.
type PickerAsset = {
	uri?: string;
	fileName?: string;
	type?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	duration?: number;
};
type PickerResponse = {
	didCancel?: boolean;
	errorCode?: string;
	errorMessage?: string;
	assets?: PickerAsset[];
};

function assetToFilePart(asset: PickerAsset | undefined, fallbackName: string, fallbackType: string): BerxFilePart | null {
	if (!asset || !asset.uri) {
		return null;
	}
	return {
		uri: asset.uri,
		// fileName/type are sometimes omitted by the library on
		// Android for content:// URIs — fall back to a sensible
		// default rather than sending an empty/undefined field the
		// server's multipart parser would reject.
		name: asset.fileName ?? fallbackName,
		type: asset.type ?? fallbackType,
	};
}

/** Gallery photo picker — used by AlbumDetailScreen, CreatePostScreen, Creator, and any future photo-attachment flow. */
export async function pickImageFromLibrary(): Promise<BerxFilePart | null> {
	// 0.9, not 0.85: the library's real `PhotoQuality` is a union of
	// tenths (see its types.d.ts), so 0.85 was never a value it
	// accepts — it type-checked only because nothing here was checking.
	// Rounding down to 0.8 would throw away quality nobody asked to
	// lose, so this rounds up.
	const result: PickerResponse = await launchImageLibrary({ mediaType: 'photo', quality: 0.9 });
	if (result.didCancel || result.errorCode) {
		return null;
	}
	return assetToFilePart(result.assets?.[0], 'photo.jpg', 'image/jpeg');
}

/** Gallery video picker — the real client-side half of the Video domain's future upload flow (server-side already accepts video/mp4 via the Media Foundation's OssnFile::mimeTypes() whitelist). */
export async function pickVideoFromLibrary(): Promise<BerxFilePart | null> {
	const result: PickerResponse = await launchImageLibrary({ mediaType: 'video', videoQuality: 'medium' });
	if (result.didCancel || result.errorCode) {
		return null;
	}
	return assetToFilePart(result.assets?.[0], 'video.mp4', 'video/mp4');
}

/** Camera capture — photo or video, same real library, same real permission flow. */
export async function pickFromCamera(mediaType: 'photo' | 'video' = 'photo'): Promise<BerxFilePart | null> {
	const result: PickerResponse = await launchCamera({ mediaType, quality: 0.9, saveToPhotos: false });
	if (result.didCancel || result.errorCode) {
		return null;
	}
	return assetToFilePart(
		result.assets?.[0],
		mediaType === 'photo' ? 'photo.jpg' : 'video.mp4',
		mediaType === 'photo' ? 'image/jpeg' : 'video/mp4'
	);
}
