<?php
/**
 * BERX Group Chat — a real multi-participant conversation entity.
 *
 * Built on its own tables (upgrade/upgrades/1785172300.php), not on
 * OssnMessages: that class is OSSN core's 1:1 primitive and has no
 * group concept anywhere in it to extend (send($from,$to,...) —
 * confirmed by reading it before writing this, not assumed).
 *
 * PERMISSIONS ARE ENFORCED HERE, SERVER-SIDE, ALWAYS — every write
 * method takes the acting user's guid and re-derives their role from
 * the participants table on every call; nothing is ever trusted from
 * the request. Roles: 'admin' (can rename, add/remove members, pin,
 * delete other people's messages) and 'member' (can post, leave, edit/
 * delete their own messages). The creator is seeded as the first
 * admin at creation and is never auto-demoted — a group with zero
 * admins would have no one able to manage it.
 *
 * `context_type`/`context_guid` are what let a group be reached again
 * from the real entity it was created from (Community/Event/
 * Experience/Circle/Trip) — see forContext(). Nullable: a group
 * started directly from a Direct Message has no such context, and
 * that is a real, valid state, not a missing field.
 */
class OssnGroupChat extends OssnDatabase {

		const TABLE            = 'ossn_group_conversations';
		const PARTICIPANTS     = 'ossn_group_participants';
		const MESSAGES         = 'ossn_group_messages';
		const READS            = 'ossn_group_message_reads';
		const REACTIONS        = 'ossn_group_message_reactions';
		const PINNED           = 'ossn_group_pinned_messages';
		const TYPING           = 'ossn_group_typing';

		const ROLE_ADMIN  = 'admin';
		const ROLE_MEMBER = 'member';

		const STATUS_ACTIVE  = 'active';
		const STATUS_LEFT    = 'left';
		/** Invited post-creation, has not accepted yet — the real "message request" state for groups. Cannot see messages or be counted as a member until accepted. */
		const STATUS_PENDING = 'pending';
		const STATUS_DECLINED = 'declined';

		const MAX_NAME_LENGTH = 120;
		const MAX_PARTICIPANTS = 250;
		/** A conversation only becomes a real "group" once it has more than one other member. */
		const MIN_OTHER_PARTICIPANTS = 2;

		public static function isValidContextType($type) {
				if ($type === null || $type === '') {
						return true;
				}
				return in_array((string) $type, array('community', 'event', 'experience', 'circle', 'trip'), true);
		}

		/* ---------------- Create / read the conversation ---------------- */

