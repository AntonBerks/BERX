<?php
/**
 * BERX Media Assets — generic metadata + attach/detach layer on top
 * of the real OssnFile storage/upload system. Never duplicates
 * OssnFile's own resize/MIME/CDN logic — this class only tracks what
 * OssnFile doesn't: media_type, dimensions, duration, processing
 * status, and attachment to a piece of BERX content.
 *
 * No method here is named update()/delete() — the exact self-
 * recursion bug caught repeatedly this session (Collections/Circles/
 * Trips) only happens when a subclass method SHARES a name with an
 * OssnDatabase method it doesn't mean to override. Naming these
 * removeAsset()/updateAsset() instead sidesteps the whole class of
 * bug rather than requiring a parent:: reminder on every call site.
 */
class OssnMediaAssets extends OssnDatabase {

		const TABLE = 'ossn_media_assets';

		const TYPE_IMAGE = 'image';
		const TYPE_VIDEO = 'video';
		const TYPE_AUDIO = 'audio';

		const STATUS_STORED = 'stored';

		public static function isValidMediaType($type) {
				return in_array((string) $type, array(self::TYPE_IMAGE, self::TYPE_VIDEO, self::TYPE_AUDIO), true);
		}

		/**
		 * $fileGuid MUST be a real, already-uploaded OssnFile guid (the
		 * caller uploads via OssnFile::addFile() first, then records
		 * metadata here — this method never uploads anything itself).
		 */
		public function create($fileGuid, $ownerGuid, $mediaType, $mime, $width = null, $height = null) {
				$fileGuid  = intval($fileGuid);
				$ownerGuid = intval($ownerGuid);
				if (!$fileGuid || !$ownerGuid || !self::isValidMediaType($mediaType)) {
						return false;
				}
				$ok = $this->insert(array(
						'into'   => self::TABLE,
						'names'  => array('id', 'owner_guid', 'media_type', 'mime', 'width', 'height', 'status', 'time_created'),
						'values' => array($fileGuid, $ownerGuid, (string) $mediaType, (string) $mime, $width ? intval($width) : null, $height ? intval($height) : null, self::STATUS_STORED, time()),
				));
				return $ok ? $fileGuid : false;
		}

		public function get($assetGuid) {
				$assetGuid = intval($assetGuid);
				if (!$assetGuid) {
						return false;
				}
				$row = $this->select(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('id', '=', $assetGuid)),
				));
				return $row ? $row : false;
		}

		/** Honest, simple scope: owner or admin only. No independent asset-level privacy model exists yet — attaching to content with its own visibility rules is a separate future step, not invented here. */
		public function canAccess($asset, $viewerGuid) {
				if (!$asset) {
						return false;
				}
				if (ossn_isAdminLoggedin()) {
						return true;
				}
				return intval($asset->owner_guid) === intval($viewerGuid);
		}

		public function attach($assetGuid, $actingGuid, $contextType, $contextGuid) {
				$asset = $this->get($assetGuid);
				if (!$this->canAccess($asset, $actingGuid)) {
						return false;
				}
				return parent::update(array(
						'table'  => self::TABLE,
						'names'  => array('context_type', 'context_guid'),
						'values' => array((string) $contextType, intval($contextGuid)),
						'wheres' => array(self::wheres('id', '=', intval($assetGuid))),
				));
		}

		public function detach($assetGuid, $actingGuid) {
				$asset = $this->get($assetGuid);
				if (!$this->canAccess($asset, $actingGuid)) {
						return false;
				}
				return parent::update(array(
						'table'  => self::TABLE,
						'names'  => array('context_type', 'context_guid'),
						'values' => array(null, null),
						'wheres' => array(self::wheres('id', '=', intval($assetGuid))),
				));
		}

		/**
		 * Deletes BOTH the metadata row AND the real underlying file
		 * (via the real OssnFile::deleteFile(), never re-implemented).
		 */
		public function removeAsset($assetGuid, $actingGuid) {
				$asset = $this->get($assetGuid);
				if (!$this->canAccess($asset, $actingGuid)) {
						return false;
				}
				$file = ossn_get_file($assetGuid);
				if ($file) {
						$file->deleteFile();
				}
				return parent::delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('id', '=', intval($assetGuid))),
				));
		}

		public function listByOwner($ownerGuid, $limit = 50) {
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'wheres'   => array(self::wheres('owner_guid', '=', intval($ownerGuid))),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		public function listByContext($contextType, $contextGuid, $limit = 50) {
				$rows = $this->select(array(
						'from'   => self::TABLE,
						'wheres' => array(
								self::wheres('context_type', '=', (string) $contextType),
								self::wheres('context_guid', '=', intval($contextGuid)),
						),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		/**
		 * Real reverse query the generic attach/detach design didn't
		 * need until now: "which context_guids have a video attached",
		 * newest first — the actual query a video feed is built on.
		 * Still zero new storage; same real ossn_media_assets table.
		 */
		public function listByMediaType($mediaType, $contextType, $limit = 20, $offset = 0) {
				$rows = $this->select(array(
						'from'   => self::TABLE,
						'wheres' => array(
								self::wheres('media_type', '=', (string) $mediaType),
								self::wheres('context_type', '=', (string) $contextType),
						),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
						'offset'   => intval($offset),
				), true);
				return $rows ? $rows : array();
		}

		/** Owner-scoped variant — powers "my videos"/"creator videos"/"profile videos" without a separate query per screen. */
		public function listByOwnerAndMediaType($ownerGuid, $mediaType, $contextType, $limit = 50) {
				$rows = $this->select(array(
						'from'   => self::TABLE,
						'wheres' => array(
								self::wheres('owner_guid', '=', intval($ownerGuid)),
								self::wheres('media_type', '=', (string) $mediaType),
								self::wheres('context_type', '=', (string) $contextType),
						),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}
}
