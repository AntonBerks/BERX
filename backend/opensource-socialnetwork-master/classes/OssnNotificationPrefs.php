<?php
/**
 * BERX WORLD MAX BUILD — Notification Preferences.
 *
 * A row in `ossn_notification_prefs` means "this type is MUTED for
 * this user" — absence of a row is the honest default (ON). Turning a
 * type back on deletes the row rather than storing a redundant
 * "enabled=1" flag, so there is exactly one real state per (guid,
 * type) pair, never two representations of the same "on" meaning.
 *
 * `OssnNotifications::add()` consults `isMuted()` before inserting a
 * real notification row — muting a category here actually stops the
 * notification from being created (see the same-batch edit to
 * components/OssnNotifications/classes/OssnNotifications.php), not
 * just from being displayed client-side.
 */
class OssnNotificationPrefs extends OssnDatabase {

	const TABLE = 'ossn_notification_prefs';

	/**
	 * The real, finite set of BERX-issued notification types a user
	 * can mute. Deliberately NOT every core OSSN notification string
	 * that exists anywhere in this fork — only the ones the mobile
	 * client's own NotificationsScreen actually surfaces with a label
	 * (see NOTIFICATION_VERB in NotificationsScreen.tsx). Muting a
	 * type not in this list is rejected, not silently accepted — an
	 * honest boundary, not a hidden gap.
	 *
	 * MAX BUILD — extended to the native OSSN notification types
	 * (like:post/comments:post/... — already firing on every real
	 * like/comment/tag/join-request, see notifications.php's own
	 * header) once NotificationsScreen gained real labels/routing for
	 * them, plus the new real berx:place:checkin checkpoint chain.
	 */
	public static function knownTypes() {
		return array(
			'dating:match',
			'dating:interest',
			'dating:photo:request',
			'dating:photo:granted',
			'berx:place:review',
			'berx:place:comment',
			'berx:place:checkin',
			'berx:offer:claimed',
			'berx:event:rsvp',
			'berx:event:comment',
			'berx:event:invite',
			'ossnpoke:poke',
			'like:post',
			'like:post:group:wall',
			'comments:post',
			'comments:post:group:wall',
			'wall:friends:tag',
			'group:joinrequest',
			'berx:plan:invite',
			'berx:plan:accepted',
			'berx:plan:converted',
		);
	}

	public function isMuted($guid, $type) {
		$guid = intval($guid);
		$type = (string) $type;
		if (!$guid || $type === '') {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('guid', '=', $guid),
				self::wheres('pref_type', '=', $type),
			),
		));
		return (bool) $row;
	}

	/** Returns array<type => bool enabled> for every known type — the real, complete state the settings screen renders. */
	public function getAll($guid) {
		$guid = intval($guid);
		$types = self::knownTypes();
		$out = array();
		foreach ($types as $t) {
			$out[$t] = true;
		}
		if (!$guid) {
			return $out;
		}
		$rows = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('guid', '=', $guid)),
		), true);
		if ($rows) {
			foreach ($rows as $row) {
				if (isset($out[$row->pref_type])) {
					$out[$row->pref_type] = false;
				}
			}
		}
		return $out;
	}

	public function setEnabled($guid, $type, $enabled) {
		$guid = intval($guid);
		$type = (string) $type;
		if (!$guid || !in_array($type, self::knownTypes(), true)) {
			return false;
		}
		if ($enabled) {
			return $this->delete(array(
				'from'   => self::TABLE,
				'wheres' => array(
					self::wheres('guid', '=', $guid),
					self::wheres('pref_type', '=', $type),
				),
			));
		}
		if ($this->isMuted($guid, $type)) {
			return true; // already muted — idempotent, not a duplicate row
		}
		return (bool) $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('guid', 'pref_type', 'time_created'),
			'values' => array($guid, $type, time()),
		));
	}
}
