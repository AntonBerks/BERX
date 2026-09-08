/**
 * Berx5DWorldApp — BERX itself, with no platform in it.
 *
 * This is the application. Not a controller for one, not a layer over
 * one: the world graph, where every entity stands, what time the
 * viewer is standing in, what they are looking at and how they got
 * there. Web, iOS, Android, desktop, tablet, watch and XR all run this
 * object and differ only in the renderer that draws its frames and the
 * device that reports intents into it.
 *
 * There are no screens. Entering a region does not replace anything:
 * the camera travels, the world stays, and the entity you were looking
 * at is still the same entity with the same id when you arrive.
 * `back()` restores a real previous world state — camera pose,
 * temporal cursor, focus and region together — rather than
 * reconstructing a page.
 *
 * All five dimensions are runtime state here, not description:
 *
 *   X, Y, Z  positions, from the relational layout, in world units
 *   T        a cursor the viewer moves through, which moves entities
 *   R        the relations that decide where every entity is placed
 */
import {Berx5DRuntime, type Berx5DFrame} from './runtime5d';
import type {BerxSpatialCameraState} from './spatialCamera';
import {berxApplyTemporal, berxTemporalCursor, type BerxTemporalCursor} from './temporal';
import {berxRelationalWeight} from './relational';
import {berxComposeLayout, berxCompositionFor} from './composition';
import {berxFraming, berxFrameTheWorld, type BerxFraming} from './berxFraming';
import {berxClampToWorld, berxNear, berxWorldBounds} from './proximity';

/**
 * How far outside the world someone may stand.
 *
 * Generous on purpose: far enough to step back and see all of it at
 * once, not far enough to leave it behind and be looking at nothing.
 * Named here because the edge is checked in `frame()` and reported by
 * `worldEdge`, and those two must never be able to disagree.
 */
const BERX_WORLD_MARGIN = 12;
import {affordancesForObject} from './spatialAffordances';
import type {BerxSocialAction, BerxSpatialAffordance} from './socialActions';
import {berxTransitionForTravel, BERX_FAR_TRAVEL_METRES} from './transitions';
import {berxActionRingRadius} from './actionRing';
import type {BerxNavigationIntent} from './platform';
import {berxCameraFromPose, berxStereoCamerasFromPose, type BerxXrPose, type BerxXrViews} from './xrPose';
import type {BerxSpatialObject, BerxSpatialRelation, BerxVec3} from './world';

/**
 * A named part of the world the camera can be in.
 *
 * Regions are contexts, not pages: leaving one does not unload it, and
 * the entities in it are the same entities that appear in every other
 * region they belong to.
 */
export type BerxWorldRegion =
	| 'world'
	| 'now'
	| 'discover'
	| 'person'
	| 'place'
	| 'event'
	| 'experience'
	| 'community'
	| 'collection'
	| 'conversation'
	| 'create'
	| 'signals'
	| 'self';

/** Bumped whenever the shape below changes, so an old one is ignored. */
export const BERX_PERSISTENCE_VERSION = 1;

/**
 * Where someone was. Restored around entities that are re-read from
 * the server, never instead of them.
 */
export interface BerxWorldPersistence {
	version: number;
	viewerId?: string;
	position: BerxWorldPosition;
	camera: BerxSpatialCameraState;
	history: BerxWorldPosition[];
}

export interface BerxWorldPosition {
	region: BerxWorldRegion;
	/** The entity the camera is with. Undefined in a region-wide view. */
	focusId?: string;
	/** Where in time the viewer stands. */
	cursor: BerxTemporalCursor;
}

