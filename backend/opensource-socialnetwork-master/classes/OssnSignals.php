<?php
/**
 * BERX Future Core — Event Layer.
 *
 * Append-only лог реальных доменных действий. Читается Feed ranking'ом
 * и Trust scoring'ом. Никогда не хранит вычисленные агрегаты — все
 * числа считаются живым COUNT() по реальным строкам, чтобы значение
 * не могло разойтись с правдой.
 *
 * Методы намеренно НЕ названы update()/delete() — см. историю бага с
 * самозацикливанием OssnDatabase в этой сессии (OssnCollections и др.).
 */
class OssnSignals extends OssnDatabase {

	const TABLE = 'ossn_signals';

	/**
	 * Реальные глаголы. Веса отражают, насколько действие говорит о
	 * настоящем интересе: посмотреть — почти ничего, прийти на событие
	 * или оставить отзыв — много. Числа прозрачные и правятся здесь,
	 * а не размазаны по коду.
	 */
	const VERBS = array(
		'view'     => 1,
		'open'     => 2,
		'like'     => 3,
		'comment'  => 5,
		'save'     => 5,
		'share'    => 6,
		'route'    => 7,
		'join'     => 7,
		'rsvp'     => 8,
		'review'   => 10,
		'checkin'  => 12,
	);

	const OBJECT_TYPES = array('post', 'place', 'event', 'user', 'community', 'experience', 'trip', 'video', 'track');

	public static function isValidVerb($verb) {
		return isset(self::VERBS[(string) $verb]);
	}

	public static function isValidObjectType($type) {
		return in_array((string) $type, self::OBJECT_TYPES, true);
	}

	/**
	 * Записывает реальное действие. $actorGuid ВСЕГДА приходит от
	 * сервера из проверенной сессии — этот метод не принимает
	 * актора от клиента ни при каких условиях.
	 */
	public function record($actorGuid, $verb, $objectType, $objectGuid) {
		$actorGuid  = intval($actorGuid);
		$objectGuid = intval($objectGuid);
		if (!$actorGuid || !$objectGuid) {
			return false;
		}
		if (!self::isValidVerb($verb) || !self::isValidObjectType($objectType)) {
			return false;
		}
		return $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('actor_guid', 'verb', 'object_type', 'object_guid', 'weight', 'time_created'),
			'values' => array($actorGuid, (string) $verb, (string) $objectType, $objectGuid, self::VERBS[(string) $verb], time()),
		));
	}

	/** Реальные сигналы по одному объекту — основа engagement-скора в ранжировании. */
	public function forObject($objectType, $objectGuid, $sinceSeconds = 0) {
		$wheres = array(
			self::wheres('object_type', '=', (string) $objectType),
			self::wheres('object_guid', '=', intval($objectGuid)),
		);
		if ($sinceSeconds > 0) {
			$wheres[] = self::wheres('time_created', '>', time() - intval($sinceSeconds));
		}
		$rows = $this->select(array('from' => self::TABLE, 'wheres' => $wheres), true);
		return $rows ? $rows : array();
	}

	/**
	 * Сумма весов по объекту — engagement-скор. Считается по реальным
	 * строкам при каждом вызове, не кэшируется.
	 */
	public function engagementScore($objectType, $objectGuid, $sinceSeconds = 0) {
		$score = 0;
		foreach ($this->forObject($objectType, $objectGuid, $sinceSeconds) as $row) {
			$score += intval($row->weight);
		}
		return $score;
	}

	/** Реальная история действий пользователя — основа Trust scoring. */
	public function forActor($actorGuid, $sinceSeconds = 0, $limit = 500) {
		$wheres = array(self::wheres('actor_guid', '=', intval($actorGuid)));
		if ($sinceSeconds > 0) {
			$wheres[] = self::wheres('time_created', '>', time() - intval($sinceSeconds));
		}
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => $wheres,
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/**
	 * Считает, сколько РАЗНЫХ пользователей взаимодействовали с
	 * объектом. Важно для ранжирования: 50 действий от одного человека
	 * не должны весить как 50 разных людей (простейшая защита от накрутки).
	 */
	public function distinctActors($objectType, $objectGuid, $sinceSeconds = 0) {
		$seen = array();
		foreach ($this->forObject($objectType, $objectGuid, $sinceSeconds) as $row) {
			$seen[intval($row->actor_guid)] = true;
		}
		return count($seen);
	}
}
