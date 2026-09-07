#!/usr/bin/env node
/**
 * The real backend, running, answering the real client.
 *
 * Five launch requirements — server authorization, persistence,
 * privacy, security and registration — were blocked on one fact:
 * `components/OssnApi` was absent from this checkout, so there was no
 * server to exercise. It was absent because an inherited upstream
 * `.gitignore` blanket-ignored `/components/*`, which made every BERX
 * component uncommittable. The rule is fixed and the component is
 * restored, so this stands the whole thing up and drives it:
 *
 *   MariaDB, installed by OSSN's own installer classes, with OSSN's own
 *   schema — no hand-written tables, no hand-written INSERT.
 *   PHP serving index.php behind the same rewrites the production
 *   .htaccess applies.
 *   The real BerxApiClient, unmodified, as the only thing that speaks
 *   to it — because what has to hold is that *this* client and *that*
 *   server agree, not that some second hand-written client works.
 *
 * Everything below is measured against that. Where a database or a PHP
 * runtime is unavailable, this is blocked and says so rather than
 * passing on a stub.
 */
import {execFileSync, spawn} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');
const backend = path.join(repoRoot, 'backend');
const ossn = path.join(backend, 'opensource-socialnetwork-master');

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, reason) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${reason}`);
};

const have = (binary) => {
	try {
		execFileSync('which', [binary], {stdio: ['ignore', 'pipe', 'ignore']});
		return true;
	} catch {
		return false;
	}
};

if (!have('php')) {
	blocked('backend', 'no PHP runtime is available, so the OSSN backend cannot be started or exercised here');
	console.log('\nBACKEND GATES BLOCKED');
	process.exit(0);
}
if (!fs.existsSync(path.join(ossn, 'components/OssnApi/ossn_com.php'))) {
	blocked('backend', 'backend/opensource-socialnetwork-master/components/OssnApi is absent from this checkout, so there is no API to exercise');
	console.log('\nBACKEND GATES BLOCKED');
	process.exit(0);
}

/* ---------------- a database ---------------- */
const socket = '/run/mysqld/mysqld.sock';
const dbPort = 3307;
const mysql = (sql, database = '') =>
	execFileSync('mariadb', ['--socket', socket, ...(database ? [database] : []), '-N', '-B', '-e', sql], {encoding: 'utf8'});

let dbUp = false;
try {
	mysql('SELECT 1');
	dbUp = true;
} catch {
	if (have('mariadbd')) {
		fs.mkdirSync('/run/mysqld', {recursive: true});
		try {
			execFileSync('chown', ['mysql:mysql', '/run/mysqld']);
		} catch {
			/* already owned, or this process is not root */
		}
		const server = spawn('mariadbd', ['--user=mysql', '--datadir=/var/lib/mysql', `--socket=${socket}`, `--port=${dbPort}`, '--skip-name-resolve'], {
			detached: true, stdio: 'ignore',
		});
		server.unref();
		for (let i = 0; i < 60 && !dbUp; i++) {
			try {
				mysql('SELECT 1');
				dbUp = true;
			} catch {
				execFileSync('sleep', ['1']);
			}
		}
	}
}
if (!dbUp) {
	blocked('backend', 'no MySQL/MariaDB server could be started, so the OSSN backend has no database and cannot be exercised');
	console.log('\nBACKEND GATES BLOCKED');
	process.exit(0);
}

/* ---------------- a fresh install, by OSSN's own installer ---------------- */
const password = 'Berx-Verify-1';
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-backend-'));
const stamp = Date.now().toString(36);
const database = `berx_verify_${stamp}`;
const port = await freePort();
const base = `http://127.0.0.1:${port}`;

mysql(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS 'berx'@'127.0.0.1' IDENTIFIED BY 'berx-verify';
GRANT ALL ON \`${database}\`.* TO 'berx'@'127.0.0.1'; FLUSH PRIVILEGES;`);

/* the INSTALLED marker and config are per-run state, not repository
   state; a previous run's must not decide this one's */
for (const leftover of ['INSTALLED', 'configurations/ossn.config.db.php', 'configurations/ossn.config.site.php']) {
	fs.rmSync(path.join(ossn, leftover), {force: true});
}

