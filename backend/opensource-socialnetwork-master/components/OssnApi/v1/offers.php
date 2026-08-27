<?php
/**
 * BERX API v1 — Business Offers (BERX WORLD MAX BUILD). Routing + JSON
 * over the real OssnBusinessOffers class. Deliberately no payment/
 * coupon-code system — see OssnBusinessOffers's own header for why —
 * this is a real claim+in-person-fulfill primitive, same honest shape
 * as a punch card.
 */

function ossn_api_offer_json($row, $offersModel = null, $viewerGuid = null) {
	$json = array(
		'id'                => intval($row->id),
		'place_guid'        => intval($row->place_guid),
		'title'             => (string) $row->title,
		'description'       => $row->description !== null ? (string) $row->description : '',
		'max_redemptions'   => $row->max_redemptions !== null ? intval($row->max_redemptions) : null,
		'redemptions_count' => intval($row->redemptions_count),
		'ends_at'           => $row->ends_at !== null ? intval($row->ends_at) : null,
		'active'            => (bool) intval($row->active),
		'time_created'      => intval($row->time_created),
	);
	/** Viewer-scoped: lets the client show real claimed/unclaimed state instead of a
	 *  claim button that always renders and just errors on a second tap. */
	if ($offersModel !== null && $viewerGuid) {
		$redemption = $offersModel->getRedemption(intval($row->id), intval($viewerGuid));
		$json['already_claimed'] = (bool) $redemption;
		$json['already_fulfilled'] = $redemption ? (bool) intval($redemption->fulfilled) : false;
	} else {
		$json['already_claimed'] = false;
		$json['already_fulfilled'] = false;
	}
	return $json;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'places' | offer id
$segment1 = isset($segments[1]) ? $segments[1] : null; // place guid (under 'places') | 'claim'|'fulfill'|'redemptions'
$segment2 = isset($segments[2]) ? $segments[2] : null; // user guid (under 'fulfill')

$offers = new OssnBusinessOffers();

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && !isset($segments[2]) && $method === 'GET') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$rows = $offers->listActiveForPlace(intval($segment1));
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_offer_json($row, $offers, $api_user_guid);
	}
	ossn_api_json(array('offers' => $out));
}

/** Owner/team/admin only — every offer, including inactive/expired/exhausted, for the real business dashboard. */
if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'all' && $method === 'GET') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$rows = $offers->listAllForPlace($place, $api_user_guid);
	if ($rows === false) {
		ossn_api_error('forbidden', 'Not allowed to manage this place', 403);
	}
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_offer_json($row, $offers, $api_user_guid);
	}
	ossn_api_json(array('offers' => $out));
}

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && !isset($segments[2]) && $method === 'POST') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$fields = array(
		'title'           => input('title'),
		'description'     => input('description'),
		'max_redemptions' => input('max_redemptions'),
		'ends_at'         => input('ends_at'),
	);
	$result = $offers->createOffer($place, $api_user_guid, $fields);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to create offers for this place', 403);
	}
	if ($result === 'invalid_title' || $result === 'failed') {
		ossn_api_error('validation_error', 'title is required (max 120 chars)', 422);
	}
	ossn_api_json(array('id' => intval($result)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'claim' && $method === 'POST') {
	$result = $offers->claim(intval($segment0), $api_user_guid);
	if ($result === 'rate_limited') {
		ossn_api_error('rate_limited', 'Too many claim attempts — try again in a minute', 429);
	}
	if ($result === 'not_available') {
		ossn_api_error('not_available', 'This offer is no longer available', 410);
	}
	if ($result === 'already_claimed') {
		ossn_api_error('conflict', 'You already claimed this offer', 409);
	}
	if ($result !== 'ok') {
		ossn_api_error('claim_failed', 'Could not claim offer', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

/** Owner/team/admin only — real in-person fulfillment, never auto-triggered by claim(). */
if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'fulfill' && $segment2 !== null && is_numeric($segment2) && $method === 'POST') {
	$offer = $offers->getOffer($segment0);
	if (!$offer || !class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Offer not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($offer->place_guid);
	if (!$place) {
		ossn_api_error('not_found', 'Offer not found', 404);
	}
	$result = $offers->fulfill(intval($segment0), intval($segment2), $place, $api_user_guid);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to manage this place', 403);
	}
	if ($result === 'not_claimed') {
		ossn_api_error('not_found', 'This user has not claimed the offer', 404);
	}
	if ($result === 'already_fulfilled') {
		ossn_api_error('conflict', 'Already marked as used', 409);
	}
	if ($result !== 'ok') {
		ossn_api_error('fulfill_failed', 'Could not mark offer as used', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

/** Owner/team/admin only — real claimant list. */
if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'redemptions' && $method === 'GET') {
	$offer = $offers->getOffer($segment0);
	if (!$offer || !class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Offer not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($offer->place_guid);
	if (!$place) {
		ossn_api_error('not_found', 'Offer not found', 404);
	}
	$rows = $offers->redemptionsForOffer(intval($segment0), $place, $api_user_guid);
	if ($rows === false) {
		ossn_api_error('forbidden', 'Not allowed to manage this place', 403);
	}
	$out = array();
	foreach ($rows as $row) {
		$user = ossn_user_by_guid($row->user_guid);
		if ($user) {
			$out[] = array(
				'guid'           => intval($user->guid),
				'username'       => (string) $user->username,
				'fullname'       => trim($user->first_name . ' ' . $user->last_name),
				'icon'           => (string) $user->iconURL()->large,
				'fulfilled'      => (bool) intval($row->fulfilled),
				'time_created'   => intval($row->time_created),
				'time_fulfilled' => $row->time_fulfilled !== null ? intval($row->time_fulfilled) : null,
			);
		}
	}
	ossn_api_json(array('redemptions' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'DELETE') {
	$offer = $offers->getOffer($segment0);
	if (!$offer || !class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Offer not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($offer->place_guid);
	if (!$place) {
		ossn_api_error('not_found', 'Offer not found', 404);
	}
	$ok = $offers->deactivateOffer(intval($segment0), $place, $api_user_guid);
	if (!$ok) {
		ossn_api_error('forbidden', 'Not allowed to manage this offer', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown offers route', 404);
