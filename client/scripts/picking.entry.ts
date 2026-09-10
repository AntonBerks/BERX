/**
 * Browser entry for the pointer-picking gate.
 *
 * WHY THIS EXISTS SEPARATELY. The app-shell gate proves picking on a
 * real product boot, and it takes twenty-five minutes: a picker bug
 * found there costs a whole afternoon per hypothesis. This drives the
 * SAME host, the SAME renderer and the SAME pointer path against a
 * world of the same shape, in seconds — so the picker can be measured
 * rather than reasoned about.
 *
 * It is not a substitute for the product boot. It is the fast half of
 * the same question: does the pixel a person presses belong to the
 * thing they can see there?
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtimeHost5d';
import {Berx5DWorldApp, pickSpatialCandidates, rayFromNdc} from '@berx/spatial';
import {
	mapCollectionToSpatial, mapCommunityToSpatial, mapEventToSpatial, mapExperienceToSpatial,
	mapFeedItemToSpatial, mapMessageToSpatial, mapPlaceToSpatial, mapUserToSpatial,
	mapStoryToSpatial, mapMemoryToSpatial, mapTripToSpatial, mapNotificationToSpatial,
} from '@berx/scenes';

declare global {
	interface Window { BERX_PICKING: unknown }
}

const NOW = Math.floor(Date.now() / 1000);

/**
 * The projection, once.
 *
 * The same maths the renderer's camera uses, kept here so a probe can
 * say which pixel an entity's own position lands on. Not a second
 * opinion about where things are — it reads the camera out of the very
 * frame that was drawn.
 */
const project = (canvas: HTMLCanvasElement, c: {position: {x: number; y: number; z: number}; target: {x: number; y: number; z: number}; fov: number}) => {
	const fwd = {x: c.target.x - c.position.x, y: c.target.y - c.position.y, z: c.target.z - c.position.z};
	const fl = Math.hypot(fwd.x, fwd.y, fwd.z) || 1;
	fwd.x /= fl; fwd.y /= fl; fwd.z /= fl;
	const right = {x: fwd.y * 0 - fwd.z * 1, y: fwd.z * 0 - fwd.x * 0, z: fwd.x * 1 - fwd.y * 0};
	const rl = Math.hypot(right.x, right.y, right.z) || 1;
	right.x /= rl; right.y /= rl; right.z /= rl;
	const up = {
		x: right.y * fwd.z - right.z * fwd.y,
		y: right.z * fwd.x - right.x * fwd.z,
		z: right.x * fwd.y - right.y * fwd.x,
	};
	const aspect = canvas.width / canvas.height;
	const tanHalf = Math.tan((c.fov * Math.PI / 180) / 2);
	const rect = canvas.getBoundingClientRect();
	const dpr = canvas.width / Math.max(1, rect.width);
	return (p: {x: number; y: number; z: number}) => {
		const d = {x: p.x - c.position.x, y: p.y - c.position.y, z: p.z - c.position.z};
		const along = d.x * fwd.x + d.y * fwd.y + d.z * fwd.z;
		if (along <= 1e-4) return undefined;
		const rx = d.x * right.x + d.y * right.y + d.z * right.z;
		const ry = d.x * up.x + d.y * up.y + d.z * up.z;
		const ndcX = rx / (along * tanHalf * aspect);
		const ndcY = ry / (along * tanHalf);
		const px = (ndcX * 0.5 + 0.5) * canvas.width;
		const py = (0.5 - ndcY * 0.5) * canvas.height;
		return {
			along, px, py,
			onScreen: Math.abs(ndcX) <= 1 && Math.abs(ndcY) <= 1,
			clientX: rect.left + px / dpr,
			clientY: rect.top + py / dpr,
		};
	};
};

