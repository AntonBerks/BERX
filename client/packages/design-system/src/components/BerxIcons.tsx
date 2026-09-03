/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX ICONS — one drawn family.
 *
 * No icon FONT is installed (react-native-vector-icons / @expo/
 * vector-icons are external npm packages, same "npm registry blocked"
 * constraint as everywhere else), so these are drawn rather than
 * referenced from a font that would render as tofu with nothing linked.
 *
 * THIS FILE'S ORIGINAL HEADER WAS WRONG, and the whole set was shaped
 * around the mistake. It claimed react-native-svg was also unavailable
 * and built every glyph out of View primitives — borders, rotations,
 * border-radius. react-native-svg@15.15.5 is a declared dependency,
 * installed on disk, and BerxOrb/BerxActions have been rendering real
 * SVG through it the entire time. The constraint did not exist.
 *
 * What that cost, found by rendering the set together and LOOKING at
 * it rather than by reading the code:
 *   - Heart was two circles over a triangle wider than both, so its
 *     points stuck out and it read as a DIAMOND at every size.
 *   - Star was a square rotated 45° — a diamond under the name Star.
 *   - Search was a circle and a detached diagonal that never met.
 *   - Users was two overlapping dots with no bodies: at 14px, nothing.
 *   - Pin was a ring with a dot in it — a target, not a map pin, and
 *     indistinguishable from an eye.
 *   - Edit was a bare diagonal stick with no nib and no body.
 * Half the set was solid and half was hairline-outlined, so no two
 * icons beside each other looked like the same family.
 *
 * NOW: one stroked family on a 24 grid, 1.8 stroke, round caps and
 * joins. Outline is the default because these appear at 13-18px in
 * metadata rows and nav bars, where a filled silhouette collapses into
 * a blob while an outline keeps its subject legible.
 *
 * THE TWO DELIBERATE EXCEPTIONS are Heart and Star. Those are not
 * labels, they are STATES — liked, rated — and a filled mark inside an
 * outlined family is the clearest possible "on". Solid on purpose.
 *
 * SEVERAL OF THESE REPLACE OS EMOJI. A sweep of apps/mobile/src found
 * 101 emoji in UI strings; the full-colour pictographs among them
 * (flame, pin, phone, link, clock, paperclip, pushpin, eye, gift)
 * render in the OS emoji font, at a weight and in colours the product
 * cannot control or theme, inside an interface built entirely from its
 * own drawn marks. One colour emoji beside a place name undoes the
 * restraint of everything around it.
 *
 * NOT replaced, on purpose: the check and cross characters. Those are
 * typographic, not emoji — they render in the text font, in the text
 * colour, inline with the text they belong to. Swapping them for SVG
 * would make them worse.
 */
import type {ReactNode} from 'react';
import Svg, {Path, Circle} from 'react-native-svg';

interface IconProps {
	size?: number;
	color: string;
}

/** The family's one stroke definition. Every outlined glyph uses it. */
const S = {
	strokeWidth: 1.8,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
	fill: 'none',
};

function Glyph({size, children}: {size: number; children: ReactNode}) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24">
			{children}
		</Svg>
	);
}

