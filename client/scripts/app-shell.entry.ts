/**
 * BERX. The application is the world.
 *
 * This file boots it and does nothing else. There is no router, no
 * screen, no card list, no tab bar. Sign-in is a real form because
 * text entry is one of the four things a GPU surface cannot honestly
 * provide; the moment there is a session, the form is gone and
 * everything after it is space.
 */
import {BerxApiClient} from '@berx/api/client';
import type {BerxTokenStorage} from '@berx/core';
import {
	berxKeepWorldLive,
	loadBerxConversation,
	loadBerxWorld,
	mapEventToSpatial,
	mapFeedItemToSpatial,
	mapPlaceToSpatial,
} from '@berx/scenes';
import {startBerxApp} from '@berx/spatial-web/appShell';

/**
 * The session token, kept where the browser keeps things for one
 * origin. Not a cookie: the API authenticates with a bearer header,
 * and inventing a cookie flow it does not implement would be a fiction.
 */
const storage: BerxTokenStorage = {
	async getToken() {
		try {
			return localStorage.getItem('berx.token');
		} catch {
			/* private mode, or storage blocked — a real condition, and
			   signing in again is the honest consequence */
			return null;
		}
	},
	async setToken(token) {
		try {
			if (token === null) localStorage.removeItem('berx.token');
			else localStorage.setItem('berx.token', token);
		} catch {
			/* nothing to do: the session lives for this page only */
		}
	},
};

/* The BERX host, not the API root: BerxApiClient appends /api/v1
   itself. Passing the API root produced /api/v1/api/v1/auth/login. */
const apiHost = document.documentElement.dataset.berxHost || location.origin;
const api = new BerxApiClient(apiHost, storage);

const gate = document.getElementById('berx-entry') as HTMLFormElement | null;
const gateError = document.getElementById('berx-entry-error');
const identifier = document.getElementById('berx-identifier') as HTMLInputElement | null;
const password = document.getElementById('berx-password') as HTMLInputElement | null;
const submit = document.getElementById('berx-enter') as HTMLButtonElement | null;

/**
 * WHERE THE PERSON IS, WHEN THEY HAVE SAID IT MAY BE KNOWN.
 *
 * Only ever a fix the browser really gave. There is no default city, no
 * IP guess and no last-known value read off disk — "рядом" with a
 * location BERX invented is the worst possible answer, because it is
 * confidently wrong about the one thing the question is made of.
 *
 * The watch starts the first time anything asks, which is the first
 * time someone talks to BERX: a permission prompt at boot, for a
 * capability nobody has reached for yet, is a prompt people refuse.
 * Until a fix arrives this answers undefined, and the intent engine
 * says "я не знаю, где ты" rather than searching somewhere else.
 */
let fix: {lat: number; lng: number; atMs: number} | undefined;
let watching = false;
const whereAmI = () => {
	if (!watching && typeof navigator !== 'undefined' && navigator.geolocation) {
		watching = true;
		navigator.geolocation.watchPosition(
			(position) => {
				fix = {lat: position.coords.latitude, lng: position.coords.longitude, atMs: position.timestamp};
			},
			() => {
				/* refused, or no signal. Both are real answers, and both
				   mean BERX does not know where this person is. */
				fix = undefined;
			},
			{enableHighAccuracy: false, maximumAge: 60000, timeout: 15000},
		);
	}
	return fix;
};

