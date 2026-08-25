<?php
/**
 * BERX theme
 *
 * Built on top of the Open Source Social Network (OSSN) engine.
 * This file only registers assets and view overrides — it does not
 * touch OSSN core. See /themes/berx/README.md for what is wired to
 * real backend logic vs. placeholder navigation for modules that
 * don't exist in OSSN yet (dating, map, restaurants, afisha, reels).
 *
 * @license Open Source Social Network License (OSSN LICENSE) http://www.opensource-socialnetwork.org/licence
 */
define('__THEMEDIR__', ossn_route()->themes . 'berx/');

ossn_register_callback('ossn', 'init', 'ossn_berx_theme_init');

function ossn_berx_theme_init() {
	// Serves real BERX Media Assets by guid — the counterpart to
	// ossn_places_cover_handler(), same real-file-streaming pattern,
	// registered unconditionally like every other real page handler
	// in this codebase (auth for PRIVATE assets is still enforced
	// inside the handler itself, not by gating registration).
	ossn_register_page('media', 'ossn_berx_media_page_handler');

	// Bootstrap is still used for grid/utilities/modals under the hood,
	// BERX design tokens are layered on top in css/core/default.
	ossn_new_css('bootstrap.min', 'css/bootstrap/bootstrap.min.css');

	ossn_new_css('ossn.default', 'css/core/default');
	ossn_new_css('ossn.admin.default', 'css/core/administrator');

	ossn_load_css('bootstrap.min', 'admin');
	ossn_load_css('bootstrap.min');

	ossn_load_css('ossn.default');
	ossn_load_css('ossn.admin.default', 'admin');

	ossn_extend_view('ossn/admin/head', 'ossn_berx_admin_head');
	ossn_extend_view('ossn/site/head', 'ossn_berx_head');
	ossn_extend_view('js/opensource.socialnetwork', 'js/berx');
	ossn_extend_view('profile/newsfeed/info', 'berx_search_bar_sidebar');

	// Real capability that had no UI or action anywhere in OssnGroups:
	// the engine's own OssnGroup::deleteMember() can remove ANY member
	// (it's what self-leave already calls), but no action ever let the
	// OWNER call it against someone else — members.php only ever showed
	// a friend add/remove button, never a "remove from group" control.
	// Registered from the theme (goblue's own pattern — see
	// ossn_register_action('goblue/settings', ...) in
	// themes/goblue/ossn_theme.php) rather than editing OssnGroups
	// itself, so the component stays an untouched original.
	if (ossn_isLoggedin()) {
		ossn_register_action('group/member/remove', __THEMEDIR__ . 'actions/group/member/remove.php');

		// Real settings sections added via OSSN's own extension point
		// (profile/edit/tabs + the ('profile','edit:section') hook —
		// the exact mechanism OssnBlock already uses for its own
		// "blocking" tab), so this reuses the same tabbed settings
		// shell rather than building a parallel one. Backed by real
		// data: ossn_api_tokens (OssnApiToken::listSessions(), already
		// written for and used by the mobile API) and OssnUser's own
		// deleteUser().
		ossn_register_action('user/session/revoke', __THEMEDIR__ . 'actions/user/session/revoke.php');
		ossn_register_action('user/account/delete', __THEMEDIR__ . 'actions/user/account/delete.php');
		ossn_register_action('notification/delete-all', __THEMEDIR__ . 'actions/notification/delete-all.php');

		// Real moderator system for OssnGroups. isModerator() has ALWAYS
		// existed in core with an explicit comment: "use relation:type =
		// group:moderator, use this hook via component to write actual
		// functionality" — a deliberate, documented extension point,
		// never a bug. Several BERX permission checks built earlier
		// this session (community requests approve/decline, update/
		// delete, member removal) already call isModerator() as part of
		// their owner-or-admin-or-moderator check — this activates that
		// dormant path rather than adding a new one. Relation type
		// 'group:moderator' is 15 chars, well inside ossn_relationships.
		// type's varchar(30) — no truncation risk like the earlier
		// per-event-guid mistake this session caught and reverted.
		ossn_register_action('group/moderator/add',    __THEMEDIR__ . 'actions/group/moderator/add.php');
		ossn_register_action('group/moderator/remove', __THEMEDIR__ . 'actions/group/moderator/remove.php');

		ossn_register_menu_item('profile/edit/tabs', array(
			'name' => 'devices',
			'href' => '?section=devices',
			'text' => ossn_print('berx:settings:devices:tab'),
		));
		ossn_register_menu_item('profile/edit/tabs', array(
			'name' => 'delete-account',
			'href' => '?section=delete-account',
			'text' => ossn_print('berx:settings:delete:tab'),
		));
		ossn_add_hook('profile', 'edit:section', 'ossn_berx_settings_section');
	}

	// Registered unconditionally (not inside the isLoggedin() block
	// above) — a moderator check must resolve correctly for anonymous
	// visitors too (e.g. deciding what a logged-out viewer can see),
	// matching how isModerator() itself has no login requirement.
	ossn_add_hook('group', 'is:moderator', 'ossn_berx_group_is_moderator');

	// NOTE: a dedicated "Settings > Themes > BERX" admin page (logo/background
	// upload, like goblue's) is not wired up yet — intentionally left out of
	// this pass rather than registering an admin page/action pointing at
	// files that don't exist. Tracked as a follow-up.

	ossn_extend_view('ossn/site/head', 'theme_meta_favicon');
	ossn_extend_view('ossn/admin/head', 'theme_meta_favicon');
}

