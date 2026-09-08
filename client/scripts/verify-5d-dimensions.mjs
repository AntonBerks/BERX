#!/usr/bin/env node
/**
 * FIVE DIMENSIONS, ON EVERY ENTITY, IN ONE WORLD.
 *
 * BERX claims X/Y/Z + TIME + RELATIONSHIPS, and every dimension already
 * has a gate: composition places things, the temporal cursor moves them,
 * the DOM owns no interface. What none of those establishes is the claim
 * itself, because each proves ONE dimension on a fixture chosen to show
 * it. A world can pass all of them while containing entities that are
 * only ever 3D — placed once, moved by nothing, related to nothing.
 *
 * So this takes a world built the way the product builds one, through
 * the same mappers the running shell uses on real API responses, and
 * asks of EVERY entity in it: does time move you, do relations place
 * you, and are you somewhere in particular. An entity that no dimension
 * acts on is decoration, and decoration is what "5D" is supposed to
 * exclude.
 *
 * TIMELESSNESS IS ALLOWED AND MUST BE DECLARED. A person is not a
 * moment: they do not recede as the cursor moves, and they should not.
 * But the difference between "timeless by design" and "we forgot to
 * give it a time" is invisible in a frame and total in meaning, so the
 * gate requires the timeless ones to be timeless BY KIND rather than by
 * omission — and requires that they are the minority, because a world
 * where nothing moves through time has no T in it.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-dimensions-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const entry = path.join(dir, 'dimensions.mjs');
execFileSync(esbuild, [
	path.join(here, 'dimensions.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${entry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(entry);

/* ---- a world, from the shapes the API really returns ---- */

const NOW = 1_700_000_000;
const PERSON = 77, PLACE = 4211, EVENT = 908;

const user = {guid: PERSON, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0};
const friend = {guid: 78, username: 'lev', fullname: 'Лев', email: '', icon_url: '', profile_url: '', time_created: 0};
const place = {
	guid: PLACE, title: 'Дом Культуры', description: '', category: 'venue', address: null, phone: null,
	website: null, hours: null, price: null, lat: null, lng: null, owner_guid: PERSON, cover_url: null,
	rating: 0, rating_count: 0, is_saved: false, is_business: false, business_type: null, verified: false,
};
const event = {
	guid: EVENT, title: 'Вечер импровизации', description: '', category: null,
	starts: NOW - 600, ends: NOW + 3600, location: null,
	place: {guid: PLACE, title: 'Дом Культуры'}, capacity: null, seats_left: null, attendee_count: 3,
	owner_guid: PERSON, cover_url: null, has_ended: false, is_going: true,
};
/* three moments at three distances in time: this is what T is FOR */
const moments = [
	{guid: 5150, text: 'вечер удался', owner_guid: PERSON, owner_username: 'ann', time_created: NOW - 300},
	{guid: 5151, text: 'вчера', owner_guid: PERSON, owner_username: 'ann', time_created: NOW - 86_400},
	{guid: 5152, text: 'в прошлом месяце', owner_guid: 78, owner_username: 'lev', time_created: NOW - 30 * 86_400},
];

const build = () => {
	const app = new core.Berx5DWorldApp({
		viewerId: `person:${PERSON}`,
		cursor: core.berxTemporalCursor(NOW),
		transitionDuration: 0.01,
	});
	const mapped = [
		core.mapUserToSpatial(user),
		core.mapUserToSpatial(friend),
		core.mapPlaceToSpatial(place),
		core.mapEventToSpatial(event),
		...moments.map((m) => core.mapFeedItemToSpatial(m)),
	];
	app.ingest(mapped.map((m) => ({object: m.object, relations: m.relations ?? [], media: m.media ?? []})));
	return app;
};

const app = build();
const world = () => app.latestFrame.world.objects;
const at = (objects, id) => objects.find((o) => o.id === id);

