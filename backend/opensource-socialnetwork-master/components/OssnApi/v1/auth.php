<?php
/**
 * BERX API v1 — Auth. The ONLY public resource (see
 * components/OssnApi/ossn_com.php's whitelist) — $api_user_guid is
 * always null here; every branch below decides its own identity
 * requirement individually rather than relying on the dispatcher.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 === 'register' && $method === 'POST') {
	// Mirrors actions/user/register.php's real field mapping and
	// validation sequence exactly (same class, same method calls, same
	// order) — minus the web-only `email_re` double-entry field, which
	// has no API equivalent (client.ts's register() never sends one).
	$username  = input('username');
	$firstname = input('firstname');
	$lastname  = input('lastname');
	$email     = input('email');
	$password  = input('password');

	if (!$username || !$firstname || !$lastname || !$email || !$password) {
		ossn_api_error('validation_error', 'Missing required fields', 422);
	}

	$add = new OssnUser();
	$add->username        = $username;
	$add->first_name      = $firstname;
	$add->last_name       = $lastname;
	$add->email           = $email;
	$add->password        = $password;
	$add->sendactiviation = true;
	$add->validated       = false;

	if (!$add->isUsername()) {
		ossn_api_error('invalid_username', 'Invalid username', 422);
	}
	if (!$add->isPassword()) {
		ossn_api_error('invalid_password', 'Invalid password', 422);
	}
	if ($add->isOssnUsername()) {
		ossn_api_error('username_taken', 'Username already in use', 409);
	}
	if ($add->isOssnEmail()) {
		ossn_api_error('email_taken', 'Email already in use', 409);
	}
	if (!$add->isEmail()) {
		ossn_api_error('invalid_email', 'Invalid email', 422);
	}

	if ($add->addUser()) {
		// No token here, deliberately — same real constraint the web
		// signup flow has: the account needs email activation
		// (validated=false above) before a real login can succeed.
		ossn_api_json(array(
			'status'  => 'ok',
			'message' => 'Account created. Check your email to activate it before logging in.',
		));
	}
	ossn_api_error('create_failed', 'Could not create account', 500);
}

if ($segment0 === 'login' && $method === 'POST') {
	$identifier   = input('username_or_email');
	$password     = input('password');
	$deviceLabel  = input('device_label');

	if (!$identifier || !$password) {
		ossn_api_error('validation_error', 'Missing credentials', 422);
	}

	$tokenModel = new OssnApiToken();
	if ($tokenModel->isLoginRateLimited($identifier)) {
		ossn_api_error('rate_limited', 'Too many login attempts — try again later', 429);
	}
	$ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	// Recorded for EVERY attempt (success or failure) before we know
	// the outcome — a correct password on the 11th try inside the
	// window must not reset the counter, matching the real intent of a
	// login rate limit.
	$tokenModel->recordLoginAttempt($identifier, $ip);

	// getUser() checks email first, then username (see
	// classes/OssnUser.php) — setting both to the same raw identifier
	// implements "username OR email" login using the real, unmodified
	// core lookup, not a reimplementation of it.
	$auth = new OssnUser();
	$auth->email    = $identifier;
	$auth->username = $identifier;
	$auth->password = $password;
	$user = $auth->authenticate();

	if (!$user) {
		ossn_api_error('invalid_credentials', 'Invalid username/email or password', 401);
	}
	if ($user->activation !== null) {
		ossn_api_error('not_activated', 'Account is not activated yet', 403);
	}
	// MAX BUILD -- real ban enforcement at login too: without this, a
	// banned user's login would still succeed and issue a real, valid
	// token -- only their SECOND request would hit ossn_com.php's own
	// ban check and fail, a confusing "login worked then everything
	// broke" experience instead of one clear rejection right here.
	if (!empty($user->banned)) {
		ossn_api_error('account_banned', 'Аккаунт заблокирован администрацией BERX.', 403);
	}

	$issued = $tokenModel->issueToken($user->guid, $deviceLabel ? $deviceLabel : null);
	if (!$issued) {
		ossn_api_error('token_failed', 'Could not issue token', 500);
	}

	ossn_api_json(array(
		'token'      => $issued['token'],
		'user_guid'  => intval($user->guid),
		'expires_at' => intval($issued['expires_at']),
	));
}

if ($segment0 === 'logout' && $method === 'POST') {
	// Best-effort: revoke whatever token was sent, if any. Not an
	// error if it's missing or already invalid — the client clears its
	// local copy unconditionally right after this call either way (see
	// client.ts's logout()), so there is nothing more a failure here
	// would protect against.
	$token = ossn_api_bearer_token();
	if ($token !== null) {
		$tokenModel = new OssnApiToken();
		$tokenModel->revokeByRawToken($token);
	}
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown auth action', 404);
