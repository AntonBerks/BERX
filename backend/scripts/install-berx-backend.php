<?php
/**
 * Install BERX's OSSN backend, headlessly.
 *
 * OSSN installs through a browser wizard: a settings form, an admin
 * account form, and a finish step. None of that can run in a
 * verification, and none of it needs to — the wizard is a form around
 * `OssnInstallation` and `OssnUser`, and this drives those same classes
 * directly, in the same order, with the same values the forms collect.
 *
 * Nothing here reimplements OSSN. There is no hand-written schema, no
 * hand-written INSERT and no substitute for `addUser()`: the SQL comes
 * from installation/sql/, the settings come from `setStartupSettings`,
 * and the admin account comes from the same `OssnUser` the wizard uses.
 * A verification that installed a *different* database would be
 * verifying something other than BERX.
 *
 * Usage:
 *   php install-berx-backend.php --host=127.0.0.1:3307 --user=berx \
 *       --password=... --database=berx --url=http://127.0.0.1:8099/ \
 *       --datadir=/tmp/berx-data/ --admin=... --adminpassword=...
 */

$root = dirname(__DIR__) . '/opensource-socialnetwork-master/';
$args = [];
foreach (array_slice($argv, 1) as $arg) {
    if (preg_match('/^--([a-z]+)=(.*)$/', $arg, $m)) {
        $args[$m[1]] = $m[2];
    }
}
foreach (['host', 'user', 'password', 'database', 'url', 'datadir', 'admin', 'adminpassword', 'email'] as $required) {
    if (!isset($args[$required])) {
        fwrite(STDERR, "install-berx-backend: --{$required} is required\n");
        exit(2);
    }
}

if (!is_dir($args['datadir'])) {
    mkdir($args['datadir'], 0775, true);
}

/* The installation runtime, exactly as installation/index.php starts it. */
define('OSSN_ALLOW_SYSTEM_START', true);
define('OSSN_INSTALLATION', true);
/* The installer reads its own paths out of $_SERVER, because it normally
   runs behind a web server. Supplying what a request would have supplied
   is how it runs headlessly without changing a line of it. */
$host = parse_url($args['url'], PHP_URL_HOST);
$port = parse_url($args['url'], PHP_URL_PORT) ?: 80;
$_SERVER['HTTP_HOST'] = $port === 80 ? $host : "{$host}:{$port}";
$_SERVER['SERVER_NAME'] = $host;
$_SERVER['SERVER_PORT'] = (string) $port;
$_SERVER['REQUEST_URI'] = '/installation/';
$_SERVER['SCRIPT_NAME'] = '/installation/index.php';
$_SERVER['PHP_SELF'] = '/installation/index.php';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTPS'] = '';

/* the installer's own globals, as installation/index.php sets them up */
global $OssnInstall;
$OssnInstall = new stdClass();

/* the installer's own library and class, from installation/index.php */
chdir($root . 'installation');
require_once($root . 'installation/libraries/ossn.install.php');
require_once($root . 'installation/classes/OssnInstall.php');

$settings = new OssnInstallation();
$settings->dbusername($args['user']);
$settings->dbpassword($args['password']);
$settings->dbhost($args['host']);
$settings->dbname($args['database']);
$settings->weburl($args['url']);
$settings->datadir($args['datadir']);
$settings->setStartupSettings([
    'owner_email' => $args['email'],
    'notification_email' => $args['email'],
    'sitename' => 'BERX',
]);

if (!$settings->INSTALL()) {
    fwrite(STDERR, "install-berx-backend: OSSN's own installer refused: {$settings->error_mesg}\n");
    exit(1);
}
echo "schema and settings installed\n";

/* The admin account, through the same OssnUser the wizard's account step
   uses — including its own username, password and email validation. */
require_once($root . 'system/start.php');

$admin = new OssnUser();
$admin->username = $args['admin'];
$admin->first_name = 'BERX';
$admin->last_name = 'Admin';
$admin->email = $args['email'];
$admin->password = $args['adminpassword'];
$admin->gender = 'male';
$admin->birthdate = '1/1/1990';
$admin->sendactiviation = false;
$admin->usertype = 'admin';
$admin->validated = true;

if (!$admin->isUsername($args['admin'])) {
    fwrite(STDERR, "install-berx-backend: OSSN rejected the admin username\n");
    exit(1);
}
if (!$admin->isPassword()) {
    fwrite(STDERR, "install-berx-backend: OSSN rejected the admin password\n");
    exit(1);
}
if (!$admin->addUser()) {
    fwrite(STDERR, "install-berx-backend: OSSN could not create the admin account\n");
    exit(1);
}
echo "admin account created\n";

/*
 * A fresh install marks every migration as already applied, which is
 * right only if installation/sql/ is up to date with them. It is not:
 * `banned` on ossn_users arrives in upgrade/upgrades/1785170600.php and
 * appears nowhere in the base SQL, so a freshly installed BERX answered
 * every authenticated API request with "Unknown column 'banned'". The
 * live server never hit it because the live server was upgraded, never
 * freshly installed.
 *
 * Rather than hand-transcribing 81 migrations into the base dump — which
 * would go stale again on the next one — a fresh install is told it has
 * applied none of them, so OSSN's own upgrade runner applies them all.
 * Base schema plus every migration is the schema, by construction.
 */
$settings = new OssnDatabase();
$settings->statement("UPDATE ossn_site_settings SET value = '' WHERE name = 'upgrades'");
$settings->execute();
echo "upgrades reset so OSSN's own runner can apply them\n";

file_put_contents($root . 'INSTALLED', 1);
echo "INSTALLED\n";
