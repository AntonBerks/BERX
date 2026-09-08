/**
 * BERX SPATIAL MEMORY — what this conversation has already established.
 *
 * A person who has just been shown five bars and says "убери этот" has
 * said something completely specific. So has one who follows it with "а
 * второй?". Neither sentence contains a name, an id or a description,
 * and neither is ambiguous — because the referent is in the room, and
 * the room is shared.
 *
 * This is that shared room, written down. It is deliberately NOT a
 * conversation history and deliberately NOT a model of the person: it is
 * the set the runtime last put in front of them, in the order it put it,
 * plus what they have done to it since. Every reference resolves to an
 * id that is in this object or it does not resolve at all.
 *
 * NO GUESSING, and that is the entire design rule. "Второй" is
 * `shown[1]` or it is nothing. "Этот" is the focused entity or it is
 * nothing. When it is nothing the right behaviour is to say so and ask —
 * which reads as attentive, where a wrong guess reads as a machine
 * pretending to understand, and costs far more trust than a question
 * does.
 *
 * WHY A SEPARATE MODULE FROM THE WORLD STATE. The world state is what is
 * TRUE — where the camera is, what is drawn. This is what has been
 * SAID — what was offered, what was refused. A place can be visible and
 * dismissed at the same time, and conflating the two would make
 * "убери этот" un-undoable and "покажи ещё" impossible to answer.
 */

/** One thing that was put in front of the person, in the order it was. */
export interface BerxShown {
	id: string;
	/** What the runtime called it when it showed it. */
	label?: string;
	/** Which turn of the conversation produced it. */
	turn: number;
}

export interface BerxSpatialMemory {
	/**
	 * The current set, in the order it was presented.
	 *
	 * Presentation order, not distance order — because that is the order
	 * the person saw and therefore the order they are counting in. If the
	 * runtime showed the three nearest, the ordering happens to agree;
	 * if it showed the three most alive, it does not, and the person
	 * counts what they were shown.
	 */
	shown: readonly BerxShown[];
	/** Ids the person has explicitly refused. Never re-offered in this set. */
	dismissed: readonly string[];
	/** The id they picked, if they have picked one. */
	selected?: string;
	/** What they have asked, most recent last. Verbatim, never summarised. */
	asked: readonly string[];
	/** How many exchanges deep this conversation is. */
	turn: number;
	/**
	 * What the last real REQUEST was, by intent kind.
	 *
	 * Kept because a correction is not a new request: "нет, только
	 * итальянские" only means anything against the thing it corrects, and
	 * without this the refinement had nothing to carry forward and
	 * started from a hardcoded default. `asked` holds the words; this
	 * holds what they turned out to mean.
	 */
	requested?: string;
}

export const BERX_EMPTY_MEMORY: BerxSpatialMemory = Object.freeze({
	shown: [],
	dismissed: [],
	asked: [],
	turn: 0,
});

/**
 * How many past questions are kept.
 *
 * Six: enough for "нет, слишком спокойно" to still know what it is
 * refining, and short enough that nothing here could be mistaken for a
 * record of the person. Working memory for a conversation happening now.
 */
export const BERX_ASKED_KEPT = 6;

/** A new set replaces the old one, and clears what was refused about it. */
export function berxShow(
	memory: BerxSpatialMemory,
	entities: readonly {id: string; label?: string}[],
): BerxSpatialMemory {
	const turn = memory.turn + 1;
	return {
		...memory,
		turn,
		shown: entities.map((e) => ({id: e.id, label: e.label, turn})),
		/* A dismissal was about the last set. Carrying it into a new one
		   would mean a place refused for tonight is refused forever, which
		   is a memory nobody asked for. */
		dismissed: [],
		selected: undefined,
	};
}

/** The person refused this one. It leaves the set and does not come back. */
export function berxDismiss(memory: BerxSpatialMemory, id: string): BerxSpatialMemory {
	if (!memory.shown.some((s) => s.id === id)) return memory;
	return {
		...memory,
		shown: memory.shown.filter((s) => s.id !== id),
		dismissed: [...memory.dismissed, id],
		selected: memory.selected === id ? undefined : memory.selected,
	};
}

export function berxSelect(memory: BerxSpatialMemory, id: string): BerxSpatialMemory {
	if (!memory.shown.some((s) => s.id === id)) return memory;
	return {...memory, selected: id};
}

export function berxAsked(memory: BerxSpatialMemory, text: string): BerxSpatialMemory {
	return {...memory, asked: [...memory.asked, text].slice(-BERX_ASKED_KEPT)};
}

/**
 * Record what a request turned out to MEAN, so a correction has
 * something to correct.
 *
 * Only real requests. A refinement does not overwrite what it refines —
 * "покажи события" then "нет, вечером" then "нет, завтра" is three
 * corrections of ONE request, and each of them needs the original, not
 * the one before it. Nor does an action: dismissing something does not
 * change what was being looked for.
 */
export function berxRequested(memory: BerxSpatialMemory, kind: string): BerxSpatialMemory {
	if (kind === 'refine' || kind === 'unknown' || kind === 'dismiss'
		|| kind === 'open' || kind === 'back') {
		return memory;
	}
	return {...memory, requested: kind};
}

/**
 * The nth thing that was shown, one-based, as a person counts.
 *
 * After a dismissal the set renumbers, and that is correct: someone who
 * removed the first one and then says "второй" means the second of what
 * is in front of them NOW. Anything else would require them to remember
 * a list they can no longer see.
 */
export function berxNthShown(memory: BerxSpatialMemory, n: number): BerxShown | undefined {
	if (!Number.isInteger(n) || n < 1) return undefined;
	return memory.shown[n - 1];
}

/**
 * Every id this memory could resolve a reference to.
 *
 * The action layer checks against this before executing anything: a
 * reference that does not appear here is not a reference, and the honest
 * response is a question rather than a best guess.
 */
export function berxResolvable(memory: BerxSpatialMemory): string[] {
	return memory.shown.map((s) => s.id);
}
