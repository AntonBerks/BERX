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
import type {BerxHeard, BerxVoiceBackend, BerxVoiceProsody} from '@berx/spatial';

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

export class BerxWebVoice implements BerxVoiceBackend {
	private readonly synthesis?: SpeechSynthesis;
	private readonly Recognition?: RecognitionCtor;
	private readonly lang: string;
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

	speak(text: string, prosody: BerxVoiceProsody): Promise<void> {
		if (!this.available) return Promise.resolve();
		return new Promise<void>((resolve) => {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = this.lang;
			utterance.rate = prosody.rate;
			utterance.pitch = prosody.pitch;
			const chosen = this.preferVoice
				? (this.synthesis!.getVoices() ?? []).find((v) => v.name === this.preferVoice)
				: undefined;
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