async function enterWorld(): Promise<void> {
	gate?.remove();
	await startBerxApp({
		load: () => loadBerxWorld(api, {feedLimit: 30}),
		/**
		 * The world stays live.
		 *
		 * One socket, subscribed to the channels this world implies,
		 * and every event resolved back through the same API endpoints
		 * a cold load uses — so a live world and a reloaded one are the
		 * same world. Nothing here invents an entity from a payload.
		 *
		 * It reconnects on its own, because a phone that changed
		 * networks has not stopped being in the world.
		 */
		live: (world) => berxKeepWorldLive(world, api, {realtime: {autoReconnect: true}}),
		/**
		 * And BERX can be talked to.
		 *
		 * The plan names a capability by this client's own method name
		 * and this calls that method — nothing about a sentence is
		 * interpreted here, and a capability the server does not have
		 * fails rather than being invented.
		 */
		voice: {
			client: api as unknown as Record<string, unknown>,
			location: whereAmI,
			permissions: () => ({
				/* the microphone is asked for by opening it, and the
				   browser answers then — claiming it in advance would be
				   a permission BERX granted itself */
				microphone: typeof navigator !== 'undefined' && navigator.mediaDevices !== undefined,
				location: whereAmI() !== undefined,
				notifications: typeof Notification !== 'undefined' && Notification.permission === 'granted',
				presence: false,
			}),
		},
		/**
		 * Arriving at a conversation reads it.
		 *
		 * The first load brings the conversations a person has, not every
		 * message in all of them — that would be reading the whole
		 * account to show one world. Travelling into one is what fetches
		 * its messages, and they land in the same world: the person you
		 * are talking to is the entity that was already there.
		 */
		loadRegion: async (position, focused) => {
			/* A conversation is read when the viewer is *with a
			   conversation*, not merely standing in one: focusing a moment
			   without leaving the region would otherwise ask the server
			   for a conversation with a post's guid. */
			if (position.region !== 'conversation' || focused?.kind !== 'message') return undefined;
			const guid = Number(focused.sourceId);
			/* a message inside a thread has an id, not a person's guid */
			if (!Number.isFinite(guid) || focused.id.startsWith('message:m')) return undefined;
			return loadBerxConversation(api, guid);
		},
		/**
		 * Publishing creates a real post and reads it back.
		 *
		 * `createPost` answers with a guid and nothing else, so the entity
		 * that enters the world is built from what the server then
		 * returns for that guid — not from the text that was typed, which
		 * would be showing someone their own draft and calling it
		 * published.
		 */
		publish: async (text) => {
			const {guid} = await api.createPost(text);
			const post = await api.getPost(guid);
			const mapped = mapFeedItemToSpatial({
				guid: post.guid,
				text: post.text,
				owner_guid: post.owner_guid,
				owner_username: post.owner_username,
				time_created: post.time_created,
			});
			return {object: mapped.object, relations: mapped.relations, media: mapped.media};
		},
		/**
		 * Where this person was standing, kept for this browser only.
		 *
		 * The world's entities are never stored: they come from the
		 * server every time, and a feed restored from disk would be a
		 * world made of yesterday. What is kept is the place — camera
		 * pose, region, focus, time, and the way back.
		 */
		restore: () => {
			try {
				const raw = localStorage.getItem('berx.place');
				return raw ? JSON.parse(raw) : undefined;
			} catch {
				return undefined;
			}
		},
		remember: (state) => {
			try {
				localStorage.setItem('berx.place', JSON.stringify(state));
			} catch {
				/* storage blocked: the session simply starts fresh next time */
			}
		},
		/**
		 * Actions, carried out on the server and read back.
		 *
		 * Only the ones BERX actually has an endpoint for. An affordance
		 * with nothing behind it is a control that does nothing, so
		 * anything not listed here throws rather than quietly succeeding
		 * — and the world is updated from what the server returns, never
		 * from what was asked for.
		 */
		act: async (action, object) => {
			const guid = Number(object.sourceId);
			if (!Number.isFinite(guid)) throw new Error('BERX: этот объект не с сервера');
			switch (action) {
				case 'like': {
					await api.likePost(guid);
					const post = await api.getPost(guid);
					const mapped = mapFeedItemToSpatial({
						guid: post.guid, text: post.text, owner_guid: post.owner_guid,
						owner_username: post.owner_username, time_created: post.time_created,
					});
					return {object: mapped.object, relations: mapped.relations, media: mapped.media};
				}
				case 'attend': {
					await api.rsvpEvent(guid);
					const events = await api.events();
					const found = events.events.find((e) => e.guid === guid);
					if (!found) return undefined;
					const mapped = mapEventToSpatial(found);
					return {object: mapped.object, relations: mapped.relations, media: mapped.media};
				}
				case 'save': {
					/**
					 * SAVE IS A PLACE ENDPOINT, AND ONLY A PLACE HAS ONE.
					 *
					 * The domain offers "save" on a moment and on a
					 * collection too (spatialAffordances.ts), and this
					 * sent all three to savePlace — so saving a moment
					 * posted to /places/5150/save and the server
					 * answered 404 for a resource of a different kind
					 * entirely. It was invisible because a 404 is how
					 * this shell reports "not on the server", except
					 * that this one was not the server missing a
					 * capability: it was BERX asking the wrong question.
					 *
					 * Anything the server has no save for now goes down
					 * the same path as «follow» — named, refused, and
					 * the world left exactly as it was.
					 */
					if (object.kind !== 'place' && object.kind !== 'business') {
						throw new Error(`BERX: «${action}» пока нет на сервере для «${object.kind}»`);
					}
					await api.savePlace(guid);
					const places = await api.places();
					const found = places.places.find((p) => p.guid === guid);
					if (!found) return undefined;
					const mapped = mapPlaceToSpatial(found);
					return {object: mapped.object, relations: mapped.relations, media: mapped.media};
				}
				case 'join':
					await api.joinCommunity(guid);
					return undefined;
				default:
					throw new Error(`BERX: «${action}» пока нет на сервере`);
			}
		},
		/* Every action BERX has, named. The type requires all of them,
		   because a missing one used to be drawn in the world as its own
		   identifier — «view-event», in English, beside «Пойду». */
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
		},
		textureBudget: 96,
	});
}

async function boot(): Promise<void> {
	const token = await storage.getToken();
	if (token) {
		await enterWorld();
		return;
	}
	if (!gate || !identifier || !password || !submit) return;
	gate.hidden = false;
	gate.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (submit.disabled) return;
		submit.disabled = true;
		if (gateError) gateError.textContent = '';
		try {
			const session = await api.login(identifier.value.trim(), password.value);
			await storage.setToken(session.token);
			await enterWorld();
		} catch (error) {
			/* the server's own reason, never a generic one */
			if (gateError) gateError.textContent = error instanceof Error ? error.message : 'Не удалось войти';
			submit.disabled = false;
		}
	});
}

void boot();
