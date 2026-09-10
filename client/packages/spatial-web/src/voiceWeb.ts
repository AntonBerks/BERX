/**
 * The voice, on the web.
 *
 * Two browser APIs, and they are not the same kind of thing:
 *
 * `speechSynthesis` is in every current browser and works offline. It
 * is also a synthesiser — see BerxVoiceAssistant's header. What this
 * file does is hand it the pacing the core decided and resolve only
 * when the utterance has actually FINISHED, because a promise that
 * resolves on `start` turns every pause in the script into a lie.
 *
 * `SpeechRecognition` is not standard, is prefixed in Chromium, is
 * absent in Firefox, and in Chromium it sends audio to a Google
 * service. That last part is not a footnote: it is a fact a person is
 * entitled to know before a microphone opens, so `requiresNetwork` is
 * exposed and the shell is expected to say so.
 *
 * Both are reported honestly by `available`: a browser with no
 * synthesiser gets the silent path, not a broken script.
 */
import type {BerxHeard, BerxSpeechCapability, BerxSpeechProvider, BerxVoiceProsody} from '@berx/spatial';

interface SpeechRecognitionLike {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	start(): void;
	stop(): void;
	abort(): void;
	onresult: ((event: {results: ArrayLike<ArrayLike<{transcript: string; confidence: number}>>}) => void) | null;
	onerror: ((event: {error: string}) => void) | null;
	onend: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

export interface BerxWebVoiceOptions {
	/** BCP-47. The script is Russian, so this is its default. */
	lang?: string;
	/**
	 * Which installed voice to prefer, by name.
	 *
	 * Browsers ship wildly different voices and the good ones are not
	 * the default. Naming one is the single biggest thing a deployment
	 * can do to make this sound less synthetic without buying a service.
	 */
	preferVoice?: string;
	synthesis?: SpeechSynthesis;
	recognition?: RecognitionCtor;
}

export class BerxWebVoice implements BerxSpeechProvider {
	private readonly synthesis?: SpeechSynthesis;
	private readonly Recognition?: RecognitionCtor;
	private readonly lang: string;
	/** The language of the NEXT utterance; see speakIn. */
	private spoken?: string;
	private readonly preferVoice?: string;
	private active?: SpeechRecognitionLike;

	constructor(options: BerxWebVoiceOptions = {}) {
		const w = globalThis as {
			speechSynthesis?: SpeechSynthesis;
			SpeechRecognition?: RecognitionCtor;
			webkitSpeechRecognition?: RecognitionCtor;
		};
		this.synthesis = options.synthesis ?? w.speechSynthesis;
		this.Recognition = options.recognition ?? w.SpeechRecognition ?? w.webkitSpeechRecognition;
		this.lang = options.lang ?? 'ru-RU';
		this.preferVoice = options.preferVoice;
	}

	/** Speaking is the half that must work; listening is optional. */
	get available(): boolean {
		return typeof this.synthesis?.speak === 'function';
	}

	get canListen(): boolean {
		return this.Recognition !== undefined;
	}

	/**
	 * True where recognition is known to leave the device.
	 *
	 * Chromium's implementation posts audio to a remote service. A
	 * person deserves to be told that before the microphone opens, so
	 * this is exposed rather than buried.
	 */
	get requiresNetwork(): boolean {
		return this.canListen;
	}

	/** The installed voices, so a deployment can choose a good one. */
	voices(): {name: string; lang: string}[] {
		return (this.synthesis?.getVoices() ?? []).map((v) => ({name: v.name, lang: v.lang}));
	}

	/**
	 * What this provider can really do — see BerxSpeechCapability.
	 *
	 * `languages` comes from the voices the browser has actually
	 * installed, which on a bare Linux container is none: an empty list
	 * says "it has not told us" rather than "it cannot", because a
	 * voice list loads asynchronously and claiming otherwise would make
	 * a chain skip a provider that was about to work.
	 *
	 * `offDevice` is true because Chromium's recogniser posts audio to a
	 * remote service. It is true for the WHOLE provider even though only
	 * the listening half leaves the device: a person deciding whether to
	 * open a microphone is entitled to the pessimistic answer.
	 */
	get capability(): BerxSpeechCapability {
		return {
			id: 'web-speech',
			speaks: this.available,
			listens: this.canListen,
			offDevice: this.requiresNetwork,
			languages: [...new Set(this.voices().map((v) => v.lang))],
		};
	}

