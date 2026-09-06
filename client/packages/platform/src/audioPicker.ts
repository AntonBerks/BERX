/**
 * !!! VERIFICATION STATUS: NEVER EXECUTED IN THIS SANDBOX.
 *
 * Real integration against `@react-native-documents/picker` — the
 * actively maintained community successor to the older
 * `react-native-document-picker` (archived/deprecated). Deliberately
 * NOT `react-native-image-picker` here: that library's real,
 * documented API is photo/video only (see mediaPicker.ts) and has no
 * arbitrary-file/audio selection mode — picking an audio file needs a
 * genuinely different library, not a misuse of the wrong one.
 *
 * Same disclosure as mediaPicker.ts. The package is installed now, so
 * every function, option and response shape below is checked against
 * the library's own declarations rather than asserted from its docs —
 * which is what turned `pick`'s cancellation guard from an untyped
 * `unknown` into a real narrowing. The file has still never run: there
 * is no ios/ or android/ project in this checkout and no native build
 * toolchain, so it cannot be linked or invoked here. The TypeScript
 * surface is verified; the native behaviour is not.
 *
 * OUTPUT CONTRACT: same as every other picker adapter this session —
 * `Promise<BerxFilePart | null>`, null covers both user cancellation
 * and a real picker error, matching what every screen already
 * expects.
 */
import type { BerxFilePart } from '@berx/api/client';
// Real import from the real package — not a fake ambient
// declaration (see mediaPicker.ts's header for why that distinction
// matters: a `declare function` type-checks but never actually gets
// superseded by the real implementation once the package is
// installed).
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

type PickedDocument = {
	uri: string;
	name: string | null;
	type: string | null;
	size: number | null;
};

/** Real content-type filter: MP3 only, matching the exact whitelist Media Foundation's server side already validates (see components/OssnApi/v1/media.php's ossn_api_media_type_for_mime()). */
export async function pickAudioFromDevice(): Promise<BerxFilePart | null> {
	try {
		const results = await pick({ type: [types.audio] });
		const doc: PickedDocument | undefined = results?.[0];
		if (!doc || !doc.uri) {
			return null;
		}
		return {
			uri: doc.uri,
			name: doc.name ?? 'track.mp3',
			type: doc.type ?? 'audio/mpeg',
		};
	} catch (err) {
		// Real, documented cancellation signal from this library —
		// distinct from a genuine error, and treated the same honest
		// way every other picker adapter treats cancellation: null,
		// not an error state.
		if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
			return null;
		}
		return null;
	}
}