		/**
		 * Real group creation. $participantGuids is the set of OTHER
		 * members (the creator is added automatically as admin) —
		 * de-duplicated, self excluded, and every guid must be a real
		 * user. Returns the new conversation id, or a typed failure
		 * string the API layer maps to the right HTTP status.
		 */
		public function create($creatorGuid, $name, $description, array $participantGuids, $contextType = null, $contextGuid = null) {
				$creatorGuid = intval($creatorGuid);
				$name        = trim((string) $name);
				if (!$creatorGuid || $name === '' || mb_strlen($name, 'UTF-8') > self::MAX_NAME_LENGTH) {
						return 'invalid_name';
				}
				if (!self::isValidContextType($contextType)) {
						return 'invalid_context';
				}
				$others = array();
				foreach ($participantGuids as $g) {
						$g = intval($g);
						if ($g && $g !== $creatorGuid && !in_array($g, $others, true)) {
								$others[] = $g;
						}
				}
				if (count($others) < self::MIN_OTHER_PARTICIPANTS) {
						// A "group" of the creator alone (or with just one other
						// person) is a real, honest rejection, not a degraded 1:1 —
						// BERX already has a real 1:1 messenger for that case
						// (ConversationScreen/conversations.php); this class exists
						// specifically for genuine multi-participant conversations.
						return 'too_few_participants';
				}
				if (count($others) + 1 > self::MAX_PARTICIPANTS) {
						return 'too_many_participants';
				}
				foreach ($others as $g) {
						if (!OssnUser::getUser($g)) {
								return 'invalid_participant';
						}
				}
				$now = time();
				$ok = $this->insert(array(
						'into'   => self::TABLE,
						'names'  => array('name', 'description', 'creator_guid', 'context_type', 'context_guid', 'time_created'),
						'values' => array($name, (string) $description !== '' ? (string) $description : null, $creatorGuid, $contextType ?: null, $contextGuid ? intval($contextGuid) : null, $now),
				));
				if (!$ok) {
						return 'failed';
				}
				$conversationId = intval($this->getLastEntry());
				$this->insert(array(
						'into'   => self::PARTICIPANTS,
						'names'  => array('conversation_id', 'user_guid', 'role', 'status', 'time_joined'),
						'values' => array($conversationId, $creatorGuid, self::ROLE_ADMIN, self::STATUS_ACTIVE, $now),
				));
				foreach ($others as $g) {
						$this->insert(array(
								'into'   => self::PARTICIPANTS,
								'names'  => array('conversation_id', 'user_guid', 'role', 'status', 'time_joined'),
								'values' => array($conversationId, $g, self::ROLE_MEMBER, self::STATUS_ACTIVE, $now),
						));
				}
				return $conversationId;
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

		/** Every active group a real user is currently a member of. */
		public function listForUser($userGuid, $limit = 100) {
				$userGuid = intval($userGuid);
				if (!$userGuid) {
						return array();
				}
				$rows = $this->select(array(
						'from'     => self::TABLE . ' c',
						'params'   => array('c.*'),
						'joins'    => array('INNER JOIN ' . self::PARTICIPANTS . ' p ON p.conversation_id = c.id'),
						'wheres'   => array(
								self::wheres('p.user_guid', '=', $userGuid),
								self::wheres('p.status', '=', self::STATUS_ACTIVE, 'AND'),
						),
						'order_by' => 'c.time_updated DESC, c.time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? (array) $rows : array();
		}

		/**
		 * Real "context everywhere" lookup — the groups already tied to
		 * one real entity (a Community, an Event...), so
		 * "Событие → Групповой чат" can find an existing group instead
		 * of silently creating duplicates every time it's opened.
		 */
		public function forContext($contextType, $contextGuid, $userGuid) {
				if (!self::isValidContextType($contextType) || !$contextType || !$contextGuid) {
						return array();
				}
				$rows = $this->select(array(
						'from'     => self::TABLE . ' c',
						'params'   => array('c.*'),
						'joins'    => array('INNER JOIN ' . self::PARTICIPANTS . ' p ON p.conversation_id = c.id'),
						'wheres'   => array(
								self::wheres('c.context_type', '=', (string) $contextType),
								self::wheres('c.context_guid', '=', intval($contextGuid), 'AND'),
								self::wheres('p.user_guid', '=', intval($userGuid), 'AND'),
								self::wheres('p.status', '=', self::STATUS_ACTIVE, 'AND'),
						),
						'order_by' => 'c.time_created DESC',
				), true);
				return $rows ? (array) $rows : array();
		}

		/* ---------------- Roles / membership ---------------- */

		public function myParticipant($conversationId, $userGuid) {
				$row = $this->select(array(
						'from'   => self::PARTICIPANTS,
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('user_guid', '=', intval($userGuid), 'AND'),
						),
				));
				return $row ? $row : false;
		}

		public function isActiveMember($conversationId, $userGuid) {
				$p = $this->myParticipant($conversationId, $userGuid);
				return (bool) ($p && $p->status === self::STATUS_ACTIVE);
		}

		public function isAdmin($conversationId, $userGuid) {
				$p = $this->myParticipant($conversationId, $userGuid);
				return (bool) ($p && $p->status === self::STATUS_ACTIVE && $p->role === self::ROLE_ADMIN);
		}

		public function participants($conversationId) {
				$rows = $this->select(array(
						'from'     => self::PARTICIPANTS,
						'wheres'   => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('status', '=', self::STATUS_ACTIVE, 'AND'),
						),
						'order_by' => 'time_joined ASC',
				), true);
				return $rows ? (array) $rows : array();
		}

		public function activeParticipantCount($conversationId) {
				return count($this->participants($conversationId));
		}

		public function rename($conversationId, $actingGuid, $name, $description = null) {
				if (!$this->isAdmin($conversationId, $actingGuid)) {
						return 'forbidden';
				}
				$name = trim((string) $name);
				if ($name === '' || mb_strlen($name, 'UTF-8') > self::MAX_NAME_LENGTH) {
						return 'invalid_name';
				}
				$this->update(array(
						'table'  => self::TABLE,
						'names'  => array('name', 'description', 'time_updated'),
						'values' => array($name, $description !== null ? (string) $description : null, time()),
						'wheres' => array(self::wheres('id', '=', intval($conversationId))),
				));
				return true;
		}

		public function setCover($conversationId, $actingGuid, $coverGuid) {
				if (!$this->isAdmin($conversationId, $actingGuid)) {
						return 'forbidden';
				}
				$this->update(array(
						'table'  => self::TABLE,
						'names'  => array('cover_guid', 'time_updated'),
						'values' => array($coverGuid ? intval($coverGuid) : null, time()),
						'wheres' => array(self::wheres('id', '=', intval($conversationId))),
				));
				return true;
		}

		/**
		 * Admin-only invite. Unlike the founding members set at create()
		 * (who join directly — the same "start talking to people you
		 * already chose" trust level a 1:1 DM has), someone added to an
		 * EXISTING group lands PENDING — a real message request that only
		 * becomes membership once they call acceptInvite(). They cannot
		 * read messages or count toward the roster until then.
		 */
		public function addParticipant($conversationId, $actingGuid, $userGuid) {
				if (!$this->isAdmin($conversationId, $actingGuid)) {
						return 'forbidden';
				}
				$userGuid = intval($userGuid);
				if (!$userGuid || !OssnUser::getUser($userGuid)) {
						return 'invalid_participant';
				}
				$existing = $this->myParticipant($conversationId, $userGuid);
				if ($existing && ($existing->status === self::STATUS_ACTIVE || $existing->status === self::STATUS_PENDING)) {
						return 'already_member';
				}
				if ($this->activeParticipantCount($conversationId) >= self::MAX_PARTICIPANTS) {
						return 'group_full';
				}
				if ($existing) {
						// Re-inviting after having left/declined: reactivate the same
						// row rather than inserting a second one (unique_participant
						// would reject the insert anyway).
						$this->update(array(
								'table'  => self::PARTICIPANTS,
								'names'  => array('status', 'role', 'time_joined', 'time_left'),
								'values' => array(self::STATUS_PENDING, self::ROLE_MEMBER, time(), null),
								'wheres' => array(self::wheres('id', '=', intval($existing->id))),
						));
				} else {
						$this->insert(array(
								'into'   => self::PARTICIPANTS,
								'names'  => array('conversation_id', 'user_guid', 'role', 'status', 'time_joined'),
								'values' => array(intval($conversationId), $userGuid, self::ROLE_MEMBER, self::STATUS_PENDING, time()),
						));
				}
				return true;
		}

		/** The real accept side of the message request — turns a pending invite into real membership. */
		public function acceptInvite($conversationId, $userGuid) {
				$p = $this->myParticipant($conversationId, $userGuid);
				if (!$p || $p->status !== self::STATUS_PENDING) {
						return 'no_pending_invite';
				}
				$this->update(array(
						'table'  => self::PARTICIPANTS,
						'names'  => array('status', 'time_joined'),
						'values' => array(self::STATUS_ACTIVE, time()),
						'wheres' => array(self::wheres('id', '=', intval($p->id))),
				));
				return true;
		}

		public function declineInvite($conversationId, $userGuid) {
				$p = $this->myParticipant($conversationId, $userGuid);
				if (!$p || $p->status !== self::STATUS_PENDING) {
						return 'no_pending_invite';
				}
				$this->update(array(
						'table'  => self::PARTICIPANTS,
						'names'  => array('status'),
						'values' => array(self::STATUS_DECLINED),
						'wheres' => array(self::wheres('id', '=', intval($p->id))),
				));
				return true;
		}

		/** Real pending invites for one user, across every group — the "message requests" list. */
		public function pendingInvitesForUser($userGuid) {
				$rows = $this->select(array(
						'from'     => self::TABLE . ' c',
						'params'   => array('c.*', 'p.time_joined as invited_at'),
						'joins'    => array('INNER JOIN ' . self::PARTICIPANTS . ' p ON p.conversation_id = c.id'),
						'wheres'   => array(
								self::wheres('p.user_guid', '=', intval($userGuid)),
								self::wheres('p.status', '=', self::STATUS_PENDING, 'AND'),
						),
						'order_by' => 'p.time_joined DESC',
				), true);
				return $rows ? (array) $rows : array();
		}

		/** Removes an active member, or revokes a still-pending invite — either way, admin-only. */
		public function removeParticipant($conversationId, $actingGuid, $userGuid) {
				if (!$this->isAdmin($conversationId, $actingGuid)) {
						return 'forbidden';
				}
				$userGuid = intval($userGuid);
				if ($userGuid === intval($actingGuid)) {
						// Removing yourself is "leave", a distinct real action with
						// its own real consequence (last-admin handling) — not a
						// silent alias here.
						return 'use_leave';
				}
				$target = $this->myParticipant($conversationId, $userGuid);
				if (!$target || ($target->status !== self::STATUS_ACTIVE && $target->status !== self::STATUS_PENDING)) {
						return 'not_a_member';
				}
				$this->update(array(
						'table'  => self::PARTICIPANTS,
						'names'  => array('status', 'time_left'),
						'values' => array(self::STATUS_LEFT, time()),
						'wheres' => array(self::wheres('id', '=', intval($target->id))),
				));
				return true;
		}

		/**
		 * Real leave. If the leaving member was the last active admin AND
		 * other members remain, the longest-standing remaining member is
		 * promoted — a group is never left with active members but zero
		 * admins able to manage it (that state would make every admin-
		 * only action, including a later leave, permanently unreachable).
		 */
		public function leave($conversationId, $userGuid) {
				$participant = $this->myParticipant($conversationId, $userGuid);
				if (!$participant || $participant->status !== self::STATUS_ACTIVE) {
						return 'not_a_member';
				}
				$this->update(array(
						'table'  => self::PARTICIPANTS,
						'names'  => array('status', 'time_left'),
						'values' => array(self::STATUS_LEFT, time()),
						'wheres' => array(self::wheres('id', '=', intval($participant->id))),
				));
				if ($participant->role === self::ROLE_ADMIN) {
						$remaining = $this->participants($conversationId);
						$stillHasAdmin = false;
						foreach ($remaining as $r) {
								if ($r->role === self::ROLE_ADMIN) {
										$stillHasAdmin = true;
										break;
								}
						}
						if (!$stillHasAdmin && !empty($remaining)) {
								$promote = $remaining[0];
								$this->update(array(
										'table'  => self::PARTICIPANTS,
										'names'  => array('role'),
										'values' => array(self::ROLE_ADMIN),
										'wheres' => array(self::wheres('id', '=', intval($promote->id))),
								));
						}
				}
				return true;
		}

		public function setMuted($conversationId, $userGuid, $mutedUntil) {
				$participant = $this->myParticipant($conversationId, $userGuid);
				if (!$participant || $participant->status !== self::STATUS_ACTIVE) {
						return 'not_a_member';
				}
				$this->update(array(
						'table'  => self::PARTICIPANTS,
						'names'  => array('muted_until'),
						'values' => array($mutedUntil ? intval($mutedUntil) : null),
						'wheres' => array(self::wheres('id', '=', intval($participant->id))),
				));
				return true;
		}

		/* ---------------- Messages ---------------- */

		public function sendMessage($conversationId, $senderGuid, $text, $replyToId = null) {
				if (!$this->isActiveMember($conversationId, $senderGuid)) {
						return 'forbidden';
				}
				$text = trim((string) $text);
				if ($text === '') {
						return 'empty_text';
				}
				if ($replyToId) {
						$original = $this->getMessage($replyToId);
						if (!$original || intval($original->conversation_id) !== intval($conversationId) || intval($original->deleted) === 1) {
								return 'invalid_reply';
						}
				}
				$now = time();
				$this->insert(array(
						'into'   => self::MESSAGES,
						'names'  => array('conversation_id', 'sender_guid', 'text', 'reply_to_id', 'time_created'),
						'values' => array(intval($conversationId), intval($senderGuid), $text, $replyToId ? intval($replyToId) : null, $now),
				));
				$this->update(array(
						'table'  => self::TABLE,
						'names'  => array('time_updated'),
						'values' => array($now),
						'wheres' => array(self::wheres('id', '=', intval($conversationId))),
				));
				return intval($this->getLastEntry());
		}

		public function getMessage($id) {
				$id = intval($id);
				if (!$id) {
						return false;
				}
				$row = $this->select(array(
						'from'   => self::MESSAGES,
						'wheres' => array(self::wheres('id', '=', $id)),
				));
				return $row ? $row : false;
		}

		public function messages($conversationId, $limit = 50, $beforeId = null) {
				$wheres = array(self::wheres('conversation_id', '=', intval($conversationId)));
				if ($beforeId) {
						$wheres[] = self::wheres('id', '<', intval($beforeId), 'AND');
				}
				$rows = $this->select(array(
						'from'     => self::MESSAGES,
						'wheres'   => $wheres,
						'order_by' => 'id DESC',
						'limit'    => intval($limit),
				), true);
				$rows = $rows ? array_reverse((array) $rows) : array();
				return $rows;
		}

		public function editMessage($messageId, $actingGuid, $newText) {
				$message = $this->getMessage($messageId);
				if (!$message || intval($message->deleted) === 1) {
						return 'not_found';
				}
				if (intval($message->sender_guid) !== intval($actingGuid)) {
						return 'forbidden';
				}
				$newText = trim((string) $newText);
				if ($newText === '') {
						return 'empty_text';
				}
				$this->update(array(
						'table'  => self::MESSAGES,
						'names'  => array('text', 'time_edited'),
						'values' => array($newText, time()),
						'wheres' => array(self::wheres('id', '=', intval($messageId))),
				));
				return true;
		}

		/** Sender OR a group admin may delete — same real moderation split as everywhere else in BERX (deletion is the moderation tool, editing never is). */
		public function deleteMessage($messageId, $actingGuid) {
				$message = $this->getMessage($messageId);
				if (!$message || intval($message->deleted) === 1) {
						return 'not_found';
				}
				$isSender = intval($message->sender_guid) === intval($actingGuid);
				if (!$isSender && !$this->isAdmin($message->conversation_id, $actingGuid)) {
						return 'forbidden';
				}
				$this->update(array(
						'table'  => self::MESSAGES,
						'names'  => array('deleted', 'text'),
						'values' => array(1, null),
						'wheres' => array(self::wheres('id', '=', intval($messageId))),
				));
				parent::delete(array('from' => self::REACTIONS, 'wheres' => array(self::wheres('message_id', '=', intval($messageId)))));
				parent::delete(array('from' => self::PINNED, 'wheres' => array(self::wheres('message_id', '=', intval($messageId)))));
				return true;
		}

		/* ---------------- Reactions ---------------- */

		/** Real toggle — same binary convention as every other BERX reaction (posts, comments). Returns the new state. */
		public function toggleReaction($messageId, $userGuid) {
				$message = $this->getMessage($messageId);
				if (!$message || intval($message->deleted) === 1 || !$this->isActiveMember($message->conversation_id, $userGuid)) {
						return 'forbidden';
				}
				$existing = $this->select(array(
						'from'   => self::REACTIONS,
						'wheres' => array(
								self::wheres('message_id', '=', intval($messageId)),
								self::wheres('user_guid', '=', intval($userGuid), 'AND'),
						),
				));
				if ($existing) {
						parent::delete(array(
								'from'   => self::REACTIONS,
								'wheres' => array(
										self::wheres('message_id', '=', intval($messageId)),
										self::wheres('user_guid', '=', intval($userGuid), 'AND'),
								),
						));
						return false;
				}
				$this->insert(array(
						'into'   => self::REACTIONS,
						'names'  => array('message_id', 'user_guid', 'time_created'),
						'values' => array(intval($messageId), intval($userGuid), time()),
				));
				return true;
		}

		public function reactionCount($messageId) {
				$row = $this->select(array(
						'from'   => self::REACTIONS,
						'params' => array('COUNT(*) as cnt'),
						'wheres' => array(self::wheres('message_id', '=', intval($messageId))),
				));
				return $row ? intval($row->cnt) : 0;
		}

		public function reactedByMe($messageId, $userGuid) {
				$row = $this->select(array(
						'from'   => self::REACTIONS,
						'wheres' => array(
								self::wheres('message_id', '=', intval($messageId)),
								self::wheres('user_guid', '=', intval($userGuid), 'AND'),
						),
				));
				return (bool) $row;
		}

		/* ---------------- Pinned messages ---------------- */

		public function pin($conversationId, $actingGuid, $messageId) {
				if (!$this->isAdmin($conversationId, $actingGuid)) {
						return 'forbidden';
				}
				$message = $this->getMessage($messageId);
				if (!$message || intval($message->conversation_id) !== intval($conversationId) || intval($message->deleted) === 1) {
						return 'not_found';
				}
				$this->insert(array(
						'into'   => self::PINNED,
						'names'  => array('conversation_id', 'message_id', 'pinned_by', 'time_created'),
						'values' => array(intval($conversationId), intval($messageId), intval($actingGuid), time()),
				));
				return true;
		}

		public function unpin($conversationId, $actingGuid, $messageId) {
				if (!$this->isAdmin($conversationId, $actingGuid)) {
						return 'forbidden';
				}
				parent::delete(array(
						'from'   => self::PINNED,
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('message_id', '=', intval($messageId), 'AND'),
						),
				));
				return true;
		}

