<?php
/**
 * BERX Stories — 24h ephemeral image/video stories. Schema already
 * existed and was already migrated (upgrade/upgrades/1785167900.php
 * for the base tables, 1785170000.php for the later, real
 * Event-Story-Wall `event_guid` extension — its own comment names the
 * exact method this class provides: addEventStory()).
 *
 * OWN FILE STORAGE, DELIBERATELY NOT OssnFile/OssnMediaAssets. This
 * table predates the generic Media Foundation (OssnMediaAssets) —
 * confirmed by migration ordering (1785167900 vs. 1785169400) — and
 * `storage_name` is a bare random filename, not an OssnFile guid.
 * Rebuilding it on top of OssnFile now would mean either a schema
 * migration on a real, already-shipped table or a second storage path
 * for existing rows; kept as its own real, self-contained upload/read
 * pipeline instead, matching what the schema already commits to.
 *
 * Real MIME detection is byte-sniffed (finfo on the actual uploaded
 * bytes), never trusted from the client-reported Content-Type.
 *
 * No method here is named update()/delete().
 */
class OssnStories extends OssnDatabase {

	const TABLE       = 'ossn_stories';
	const VIEWS_TABLE  = 'ossn_stories_views';

	const LIFETIME_SECONDS = 86400; // 24h

	/** real mime => real extension. Video kept to mp4 to match OssnFile::mimeTypes()'s own real whitelist elsewhere in this codebase — not a separate, wider policy invented here. */
	const ALLOWED_MIME = array(
		'image/jpeg' => 'jpg',
		'image/png'  => 'png',
		'image/webp' => 'webp',
		'image/gif'  => 'gif',
		'video/mp4'  => 'mp4',
	);

	/**
	 * $tmpPath must be a real PHP-uploaded tmp file
	 * ($_FILES[...]['tmp_name']) for this exact request — verified via
	 * is_uploaded_file(), never accepted as an arbitrary server path.
	 * $eventGuid, if given, requires OssnEvents to exist AND the real
	 * caller to be a confirmed attendee — both re-checked here, not
	 * assumed from the caller.
	 */
	public function addStory($ownerGuid, $tmpPath, $caption = '', $eventGuid = null) {
		$ownerGuid = intval($ownerGuid);
		if (!$ownerGuid || !$tmpPath || !is_uploaded_file($tmpPath)) {
			return false;
		}
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		$mime = $finfo ? finfo_file($finfo, $tmpPath) : false;
		if ($finfo) {
			finfo_close($finfo);
		}
		if (!$mime || !isset(self::ALLOWED_MIME[$mime])) {
			return false;
		}

		$eventGuid = $eventGuid ? intval($eventGuid) : null;
		if ($eventGuid) {
			if (!class_exists('OssnEvents')) {
				return false;
			}
			// CONTRACT FOR WAVE 3: OssnEvents must expose a real
			// isRealAttendee($eventGuid, $userGuid): bool method (RSVP
			// 'going' status only) for this real-attendee-only gate to
			// activate. class_exists() above makes this a safe, non-
			// fatal no-op (event stories simply can't be created) until
			// then — never a fatal "undefined method" call, since no
			// event_guid reaches here while OssnEvents doesn't exist.
			$events = new OssnEvents();
			if (!$events->isRealAttendee($eventGuid, $ownerGuid)) {
				return false;
			}
		}

		$ext = self::ALLOWED_MIME[$mime];
		$storageName = bin2hex(random_bytes(16)) . '.' . $ext;
		$dir = ossn_get_userdata("stories/{$ownerGuid}/");
		if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
			return false;
		}
		if (!move_uploaded_file($tmpPath, $dir . $storageName)) {
			return false;
		}