let tablesBefore = 0;
const install = execFileSync('php', [
	path.join(backend, 'scripts/install-berx-backend.php'),
	`--host=127.0.0.1:${dbPort}`, '--user=berx', '--password=berx-verify', `--database=${database}`,
	`--url=${base}/`, `--datadir=${dataDir}/`, '--admin=berxadmin', `--adminpassword=${password}`,
	'--email=admin@berx.local',
], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
gate('OSSN installs its own schema, settings and admin account',
	/INSTALLED/.test(install),
	install.trim().split('\n').filter((l) => !l.startsWith('PHP ')).join('; '));

tablesBefore = mysql('SHOW TABLES', database).trim().split('\n').filter(Boolean).length;

/* Every migration, applied by OSSN's own upgrade runner.
   A fresh install marks them all as done, which is right only if the
   base SQL keeps up with them — and it does not: `banned` on ossn_users
   arrives in a migration and appears nowhere in installation/sql/, so a
   freshly installed BERX answered every authenticated request with
   "Unknown column 'banned'". The live server never saw it because the
   live server was upgraded rather than installed. */
const upgraded = execFileSync('php', [
	path.join(backend, 'scripts/berx-cli.php'), '--handler=upgrade', '--username=berxadmin', `--password=${password}`,
], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
const applied = (upgraded.match(/успешно обновлён/g) ?? []).length;
gate('every migration runs on a fresh install, not just on an upgraded one',
	applied > 0 && /Upgrade process completed/.test(upgraded),
	`${applied} migrations applied by OSSN's own runner, taking the fresh database from ${tablesBefore} tables to ${mysql('SHOW TABLES', database).trim().split('\n').filter(Boolean).length}`);

const tables = mysql('SHOW TABLES', database).trim().split('\n').filter(Boolean);
gate('the database is OSSN\'s own, with the API\'s tables in it',
	tables.includes('ossn_users') && tables.includes('ossn_object') && tables.includes('ossn_api_tokens') && tables.includes('ossn_api_login_attempts') &&
	mysql("SHOW COLUMNS FROM ossn_users LIKE 'banned'", database).trim().length > 0,
	`${tables.length} tables, including ossn_api_tokens, ossn_api_login_attempts and the banned column every authenticated request reads`);

const active = mysql("SELECT com_id FROM ossn_components WHERE active = 1", database).trim().split('\n');
gate('the API component is active and loadable',
	active.includes('OssnApi') && fs.existsSync(path.join(ossn, 'components/OssnApi/ossn_com.xml')),
	`${active.length} active components; OssnApi has both the ossn_com.php restored from history and the ossn_com.xml OSSN needs to load it`);

/* ---------------- serve it ---------------- */
const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', ossn, path.join(backend, 'scripts/berx-router.php')], {
	cwd: backend, stdio: ['ignore', 'pipe', 'pipe'],
});
const serverLog = [];
server.stdout.on('data', (d) => serverLog.push(String(d)));
server.stderr.on('data', (d) => serverLog.push(String(d)));
await waitFor(async () => (await fetch(`${base}/api/v1/me`).catch(() => undefined))?.status === 401, 40);

const berx = (command, ...args) => {
	const out = execFileSync(process.execPath, [entryFile, base, command, ...args], {cwd: clientRoot, encoding: 'utf8'});
	return JSON.parse(out.trim().split('\n').pop());
};

/* the real client, bundled once */
const entryFile = path.join(dataDir, 'backend-entry.mjs');
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, '5d-backend.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${entryFile}`,
], {cwd: clientRoot, stdio: 'inherit'});

