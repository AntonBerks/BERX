/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX AVATAR STACK — people as a spatial fact, not a number. Real
 * overlapping avatars plus a real overflow count ("+7"), used
 * everywhere BERX states who is somewhere: people at a place, people
 * attending an event, people in a moment, friends inside a world.
 *
 * Every face here must come from a REAL person the caller actually
 * fetched — this component never invents filler faces to make a stack
 * look fuller. With one real person it renders one avatar.
 */
import React from 'react';
import {View, Image, Text, StyleSheet, ViewStyle} from 'react-native';
import {colors, typography} from '../tokens';

export interface BerxStackPerson {
	guid: number;
	icon?: string | null;
	initial?: string;
}

export interface BerxAvatarStackProps {
	people: BerxStackPerson[];
	/** How many faces to actually show before collapsing the rest into a real "+N". */
	max?: number;
	size?: number;
	/** Real total when the caller knows more people exist than it fetched faces for (e.g. a server count of 42 with 6 avatars loaded). */
	total?: number;
	style?: ViewStyle;
}

export function BerxAvatarStack({people, max = 4, size = 26, total, style}: BerxAvatarStackProps) {
	const shown = people.slice(0, max);
	const realTotal = typeof total === 'number' ? total : people.length;
	const overflow = Math.max(0, realTotal - shown.length);
	const overlap = Math.round(size * 0.32);

	return (
		<View style={[styles.row, style]}>
			{shown.map((p: BerxStackPerson, i: number) => (
				<View
					key={p.guid}
					style={[
						styles.slot,
						{
							width: size,
							height: size,
							borderRadius: size / 2,
							marginLeft: i === 0 ? 0 : -overlap,
							zIndex: shown.length - i,
						},
					]}>
					{p.icon ? (
						<Image source={{uri: p.icon}} style={{width: size, height: size, borderRadius: size / 2}} />
					) : (
						<View style={[styles.fallback, {width: size, height: size, borderRadius: size / 2}]}>
							<Text style={[styles.fallbackText, {fontSize: size * 0.42}]}>{(p.initial ?? '?').toUpperCase()}</Text>
						</View>
					)}
				</View>
			))}
			{overflow > 0 ? (
				<View
					style={[
						styles.slot,
						styles.overflow,
						{width: size, height: size, borderRadius: size / 2, marginLeft: -overlap},
					]}>
					<Text style={[styles.overflowText, {fontSize: size * 0.36}]}>+{overflow}</Text>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', alignItems: 'center'},
	slot: {
		borderWidth: 1.5,
		borderColor: colors.black,
		overflow: 'hidden',
		backgroundColor: colors.graphite,
	},
	fallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	fallbackText: {color: colors.textDim, fontWeight: typography.weightBold},
	overflow: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass3},
	overflowText: {color: colors.text, fontWeight: typography.weightBold},
});
