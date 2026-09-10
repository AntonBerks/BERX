#!/usr/bin/env node
/**
 * THE DOMAINS THAT HAD AN ENDPOINT AND NO WAY IN.
 *
 * BUSINESS, CREATORS and DATING each had real API methods, real
 * response types, and — until this gate — no measured path from a
 * server row to something standing in the world.
 *
 * Business was the subtlest: `mapPlaceToSpatial` has always set
 * `object.kind = 'business'` when the server says `is_business`, and
 * the `business` kind has its own geometry (a stack), its own material
 * and its own affordances. No fixture had ever set the flag, so the
 * whole reading went unexercised and looked, from the audit, like a
 * missing mapper.
 *
 * Creators and dating are read when a viewer TRAVELS TO A PERSON,
 * which is the only honest moment to ask a server anything about one:
 * their own presence brings their own dating world, somebody else's
 * brings what that person has made. Never at boot — a session that
 * pulled other people's dating profiles into every world would have
 * decided on their behalf that being discoverable and being displayed
 * are the same thing.
 *
 * Fast on purpose. It boots the real shell against the real server
 * once and asks the world what it holds; it does not read pixels, so
 * it runs in a couple of minutes rather than half an hour, and it is
 * the gate to run while working on a mapper.
 */
import fs from 'node:fs';
import {launchChromium} from './lib/chromium.mjs';
import {startBerxAppServer} from './lib/appserver.mjs';

