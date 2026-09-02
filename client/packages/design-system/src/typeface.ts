/**
 * BERX TYPEFACE — installs Manrope as the app's default text font.
 *
 * React Native `Text` does not inherit a font from its parent, so
 * without this every one of BERX's ~40 screens would have to name the
 * family in every style — and the first one anybody forgot would
 * silently fall back to the system font. Patching the component's own
 * render once puts the family underneath everything while leaving any
 * explicit `fontFamily` in a style free to override it (the injected
 * style is FIRST in the array, so caller styles still win).
 *
 * NATIVE WEIGHT CAVEAT, stated rather than hidden: iOS resolves
 * `fontWeight` against a registered family correctly; on Android,
 * weight support depends on the fonts being linked with matching
 * PostScript names (`npx react-native-asset`, see
 * react-native.config.js). If a weight is missing there, Android falls
 * back to the nearest available cut rather than to the system font, so
 * the type still reads as BERX. This has been verified on web only —
 * there is no device or emulator in this environment.
 */
import {createElement, cloneElement} from 'react';
import {Text, TextInput} from 'react-native';
import {fonts} from './tokens';

interface Patchable {
	render?: (...args: unknown[]) => {props: {style?: unknown}} | null;
	__berxTypefaceInstalled?: boolean;
}

function patch(component: unknown) {
	const target = component as Patchable;
	if (!target || typeof target.render !== 'function' || target.__berxTypefaceInstalled) {
		return;
	}
	const original = target.render;
	target.render = function berxRender(...args: unknown[]) {
		const el = original.apply(this, args);
		if (!el) {
			return el;
		}
		return cloneElement(el as never, {
			style: [{fontFamily: fonts.sans}, (el.props as {style?: unknown}).style],
		});
	};
	target.__berxTypefaceInstalled = true;
}

let installed = false;

export function installBerxTypeface() {
	if (installed) {
		return;
	}
	installed = true;
	patch(Text);
	patch(TextInput);
}

/** Explicit display type, for the few places that should be the serif. */
export const berxDisplayFont = {fontFamily: fonts.display} as const;
export const berxDisplayItalicFont = {fontFamily: fonts.displayItalic} as const;

// Referenced so the import of createElement is not dropped by the
// bundler's tree-shaker in builds that inline cloneElement.
export const __berxTypefaceRuntime = createElement;