export interface Berx5DWorldAppOptions {
	reducedMotion?: boolean;
	deviceMotionEnabled?: boolean;
	transitionDuration?: number;
	/** The signed-in person. The world is arranged around them. */
	viewerId?: string;
	cursor?: BerxTemporalCursor;
	/** Told whenever the viewer's position in the world changes. */
	onPositionChange?: (position: BerxWorldPosition) => void;
	/**
	 * Carries out an action on an entity.
	 *
	 * Must call the real API and resolve only once the server has
	 * confirmed. Returning an entity replaces the one in the world with
	 * the server's own updated row; returning nothing means the action
	 * changed nothing the world shows.
	 */
	onAction?: (action: BerxSocialAction, object: BerxSpatialObject) => Promise<BerxWorldIngest | undefined>;
	/** What each action is called, in the viewer's language. */
	/**
	 * What each action is called, in the viewer's language.
	 *
	 * Every action, not some of them: a missing entry used to fall back
	 * to the action's own identifier, and `view-event` was drawn in the
	 * world, in English, next to «Пойду» and «Поделиться». A complete
	 * record makes that a build error instead of something only a
	 * screenshot catches.
	 */
	actionLabels?: Record<BerxSocialAction, string>;
}

export interface BerxWorldIngest {
	object: BerxSpatialObject;
	relations?: readonly BerxSpatialRelation[];
	media?: readonly {uri: string}[];
}

export class Berx5DWorldApp {
	readonly runtime: Berx5DRuntime;
	private readonly options: Berx5DWorldAppOptions;
	private readonly relations = new Map<string, BerxSpatialRelation>();
	private readonly mediaByObject = new Map<string, readonly {uri: string}[]>();
	/** Positions the relational layout decided; recomputed when R changes. */
	private layout = new Map<string, {x: number; y: number; z: number}>();
	private position: BerxWorldPosition;
	private viewerId?: string;
	private layoutDirty = false;
	/**
	 * How far the camera stood from the world's centre last frame.
	 *
	 * Kept so the edge can tell flying away from the world apart from
	 * the world shrinking underneath someone standing still — see
	 * `frame()`. Undefined until the first frame, and reset by
	 * `restore()`, because a restored pose is a baseline rather than a
	 * movement.
	 */
	private lastDistanceFromWorld?: number;

	constructor(options: Berx5DWorldAppOptions = {}) {
		this.options = options;
		this.viewerId = options.viewerId;
		this.runtime = new Berx5DRuntime({
			reducedMotion: options.reducedMotion,
			deviceMotionEnabled: options.deviceMotionEnabled,
			transitionDuration: options.transitionDuration,
		});
		this.position = {region: 'world', cursor: options.cursor ?? berxTemporalCursor()};
	}

	/* ---------------- the world ---------------- */

	/**
	 * Put real entities into the world.
	 *
	 * Idempotent by spatial identity: ingesting the same place from NOW
	 * and from a search updates one object rather than creating a
	 * second. That is the whole reason identity is derived from the
	 * server's guid.
	 */
	ingest(entries: readonly BerxWorldIngest[]): void {
		for (const entry of entries) {
			this.runtime.registerObject(entry.object);
			if (entry.media && entry.media.length > 0) this.mediaByObject.set(entry.object.id, entry.media);
			for (const relation of entry.relations ?? []) this.relations.set(relation.id, relation);
		}
		this.layoutDirty = true;
	}

	/** Media the server sent for an object, for a renderer to upload. */
	mediaFor(objectId: string): readonly {uri: string}[] {
		return this.mediaByObject.get(objectId) ?? [];
	}

	remove(objectId: string): void {
		this.runtime.removeObject(objectId);
		this.mediaByObject.delete(objectId);
		for (const [id, relation] of this.relations) {
			if (relation.from === objectId || relation.to === objectId) this.relations.delete(id);
		}
		this.layoutDirty = true;
	}

	/** The viewer. Everything is arranged around them, so it re-lays out. */
	setViewer(objectId: string | undefined): void {
		if (this.viewerId === objectId) return;
		this.viewerId = objectId;
		this.layoutDirty = true;
	}

	get viewer(): string | undefined {
		return this.viewerId;
	}

	get allRelations(): BerxSpatialRelation[] {
		return [...this.relations.values()];
	}

