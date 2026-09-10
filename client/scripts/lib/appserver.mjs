/**
 * THE BERX APP, SERVED THE WAY IT SHIPS.
 *
 * One server, so that two gates cannot hold two opinions about what
 * the backend answers. It was inline in verify-5d-app-shell.mjs, and
 * the moment a second gate needed a signed-in world — mobile web —
 * the choice was a copy of two hundred lines of response shapes or
 * this. A copy would have drifted the first time an endpoint changed,
 * and a stub that has fallen behind the client is a stub that reports
 * a fault the product does not have.
 *
 * What it serves:
 *   - app/index.html, byte for byte, from the repository
 *   - the shell bundled from scripts/app-shell.entry.ts by esbuild
 *   - /api/v1/* with the response shapes the types in @berx/api declare
 *   - a real WebSocket on the same origin, speaking berx-realtime-1,
 *     enforcing the same one-use credential rule the PHP server does
 *
 * Nothing here is a mock of the client: the client is the shipped
 * client. This is the server side of a real session, and every gate
 * that uses it measures the product.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {attachBerxTestSocket} from './websocket.mjs';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');

/**
 * Boot one. Returns everything a gate needs to drive and to inspect.
 *
 * `API` is live: a gate that wants to prove a real write somewhere
 * else becomes an entity here mutates it and then broadcasts, exactly
 * as the server would. `served` records every path the client actually
 * asked for, which is how a gate can tell wiring from intention.
 */
