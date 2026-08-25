<?php
/**
 * BERX Future Core — Event Layer (domain signal log).
 *
 * Append-only лог реальных доменных действий. Единый источник для
 * Feed ranking, Trust scoring и Analytics — вместо четырёх разрозненных
 * механизмов (points/notifications/impressions/streak), каждый из
 * которых сегодня пишет свои следы отдельно и не читается другими.
 *
 * НАЗВАНИЕ: 'signals', не 'events' — OssnEvents уже занят календарными
 * событиями. Коллизия имён проверена перед созданием, не предположена.
 *
 * Хранится только то, что реально произошло: actor, тип действия,
 * объект. Никаких вычисленных/предсказанных значений.
 *
 * Idempotent — тот же guard-паттерн, что во всех прошлых миграциях.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.13');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_signals'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_signals` (
  `id` bigint NOT NULL,
  `actor_guid` bigint NOT NULL,
  `verb` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `object_type` varchar(24) COLLATE utf8mb4_general_ci NOT NULL,
  `object_guid` bigint NOT NULL,
  `weight` smallint NOT NULL DEFAULT 1,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_signals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_actor` (`actor_guid`),
  ADD KEY `index_object` (`object_type`, `object_guid`),
  ADD KEY `index_actor_verb_time` (`actor_guid`, `verb`, `time_created`),
  ADD KEY `index_time` (`time_created`);

ALTER TABLE `ossn_signals`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.13',
));
$factory->connect();
