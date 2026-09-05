/**
 * A single depth plane of the scene.
 *
 * Depth is applied here and nowhere else: the layer's perspective
 * scale, parallax offset, shadow, material and light intensity all
 * come from the resolved scene, so a screen cannot place content at
 * "roughly D3" by eye.
 *
 * React Native has no translateZ, so the layer's distance is applied
 * as the scale a real perspective camera would project (see
 * perspectiveScale in @berx/spatial) — the same distance the web
 * layer reaches by translating in z.
 */
import React, {useMemo} from 'react';
import {StyleSheet, View, type LayoutChangeEvent, type ViewStyle} from 'react-native';
import {parallaxOffset, perspectiveScale, type BerxDepthKey} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';

export interface BerxDepthLayerProps {
	depth: BerxDepthKey;
	children?: React.ReactNode;
	/** Renders the layer's material as a surface. Off for pure positioning layers. */
	surface?: boolean;
	radius?: number;
	/** Fills the scene — used for D0/D1 environment and atmosphere. */
	absoluteFill?: boolean;
	style?: ViewStyle;
	/** Lets a layer measure its own box — the environment sizes to its scene. */
	onLayout?: (event: LayoutChangeEvent) => void;
	testID?: string;
	accessible?: boolean;
	accessibilityLabel?: string;
	/**
	 * Decorative layers must be invisible to assistive technology.
	 * Defaults to true for D0/D1, which never carry semantic content.
	 */
	decorative?: boolean;
}

export function BerxDepthLayer({
	depth,
	children,
	surface = false,
	radius = 22,
	absoluteFill = false,
	style,
	onLayout,
	testID,
	accessible,
	accessibilityLabel,
	decorative,
}: BerxDepthLayerProps) {
	const {scene, scrollY} = useBerxScene();
	const layer = scene.layers[depth];

	const isDecorative = decorative ?? (depth === 'D0' || depth === 'D1');

	const transform = useMemo(() => {
		const translateY = parallaxOffset(scrollY, layer.parallaxFactor, scene.budget.allowParallax);
		const scale = scene.camera.perspectiveEnabled ? perspectiveScale(layer.translateZ, scene.camera.perspectivePx) : 1;
		return [{translateY}, {scale}];
	}, [scrollY, layer.parallaxFactor, layer.translateZ, scene.budget.allowParallax, scene.camera]);

	const body = surface ? (
		<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={radius} emissive={depth === 'D5'} style={styles.grow}>
			{children}
		</BerxSurface>
	) : (
		children
	);

	return (
		<View
			testID={testID}
			onLayout={onLayout}
			accessible={isDecorative ? false : accessible}
			accessibilityLabel={isDecorative ? undefined : accessibilityLabel}
			accessibilityElementsHidden={isDecorative}
			importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'auto'}
			pointerEvents={isDecorative ? 'none' : 'auto'}
			style={[absoluteFill ? styles.absolute : null, {zIndex: layer.zIndex, opacity: layer.contentOpacity, transform}, style]}>
			{body}
		</View>
	);
}

const styles = StyleSheet.create({
	absolute: {...StyleSheet.absoluteFillObject},
	grow: {flex: 1},
});