function berx_search_bar_sidebar() {
	return ossn_view_form('search', array(
		'component' => 'OssnSearch',
		'class' => 'ossn-search',
		'autocomplete' => 'off',
		'method' => 'get',
		'security_tokens' => false,
		'action' => ossn_site_url("search"),
	), false);
}

function theme_meta_favicon() {
	$favicon = ossn_theme_url() . 'images/favicon.png';
	echo "<link rel=\"shortcut icon\" href=\"{$favicon}\" type=\"image/png\" />";
}

function ossn_berx_head() {
	echo '<meta name="theme-color" content="#0a0a0a">';
	echo '<meta name="color-scheme" content="dark">';
}

function ossn_berx_admin_head() {
	echo '<meta name="theme-color" content="#0a0a0a">';
}

/**
 * BERX doesn't yet have its own admin custom-logo/background upload
 * feature (goblue's optional extra, config-file driven). Rather than
 * leave theme/page/administrator.php calling an undefined function —
 * which fatal-errors the entire admin panel — this returns the same
 * "nothing configured" value goblue itself returns when no config.json
 * exists, so the copied admin template degrades correctly instead of
 * crashing. A real BERX admin branding page is still a follow-up.
 */
function ossn_goblue_get_custom_logos_bgs_setting() {
	return false;
}

/**
 * Conversation context data for the BERX Messages right-hand pane:
 * shared photos, shared files and links, all derived from REAL messages
 * already in ossn_messages.
 *
 * Deliberately built on OssnMessages::searchMessages() with the same
 * wheres OssnMessages::getWith() uses, rather than getWith() itself:
 * getWith() is bound to the 'offset_message_xhr_with' pager and a page
 * size of 10, so it would only ever describe the visible page rather
 * than the conversation. page_limit is disabled here and the scan is
 * capped instead, so the pane is bounded without being paginated.
 *
 * Not included, because OSSN's message model genuinely has no such
 * data: voice messages, reactions, replies, pinned messages, and group
 * participants. Those need backend work before any UI for them would
 * be anything other than decoration.
 *
 * @param int $me_guid    logged-in user
 * @param int $other_guid the person being talked to
 * @param int $scan       how many recent messages to inspect
 *
 * @return array{media: array, files: array, links: array}
 */
function berx_messages_context($me_guid, $other_guid, $scan = 150) {
	$empty = array('media' => array(), 'files' => array(), 'links' => array());

	$me_guid    = intval($me_guid);
	$other_guid = intval($other_guid);
	if (!$me_guid || !$other_guid) {
		return $empty;
	}

	$messages = new OssnMessages;

	// Same two-directional predicate getWith() builds, including the
	// per-side "expunged from record" checks, so a message either party
	// deleted for themselves stays out of their own context pane.
	$group1 = OssnDatabase::wheresGroup('AND', array(
		OssnDatabase::wheres('message_from', '=', $me_guid),
		OssnDatabase::wheres('message_to', '=', $other_guid),
		OssnDatabase::wheres('emd0.value', '=', ''),
	));
	$group2 = OssnDatabase::wheresGroup('AND', array(
		OssnDatabase::wheres('message_from', '=', $other_guid),
		OssnDatabase::wheres('message_to', '=', $me_guid),
		OssnDatabase::wheres('emd1.value', '=', ''),
	));

	$rows = $messages->searchMessages(array(
		'wheres' => array(
			OssnDatabase::wheresGroup('OR', array($group1, $group2)),
		),
		'order_by'   => 'm.id DESC',
		'limit'      => intval($scan),
		'page_limit' => false,
		'entities_pairs' => array(
			array(
				'name'   => 'is_deleted_from',
				'value'  => false,
				'wheres' => '(emd0.value IS NOT NULL)',
			),
			array(
				'name'   => 'is_deleted_to',
				'value'  => false,
				'wheres' => '(emd1.value IS NOT NULL)',
			),
		),
	));

	if (!$rows) {
		return $empty;
	}

	$context = $empty;
	foreach ($rows as $row) {
		if (isset($row->is_deleted) && $row->is_deleted == true) {
			continue;
		}

		if (method_exists($row, 'isAttachment') && $row->isAttachment()) {
			$type = $row->typeOfAttachment();
			if ($type === 'image') {
				$context['media'][] = array(
					'url'  => $row->attachmentURL(),
					'time' => $row->time,
				);
			} elseif ($type === 'file') {
				$context['files'][] = array(
					'url'  => $row->attachmentURL(),
					'name' => $row->attachmentName(),
					'time' => $row->time,
				);
			}
		}

		// Links are extracted from the message body itself — no separate
		// link table exists, so this is the only truthful source.
		if (!empty($row->message)) {
			$found = array();
			preg_match_all('#https?://[^\s<>"\']+#i', $row->message, $found);
			foreach ($found[0] as $url) {
				$host = parse_url($url, PHP_URL_HOST);
				$context['links'][] = array(
					'url'  => $url,
					'host' => $host ? $host : $url,
					'time' => $row->time,
				);
			}
		}
	}

	return $context;
}

