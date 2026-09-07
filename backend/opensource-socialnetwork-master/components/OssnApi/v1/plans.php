<?php
/**
 * BERX API v1 — Plans. A genuinely new BERX object, not a REST
 * wrapper over something OSSN already had — see classes/OssnPlans.php
 * for the full domain rationale (People + Time + Place + Activity,
 * can transform into a real Event).
 *
 * Routes:
 *   POST   /plans                     create (owner + optional invite_guids)
 *   GET    /plans/mine                real "my plans" (owned + invited, merged)
 *   GET    /plans/{id}                detail — owner or invitee only
 *   POST   /plans/{id}/respond        {accept: bool} — invitee only
 *   POST   /plans/{id}/cancel         owner only
 *   POST   /plans/{id}/convert        owner only — Plan -> real Event
 */

function ossn_api_plan_json($plan, $viewerGuid, $plansModel) {
	$owner = ossn_user_by_guid($plan->owner_guid);
	$place = null;
	if ($plan->place_guid && class_exists('OssnPlaces')) {
		$place = (new OssnPlaces())->getPlace($plan->place_guid);
	}
	$myInvite = $plansModel->getInvite($plan->id, $viewerGuid);
	$isOwner = $plansModel->isOwner($plan, $viewerGuid);

	$invites = array();
	// Real, bounded disclosure: the invite list (who's coming, who
	// hasn't answered) is only ever shown to people already IN the
	// plan (owner or an invitee) — canView() already gated the whole
	// request to exactly that set, so this is never handed to a
	// stranger, same privacy shape as an event's own attendee list.
	foreach ($plansModel->invitesForPlan($plan->id) as $invite) {
		$invitedUser = ossn_user_by_guid($invite->user_guid);
		$invites[] = array(
			'user_guid' => intval($invite->user_guid),
			'username'  => $invitedUser ? (string) $invitedUser->username : null,
			'icon'      => $invitedUser ? (string) $invitedUser->iconURL()->large : null,
			'status'    => (string) $invite->status,
		);
	}

	return array(
		'id'                 => intval($plan->id),
		'owner_guid'         => intval($plan->owner_guid),
		'owner_username'     => $owner ? (string) $owner->username : null,
		'title'              => (string) $plan->title,
		'notes'              => $plan->notes !== null ? (string) $plan->notes : null,
		'place_guid'         => $plan->place_guid !== null ? intval($plan->place_guid) : null,
		'place_title'        => $place ? (string) $place->title : null,
		'starts_at'          => $plan->starts_at !== null ? intval($plan->starts_at) : null,
		'status'             => (string) $plan->status,
		'created_event_guid' => $plan->created_event_guid !== null ? intval($plan->created_event_guid) : null,
		'time_created'       => intval($plan->time_created),
		'is_owner'           => $isOwner,
		'my_invite_status'   => $myInvite ? (string) $myInvite->status : ($isOwner ? 'owner' : null),
		'invites'            => $invites,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'mine' | plan id
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'respond' | 'cancel' | 'convert'

$plans = new OssnPlans();

if ($segment0 === null && $method === 'POST') {
	// Comma-separated string, not a JSON array — same real, already-
	// proven convention admin.php's own /validate route uses for
	// multi-guid input (input()'s array-decoding path for a raw JSON
	// array field is unverified in this codebase; the comma-string
	// path is not).
	$inviteGuids = array();
	$rawInvites = (string) input('invite_guids');
	if ($rawInvites !== '') {
		foreach (explode(',', $rawInvites) as $g) {
			$g = trim($g);
			if (is_numeric($g)) {
				$inviteGuids[] = intval($g);
			}
		}
	}
	$id = $plans->createPlan($api_user_guid, array(
		'title'        => input('title'),
		'notes'        => input('notes'),
		'place_guid'   => input('place_guid'),
		'starts_at'    => input('starts_at'),
		'invite_guids' => $inviteGuids,
	));
	if (!$id) {
		ossn_api_error('validation_error', 'title is required (max 120 chars)', 422);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 === 'mine' && $method === 'GET') {
	$limit = input('limit') ? max(1, min(100, intval(input('limit')))) : 50;
	$rows = $plans->myPlans($api_user_guid, $limit);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_plan_json($row, $api_user_guid, $plans);
	}
	ossn_api_json(array('plans' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'GET') {
	$plan = $plans->getPlan($segment0);
	if (!$plan) {
		ossn_api_error('not_found', 'Plan not found', 404);
	}
	if (!$plans->canView($plan, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to view this plan', 403);
	}
	ossn_api_json(array('plan' => ossn_api_plan_json($plan, $api_user_guid, $plans)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'respond' && $method === 'POST') {
	// Same real convention experiences.php's own /respond route uses
	// for the identical field name.
	$accept = input('accept') === '1';
	$result = $plans->respondInvite($segment0, $api_user_guid, $accept);
	if ($result === 'not_invited') {
		ossn_api_error('forbidden', 'You are not invited to this plan', 403);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not respond to plan', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'cancel' && $method === 'POST') {
	$result = $plans->cancelPlan($segment0, $api_user_guid);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Plan not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only the plan owner can cancel it', 403);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not cancel plan', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'convert' && $method === 'POST') {
	$result = $plans->convertToEvent($segment0, $api_user_guid);
	if ($result['status'] === 'not_found') {
		ossn_api_error('not_found', 'Plan not found', 404);
	}
	if ($result['status'] === 'forbidden') {
		ossn_api_error('forbidden', 'Only the plan owner can convert it', 403);
	}
	if ($result['status'] === 'missing_place_or_time') {
		ossn_api_error('validation_error', 'A plan needs both a place and a time before it can become an event', 422);
	}
	if ($result['status'] !== 'ok') {
		ossn_api_error('failed', 'Could not convert plan to event', 422);
	}
	ossn_api_json(array('status' => 'ok', 'event_guid' => intval($result['event_guid'])));
}

ossn_api_error('not_found', 'Unknown plans action', 404);
