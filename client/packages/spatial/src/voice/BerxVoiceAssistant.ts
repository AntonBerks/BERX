/**
 * The voice that meets you at the door.
 *
 * BERX asks a person, out loud, who they are — before it asks them to
 * fill anything in. That is the whole point of this file: registration
 * as a conversation in a room rather than a form on a screen.
 *
 * WHAT IS HERE AND WHAT IS NOT, stated plainly because the difference
 * matters more than usual:
 *
 * A speech SYNTHESISER is a synthesiser. The platform voices this
 * drives — Web SpeechSynthesis, iOS AVSpeechSynthesizer, Android
 * TextToSpeech — are the good ones of their kind and they still sound
 * synthetic, and no amount of code here changes that. What code CAN do,
 * and what this does, is everything around the voice: where the pauses
 * fall, how the pacing changes with what was just said, and what the
 * world does while it speaks. A real human voice needs one of two
 * things that are not code — a recorded actor, or a neural TTS service
 * with an API key — and this is built so either drops into
 * `BerxVoiceBackend` without a line changing above it.
 *
 * The assistant OWNS NO WORLD. It emits moments; the world application
 * turns them into light. That is why speaking makes a sphere flare on
 * WebGL2, WebGPU and the native renderer alike, with no DOM anywhere:
 * a voice that lit up a `<div>` would exist on the web and nowhere
 * else.
 *
 * CONSENT IS STRUCTURAL. `listen()` cannot be reached before
 * `grantMicrophone()` has been called with a real yes, because a
 * microphone opened without one is not a design decision, it is a
 * breach. And nothing here stores audio: the backend returns a
 * transcript, and the transcript is what the assistant sees.
 */
import type {BerxVec3} from '../world';

/**
 * How the line is meant to land.
 *
 * Not decoration: each one maps to a real change in rate, pitch and the
 * silence after it, in the one table below, so a phrase written as
 * `tender` sounds the same in four languages of implementation.
 */
export type BerxVoiceEmotion =
	/** The default. Unhurried, level. */
	| 'calm'
	/** Slower and lower. For the first line, and for anything that lands. */
	| 'tender'
	/** A little faster and brighter. For recognising something. */
	| 'warm'
	/** Slowest, quietest. For a silence you are meant to fill. */
	| 'holding'
	/** Level and firm. For a fact, a name, a welcome. */
	| 'certain';

/** What a person's words suggested about how they said them. */
export type BerxVoiceTone = 'trembling' | 'uncertain' | 'confident' | 'plain';

export interface BerxVoiceProsody {
	/** Multiplier on the platform's normal rate. */
	rate: number;
	/** Multiplier on the platform's normal pitch. */
	pitch: number;
	/** Silence after the line, in milliseconds. */
	pauseMs: number;
}

/**
 * The base pacing, and where the two numbers in the brief live.
 *
 * `0.9` and `1.1` are the product's own decision — slower is more
 * considered, slightly higher is warmer — and they are here, once,
 * rather than in three platform files that would drift.
 */
export const BERX_VOICE_RATE = 0.9;
export const BERX_VOICE_PITCH = 1.1;
/** After a question. Long enough to be an invitation, not a glitch. */
export const BERX_VOICE_PAUSE_AFTER_QUESTION = 3000;
/** After the person has answered. Long enough to have been heard. */
export const BERX_VOICE_PAUSE_AFTER_ANSWER = 2000;

const PROSODY: Readonly<Record<BerxVoiceEmotion, BerxVoiceProsody>> = Object.freeze({
	calm: {rate: BERX_VOICE_RATE, pitch: BERX_VOICE_PITCH, pauseMs: 900},
	tender: {rate: BERX_VOICE_RATE - 0.08, pitch: BERX_VOICE_PITCH - 0.06, pauseMs: 1600},
	warm: {rate: BERX_VOICE_RATE + 0.05, pitch: BERX_VOICE_PITCH + 0.05, pauseMs: 1100},
	/* the pause is the line: this is the one that waits */
	holding: {rate: BERX_VOICE_RATE - 0.12, pitch: BERX_VOICE_PITCH - 0.04, pauseMs: BERX_VOICE_PAUSE_AFTER_QUESTION},
	certain: {rate: BERX_VOICE_RATE, pitch: BERX_VOICE_PITCH - 0.02, pauseMs: 1200},
});

