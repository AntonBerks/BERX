<?php
/**
 * BERX API v1 — Business (top-level: claims/team/subscription/hours).
 * No new class, no new table: routing + JSON over the already-real
 * OssnBusiness + OssnPlaceHours + OssnPlaces. Matches client.ts's
 * Business/team/subscription/hours methods and types.ts's
 * BerxPlaceClaim/BerxBusinessTeamMember/BerxBusinessSubscription/
 * BerxPlaceHours field-for-field. Distinct from places.php's own
 * /places/{guid}/business/enable|disable|verify|dashboard branches.
 */

function ossn_api_place_claim_json($row) {
	return array(
		'id'             => intval($row->id),
		'place_guid'     => intval($row->place_guid),
		'requester_guid' => intval($row->requester_guid),
		'message'        => $row->message !== null && $row->message !== '' ? (string) $row->message : null,
		'status'         => (string) $row->status,
		'time_created'   => intval($row->time_created),
		'time_reviewed'  => $row->time_reviewed !== null ? intval($row->time_reviewed) : null,
	);
}

function ossn_api_business_team_json($row) {
	$user = ossn_user_by_guid($row->member_guid);
	if (!$user) {
		return null;
	}
	return array(
		'guid'     => intval($user->guid),
		'username' => (string) $user->username,
		'fullname' => trim($user->first_name . ' ' . $user->last_name),
		'icon'     => (string) $user->iconURL()->large,
		'role'     => (string) $row->role,
	);
}

function ossn_api_business_subscription_json($sub) {
	if (!$sub) {
		return array('status' => 'none', 'entitled' => false, 'monthly_price_rub' => OssnBusiness::MONTHLY_PRICE_RUB);
	}
	$entitled = (new OssnBusiness())->hasActiveAccess($sub->place_guid);
	$status = $sub->status;
	if ($status === OssnBusiness::STATUS_TRIAL && !$entitled) {
		$status = 'expired';
	}
	return array(
		'plan'              => (string) $sub->plan,
		'status'            => (string) $status,
		'trial_started_at'  => intval($sub->trial_started_at),
		'trial_ends_at'     => intval($sub->trial_ends_at),
		'entitled'          => $entitled,
		'monthly_price_rub' => OssnBusiness::MONTHLY_PRICE_RUB,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'places'|'claims'|'reviews'
$segment1 = isset($segments[1]) ? $segments[1] : null; // place guid | claim id | review guid | 'mine'|'pending'
$segment2 = isset($segments[2]) ? $segments[2] : null; // 'claim'|'team'|'subscription'|'hours'|'type'|'reply'|'approve'|'reject'|'start-trial'
$segment3 = isset($segments[3]) ? $segments[3] : null; // team member guid

$business = new OssnBusiness();

/* ---- claims ---- */

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'claim' && $method === 'POST') {
	if (!class_exists('OssnPlaces') || !(new OssnPlaces())->getPlace($segment1)) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$id = $business->submitClaim($segment1, $api_user_guid, input('message') ?: '');
	if (!$id) {
		ossn_api_error('conflict', 'A pending claim already exists', 409);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 === 'claims' && $segment1 === 'mine' && $method === 'GET') {
	$rows = $business->myClaims($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_place_claim_json($row);
	}
	ossn_api_json(array('claims' => $out));
}

if ($segment0 === 'claims' && $segment1 === 'pending' && $method === 'GET') {
	if (!ossn_isAdminLoggedin()) {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	$rows = $business->pendingClaims();
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_place_claim_json($row);
	}
	ossn_api_json(array('claims' => $out));
}

if ($segment0 === 'claims' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'approve' && $method === 'POST') {
	$result = $business->reviewClaim($segment1, $api_user_guid, true);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Claim not found or already reviewed', 404);
	}
	ossn_api_json(array('status' => $result === true ? 'ok' : 'failed'));
}

if ($segment0 === 'claims' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'reject' && $method === 'POST') {
	$result = $business->reviewClaim($segment1, $api_user_guid, false);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Claim not found or already reviewed', 404);
	}
	ossn_api_json(array('status' => $result === true ? 'ok' : 'failed'));
}

/* ---- review replies ---- */

