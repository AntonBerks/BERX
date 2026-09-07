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

	$newUserGuid = $add->addUser();
	if ($newUserGuid) {
		// MAX BUILD — real Referrals: recorded now (registration), the
		// actual points reward waits for a real activated login below —
		// a registration alone proves nothing about a genuine user. Best-
		// effort: a malformed/unknown code never blocks account creation.
		// addUser() returns the real new guid directly (never sets
		// $this->guid on the instance — confirmed by reading it before
		// writing this, not assumed), so that return value is the only
		// real source for it here.
		$referralCode = input('referral_code');
		if ($referralCode && class_exists('OssnReferrals')) {
			$referrerGuid = OssnReferrals::resolveCode($referralCode);
			if ($referrerGuid) {
				(new OssnReferrals())->record(intval($newUserGuid), $referrerGuid);
			}
		}
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
	// `== null`, not `!== null`, because that is what OSSN's own
	// OssnUser::Login() checks (classes/OssnUser.php) — and because
	// ValidateRegistration(), the method behind the activation link OSSN
	// emails, clears the column to '' rather than to NULL. Under the
	// strict comparison this had, an account activated through the real
	// activation link was refused forever: the web login accepted it and
	// the API did not. Found by activating an account through the real
	// link and then logging in, which is the only way this shows up.
	if ($user->activation != null) {
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

	// MAX BUILD — real Referral reward: this is the first point a
	// referred user's account is PROVEN real (activation !== null was
	// already checked above — an unactivated account can never reach
	// here). Both sides rewarded once, via OssnPoints' own real
	// oneTime dedup keyed per referred user — a second login by the
	// same referred user is a real, silent no-op, never a double
	// reward. Best-effort: never blocks the login response itself.
	if (class_exists('OssnReferrals') && class_exists('OssnPoints')) {
		$referrerGuid = (new OssnReferrals())->getReferrer($user->guid);
		if ($referrerGuid) {
			$points = new OssnPoints();
			$reason = 'referral_activated:' . intval($user->guid);
			if (!$points->hasReason($referrerGuid, $reason)) {
				$points->award($referrerGuid, 50, $reason, intval($user->guid), true);
				$points->award($user->guid, 25, $reason, intval($referrerGuid), true);
			}
		}
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