	/**
	 * Speak in a named language.
	 *
	 * A voice installed for that language where the browser has one,
	 * and the utterance's own `lang` regardless — which is what a
	 * synthesiser uses to decide pronunciation even when it substitutes
	 * a voice. Nothing is refused for want of a matching voice: a
	 * Russian voice reading French badly is a real outcome a person can
	 * hear and correct, and silence is not.
	 */
	async speakIn(text: string, prosody: BerxVoiceProsody, language: string): Promise<void> {
		const previous = this.spoken;
		this.spoken = language;
		try {
			await this.speak(text, prosody);
		} finally {
			this.spoken = previous;
		}
	}

	speak(text: string, prosody: BerxVoiceProsody): Promise<void> {
		if (!this.available) return Promise.resolve();
		return new Promise<void>((resolve) => {
			const utterance = new SpeechSynthesisUtterance(text);
			const language = this.spoken ?? this.lang;
			utterance.lang = language;
			utterance.rate = prosody.rate;
			utterance.pitch = prosody.pitch;
			const installed = this.synthesis!.getVoices() ?? [];
			const chosen = this.preferVoice
				? installed.find((v) => v.name === this.preferVoice)
				/* the best voice for the language being spoken, when one is
				   installed: an exact tag first, then the same base tag */
				: installed.find((v) => v.lang.toLowerCase() === language.toLowerCase())
					?? installed.find((v) => v.lang.toLowerCase().split('-')[0] === language.toLowerCase().split('-')[0]);
			if (chosen) utterance.voice = chosen;
			/* Resolve on END, never on start. The script's silences are
			   measured from the moment a line finishes, so resolving early
			   would collapse a three-second pause into nothing and the
			   whole thing would sound like a queue of announcements. */
			let settled = false;
			const done = () => {
				if (settled) return;
				settled = true;
				resolve();
			};
			utterance.onend = done;
			/* A synthesiser that fails mid-line must not hang the script:
			   the person is standing in a room waiting for it. */
			utterance.onerror = done;
			this.synthesis!.speak(utterance);
		});
	}

	async listen(timeoutMs: number): Promise<BerxHeard | undefined> {
		if (!this.Recognition) return undefined;
		const started = Date.now();
		return await new Promise<BerxHeard | undefined>((resolve) => {
			const recognition = new this.Recognition!();
			this.active = recognition;
			recognition.lang = this.lang;
			recognition.continuous = false;
			recognition.interimResults = false;
			recognition.maxAlternatives = 1;
			let settled = false;
			const finish = (heard: BerxHeard | undefined) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				this.active = undefined;
				try {
					recognition.abort();
				} catch {
					/* already ended */
				}
				resolve(heard);
			};
			const timer = setTimeout(() => finish(undefined), timeoutMs);
			recognition.onresult = (event) => {
				const best = event.results[0]?.[0];
				if (!best) return finish(undefined);
				finish({
					transcript: best.transcript,
					/* some engines omit confidence entirely; a missing number
					   is not a confident one */
					confidence: Number.isFinite(best.confidence) ? best.confidence : 0.5,
					hesitationMs: Date.now() - started,
				});
			};
			recognition.onerror = () => finish(undefined);
			recognition.onend = () => finish(undefined);
			try {
				recognition.start();
			} catch {
				finish(undefined);
			}
		});
	}

	stop(): void {
		try {
			this.synthesis?.cancel();
		} catch {
			/* nothing was speaking */
		}
		try {
			this.active?.abort();
		} catch {
			/* nothing was listening */
		}
		this.active = undefined;
	}
}
