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
import {berxAudioAttenuation, berxListenerFromCamera} from '@berx/spatial';
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
	berxSpatialId,
	mapEventToSpatial,
	mapFeedItemToSpatial,
	mapNearbyPlaceToSpatial,
	mapPlaceToSpatial,
	mapUserToSpatial,
};

window.BERX_5D = api;