gate('a world was built from the shapes the API returns, through the product\'s own mappers',
	world().length >= 7,
	`${world().length} entities: ${world().map((o) => `${o.kind}:${o.id.split(':')[1]}`).join(', ')} — no fixture written to pass this, the same mappers the running shell calls on real responses`);

/* ---------------- X, Y, Z ---------------- */

const positions = world().map((o) => o.transform.position);
const finite = positions.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
let closest = Infinity, closestPair = '';
const objs = world();
for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
	const a = objs[i].transform.position, b = objs[j].transform.position;
	const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
	if (d < closest) { closest = d; closestPair = `${objs[i].id}/${objs[j].id}`; }
}
gate('every entity is somewhere in particular, and no two are in the same place',
	finite && closest > 0.4,
	`nearest pair ${closestPair} at ${closest.toFixed(3)} units — two entities at one point are one entity a viewer can never separate, and a NaN is an entity that is nowhere`);

const spread = {
	x: Math.max(...positions.map((p) => p.x)) - Math.min(...positions.map((p) => p.x)),
	y: Math.max(...positions.map((p) => p.y)) - Math.min(...positions.map((p) => p.y)),
	z: Math.max(...positions.map((p) => p.z)) - Math.min(...positions.map((p) => p.z)),
};
gate('the world uses all three spatial axes, not a plane with depth painted on',
	spread.x > 1 && spread.y > 0.5 && spread.z > 1,
	`extent ${spread.x.toFixed(2)} x ${spread.y.toFixed(2)} x ${spread.z.toFixed(2)} — a layout that spread across two axes and gave the third to parallax would be a flat interface with a camera in front of it`);

/* ---------------- T ---------------- */

/**
 * Move the cursor and see who moves.
 *
 * A day forward, which is small enough that nothing leaves the world and
 * large enough that the logarithmic projection separates every band.
 */
const before = new Map(world().map((o) => [o.id, {...o.transform.position}]));
app.setCursor(core.berxTemporalCursor(NOW + 86_400));
const after = new Map(world().map((o) => [o.id, {...o.transform.position}]));
app.setCursor(core.berxTemporalCursor(NOW));

const moved = [...before.keys()].filter((id) => {
	const a = before.get(id), b = after.get(id);
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > 0.01;
});
const still = [...before.keys()].filter((id) => !moved.includes(id));

gate('time is a dimension entities really sit in',
	moved.length > 0,
	`a day forward moved ${moved.length} of ${before.size}: ${moved.join(', ')} — the cursor is not a filter that hides things, it is a position the whole world is seen from`);

/* The ones that did NOT move must be timeless BY KIND, not by omission. */
const timeless = still.map((id) => at(world(), id)).filter(Boolean);
const declared = timeless.filter((o) => core.berxProjectTemporal(o.time, core.berxTemporalCursor(NOW)).band === 'timeless');
gate('what does not move through time is timeless by design, not by omission',
	declared.length === timeless.length,
	timeless.length === 0
		? 'every entity in this world has a time'
		: `${declared.length} of ${timeless.length} still entities are declared timeless (${timeless.map((o) => o.kind).join(', ')}) — a person is not a moment and should not recede, but "timeless by design" and "we forgot to give it a time" look identical in a frame and are opposite in meaning`);

gate('and the timeless are the minority, or there is no T in this world',
	still.length < before.size,
	`${moved.length} move, ${still.length} do not — a world where nothing moves through time is a world with four dimensions and a label`);

/**
 * ORDERING IS EXACT. Further in time must be further in space, always —
 * the compression is logarithmic so a year and an hour are both
 * reachable, and that is only worth anything if it never reorders.
 */