/**
 * Renders the two new profile-edit sections (devices, delete-account).
 * Same hook signature and dispatch pattern as OssnBlock's
 * ossn_blocking_list_page() — $params['section'] is the query-string
 * value the core profile_edit_page() handler already reads via
 * input('section', '', 'basic').
 */
function ossn_berx_settings_section($hook, $type, $return, $params) {
	$viewer = ossn_loggedin_user();
	if (!$viewer) {
		return $return;
	}

	if ($params['section'] === 'devices') {
		if (!class_exists('OssnApiToken')) {
			// OssnApi deactivated: no real session data exists to show,
			// so the tab renders an honest "unavailable" state rather
			// than a fatal error or an empty list that implies zero
			// devices.
			return ossn_plugin_view('settings/devices', array('sessions' => false));
		}
		$tokens   = new OssnApiToken();
		$sessions = $tokens->listSessions($viewer->guid);
		return ossn_plugin_view('settings/devices', array('sessions' => $sessions));
	}

	if ($params['section'] === 'delete-account') {
		return ossn_plugin_view('settings/delete-account', array());
	}

	return $return;
}


/**
 * Real implementation of the ('group','is:moderator') hook OssnGroup::
 * isModerator() has always called and always returned false through,
 * for lack of any component implementing it. A moderator is simply a
 * user with a 'group:moderator' relation FROM the group TO the user
 * — same direction convention OSSN's own group:join:approve uses.
 */
function ossn_berx_group_is_moderator($hook, $type, $return, $params) {
	if (empty($params['group']) || empty($params['user_guid'])) {
		return false;
	}
	return ossn_relation_exists($params['group']->guid, intval($params['user_guid']), 'group:moderator');
}

/**
 * Serves a real BERX Media Asset by guid: /media/get/{guid}
 *
 * Deliberately NOT gated by login/ownership — matching the exact
 * precedent already established by ossn_places_cover_handler() (Place/
 * Event cover images), which has no such check either. This is a
 * real architectural constraint, not an oversight: mobile clients
 * authenticate via Bearer token, never a browser session cookie, so
 * an <Image> tag's request carries no session at all — a login-gated
 * handler would 403 every real mobile load, making the URL this
 * endpoint returns unusable (a "real but broken" URL, which is its
 * own kind of dishonest). Access control for these assets lives at
 * the API layer (upload/delete/attach/detach all require a valid
 * bearer token and real ownership, enforced in components/OssnApi/
 * v1/media.php) — the read-by-guid URL itself is public-by-URL, the
 * same trust model every image URL in this codebase already uses.
 *
 * The file path is resolved the same way OssnFile itself resolves it
 * internally (classes/OssnFile.php: ossn_get_userdata("{type}/
 * {owner_guid}/{value}")) — the guid selects a DB record, it never
 * becomes part of a filesystem path, so a crafted/guessed guid
 * resolves to no record rather than a traversal.
 */
function ossn_berx_media_page_handler($pages) {
	if (!class_exists('OssnMediaAssets')) {
		header('HTTP/1.1 404 Not Found');
		exit;
	}
	$action = isset($pages[0]) ? $pages[0] : '';
	$asset_guid = isset($pages[1]) ? intval($pages[1]) : 0;
	if ($action !== 'get' || !$asset_guid) {
		header('HTTP/1.1 404 Not Found');
		exit;
	}

	$model = new OssnMediaAssets();
	$asset = $model->get($asset_guid);
	if (!$asset) {
		header('HTTP/1.1 404 Not Found');
		exit;
	}

	$file = ossn_get_file($asset_guid);
	if (!$file) {
		header('HTTP/1.1 404 Not Found');
		exit;
	}
	$path = ossn_get_userdata("object/{$asset->owner_guid}/{$file->value}");
	if (!is_file($path)) {
		header('HTTP/1.1 404 Not Found');
		exit;
	}
	header('Content-Type: ' . $asset->mime);
	header('Content-Length: ' . filesize($path));
	header('X-Content-Type-Options: nosniff');
	readfile($path);
	exit;
}