export function berxVoiceProsody(emotion: BerxVoiceEmotion): BerxVoiceProsody {
	return PROSODY[emotion];
}

/**
 * How the assistant answers a tone it heard.
 *
 * A person who is trembling is not met with the same voice as a person
 * who is sure. This is the rule for that, in one place, so it is a
 * decision rather than an accident of whoever wrote a line.
 */
const ANSWER_TO_TONE: Readonly<Record<BerxVoiceTone, BerxVoiceEmotion>> = Object.freeze({
	trembling: 'tender',
	uncertain: 'holding',
	confident: 'warm',
	plain: 'calm',
});

export function berxVoiceAnswerTo(tone: BerxVoiceTone): BerxVoiceEmotion {
	return ANSWER_TO_TONE[tone];
}

export interface BerxVoiceUtterance {
	text: string;
	emotion: BerxVoiceEmotion;
	/**
	 * The entity this line is about, if any.
	 *
	 * When set, the world lifts that object while the line is spoken —
	 * the sphere the voice is talking about is the one that flares.
	 */
	about?: string;
}

/** What the platform heard. A transcript, never audio. */
export interface BerxHeard {
	transcript: string;
	/** 0..1, from the recogniser. Below BERX_VOICE_MIN_CONFIDENCE is a "say again". */
	confidence: number;
	/** How long the person took to start. Long hesitation is itself an answer. */
	hesitationMs: number;
}

export const BERX_VOICE_MIN_CONFIDENCE = 0.45;

/**
 * What a platform has to provide. One method to speak, one to listen.
 *
 * Deliberately this small: everything that decides HOW it sounds — the
 * pacing, the pauses, the answer to a tone — is above this line, so a
 * new platform inherits all of it by implementing two methods.
 */
export interface BerxVoiceBackend {
	readonly available: boolean;
	/** Resolves when the line has finished being spoken, not when it starts. */
	speak(text: string, prosody: BerxVoiceProsody): Promise<void>;
	/** Resolves with what was heard, or undefined when nothing was. */
	listen(timeoutMs: number): Promise<BerxHeard | undefined>;
	/** Stops both, now. A person who wants silence gets it immediately. */
	stop(): void;
}

/**
 * What the world should do while a line is spoken.
 *
 * The assistant emits these; the world application applies them. Every
 * field is world state, not screen state — which is what makes the
 * voice reach every renderer.
 */
export interface BerxVoiceMoment {
	/** The entity to lift, if the line is about one. */
	objectId?: string;
	/** 0..1. Peaks while speaking, returns to 0 when the line ends. */
	energy: number;
	/** Where the voice is coming from, for the spatial audio listener. */
	source: BerxVec3;
	/** What is being said, for captions and for anyone not listening. */
	text: string;
	emotion: BerxVoiceEmotion;
	speaking: boolean;
}

/**
 * Tone from words — and only from words.
 *
 * NAMED HONESTLY. Emotion lives in the audio: in pitch contour, in
 * breath, in where the voice catches. None of that survives a
 * transcript, and a function that claimed to read emotion from text
 * would be claiming something it cannot do. What text DOES carry is
 * cues, and these are the ones this reads:
 *
 *   hesitation the recogniser transcribed ("ну", "эм", an ellipsis),
 *   hedging ("наверное", "кажется", "не знаю"),
 *   how long the person took to start at all,
 *   and how much they said.
 *
 * `hesitationMs` is the strongest signal here precisely because it is
 * not linguistic — it is the only thing in a transcript that came from
 * the sound.
 */
export function berxDetectTone(heard: BerxHeard): BerxVoiceTone {
	const text = heard.transcript.trim().toLowerCase();
	if (text === '') return 'uncertain';

	const hedges = ['наверное', 'кажется', 'не знаю', 'может быть', 'вроде', 'сложно сказать'];
	const fillers = ['ну', 'эм', 'ммм', 'э-э', 'как бы'];
	const hedged = hedges.some((h) => text.includes(h));
	const filled = fillers.some((f) => text.startsWith(f) || text.includes(` ${f} `));
	const words = text.split(/\s+/).filter(Boolean).length;

	/* A long silence before a short, hedged answer is the clearest thing
	   a transcript can carry about how hard the question was. */
	if (heard.hesitationMs > 4000 && words <= 4) return 'trembling';
	if (hedged || filled) return 'uncertain';
	if (heard.confidence >= 0.8 && words >= 3 && !text.endsWith('...')) return 'confident';
	return 'plain';
}

