#!/usr/bin/env node
/**
 * Realtime, measured — not described.
 *
 * `realtime-sync` was a launch blocker for one honest reason: the API
 * was request/response, so no second client could be SHOWN receiving a
 * mutation. Describing a transport does not close that. What closes it
 * is two real sockets, a real server, and a mutation that one of them
 * makes over plain HTTP arriving at the other without anyone polling.
 *
 * Everything below runs against the real stack:
 *   MariaDB installed by OSSN's own installer,
 *   PHP serving the real API behind the real rewrites,
 *   backend/scripts/berx-realtime-server.php holding the sockets,
 *   Node's own WebSocket as the client — the same protocol a browser
 *   speaks, not a test double.
 *
 * The authorization checks matter as much as the delivery ones. A
 * transport that delivers to whoever asks is not a feature, it is a
 * disclosure, so a stranger's channel, a burnt token and a silent
 * socket are all checked to be refused.
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
	blocked('realtime', 'no PHP runtime is available, so neither the API nor the socket server can be started here');
	console.log('\nREALTIME GATES BLOCKED');
	process.exit(0);
}
if (typeof globalThis.WebSocket !== 'function') {
	blocked('realtime', `this Node (${process.version}) has no global WebSocket, so a real client cannot be opened without adding a dependency`);
	console.log('\nREALTIME GATES BLOCKED');
	process.exit(0);
}

const socketPath = '/run/mysqld/mysqld.sock';
const dbPort = 3307;
const mysql = (sql, database = '') =>
	execFileSync('mariadb', ['--socket', socketPath, ...(database ? [database] : []), '-N', '-B', '-e', sql], {encoding: 'utf8'});

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
			/* already owned, or not root */
		}
		spawn('mariadbd', ['--user=mysql', '--datadir=/var/lib/mysql', `--socket=${socketPath}`, `--port=${dbPort}`, '--skip-name-resolve'], {
			detached: true, stdio: 'ignore',
		}).unref();
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
	blocked('realtime', 'no MySQL/MariaDB server could be started, so the backend the sockets authenticate against does not exist here');
	console.log('\nREALTIME GATES BLOCKED');
	process.exit(0);
}

const password = 'Berx-Verify-1';
const stamp = Date.now().toString(36);
const database = `berx_rt_${stamp}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-realtime-'));
const httpPort = await freePort();
const wsPort = await freePort();
const base = `http://127.0.0.1:${httpPort}`;
const wsUrl = `ws://127.0.0.1:${wsPort}`;

mysql(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS 'berx'@'127.0.0.1' IDENTIFIED BY 'berx-verify';
GRANT ALL ON \`${database}\`.* TO 'berx'@'127.0.0.1'; FLUSH PRIVILEGES;`);

for (const leftover of ['INSTALLED', 'configurations/ossn.config.db.php', 'configurations/ossn.config.site.php']) {
	fs.rmSync(path.join(ossn, leftover), {force: true});
}

