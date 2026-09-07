<?php
/**
 * OSSN's own command line, which this checkout has no entry point for.
 *
 * `libraries/ossn.lib.cli.php` defines `ossn_cli_handler()` and the
 * upgrade, admin and user handlers all register against its `cli/loaded`
 * callback — but nothing in this tree ever calls it, so none of it can
 * be reached. This is that missing entry point and nothing more: it
 * starts the system the way index.php does and hands over to OSSN's own
 * dispatcher.
 *
 * Usage:
 *   php berx-cli.php --handler=upgrade --username=... --password=...
 */

$root = dirname(__DIR__) . '/opensource-socialnetwork-master/';
if (!is_file($root . 'INSTALLED')) {
    fwrite(STDERR, "berx-cli: OSSN is not installed\n");
    exit(2);
}

/* A CLI process has no request, and OSSN reads its own site URL out of
   the database rather than out of $_SERVER — but several libraries still
   touch these, so they are supplied rather than left undefined. */
$_SERVER['HTTP_HOST'] = $_SERVER['HTTP_HOST'] ?? '127.0.0.1';
$_SERVER['SERVER_NAME'] = $_SERVER['SERVER_NAME'] ?? '127.0.0.1';
$_SERVER['SERVER_PORT'] = $_SERVER['SERVER_PORT'] ?? '80';
$_SERVER['REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '/';
$_SERVER['SCRIPT_NAME'] = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
$_SERVER['REMOTE_ADDR'] = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = $_SERVER['REQUEST_METHOD'] ?? 'GET';

define('OSSN_ALLOW_SYSTEM_START', true);
require_once($root . 'system/start.php');

ossn_cli_handler();
