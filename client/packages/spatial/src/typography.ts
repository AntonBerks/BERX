/**
 * BERX type.
 *
 * The archive's screens are not made of boxes. They are made of
 * objects in a room, and what separates one piece of information from
 * the next inside an object is type — size, weight, tracking and
 * colour — not another border around it. Until now every screen
 * picked raw sizes out of the token file, so the only way a screen
 * could show hierarchy was to draw one more card, which is exactly
 * the generic dashboard the archive rejects.
 *
 * Two things make this a system rather than a size list:
 *
 *   TRACKING FOLLOWS SIZE. Letterforms need less space between them
 *   as they grow and more as they shrink. Display type is tracked in,
 *   micro type is tracked out, and the values here are the optical
 *   corrections that make 34px and 11px look like one typeface being
 *   used well rather than one size stretched.
 *
 *   ROLE IMPLIES PLANE. A label belongs on the control plane, a body
 *   belongs on the content plane, a display belongs to whatever the
 *   scene is about. The role carries the plane it was designed for,
 *   so a screen that puts a control label on the content plane can be
 *   told so instead of it being a matter of taste.
 *
 * No font family is named. BERX ships no bundled face, and naming one
 * the app does not carry would render as a silent fallback on every
 * device — the system face at these metrics is the honest choice
 * until a real face is added to the build.
 */
import type {BerxDepthKey} from './tokens';
import {round} from './color';

export type BerxTypeRole =
	/** The one thing a scene is about. One per screen, at most. */
	| 'display'
	/** An object's name — a place, a person, an event. */
	| 'title'
	/** A section of a scene. */
	| 'heading'
	/** The line under a title: who, where, when. */
	| 'subtitle'
	/** Reading text. */
	| 'body'
	/** Body weight raised to carry a short, important line. */
	| 'callout'
	/** A control's own name. Lives on the control plane. */
	| 'label'
	/** Timestamps, counts, distances — true and secondary. */
	| 'meta'
	/** Overlines, badges, tab bars: small, tracked out, upper case. */
	| 'micro'
	/** Figures that are read as quantities rather than as words. */
	| 'numeric';

export type BerxTypeEmphasis = 'primary' | 'secondary' | 'tertiary' | 'accent';

export interface BerxTypeStyle {
	fontSize: number;
	lineHeight: number;
	fontWeight: '400' | '600' | '700' | '800';
	letterSpacing: number;
	textTransform: 'none' | 'uppercase';
	/** The plane this role was designed to be read on. */
	plane: BerxDepthKey;
	/** Default emphasis, before a caller overrides it. */
	emphasis: BerxTypeEmphasis;
}

/**
 * The scale, at phone size.
 *
 * The ratio between the reading sizes is deliberately small (15 → 17
 * → 20) and the jump to display is deliberately large (24 → 34).
 * BERX screens are dense with real content and one dominant object;
 * an even geometric scale would make every heading shout and leave
 * nothing for the object itself.
 */
const SCALE: Record<BerxTypeRole, BerxTypeStyle> = {
	display: {fontSize: 34, lineHeight: 1.1, fontWeight: '800', letterSpacing: -0.6, textTransform: 'none', plane: 'D3', emphasis: 'primary'},
	title: {fontSize: 24, lineHeight: 1.18, fontWeight: '700', letterSpacing: -0.35, textTransform: 'none', plane: 'D3', emphasis: 'primary'},
	heading: {fontSize: 20, lineHeight: 1.25, fontWeight: '700', letterSpacing: -0.2, textTransform: 'none', plane: 'D3', emphasis: 'primary'},
	subtitle: {fontSize: 17, lineHeight: 1.3, fontWeight: '600', letterSpacing: -0.1, textTransform: 'none', plane: 'D3', emphasis: 'secondary'},
	body: {fontSize: 15, lineHeight: 1.5, fontWeight: '400', letterSpacing: 0, textTransform: 'none', plane: 'D3', emphasis: 'primary'},
	callout: {fontSize: 15, lineHeight: 1.4, fontWeight: '600', letterSpacing: 0, textTransform: 'none', plane: 'D3', emphasis: 'primary'},
	label: {fontSize: 13, lineHeight: 1.2, fontWeight: '600', letterSpacing: 0.4, textTransform: 'none', plane: 'D4', emphasis: 'primary'},
	meta: {fontSize: 13, lineHeight: 1.35, fontWeight: '400', letterSpacing: 0.1, textTransform: 'none', plane: 'D3', emphasis: 'secondary'},
	micro: {fontSize: 11, lineHeight: 1.2, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', plane: 'D4', emphasis: 'tertiary'},
	numeric: {fontSize: 20, lineHeight: 1.1, fontWeight: '700', letterSpacing: -0.2, textTransform: 'none', plane: 'D3', emphasis: 'primary'},
};

export const BERX_TYPE_ROLES = Object.keys(SCALE) as BerxTypeRole[];

/**
 * How the scale grows with the viewport.
 *
 * Not a linear ramp: reading distance grows with the device, but not
 * proportionally — a desktop is roughly twice as far away as a phone
 * and its type is nowhere near twice the size. These are the steps
 * the archive's three layout breakpoints already name, applied to
 * type so a tablet does not render phone type in a wider column.
 */
export function berxTypeScale(viewportWidth: number): number {
	if (viewportWidth >= 1024) return 1.12;
	if (viewportWidth >= 720) return 1.06;
	/* a small phone loses a little rather than wrapping every title */
	if (viewportWidth <= 360) return 0.96;
	return 1;
}

export interface BerxTypeOptions {
	/** Viewport width in layout px. Defaults to phone. */
	viewportWidth?: number;
	/** Overrides the role's default emphasis. */
	emphasis?: BerxTypeEmphasis;
}

/**
 * The resolved metrics for a role. lineHeight comes back in px
 * because that is what both platforms actually take; the ratio in the
 * table above is the design, this is the arithmetic.
 */
export function resolveType(role: BerxTypeRole, options: BerxTypeOptions = {}): BerxTypeStyle & {lineHeightPx: number} {
	const base = SCALE[role];
	const scale = berxTypeScale(options.viewportWidth ?? 390);
	const fontSize = Math.round(base.fontSize * scale);
	return {
		...base,
		fontSize,
		/* tracking is an optical correction on the size actually
		   rendered, so it scales with it */
		letterSpacing: round(base.letterSpacing * scale, 2),
		lineHeightPx: Math.round(fontSize * base.lineHeight),
		emphasis: options.emphasis ?? base.emphasis,
	};
}

/**
 * Emphasis as an alpha against the scene's primary text colour.
 *
 * Alphas rather than fixed greys, because BERX text is read over
 * glass, media and solid alike: a fixed grey that works on the
 * substrate turns to mud over a bright photograph, while an alpha
 * keeps its relationship to whatever it is on.
 */
export const BERX_TYPE_EMPHASIS_ALPHA: Record<BerxTypeEmphasis, number> = {
	primary: 1,
	secondary: 0.66,
	tertiary: 0.42,
	accent: 1,
};
