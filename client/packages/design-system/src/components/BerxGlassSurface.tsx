/**
 * BerxGlassSurface — the base glass pane.
 *
 * REFACTORED for v9. It used to be a fixed translucent card: one
 * background alpha, one hairline, one shadow, identical whatever the
 * scene asked for. That is the "blur + border + shadow" that v9
 * explicitly rejects — a surface that never changes is a token, not
 * a material.
 *
 * It now resolves its fill, blur, border, edge highlight, refractive
 * rim and glow from the scene's real material and light recipe via
 * @berx/spatial, so DeepGlass on a hero and ClearGlass on a card are
 * visibly different objects.
 *
 * Existing call sites are unchanged: props are the same, and a
 * surface rendered outside a <BerxSpatialScene> falls back to the
 * previous static look rather than throwing. That fallback is
 * deliberate — several business screens still render outside a scene,
 * and breaking them to make a point would be the wrong trade.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {ensureReadableSurface, resolveLighting, type BerxDepthKey} from '@berx/spatial';
import {colors, radius, spacing, shadow} from '../tokens';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';
import {BerxSurface} from '../spatial/BerxSurface';

export interface BerxGlassSurfaceProps {
	children: React.ReactNode;
	elevated?: boolean;
	padding?: keyof typeof spacing | 0;
	style?: ViewStyle;
	/**
	 * Which plane this pane belongs to. Structure by default —
	 * `elevated` promotes it to the control layer, matching what the
	 * prop already meant before v9.
	 */
	depth?: BerxDepthKey;
}

export function BerxGlassSurface({children, elevated, padding = 'lg', style, depth}: BerxGlassSurfaceProps) {
	const scene = useBerxSceneOptional();
	const plane: BerxDepthKey = depth ?? (elevated ? 'D4' : 'D2');
	const pad = padding !== 0 ? {padding: spacing[padding]} : null;

	if (scene) {
		const layer = scene.scene.layers[plane];
		return (
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={radius.lg} style={style}>
				<View style={pad}>{children}</View>
			</BerxSurface>
		);
	}

	/**
	 * Outside a scene there is no camera, no light recipe and no
	 * device budget, so the material is resolved at its documented
	 * defaults instead of being invented per-call — the pane still
	 * obeys the material system, it just cannot obey a scene that
	 * is not there.
	 */
	const surface = ensureReadableSurface({
		material: elevated ? 'LiquidGlass' : 'ClearGlass',
		blurBudgetAvailable: false,
		elevation: elevated ? 0.8 : 0.4,
	});
	const lighting = resolveLighting({recipe: elevated ? 'active' : 'card', depthZ: elevated ? 4 : 2});

	return (
		<View
			style={[
				styles.base,
				{backgroundColor: surface.backgroundColor, borderColor: surface.borderColor},
				elevated ? shadow.base : null,
				pad,
				style,
			]}>
			<View style={[styles.hairline, {backgroundColor: surface.edgeHighlightColor}]} />
			<View style={[styles.leadingRim, {backgroundColor: lighting.rimColor, width: lighting.rimWidth}]} />
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.glassBusiness,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.glassBusinessBorder,
		overflow: 'hidden',
	},
	hairline: {position: 'absolute', top: 0, left: 0, right: 0, height: 1},
	leadingRim: {position: 'absolute', top: 0, bottom: 0, left: 0},
});
