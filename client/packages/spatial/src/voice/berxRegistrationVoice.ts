/**
 * Registration, as a conversation.
 *
 * This is the file where the voice and the world are actually joined.
 * `BerxVoiceAssistant` knows how to say a line and nothing about space;
 * `berxVoiceWorld` knows how to light an object and nothing about what
 * is being said. This runs the script and hands each moment across.
 *
 * WHAT IT REFUSES TO DO. It never invents an answer. If nothing was
 * heard, that is not retried until something is: the person is told
 * once, offered the silent path, and the flow continues by hand. A
 * registration that will not let you past until you have spoken loudly
 * enough is a registration that has decided your microphone matters
 * more than you do.
 *
 * WHY THE CHOICE HAS TWO DOORS. A person can say "любовь" or they can
 * walk up to the sphere; `choose()` and the recogniser race, and the
 * first real one wins. Voice is an ADDITION to the spatial interaction,
 * never a requirement of it — which is also what keeps the whole thing
 * usable with the sound off.
 *
 * No DOM, no timers of its own beyond the assistant's, no second world.
 */
import {
	BerxVoiceAssistant,
	type BerxHeard,
	type BerxVoiceMoment,
	type BerxVoiceUtterance,
} from './BerxVoiceAssistant';
import {
	BERX_INTENT_OBJECT,
	BERX_VOICE_CHOSEN,
	BERX_VOICE_IDENTITY,
	BERX_VOICE_NAME_ASK,
	BERX_VOICE_NOT_HEARD,
	BERX_VOICE_OFFER,
	BERX_VOICE_SILENT_PATH,
	BERX_VOICE_WAKING,
	berxVoiceNameHeard,
	berxVoiceWelcome,
	type BerxIntent,
} from './berxPhrases';
import {BERX_ARRIVAL_ID, berxApplyVoiceMoment, berxNameInLight, berxRegistrationScene} from './berxVoiceWorld';
import type {BerxSpatialObject} from '../world';

/** The words that really mean each intent, for a spoken choice. */
const INTENT_WORDS: Readonly<Record<BerxIntent, readonly string[]>> = Object.freeze({
	love: ['любов', 'любить', 'отношени'],
	friendship: ['друж', 'друз', 'друг'],
	creation: ['творч', 'создав', 'творит', 'искусств'],
	search: ['поиск', 'ищу', 'искать', 'не знаю'],
});

/**
 * Which sphere a spoken line meant, or none.
 *
 * Prefix matching on stems rather than whole words, because Russian
 * inflects every one of these and a table of full forms would be a
 * table that is wrong for the next speaker. Returns undefined when the
 * line matched nothing OR matched more than one — an ambiguous answer
 * is not a choice, and guessing between two would be inventing one.
 */
export function berxIntentFromSpeech(transcript: string): BerxIntent | undefined {
	const text = transcript.trim().toLowerCase();
	if (text === '') return undefined;
	const hits = (Object.keys(INTENT_WORDS) as BerxIntent[]).filter((intent) =>
		INTENT_WORDS[intent].some((stem) => text.includes(stem)),
	);
	return hits.length === 1 ? hits[0] : undefined;
}

/**
 * A name out of a spoken line.
 *
 * People answer "Как тебя зовут?" with "Меня зовут Анна" as often as
 * with "Анна". Strips only the openings that are certainly not names,
 * and then takes ONE word: a recogniser's trailing noise must not end
 * up written across the room in light.
 */
