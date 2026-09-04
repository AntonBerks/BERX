/**
 * Minimal, dependency-free color math for the spatial runtime.
 *
 * Only what the material/lighting resolvers actually need: parse a
 * hex or rgb()/rgba() string, emit rgba(), mix two colors, and
 * measure WCAG contrast so the accessibility fallback in
 * materials.ts can be a real measurement rather than a guess.
 */

export interface BerxRgb {
	r: number;
	g: number;
	b: number;
	a: number;
}

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]*)\s*)?\)$/i;

export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

export function round(value: number, decimals = 3): number {
	const f = Math.pow(10, decimals);
	return Math.round(value * f) / f;
}

/** Returns null rather than throwing — callers decide the fallback. */
export function parseColor(input: string): BerxRgb | null {
	const value = input.trim();
	const hex3 = HEX3.exec(value);
	if (hex3) {
		return {
			r: parseInt(hex3[1] + hex3[1], 16),
			g: parseInt(hex3[2] + hex3[2], 16),
			b: parseInt(hex3[3] + hex3[3], 16),
			a: 1,
		};
	}
	const hex6 = HEX6.exec(value);
	if (hex6) {
		return {r: parseInt(hex6[1], 16), g: parseInt(hex6[2], 16), b: parseInt(hex6[3], 16), a: 1};
	}
	const fn = RGB_FN.exec(value);
	if (fn) {
		const alphaRaw = fn[4];
		return {
			r: clamp(parseFloat(fn[1]), 0, 255),
			g: clamp(parseFloat(fn[2]), 0, 255),
			b: clamp(parseFloat(fn[3]), 0, 255),
			a: alphaRaw === undefined || alphaRaw === '' ? 1 : clamp(parseFloat(alphaRaw), 0, 1),
		};
	}
	return null;
}

export function rgba(color: string, alpha: number): string {
	const c = parseColor(color);
	const a = round(clamp(alpha, 0, 1));
	if (!c) return `rgba(255,255,255,${a})`;
	return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${a})`;
}

export function toCss(c: BerxRgb): string {
	return c.a >= 1
		? `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`
		: `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${round(c.a)})`;
}

/** Source-over composite of `top` onto opaque `bottom`. */
export function composite(top: BerxRgb, bottom: BerxRgb): BerxRgb {
	const a = top.a + bottom.a * (1 - top.a);
	if (a === 0) return {r: 0, g: 0, b: 0, a: 0};
	return {
		r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
		g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
		b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
		a,
	};
}

export function mix(a: string, b: string, t: number): string {
	const ca = parseColor(a);
	const cb = parseColor(b);
	if (!ca || !cb) return a;
	const k = clamp(t, 0, 1);
	return toCss({
		r: ca.r + (cb.r - ca.r) * k,
		g: ca.g + (cb.g - ca.g) * k,
		b: ca.b + (cb.b - ca.b) * k,
		a: ca.a + (cb.a - ca.a) * k,
	});
}

function channelLuminance(v: number): number {
	const s = v / 255;
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG 2.x relative luminance. Alpha is ignored — composite first. */
export function relativeLuminance(color: string): number {
	const c = parseColor(color);
	if (!c) return 0;
	return (
		0.2126 * channelLuminance(c.r) + 0.7152 * channelLuminance(c.g) + 0.0722 * channelLuminance(c.b)
	);
}

/**
 * WCAG 2.x contrast ratio, 1..21. Both inputs must already be
 * opaque; use `flatten()` for translucent glass over a known ground.
 */
export function contrastRatio(foreground: string, background: string): number {
	const l1 = relativeLuminance(foreground);
	const l2 = relativeLuminance(background);
	const light = Math.max(l1, l2);
	const dark = Math.min(l1, l2);
	return round((light + 0.05) / (dark + 0.05), 2);
}

/** Composite a translucent color over an opaque ground and return the opaque result. */
export function flatten(over: string, ground: string): string {
	const top = parseColor(over);
	const bottom = parseColor(ground);
	if (!top || !bottom) return ground;
	return toCss(composite(top, {...bottom, a: 1}));
}
