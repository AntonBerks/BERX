/**
 * BERX ACCENT MATH — real colour derivation for a user-chosen accent.
 *
 * Every derived field the old fixed-Aquamarine token set carried by
 * hand (accentHover, accentSoft, onAccent's ink) has to become a real
 * FUNCTION of whichever accent is actually selected, or four of the
 * five choices would silently keep Aquamarine's own hand-picked
 * hover/soft/ink values, which is not what "the user picked Purple"
 * means. Plain TypeScript, no platform import, so it's safe wherever
 * accentColors itself is (native, web, a future settings preview).
 */

interface Rgb {
	r: number;
	g: number;
	b: number;
}

function hexToRgb(hex: string): Rgb {
	const clean = hex.replace('#', '');
	return {
		r: parseInt(clean.slice(0, 2), 16),
		g: parseInt(clean.slice(2, 4), 16),
		b: parseInt(clean.slice(4, 6), 16),
	};
}

function toHex(n: number): string {
	return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function rgbToHex({r, g, b}: Rgb): string {
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** WCAG relative luminance — real formula (sRGB gamma-correct), not a brightness average. */
function relativeLuminance({r, g, b}: Rgb): number {
	const chan = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** Real rgba() string at a given alpha, from a hex colour. */
export function accentAlpha(hex: string, alpha: number): string {
	const {r, g, b} = hexToRgb(hex);
	return `rgba(${r},${g},${b},${alpha})`;
}

/** Linear-mixes two real hex colours by `t` (0..1, 0 = all `a`, 1 = all `b`). */
export function mixHex(a: string, b: string, t: number): string {
	const ca = hexToRgb(a);
	const cb = hexToRgb(b);
	return rgbToHex({r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t});
}

/** Blends toward white by `t` (0..1) — a real hover state, not the same colour repeated. */
export function accentHover(hex: string, t = 0.2): string {
	return mixHex(hex, '#FFFFFF', t);
}

/**
 * The real ink that reads on top of a solid fill of this accent —
 * WCAG luminance decides light vs dark ink per accent, rather than one
 * hardcoded ink that only happened to work for Aquamarine. `darkInk`/
 * `lightInk` are the environment's own real bg/text tokens, passed in
 * rather than assumed, so Day and Night each get their own correct
 * pair.
 */
export function accentInk(hex: string, darkInk: string, lightInk: string): string {
	return relativeLuminance(hexToRgb(hex)) > 0.42 ? darkInk : lightInk;
}

/** Real WCAG contrast ratio between two hex colours (1 = identical, 21 = black on white). */
export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(hexToRgb(a));
	const lb = relativeLuminance(hexToRgb(b));
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * The same accent, deepened (or lifted) just far enough to actually
 * read against a given surface.
 *
 * Why this is a function and not a second hand-picked hex per accent:
 * BERX's Day environment is now a real WHITE ground (see tokens/
 * index.ts), and Aquamarine #00E5CC against white is a contrast ratio
 * of about 1.6 — genuinely unreadable as text or an icon, not a
 * stylistic preference. Hand-tuning five "day variants" would be five
 * numbers to keep in sync with any future accent; this walks the real
 * colour toward the surface's opposite in small steps and stops at the
 * first one that MEASURES as passing, so every accent — including one
 * added later — gets a correct Day form for free.
 *
 * `target` defaults to 4.5 (WCAG AA for normal text). Callers styling
 * large display type may pass 3.
 */
export function ensureContrast(hex: string, against: string, target = 4.5): string {
	if (contrastRatio(hex, against) >= target) return hex;
	// Walk toward whichever pole the surface is NOT, so an accent on a
	// white ground darkens and the same accent on black lightens.
	const pole = relativeLuminance(hexToRgb(against)) > 0.5 ? '#000000' : '#FFFFFF';
	for (let t = 0.05; t <= 1; t += 0.05) {
		const candidate = mixHex(hex, pole, t);
		if (contrastRatio(candidate, against) >= target) return candidate;
	}
	return pole;
}