/** The same ten entities a real signed-in session loads, same mappers. */
const buildWorld = () => {
	/* The same words the product ships. A name that rasterises to no
	   glyphs draws no quad, and a slot that draws nothing is correctly
	   dropped from the pickable set — so a probe without labels would be
	   testing a world with no ring in it at all. */
	const world = new Berx5DWorldApp({viewerId: 'person:77',
		/**
		 * A world with no way to carry an action out offers none — an
		 * affordance with nothing behind it is a control that does
		 * nothing, and worldApp is right to withhold it. So the ring only
		 * exists here because this handler does, and it is honest: the
		 * server confirms nothing, so nothing enters the world. If a
		 * press ever reaches it, that press was meant for an entity and
		 * the gate has already caught it.
		 */
		onAction: async () => undefined,
		actionLabels: {
		open: 'Открыть',
		focus: 'Навести',
		like: 'Нравится',
		unlike: 'Убрать «нравится»',
		comment: 'Комментировать',
		reply: 'Ответить',
		share: 'Поделиться',
		save: 'Сохранить',
		unsave: 'Убрать из сохранённого',
		follow: 'Подписаться',
		unfollow: 'Отписаться',
		message: 'Написать',
		'view-profile': 'Профиль',
		'view-media': 'Смотреть',
		'view-place': 'Место',
		'view-event': 'Событие',
		'view-experience': 'Впечатление',
		'view-community': 'Сообщество',
		'view-business': 'Бизнес',
		join: 'Вступить',
		leave: 'Выйти',
		attend: 'Пойду',
		unattend: 'Не пойду',
		reserve: 'Забронировать',
		directions: 'Маршрут',
		'check-in': 'Отметиться',
		'create-moment': 'Создать момент',
		'create-story': 'Создать историю',
		'create-post': 'Написать',
		'create-event': 'Создать событие',
		'create-community': 'Создать сообщество',
		'send-message': 'Отправить',
		react: 'Реакция',
		report: 'Пожаловаться',
		block: 'Заблокировать',
		mute: 'Заглушить',
		back: 'Назад',
		more: 'Ещё',
	}});
	const entries = [
		mapUserToSpatial({guid: 77, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: NOW - 90000}),
		mapUserToSpatial({guid: 78, username: 'lev', fullname: 'Лев', email: '', icon_url: '', profile_url: '', time_created: NOW - 90000}),
		mapFeedItemToSpatial({guid: 5150, text: 'вечер удался', owner_guid: 77, owner_username: 'ann', time_created: NOW - 400}),
		mapFeedItemToSpatial({guid: 5151, text: 'до завтра', owner_guid: 78, owner_username: 'lev', time_created: NOW - 90000}),
		mapMessageToSpatial({id: 9002, from_guid: 78, to_guid: 77, text: 'до завтра', time: NOW - 500}),
		mapPlaceToSpatial({
			guid: 4211, title: 'Дом Культуры', description: '', category: 'venue', address: null, phone: null,
			website: null, hours: null, price: null, lat: null, lng: null, owner_guid: 77, cover_url: null,
			rating: 0, rating_count: 0, is_saved: false, is_business: false, business_type: null, verified: false,
		}),
		mapEventToSpatial({
			guid: 908, title: 'Вечер импровизации', description: '', category: null,
			starts: NOW - 600, ends: NOW + 3600, location: null, place: {guid: 4211, title: 'Дом Культуры'},
			capacity: null, seats_left: null, attendee_count: 3, owner_guid: 77, cover_url: null,
			has_ended: false, is_going: true,
		}),
		mapExperienceToSpatial({
			id: 12, title: 'Прогулка по крышам', description: '',
			anchor: {type: 'event', guid: 908, title: 'Вечер импровизации', image_url: null},
			visibility: 'public', owner_guid: 77, is_own: true,
			scheduled_start: NOW + 7200, scheduled_end: null, my_status: null,
		}),
		mapCommunityToSpatial({guid: 501, name: 'Соседи', description: '', owner_guid: 77, privacy: 'public', is_member: true}),
		mapCollectionToSpatial({id: 33, title: 'Любимые места', description: '', visibility: 'public', owner_guid: 77, is_own: true, item_count: 2, time_updated: NOW}),
		/* and the four domains the loader now reads, so this measures the
		   world a real session actually holds rather than a smaller one */
		mapStoryToSpatial({id: 91, caption: 'вид с крыши', time_created: NOW - 3600, mime_type: 'image/jpeg'}, 78),
		mapTripToSpatial({
			id: 7, title: 'Север', description: '', visibility: 'public', owner_guid: 77, is_own: true,
			start_date: NOW + 86400, end_date: NOW + 6 * 86400, stop_count: 1, time_updated: NOW,
		}),
		mapNotificationToSpatial({guid: 31, type: 'post:like', poster_guid: 78, subject_guid: 77, item_guid: 5150, viewed: false, time_created: NOW - 30}),
		mapMemoryToSpatial({type: 'post', guid: 5151, years_ago: 3, time: NOW - 3 * 365 * 86400, text: 'три года назад'}, 77),
	];
	world.ingest(entries.map((m) => ({object: m.object, relations: m.relations, media: m.media})));
	return world;
};