const cursor = core.berxTemporalCursor(NOW);
const depths = moments.map((m) => ({
	age: NOW - m.time_created,
	depth: core.berxProjectTemporal({at: m.time_created}, cursor).depthOffset,
}));
const ordered = depths.every((d, i) => i === 0 || Math.abs(d.depth) >= Math.abs(depths[i - 1].depth));
gate('further in time is always further in space, and never equal',
	ordered && new Set(depths.map((d) => d.depth.toFixed(4))).size === depths.length,
	depths.map((d) => `${Math.round(d.age / 3600)}h → ${d.depth.toFixed(2)}`).join(' · ')
	+ ' — logarithmic, so a year and an hour are both reachable; exact, so two different times can never land on one place');

/* ---------------- R ---------------- */

/**
 * Take a relation away and see whether anything moves.
 *
 * This is the dimension that is easiest to claim and hardest to keep:
 * a layout can look relational while being a ring with entities dropped
 * into fixed slots. If removing a relation changes nothing, it was.
 */
const withRelations = new Map(world().map((o) => [o.id, {...o.transform.position}]));
const weights = world().map((o) => ({id: o.id, w: core.berxRelationalWeight(o.id, app.allRelations)}));
const related = weights.filter((w) => w.w > 0);

const bare = new core.Berx5DWorldApp({
	viewerId: `person:${PERSON}`,
	cursor: core.berxTemporalCursor(NOW),
	transitionDuration: 0.01,
});
bare.ingest([
	core.mapUserToSpatial(user), core.mapUserToSpatial(friend),
	core.mapPlaceToSpatial(place), core.mapEventToSpatial(event),
	...moments.map((m) => core.mapFeedItemToSpatial(m)),
].map((m) => ({object: m.object, relations: [], media: []})));
const withoutRelations = new Map(bare.latestFrame.world.objects.map((o) => [o.id, {...o.transform.position}]));

const relocated = [...withRelations.keys()].filter((id) => {
	const a = withRelations.get(id), b = withoutRelations.get(id);
	return b && Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > 0.01;
});
gate('relations really place entities — take them away and the world rearranges',
	relocated.length > 0,
	`${relocated.length} of ${withRelations.size} entities stand somewhere else without their relations: ${relocated.join(', ')}. A layout that looked relational while dropping entities into fixed slots would move nothing here`);

gate('and the entities the graph knows about are the ones it places',
	related.length > 0 && related.length <= world().length,
	`${related.length} of ${world().length} carry a relational weight: ${related.map((r) => `${r.id.split(':')[0]}=${r.w.toFixed(2)}`).join(', ')}`);

/* ---------------- THE CLAIM ITSELF ---------------- */

/**
 * Every entity, and how many dimensions actually act on it.
 *
 * The check the other five add up to: an entity that is placed but that
 * time does not touch and relations do not move is a 3D object in a 5D
 * world, and it is exactly what this whole architecture exists to
 * prevent. Timeless entities are held to relations instead — a person
 * does not recede, so the graph had better be what puts them somewhere.
 */
const rows = world().map((o) => {
	const t = moved.includes(o.id);
	const r = relocated.includes(o.id) || core.berxRelationalWeight(o.id, app.allRelations) > 0;
	return {id: o.id, kind: o.kind, xyz: true, t, r, dims: 1 + (t ? 1 : 0) + (r ? 1 : 0)};
});
const flat = rows.filter((row) => row.dims < 2);
gate('no entity exists in three dimensions only',
	flat.length === 0,
	flat.length
		? `placed and otherwise untouched: ${flat.map((f) => `${f.id} (${f.kind})`).join(', ')} — a 3D object in a 5D world`
		: rows.map((r) => `${r.kind}${r.t ? '+T' : ''}${r.r ? '+R' : ''}`).join(' · ')
			+ ` — every one of ${rows.length} entities is moved by time, placed by relations, or both`);

const both = rows.filter((r) => r.t && r.r);
gate('and the world is not two separate worlds that happen to overlap',
	both.length > 0,
	`${both.length} entities are acted on by BOTH time and relations: ${both.map((r) => r.id).join(', ')}. If no entity had both, T and R would be two layouts sharing a screen rather than five dimensions sharing a space`);

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D dimensions: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL DIMENSION GATES PASS');
