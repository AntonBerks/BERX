<?php
/**
 * BERX API v1 — Profiles (public view of another user by username).
 */

if ($method !== 'GET' || !isset($segments[0])) {
	ossn_api_error('not_found', 'Unknown profiles action', 404);
}

$username = urldecode($segments[0]);
$user = ossn_user_by_username($username);
if (!$user) {
	ossn_api_error('not_found', 'User not found', 404);
}

if (ossn_api_is_blocked($api_user_guid, $user->guid)) {
	ossn_api_error('not_found', 'User not found', 404);
}

$isOwn = intval($user->guid) === intval($api_user_guid);
$isFriend = false;
if (!$isOwn) {
	$checker = new OssnUser();
	$isFriend = (bool) $checker->isFriend($api_user_guid, $user->guid);
}
$isCreator = false;
if (class_exists('OssnCreator')) {
	$creatorModel = new OssnCreator();
	$isCreator = $creatorModel->isCreator($user->guid);
}

ossn_api_json(array(
	'guid'        => intval($user->guid),
	'username'    => (string) $user->username,
	'fullname'    => trim($user->first_name . ' ' . $user->last_name),
	'icon_url'    => (string) $user->iconURL()->large,
	'profile_url' => (string) $user->profileURL(),
	'is_own'      => $isOwn,
	'is_friend'   => $isFriend,
	'is_creator'  => (bool) $isCreator,
));
