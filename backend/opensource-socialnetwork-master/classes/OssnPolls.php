<?php
/**
 * BERX WORLD — Post Polls. See upgrade/upgrades/1785172000.php for the
 * full schema rationale (no stock OSSN polls plugin exists). Real
 * BERX-native, shallow OssnDatabase only — same shape as every other
 * BERX-invented domain class this session added.
 */
class OssnPolls extends OssnDatabase {

	const POLLS_TABLE = 'ossn_post_polls';
	const VOTES_TABLE  = 'ossn_post_poll_votes';
	const MIN_OPTIONS = 2;
	const MAX_OPTIONS = 6;
	const MAX_OPTION_LENGTH = 80;

	/** Real validated option list — trims, drops empties, caps length and count. Returns false (never a partial poll) if fewer than MIN_OPTIONS real options survive. */
	public static function sanitizeOptions($rawOptions) {
		if (!is_array($rawOptions)) {
			return false;
		}
		$options = array();
		foreach ($rawOptions as $raw) {
			$text = trim((string) $raw);
			if ($text === '') {
				continue;
			}
			$options[] = mb_substr($text, 0, self::MAX_OPTION_LENGTH, 'UTF-8');
			if (count($options) >= self::MAX_OPTIONS) {
				break;
			}
		}
		if (count($options) < self::MIN_OPTIONS) {
			return false;
		}
		return $options;
	}

	/** Real single row per post (post_guid is a real UNIQUE KEY — a second create() for the same post is a genuine no-op insert failure, never a silent overwrite). */
	public function create($postGuid, array $options, $endsAt = null) {
		return (bool) $this->insert(array(
			'into'   => self::POLLS_TABLE,
			'names'  => array('post_guid', 'options_json', 'ends_at', 'time_created'),
			'values' => array(intval($postGuid), json_encode(array_values($options)), $endsAt ? intval($endsAt) : null, time()),
		));
	}

	public function get($postGuid) {
		$rows = $this->select(array(
			'from'   => self::POLLS_TABLE,
			'wheres' => array(self::wheres('post_guid', '=', intval($postGuid))),
			'limit'  => 1,
		), true);
		if (!$rows) {
			return null;
		}
		$row = $rows[0];
		$options = json_decode((string) $row->options_json, true);
		return array(
			'options'   => is_array($options) ? $options : array(),
			'ends_at'   => $row->ends_at !== null ? intval($row->ends_at) : null,
			'is_ended'  => $row->ends_at !== null && intval($row->ends_at) < time(),
		);
	}

	/** Real revote — deletes any existing vote by this voter on this poll first, so the UNIQUE(post_guid,voter_guid) key never blocks a genuine change of mind. Re-verifies the poll exists, isn't ended, and the option index is real before writing anything. */
	public function vote($postGuid, $voterGuid, $optionIndex) {
		$poll = $this->get($postGuid);
		if (!$poll) {
			return 'not_found';
		}
		if ($poll['is_ended']) {
			return 'ended';
		}
		$optionIndex = intval($optionIndex);
		if ($optionIndex < 0 || $optionIndex >= count($poll['options'])) {
			return 'invalid_option';
		}
		parent::delete(array(
			'from'   => self::VOTES_TABLE,
			'wheres' => array(
				self::wheres('post_guid', '=', intval($postGuid)),
				self::wheres('voter_guid', '=', intval($voterGuid)),
			),
		));
		$ok = $this->insert(array(
			'into'   => self::VOTES_TABLE,
			'names'  => array('post_guid', 'voter_guid', 'option_index', 'time_created'),
			'values' => array(intval($postGuid), intval($voterGuid), $optionIndex, time()),
		));
		return $ok ? 'ok' : 'failed';
	}

	/** Real per-option counts (indexed 0..count(options)-1, zero-filled) plus the real total — one bounded query, no N+1 per option. */
	public function results($postGuid, $optionCount) {
		$counts = array_fill(0, max(0, intval($optionCount)), 0);
		$rows = $this->select(array(
			'from'     => self::VOTES_TABLE,
			'params'   => array('option_index', 'COUNT(*) as c'),
			'wheres'   => array(self::wheres('post_guid', '=', intval($postGuid))),
			'group_by' => 'option_index',
		), true);
		$total = 0;
		if ($rows) {
			foreach ($rows as $row) {
				$idx = intval($row->option_index);
				$c = intval($row->c);
				if (isset($counts[$idx])) {
					$counts[$idx] = $c;
				}
				$total += $c;
			}
		}
		return array('counts' => $counts, 'total' => $total);
	}

	public function myVote($postGuid, $voterGuid) {
		$rows = $this->select(array(
			'from'   => self::VOTES_TABLE,
			'wheres' => array(
				self::wheres('post_guid', '=', intval($postGuid)),
				self::wheres('voter_guid', '=', intval($voterGuid)),
			),
			'limit'  => 1,
		), true);
		return $rows ? intval($rows[0]->option_index) : null;
	}
}
