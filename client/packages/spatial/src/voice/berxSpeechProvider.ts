/**
 * SPEECH, FROM WHOEVER CAN ACTUALLY DO IT.
 *
 * BerxVoiceBackend is the seam the world runtime speaks through, and it
 * is the right seam: the assistant hands over text and prosody and gets
 * back a promise that resolves when the line has finished. Nothing above
 * it knows or cares what made the sound.
 *
 * What it could not express is everything a deployment needs to decide
 * WHICH provider to use, and that gap is why there is no real
 * text-to-speech in BERX today rather than merely no contract for one:
 *
 *   Language. `BerxWebVoice` takes a language once, at construction. A
 *   world that is spoken to in Russian and answers a French speaker in
 *   Russian is not multilingual, and a provider with a French voice
 *   cannot be asked for it.
 *
 *   Whether the audio leaves the device. Chromium's recogniser posts
 *   what it hears to a Google service. That is a fact a person is
 *   entitled to know before a microphone opens, and a shell cannot
 *   surface a fact the interface will not carry.
 *
 *   What happens when a provider fails. A remote voice is a network
 *   call: it times out, it rate-limits, it returns 503. Falling back to
 *   the platform's own synthesiser is the correct behaviour and it has
 *   to be somebody's job.
 *
 * So: a provider describes itself, and a chain of providers presents
 * itself as one backend. Nothing in @berx/spatial ships a provider —
 * there is no BERX voice service and inventing one would be inventing
 * content — and nothing here degrades to a fake. A chain with nothing
 * in it that can speak reports `available: false`, which is the silent
 * path the assistant already handles, and every capability BERX has is
 * reachable from the keyboard and from a finger anyway.
 */
import type {BerxHeard, BerxVoiceBackend, BerxVoiceProsody} from './BerxVoiceAssistant';

/** What a provider can really do, in its own words. */
export interface BerxSpeechCapability {
	/** Stable identifier, for a log and for a gate. */
	readonly id: string;
	readonly speaks: boolean;
	readonly listens: boolean;
	/**
	 * True where the text or the audio leaves the device.
	 *
	 * Reported, never buried. A shell is expected to say so before a
	 * microphone opens — see BerxWebVoice.requiresNetwork, which is the
	 * same fact about Chromium's recogniser.
	 */
	readonly offDevice: boolean;
	/**
	 * BCP-47 tags this provider really has a voice for.
	 *
	 * Empty means it has not said — a platform synthesiser whose voice
	 * list has not loaded yet is the common case — and is treated as
	 * "ask it and find out" rather than as "no".
	 */
	readonly languages: readonly string[];
}

export interface BerxSpeechProvider extends BerxVoiceBackend {
	readonly capability: BerxSpeechCapability;
	/**
	 * Speak in a named language.
	 *
	 * Optional: a provider with one voice implements `speak` and nothing
	 * else, and the chain will not send it a language it never claimed.
	 */
	speakIn?(text: string, prosody: BerxVoiceProsody, language: string): Promise<void>;
}

export interface BerxSpeechChainOptions {
	/** The language to speak, until something says otherwise. BCP-47. */
	language?: string;
	/**
	 * Told which provider served each line, and what any failure was.
	 *
	 * A deployment that has paid for a voice needs to know when it is
	 * silently not being used, and a fallback that nobody can see is a
	 * fallback nobody will fix.
	 */
	onProvider?: (id: string, what: 'spoke' | 'listened' | 'failed', detail?: string) => void;
}

export interface BerxSpeechChain extends BerxSpeechProvider {
	/** Every provider, in the order they are tried. */
	readonly providers: readonly BerxSpeechCapability[];
	/** Which one last spoke, if any has. */
	readonly using?: string;
	/** The language lines are being spoken in. */
	readonly language: string;
	/** Speak a different language from now on. */
	setLanguage(tag: string): void;
}

/** Does this provider claim a voice for this language? Silence means maybe. */
function claims(capability: BerxSpeechCapability, language: string): boolean {
	if (capability.languages.length === 0) return true;
	const want = language.toLowerCase();
	const base = want.split('-')[0];
	return capability.languages.some((tag) => {
		const has = tag.toLowerCase();
		return has === want || has.split('-')[0] === base;
	});
}

/**
 * Several providers, in preference order, as one BerxVoiceBackend.
 *
 * A real deployment lists its paid voice first and the platform's own
 * second: the good voice is used when it works and the world still
 * talks when it does not. The order is the caller's — this makes no
 * judgement about whose voice is better.
 */
export function berxSpeechChain(
	providers: readonly BerxSpeechProvider[],
	options: BerxSpeechChainOptions = {},
): BerxSpeechChain {
	let language = options.language ?? 'ru-RU';
	let using: string | undefined;

	const speakers = () => providers.filter((p) => p.capability.speaks && p.available);
	const listeners = () => providers.filter((p) => p.capability.listens);

	return {
		get capability(): BerxSpeechCapability {
			const all = providers.map((p) => p.capability);
			return {
				id: all.length === 1 ? all[0].id : `chain(${all.map((c) => c.id).join(',')})`,
				speaks: speakers().length > 0,
				listens: listeners().length > 0,
				/* if ANY provider that might be used leaves the device, the
				   chain does: the honest answer is the pessimistic one */
				offDevice: all.some((c) => c.offDevice),
				languages: [...new Set(all.flatMap((c) => c.languages))],
			};
		},
		get providers() {
			return providers.map((p) => p.capability);
		},
		get using() {
			return using;
		},
		get language() {
			return language;
		},
		setLanguage(tag: string) {
			language = tag;
		},
		get available() {
			return speakers().length > 0;
		},

		async speak(text: string, prosody: BerxVoiceProsody): Promise<void> {
			const wanted = speakers().filter((p) => claims(p.capability, language));
			/* nobody claims this language: try everyone anyway rather than
			   go silent, because a provider's declared list can be stale
			   and a wrong accent is better than nothing said */
			const order = wanted.length > 0 ? wanted : speakers();
			for (const provider of order) {
				try {
					if (provider.speakIn) await provider.speakIn(text, prosody, language);
					else await provider.speak(text, prosody);
					using = provider.capability.id;
					options.onProvider?.(provider.capability.id, 'spoke');
					return;
				} catch (error) {
					options.onProvider?.(provider.capability.id, 'failed', error instanceof Error ? error.message : String(error));
				}
			}
			/* Every provider refused. The line is not spoken and that is
			   reported — it is NOT swallowed, and nothing pretends. */
			if (order.length === 0) options.onProvider?.('none', 'failed', 'no provider can speak');
		},

		async listen(timeoutMs: number): Promise<BerxHeard | undefined> {
			for (const provider of listeners()) {
				try {
					const heard = await provider.listen(timeoutMs);
					if (heard) {
						options.onProvider?.(provider.capability.id, 'listened');
						return heard;
					}
				} catch (error) {
					options.onProvider?.(provider.capability.id, 'failed', error instanceof Error ? error.message : String(error));
				}
			}
			return undefined;
		},

		stop(): void {
			/* everyone, not just whoever is speaking: a person who wants
			   silence gets it from the whole chain */
			for (const provider of providers) {
				try {
					provider.stop();
				} catch {
					/* a provider that cannot stop must not stop the others */
				}
			}
		},
	};
}