export interface BerxVoiceAssistantOptions {
	backend?: BerxVoiceBackend;
	/** Where the voice stands in the world. Defaults to just ahead of the viewer. */
	source?: BerxVec3;
	/** Called on every change the world should show. */
	onMoment?: (moment: BerxVoiceMoment) => void;
	/** Real silence, for a person who asked for it. Nothing is spoken. */
	muted?: boolean;
	/** Injected in tests so a script's timing can be checked without waiting. */
	now?: () => number;
	wait?: (ms: number) => Promise<void>;
}

/**
 * The assistant.
 *
 * Holds the conversation and nothing else: no world, no DOM, no
 * platform. It speaks through a backend and reports moments to whoever
 * is listening.
 */
export class BerxVoiceAssistant {
	private backend?: BerxVoiceBackend;
	private readonly options: BerxVoiceAssistantOptions;
	private readonly source: BerxVec3;
	private microphoneGranted = false;
	private stopped = false;
	/**
	 * Set by interrupt(), cleared by the next line.
	 *
	 * Distinct from `stopped`, and the distinction is the whole point of
	 * barge-in: stopping ENDS the session, interrupting ends the SENTENCE.
	 * A person who says "нет, подожди" has not asked BERX to go away.
	 */
	private interrupted = false;
	/** How many lines were cut short. Reported, never hidden. */
	private cut = 0;
	/** Every line spoken, in order, for verification and for captions. */
	private readonly said: BerxVoiceUtterance[] = [];

	constructor(options: BerxVoiceAssistantOptions = {}) {
		this.options = options;
		this.backend = options.backend;
		this.source = options.source ?? {x: 0, y: 0.4, z: -1.6};
	}

	setBackend(backend: BerxVoiceBackend | undefined): void {
		this.backend = backend;
	}

	get available(): boolean {
		return this.backend?.available === true && this.options.muted !== true;
	}

	get transcript(): readonly BerxVoiceUtterance[] {
		return this.said;
	}

	/**
	 * A real yes, before a microphone is ever opened.
	 *
	 * Not a flag the caller can forget: `listen()` refuses without it,
	 * so the only way to reach a microphone is through a person having
	 * said so.
	 */
	grantMicrophone(granted: boolean): void {
		this.microphoneGranted = granted;
	}

	get canListen(): boolean {
		return this.microphoneGranted && this.available;
	}

	/**
	 * Someone spoke over BERX. Stop the sentence, keep the conversation.
	 *
	 * INTERRUPTION IS NOT AN ERROR. A person who says "нет, подожди,
	 * только не бары" halfway through "я нашёл несколько вариантов" has
	 * given the most useful thing they could: a correction, at the moment
	 * they realised it. An interface that made them wait for the end of a
	 * sentence they had already rejected would be worse than one that
	 * could not speak.
	 *
	 * So this is deliberately NOT stop(). Nothing here sets `stopped`,
	 * the microphone grant survives, the transcript survives, and the
	 * caller's next intent is read against the same situation and the
	 * same spatial memory — which is what "continue" means. The
	 * conversation does not restart; one sentence ends early.
	 *
	 * The line that was cut is NOT added to the transcript as though it
	 * had been said, because it was not. A record that claims BERX told
	 * someone something it never finished saying is a record that makes
	 * every later disagreement unresolvable.
	 */
	interrupt(): void {
		if (this.stopped) return;
		this.interrupted = true;
		this.cut++;
		/* The backend's stop() kills the utterance in flight. It is the
		   same call stop() makes; what differs is everything around it. */
		this.backend?.stop();
		this.options.onMoment?.({energy: 0, source: this.source, text: '', emotion: 'calm', speaking: false});
	}

	/** True while a line is being cut short. Cleared by the next one. */
	get wasInterrupted(): boolean {
		return this.interrupted;
	}

	/** How many lines a person has spoken over. Diagnostic, not a score. */
	get interruptions(): number {
		return this.cut;
	}

	/** Everything stops now — speech, listening, and the world's lift. */
	stop(): void {
		this.stopped = true;
		this.backend?.stop();
		this.options.onMoment?.({energy: 0, source: this.source, text: '', emotion: 'calm', speaking: false});
	}