const {base, server, sockets, dir, served} = await startBerxAppServer();

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const browser = await launchChromium();
try {
	const context = await browser.newContext({viewport: {width: 1000, height: 700}, deviceScaleFactor: 1});
	const pageErrors = [];
	const page = await context.newPage();
	page.on('pageerror', (e) => pageErrors.push(e.message));
	page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });

	await page.goto(base, {waitUntil: 'load'});
	await page.waitForSelector('#berx-entry:not([hidden])');
	await page.fill('#berx-identifier', 'ann');
	await page.fill('#berx-password', 'secret');
	await page.click('#berx-enter');
	await page.waitForFunction(() => (window.__berxWorld?.latestFrame.world.objects.length ?? 0) > 4, undefined, {timeout: 30000});
	await page.evaluate(async () => { for (let i = 0; i < 30; i++) await new Promise((r) => requestAnimationFrame(r)); });

	/* --- BUSINESS: a place the server marked is a different thing --- */
	const business = await page.evaluate(() => {
		const w = window.__berxWorld;
		const o = w.latestFrame.world.objects.find((x) => /* `place:4212` with kind `business`: an id namespaces the server ROW,
		   and `kind` is what the world draws (see mapPlaceToSpatial). An event
		   at this address relates to place:4212 from a mapper that has never
		   seen the business flag, so renaming the entity breaks that edge. */
			x.id === 'place:4212');
		const plain = w.latestFrame.world.objects.find((x) => x.id === 'place:4211');
		if (!o) return {present: false, ids: w.latestFrame.world.objects.map((x) => x.id)};
		w.blurAffordance?.();
		w.focus(o.id);
		const offered = w.affordances().map((a) => a.action);
		return {
			present: true, kind: o.kind, label: o.label, sourceId: o.sourceId,
			scale: {...o.transform.scale}, material: o.material.material,
			plainKind: plain?.kind, plainScale: plain ? {...plain.transform.scale} : undefined,
			offered,
		};
	});

	gate('a place the server calls a business is a different thing in the world',
		business.present && business.kind === 'business' && business.plainKind === 'place'
		&& JSON.stringify(business.scale) !== JSON.stringify(business.plainScale),
		business.present
			? `place:4212 "${business.label}" is kind "${business.kind}" at ${JSON.stringify(business.scale)} in ${business.material},`
			+ ` beside place:4211 which is kind "${business.plainKind}" at ${JSON.stringify(business.plainScale)}.`
			+ ` mapPlaceToSpatial reads the server's own is_business — a stack rather than a portal, because a business is not a doorway`
			: `no business entity in the world; it holds ${business.ids?.length} things: ${(business.ids ?? []).join(', ')}`);

	gate('and it offers the actions a business has',
		JSON.stringify(business.offered) === JSON.stringify(['view-business', 'directions', 'reserve']),
		`focused, it offers ${(business.offered ?? []).join(', ')} — from spatialAffordances' own business row, not a place's`);

	/* --- OFFERS: what is on offer where you are standing --- */
	const offers = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const before = w.latestFrame.world.objects.length;
		w.travelTo('place:4212');
		const region = w.worldPosition.region;
		for (let i = 0; i < 400; i++) {
			if (w.latestFrame.world.objects.some((o) => o.id === 'experience:offer-501')) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
		const o = w.latestFrame.world.objects.find((x) => x.id === 'experience:offer-501');
		if (!o) return {present: false, before, after: w.latestFrame.world.objects.length, region};
		w.blurAffordance?.();
		w.focus('experience:offer-501');
		const offered = w.affordances().map((a) => a.action);
		const reserve = w.affordances().find((a) => a.action === 'reserve');
		const edge = w.latestFrame.world.relations.find((r) => r.from === o.id && r.to === 'place:4212');
		const claimed = reserve ? await w.act(reserve.id) : false;
		/* the world holds what the SERVER said after the claim */
		const after = w.latestFrame.world.objects.find((x) => x.id === 'experience:offer-501');
		return {
			present: true, before, after: w.latestFrame.world.objects.length, region,
			kind: o.kind, label: o.label, parentId: o.parentId,
			time: o.time ? {...o.time} : undefined,
			energyBefore: o.energy, energyAfter: after?.energy,
			edgeType: edge?.type, edgeStrength: edge?.strength,
			offered, claimed,
		};
	});

	gate('arriving at a place brings what is on offer there',
		offers.present && offers.region === 'place' && offers.kind === 'experience'
		&& offers.time?.endsAt !== undefined && offers.parentId === 'place:4212',
		offers.present
			? `experience:offer-501 "${offers.label}" arrived on travelling to place:4212 (region "${offers.region}"), read from /offers/places/4212.`
			+ ` It is an experience — something available that you can reserve, which is what an offer is — ending at ${offers.time?.endsAt} from the SERVER's own ends_at,`
			+ ` and its parent is ${offers.parentId}. ${offers.before} entities before, ${offers.after} after.`
			+ ' offers.php has been a complete backend all along; the client simply had no method for it, which is how offers came to be recorded as a provider blocker'
			: `no offer arrived; region was "${offers.region}" and the world went ${offers.before} → ${offers.after}`);

	gate('and it stands with its business by a structural edge',
		offers.edgeType === 'located-at' && offers.edgeStrength === 1,
		`${offers.edgeType} at strength ${offers.edgeStrength} into place:4212 — the same edge an event at a venue has, so an offer stands with its business rather than in a list of offers`);

	gate('reserving an offer is claiming it, on the server',
		offers.claimed === true && offers.energyAfter !== undefined && offers.energyAfter < offers.energyBefore,
		`focused, it offers ${(offers.offered ?? []).join(', ')}; act('reserve') returned ${offers.claimed}.`
		+ ` Energy — how much of the offer is left — went ${offers.energyBefore?.toFixed(2)} → ${offers.energyAfter?.toFixed(2)} because the SERVER's redemptions_count went up and the world was rebuilt from what it answered.`
		+ ' There is no coupon code and no payment anywhere in this: OssnBusinessOffers is a claim-and-fulfil-in-person primitive, the same honest shape as a punch card');

	/* --- CREATORS: travelling to someone brings what they have made --- */
	const creator = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const before = w.latestFrame.world.objects.length;
		const person = w.latestFrame.world.objects.find((o) => o.id === 'person:78');
		const sourceName = person?.sourceName;
		w.travelTo('person:78');
		const region = w.worldPosition.region;
		/* the region load is a real fetch; wait for the world to gain it */
		for (let i = 0; i < 400; i++) {
			if (w.latestFrame.world.objects.some((o) => o.id === 'moment:6001')) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
		const objects = w.latestFrame.world.objects;
		const work = ['moment:6001', 'collection:album-6002', 'event:6003', 'experience:6004']
			.map((id) => objects.find((o) => o.id === id))
			.filter((o) => o !== undefined);
		const edges = w.latestFrame.world.relations
			.filter((r) => r.to === 'person:78' && r.type === 'created-by')
			.map((r) => r.from);
		return {
			before, after: objects.length, region, sourceName,
			work: work.map((o) => `${o.id}(${o.kind}) "${o.label}"`),
			positions: work.map((o) => [o.transform.position.x, o.transform.position.y, o.transform.position.z]),
			edges: edges.sort(),
			asked: [...(window.__berxServed ?? [])],
		};
	});

	gate('travelling to a person brings what that person has made',
		creator.work.length === 4 && creator.region === 'person'
		&& creator.positions.every((p) => p.every((v) => Number.isFinite(v))),
		`the friends list sent username "${creator.sourceName}", which is what the creator endpoints are keyed by.`
		+ ` Travelling to person:78 put the world in region "${creator.region}" and read /creator/lev and /creator/lev/content:`
		+ ` ${creator.work.join(', ')}. ${creator.before} entities before, ${creator.after} after.`
		+ ' A post, an album, an event and an experience — four real lists, mapped to four kinds that already existed, at four finite positions');

	gate('and each piece stands with its author, by a real edge',
		['collection:album-6002', 'event:6003', 'experience:6004', 'moment:6001'].every((id) => creator.edges.includes(id)),
		`created-by edges into person:78: ${creator.edges.join(', ')} — the same edge the relational layout uses to gather things around whoever made them,`
		+ ' so a creator is a person with their work standing around them rather than a profile with a follower count');

	/* --- DATING: travelling to your own presence, and only yours --- */
	const dating = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const before = w.latestFrame.world.objects.map((o) => o.id);
		w.travelTo('person:77');
		for (let i = 0; i < 400; i++) {
			if (w.latestFrame.world.objects.some((o) => o.id === 'person:dating-91')) break;
			await new Promise((r) => requestAnimationFrame(r));
		}
		const objects = w.latestFrame.world.objects;
		const cards = objects.filter((o) => o.id.startsWith('person:dating-'));
		return {
			before: before.length,
            after: objects.length,
			cards: cards.map((o) => `${o.id} "${o.label}" energy ${o.energy.toFixed(2)}`),
			/* the public identity must NOT have been created for them */
			leaked: objects.filter((o) => o.id === 'person:91' || o.id === 'person:92').map((o) => o.id),
			positions: cards.map((o) => [o.transform.position.x, o.transform.position.y, o.transform.position.z]),
			energies: cards.map((o) => o.energy),
		};
	});

	gate('travelling to your own presence brings your own dating world',
		dating.cards.length === 2 && dating.positions.every((p) => p.every((v) => Number.isFinite(v))),
		`${dating.cards.join('; ')} — read from /dating/discover only on arriving at person:77, never at boot.`
		+ ` ${dating.before} entities before, ${dating.after} after`);

	gate('and a dating profile is never the public person',
		dating.leaked.length === 0,
		dating.leaked.length === 0
			? 'no person:91 or person:92 anywhere in the world: mapDatingProfileToSpatial builds person:dating-N precisely so the public identity and the dating one stay the two separate things the privacy model keeps them as'
			: `LEAKED public identities: ${dating.leaked.join(', ')}`);

	gate('and what a profile has said about itself is its presence, not a score',
		dating.energies.length === 2
		&& Math.abs(dating.energies[1] - 0.3) < 1e-9
		&& Math.abs(dating.energies[0] - 0.75) < 1e-9,
		`"Вечер" filled in a goal, a bio and interests and stands at energy ${dating.energies[0]?.toFixed(2)}; "Полдень" filled in none and stands at ${dating.energies[1]?.toFixed(2)}.`
		+ ' Three things said is 0.3 + 3 x 0.15; nothing said is the 0.3 floor, because a profile that has written nothing is still a person offering to be met.'
		+ ' No compatibility score is invented anywhere, because the endpoint returns none');

	gate('every endpoint these paths claim to call was really called',
		['/api/v1/creator/lev', '/api/v1/creator/lev/content', '/api/v1/dating/discover', '/api/v1/places'].every((p) => served.has(p)),
		`the server recorded ${served.size} distinct paths, including ${['/api/v1/creator/lev', '/api/v1/creator/lev/content', '/api/v1/dating/discover'].filter((p) => served.has(p)).join(', ') || 'NONE of the new ones'}`);

	gate('no page or console errors in any of that',
		pageErrors.length === 0,
		pageErrors.length === 0 ? 'clean' : pageErrors.slice(0, 4).join(' | '));

	await context.close();
} finally {
	await browser.close();
	sockets.closeAll();
	server.closeAllConnections?.();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} DOMAIN GATES FAILED`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
}
console.log('ALL WORLD-DOMAIN GATES PASS');