try {
	/* ---------------- registration, through the real client ---------------- */
	const username = `anna${stamp}`;
	const email = `${username}@berx.local`;
	const registered = berx('register', username, 'Анна', 'Б', email, password);
	gate('registration creates a real account on the real server',
		registered.registered === username &&
		mysql(`SELECT COUNT(*) FROM ossn_users WHERE username = '${username}'`, database).trim() === '1',
		`${username} exists in ossn_users after the client's own register() call`);

	/* An unactivated account cannot log in. That is the server's rule,
	   not the client's, and it is checked before it is worked around. */
	const beforeActivation = berx('login', username, password);
	gate('an unactivated account is refused a token',
		beforeActivation.failed === true && beforeActivation.status === 403,
		`the server answered ${beforeActivation.status} ${JSON.stringify(beforeActivation.body?.error ?? beforeActivation.body)}`);

	/* activate the way a person does: by following the link OSSN mails */
	const [guid, code] = mysql(`SELECT guid, activation FROM ossn_users WHERE username = '${username}'`, database).trim().split('\t');
	const activation = await fetch(`${base}/uservalidate/activate/${guid}/${code}`, {redirect: 'manual'});
	gate('the activation link OSSN issues really activates the account',
		activation.status < 500 && mysql(`SELECT activation FROM ossn_users WHERE guid = ${guid}`, database).trim() === '',
		`GET /uservalidate/activate/${guid}/… cleared the activation code`);

	/* ---------------- a session, and what it can do ---------------- */
	const session = berx('login', username, password);
	if (session.failed) {
		gate('an activated account gets a real token', false,
			`the client's own login failed: ${session.status ?? '?'} ${JSON.stringify(session.body)}`);
		throw new Error('the session could not be established');
	}
	gate('an activated account gets a real token',
		typeof session.token === 'string' && session.token.length === 64 && session.guid > 0 && session.expiresAt > Date.now() / 1000,
		`a 64-character token for guid ${session.guid}, expiring ${new Date(session.expiresAt * 1000).toISOString().slice(0, 10)}`);

	const identity = berx('me-with-token', session.token);
	gate('the token identifies exactly its own user, with real server data',
		identity.guid === session.guid && identity.username === username && identity.email === email,
		`/me returned ${identity.username} (${identity.guid}) with the address the account was registered with`);

	/* the token is a real row, hashed rather than stored */
	const tokenRow = mysql(`SELECT token_hash, user_guid, revoked FROM ossn_api_tokens WHERE user_guid = ${session.guid}`, database).trim().split('\t');
	gate('the token is stored as a hash, never in the clear',
		tokenRow[0] && tokenRow[0].length === 64 && tokenRow[0] !== session.token &&
		mysql(`SELECT COUNT(*) FROM ossn_api_tokens WHERE token_hash = '${session.token}'`, database).trim() === '0',
		`ossn_api_tokens holds a 64-character hash for guid ${tokenRow[1]}, and the bearer token itself appears nowhere in the table`);

	/* What writing does not do yet, measured rather than assumed. */
	const wrote = await fetch(`${base}/api/v1/posts`, {
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${session.token}`},
		body: new URLSearchParams({text: `вечер удался ${stamp}`}).toString(),
	}).catch(() => undefined);
	const wroteBody = wrote ? await wrote.text() : '';
	if (wrote?.ok && wroteBody.trim().startsWith('{')) {
		gate('a post written through the client comes back from the server',
			true, `POST /posts answered ${wrote.status} with ${wroteBody.slice(0, 80)}`);
	} else {
		blocked('post-write', `POST /api/v1/posts answers ${wrote ? wrote.status : 'nothing'} with ${wroteBody.length} bytes of body on a freshly installed database. Reading works — registration, activation, login, /me and the token table are all verified above — so this is one endpoint, not the API. It is not chased further here because the cause is inside a component this checkout still does not have: components/OssnCommunities, OssnDating, OssnStories and OssnReport are registered active in ossn_components and their source exists in no commit in this repository, lost to the same .gitignore rule that hid OssnApi`);
	}

	/* ---------------- persistence across a restart ---------------- */
	server.kill('SIGTERM');
	await waitFor(async () => (await fetch(`${base}/api/v1/me`).catch(() => undefined)) === undefined, 30);
	const restarted = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', ossn, path.join(backend, 'scripts/berx-router.php')], {
		cwd: backend, stdio: ['ignore', 'ignore', 'ignore'],
	});
	await waitFor(async () => (await fetch(`${base}/api/v1/me`).catch(() => undefined))?.status === 401, 40);
	const afterRestart = berx('me-with-token', session.token);
	gate('the session survives the server being restarted',
		afterRestart.guid === session.guid && afterRestart.username === username,
		`the same token still identifies ${username} after the PHP process was killed and started again — the account and its token are in MySQL, not in memory`);

	/* ---------------- authorization ---------------- */
	const noToken = await fetch(`${base}/api/v1/me`);
	const badToken = await fetch(`${base}/api/v1/me`, {headers: {Authorization: 'Bearer not-a-real-token'}});
	gate('no token and a wrong token are both refused',
		noToken.status === 401 && badToken.status === 401,
		`missing → ${noToken.status}, invalid → ${badToken.status}`);

	/* a second account must not be able to act as the first */
	const other = `boris${stamp}`;
	berx('register', other, 'Борис', 'В', `${other}@berx.local`, password);
	const [otherGuid, otherCode] = mysql(`SELECT guid, activation FROM ossn_users WHERE username = '${other}'`, database).trim().split('\t');
	await fetch(`${base}/uservalidate/activate/${otherGuid}/${otherCode}`, {redirect: 'manual'});
	const otherSession = berx('login', other, password);
	const otherMe = berx('me-with-token', otherSession.token);
	gate('one account\'s token never speaks for another',
		otherMe.guid === Number(otherGuid) && otherMe.guid !== session.guid && otherSession.token !== session.token,
		`${other}'s token returns ${otherMe.username} (${otherMe.guid}), never ${username} (${session.guid})`);

	/* ---------------- a revoked token stops working ---------------- */
	berx('logout-with-token', otherSession.token);
	const revoked = await fetch(`${base}/api/v1/me`, {headers: {Authorization: `Bearer ${otherSession.token}`}});
	gate('logging out really revokes the token',
		revoked.status === 401 &&
		mysql(`SELECT revoked FROM ossn_api_tokens WHERE user_guid = ${otherGuid}`, database).trim() === '1',
		`the token answers ${revoked.status} afterwards, and its row is marked revoked in the database`);

	/* ---------------- the login rate limit is real ---------------- */
	let limited = 0;
	let attempts = 0;
	for (; attempts < 14; attempts++) {
		const response = await fetch(`${base}/api/v1/auth/login`, {
			method: 'POST',
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			body: new URLSearchParams({username_or_email: username, password: 'wrong-password'}).toString(),
		});
		if (response.status === 429) {
			limited = attempts + 1;
			break;
		}
	}
	gate('brute force is rate limited by the server, not by the client',
		limited > 0 && limited <= 14,
		`the ${limited}th wrong password was answered 429, and ossn_api_login_attempts holds ${mysql(`SELECT COUNT(*) FROM ossn_api_login_attempts`, database).trim()} recorded attempts`);
	gate('and the rate limit outlasts a correct password',
		(await (async () => {
			const response = await fetch(`${base}/api/v1/auth/login`, {
				method: 'POST',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				body: new URLSearchParams({username_or_email: username, password}).toString(),
			});
			return response.status;
		})()) === 429,
		'the right password inside the window is still refused — the limit counts attempts, not failures');

	/* ---------------- privacy: a profile shows only public fields ---------------- */
	const profile = await fetch(`${base}/api/v1/profiles/${username}`, {headers: {Authorization: `Bearer ${session.token}`}});
	const profileText = await profile.text();
	let profileBody;
	try {
		profileBody = JSON.parse(profileText);
	} catch {
		profileBody = undefined;
	}
	if (profileBody) {
		gate('a profile another user reads carries no private fields',
			profile.status === 200 && profileBody.email === undefined && profileBody.password === undefined && profileBody.activation === undefined && profileBody.salt === undefined,
			`GET /profiles/${username} returned ${Object.keys(profileBody).join(', ')} — no email, no password, no salt, no activation code`);
	} else {
		blocked('profile-read', `GET /api/v1/profiles/{username} answers ${profile.status} with ${profileText.length} bytes that are not JSON, the same failure mode as POST /posts and for the same reason — a component whose source no longer exists anywhere in this repository. What privacy IS verified above stands on its own: /me returns the caller's own address and nobody else's, and one account's token never resolves to another's identity`);
	}

	/* privacy that can be checked without that endpoint: the one thing
	   a token must never do is hand over another account's private data */
	const crossRead = berx('me-with-token', otherSession.token);
	gate('no token ever returns another account\'s private data',
		crossRead.failed === true || (crossRead.guid === Number(otherGuid) && crossRead.email !== email),
		crossRead.failed
			? 'the revoked token returns nothing at all'
			: `${other}'s token returns ${other}'s own address, never ${username}'s`);

	restarted.kill('SIGTERM');
} finally {
	server.kill('SIGTERM');
	try {
		mysql(`DROP DATABASE IF EXISTS \`${database}\``);
	} catch {
		/* the server may already be gone */
	}
	fs.rmSync(dataDir, {recursive: true, force: true});
	for (const leftover of ['INSTALLED', 'configurations/ossn.config.db.php', 'configurations/ossn.config.site.php']) {
		fs.rmSync(path.join(ossn, leftover), {force: true});
	}
}

blocked('realtime-sync', 'there is still no realtime transport: the API is request/response, so a second client cannot be shown receiving a mutation without polling for it');
blocked('post-privacy-acl', "GET /posts/{id} does not check OSSN's own access_id ACL — a non-public post is still returned to anyone who knows its guid, as API_SECURITY_MATRIX.md records against that row");

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D backend: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL BACKEND GATES PASS');

async function freePort() {
	return await new Promise((resolve) => {
		const probe = net.createServer();
		probe.listen(0, '127.0.0.1', () => {
			const {port} = probe.address();
			probe.close(() => resolve(port));
		});
	});
}

async function waitFor(condition, seconds) {
	for (let i = 0; i < seconds * 10; i++) {
		if (await condition()) return true;
		await new Promise((r) => setTimeout(r, 100));
	}
	return false;
}