	/**
	 * Recompute where everything stands from the relations between them.
	 *
	 * Deterministic: same graph, same coordinates, every time. Relations
	 * whose ends are not both in the world are dropped rather than
	 * placing entities against things that are not there.
	 */
	private relayout(): void {
		const snapshot = this.runtime.world.snapshot();
		const present = new Set(snapshot.objects.map((o) => o.id));
		const usable = [...this.relations.values()].filter((r) => present.has(r.from) && present.has(r.to));
		/**
		 * The arrangement this region calls for.
		 *
		 * `relational` — position from the relations themselves — is the
		 * default and is what most of the world uses. Some regions have a
		 * shape that is part of what they mean: a first choice is a ring
		 * you stand in the middle of, a life is a core with orbits, a
		 * conversation is a line between two people. Those are
		 * arrangements of THE SAME WORLD, decided here, so they reach
		 * every renderer through the same draw list.
		 */
		const composition = berxCompositionFor(this.position.region);
		this.layout = berxComposeLayout(composition, snapshot.objects, usable, {rootId: this.viewerId});
		for (const object of snapshot.objects) {
			const at = this.layout.get(object.id);
			if (!at) continue;
			/* importance is a fact about the graph: strongly connected
			   entities are larger, and stay detailed for longer */
			const weight = berxRelationalWeight(object.id, usable);
			const scale = 1 + weight * 0.45;
			this.runtime.registerObject({
				...object,
				transform: {
					...object.transform,
					position: {...at},
					scale: {
						x: object.transform.scale.x * scale,
						y: object.transform.scale.y * scale,
						z: object.transform.scale.z * scale,
					},
				},
			});
			for (const relation of usable) this.runtime.world.addRelation(relation);
		}
		this.layoutDirty = false;
	}

	/* ---------------- time ---------------- */

	get cursor(): BerxTemporalCursor {
		return {...this.position.cursor};
	}

	/** Move the viewer through time. Entities move; nothing is filtered out. */
	setCursor(cursor: BerxTemporalCursor): void {
		this.position = {...this.position, cursor: {...cursor}};
		this.options.onPositionChange?.(this.worldPosition);
	}

	/** Scrub by a real number of seconds, in either direction. */
	scrubTime(seconds: number): void {
		this.setCursor({...this.position.cursor, at: this.position.cursor.at + seconds});
	}

	/* ---------------- navigation, as travel ---------------- */

	get worldPosition(): BerxWorldPosition {
		return {...this.position, cursor: {...this.position.cursor}};
	}

	get canGoBack(): boolean {
		return this.runtime.canGoBack;
	}

	/**
	 * Travel to an entity. The camera moves; nothing is replaced.
	 *
	 * The region is what the entity *is*, so arriving at a person is
	 * being with that person rather than opening a profile. Returns
	 * false when the entity is not in the world — which is a real
	 * answer, not a reason to invent it.
	 */
	/**
	 * Frame what is in the world, so a composed set is a composition.
	 *
	 * BERX's camera stood 8 metres back from the origin no matter what
	 * was in front of it, which is not a camera choosing a shot — it is
	 * a fixed vantage that frames whatever happens to be at the origin
	 * and lets the rest fall where it falls. Measured on a real world
	 * composed from a real search: 6.5% of a desktop frame, with two of
	 * five entities off it entirely.
	 *
	 * The pose comes from berxFrameTheWorld, which fits the whole world
	 * — everything WHOLLY inside the frame, not merely overlapping it —
	 * and it arrives through the same camera transition every travel
	 * uses, because a second way of moving the camera is a second
	 * camera. Returns false when there is nothing to frame.
	 *
	 * It is called, never automatic: a camera that re-framed itself
	 * while someone was moving through the world would be taking the
	 * world away from them.
	 */
	frameWorld(width: number, height: number): boolean {
		const frame = this.latestFrame;
		if (frame.world.objects.filter((o) => o.visible).length === 0) return false;
		const fitted = berxFrameTheWorld(frame, width, height);
		this.runtime.moveCamera(fitted.position, fitted.target, berxTransitionForTravel('travel'));
		return true;
	}

	/** How the world is framed right now, for a caller that wants to check. */
	framing(width: number, height: number): BerxFraming {
		return berxFraming(this.latestFrame, width, height);
	}