		public function pinnedMessages($conversationId) {
				$rows = $this->select(array(
						'from'     => self::PINNED,
						'wheres'   => array(self::wheres('conversation_id', '=', intval($conversationId))),
						'order_by' => 'time_created DESC',
				), true);
				return $rows ? (array) $rows : array();
		}

		/* ---------------- Unread / read receipts ---------------- */

		public function markRead($conversationId, $userGuid, $upToMessageId) {
				if (!$this->isActiveMember($conversationId, $userGuid)) {
						return 'forbidden';
				}
				$now = time();
				$existing = $this->select(array(
						'from'   => self::READS,
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('user_guid', '=', intval($userGuid), 'AND'),
						),
				));
				if ($existing) {
						if (intval($upToMessageId) > intval($existing->last_read_message_id)) {
								$this->update(array(
										'table'  => self::READS,
										'names'  => array('last_read_message_id', 'time_updated'),
										'values' => array(intval($upToMessageId), $now),
										'wheres' => array(
												self::wheres('conversation_id', '=', intval($conversationId)),
												self::wheres('user_guid', '=', intval($userGuid), 'AND'),
										),
								));
						}
				} else {
						$this->insert(array(
								'into'   => self::READS,
								'names'  => array('conversation_id', 'user_guid', 'last_read_message_id', 'time_updated'),
								'values' => array(intval($conversationId), intval($userGuid), intval($upToMessageId), $now),
						));
				}
				return true;
		}

		public function lastReadMessageId($conversationId, $userGuid) {
				$row = $this->select(array(
						'from'   => self::READS,
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('user_guid', '=', intval($userGuid), 'AND'),
						),
				));
				return $row ? intval($row->last_read_message_id) : 0;
		}

		public function unreadCount($conversationId, $userGuid) {
				$lastRead = $this->lastReadMessageId($conversationId, $userGuid);
				$row = $this->select(array(
						'from'   => self::MESSAGES,
						'params' => array('COUNT(*) as cnt'),
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('id', '>', $lastRead, 'AND'),
								self::wheres('deleted', '=', 0, 'AND'),
								self::wheres('sender_guid', '!=', intval($userGuid), 'AND'),
						),
				));
				return $row ? intval($row->cnt) : 0;
		}

		/* ---------------- Typing ---------------- */

		/** Same real polling model as 1:1 typing (no WebSocket infra — see conversations.php's own header). */
		public function setTyping($conversationId, $userGuid) {
				if (!$this->isActiveMember($conversationId, $userGuid)) {
						return false;
				}
				$existing = $this->select(array(
						'from'   => self::TYPING,
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('user_guid', '=', intval($userGuid), 'AND'),
						),
				));
				if ($existing) {
						$this->update(array(
								'table'  => self::TYPING,
								'names'  => array('time_updated'),
								'values' => array(time()),
								'wheres' => array(
										self::wheres('conversation_id', '=', intval($conversationId)),
										self::wheres('user_guid', '=', intval($userGuid), 'AND'),
								),
						));
				} else {
						$this->insert(array(
								'into'   => self::TYPING,
								'names'  => array('conversation_id', 'user_guid', 'time_updated'),
								'values' => array(intval($conversationId), intval($userGuid), time()),
						));
				}
				return true;
		}

		/** Who is typing right now, excluding the caller and anything stale (>6s — same real window the 1:1 typing indicator uses). */
		public function typingUsers($conversationId, $excludeGuid) {
				$rows = $this->select(array(
						'from'   => self::TYPING,
						'wheres' => array(
								self::wheres('conversation_id', '=', intval($conversationId)),
								self::wheres('user_guid', '!=', intval($excludeGuid), 'AND'),
								self::wheres('time_updated', '>', time() - 6, 'AND'),
						),
				), true);
				return $rows ? (array) $rows : array();
		}
}