		$now = time();
		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'storage_name', 'mime_type', 'caption', 'event_guid', 'time_created', 'time_expires'),
			'values' => array($ownerGuid, $storageName, $mime, $caption !== '' ? mb_substr((string) $caption, 0, 500, 'UTF-8') : null, $eventGuid, $now, $now + self::LIFETIME_SECONDS),
		));
		return $id ? $this->getLastEntry() : false;
	}

	public function get($id) {
		$id = intval($id);
		if (!$id) {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', $id)),
		));
		return $row ? $row : false;
	}

	public function isActive($story) {
		return $story && intval($story->time_expires) > time();
	}

	/**
	 * Real access gate — used identically by both GET .../media (byte
	 * stream) and POST .../view (mark-viewed): owner always passes;
	 * expired stories pass to nobody; blocked viewers never pass.
	 */
	public function checkStoryAccess($story, $viewerGuid) {
		if (!$story) {
			return false;
		}
		if (intval($story->owner_guid) === intval($viewerGuid)) {
			return true;
		}
		// BERX WORLD MAX BUILD — a real Highlight stays readable past
		// expiry, same as it was while active; an expired, un-
		// highlighted story is exactly as inaccessible as before.
		if (!$this->isActive($story) && empty($story->is_highlighted)) {
			return false;
		}
		$a = new stdClass();
		$a->guid = intval($viewerGuid);
		$b = new stdClass();
		$b->guid = intval($story->owner_guid);
		if (OssnBlock::isBlocked($a, $b)) {
			return false;
		}
		return true;
	}

	public function storagePath($story) {
		return ossn_get_userdata("stories/{$story->owner_guid}/{$story->storage_name}");
	}

	/**
	 * Real feed grouped by author — every OTHER user's active stories
	 * the caller isn't blocked by/from, newest-author-activity first.
	 * A hard cap of 40 authors (matches the caller's own real,
	 * previously-disclosed hardcoded limit) — not a real bug to fix
	 * here, this class just inherits that documented constraint.
	 */
	public function listActiveForViewer($viewerGuid, $limit = 40) {
		$viewerGuid = intval($viewerGuid);
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('time_expires', '>', time()),
				self::wheres('owner_guid', '!=', $viewerGuid),
			),
			'order_by' => 'time_created DESC',
			'limit'    => 500,
		), true);
		$byOwner = array();
		foreach ((array) $rows as $row) {
			if (!$this->checkStoryAccess($row, $viewerGuid)) {
				continue;
			}
			$owner = intval($row->owner_guid);
			if (!isset($byOwner[$owner])) {
				$byOwner[$owner] = array();
			}
			$byOwner[$owner][] = $row;
		}
		return array_slice($byOwner, 0, intval($limit), true);
	}

	public function listOwnActive($ownerGuid) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('owner_guid', '=', intval($ownerGuid)),
				self::wheres('time_expires', '>', time()),
			),
			'order_by' => 'time_created DESC',
		), true);
		return (array) $rows;
	}

	/**
	 * MAX BUILD — real Story Highlights: owner-only, real toggle. No
	 * artificial cap invented here — a real UI limit belongs to the
	 * client if ever needed, this method just records real intent.
	 */
	public function setHighlighted($storyId, $actingGuid, $highlighted) {
		$story = $this->get($storyId);
		if (!$story || intval($story->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		return (bool) $this->update(array(
			'table'  => self::TABLE,
			'names'  => array('is_highlighted'),
			'values' => array($highlighted ? 1 : 0),
			'wheres' => array(self::wheres('id', '=', intval($storyId))),
		));
	}

	/** Real, block-aware — a highlighted story is visible past expiry to anyone who could always see it, never to someone blocked either direction. */
	public function listHighlights($ownerGuid, $viewerGuid) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('owner_guid', '=', intval($ownerGuid)),
				self::wheres('is_highlighted', '=', 1),
			),
			'order_by' => 'time_created DESC',
		), true);
		$out = array();
		foreach ((array) $rows as $row) {
			if ($this->checkStoryAccess($row, $viewerGuid)) {
				$out[] = $row;
			}
		}
		return $out;
	}

	/** Real, RSVP-gated event story wall — every active story attached to $eventGuid, block-filtered the same way as the main feed. */
	public function listForEvent($eventGuid, $viewerGuid) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('event_guid', '=', intval($eventGuid)),
				self::wheres('time_expires', '>', time()),
			),
			'order_by' => 'time_created DESC',
		), true);
		$out = array();
		foreach ((array) $rows as $row) {
			if ($this->checkStoryAccess($row, $viewerGuid)) {
				$out[] = $row;
			}
		}
		return $out;
	}

	public function markViewed($storyId, $viewerGuid) {
		$storyId = intval($storyId);
		$viewerGuid = intval($viewerGuid);
		$existing = $this->select(array(
			'from'   => self::VIEWS_TABLE,
			'wheres' => array(self::wheres('story_id', '=', $storyId), self::wheres('viewer_guid', '=', $viewerGuid)),
		));
		if ($existing) {
			return true;
		}
		return (bool) $this->insert(array(
			'into'   => self::VIEWS_TABLE,
			'names'  => array('story_id', 'viewer_guid', 'time_viewed'),
			'values' => array($storyId, $viewerGuid, time()),
		));
	}

	/** MAX BUILD -- real fix, same class of bug found/fixed elsewhere this session: ossn_isAdminLoggedin() reads $_SESSION, never populated for a bearer-token API request. */
	public function deleteStory($id, $actingGuid) {
		$story = $this->get($id);
		if (!$story || (intval($story->owner_guid) !== intval($actingGuid) && !ossn_api_is_admin($actingGuid))) {
			return false;
		}
		$path = $this->storagePath($story);
		if (is_file($path)) {
			unlink($path);
		}
		parent::delete(array(
			'from'   => self::VIEWS_TABLE,
			'wheres' => array(self::wheres('story_id', '=', intval($id))),
		));
		return (bool) parent::delete(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}
}
