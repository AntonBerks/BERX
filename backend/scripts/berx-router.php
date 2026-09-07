<?php
/**
 * PHP's built-in server, doing what BERX's .htaccess does.
 *
 * OSSN reaches its page handlers through Apache rewrites — the rules in
 * installation/configs/htaccess.dist turn `/api/v1/places/123` into
 * `index.php?h=api&p=v1/places/123`. The built-in server has no
 * mod_rewrite, so a verification that served the tree directly would be
 * testing a different routing table from production.
 *
 * This reproduces exactly those rules, in the same order, and nothing
 * else. Real files are served as themselves; everything else becomes
 * the same handler/page pair Apache would have produced.
 */

$root = dirname(__DIR__) . '/opensource-socialnetwork-master/';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$path = ltrim($path, '/');

/* Apache passes Authorization through explicitly (the E=HTTP_AUTHORIZATION
   rule); PHP's server does not populate it for every SAPI either, so the
   same bridge is applied here. Without it every bearer token is invisible
   and every authenticated endpoint answers 401 for the wrong reason. */
if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    foreach (['REDIRECT_HTTP_AUTHORIZATION', 'HTTP_X_AUTHORIZATION'] as $alt) {
        if (isset($_SERVER[$alt])) {
            $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER[$alt];
            break;
        }
    }
}

/* a real file, served as itself — the RewriteCond !-f / !-d guard */
if ($path !== '' && is_file($root . $path)) {
    return false;
}

/* ^action/(...)$ -> system/handlers/actions.php?action=$1 */
if (preg_match('#^action/([A-Za-z0-9_\-/]+)$#', $path, $m)) {
    $_GET['action'] = $m[1];
    $_REQUEST['action'] = $m[1];
    require $root . 'system/handlers/actions.php';
    return true;
}

/* ^([A-Za-z0-9_\-.]+)/(.*)$ -> index.php?h=$1&p=$2 */
if (preg_match('#^([A-Za-z0-9_\-.]+)/(.*)$#', $path, $m)) {
    $_GET['h'] = $m[1];
    $_GET['p'] = $m[2];
} elseif (preg_match('#^([A-Za-z0-9_\-.]+)$#', $path, $m)) {
    /* ^([A-Za-z0-9_\-.]+)$ -> index.php?h=$1 */
    $_GET['h'] = $m[1];
}
$_REQUEST = array_merge($_REQUEST, $_GET);

require $root . 'index.php';
return true;
