/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * No icon FONT is installed (react-native-vector-icons / @expo/
 * vector-icons are external npm packages, same "npm registry blocked"
 * constraint as everywhere else) — so these glyphs are drawn, not
 * referenced from a font that would render as tofu with nothing
 * actually linked.
 *
 * CORRECTION TO THIS FILE'S ORIGINAL HEADER: it also claimed
 * react-native-svg was unavailable, and built every glyph from View
 * primitives (borders, rotation, border-radius) on that basis. That
 * claim is false — react-native-svg@15.15.5 is a declared dependency
 * in package.json and installed on disk, and BerxOrb/BerxActions have
 * been rendering real SVG through it all along. The constraint these
 * icons were shaped around does not exist.
 *
 * The View-primitive glyphs that hold their proportions are left as
 * they are rather than churned for the sake of it. IconHeart did not:
 * it is two circles with a triangle beneath, and the triangle is wider
 * than the two lobes combined, so its points stick out at the sides and
 * it reads as a DIAMOND at every size — visibly so in the feed's stat
 * row and in Profile's menu. A shape that is not the shape it is named
 * after is a defect, not a stylistic simplification, so that one is now
 * a real path.
 */
import {View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface IconProps {
	size?: number;
	color: string;
}

export function IconHome({size = 20, color}: IconProps) {
	const roofSize = size * 0.62;
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'flex-end'}}>
			<View
				style={{
					width: 0,
					height: 0,
					borderLeftWidth: roofSize / 2,
					borderRightWidth: roofSize / 2,
					borderBottomWidth: roofSize / 2,
					borderLeftColor: 'transparent',
					borderRightColor: 'transparent',
					borderBottomColor: color,
				}}
			/>
			<View
				style={{
					width: size * 0.62,
					height: size * 0.42,
					backgroundColor: color,
					marginTop: -1,
				}}
			/>
		</View>
	);
}

export function IconSearch({size = 20, color}: IconProps) {
	const circle = size * 0.65;
	return (
		<View style={{width: size, height: size}}>
			<View
				style={{
					width: circle,
					height: circle,
					borderRadius: circle / 2,
					borderWidth: 2,
					borderColor: color,
					position: 'absolute',
					top: 0,
					left: 0,
				}}
			/>
			<View
				style={{
					width: 2,
					height: size * 0.38,
					backgroundColor: color,
					position: 'absolute',
					bottom: 0,
					right: 1,
					transform: [{rotate: '45deg'}],
				}}
			/>
		</View>
	);
}

export function IconPlus({size = 20, color}: IconProps) {
	const thickness = Math.max(2, size * 0.12);
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
			<View style={{position: 'absolute', width: size, height: thickness, backgroundColor: color, borderRadius: thickness / 2}} />
			<View style={{position: 'absolute', width: thickness, height: size, backgroundColor: color, borderRadius: thickness / 2}} />
		</View>
	);
}

export function IconMessage({size = 20, color}: IconProps) {
	return (
		<View style={{width: size, height: size, alignItems: 'center'}}>
			<View
				style={{
					width: size,
					height: size * 0.72,
					borderRadius: size * 0.22,
					borderWidth: 2,
					borderColor: color,
				}}
			/>
			<View
				style={{
					width: 0,
					height: 0,
					borderLeftWidth: size * 0.14,
					borderRightWidth: size * 0.14,
					borderTopWidth: size * 0.16,
					borderLeftColor: 'transparent',
					borderRightColor: color,
					borderTopColor: color,
					alignSelf: 'flex-start',
					marginLeft: size * 0.18,
					marginTop: -2,
				}}
			/>
		</View>
	);
}

export function IconMenu({size = 20, color}: IconProps) {
	const thickness = Math.max(2, size * 0.1);
	const barStyle = {width: size, height: thickness, backgroundColor: color, borderRadius: thickness / 2};
	return (
		<View style={{width: size, height: size, justifyContent: 'space-between', paddingVertical: thickness / 2}}>
			<View style={barStyle} />
			<View style={barStyle} />
			<View style={barStyle} />
		</View>
	);
}

export function IconChevronRight({size = 16, color}: IconProps) {
	const thickness = Math.max(1.5, size * 0.13);
	return (
		<View style={{width: size * 0.5, height: size, alignItems: 'center', justifyContent: 'center'}}>
			<View
				style={{
					width: size * 0.42,
					height: size * 0.42,
					borderTopWidth: thickness,
					borderRightWidth: thickness,
					borderTopColor: color,
					borderRightColor: color,
					transform: [{rotate: '45deg'}],
				}}
			/>
		</View>
	);
}