export function berxNameFromSpeech(transcript: string): string | undefined {
	let text = transcript.trim();
	if (text === '') return undefined;
	for (const opening of ['меня зовут', 'моё имя', 'мое имя', 'я ', 'это ']) {
		const lower = text.toLowerCase();
		if (lower.startsWith(opening)) {
			text = text.slice(opening.length).trim();
			break;
		}
	}
	const word = text.split(/[\s,.!?]+/).filter(Boolean)[0];
	if (!word) return undefined;
	/* letters only, and long enough to be a name rather than a stray
	   syllable the recogniser produced out of a breath */
	if (!/^[\p{L}][\p{L}\-']*$/u.test(word) || word.length < 2) return undefined;
	return word.charAt(0).toUpperCase() + word.slice(1);
}

export interface BerxRegistrationOutcome {
	intent?: BerxIntent;
	name?: string;
	/** True when the person got through without the voice hearing them. */
	silentPath: boolean;
	/** Every line spoken, in order. */
	spoken: readonly BerxVoiceUtterance[];
}

export interface BerxRegistrationVoiceOptions {
	assistant: BerxVoiceAssistant;
	/** Called whenever objects change. Only the changed ones are passed. */
	onWorld: (changed: BerxSpatialObject[]) => void;
	/** The scene's own objects. Defaults to a fresh registration scene. */
	scene?: BerxSpatialObject[];
	/** How long to wait for a spoken answer at each question. */
	listenMs?: number;
	now?: () => number;
}

/**
 * The registration conversation.
 *
 * Constructed with an assistant and a way to write to the world, then
 * `run()` once. `choose()` may be called at any time from a spatial
 * pick and takes precedence over anything still being listened for.
 */
export class BerxVoiceRegistration {
	private assistant: BerxVoiceAssistant;
	private readonly options: BerxRegistrationVoiceOptions;
	private readonly objects: BerxSpatialObject[];
	private handChoice?: BerxIntent;
	private silent = false;
	/** The one entity the voice is currently holding up, if any. */
	private lit?: string;

	constructor(options: BerxRegistrationVoiceOptions) {
		this.options = options;
		this.assistant = options.assistant;
		this.objects = options.scene ? [...options.scene] : berxRegistrationScene(this.now()).objects;
	}

	/** The world as this flow currently holds it. */
	get world(): readonly BerxSpatialObject[] {
		return this.objects;
	}

	/**
	 * Swap in the assistant that reports moments back to this flow.
	 *
	 * The wiring is circular by nature — the assistant needs a moment
	 * handler that only exists once the flow does — and this is the one
	 * honest way out of it, rather than a setter on the assistant that
	 * leaves a half-built object reachable.
	 */
	useAssistant(assistant: BerxVoiceAssistant): void {
		this.assistant = assistant;
	}

	/** A choice made with a hand, at any point. */
	choose(intent: BerxIntent): void {
		this.handChoice = intent;
	}

	/**
	 * The moment handler to give the assistant.
	 *
	 * Public because the caller constructs the assistant, and this must
	 * be the thing wired to `onMoment` for a spoken line to reach the
	 * world at all.
	 */
	readonly applyMoment = (moment: BerxVoiceMoment): void => {
		const changed = berxApplyVoiceMoment(moment, this.objects, this.now(), this.lit);
		/* remembered so the NEXT moment can put this one out — the voice
		   owns what it lifted and nothing else in the room */
		this.lit = moment.speaking ? moment.objectId : undefined;
		if (changed.length === 0) return;
		for (const object of changed) {
			const index = this.objects.findIndex((o) => o.id === object.id);
			if (index >= 0) this.objects[index] = object;
		}
		this.options.onWorld(changed);
	};

	async run(): Promise<BerxRegistrationOutcome> {
		const listenMs = this.options.listenMs ?? 8000;

		for (const line of BERX_VOICE_WAKING) await this.assistant.speak(line);

		/* The identity question is asked and NOT graded. Whatever comes
		   back only decides how the next lines are said — there is no
		   answer to it that is wrong, which is why nothing is stored. */
		await this.assistant.speak(BERX_VOICE_IDENTITY[0]);
		await this.assistant.speak(BERX_VOICE_IDENTITY[1]);

		for (const line of BERX_VOICE_OFFER) await this.assistant.speak(line);

		const intent = await this.chooseIntent(listenMs);
		if (intent === undefined) {
			return {intent: undefined, name: undefined, silentPath: true, spoken: this.assistant.transcript};
		}

		await this.assistant.speak(BERX_VOICE_CHOSEN[intent]);

		const heardName = await this.assistant.ask(BERX_VOICE_NAME_ASK, listenMs);
		const name = heardName ? berxNameFromSpeech(heardName.transcript) : undefined;
		if (name === undefined) {
			await this.notHeard();
			return {intent, name: undefined, silentPath: true, spoken: this.assistant.transcript};
		}

		/* The name is said back three times, and written in the world one
		   letter at a time as it is. The light follows the voice rather
		   than appearing when it finishes — that is the whole effect. */
		const lines = berxVoiceNameHeard(name, intent);
		for (let i = 0; i < lines.length; i++) {
			this.writeName(name, (i + 1) / lines.length);
			await this.assistant.speak(lines[i]);
		}
		this.writeName(name, 1);
		await this.assistant.speak(berxVoiceWelcome(name));

		return {intent, name, silentPath: this.silent, spoken: this.assistant.transcript};
	}

	/**
	 * The choice, from whichever door it comes through.
	 *
	 * A hand that has already chosen wins outright — a person who has
	 * walked to a sphere is not made to wait out a listening window.
	 */
	private async chooseIntent(listenMs: number): Promise<BerxIntent | undefined> {
		if (this.handChoice) return this.handChoice;
		/* the offer was the question; listening is all that is left to do */
		const heard: BerxHeard | undefined = await this.assistant.listen(listenMs);
		if (this.handChoice) return this.handChoice;
		const spoken = heard ? berxIntentFromSpeech(heard.transcript) : undefined;
		if (spoken) return spoken;
		await this.notHeard();
		return this.handChoice;
	}

	/** Said once, then the silent path. Never a retry loop. */
	private async notHeard(): Promise<void> {
		if (this.silent) return;
		this.silent = true;
		for (const line of BERX_VOICE_NOT_HEARD) await this.assistant.speak(line);
		for (const line of BERX_VOICE_SILENT_PATH) await this.assistant.speak(line);
	}

	/**
	 * The name in light, at the viewer's own height.
	 *
	 * Letters are added to the world rather than replacing it, and
	 * re-written on every progress step so the caller sees a normal
	 * object update — the same path a server change takes.
	 */
	private writeName(name: string, progress: number): void {
		const arrival = this.objects.find((o) => o.id === BERX_ARRIVAL_ID);
		const origin = arrival
			? {x: arrival.transform.position.x, y: arrival.transform.position.y + 0.2, z: arrival.transform.position.z - 1.2}
			: {x: 0, y: 0.2, z: -1.2};
		const letters = berxNameInLight(name, progress, origin, this.now());
		for (const letter of letters) {
			const index = this.objects.findIndex((o) => o.id === letter.id);
			if (index >= 0) this.objects[index] = letter;
			else this.objects.push(letter);
		}
		this.options.onWorld(letters);
	}

	private now(): number {
		return this.options.now ? this.options.now() : Date.now();
	}
}

/** The ids of the four spheres, for a caller wiring spatial picks. */
export const BERX_REGISTRATION_SPHERES = BERX_INTENT_OBJECT;
