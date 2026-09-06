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
import {berxApplyTemporal, berxTemporalCursor, type BerxTemporalCursor} from './temporal';
import {berxRelationalLayout, berxRelationalWeight} from './relational';
import type {BerxNavigationIntent} from './platform';
import type {BerxSpatialObject, BerxSpatialRelation} from './world';

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
		this.layout = berxRelationalLayout(snapshot.objects, usable, {rootId: this.viewerId});
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
	travelTo(objectId: string, region?: BerxWorldRegion): boolean {
		const object = this.runtime.world.getObject(objectId);
		if (!object) return false;
		const target = region ?? regionForKind(object.kind);
		/* remember where the viewer was standing, so back() restores the
		   region, the focus and the temporal cursor together with the
		   camera rather than only the pose */
		this.history.push(this.worldPosition);
		this.runtime.enterWorld({id: `${target}:${objectId}`, focusObjectId: objectId, enteredAt: Date.now()}, object.transform.position);
		this.runtime.focus(objectId);
		this.position = {...this.position, region: target, focusId: objectId};
		this.options.onPositionChange?.(this.worldPosition);
		return true;
	}

	/** Travel to a region without a particular entity in it. */
	enterRegion(region: BerxWorldRegion): void {
		this.history.push(this.worldPosition);
		this.runtime.enterWorld({id: region, enteredAt: Date.now()});
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
		if (!this.runtime.back()) return false;
		if (previous) {
			this.position = previous;
			this.options.onPositionChange?.(this.worldPosition);
		}
		return true;
	}

	private readonly history: BerxWorldPosition[] = [];

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
		const ok = this.runtime.focus(objectId);
		if (ok) {
			this.position = {...this.position, focusId: objectId};
			this.options.onPositionChange?.(this.worldPosition);
		}
		return ok;
	}

	setAccessibility(options: {reducedMotion?: boolean}): void {
		this.runtime.setAccessibility(options);
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
		const cursor = this.position.cursor;
		return {
			...base,
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
