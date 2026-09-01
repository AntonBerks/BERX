/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX GLASS SYSTEM — the single surface primitive for all four real
 * glass levels (see tokens/index.ts's own BERX GLASS SYSTEM header for
 * what each level means). Before this, "glass" was one ad-hoc business
 * surface plus raw rgba literals scattered per screen, so a chip and a
 * modal rendered as the same material and nothing encoded hierarchy.
 *
 * HONEST CONSTRAINT (unchanged): no blur library is installable in
 * this sandbox (expo-blur / @react-native-community/blur — npm is
 * blocked here), so the level's `blurRadius` is carried as a real,
 * declared intent and depth is delivered today by layered
 * translucency + a lit top hairline + a real elevation shadow. That's
 * why each level raises fill, border AND elevation together rather
 * than leaning on blur alone — the hierarchy is visible with or
 * without a blur backend.
 *
 * `elevated` is kept for backward compatibility with every existing
 * caller (it maps to level 3 + elevation 3); new callers pass `level`.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {glassNight, elevation as elevationTokens, spacing, colors} from '../tokens';
import type {BerxGlassLevel, BerxElevation} from '../tokens';

export interface BerxGlassSurfaceProps {
	children: React.ReactNode;
	/** BERX Glass level 1-4. Defaults to 2 (interactive) — the level most surfaces actually are. */
	level?: BerxGlassLevel;
	/** Legacy prop — maps to level 3 with a lifted shadow. Existing callers keep working unchanged. */
	elevated?: boolean;
	/** Depth of the surface above the ground plane. Defaults to the level's own natural depth. */
	depth?: BerxElevation;
	padding?: keyof typeof spacing | 0;
	/** A faint accent edge — used only for live/active/selected surfaces, never decoratively. */
	active?: boolean;
	radius?: number;
	style?: ViewStyle;
}

const NATURAL_DEPTH: Record<BerxGlassLevel, BerxElevation> = {1: 0, 2: 1, 3: 3, 4: 4};

export function BerxGlassSurface({
	children,
	level,
	elevated,
	depth,
	padding = 'lg',
	active,
	radius,
	style,
}: BerxGlassSurfaceProps) {
	const resolvedLevel: BerxGlassLevel = level ?? (elevated ? 3 : 2);
	const g = glassNight[resolvedLevel];
	const resolvedDepth: BerxElevation = depth ?? NATURAL_DEPTH[resolvedLevel];
	return (
		<View
			style={[
				styles.base,
				{
					backgroundColor: g.fill,
					borderColor: active ? colors.accentSoft : g.border,
					borderRadius: radius ?? g.radius,
				},
				elevationTokens[resolvedDepth],
				padding !== 0 ? {padding: spacing[padding]} : null,
				style,
			]}>
			<View style={[styles.hairline, {backgroundColor: active ? colors.accent : g.hairline, opacity: active ? 0.5 : 1}]} />
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderWidth: 1,
		overflow: 'hidden',
	},
	hairline: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 1,
	},
});