	travelTo(objectId: string, region?: BerxWorldRegion): boolean {
		const object = this.runtime.world.getObject(objectId);
		if (!object) return false;
		const target = region ?? regionForKind(object.kind);
		/**
		 * Which of the eight this travel is — decided from the travel
		 * itself, in one place, so the same journey feels the same
		 * whether it was started from a keyboard, a pointer, the action
		 * ring or a realtime event.
		 *
		 * Somewhere already visited is a `return` (an acknowledged cut,
		 * no ceremony for a room you know); a different kind of place is
		 * a `region`; far enough that the world between is worth showing
		 * collapse is `travel-far`; anything else is an ordinary travel.
		 */
		const from = this.runtime.camera.getState().position;
		const to = object.transform.position;
		const metres = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
		const visited = this.history.some((at) => at.focusId === objectId);
		const reason = visited
			? 'return'
			: target !== this.position.region
				? 'region'
				: metres > BERX_FAR_TRAVEL_METRES
					? 'travel-far'
					: 'travel';
		const kind = berxTransitionForTravel(reason);
		/* remember where the viewer was standing, so back() restores the
		   region, the focus and the temporal cursor together with the
		   camera rather than only the pose */
		this.history.push(this.worldPosition);
		this.runtime.enterWorld({id: `${target}:${objectId}`, focusObjectId: objectId, enteredAt: Date.now()}, object.transform.position, kind);
		this.runtime.focus(objectId, berxActionRingRadius(object, this.affordancesFor(object)), kind);
		this.position = {...this.position, region: target, focusId: objectId};
		this.options.onPositionChange?.(this.worldPosition);
		return true;
	}

	/**
	 * What is live right now, brightest first.
	 *
	 * Energy is only ever raised by a real server signal — a moment
	 * still running, an event that has not ended — and the temporal
	 * projection zeroes it for anything outside the cursor's horizon.
	 * So this is a reading of the world, not a query against a feed:
	 * scrub the cursor into last week and NOW is empty, because nothing
	 * is happening then.
	 */
	live(): BerxSpatialObject[] {
		return this.latestFrame.world.objects
			.filter((object) => object.visible && object.energy > 0.01)
			.sort((a, b) => b.energy - a.energy);
	}

	/**
	 * Go to what is happening.
	 *
	 * Returns false when nothing is, which is a real answer about the
	 * world and not an empty list to render. NOW is a place; when it is
	 * quiet, it is quiet.
	 */
	travelToLive(): boolean {
		const [brightest] = this.live();
		if (!brightest) {
			this.enterRegion('now');
			return false;
		}
		return this.travelTo(brightest.id, 'now');
	}

	/** Travel to a region without a particular entity in it. */
	enterRegion(region: BerxWorldRegion): void {
		this.history.push(this.worldPosition);
		/* a different kind of place entirely: the world thins and reforms */
		this.runtime.enterWorld({id: region, enteredAt: Date.now()}, undefined, berxTransitionForTravel('region'));
		this.position = {...this.position, region, focusId: undefined};
		this.options.onPositionChange?.(this.worldPosition);
	}

	/**
	 * Return to where the viewer was — camera pose, focus, region and
	 * temporal cursor together. Not a screen being rebuilt: the world
	 * never went anywhere, so this is genuinely arriving back.
	 */
	back(): boolean {
		const previous = this.history.pop();
		/* going back draws the world in rather than pushing through it */
		if (!this.runtime.back(berxTransitionForTravel('back'))) return false;
		if (previous) {
			this.position = previous;
			this.options.onPositionChange?.(this.worldPosition);
		}
		return true;
	}

	private readonly history: BerxWorldPosition[] = [];

	/**
	 * The viewer's head, from an XR runtime.
	 *
	 * `dispatch({kind: 'pose'})` is the phone-tilt path: a small,
	 * damped parallax on top of a camera the viewer is still driving.
	 * This is the other thing entirely — ARKit, ARCore and OpenXR
	 * report where the head actually is, and in a headset the camera is
	 * the head. There is no damping and no blending, because a world
	 * that lags a head is a world that makes people ill.
	 *
	 * Returns false when the runtime does not trust its own tracking,
	 * and holds the camera it had rather than following a pose nobody
	 * believes. A platform with no tracking never calls this.
	 */
	setHeadPose(pose: BerxXrPose): boolean {
		const next = berxCameraFromPose(pose, this.runtime.camera.getState());
		if (!next) return false;
		/* the runtime's own optics, not a zoom the viewer chose */
		this.runtime.camera.setState(next, {optics: true});
		return true;
	}