	/**
	 * Say one line, and hold the silence after it.
	 *
	 * The pause is part of the line, not a gap between lines: it is what
	 * turns a sequence of sentences into someone talking to you. It is
	 * awaited here rather than left to the caller precisely so it cannot
	 * be forgotten.
	 */
	async speak(utterance: BerxVoiceUtterance, pauseOverrideMs?: number): Promise<void> {
		if (this.stopped) return;
		/* A new line clears the last interruption: being spoken over is a
		   property of one sentence, not a state to stay in. */
		this.interrupted = false;
		const prosody = berxVoiceProsody(utterance.emotion);
		this.options.onMoment?.({
			objectId: utterance.about,
			/* while a line is being spoken, the thing it is about is the
			   most alive thing in the world — which is exactly what BERX
			   Energy means, and it returns to nothing the moment the line
			   ends rather than lingering as decoration */
			energy: 1,
			source: this.source,
			text: utterance.text,
			emotion: utterance.emotion,
			speaking: true,
		});
		if (this.available) {
			await this.backend!.speak(utterance.text, prosody);
		}
		this.options.onMoment?.({
			objectId: utterance.about,
			energy: 0,
			source: this.source,
			text: utterance.text,
			emotion: utterance.emotion,
			speaking: false,
		});
		/* Recorded only now, and only if it actually finished. This used
		   to happen before the line was spoken, which meant an interrupted
		   sentence went into the transcript as though it had been heard. */
		if (!this.interrupted) this.said.push(utterance);
		/* The silence after a line belongs to the line. A line somebody
		   spoke over does not get one — holding a pause for a sentence
		   that was rejected is the interface insisting. */
		const pause = pauseOverrideMs ?? prosody.pauseMs;
		if (pause > 0 && !this.interrupted) await this.pause(pause);
	}

	/**
	 * Ask, then wait — for the answer AND for the silence after it.
	 *
	 * Returns undefined when nothing was heard or the recogniser was not
	 * sure enough. That is a real answer about the room, and the caller
	 * is expected to offer the person another way through rather than
	 * to insist.
	 */
	async ask(utterance: BerxVoiceUtterance, listenMs = 8000): Promise<BerxHeard | undefined> {
		await this.speak(utterance, BERX_VOICE_PAUSE_AFTER_QUESTION);
		if (!this.canListen || this.stopped) return undefined;
		const heard = await this.backend!.listen(listenMs);
		if (!heard || heard.confidence < BERX_VOICE_MIN_CONFIDENCE) return undefined;
		await this.pause(BERX_VOICE_PAUSE_AFTER_ANSWER);
		return heard;
	}

	/**
	 * Listen without asking anything.
	 *
	 * For the moment after a line that was already an invitation — the
	 * offer of the four spheres is a question, and asking it twice would
	 * be a machine that did not trust its own words. Speaking an empty
	 * line to reach the microphone would put an empty utterance in the
	 * transcript and flare the world for nothing, so this is its own
	 * method rather than `ask('')`.
	 */
	async listen(listenMs = 8000): Promise<BerxHeard | undefined> {
		if (!this.canListen || this.stopped) return undefined;
		const heard = await this.backend!.listen(listenMs);
		if (!heard || heard.confidence < BERX_VOICE_MIN_CONFIDENCE) return undefined;
		await this.pause(BERX_VOICE_PAUSE_AFTER_ANSWER);
		return heard;
	}

	/**
	 * Answer what was heard in the tone it was said in.
	 *
	 * The line is the caller's; the way it lands is decided here, from
	 * the one table, so an anxious answer is never met with a bright
	 * voice by accident.
	 */
	async respond(heard: BerxHeard | undefined, line: (tone: BerxVoiceTone) => BerxVoiceUtterance): Promise<BerxVoiceTone> {
		const tone: BerxVoiceTone = heard ? berxDetectTone(heard) : 'uncertain';
		const utterance = line(tone);
		await this.speak({...utterance, emotion: berxVoiceAnswerTo(tone)});
		return tone;
	}

	private async pause(ms: number): Promise<void> {
		if (this.stopped) return;
		const wait = this.options.wait ?? ((delay: number) => new Promise<void>((r) => setTimeout(r, delay)));
		await wait(ms);
	}
}
