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
			{/*
			 * REAL BUG, WEB-ONLY, FOUND WHILE FIXING FEED'S HEADER ICONS.
			 * On web, react-native-web's own <View> defaults to CSS
			 * `position: relative`, but react-native-svg's <Svg> renders a
			 * bare <svg> tag that does not go through that reset and stays
			 * `position: static`. Per CSS's own paint-order rules, a
			 * POSITIONED sibling with `z-index: auto` still paints above a
			 * non-positioned one REGARDLESS of DOM order — so an icon
			 * passed straight as this surface's only child (no wrapping
			 * View in between) rendered as an invisible glowing circle:
			 * present in the DOM, correct geometry, simply painted under
			 * its own surface's glass. These three layers now carry an
			 * explicit negative zIndex, which moves them into CSS's
			 * "negative z-index" paint step — BEHIND every normal in-flow
			 * child, positioned or not, without requiring children to be
			 * wrapped in anything or restructuring how multi-child callers
			 * lay themselves out via this surface's own outer `style`.
			 * Native is unaffected either way — RN's own paint order is
			 * DOM order regardless of position, this CSS rule doesn't
			 * exist there; an explicit zIndex there simply confirms what
			 * source order already gave it for free. */}
			<BlurView pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind]} intensity={g.blurRadius} tint="dark" />
			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind, {backgroundColor: g.fill}]} />
			<View style={[styles.hairline, styles.behind, {backgroundColor: active ? colors.accent : g.hairline, opacity: active ? 0.5 : 1}]} />
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderWidth: 1,
		overflow: 'hidden',
	},
	// See the real-bug comment above — keeps these three decorative
	// layers behind any in-flow child regardless of DOM order or the
	// child's own position type.
	behind: {zIndex: -1},
	hairline: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 1,
	},
});
