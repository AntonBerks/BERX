<?php
/**
 * BERX integration service layer.
 *
 * Purpose: give every feature that needs an external API (maps, places,
 * events, ticketing, push) ONE stable place to call, so frontend/pages
 * never talk to a provider's SDK directly. Right now, with no keys
 * configured, every service returns ['configured' => false, ...] instead
 * of fabricated results — callers are expected to render a real empty/
 * disabled state (see BERX-INTEGRATIONS.md), never mocked data dressed up
 * as live content.
 *
 * When a real provider is wired in, only the body of these functions
 * changes — nothing calling them needs to.
 */

// Safe defaults so this library never fatals if an admin hasn't copied
// configurations/ossn.config.integrations.example.php yet — every
// constant defaults to "not configured" rather than an undefined-constant
// error.
foreach (array(
	'BERX_MAPS_PROVIDER', 'BERX_MAPS_API_KEY',
	'BERX_PLACES_PROVIDER', 'BERX_PLACES_API_KEY',
	'BERX_EVENTS_PROVIDER', 'BERX_EVENTS_API_KEY',
	'BERX_TICKETING_PROVIDER', 'BERX_TICKETING_API_KEY',
	'BERX_PAYMENTS_PROVIDER', 'BERX_PAYMENTS_SECRET_KEY',
	'BERX_PUSH_VAPID_PUBLIC', 'BERX_PUSH_VAPID_PRIVATE',
) as $berx_integration_const) {
	if (!defined($berx_integration_const)) {
		define($berx_integration_const, '');
	}
}
unset($berx_integration_const);

function berx_maps_service() {
	return array(
		'configured' => (bool) BERX_MAPS_API_KEY,
		'provider'   => BERX_MAPS_PROVIDER,
		/**
		 * geocode($address) => ['configured'=>bool,'lat'=>float,'lng'=>float] once wired.
		 * reverseGeocode($lat,$lng), nearby($lat,$lng,$radius,$type) follow the same shape.
		 */
	);
}

function berx_places_service() {
	return array(
		'configured' => (bool) BERX_PLACES_API_KEY,
		'provider'   => BERX_PLACES_PROVIDER,
		/**
		 * search($query, $city), getById($id), nearby($lat,$lng,$radius) —
		 * to implement once a provider (2GIS/Yandex/Google Places) is picked.
		 */
	);
}

function berx_events_service() {
	return array(
		'configured' => (bool) BERX_EVENTS_API_KEY,
		'provider'   => BERX_EVENTS_PROVIDER,
	);
}

function berx_ticketing_service() {
	return array(
		'configured' => (bool) BERX_TICKETING_API_KEY,
		'provider'   => BERX_TICKETING_PROVIDER,
	);
}

function berx_payments_service() {
	return array(
		'configured' => (bool) BERX_PAYMENTS_SECRET_KEY,
		'provider'   => BERX_PAYMENTS_PROVIDER,
	);
}

/**
 * Web push is the one integration that's safe to make partially real
 * without a third-party account: VAPID keys are self-generated. Still
 * reports 'configured' => false until an admin actually generates and
 * sets a keypair — no push subscription is attempted before that.
 */
function berx_push_service() {
	return array(
		'configured'  => (bool) (BERX_PUSH_VAPID_PUBLIC && BERX_PUSH_VAPID_PRIVATE),
		'public_key'  => BERX_PUSH_VAPID_PUBLIC,
	);
}