	/**
	 * Both eyes, from a headset that reports both.
	 *
	 * The left eye is the camera; the right is returned for the
	 * renderer's second viewport. Both come from the runtime's own
	 * poses, so the interpupillary distance and the per-eye optics are
	 * the headset's rather than a constant BERX picked.
	 */
	setHeadViews(views: BerxXrViews): {left: BerxSpatialCameraState; right?: BerxSpatialCameraState} | undefined {
		const cameras = berxStereoCamerasFromPose(views, this.runtime.camera.getState());
		if (!cameras) return undefined;
		this.runtime.camera.setState(cameras.left, {optics: true});
		return cameras;
	}

	/* ---------------- intents, from any device ---------------- */

	/**
	 * One handler for every platform's input. A drag, a thumbstick, a
	 * head turn and an arrow key arrive here as the same thing.
	 */
	dispatch(intent: BerxNavigationIntent): void {
		switch (intent.kind) {
			case 'pan':
				this.runtime.input({panX: intent.x ?? 0, panY: intent.y ?? 0, depthDelta: 0, pinch: 0});
				return;
			case 'depth':
				this.runtime.input({panX: 0, panY: 0, depthDelta: intent.amount ?? 0, pinch: 0});
				return;
			case 'zoom':
				this.runtime.input({panX: 0, panY: 0, depthDelta: 0, pinch: intent.amount ?? 0});
				return;
			case 'pose':
				this.runtime.input({
					panX: 0,
					panY: 0,
					depthDelta: 0,
					pinch: 0,
					motion: {pitch: intent.x ?? 0, roll: intent.y ?? 0, yaw: intent.z ?? 0, intensity: intent.intensity ?? 0.65},
				});
				return;
			case 'time':
				this.scrubTime(intent.amount ?? 0);
				return;
			case 'back':
				this.back();
				return;
			case 'enter': {
				const active = this.runtime.world.getActiveObject();
				if (active) this.travelTo(active.id);
				return;
			}
			default:
				return;
		}
	}

	/**
	 * Focus an entity without travelling to it — the difference between
	 * looking at something and going to it.
	 */
	focus(objectId: string): boolean {
		/* stand far enough back to see the actions too: they belong to
		   the entity and stand outside it, and framing only the entity
		   crops them off the bottom of the screen */
		const object = this.runtime.world.getObject(objectId);
		/* focusing is not travelling: the gentlest of the eight */
		const ok = this.runtime.focus(objectId, berxActionRingRadius(object, this.affordancesFor(object)), berxTransitionForTravel('focus'));
		if (ok) {
			this.position = {...this.position, focusId: objectId};
			this.options.onPositionChange?.(this.worldPosition);
		}
		return ok;
	}

	/**
	 * Look at nothing in particular.
	 *
	 * A real state, not an absence of one: standing in a region with
	 * nothing selected is how a world normally is, and it is when no
	 * action ring is drawn.
	 */
	blur(): void {
		this.runtime.world.setActiveObject(undefined);
		this.position = {...this.position, focusId: undefined};
		this.options.onPositionChange?.(this.worldPosition);
	}

	setAccessibility(options: {reducedMotion?: boolean}): void {
		this.runtime.setAccessibility(options);
	}

	/* ---------------- being near things ---------------- */

	/**
	 * What is within reach of the entity in focus.
	 *
	 * Real distance in the world, so it changes as the relations change
	 * — the people around a place are the people the graph put there.
	 */
	nearFocus(radius = 6): BerxSpatialObject[] {
		const object = this.runtime.world.getActiveObject();
		if (!object) return [];
		return berxNear(object.transform.position, this.latestFrame.world.objects, radius, {exclude: object.id});
	}

