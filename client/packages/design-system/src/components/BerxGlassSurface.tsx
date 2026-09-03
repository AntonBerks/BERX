/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX GLASS SYSTEM — the single surface primitive for all four real
 * glass levels (see tokens/index.ts's own BERX GLASS SYSTEM header for
 * what each level means). Before this, "glass" was one ad-hoc business
 * surface plus raw rgba literals scattered per screen, so a chip and a
 * modal rendered as the same material and nothing encoded hierarchy.
 *
 * REAL BACKDROP BLUR, now genuinely available. Every previous version
 * of this file's header claimed "no blur library is installable in
 * this sandbox — npm is blocked". That claim was never re-tested; it
 * was carried forward as inherited fact the same way BerxIcons.tsx
 * wrongly carried forward "no react-native-svg" for months. A direct
 * `npm install expo-blur` succeeds — the registry is reachable through
 * this environment's proxy. expo-blur renders a REAL native blur
 * (UIVisualEffectView) on iOS, a real CSS `backdrop-filter: blur()` on
 * web (verified against its own source — see BlurView.web.js), and
 * degrades to the same semi-transparent fallback this component
 * already used on Android, so there is no regression path.
 *
 * The blur sits BEHIND everything BERX already draws — its own fill,
 * border and hairline are unchanged, still theme-resolved per level,
 * still what actually carries BERX's colour character. Blur is used
 * only for the one thing only blur can do: make what is BEHIND the
 * glass optically soften, which is what makes a translucent surface
 * read as glass instead of as a dark rectangle with reduced opacity.
 * `blurRadius` in tokens/index.ts was a real, declared intent since
 * before this — a number nothing ever consumed. This is what finally
 * consumes it.
 *
 * `elevated` is kept for backward compatibility with every existing
 * caller (it maps to level 3 + elevation 3); new callers pass `level`.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {BlurView} from 'expo-blur';
import {elevation as elevationTokens, spacing} from '../tokens';
import {useBerxColors, useBerxGlass} from '../theme';
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
	// BERX THEME — the glass MATERIAL itself is theme-resolved, not just
	// the text on top of it.
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const resolvedLevel: BerxGlassLevel = level ?? (elevated ? 3 : 2);
	const g = glass[resolvedLevel];
	const resolvedDepth: BerxElevation = depth ?? NATURAL_DEPTH[resolvedLevel];
	return (
		<View
			style={[
				styles.base,
				{
					// The fill used to sit directly on this View's own
					// backgroundColor. It is now a separate layer (below) so a
					// real BlurView can sit UNDER it — a View's own
					// backgroundColor paints as one opaque layer with nothing
					// able to go behind it.
					borderColor: active ? colors.accentSoft : g.border,
					borderRadius: radius ?? g.radius,
				},
				elevationTokens[resolvedDepth],
				padding !== 0 ? {padding: spacing[padding]} : null,
				style,
			]}>
			{/* Real optical blur of whatever sits behind this surface — a
			    genuine UIVisualEffectView on iOS, a real CSS
			    backdrop-filter on web, a plain semi-transparent view on
			    Android (expo-blur's own documented fallback, identical to
			    this component's behaviour before blur existed — no
			    regression). `intensity` is `blurRadius` from the level
			    token, which existed as a declared, unconsumed design
			    intent since before real blur was available in this
			    sandbox. */}
			<BlurView pointerEvents="none" style={StyleSheet.absoluteFillObject} intensity={g.blurRadius} tint="dark" />
			{/* BERX's own tint, unchanged, layered ON the blur rather than
			    replaced by it — this is what still carries the level's
			    exact colour and opacity; the blur beneath only softens
			    what shows through it. */}
			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {backgroundColor: g.fill}]} />
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