export async function startBerxAppServer() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-app-shell-'));

	/* the shipped shell, byte for byte, and the bundle the build produced */
	execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
		path.join(here, 'app-shell.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser',
		'--log-level=error', `--outfile=${path.join(dir, 'berx-app.js')}`,
	], {cwd: clientRoot, stdio: 'inherit'});
	/* the same presentability probe the shell decides with, served so a
	   gate can ask the identical question rather than a similar one */
	execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
		path.join(here, 'webgpu-probe.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser',
		'--log-level=error', `--outfile=${path.join(dir, 'webgpu-probe.js')}`,
	], {cwd: clientRoot, stdio: 'inherit'});
	fs.copyFileSync(path.join(repoRoot, 'app', 'index.html'), path.join(dir, 'index.html'));
	/* everything else the page really asks the origin for: the service
	   worker it registers and the manifest it links. A gate that served
	   the page without them would fail its own "no console errors" check
	   for two 404s the product does not have. */
	for (const name of ['berx-sw.js', 'berx.webmanifest']) {
		fs.copyFileSync(path.join(repoRoot, 'app', name), path.join(dir, name));
	}

	/* ---------------------------------------------------------------- */
	/* A server that answers exactly what components/OssnApi/v1 answers.  */
	/* These are the response shapes the API types declare — the same     */
	/* fields, the same nullability. Nothing here is a field BERX does    */
	/* not send, and nothing the client reads is missing.                 */
	/* ---------------------------------------------------------------- */
	const NOW = Math.floor(Date.now() / 1000);
	const API = {
		'/api/v1/auth/login': {token: 'test-token', user_guid: 77, expires_at: NOW + 86400},
		'/api/v1/me': {guid: 77, username: 'ann', fullname: 'Анна', email: 'a@b.c', icon_url: '', profile_url: '', time_created: NOW - 90000},
		'/api/v1/feed': {
			limit: 30, offset: 0,
			items: [
				{guid: 5150, text: 'вечер удался', owner_guid: 77, owner_username: 'ann', time_created: NOW - 400},
				{guid: 5151, text: 'до завтра', owner_guid: 78, owner_username: 'lev', time_created: NOW - 90000},
			],
		},
		'/api/v1/friends': {friends: [{guid: 78, username: 'lev', fullname: 'Лев', icon: ''}]},
		'/api/v1/conversations': {conversations: [{with_guid: 78, with_username: 'lev', last_message: 'до завтра', time: NOW - 500}]},
		'/api/v1/conversations/78': {
			messages: [
				{id: 9001, from_guid: 77, to_guid: 78, text: 'ты идёшь?', time: NOW - 900},
				{id: 9002, from_guid: 78, to_guid: 77, text: 'до завтра', time: NOW - 500},
				{id: 9003, from_guid: 78, to_guid: 77, text: 'в прошлом месяце', time: NOW - 30 * 86400},
			],
		},
		'/api/v1/places': {
			places: [{
				guid: 4211, title: 'Дом Культуры', description: '', category: 'venue', address: null, phone: null,
				website: null, hours: null, price: null, lat: null, lng: null, owner_guid: 77, cover_url: null,
				rating: 0, rating_count: 0, is_saved: false, is_business: false, business_type: null, verified: false,
			}, {
				/* A BUSINESS IS A PLACE THE SERVER SAYS IS ONE.
				   `is_business` is what makes mapPlaceToSpatial produce the
				   `business` kind — its own geometry (a stack) and its own
				   affordances (view-business / directions / reserve) — and
				   no fixture had ever set it, so the whole business reading
				   of the world went unmeasured. */
				guid: 4212, title: 'Кофейня «Полдень»', description: '', category: 'cafe', address: null, phone: null,
				website: null, hours: null, price: null, lat: null, lng: null, owner_guid: 78, cover_url: null,
				rating: 0, rating_count: 0, is_saved: false, is_business: true, business_type: 'cafe', verified: true,
			}],
		},
		/* A creator, keyed by the username the friends list really sends.
		   These endpoints are the reason a person entity carries
		   `sourceName`: they are keyed by name, not by guid. */
		'/api/v1/creator/lev': {
			user_guid: 78, category: 'music', bio: 'пишу и играю', is_own: false,
			time_enabled: NOW - 40 * 86400, audience: {followers: 3, views: 11},
		},
		'/api/v1/creator/lev/content': {
			posts: [{guid: 6001, text: 'новая запись', time: NOW - 7200}],
			albums: [{guid: 6002, title: 'Крыши'}],
			events: [{guid: 6003, title: 'Концерт в четверг'}],
			experiences: [{id: 6004, title: 'Репетиция'}],
		},
		/* What is on offer at the business. `offers.php` is a complete
		   backend — list, claim, fulfil, redemptions — and the client
		   had no method for it, which is how offers came to be recorded
		   as a provider blocker. */
		'/api/v1/offers/places/4212': {
			offers: [{
				id: 501, place_guid: 4212, title: 'Второй кофе бесплатно', description: 'до конца недели',
				max_redemptions: 20, redemptions_count: 8, ends_at: NOW + 5 * 86400, active: true,
				time_created: NOW - 86400, already_claimed: false, already_fulfilled: false,
			}],
		},
		'/api/v1/offers/places/4211': {offers: []},
		/* The viewer's own dating world, read only when they travel to
		   their own presence. Pseudonyms, never `person:<guid>`. */
		'/api/v1/dating/discover': {
			limit: 12, offset: 0,
			profiles: [
				{guid: 91, pseudonym: 'Вечер', age: 29, city: 'Москва', goal: 'дружба', bio: 'люблю крыши', interests: 'музыка'},
				{guid: 92, pseudonym: 'Полдень', age: null, city: null, goal: null, bio: '', interests: ''},
			],
		},
		'/api/v1/experiences': {
			experiences: [{
				id: 12, title: 'Прогулка по крышам', description: '',
				anchor: {type: 'event', guid: 908, title: 'Вечер импровизации', image_url: null},
				visibility: 'public', owner_guid: 77, is_own: true,
				scheduled_start: NOW + 7200, scheduled_end: null, my_status: null,
			}],
		},
		'/api/v1/communities': {communities: [{guid: 501, name: 'Соседи', description: '', owner_guid: 77, privacy: 'public', is_member: true}]},
		'/api/v1/collections': {collections: [{id: 33, title: 'Любимые места', description: '', visibility: 'public', owner_guid: 77, is_own: true, item_count: 2, time_updated: NOW}]},
		/* Four domains the world loader now reads. Real response shapes,
		   from the types in @berx/api — a stub that 404s an endpoint the
		   shell really calls is a stub that has fallen behind the client. */
		'/api/v1/stories': {
			feed: [{owner_guid: 78, owner_username: 'lev', stories: [
				{id: 91, caption: 'вид с крыши', time_created: NOW - 3600, mime_type: 'image/jpeg'},
			]}],
		},
		'/api/v1/trips': {
			trips: [{
				id: 7, title: 'Север', description: '', visibility: 'public', owner_guid: 77, is_own: true,
				start_date: NOW + 86400, end_date: NOW + 6 * 86400, stop_count: 1, time_updated: NOW,
			}],
		},
		'/api/v1/notifications': {
			limit: 20, offset: 1,
			notifications: [{
				guid: 31, type: 'post:like', poster_guid: 78, subject_guid: 77,
				item_guid: 5150, viewed: false, time_created: NOW - 30,
			}],
		},
		'/api/v1/memories': {
			memories: [{type: 'post', guid: 5151, years_ago: 3, time: NOW - 3 * 365 * 86400, text: 'три года назад'}],
		},
		'/api/v1/posts/5150/like': {status: 'ok'},
		'/api/v1/posts/5150': {guid: 5150, text: 'вечер удался', owner_guid: 77, owner_username: 'ann', time_created: NOW - 400, like_count: 1, comment_count: 0},
		'/api/v1/events': {
			events: [{
				guid: 908, title: 'Вечер импровизации', description: '', category: null,
				starts: NOW - 600, ends: NOW + 3600, location: null, place: {guid: 4211, title: 'Дом Культуры'},
				capacity: null, seats_left: null, attendee_count: 3, owner_guid: 77, cover_url: null,
				has_ended: false, is_going: true,
			}],
		},
	};

	const created = [];
	const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
		'.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png'};
	const served = new Set();
	/* Credentials this server really minted, burnt by the socket that uses
	   one — the same rule berx-realtime-server.php enforces, so a session
	   that reused a token would be refused here exactly as it is there. */
	const minted = new Set();
	const server = http.createServer((req, res) => {
		const name = (req.url ?? '/').split('?')[0];
		if (name === '/favicon.ico') return void res.writeHead(204).end();
		if (name.startsWith('/api/')) {
			served.add(name);
			/* creating a post really creates one, and reading it back returns
			   what the server has — which is what the world is built from */
			if (name === '/api/v1/realtime/token' && req.method === 'POST') {
				const token = `ws-${minted.size + 1}`;
				minted.add(token);
				res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
				return void res.end(JSON.stringify({
					token, expires_at: NOW + 60,
					url: `ws://127.0.0.1:${server.address().port}/socket`,
					protocol: 'berx-realtime-1',
				}));
			}
			if (name === '/api/v1/offers/501/claim' && req.method === 'POST') {
			/* a real claim: the count goes up and the viewer's own
			   claimed state flips, exactly as the PHP does, so a client
			   reading the offer back sees the server's number */
			const offer = API['/api/v1/offers/places/4212'].offers[0];
			if (offer.already_claimed) {
				res.writeHead(409, {'content-type': 'application/json; charset=utf-8'});
				return void res.end(JSON.stringify({error: 'already_claimed'}));
			}
			offer.already_claimed = true;
			offer.redemptions_count += 1;
			res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
			return void res.end(JSON.stringify({status: 'ok', already_claimed: true}));
		}
		if (name === '/api/v1/posts' && req.method === 'POST') {
				const guid = 7700 + created.length;
				created.push(guid);
				API[`/api/v1/posts/${guid}`] = {
					guid, text: 'опубликовано через мир', owner_guid: 77, owner_username: 'ann',
					time_created: NOW, like_count: 0, comment_count: 0,
				};
				res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
				return void res.end(JSON.stringify({guid}));
			}
			const body = API[name];
			if (!body) {
				/* a path this server does not know is a real mismatch between
				   the client and the endpoints it claims to call — say which */
				console.log(`      unmatched API path: ${req.method} ${name}`);
				return void res.writeHead(404, {'content-type': 'application/json'}).end('{"error":"not_found"}');
			}
			res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
			return void res.end(JSON.stringify(body));
		}
		const file = path.join(dir, name === '/' ? 'index.html' : path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
		if (!file.startsWith(dir) || !fs.existsSync(file)) return void res.writeHead(404).end();
		res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
		fs.createReadStream(file).pipe(res);
	});
	/**
	 * A REAL SOCKET, ON THE SAME SERVER.
	 *
	 * The shipped shell is supposed to keep its world live, and no gate
	 * could see whether it did: verify:5d-realtime proves the transport
	 * against the real PHP server, and it never boots the shell. This
	 * speaks the same protocol — auth, subscribe, event — so what is
	 * measured here is the product session opening a connection of its own
	 * accord and turning what arrives into an entity.
	 *
	 * Authorization is the server's rule, not a pass-through: this viewer
	 * hears their own channels and their real friend, and nothing else.
	 */
	const sockets = attachBerxTestSocket(server, {
		protocol: 'berx-realtime-1',
		onMessage: (connection, message) => {
			switch (message.type) {
				case 'auth': {
					if (!minted.delete(message.token)) {
						return connection.send({type: 'auth:error', error: 'unknown or spent credential'});
					}
					connection.state.guid = 77;
					connection.state.channels = new Set();
					return connection.send({type: 'auth:ok', user_guid: 77});
				}
				case 'subscribe': {
					if (!connection.state.guid) return connection.send({type: 'error', error: 'not authenticated'});
					const asked = Array.isArray(message.channels) ? message.channels : [];
					const allowed = new Set(['self:77', 'person:77', 'person:78']);
					const granted = asked.filter((c) => allowed.has(c));
					const refused = asked.filter((c) => !allowed.has(c));
					for (const c of granted) connection.state.channels.add(c);
					return connection.send({type: 'subscribe:ok', granted, refused});
				}
				case 'ping':
					return connection.send({type: 'pong', ts: Math.floor(Date.now() / 1000)});
				default:
					return;
			}
		},
	});
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const base = `http://127.0.0.1:${server.address().port}/`;

	return {
		dir, base, server, sockets, API, served,
		/** The second this world was built at. Every fixture time is
		    relative to it, so a gate asserting "now" asserts the same
		    now the responses were written for. */
		NOW,
		/** The guid of every post this server really created. */
		created,
		close: () => {
			server.close();
			sockets.closeAll?.();
		},
	};
}
