/**
 * BERX EXPOSURE — why the world was graphite on a graphite void.
 *
 * THE DIAGNOSIS, measured rather than felt. BERX's palette was authored
 * as APPEARANCES: #15191E is what a surface should LOOK like. The
 * renderer uses those same numbers as ALBEDOS — what a surface
 * REFLECTS. Those are different quantities, and the difference is the
 * light: a surface of albedo A under transport L appears at A·L, so
 * every colour in the product arrived on screen darker than it was
 * drawn by exactly the factor the room dims it.
 *
 * Measured on a real frame: a lit pearl orb returns 0.339 of its own
 * albedo (BERX_SCENE_TRANSPORT). Graphite #15191E has an albedo of
 * 0.082, so its best case was 0.082 × 0.339 = 0.0278 — 7.1 out of 255,
 * against a background of 7. The object and the void were the same
 * colour to within half a code value. Nothing was wrong with the
 * shading; the frame was under-exposed by the reciprocal of its own
 * light.
 *
 * SO THE GAIN IS NOT A TASTE. It is 1/L: the number that makes a
 * surface authored as a colour appear as that colour. It is derived
 * here rather than typed, and a gate re-measures L on a real frame and
 * fails if this constant has drifted from its reciprocal — so a change
 * to the lighting cannot silently leave the exposure stale.
 *
 * AND A GAIN ALONE WOULD CLIP. The accent #4FD6E8 is (0.31, 0.84,
 * 0.91); multiplied by three its green and blue pass 1.0 and flatten
 * into a single white, which would trade one failure for a worse one —
 * a dark world becomes a blown one, and blown highlights destroy hue
 * where darkness only hides it. So the gain is followed by a shoulder:
 * a curve that keeps rising where a clamp would stop, so 2.5 and 4.0
 * stay different numbers on screen instead of both being white.
 *
 * WHERE IT RUNS. Once, at the very end, on a linear HDR frame — after
 * the air, because in-scatter is light and light is part of what is
 * being exposed. Tone-mapping the surfaces and then adding the air
 * would put unmapped values on top of mapped ones, which is not a
 * brighter picture, it is two different pictures added together.
 */

/**
 * How much of a surface's own albedo comes back to the eye, measured.
 *
 * From a real frame: the lit pearl orb over its own albedo. It is the
 * whole light transport of the room — key, ambient, environment — as
 * one number, which is all the exposure needs to know.
 *
 * A gate measures this again on a live frame. If the lighting changes
 * and this does not, the gate says so rather than the world quietly
 * going dark again.
 */
export const BERX_SCENE_TRANSPORT = 0.339;

/**
 * The exposure gain: the reciprocal of the transport above.
 *
 * ~2.95. Not "about three because three looked right" — the number
 * that undoes the dimming, so what was authored is what appears.
 */
export const BERX_EXPOSURE = 1 / BERX_SCENE_TRANSPORT;

/**
 * The shoulder — the ACES filmic fit (Narkowicz), the same five
 * constants in four languages.
 *
 * Chosen over a Reinhard curve because of what it does to HUE, which
 * is the thing a brand palette cannot afford to lose: as a colour
 * brightens past white this desaturates it toward white the way film
 * does, rather than clipping each channel independently and turning a
 * bright teal into a bright cyan and then into a flat white.
 *
 * It also lifts the middle: f(0.18) = 0.267, so mid-grey comes out
 * brighter than it went in. That is part of the fit and is why the
 * gain does not need to be larger than the transport says.
 */
const ACES_A = 2.51;
const ACES_B = 0.03;
const ACES_C = 2.43;
const ACES_D = 0.59;
const ACES_E = 0.14;

/** One channel through the shoulder. Exported so a gate can plot it. */
export function berxShoulder(x: number): number {
	const v = Math.max(0, x);
	const mapped = (v * (ACES_A * v + ACES_B)) / (v * (ACES_C * v + ACES_D) + ACES_E);
	return Math.min(1, Math.max(0, mapped));
}

/**
 * Linear radiance, unbounded above.
 *
 * Deliberately not `BerxRgb` from color.ts: that one is a UI colour
 * with an alpha, clamped to what a screen can show. This is light
 * before anything has decided how to show it, and 2.7 is a legal
 * value here and meaningless there.
 */
/**
 * The radiance that will LOOK like this, once exposed.
 *
 * The inverse of the shoulder, divided by the gain — and the function
 * that fixes an error the first exposed frame made obvious. BERX's
 * palette is used two different ways, and only one of them is an
 * albedo:
 *
 *   AN OBJECT'S colour is a reflectance. It arrives on screen at
 *   albedo x transport, which is what was too dark and what the gain
 *   is for.
 *
 *   THE ENVIRONMENT'S colours — horizon, zenith, ground, sun — and the
 *   clear colour are RADIANCE. They already arrive on screen as
 *   authored. Multiplying them by the gain does not correct anything;
 *   it just makes the void three times lighter than the void was
 *   designed to be, and a #07080A background rendered as mid-grey is
 *   not an exposure, it is a fog.
 *
 * So an appearance passes through this on its way to being radiance,
 * and comes back out of the tone-map as itself. Applied where the
 * environment is built, once, rather than special-cased in three
 * shaders.
 */
export function berxRadianceFor(appearance: number): number {
	const y = Math.min(1 - 1e-6, Math.max(0, appearance));
	/* Solving (a x^2 + b x) = y (c x^2 + d x + e) for x: a quadratic,
	   and the positive root is the only one on the curve. */
	const qa = ACES_A - y * ACES_C;
	const qb = ACES_B - y * ACES_D;
	const qc = -y * ACES_E;
	const disc = qb * qb - 4 * qa * qc;
	if (disc <= 0 || qa === 0) return appearance / BERX_EXPOSURE;
	const x = (-qb + Math.sqrt(disc)) / (2 * qa);
	return Math.max(0, x) / BERX_EXPOSURE;
}

export interface BerxLinearRgb {
	r: number;
	g: number;
	b: number;
}

/**
 * A linear HDR colour, as it will appear.
 *
 * THE ORACLE. This is the function the three backends implement, and a
 * gate predicts real pixels with it and compares them against GPU
 * readback. That is what makes "the backends agree" a weaker claim than
 * "the backends compute what the core says" — two renderers can agree
 * perfectly on the wrong answer.
 */
export function berxExpose(linear: BerxLinearRgb, exposure = BERX_EXPOSURE): BerxLinearRgb {
	return {
		r: berxShoulder(linear.r * exposure),
		g: berxShoulder(linear.g * exposure),
		b: berxShoulder(linear.b * exposure),
	};
}

/**
 * What a surface of this albedo will look like, end to end.
 *
 * albedo → transport → exposure → shoulder. The function the palette
 * argument is settled with: BERX_BACKGROUND against a graphite slab was
 * 7 versus 7 out of 255, and this says what each becomes.
 */
export function berxAppearance(albedo: number, transport = BERX_SCENE_TRANSPORT): number {
	return berxShoulder(albedo * transport * BERX_EXPOSURE);
}

/**
 * Is a surface of this albedo distinguishable from this background?
 *
 * The real question the exposure exists to answer, in the units a
 * person's eye works in: a difference of about 2/255 is the floor of
 * what is visible on a good screen in a dark room, and the graphite
 * slab was managing 0.1.
 */
export const BERX_VISIBLE_STEP = 2 / 255;

export function berxSeparates(albedo: number, backgroundAlbedo: number): boolean {
	return Math.abs(berxAppearance(albedo) - berxAppearance(backgroundAlbedo)) >= BERX_VISIBLE_STEP;
}
