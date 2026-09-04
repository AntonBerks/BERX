/**
 * The named icon shims BERX screens already import.
 *
 * These used to be glyphs assembled from View primitives — borders,
 * rotations, border-radius — because no SVG library was installed.
 * react-native-svg is now a real dependency, so each of these renders
 * the actual BERX glyph from packages/design-system/src/icons: same
 * 24 grid, same 1.7 stroke, same family.
 *
 * They are kept as named exports rather than rewritten at every call
 * site: the call sites were already correct, only the drawing was
 * provisional. New code should import BerxIcon/BerxIconButton
 * directly, which is where the accessible-name requirement and the
 * 44×44 target are enforced by the types.
 *
 * All of these are decorative by default. Every existing call site
 * puts them inside a control that carries the accessible name, and an
 * icon that announced itself as well would make a screen reader say
 * the same thing twice.
 */
import {BerxIcon} from '../icons/BerxIcon';
import type {BerxIconName} from '../icons/paths';

export interface IconProps {
	size?: number;
	color: string;
}

function shim(name: BerxIconName) {
	return function BerxNamedIcon({size = 20, color}: IconProps) {
		return <BerxIcon name={name} size={size} color={color} decorative />;
	};
}

export const IconHome = shim('home');
export const IconSearch = shim('search');
export const IconPlus = shim('plus');
export const IconMessage = shim('messages');
export const IconMenu = shim('menu');
export const IconChevronRight = shim('chevronRight');
export const IconHeart = shim('heart');
export const IconBell = shim('bell');
export const IconStar = shim('star');
export const IconLock = shim('lock');
export const IconUsers = shim('users');
