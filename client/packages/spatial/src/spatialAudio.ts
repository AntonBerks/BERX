/**
 * Sound with a position in the world.
 *
 * BERX has no audio assets and no audio endpoint, so nothing here
 * plays anything on its own — a runtime that shipped its own sounds
 * would be inventing content. What it does is give a real URL the API
 * hands over a real place to come from: a moment's recording plays
 * from where that moment is, and turning away from it makes it quieter
 * on that side, because the listener is the camera.
 *
 * Platform-free, like everything else in this package. Web Audio,
 * AVAudioEngine and Oboe all implement the same contract; the world
 * does not know which one is under it.
 */
import type {BerxVec3} from './world';

export interface BerxAudioSource {
	id: string;
	/** The entity this sound belongs to. Its position is the sound's. */
	objectId: string;
	/** A real URL. Never a bundled asset, never generated. */
	uri: string;
	/** 0..1, before distance is applied. */
	gain: number;
	loop: boolean;
	/**
	 * Metres at which the sound is at full volume, and at which it has
	 * fallen to nothing. Beyond `maxDistance` it is not audible and
	 * costs nothing.
	 */
	refDistance: number;
	maxDistance: number;
	/** Directional sources face somewhere; omnidirectional ones do not. */
	orientation?: BerxVec3;
	/** Degrees of the cone in which a directional source is at full gain. */
	coneInnerAngle?: number;
	coneOuterAngle?: number;
}

/** Where the listener is and which way they face. The camera, in practice. */
export interface BerxAudioListener {
	position: BerxVec3;
	forward: BerxVec3;
	up: BerxVec3;
}

/**
 * What a platform must provide to make sound spatial.
 *
 * Every method takes world coordinates. No platform is asked to know
 * about entities, regions or time — those stay in the world.
 */
export interface BerxSpatialAudioBackend {
	/** True only when the platform really pans by position. */
	readonly spatial: boolean;
	setListener(listener: BerxAudioListener): void;
	play(source: BerxAudioSource, at: BerxVec3): Promise<void>;
	move(sourceId: string, to: BerxVec3): void;
	stop(sourceId: string): void;
	stopAll(): void;
	dispose(): void;
}

/**
 * How loud a source is at a distance, before the platform's own
 * panning. The inverse model, clamped at both ends: full inside
 * `refDistance`, silent past `maxDistance`.
 *
 * Computed here rather than left to each backend so a sound is the
 * same distance away on every platform.
 */
export function berxAudioAttenuation(source: BerxAudioSource, listener: BerxVec3, at: BerxVec3): number {
	const d = Math.hypot(at.x - listener.x, at.y - listener.y, at.z - listener.z);
	if (d >= source.maxDistance) return 0;
	if (d <= source.refDistance) return source.gain;
	/* inverse distance, normalised so it reaches exactly zero at max
	   rather than trailing off asymptotically and never stopping */
	const inverse = source.refDistance / d;
	const window = 1 - (d - source.refDistance) / (source.maxDistance - source.refDistance);
	return source.gain * inverse * window;
}

/** The listener pose the camera implies. One place, so every backend agrees. */
export function berxListenerFromCamera(position: BerxVec3, target: BerxVec3): BerxAudioListener {
	const f = {x: target.x - position.x, y: target.y - position.y, z: target.z - position.z};
	const l = Math.hypot(f.x, f.y, f.z) || 1;
	return {
		position: {...position},
		forward: {x: f.x / l, y: f.y / l, z: f.z / l},
		up: {x: 0, y: 1, z: 0},
	};
}
