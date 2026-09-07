<?php
/**
 * BERX API v1 — Points / Streak / Spend. Wraps the new, real
 * OssnPoints class (classes/OssnPoints.php) — server-authoritative
 * throughout, no client-supplied balance/date ever trusted.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null;
$segment2 = isset($segments[2]) ? $segments[2] : null;

$model = new OssnPoints();

if ($segment0 === null && $method === 'GET') {
	$balance = $model->getBalance($api_user_guid);
	if (!$balance) {
		ossn_api_error('not_found', 'Could not load balance', 500);
	}
	ossn_api_json($balance);
}

if ($segment0 === 'streak' && $segment1 === 'check-in' && $method === 'POST') {
	$result = $model->recordActivity($api_user_guid);
	ossn_api_json($result);
}

if ($segment0 === 'history' && $method === 'GET') {
	$rows = $model->history($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'delta'        => intval($row->delta),
			'reason'       => (string) $row->reason,
			'time_created' => intval($row->time_created),
		);
	}
	ossn_api_json(array('history' => $out));
}

if ($segment0 === 'spend' && $method === 'POST') {
	$reason = input('reason');
	$amount = input('amount');
	if (!$reason || !$amount) {
		ossn_api_error('validation_error', 'reason and amount are required', 422);
	}
	$result = $model->spend($api_user_guid, $reason, intval($amount));
	if (!is_int($result)) {
		$status = $result === 'insufficient_balance' ? 402 : 422;
		ossn_api_error((string) $result, 'Could not spend points', $status);
	}
	ossn_api_json(array('status' => 'ok', 'balance' => $result));
}

ossn_api_error('not_found', 'Unknown points action', 404);