if ($segment0 === 'reviews' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'reply' && ($method === 'POST' || $method === 'DELETE')) {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Review not found', 404);
	}
	$places = new OssnPlaces();
	$review = $places->reviewById($segment1);
	if (!$review) {
		ossn_api_error('not_found', 'Review not found', 404);
	}
	$place = $places->getPlace($review->place_guid);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($method === 'POST') {
		$text = input('text');
		if (!$text) {
			ossn_api_error('validation_error', 'text is required', 422);
		}
		if (!$business->canReply($place->owner_guid, $api_user_guid)) {
			ossn_api_error('forbidden', 'Not allowed to reply to this review', 403);
		}
		$ok = $business->upsertReply($segment1, $place->guid, $api_user_guid, $text);
		if (!$ok) {
			ossn_api_error('validation_error', 'Invalid reply', 422);
		}
		$reply = $business->getReply($segment1);
		ossn_api_json(array(
			'text'         => (string) $reply->text,
			'time_created' => intval($reply->time_created),
			'time_updated' => intval($reply->time_updated),
		));
	}
	// DELETE
	$ok = $business->deleteReply($segment1, $api_user_guid, $place->owner_guid);
	if (!$ok) {
		ossn_api_error('forbidden', 'Not allowed to delete this reply', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

/* ---- team ---- */

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'team' && $segment3 === null && $method === 'GET') {
	$rows = $business->team($segment1);
	$out = array();
	foreach ($rows as $row) {
		$json = ossn_api_business_team_json($row);
		if ($json) {
			$out[] = $json;
		}
	}
	ossn_api_json(array('team' => $out));
}

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'team' && $segment3 === null && $method === 'POST') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$userGuid = input('user_guid');
	$role = input('role');
	if (!$userGuid || !is_numeric($userGuid) || !$role) {
		ossn_api_error('validation_error', 'user_guid and role are required', 422);
	}
	$result = $business->addTeamMember($place, $api_user_guid, intval($userGuid), $role);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	if ($result === 'invalid_member' || $result === 'already_member') {
		ossn_api_error('validation_error', $result, 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'team' && $segment3 !== null && $method === 'DELETE') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$ok = $business->removeTeamMember($place, $api_user_guid, $segment3);
	if (!$ok) {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

/* ---- subscription ---- */

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'subscription' && $segment3 === null && $method === 'GET') {
	ossn_api_json(ossn_api_business_subscription_json($business->getSubscription($segment1)));
}

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'subscription' && $segment3 === 'start-trial' && $method === 'POST') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	// OssnBusiness::ensureTrialStarted() takes $actingGuid but never
	// checks it against anything — real ownership gate enforced here,
	// not assumed inside that method.
	if (!$business->canManage($place, $api_user_guid)) {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	$sub = $business->ensureTrialStarted($segment1, $api_user_guid);
	ossn_api_json(ossn_api_business_subscription_json($sub));
}

/* ---- type ---- */

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'type' && $method === 'POST') {
	$type = input('business_type');
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$result = (new OssnPlaces())->setBusinessType($segment1, $api_user_guid, $type);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed', 403);
	}
	if ($result === 'invalid') {
		ossn_api_error('validation_error', 'Invalid business_type', 422);
	}
	ossn_api_json(array('business_type' => $type));
}

/* ---- hours ---- */

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'hours' && $method === 'GET') {
	$hours = new OssnPlaceHours();
	$rows = $hours->forPlace($segment1);
	$intervals = array();
	foreach ($rows as $row) {
		$intervals[] = array('weekday' => intval($row->weekday), 'open' => intval($row->open_minute), 'close' => intval($row->close_minute));
	}
	ossn_api_json(array('intervals' => $intervals, 'is_open_now' => $hours->isOpenAt($segment1)));
}

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'hours' && $method === 'POST') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$raw = input('intervals');
	$decoded = $raw ? json_decode($raw, true) : null;
	if (!is_array($decoded)) {
		ossn_api_error('validation_error', 'intervals is required (JSON array)', 422);
	}
	$result = (new OssnPlaceHours())->replaceSchedule($place, $api_user_guid, $decoded);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	if ($result === 'invalid' || $result === 'invalid_interval') {
		ossn_api_error('validation_error', 'Invalid intervals', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown business route', 404);
