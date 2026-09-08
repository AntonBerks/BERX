/**
 * BERX particles — the air with something in it.
 *
 * Volumetric light shows that the air carries light. This shows that it
 * carries THINGS: dust turning in a shaft, energy rising off something
 * live, the far static of a world that continues past what is drawn.
 * Three kinds, because they answer three different questions, and a
 * fourth would need a reason rather than a slot:
 *
 *   dust    — motes in the room. What makes a lit volume read as air
 *             rather than as fog. Slow, small, neutral, everywhere.
 *   energy  — BERX Energy (#4FD6E8) rising off a live entity. The ONLY
 *             particle that carries the accent colour, and it exists
 *             only where the world says something is happening now, so
 *             the rarity rule the palette depends on is structural
 *             rather than a promise.
 *   stars   — the far field. Fixed in the world, not attached to
 *             anything, and dim enough to read as distance.
 *
 * NO Math.random, ANYWHERE. Every particle's position, size, phase and
 * lifetime comes from a hash of its own INDEX — the same FNV-1a the
 * volumetric dither uses. That is not a stylistic preference:
 *
 *   a random field is a different world on every run, so two backends
 *   cannot be compared and a prediction cannot be made;
 *   a hashed field is the same world on every run, on every backend, in
 *   every language — which is what lets the CPU twin below say where
 *   each particle will be before the GPU draws it.
 *
 * The GPU generates the field from the same hash rather than reading a
 * buffer this file fills. That is deliberate too: a buffer would be one
 * more thing to keep in sync per backend, and the whole point of a hash
 * is that it needs no synchronising.
 */
import type {BerxVec3} from '../world';

export type BerxParticleKind = 'dust' | 'energy' | 'stars';

export const BERX_PARTICLE_KINDS: readonly BerxParticleKind[] = ['dust', 'energy', 'stars'] as const;

export interface BerxParticleSpec {
	/** How many of them. Real cost: one point sprite each. */
	count: number;
	/** Metres. The cube (dust, stars) or radius (energy) they occupy. */
	extent: number;
	/** World units per second. */
	speed: number;
	/** Metres across, at the near plane. */
	size: number;
	/** Linear RGB. */
	colour: [number, number, number];
	/** Peak alpha. Every kind is faint; none of them is a foreground element. */
	alpha: number;
	/** Seconds for one full cycle of the drift. */
	period: number;
	/** What it is for, so a new kind is a decision rather than a slot. */
	meaning: string;
}

/**
 * BERX Energy, once, as linear RGB.
 *
 * #4FD6E8. The palette reserves it for what is happening NOW, and the
 * energy particles are the only ones that carry it — a dust mote in
 * accent colour would spend the rarest thing in the design on the most
 * common object in the frame.
 */
const BERX_ENERGY: [number, number, number] = [0x4f / 255, 0xd6 / 255, 0xe8 / 255];

const SPECS: Readonly<Record<BerxParticleKind, BerxParticleSpec>> = Object.freeze({
	dust: {
		count: 512,
		extent: 24,
		speed: 0.08,
		size: 0.035,
		/* #A7ADB4 — the palette's mist, not white: white motes read as
		   dirt on the lens rather than as air in the room */
		colour: [0xa7 / 255, 0xad / 255, 0xb4 / 255],
		alpha: 0.22,
		period: 26,
		meaning: 'motes in the room — what makes a lit volume read as air',
	},
	energy: {
		count: 128,
		extent: 3.2,
		speed: 0.55,
		size: 0.05,
		colour: BERX_ENERGY,
		alpha: 0.5,
		period: 4.5,
		meaning: 'BERX Energy rising off something live, and nothing else',
	},
	stars: {
		count: 256,
		extent: 90,
		/* fixed in the world: a star that drifts is not far away */
		speed: 0,
		size: 0.05,
		/* #F2F0EB — pearl, the palette's own light */
		colour: [0xf2 / 255, 0xf0 / 255, 0xeb / 255],
		alpha: 0.3,
		period: 60,
		meaning: 'the far field — the world continues past what is drawn',
	},
});

export function berxParticleSpec(kind: BerxParticleKind): BerxParticleSpec {
	return SPECS[kind];
}

/**
 * How far ahead of the viewer a field is centred, as a fraction of its
 * own extent.
 *
 * A field centred ON the camera puts half its particles behind the
 * viewer and most of the rest outside a narrow frustum — measured on
 * the fixture: 3 of 512 dust motes landed in frame, and the pass paid
 * for 512. Centring it ahead puts the motes where the viewer is
 * actually looking, at no extra cost.
 */
export const BERX_PARTICLE_LEAD = 0.35;

/**
 * Packed for a uniform, in the order every port reads it — including
 * the field's ORIGIN.
 *
 * The origin is packed here rather than chosen per backend because it
 * is a decision about the world (where the room is, which entity is
 * live), and three backends deciding it separately is three worlds. A
 * backend forwards this and interprets none of it.
 */
export function berxParticleUniform(
	kind: BerxParticleKind,
	origin: BerxVec3 = {x: 0, y: 0, z: 0},
	/**
	 * How many of them to actually draw, when a quality tier wants fewer
	 * than the kind describes.
	 *
	 * A PREFIX of the field, never a re-seed: every mote's position comes
	 * from a hash of its own index, so drawing the first 154 of 512 leaves
	 * those 154 exactly where they were. A tier that re-seeded would give
	 * two devices two different rooms and make every oracle in this
	 * repository unable to predict either.
	 */
	count: number = SPECS[kind].count,
): number[] {
	const s = SPECS[kind];
	return [
		s.colour[0], s.colour[1], s.colour[2], s.alpha,
		s.extent, s.speed, s.size, s.period,
		Math.max(1, Math.round(count)), BERX_PARTICLE_KINDS.indexOf(kind), 0, 0,
		origin.x, origin.y, origin.z, 0,
	];
}

