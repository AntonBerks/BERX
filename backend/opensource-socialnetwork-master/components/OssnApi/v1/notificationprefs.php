<?php
/**
 * BERX API v1 — Notification Preferences. Real, enforced opt-out —
 * see classes/OssnNotificationPrefs.php's own header for the full
 * mechanism (OssnNotifications::add() itself now consults this table
 * before creating a notification row).
 */

$segment0 = isset($segments[0]) ? $segments[0] : null; // pref_type for PATCH

$model = new OssnNotificationPrefs();

if ($segment0 === null && $method === 'GET') {
	ossn_api_json(array('prefs' => $model->getAll($api_user_guid)));
}

if ($segment0 !== null && $method === 'PATCH') {
	$type = (string) $segment0;
	if (!in_array($type, OssnNotificationPrefs::knownTypes(), true)) {
		ossn_api_error('not_found', 'Unknown notification type', 404);
	}
	$enabledRaw = input('enabled');
	$enabled = $enabledRaw === '1' || $enabledRaw === 'true' || $enabledRaw === true;
	$ok = $model->setEnabled($api_user_guid, $type, $enabled);
	if (!$ok) {
		ossn_api_error('validation_error', 'Could not update preference', 422);
	}
	ossn_api_json(array('status' => 'ok', 'prefs' => $model->getAll($api_user_guid)));
}

ossn_api_error('not_found', 'Unknown notificationprefs route', 404);