	/** How big the world is, from what is actually in it. */
	get bounds() {
		return berxWorldBounds(this.latestFrame.world.objects);
	}

	/* ---------------- doing things ---------------- */

	/**
	 * What can be done with the entity in focus.
	 *
	 * Only what the domain says that kind affords, and only what this
	 * build can actually carry out — an affordance with nothing behind
	 * it is a button that does nothing, which is worse than an absence.
	 */
	affordances(): BerxSpatialAffordance[] {
		const object = this.runtime.world.getActiveObject();
		if (!object || !this.options.onAction) return [];
		return this.affordancesFor(object);
	}

	/** What an entity affords, whether or not it is the focused one. */
	private affordancesFor(object: BerxSpatialObject | undefined): BerxSpatialAffordance[] {
		if (!object) return [];
		return affordancesForObject(object, this.options.actionLabels).affordances.filter((a) => a.state !== 'disabled');
	}

	/**
	 * Do it, and let the server decide what happened.
	 *
	 * The world is updated from what comes back, never from what was
	 * asked for: a like that the server refused must not leave a liked
	 * object sitting in the world. A rejection is returned to the
	 * caller rather than swallowed.
	 */
	async act(affordanceId: string): Promise<boolean> {
		const object = this.runtime.world.getActiveObject();
		if (!object || !this.options.onAction) return false;
		const affordance = this.affordances().find((a) => a.id === affordanceId);
		if (!affordance) return false;
		/* `open` is travel, and travel is not a server action */
		if (affordance.action === 'open') return this.travelTo(object.id);
		const updated = await this.options.onAction(affordance.action, object);
		if (updated) this.ingest([updated]);
		return true;
	}

	/**
	 * Where the world ends.
	 *
	 * Real state, not a debug hook: a host that wants to tell someone
	 * they are at the edge — or a gate that wants to check the edge is
	 * still there — needs the same numbers `frame()` clamps against,
	 * rather than a second copy of the arithmetic that could drift from
	 * it.
	 */
	get worldEdge(): {centre: BerxVec3; radius: number; limit: number} {
		const bounds = berxWorldBounds(this.runtime.latestFrame.world.objects);
		return {centre: {...bounds.centre}, radius: bounds.radius, limit: bounds.radius + BERX_WORLD_MARGIN};
	}

	/* ---------------- persistence ---------------- */

	/**
	 * Everything about where the viewer is, so they can come back to it.
	 *
	 * Not "the last route": the camera's exact pose, the region, what
	 * was in focus, where in time they were standing, who the world is
	 * arranged around, and the history behind them. Restoring this puts
	 * someone back where they were, not on a page that looks similar.
	 *
	 * The world's entities are deliberately not in here. They come from
	 * the server, and a stale copy of somebody's feed restored from disk
	 * is exactly the fake data this whole runtime refuses — so the
	 * entities are re-read and the *place* is restored around them.
	 */
	persist(): BerxWorldPersistence {
		return {
			version: BERX_PERSISTENCE_VERSION,
			viewerId: this.viewerId,
			position: this.worldPosition,
			camera: this.runtime.camera.getState(),
			history: this.history.map((p) => ({...p, cursor: {...p.cursor}})),
		};
	}

	/**
	 * Stand where you were standing.
	 *
	 * A focus that is no longer in the world is dropped rather than
	 * pointed at nothing — people delete things, and a restored session
	 * has to survive that. An unknown version is ignored entirely: a
	 * half-understood pose is worse than starting at the origin.
	 */
	restore(state: BerxWorldPersistence | null | undefined): boolean {
		if (!state || state.version !== BERX_PERSISTENCE_VERSION) return false;
		this.viewerId = state.viewerId;
		this.layoutDirty = true;
		this.history.length = 0;
		this.history.push(...state.history.map((p) => ({...p, cursor: {...p.cursor}})));
		const focusExists = state.position.focusId ? Boolean(this.runtime.world.getObject(state.position.focusId)) : false;
		this.position = {
			region: state.position.region,
			focusId: focusExists ? state.position.focusId : undefined,
			cursor: {...state.position.cursor},
		};
		this.runtime.camera.setState(state.camera);
		/* Wherever this pose is, it is now where the viewer stands, and
		   the edge measures movement from here rather than treating the
		   restore itself as a flight outwards. */
		this.lastDistanceFromWorld = undefined;
		if (this.position.focusId) this.runtime.world.setActiveObject(this.position.focusId);
		this.options.onPositionChange?.(this.worldPosition);
		return true;
	}