export function IconHome({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M3.6 10.4L12 3.6l8.4 6.8v9a1.4 1.4 0 0 1-1.4 1.4H5a1.4 1.4 0 0 1-1.4-1.4v-9z" stroke={color} {...S} />
			<Path d="M9.4 20.8v-6.6h5.2v6.6" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconSearch({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Circle cx="10.8" cy="10.8" r="6.8" stroke={color} {...S} />
			{/* Starts ON the lens edge, so the handle is attached to the circle
			    instead of floating beside it. */}
			<Path d="M15.6 15.6l4.6 4.6" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconPlus({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M12 4.6v14.8M4.6 12h14.8" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconMessage({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path
				d="M20.4 11.6a7.6 7.6 0 0 1-8.2 7.6 8.6 8.6 0 0 1-2.6-.4L4.6 20.4l1.6-4.4a7.4 7.4 0 0 1-1-3.8 7.6 7.6 0 0 1 8.2-7.6 7.6 7.6 0 0 1 7 7z"
				stroke={color}
				{...S}
			/>
		</Glyph>
	);
}

export function IconMenu({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M4 7.2h16M4 12h16M4 16.8h16" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconChevronRight({size = 16, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M9.2 4.8l7.2 7.2-7.2 7.2" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconChevronLeft({size = 16, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M14.8 4.8L7.6 12l7.2 7.2" stroke={color} {...S} />
		</Glyph>
	);
}

/**
 * SOLID on purpose — see the header. A heart here is a state (liked),
 * and a filled mark in an outlined family is the clearest "on" there is.
 */
export function IconHeart({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path
				d="M12 20.6l-1.3-1.2C5.2 14.5 2 11.6 2 8.1 2 5.3 4.2 3.1 7 3.1c1.6 0 3.1.7 4 1.9.9-1.2 2.4-1.9 4-1.9 2.8 0 5 2.2 5 5 0 3.5-3.2 6.4-8.7 11.3L12 20.6z"
				fill={color}
			/>
		</Glyph>
	);
}

export function IconBell({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M18.2 16.4H5.8l1.4-2.2V10a4.8 4.8 0 0 1 9.6 0v4.2l1.4 2.2z" stroke={color} {...S} />
			<Path d="M10.2 19.2a2 2 0 0 0 3.6 0" stroke={color} {...S} />
		</Glyph>
	);
}

/** SOLID on purpose — a rating is a state, same reasoning as Heart. */
export function IconStar({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95L12 2.6z" fill={color} />
		</Glyph>
	);
}

export function IconLock({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M5.8 10.6h12.4v9.2H5.8z" stroke={color} {...S} />
			<Path d="M8.6 10.6V7.8a3.4 3.4 0 0 1 6.8 0v2.8" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconUsers({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Circle cx="9.4" cy="8.4" r="3.4" stroke={color} {...S} />
			{/* The bodies. Without them this was two dots that read as nothing
			    at the sizes it is actually used at. */}
			<Path d="M3.6 19.4a5.8 5.8 0 0 1 11.6 0" stroke={color} {...S} />
			<Path d="M16 5.4a3.4 3.4 0 0 1 0 6.6" stroke={color} {...S} />
			<Path d="M17.4 14.4a5.2 5.2 0 0 1 3 5" stroke={color} {...S} />
		</Glyph>
	);
}

export function IconEdit({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M15.8 4.6l3.6 3.6L8.8 18.8l-4.4.8.8-4.4L15.8 4.6z" stroke={color} {...S} />
			<Path d="M14 6.4l3.6 3.6" stroke={color} {...S} />
		</Glyph>
	);
}

/** A map pin. Was a ring with a dot in it — a target, not a location. */
export function IconPin({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M12 21s6.6-5.9 6.6-10.6a6.6 6.6 0 0 0-13.2 0C5.4 15.1 12 21 12 21z" stroke={color} {...S} />
			<Circle cx="12" cy="10.2" r="2.5" stroke={color} {...S} />
		</Glyph>
	);
}

/** Trending / live activity — replaces the flame emoji. */
export function IconFlame({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M12 3c.6 3 3 4 4.2 6.3A6.2 6.2 0 0 1 12 21a6.2 6.2 0 0 1-4.2-11.7C9 7 11.4 6 12 3z" stroke={color} {...S} />
			<Path d="M12 21a2.8 2.8 0 0 1-1.9-5c.6-.6 1.6-1.1 1.9-2.4.3 1.3 1.3 1.8 1.9 2.4A2.8 2.8 0 0 1 12 21z" stroke={color} {...S} />
		</Glyph>
	);
}

/** Opening hours / time — replaces the clock emoji. */
export function IconClock({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Circle cx="12" cy="12" r="8.6" stroke={color} {...S} />
			<Path d="M12 7.2V12l3.2 1.9" stroke={color} {...S} />
		</Glyph>
	);
}

/** Phone number — replaces the telephone emoji. */
export function IconPhone({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path
				d="M8.1 3.6h-2A2.1 2.1 0 0 0 4 5.9C4 13.7 10.3 20 18.1 20a2.1 2.1 0 0 0 2.3-2.1v-2l-4.1-1.4-1.7 2a13.4 13.4 0 0 1-5.1-5.1l2-1.7L8.1 3.6z"
				stroke={color}
				{...S}
			/>
		</Glyph>
	);
}

/** External website — replaces the link emoji. */
export function IconLink({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M10.2 13.8a3.8 3.8 0 0 0 5.6 0l2.8-2.8a3.9 3.9 0 0 0-5.5-5.5l-1.5 1.5" stroke={color} {...S} />
			<Path d="M13.8 10.2a3.8 3.8 0 0 0-5.6 0l-2.8 2.8a3.9 3.9 0 0 0 5.5 5.5l1.5-1.5" stroke={color} {...S} />
		</Glyph>
	);
}

/** File attachment — replaces the paperclip emoji. */
export function IconAttachment({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path
				d="M20.4 11.3l-8.4 8.4a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 4.9 4.9l-8.5 8.5a1.7 1.7 0 0 1-2.5-2.4l7.8-7.8"
				stroke={color}
				{...S}
			/>
		</Glyph>
	);
}

/** Pinned to the top — replaces the pushpin emoji. */
export function IconPinned({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M9 3.5h6l-.8 5 3 3.2H6.8l3-3.2-.8-5z" stroke={color} {...S} />
			<Path d="M12 11.7V20.5" stroke={color} {...S} />
		</Glyph>
	);
}

/** View count — replaces the eye emoji. */
export function IconEye({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M2.4 12S6 5.8 12 5.8 21.6 12 21.6 12 18 18.2 12 18.2 2.4 12 2.4 12z" stroke={color} {...S} />
			<Circle cx="12" cy="12" r="3.1" stroke={color} {...S} />
		</Glyph>
	);
}

/** A business offer — replaces the gift emoji. */
export function IconOffer({size = 20, color}: IconProps) {
	return (
		<Glyph size={size}>
			<Path d="M3.6 8.6h16.8v3.1H3.6zM5 11.7h14v8.2H5z" stroke={color} {...S} />
			<Path d="M12 8.6v11.3" stroke={color} {...S} />
			<Path d="M12 8.6S10.6 4.1 8.4 4.1a2.2 2.2 0 0 0 0 4.5zM12 8.6s1.4-4.5 3.6-4.5a2.2 2.2 0 0 1 0 4.5z" stroke={color} {...S} />
		</Glyph>
	);
}
