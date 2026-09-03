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
