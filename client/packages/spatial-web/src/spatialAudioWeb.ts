/**
 * Web Audio as the world's ears.
 *
 * A real `PannerNode` per source with HRTF panning, a real
 * `AudioListener` that follows the camera, and real inverse-distance
 * falloff. Nothing is simulated with stereo gain, and nothing plays
 * that the caller did not hand over a URL for.
 *
 * The context starts suspended. Browsers require a gesture before
 * audio, and pretending otherwise produces a world that is silently
 * broken until someone happens to click — so `resume()` is explicit
 * and the backend reports honestly whether it is running.
 */
import {
	berxAudioAttenuation,
	type BerxAudioListener,
	type BerxAudioSource,
	type BerxSpatialAudioBackend,
	type BerxVec3,
} from '@berx/spatial';

interface Playing {
	source: AudioBufferSourceNode;
	panner: PannerNode;
	gain: GainNode;
	spec: BerxAudioSource;
}

export class BerxWebSpatialAudio implements BerxSpatialAudioBackend {
	readonly spatial = true;
	private readonly context: BaseAudioContext;
	private readonly playing = new Map<string, Playing>();
	private readonly buffers = new Map<string, AudioBuffer>();
	private listener: BerxAudioListener = {
		position: {x: 0, y: 0, z: 0},
		forward: {x: 0, y: 0, z: -1},
		up: {x: 0, y: 1, z: 0},
	};

	/**
	 * Any real audio context. An `OfflineAudioContext` is one — it is
	 * how the verification renders sound deterministically — and it has
	 * no `resume` or `close`, which is why both are guarded rather than
	 * assumed.
	 */
	constructor(context?: BaseAudioContext) {
		this.context = context ?? new AudioContext();
	}

	/** Running only after a gesture. Reported, never assumed. */
	get running(): boolean {
		return this.context.state === 'running';
	}

	/** Call from a real user gesture. Browsers require one; this is honest about it. */
	async resume(): Promise<void> {
		const context = this.context as BaseAudioContext & {resume?: () => Promise<void>};
		if (context.state !== 'running' && typeof context.resume === 'function') await context.resume();
	}

	setListener(listener: BerxAudioListener): void {
		this.listener = listener;
		const l = this.context.listener;
		/* the modern properties where they exist, the deprecated setters
		   where they do not — both are real, and one of them is what the
		   browser in front of us implements */
		if (l.positionX) {
			l.positionX.value = listener.position.x;
			l.positionY.value = listener.position.y;
			l.positionZ.value = listener.position.z;
			l.forwardX.value = listener.forward.x;
			l.forwardY.value = listener.forward.y;
			l.forwardZ.value = listener.forward.z;
			l.upX.value = listener.up.x;
			l.upY.value = listener.up.y;
			l.upZ.value = listener.up.z;
		} else {
			(l as unknown as {setPosition(x: number, y: number, z: number): void}).setPosition(listener.position.x, listener.position.y, listener.position.z);
			(l as unknown as {setOrientation(...a: number[]): void}).setOrientation(
				listener.forward.x, listener.forward.y, listener.forward.z,
				listener.up.x, listener.up.y, listener.up.z,
			);
		}
	}

	private async buffer(uri: string): Promise<AudioBuffer> {
		const cached = this.buffers.get(uri);
		if (cached) return cached;
		const response = await fetch(uri, {mode: 'cors'});
		if (!response.ok) throw new Error(`BERX 5D audio: ${uri} answered ${response.status}`);
		const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
		this.buffers.set(uri, decoded);
		return decoded;
	}

	async play(spec: BerxAudioSource, at: BerxVec3): Promise<void> {
		this.stop(spec.id);
		const buffer = await this.buffer(spec.uri);
		const source = this.context.createBufferSource();
		source.buffer = buffer;
		source.loop = spec.loop;

		const panner = this.context.createPanner();
		panner.panningModel = 'HRTF';
		panner.distanceModel = 'inverse';
		panner.refDistance = spec.refDistance;
		panner.maxDistance = spec.maxDistance;
		panner.rolloffFactor = 1;
		if (spec.orientation) {
			panner.coneInnerAngle = spec.coneInnerAngle ?? 60;
			panner.coneOuterAngle = spec.coneOuterAngle ?? 180;
			panner.coneOuterGain = 0.2;
		}
		setPannerPosition(panner, at, spec.orientation);

		const gain = this.context.createGain();
		gain.gain.value = berxAudioAttenuation(spec, this.listener.position, at) > 0 ? spec.gain : 0;

		source.connect(panner).connect(gain).connect(this.context.destination);
		source.start();
		source.onended = () => this.stop(spec.id);
		this.playing.set(spec.id, {source, panner, gain, spec});
	}

	move(sourceId: string, to: BerxVec3): void {
		const entry = this.playing.get(sourceId);
		if (!entry) return;
		setPannerPosition(entry.panner, to, entry.spec.orientation);
		/* past its max distance a source is silent and costs nothing */
		entry.gain.gain.value = berxAudioAttenuation(entry.spec, this.listener.position, to) > 0 ? entry.spec.gain : 0;
	}

	stop(sourceId: string): void {
		const entry = this.playing.get(sourceId);
		if (!entry) return;
		this.playing.delete(sourceId);
		try {
			entry.source.onended = null;
			entry.source.stop();
		} catch {
			/* already ended: stopping twice is not an error worth raising */
		}
		entry.source.disconnect();
		entry.panner.disconnect();
		entry.gain.disconnect();
	}

	stopAll(): void {
		for (const id of [...this.playing.keys()]) this.stop(id);
	}

	dispose(): void {
		this.stopAll();
		this.buffers.clear();
		/* an offline context renders once and has nothing to close */
		const context = this.context as BaseAudioContext & {close?: () => Promise<void>};
		if (typeof context.close === 'function') void context.close();
	}
}

function setPannerPosition(panner: PannerNode, at: BerxVec3, orientation?: BerxVec3): void {
	if (panner.positionX) {
		panner.positionX.value = at.x;
		panner.positionY.value = at.y;
		panner.positionZ.value = at.z;
		if (orientation) {
			panner.orientationX.value = orientation.x;
			panner.orientationY.value = orientation.y;
			panner.orientationZ.value = orientation.z;
		}
	} else {
		(panner as unknown as {setPosition(x: number, y: number, z: number): void}).setPosition(at.x, at.y, at.z);
		if (orientation) {
			(panner as unknown as {setOrientation(x: number, y: number, z: number): void}).setOrientation(orientation.x, orientation.y, orientation.z);
		}
	}
}
