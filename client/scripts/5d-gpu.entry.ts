/**
 * Browser entry for the 5D GPU verification.
 *
 * It exposes the real host and the real mappers to the page, so the
 * assertions in verify-5d-runtime.mjs drive the same code the product
 * would — not a reimplementation written for the test.
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtime5d';
import {resolveSpatialQuality} from '@berx/spatial-web/runtimeQuality';
import {BerxWebSpatialAudio} from '@berx/spatial-web/spatialAudioWeb';
import {berxAudioAttenuation, berxListenerFromCamera, berxShoulderInverse} from '@berx/spatial';
import {runWebGPUProduction13GateVerification} from '@berx/spatial/verification/webgpuProduction13Gate';
import {
	berxSpatialId,
	mapEventToSpatial,
	mapFeedItemToSpatial,
	mapNearbyPlaceToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
} from '@berx/scenes';

declare global {
	interface Window {
		BERX_5D: typeof api;
	}
}

const api = {
	createBerx5DWebHost,
	resolveSpatialQuality,
	BerxWebSpatialAudio,
	berxAudioAttenuation,
	berxListenerFromCamera,
	runWebGPUProduction13GateVerification,
	berxSpatialId,
	mapEventToSpatial,
	mapFeedItemToSpatial,
	mapNearbyPlaceToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
};

/**
 * The tone curve's inverse, for measurements that are about LIGHT.
 *
 * A gate reading pixels off a tone-mapped frame is reading a picture,
 * and the shoulder compresses relative contrast in it on purpose. A
 * question like "does this point light brighten what is near it" is
 * about radiance, so the pixels have to be brought back to radiance
 * before they are compared. Exposed from the shared core rather than
 * re-typed here: one set of constants, and a gate that re-implemented
 * them could agree with itself while disagreeing with the renderer.
 */
(api as unknown as Record<string, unknown>).shoulderInverse = berxShoulderInverse;
window.BERX_5D = api;