	/* ---------------- the frame ---------------- */

	/**
	 * The world as it stands, this instant, with all five dimensions
	 * applied: relational positions, then the temporal projection that
	 * pushes the past away and brings what is live forward.
	 */
	frame(deltaSeconds: number): Berx5DFrame {
		if (this.layoutDirty) this.relayout();
		const base = this.runtime.frame(deltaSeconds);
		/**
		 * The world has an edge.
		 *
		 * A camera that can be flown arbitrarily far away leaves someone
		 * looking at nothing with no way to tell which direction anything
		 * is in — not freedom, just lost. The bound is generous enough to
		 * stand well outside the world and see all of it, and it is
		 * derived from what the world contains rather than being a number
		 * chosen once.
		 */
		const bounds = berxWorldBounds(base.world.objects);
		/* Not while travelling. A journey to an entity at the world's
		   edge is a legitimate destination, and clamping every frame of
		   it fights the transition — the camera never arrives, and a
		   restored pose is pulled off by however far the fight got. The
		   edge constrains free flight, which is the only way to leave. */
		const centre = bounds.centre;
		const dx = base.camera.position.x - centre.x;
		const dy = base.camera.position.y - centre.y;
		const dz = base.camera.position.z - centre.z;
		const distanceFromWorld = Math.sqrt(dx * dx + dy * dy + dz * dz);
		/**
		 * The edge stops someone FLYING away. It does not drag someone
		 * who is standing still.
		 *
		 * The bound is derived from what the world contains, so it moves
		 * when the world does — and the world legitimately shrinks: a
		 * reload re-reads ten entities where fourteen stood a moment ago,
		 * because a conversation that had been opened is not refetched
		 * until it is opened again. Clamping on that pulled a restored
		 * viewer several metres out of the spot they had left, which is
		 * the one thing coming back is supposed to guarantee. So the
		 * clamp applies only to a frame in which the camera actually
		 * moved further out; standing outside a world that receded is
		 * allowed, and the limit catches up as the world fills back in.
		 */
		const movedOutwards =
			this.lastDistanceFromWorld !== undefined && distanceFromWorld > this.lastDistanceFromWorld + 1e-6;
		if (bounds.radius > 0 && !this.runtime.travelling && movedOutwards) {
			const clamped = berxClampToWorld(base.camera.position, bounds, BERX_WORLD_MARGIN);
			if (clamped !== base.camera.position) {
				this.runtime.camera.setState({...base.camera, position: clamped});
			}
		}
		{
			const p = this.runtime.camera.getState().position;
			this.lastDistanceFromWorld = Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z);
		}
		const cursor = this.position.cursor;
		return {
			...base,
			camera: this.runtime.camera.getState(),
			world: {
				...base.world,
				objects: base.world.objects.map((object) => berxApplyTemporal(object, cursor)),
			},
		};
	}

	get latestFrame(): Berx5DFrame {
		if (this.layoutDirty) this.relayout();
		const base = this.runtime.latestFrame;
		const cursor = this.position.cursor;
		return {
			...base,
			world: {...base.world, objects: base.world.objects.map((o) => berxApplyTemporal(o, cursor))},
		};
	}
}

/** What kind of place in the world an entity *is*. */
export function regionForKind(kind: BerxSpatialObject['kind']): BerxWorldRegion {
	switch (kind) {
		case 'person':
			return 'person';
		case 'place':
		case 'business':
			return 'place';
		case 'event':
			return 'event';
		case 'experience':
			return 'experience';
		case 'community':
			return 'community';
		case 'collection':
			return 'collection';
		case 'message':
			return 'conversation';
		case 'create':
			return 'create';
		case 'moment':
			return 'now';
	}
}
