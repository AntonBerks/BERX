/**
 * WHAT LANGUAGE BERX SPEAKS, AND WHAT IT DOES NOT.
 *
 * The product is Russian. Not "primarily Russian" — Russian, in every
 * string a person ever sees, and this file exists so that fact is
 * MEASURABLE rather than implicit in a thousand string literals.
 *
 * THREE THINGS ARE SEPARATE AND WERE BEING CONFLATED.
 *
 *   1. INFRASTRUCTURE — how a locale is resolved, which way text runs,
 *      how a number, a date and a currency are written. This is real
 *      and complete here for every locale, because `Intl` does it and
 *      needs no translated content at all. A person whose browser is
 *      set to German gets German dates and German number grouping the
 *      moment this is wired, whether or not a single word has been
 *      translated.
 *
 *   2. CONTENT — the words. There is exactly one language of content:
 *      `ru`. `berxLocaleCoverage` says so with a number, and
 *      `berxTranslate` REPORTS a miss rather than silently falling
 *      back, so a half-translated build is visible instead of looking
 *      finished.
 *
 *   3. A CLAIM — "BERX supports six languages". Nothing here makes that
 *      claim and nothing here can be edited into making it: a locale is
 *      only listed as covered when its catalogue really has the keys.
 *
 * NO MACHINE TRANSLATION IS SEEDED. Five empty catalogues are an honest
 * statement of where the product is; five catalogues of unreviewed
 * machine output would read as finished and be wrong in ways nobody
 * would find until a person read them.
 */

/** The locales BERX has infrastructure for. Content is a separate question. */
export type BerxLocale = 'ru' | 'en' | 'de' | 'fr' | 'es' | 'ar';

export const BERX_LOCALES: readonly BerxLocale[] = ['ru', 'en', 'de', 'fr', 'es', 'ar'] as const;

/** The one locale whose content is complete, and the fallback for every other. */
export const BERX_SOURCE_LOCALE: BerxLocale = 'ru';

/**
 * Which way the text runs.
 *
 * Arabic is the only right-to-left locale in the list. This is not a
 * cosmetic flag: `dir` on the document root reverses the layout of every
 * DOM element BERX owns — the sign-in form, the composer, the live
 * region — and a product that translated the words and left the
 * direction alone would be harder to read than one that had not been
 * translated at all.
 *
 * The WORLD does not flip. A world has real space with real
 * handedness, and mirroring it would move every entity to the wrong
 * side of every other entity. Text direction is a property of text.
 */
export function berxLocaleDirection(locale: BerxLocale): 'ltr' | 'rtl' {
	return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * The locale to use, from what the browser actually asks for.
 *
 * `navigator.languages` in order, matched by primary subtag, so `de-AT`
 * resolves to `de` and `en-GB` to `en`. Anything BERX has no
 * infrastructure for resolves to the source locale rather than to a
 * blank product.
 */
export function berxResolveLocale(requested: readonly string[] | undefined): BerxLocale {
	for (const tag of requested ?? []) {
		const primary = String(tag).toLowerCase().split('-')[0];
		const found = BERX_LOCALES.find((l) => l === primary);
		if (found) return found;
	}
	return BERX_SOURCE_LOCALE;
}

/** One catalogue: message id to text. Missing keys are missing content. */
export type BerxMessages = Readonly<Record<string, string>>;

/**
 * What was asked for, what was answered, and whether it was a miss.
 *
 * A translation function that returns a string and nothing else cannot
 * be audited: every miss looks like a hit in the source language. This
 * returns the fact as well as the text.
 */
export interface BerxTranslation {
	text: string;
	/** The locale the text actually came from. */
	from: BerxLocale;
	/** True when the asked-for locale had no text for this id. */
	fellBack: boolean;
}

export interface BerxCatalogues {
	readonly [locale: string]: BerxMessages;
}

/**
 * Translate, and say what happened.
 *
 * `onMiss` is how a deployment finds out it is shipping a half-built
 * language: wire it to whatever collects diagnostics and every gap
 * announces itself once, with its id and the locale that wanted it.
 */
export function berxTranslate(
	catalogues: BerxCatalogues,
	locale: BerxLocale,
	id: string,
	onMiss?: (id: string, locale: BerxLocale) => void,
): BerxTranslation {
	const wanted = catalogues[locale]?.[id];
	if (wanted !== undefined) return {text: wanted, from: locale, fellBack: false};
	if (locale !== BERX_SOURCE_LOCALE) onMiss?.(id, locale);
	const source = catalogues[BERX_SOURCE_LOCALE]?.[id];
	/* the id itself, never an empty string: an empty label draws a
	   blank affordance, and a blank affordance is worse than an
	   untranslated one */
	return {text: source ?? id, from: BERX_SOURCE_LOCALE, fellBack: true};
}

/**
 * How much of each language really exists, as a fraction of the source.
 *
 * The number a claim about language support has to survive. Computed
 * from the catalogues rather than declared beside them, so it cannot
 * drift from what is actually there.
 */
export function berxLocaleCoverage(catalogues: BerxCatalogues): {locale: BerxLocale; keys: number; of: number; complete: boolean}[] {
	const source = Object.keys(catalogues[BERX_SOURCE_LOCALE] ?? {});
	return BERX_LOCALES.map((locale) => {
		const have = catalogues[locale] ?? {};
		const keys = source.filter((id) => have[id] !== undefined).length;
		return {locale, keys, of: source.length, complete: source.length > 0 && keys === source.length};
	});
}

/**
 * A number, a date, a time and a money amount, in the locale's own
 * conventions.
 *
 * These need no translated content and they are the half of
 * localisation that is most often missed: 1 234,56 in Russian, 1,234.56
 * in English, 1.234,56 in German, and a date order that differs in all
 * three. `Intl` is the browser's own data and is correct for every
 * locale in the list.
 *
 * The currency is a PARAMETER and has no default. BERX has no payment
 * system, so there is no BERX currency to assume, and assuming one
 * would be inventing a price.
 */
export function berxFormatNumber(locale: BerxLocale, value: number): string {
	return new Intl.NumberFormat(locale).format(value);
}

export function berxFormatMoney(locale: BerxLocale, value: number, currency: string): string {
	return new Intl.NumberFormat(locale, {style: 'currency', currency}).format(value);
}

/**
 * A moment in time, where the person actually is.
 *
 * `timeZone` is passed through rather than left to the runtime default
 * so a server-rendered string and a browser-rendered one cannot differ,
 * and so a gate can assert a known zone. Undefined means the
 * environment's own zone, which is right in a browser.
 */
export function berxFormatDateTime(
	locale: BerxLocale,
	atSeconds: number,
	options: Intl.DateTimeFormatOptions = {dateStyle: 'medium', timeStyle: 'short'},
): string {
	return new Intl.DateTimeFormat(locale, options).format(new Date(atSeconds * 1000));
}

/** How long ago, in the locale's own words. Real Intl, no phrase table. */
export function berxFormatRelative(locale: BerxLocale, seconds: number): string {
	const rtf = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'});
	const abs = Math.abs(seconds);
	if (abs < 60) return rtf.format(Math.round(seconds), 'second');
	if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
	if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
	if (abs < 2592000) return rtf.format(Math.round(seconds / 86400), 'day');
	if (abs < 31536000) return rtf.format(Math.round(seconds / 2592000), 'month');
	return rtf.format(Math.round(seconds / 31536000), 'year');
}
