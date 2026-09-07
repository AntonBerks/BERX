/**
 * Haptics on the web.
 *
 * `navigator.vibrate` is the only vibration API a browser has, and it
 * is honest about its limits: no intensity, no sharpness, and on iOS
 * Safari no support at all. So this plays the shared waveform and
 * reports truthfully whether the hardware took it — `vibrate()` returns
 * false when the pattern was rejected, and a browser without the API
 * reports false rather than silently succeeding.
 *
 * The core's table decides WHAT is played (@berx/spatial's
 * BERX_HAPTICS); this decides only how to hand it to a browser.
 */
import {berxHapticWaveform, type BerxHapticBackend, type BerxHapticPattern} from '@berx/spatial';

/** The one part of navigator this uses, so a host can supply it. */
export interface BerxVibrationSource {
	vibrate(pattern: number | number[]): boolean;
}

export class BerxWebHaptics implements BerxHapticBackend {
	private readonly source?: BerxVibrationSource;

	constructor(source?: Partial<BerxVibrationSource>) {
		/* A source is only a source if it can actually vibrate. Taking
		   whatever was passed on trust made an object without the method
		   report `supported: true` and then throw on the first play —
		   found by the gate, which is what it is for. */
		const navigatorLike = (globalThis as {navigator?: Partial<BerxVibrationSource>}).navigator;
		const candidate = source ?? navigatorLike;
		this.source = typeof candidate?.vibrate === 'function' ? (candidate as BerxVibrationSource) : undefined;
	}

	/** False where the browser has no vibration API at all. */
	get supported(): boolean {
		return this.source !== undefined;
	}

	play(pattern: BerxHapticPattern, intensity = 1): boolean {
		if (!this.source) return false;
		const waveform = berxHapticWaveform(pattern, intensity);
		if (waveform.length === 0) return false;
		try {
			/* A single-step pattern is passed as a number: some engines
			   reject a one-element array. */
			return this.source.vibrate(waveform.length === 1 ? waveform[0] : waveform) !== false;
		} catch {
			/* A vibration refused by a permission policy is a real "no",
			   not an exception the session should carry. */
			return false;
		}
	}

	/** Stops whatever is playing — what a page hiding should do. */
	stop(): void {
		try {
			this.source?.vibrate(0);
		} catch {
			/* nothing was playing */
		}
	}
}