window.BERX_PICKING = {
	async run() {
		const canvas = document.createElement('canvas');
		canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block';
		document.body.appendChild(canvas);
		const world = buildWorld();
		const host = createBerx5DWebHost({canvas, world, ariaLabel: 'BERX'});
		host.start();
		const settle = async (n = 40) => {
			for (let i = 0; i < n; i++) {
				await new Promise((r) => { const t = setTimeout(r, 40); requestAnimationFrame(() => { clearTimeout(t); r(undefined); }); });
			}
		};
		await settle(60);

		const backend = host.renderer.kind;
		const results: unknown[] = [];
		/**
		 * HOW MANY OF AN ENTITY'S OWN ACTIONS YOU CAN ACTUALLY REACH.
		 *
		 * Standing with something and being able to touch four of its
		 * five actions is not a smaller version of being able to touch
		 * five: the ring is the whole interaction surface of the world,
		 * and an action the world drew something in front of is gone.
		 * Nothing measured this quickly — the only gate that saw it was
		 * a thirty-minute product boot — which is how a compact
		 * arrangement took it from five of five to one of five without
		 * anything noticing for a full cycle.
		 */
		const rings: {focusId: string; offered: number; requested: number; pickable: number}[] = [];

		/**
		 * Focus each entity in turn, then aim at every OTHER entity that
		 * the world really drew at its own pixel — and check that the
		 * press lands on it.
		 *
		 * Focusing matters: focus puts an affordance ring around the
		 * focused entity, and the ring is what used to win pixels that
		 * belonged to its neighbours. A single-focus probe cannot see
		 * that; the app-shell gate only saw it once the world happened
		 * to put two reachable entities beside one ring.
		 */
		const ids = world.latestFrame.world.objects.map((o) => o.id);
		/**
		 * The camera must be STILL before a pixel means anything.
		 *
		 * Focusing an entity travels the camera to it. A probe that
		 * projected once and then pressed several times measured the
		 * first press against the right camera and the rest against a
		 * camera that had moved on — which looks exactly like a picker
		 * bug and is not one. Every pair re-focuses, waits for the
		 * transition to actually end, and projects from the frame that
		 * is on the screen at that instant.
		 */
		const still = async () => {
			for (let i = 0; i < 240; i++) {
				/* rAF, but never only rAF: a frame loop that has stopped —
				   a lost context, a throw inside it — would hang this
				   probe on a promise nothing resolves */
				await new Promise((r) => { const t = setTimeout(r, 40); requestAnimationFrame(() => { clearTimeout(t); r(undefined); }); });
				if (!world.runtime.travelling && world.latestFrame.transition === undefined) return true;
			}
			return false;
		};

		/**
		 * EVERY entity, from EVERY focus that can see it.
		 *
		 * The camera stands somewhere different for each focused entity,
		 * so each focus is a different arrangement of the same world —
		 * different occlusion, different angles off the centre of the
		 * screen, a different ring in the way. A probe that pressed once
		 * per entity would have missed both bugs this found: the ring
		 * only reaches across a neighbour from some viewpoints, and the
		 * ray-versus-forward-depth error only shows away from the middle
		 * of the frame.
		 *
		 * Re-focused and re-settled before every single press, because a
		 * press moves the camera and a pixel measured against the old one
		 * means nothing.
		 */
		const deadline = Date.now() + 600000;
		let ranOut = false;
		for (const focusId of ids) {
			if (ranOut) break;
			world.blurAffordance?.();
			world.focus(focusId);
			if (!(await still())) continue;
			await settle(4);
			const frame = world.latestFrame;
			const at = project(canvas, frame.camera);
			host.renderer.render(frame, {});
			/* who is genuinely reachable from here: the surface the world
			   drew at their own pixel has to be their own */
			const fair = [];
			for (const object of frame.world.objects) {
				if (object.id === focusId || !object.visible || !object.interactive) continue;
				const p = at(object.transform.position);
				if (!p || !p.onScreen) continue;
				const drawn = host.renderer.depthAt?.(p.px, p.py);
				if (drawn === undefined) continue;
				/**
				 * A FAIR TARGET IS ONE THE WORLD REALLY DREW THERE.
				 *
				 * "within 1.5 units of its centre" was the test, and with
				 * entities seven units apart it meant something. Once the
				 * layout was compact enough to fill a frame — neighbours
				 * about two units apart — 1.5 could not tell one entity
				 * from the next, and the probe was aiming at entities its
				 * neighbour was standing in front of and then calling the
				 * picker wrong for saying so.
				 *
				 * The exact test is the one the picker itself uses: the
				 * drawn depth has to lie between where the ray enters
				 * this entity's own box and where it leaves.
				 */
				const aim = rayFromNdc(frame.camera, (p.px / canvas.width) * 2 - 1, 1 - (p.py / canvas.height) * 2, canvas.width / canvas.height);
				if (!aim) continue;
				const own = pickSpatialCandidates(aim, [object])[0];
				if (!own) continue;
				/* the ray's own distances converted onto the axis the
				   G-buffer measures on, the same way the picker does it */
				const cos = p.along / Math.max(1e-6, own.distance);
				if (!(drawn >= own.distance * cos - 0.12 && drawn <= own.exit * cos + 0.12)) continue;
				fair.push({id: object.id, p, drawn});
			}
			const offered = world.affordances().length;
			const pickable = host.renderer.actionSlots.length;
			rings.push({focusId, offered, requested: host.renderer.requestedSlots.length, pickable});
			console.log(`BERX picking: focus ${focusId} — ${fair.length} reachable of ${frame.world.objects.length - 1}`
				+ `; affordances ${offered}, requested ${host.renderer.requestedSlots.length}`
				+ `, pickable ${pickable}`);

			for (const target of fair) {
				if (Date.now() > deadline) { ranOut = true; console.log('BERX picking: out of time'); break; }
				/* back to this focus, and still, before every press */
				world.blurAffordance?.();
				world.focus(focusId);
				if (!(await still())) continue;
				await settle(3);
				const ring = host.renderer.actionSlots.length;
				const direct = host.renderer.pick(world.latestFrame, target.p.px, target.p.py);
				const opts = {
					pointerType: 'mouse', clientX: target.p.clientX, clientY: target.p.clientY,
					bubbles: true, isPrimary: true, pointerId: 70 + results.length % 40,
				};
				canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
				canvas.dispatchEvent(new PointerEvent('pointerup', opts));
				await settle(3);
				results.push({
					focused: focusId, aimedAt: target.id,
					px: Math.round(target.p.px), py: Math.round(target.p.py),
					along: Number(target.p.along.toFixed(2)), drawn: Number(target.drawn.toFixed(2)),
					pick: direct?.objectId, pickAt: direct ? Number(direct.distance.toFixed(2)) : undefined,
					got: world.latestFrame.world.activeObjectId,
					ringWas: ring,
				});
			}
		}
		host.stop();
		const wrong = results.filter((r) => (r as {got?: string; aimedAt: string}).got !== (r as {aimedAt: string}).aimedAt);
		return {
			backend, tried: results.length, wrong, all: results,
			sample: results.slice(0, 6),
			complete: !ranOut,
			rings,
			depthAvailable: host.renderer.depthAt !== undefined,
		};
	},
};