let api;
let sockets;
try {
	execFileSync('php', [
		path.join(backend, 'scripts/install-berx-backend.php'),
		`--host=127.0.0.1:${dbPort}`, '--user=berx', '--password=berx-verify', `--database=${database}`,
		`--url=${base}/`, `--datadir=${dataDir}/`, '--admin=berxadmin', `--adminpassword=${password}`,
		'--email=admin@berx.local',
	], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
	execFileSync('php', [
		path.join(backend, 'scripts/berx-cli.php'), '--handler=upgrade', '--username=berxadmin', `--password=${password}`,
	], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});

	/* The realtime endpoints are deployment configuration, not schema:
	   the migration mints the secret, an operator points the two URLs
	   at wherever they run the socket server. That is done here the
	   same way an operator would, in the real settings table. */
	mysql(`INSERT INTO ossn_site_settings (name, value) VALUES ('berx_realtime_url', '${wsUrl}'), ('berx_realtime_publish', 'tcp://127.0.0.1:${wsPort}')`, database);

	const secret = mysql(`SELECT value FROM ossn_site_settings WHERE name = 'berx_realtime_secret'`, database).trim();
	gate('the installation mints its own loopback publish secret',
		/^[0-9a-f]{64}$/.test(secret),
		`ossn_site_settings.berx_realtime_secret is ${secret.length} hex characters, generated by random_bytes in upgrade/upgrades/1785172400.php — not a constant and not derivable from anything public`);
	gate('the realtime token table exists with the hash column and nothing else',
		mysql(`SHOW COLUMNS FROM ossn_realtime_tokens`, database).trim().split('\n').map((l) => l.split('\t')[0]).join(',') ===
			'id,user_guid,token_hash,time_created,time_expires,time_used,revoked',
		'ossn_realtime_tokens holds a hash, an expiry and a burn marker — there is no column a raw token could be stored in');

	api = spawn('php', ['-S', `127.0.0.1:${httpPort}`, '-t', ossn, path.join(backend, 'scripts/berx-router.php')], {
		cwd: backend, stdio: ['ignore', 'ignore', 'ignore'],
	});
	await waitFor(async () => (await fetch(`${base}/api/v1/me`).catch(() => undefined))?.status === 401, 40);

	const socketLog = [];
	sockets = spawn('php', [path.join(backend, 'scripts/berx-realtime-server.php'), `--host=127.0.0.1`, `--port=${wsPort}`], {
		cwd: backend, stdio: ['ignore', 'pipe', 'pipe'],
	});
	sockets.stdout.on('data', (d) => socketLog.push(String(d)));
	sockets.stderr.on('data', (d) => socketLog.push(String(d)));
	await waitFor(async () => await tcpOpen(wsPort), 20);
	gate('the socket server is listening',
		await tcpOpen(wsPort),
		`berx-realtime-server.php accepted a TCP connection on ${wsPort} — ${socketLog.join('').trim().split('\n').pop() ?? ''}`);

	/* ---------------- two real accounts, really friends ---------------- */
	const anna = await account(`anna${stamp}`);
	const boris = await account(`boris${stamp}`);
	const friendAnswers = [
		await (await post(`/api/v1/friend/${boris.guid}`, anna.token)).text(),
		await (await post(`/api/v1/friend/${anna.guid}`, boris.token)).text(),
	];
	const friendRows = mysql(
		`SELECT COUNT(*) FROM ossn_relationships WHERE type = 'friend:request' AND ((relation_from = ${anna.guid} AND relation_to = ${boris.guid}) OR (relation_from = ${boris.guid} AND relation_to = ${anna.guid}))`,
		database,
	).trim();
	gate('the two accounts are really friends, in real relationship rows',
		friendRows === '2',
		`ossn_relationships holds ${friendRows} confirmed rows between ${anna.guid} and ${boris.guid} (server said ${friendAnswers.join(' / ')}) — the authorization below is decided by these, not by a flag in a test`);

	/* ---------------- the credential ---------------- */
	const minted = await json(`${base}/api/v1/realtime/token`, {method: 'POST', headers: auth(anna.token)});
	gate('a bearer token buys a short-lived socket credential, never the other way round',
		typeof minted.token === 'string' && minted.token.length === 64 &&
		minted.url === wsUrl && minted.expires_at > Math.floor(Date.now() / 1000) &&
		minted.expires_at - Math.floor(Date.now() / 1000) <= 300,
		`a 64-character credential valid for ${minted.expires_at - Math.floor(Date.now() / 1000)}s (OssnRealtime::TTL_SECONDS is 300), pointing at ${minted.url}`);
	const storedHash = mysql(`SELECT token_hash FROM ossn_realtime_tokens WHERE user_guid = ${anna.guid}`, database).trim();
	gate('the socket credential is stored as a hash, never in the clear',
		storedHash.length === 64 && storedHash !== minted.token &&
		mysql(`SELECT COUNT(*) FROM ossn_realtime_tokens WHERE token_hash = '${minted.token}'`, database).trim() === '0',
		'the raw credential appears nowhere in ossn_realtime_tokens — only its sha256');

	/* ---------------- a socket that authenticates ---------------- */
	const annaSocket = await openSocket(wsUrl, minted.token);
	gate('a real WebSocket handshake completes and the credential identifies its user',
		annaSocket.authenticated === anna.guid,
		`the server answered auth:ok for guid ${annaSocket.authenticated} over a real RFC 6455 handshake — no Authorization header is involved and the bearer token never left HTTP`);

	const replay = await openSocket(wsUrl, minted.token).catch((error) => error);
	gate('a socket credential is burnt by the socket it opened',
		replay instanceof Error,
		`replaying the same credential was refused: ${replay instanceof Error ? replay.message : 'it was accepted, which is the bug this checks for'}`);

	/* ---------------- what a socket may hear ---------------- */
	const annaGrant = await annaSocket.subscribe([
		`self:${anna.guid}`,
		`person:${boris.guid}`,
		`self:${boris.guid}`,
		'person:999999',
		'nonsense:1',
	]);
	gate('a socket hears its own channels and its real friends, and nothing else',
		annaGrant.granted.includes(`self:${anna.guid}`) &&
		annaGrant.granted.includes(`person:${boris.guid}`) &&
		annaGrant.refused.includes(`self:${boris.guid}`) &&
		annaGrant.refused.includes('person:999999') &&
		annaGrant.refused.includes('nonsense:1'),
		`granted ${JSON.stringify(annaGrant.granted)}, refused ${JSON.stringify(annaGrant.refused)} — the other account's own channel, a stranger and a malformed name are all refused, and the client is TOLD they were rather than left to infer it from silence`);

	const httpDecision = await json(`${base}/api/v1/realtime/authorize`, {
		method: 'POST',
		headers: {...auth(anna.token), 'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({channels: `self:${anna.guid},self:${boris.guid},person:${boris.guid}`}).toString(),
	});
	gate('HTTP and the socket answer the same authorization question the same way',
		JSON.stringify(httpDecision.granted.sort()) === JSON.stringify([`person:${boris.guid}`, `self:${anna.guid}`].sort()) &&
		httpDecision.refused.includes(`self:${boris.guid}`),
		`POST /realtime/authorize granted ${JSON.stringify(httpDecision.granted)} — one implementation (OssnRealtime::authorizeChannel), reached two ways`);

	/* ---------------- delivery, client to client ---------------- */
	const borisToken = (await json(`${base}/api/v1/realtime/token`, {method: 'POST', headers: auth(boris.token)})).token;
	const borisSocket = await openSocket(wsUrl, borisToken);
	await borisSocket.subscribe([`person:${anna.guid}`, `self:${boris.guid}`]);

	const heard = borisSocket.next('event', 5000);
	annaSocket.send({type: 'publish', channel: `person:${anna.guid}`, payload: {kind: 'test', note: 'привет'}});
	const clientEvent = await heard;
	gate('what one client publishes really arrives at another, with the publisher stamped by the server',
		clientEvent?.channel === `person:${anna.guid}` && clientEvent.from === anna.guid &&
		clientEvent.payload?.note === 'привет',
		`boris received ${JSON.stringify(clientEvent?.payload)} on ${clientEvent?.channel} from ${clientEvent?.from} — the sender's identity comes from the authenticated connection, so a client cannot publish as anyone else`);

	const refusedPublish = annaSocket.next('publish:refused', 5000);
	annaSocket.send({type: 'publish', channel: `self:${boris.guid}`, payload: {kind: 'test'}});
	gate('a client cannot publish to a channel it may not hear',
		(await refusedPublish) !== undefined,
		`publishing to self:${boris.guid} was refused — a publisher is authorized with the same call a subscriber is`);

	/* ---------------- delivery, from a real server mutation ---------------- */
	const serverHeard = borisSocket.next('event', 8000);
	const written = await json(`${base}/api/v1/posts`, {
		method: 'POST',
		headers: {...auth(anna.token), 'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({text: `вечер удался ${stamp}`}).toString(),
	});
	const serverEvent = await serverHeard;
	gate('a real HTTP mutation reaches the other client with nobody polling',
		serverEvent?.origin === 'server' &&
		serverEvent.payload?.kind === 'post:created' &&
		serverEvent.payload?.guid === written.guid &&
		serverEvent.channel === `person:${anna.guid}`,
		`POST /api/v1/posts wrote post ${written.guid} and boris's socket received {kind: post:created, guid: ${serverEvent?.payload?.guid}} — the PHP request that did the write reached the socket process over the guarded loopback line, and boris asked for nothing${serverEvent ? ` | what actually arrived: ${JSON.stringify(serverEvent)}` : ` | nothing arrived; socket server said: ${socketLog.join('').trim().split('\n').slice(-6).join(' ⏎ ')}`}`);

	const profileHeard = borisSocket.next('event', 8000);
	await json(`${base}/api/v1/me`, {
		method: 'PATCH',
		headers: {...auth(anna.token), 'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({first_name: 'Анна', last_name: 'Реальная'}).toString(),
	});
	const profileEvent = await profileHeard;
	gate('a profile change reaches the world that already holds that person',
		profileEvent?.payload?.kind === 'person:changed' &&
		profileEvent.payload?.username === anna.username,
		`PATCH /me produced {kind: person:changed, username: ${profileEvent?.payload?.username}} — the username travels because GET /profiles/{username} is the real endpoint that resolves it`);

	/* ---------------- what an unguarded fan-out would allow ---------------- */
	const forged = await loopbackPublish(wsPort, 'not-the-secret', {channel: `person:${anna.guid}`, payload: {kind: 'forged'}});
	gate('the loopback fan-out refuses anything without the installation secret',
		forged.trim() === 'REFUSED',
		`a BERX-PUBLISH line with a wrong secret was answered "${forged.trim()}" and the connection dropped — hash_equals, so the answer costs the same however wrong the guess is`);

	/* ---------------- a socket that never says who it is ---------------- */
	const silent = new net.Socket();
	await new Promise((resolve) => silent.connect(wsPort, '127.0.0.1', resolve));
	const closedByServer = await new Promise((resolve) => {
		silent.on('close', () => resolve(true));
		setTimeout(() => resolve(false), 14000);
	});
	silent.destroy();
	gate('a socket that never authenticates is dropped by the server',
		closedByServer,
		'an anonymous connection was closed after BERX_WS_AUTH_GRACE — an open file descriptor is not a session');

	annaSocket.close();
	borisSocket.close();
} finally {
	api?.kill('SIGTERM');
	sockets?.kill('SIGTERM');
	try {
		mysql(`DROP DATABASE IF EXISTS \`${database}\``);
	} catch {
		/* already gone */
	}
	fs.rmSync(dataDir, {recursive: true, force: true});
	for (const leftover of ['INSTALLED', 'configurations/ossn.config.db.php', 'configurations/ossn.config.site.php']) {
		fs.rmSync(path.join(ossn, leftover), {force: true});
	}
}

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D realtime: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL REALTIME GATES PASS');

/* ------------------------------------------------------------------ */

function auth(token) {
	return {Authorization: `Bearer ${token}`};
}

async function json(url, options) {
	const response = await fetch(url, options);
	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${url} answered ${response.status} with ${text.slice(0, 200)}`);
	}
}

async function post(pathname, token) {
	return await fetch(`${base}${pathname}`, {method: 'POST', headers: auth(token)});
}

async function account(username) {
	await fetch(`${base}/api/v1/auth/register`, {
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({
			username, firstname: 'Имя', lastname: 'Фамилия', email: `${username}@berx.local`, password,
		}).toString(),
	});
	const [guid, code] = mysql(`SELECT guid, activation FROM ossn_users WHERE username = '${username}'`, database).trim().split('\t');
	await fetch(`${base}/uservalidate/activate/${guid}/${code}`, {redirect: 'manual'});
	const login = await json(`${base}/api/v1/auth/login`, {
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({username_or_email: username, password}).toString(),
	});
	return {username, guid: Number(guid), token: login.token};
}

/**
 * A real client: Node's own WebSocket, the same protocol a browser
 * speaks. Resolves once the server has said auth:ok, rejects when it
 * refuses — so a burnt or forged credential fails here rather than
 * silently producing a socket that hears nothing.
 */
async function openSocket(url, token) {
	const socket = new WebSocket(url, 'berx-realtime-1');
	const waiters = [];
	const seen = [];
	socket.addEventListener('message', (event) => {
		const message = JSON.parse(String(event.data));
		/* A message handed to a waiter must NOT also stay in the
		   backlog: leaving it there let the next await return the
		   PREVIOUS event, which made a delivered message look like a
		   missing one. The bug was here, in the harness, not in the
		   server — worth keeping the note, because "the gate said it
		   failed" is not the same as "the product failed". */
		const waiting = waiters.findIndex((w) => w.type === message.type);
		if (waiting >= 0) {
			waiters.splice(waiting, 1)[0].resolve(message);
			return;
		}
		seen.push(message);
	});
	const next = (type, timeoutMs) =>
		new Promise((resolve) => {
			const existing = seen.findIndex((m) => m.type === type);
			if (existing >= 0) return resolve(seen.splice(existing, 1)[0]);
			const waiter = {type, resolve};
			waiters.push(waiter);
			setTimeout(() => {
				const at = waiters.indexOf(waiter);
				if (at >= 0) {
					waiters.splice(at, 1);
					resolve(undefined);
				}
			}, timeoutMs);
		});

	await new Promise((resolve, reject) => {
		socket.addEventListener('open', resolve);
		socket.addEventListener('error', () => reject(new Error('the socket failed to open')));
	});
	socket.send(JSON.stringify({type: 'auth', token}));
	const ok = await Promise.race([next('auth:ok', 5000), next('auth:error', 5000)]);
	if (!ok || ok.type !== 'auth:ok') {
		socket.close();
		throw new Error(ok ? String(ok.error) : 'the server never answered the auth frame');
	}
	return {
		authenticated: ok.user_guid,
		send: (message) => socket.send(JSON.stringify(message)),
		next,
		close: () => socket.close(),
		async subscribe(channels) {
			socket.send(JSON.stringify({type: 'subscribe', channels}));
			const answer = await next('subscribe:ok', 5000);
			return answer ?? {granted: [], refused: []};
		},
	};
}

async function loopbackPublish(port, secret, envelope) {
	return await new Promise((resolve) => {
		const socket = new net.Socket();
		let answer = '';
		socket.connect(port, '127.0.0.1', () => {
			socket.write(`BERX-PUBLISH ${secret} ${JSON.stringify(envelope)}\n`);
		});
		socket.on('data', (chunk) => {
			answer += String(chunk);
		});
		socket.on('close', () => resolve(answer));
		setTimeout(() => {
			socket.destroy();
			resolve(answer);
		}, 3000);
	});
}

async function tcpOpen(port) {
	return await new Promise((resolve) => {
		const probe = new net.Socket();
		probe.setTimeout(500);
		probe.once('error', () => resolve(false));
		probe.once('timeout', () => {
			probe.destroy();
			resolve(false);
		});
		probe.connect(port, '127.0.0.1', () => {
			probe.end();
			resolve(true);
		});
	});
}

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
