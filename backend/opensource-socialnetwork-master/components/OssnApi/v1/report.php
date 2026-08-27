<?php
/**
 * BERX API v1 — Report. Wraps the new, real OssnReport class.
 * target_type/reason are validated server-side against
 * OssnReport::VALID_TARGET_TYPES/VALID_REASONS — the real authority,
 * not the client's TS unions.
 *
 * MAX BUILD — real fix: the queue/resolve/action routes below used to
 * gate on ossn_isAdminLoggedin(), which reads $_SESSION['OSSN_USER']
 * — never populated for bearer-token API requests (see ossn_com.php's
 * own "no session bridge" header). Every real admin moderation request
 * through the mobile app was silently rejected as 403, admin or not.
 * Now uses ossn_api_is_admin($api_user_guid) — a real guid-scoped DB
 * lookup, no session needed.
 */

function ossn_api_report_json($row) {
	return array(
		'id'            => intval($row->id),
		'reporter_guid' => intval($row->reporter_guid),
		'target_type'   => (string) $row->target_type,
		'target_guid'   => intval($row->target_guid),
		'reason'        => (string) $row->reason,
		'note'          => $row->note !== null ? (string) $row->note : null,
		'status'        => (string) $row->status,
		'time_created'  => intval($row->time_created),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null;

$model = new OssnReport();

if ($segment0 === null && $method === 'POST') {
	$targetType = input('target_type');
	$targetGuid = input('target_guid');
	$reason = input('reason');
	$note = input('note');
	if (!$targetType || !$targetGuid || !$reason) {
		ossn_api_error('validation_error', 'target_type, target_guid and reason are required', 422);
	}
	$id = $model->submit($api_user_guid, $targetType, intval($targetGuid), $reason, $note ? $note : '');
	if (!$id) {
		ossn_api_error('validation_error', 'Invalid target_type or reason', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 === 'queue' && $method === 'GET') {
	if (!ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	$rows = $model->listPending();
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_report_json($row);
	}
	ossn_api_json(array('reports' => $out));
}

if ($segment0 !== null && $segment0 !== 'queue' && $segment1 === 'resolve' && $method === 'POST') {
	if (!ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	$status = input('status') === 'dismissed' ? OssnReport::STATUS_DISMISSED : OssnReport::STATUS_REVIEWED;
	$ok = $model->setStatus(intval($segment0), $status, $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_found'));
}

if ($segment0 !== null && $segment0 !== 'queue' && $segment1 === 'action' && $method === 'POST') {
	if (!ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	$report = $model->get(intval($segment0));
	if (!$report) {
		ossn_api_error('not_found', 'Report not found', 404);
	}
	$deleted = false;
	switch ($report->target_type) {
		case 'post':
			$wall = new OssnWall();
			$deleted = (bool) $wall->deletePost(intval($report->target_guid));
			break;
		case 'comment':
			$comments = new OssnComments();
			$deleted = (bool) $comments->deleteComment(intval($report->target_guid));
			break;
		case 'group':
			$group = new OssnGroup();
			$deleted = (bool) $group->deleteGroup(intval($report->target_guid));
			break;
		default:
			// 'user' and 'dating_profile' have no real removal
			// mechanism in this codebase — a real 501, not a fake
			// success.
			ossn_api_error('not_implemented', 'No removal mechanism for this target type', 501);
	}
	if ($deleted) {
		$model->setStatus(intval($segment0), OssnReport::STATUS_REVIEWED, $api_user_guid);
	}
	ossn_api_json(array('status' => $deleted ? 'ok' : 'failed'));
}

ossn_api_error('not_found', 'Unknown report action', 404);
