<?php
/**
 * BERX — external integrations config template.
 *
 * Copy to ossn.config.integrations.php and fill in real values, OR (better,
 * for anything resembling production) set these as actual environment
 * variables on the server and leave this file as-is — every constant below
 * only takes the getenv() value, it never hardcodes a key.
 *
 * Nothing in this codebase currently sends real requests to these services.
 * Until a key is present, the corresponding service class in
 * libraries/ossn.lib.integrations.php returns an explicit "not configured"
 * result — features that depend on it (map pins, real restaurant data,
 * ticket purchase, push delivery) show real empty/disabled states in the
 * UI rather than fabricated data. See BERX-INTEGRATIONS.md.
 */

// Maps / geocoding / places (e.g. Yandex Maps, 2GIS, Google Places — pick one)
define('BERX_MAPS_PROVIDER',   getenv('BERX_MAPS_PROVIDER')   ?: '');
define('BERX_MAPS_API_KEY',    getenv('BERX_MAPS_API_KEY')    ?: '');

// Restaurant/place data provider
define('BERX_PLACES_PROVIDER', getenv('BERX_PLACES_PROVIDER') ?: '');
define('BERX_PLACES_API_KEY',  getenv('BERX_PLACES_API_KEY')  ?: '');

// Events / afisha data provider
define('BERX_EVENTS_PROVIDER', getenv('BERX_EVENTS_PROVIDER') ?: '');
define('BERX_EVENTS_API_KEY',  getenv('BERX_EVENTS_API_KEY')  ?: '');

// Ticketing / payments
define('BERX_TICKETING_PROVIDER', getenv('BERX_TICKETING_PROVIDER') ?: '');
define('BERX_TICKETING_API_KEY',  getenv('BERX_TICKETING_API_KEY')  ?: '');
define('BERX_PAYMENTS_PROVIDER',  getenv('BERX_PAYMENTS_PROVIDER')  ?: '');
define('BERX_PAYMENTS_SECRET_KEY', getenv('BERX_PAYMENTS_SECRET_KEY') ?: '');

// Web push (VAPID keys) for browser/mobile notification delivery
define('BERX_PUSH_VAPID_PUBLIC',  getenv('BERX_PUSH_VAPID_PUBLIC')  ?: '');
define('BERX_PUSH_VAPID_PRIVATE', getenv('BERX_PUSH_VAPID_PRIVATE') ?: '');
