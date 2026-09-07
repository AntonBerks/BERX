/**
 * Haptics — the same five impacts everywhere, defined once.
 *
 * `BerxSpatialFeedbackAdapter.impact()` has existed as a declaration
 * since the renderer boundary was written and had no implementation on
 * any platform. The reason a shared table has to come first is that
 * haptics are a language: if "focus" is a 15ms tap on Android and a
 * heavy thud on iOS, the same gesture means two different things and
 * the world stops feeling like one place. So the PATTERN is core, and
 * a platform only decides how to play it with what its hardware has.
 *
 * The pattern is expressed twice, deliberately:
 *
 *   `waveform` — real durations in milliseconds, for anything that
 *   drives a motor directly (Web's navigator.vibrate, Android's
 *   VibrationEffect.createWaveform).
 *
 *   `ios` — the name of the generator Apple actually exposes, because
 *   iOS does NOT take a duration: UIImpactFeedbackGenerator plays a
 *   system-tuned impact and a waveform handed to it would be ignored.
 *   Encoding "light/medium/heavy/success/error" here is what keeps the
 *   Swift side from inventing its own mapping.
 *
 * Intensity scales the waveform and, on iOS, the one API that takes it
 * (impactOccurred(intensity:)). Notification feedback has no intensity
 * on iOS at all — that is Apple's API, not an omission here.
 */

export type BerxHapticPattern = 'selection' | 'focus' | 'transition' | 'success' | 'error';

export type BerxHapticIosGenerator = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export interface BerxHapticSpec {
	/** Alternating vibrate/pause durations in ms, starting with vibrate. */
	readonly waveform: readonly number[];
	/** Which UIFeedbackGenerator iOS plays for this. */
	readonly ios: BerxHapticIosGenerator;
	/** What it means, so a new platform maps behaviour rather than numbers. */
	readonly meaning: string;
}

export const BERX_HAPTICS: Readonly<Record<BerxHapticPattern, BerxHapticSpec>> = Object.freeze({
	/** The lightest thing the hardware can do: something was chosen. */
	selection: {waveform: [10], ios: 'light', meaning: 'a thing was selected'},
	/** Slightly firmer: the camera has arrived and something is held. */
	focus: {waveform: [16], ios: 'medium', meaning: 'the world focused on something'},
	/** A departure and an arrival, which is what a travel is. */
	transition: {waveform: [28, 22, 48], ios: 'heavy', meaning: 'the viewer travelled somewhere'},
	/** Two taps and a longer settle — read as "done" without a sound. */
	success: {waveform: [18, 14, 18, 14, 56], ios: 'success', meaning: 'something completed'},
	/** Two long, blunt pulses. Deliberately unpleasant. */
	error: {waveform: [78, 48, 78], ios: 'error', meaning: 'something was refused or failed'},
});

export const BERX_HAPTIC_PATTERNS = Object.keys(BERX_HAPTICS) as BerxHapticPattern[];

/**
 * Scale a pattern by intensity, in the core, so every platform scales
 * it the same way. Clamped to 0..1 and floored at 1ms per step: a
 * motor cannot play 0.4ms, and rounding a pattern down to nothing is
 * how a "quiet" setting silently becomes a broken one.
 */
export function berxHapticWaveform(pattern: BerxHapticPattern, intensity = 1): number[] {
	const scale = Math.max(0, Math.min(1, intensity));
	if (scale === 0) return [];
	return BERX_HAPTICS[pattern].waveform.map((ms) => Math.max(1, Math.round(ms * scale)));
}

/** How long the whole pattern takes. Used to avoid overlapping plays. */
export function berxHapticDuration(pattern: BerxHapticPattern, intensity = 1): number {
	return berxHapticWaveform(pattern, intensity).reduce((total, ms) => total + ms, 0);
}

/**
 * What the world does maps to what the hand feels, in ONE place —
 * so a new platform inherits the whole vocabulary by implementing
 * `play`, and no screen decides for itself what focusing feels like.
 */
export type BerxHapticMoment =
	| 'select'
	| 'focus'
	| 'blur'
	| 'travel'
	| 'arrive'
	| 'back'
	| 'action-ok'
	| 'action-refused';

const MOMENTS: Readonly<Record<BerxHapticMoment, BerxHapticPattern | undefined>> = Object.freeze({
	select: 'selection',
	focus: 'focus',
	/* Letting go is not an event the hand needs told about; a buzz for
	   every blur is what makes a device feel noisy rather than alive. */
	blur: undefined,
	travel: 'transition',
	arrive: 'focus',
	back: 'transition',
	'action-ok': 'success',
	'action-refused': 'error',
});

export function berxHapticForMoment(moment: BerxHapticMoment): BerxHapticPattern | undefined {
	return MOMENTS[moment];
}

/** What a platform implements. One method. */
export interface BerxHapticBackend {
	/** True when the hardware really played something. */
	play(pattern: BerxHapticPattern, intensity?: number): boolean;
}

/**
 * The one thing screens and the world call.
 *
 * Holds the reduced-motion rule (a device set to reduce motion is also
 * asking for less buzzing), the "don't stack" rule, and nothing else.
 * When there is no backend it reports false rather than pretending:
 * a haptic that did not happen must not be counted as one that did.
 */
export class BerxHaptics {
	private backend?: BerxHapticBackend;
	private muted = false;
	private busyUntil = 0;
	private now: () => number;

	constructor(backend?: BerxHapticBackend, now: () => number = () => Date.now()) {
		this.backend = backend;
		this.now = now;
	}

	setBackend(backend: BerxHapticBackend | undefined): void {
		this.backend = backend;
	}

	/** Reduced motion silences haptics too — same accessibility signal. */
	setReducedMotion(reduced: boolean): void {
		this.muted = reduced;
	}

	get available(): boolean {
		return this.backend !== undefined && !this.muted;
	}

	play(pattern: BerxHapticPattern, intensity = 1): boolean {
		if (!this.backend || this.muted) return false;
		const at = this.now();
		/* A pattern that starts while another is still playing produces
		   a smear the user cannot read as either one. */
		if (at < this.busyUntil) return false;
		const played = this.backend.play(pattern, intensity);
		if (played) this.busyUntil = at + berxHapticDuration(pattern, intensity);
		return played;
	}

	/** What the world did, rather than what the motor should do. */
	moment(moment: BerxHapticMoment, intensity = 1): boolean {
		const pattern = berxHapticForMoment(moment);
		return pattern ? this.play(pattern, intensity) : false;
	}
}
