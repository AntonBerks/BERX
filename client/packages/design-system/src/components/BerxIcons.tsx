/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * No icon font or SVG library is installed (react-native-vector-icons/
 * @expo/vector-icons/react-native-svg are all external npm packages,
 * same "npm registry blocked" constraint as everywhere else this
 * session) — these five glyphs are built from plain View primitives
 * (borders, rotation, border-radius) rather than faking a font-icon
 * reference that would render as a blank box or tofu character with
 * nothing actually linked. Simple shapes only, by design: this is a
 * real, honest substitute for an icon library, not a placeholder.
 */
import React from 'react';
import {View} from 'react-native';

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

export function IconHeart({size = 20, color}: IconProps) {
	const lobe = size * 0.32;
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'flex-end'}}>
			<View style={{flexDirection: 'row'}}>
				<View style={{width: lobe, height: lobe, borderRadius: lobe / 2, backgroundColor: color, marginRight: -lobe * 0.3}} />
				<View style={{width: lobe, height: lobe, borderRadius: lobe / 2, backgroundColor: color, marginLeft: -lobe * 0.3}} />
			</View>
			<View
				style={{
					width: 0,
					height: 0,
					marginTop: -lobe * 0.55,
					borderLeftWidth: size * 0.32,
					borderRightWidth: size * 0.32,
					borderTopWidth: size * 0.4,
					borderLeftColor: 'transparent',
					borderRightColor: 'transparent',
					borderTopColor: color,
				}}
			/>
		</View>
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
export function IconStar({size = 20, color}: IconProps) {
	const s = size * 0.62;
	return (
		<View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
			<View style={{width: s, height: s, backgroundColor: color, transform: [{rotate: '45deg'}]}} />
		</View>
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