export const BERX_PARTICLE_FLOATS = 16;

/**
 * Where a field sits, from what the world is doing.
 *
 * Dust and stars are the room and the distance, so they are arranged
 * around the viewer — a little ahead of it, so the motes are where the
 * eye is. Energy belongs to a live entity and is arranged around that;
 * with nothing live there is no energy field at all, which is what
 * keeps BERX Energy rare by construction rather than by promise.
 */
export function berxParticleOrigin(
	kind: BerxParticleKind,
	camera: BerxVec3,
	forward: BerxVec3,
	live: BerxVec3 | undefined,
): BerxVec3 | undefined {
	if (kind === 'energy') return live;
	const lead = SPECS[kind].extent * BERX_PARTICLE_LEAD;
	return {
		x: camera.x + forward.x * lead,
		y: camera.y + forward.y * lead,
		z: camera.z + forward.z * lead,
	};
}

/**
 * The hash every port shares: FNV-1a over an index and a lane.
 *
 * `lane` is what turns one index into several independent numbers — x,
 * y, z, phase — without needing four hashes or a table. Returns 0..1.
 */
export function berxParticleHash(index: number, lane: number): number {
	let h = 0x811c9dc5;
	h ^= index & 0xffff;
	h = Math.imul(h, 0x01000193) >>> 0;
	h ^= (index >>> 16) & 0xffff;
	h = Math.imul(h, 0x01000193) >>> 0;
	h ^= lane & 0xffff;
	h = Math.imul(h, 0x01000193) >>> 0;
	return (h >>> 8) / 0x1000000;
}

export interface BerxParticle {
	position: BerxVec3;
	/** 0..1, already including the kind's own peak alpha. */
	alpha: number;
	/** Metres. */
	size: number;
}

/**
 * Where particle `index` of `kind` is at time `t` — the reference
 * implementation, and the ORACLE the gate predicts the GPU with.
 *
 * `origin` is what the field is arranged around: the viewer for dust
 * and stars, the live entity for energy. Nothing else about a kind
 * depends on the world, which is why one function serves all three.
 */
export function berxParticleAt(
	kind: BerxParticleKind,
	index: number,
	t: number,
	origin: BerxVec3 = {x: 0, y: 0, z: 0},
): BerxParticle {
	const spec = SPECS[kind];
	const hx = berxParticleHash(index, 1);
	const hy = berxParticleHash(index, 2);
	const hz = berxParticleHash(index, 3);
	const hp = berxParticleHash(index, 4);

	/* the cycle this particle is on, so a field never restarts as one */
	const phase = (t / spec.period + hp) % 1;

	if (kind === 'energy') {
		/**
		 * Energy rises. A spiral rather than a straight line, because a
		 * column of dots reads as a texture and a spiral reads as
		 * something leaving a surface.
		 */
		const angle = hx * Math.PI * 2 + phase * Math.PI * 4;
		const radius = spec.extent * (0.25 + hy * 0.55) * (1 - phase * 0.45);
		return {
			position: {
				x: origin.x + Math.cos(angle) * radius,
				y: origin.y - spec.extent * 0.4 + phase * spec.extent * 1.8,
				z: origin.z + Math.sin(angle) * radius,
			},
			/* fades in and out over its own life: a particle that pops in
			   at full brightness is a flicker, not a rising ember */
			alpha: spec.alpha * Math.sin(phase * Math.PI),
			size: spec.size * (0.6 + hz * 0.8),
		};
	}

	/**
	 * Dust and stars: a hashed cube around the origin, drifting.
	 *
	 * The drift wraps by construction — the phase is taken modulo 1 and
	 * multiplied by the extent — so there is no respawn, no lifetime
	 * bookkeeping and nothing to desynchronise between backends.
	 */
	const drift = spec.speed === 0 ? 0 : phase * spec.extent;
	const wrap = (v: number) => ((v % spec.extent) + spec.extent) % spec.extent - spec.extent * 0.5;
	return {
		position: {
			x: origin.x + wrap(hx * spec.extent + drift * 0.35),
			y: origin.y + wrap(hy * spec.extent + drift),
			z: origin.z + wrap(hz * spec.extent + drift * 0.2),
		},
		/* stars twinkle very slightly; dust does not — a twinkling mote
		   in the near field reads as a rendering error */
		alpha: kind === 'stars'
			? spec.alpha * (0.65 + 0.35 * Math.sin(phase * Math.PI * 2))
			: spec.alpha,
		size: spec.size * (0.7 + hz * 0.6),
	};
}

/** Every particle of a kind at one instant. For the oracle and for tests. */
export function berxParticleField(
	kind: BerxParticleKind,
	t: number,
	origin: BerxVec3 = {x: 0, y: 0, z: 0},
): BerxParticle[] {
	const spec = SPECS[kind];
	const out: BerxParticle[] = [];
	for (let i = 0; i < spec.count; i++) out.push(berxParticleAt(kind, i, t, origin));
	return out;
}