/** Same real corner-border construction as IconChevronRight, rotated the other way — built for BerxHeader's back button (previously a plain "‹ Назад" text glyph). */
export function IconChevronLeft({size = 16, color}: IconProps) {
	const thickness = Math.max(1.5, size * 0.13);
	return (
		<View style={{width: size * 0.5, height: size, alignItems: 'center', justifyContent: 'center'}}>
			<View
				style={{
					width: size * 0.42,
					height: size * 0.42,
					borderTopWidth: thickness,
					borderRightWidth: thickness,
					borderTopColor: color,
					borderRightColor: color,
					transform: [{rotate: '225deg'}],
				}}
			/>
		</View>
	);
}

/**
 * A real heart path, so it is a heart at 13px and at 40px alike. The
 * two-circles-plus-triangle construction this replaced could not hold
 * the silhouette at any size.
 */
export function IconHeart({size = 20, color}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24">
			<Path
				d="M12 20.6l-1.3-1.2C5.2 14.5 2 11.6 2 8.1 2 5.3 4.2 3.1 7 3.1c1.6 0 3.1.7 4 1.9 0.9-1.2 2.4-1.9 4-1.9 2.8 0 5 2.2 5 5 0 3.5-3.2 6.4-8.7 11.3L12 20.6z"
				fill={color}
			/>
		</Svg>
	);
}

export function IconBell({size = 20, color}: IconProps) {
	return (
		<View style={{width: size, height: size, alignItems: 'center'}}>
			<View
				style={{
					width: size * 0.62,
					height: size * 0.55,
					borderTopLeftRadius: size * 0.31,
					borderTopRightRadius: size * 0.31,
					borderWidth: 2,
					borderBottomWidth: 0,
					borderColor: color,
				}}
			/>
			<View style={{width: size * 0.78, height: 2, backgroundColor: color, marginTop: -1}} />
			<View style={{width: size * 0.18, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color, marginTop: 2}} />
		</View>
	);
}

/** A rotated-square diamond, not a true 5-point star — kept consistent with this file's own rule (pure View shapes, no font-glyph reliance) rather than reaching for a Unicode "★" whose rendering isn't guaranteed the same way a View-drawn shape is. */
/**
 * A real five-point star. This was a square rotated 45° — a DIAMOND,
 * under the name Star, which is not a simplification of a star but a
 * different shape wearing its name. Found the same way IconHeart's
 * diamond was: by looking at the rendered screen rather than the code.
 */
export function IconStar({size = 20, color}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24">
			<Path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95L12 2.6z" fill={color} />
		</Svg>
	);
}

export function IconLock({size = 20, color}: IconProps) {
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'flex-end'}}>
			<View
				style={{
					width: size * 0.45,
					height: size * 0.35,
					borderTopLeftRadius: size * 0.22,
					borderTopRightRadius: size * 0.22,
					borderWidth: 2,
					borderBottomWidth: 0,
					borderColor: color,
					marginBottom: -1,
				}}
			/>
			<View style={{width: size * 0.68, height: size * 0.48, borderRadius: 3, backgroundColor: color}} />
		</View>
	);
}

export function IconUsers({size = 20, color}: IconProps) {
	const r = size * 0.18;
	return (
		<View style={{width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: -size * 0.12}}>
			<View style={{width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color, opacity: 0.5, marginRight: -size * 0.15}} />
			<View style={{width: r * 2.3, height: r * 2.3, borderRadius: r * 1.15, backgroundColor: color}} />
		</View>
	);
}

/** MAX BUILD — added for the new Edit Profile entry point; a plain rotated bar (the "pencil body") over a small tip, same View-primitive-only style as the rest of this file. */
export function IconEdit({size = 20, color}: IconProps) {
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
			<View style={{width: size * 0.14, height: size * 0.82, backgroundColor: color, borderRadius: size * 0.07, transform: [{rotate: '45deg'}]}} />
		</View>
	);
}

/**
 * BERX SPATIAL — Places. A real map-pin silhouette from primitives:
 * a circle whose lower half is squared into a point via rotation,
 * plus a punched-out centre. Same View-only approach as every glyph
 * above (no icon font/SVG library installable in this sandbox).
 */
export function IconPin({size = 20, color}: IconProps) {
	const head = size * 0.72;
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
			<View
				style={{
					width: head,
					height: head,
					borderRadius: head / 2,
					borderBottomRightRadius: 1,
					borderWidth: 2,
					borderColor: color,
					transform: [{rotate: '-45deg'}],
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<View
					style={{
						width: head * 0.3,
						height: head * 0.3,
						borderRadius: head * 0.15,
						backgroundColor: color,
					}}
				/>
			</View>
		</View>
	);
}
