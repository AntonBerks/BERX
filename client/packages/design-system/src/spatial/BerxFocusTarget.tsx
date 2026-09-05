/**
 * BerxFocusTarget — the object side of D5.
 *
 * Wrapping an object in this is how a screen says "this is what the
 * scene is looking at right now". While it holds focus it does three
 * things, and none of them is "get brighter":
 *
 *   it registers its own measured box with the scene, which is what
 *   the clearing is centred on — so the falloff is shaped by the real
 *   object, not by an assumed centre;
 *
 *   it renders on the focus plane, above the clearing, so the room
 *   and the content around it fall away behind it while it does not;
 *
 *   and it turns up its material's own emission by the gain the scene
 *   resolved, which is bounded by what that material declares.
 *
 * The object's colour, size and position are untouched. Everything
 * the eye reads as emergence comes from the scene making room.
 *
 * Releasing focus clears the registration, so a screen cannot leave a
 * clearing burning over a scene nothing is focused in.
 */
import React, {useCallback, useEffect, useRef} from 'react';
import {StyleSheet, View, type LayoutChangeEvent, type ViewStyle} from 'react-native';
import type {BerxDepthKey} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';

export interface BerxFocusTargetProps {
	/** Stable per object. Two targets sharing an id would fight. */
	id: string;
	focused: boolean;
	/** 0..1 — how hard the surround falls. Defaults to full. */
	intensity?: number;
	/** Paints the focus plane's own material behind the child. */
	surface?: boolean;
	/**
	 * The plane this object is on while it holds focus.
	 *
	 * Defaults to D5, which is where a target rendered outside any
	 * depth layer sits. Pass the layer's own depth when the target is
	 * nested inside one, so the plane it is standing on does not
	 * recede out from under it — recession is measured from the
	 * focus, not from the camera.
	 */
	plane?: BerxDepthKey;
	radius?: number;
	children?: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
}

export function BerxFocusTarget({
	id,
	focused,
	intensity,
	plane = 'D5',
	surface = false,
	radius = 22,
	children,
	style,
	testID,
}: BerxFocusTargetProps) {
	const {scene, focus, focusField, setFocus} = useBerxScene();
	const ref = useRef<View | null>(null);
	const holding = focus?.id === id;

	/**
	 * onLayout gives the box in the parent's coordinates, and the
	 * clearing is centred in the scene's — so the measurement is taken
	 * against the window, which is the scene's own box for every
	 * full-screen BERX scene. A scene mounted inside a smaller frame
	 * gets a clearing centred slightly off; that is a measurable
	 * offset, not an invented number, and it is why the measure runs
	 * on every layout rather than once.
	 */
	const measure = useCallback(() => {
		if (!focused) return;
		const node = ref.current;
		if (!node) return;
		node.measureInWindow((x, y, width, height) => {
			if (width <= 0 || height <= 0) return;
			setFocus({id, rect: {x, y, width, height}, intensity, plane});
		});
	}, [focused, id, intensity, plane, setFocus]);

	const onLayout = useCallback((_event: LayoutChangeEvent) => measure(), [measure]);

	useEffect(() => {
		if (focused) {
			measure();
			return;
		}
		/* only the target that owns the focus may release it */
		if (holding) setFocus(null);
	}, [focused, holding, measure, setFocus]);

	useEffect(
		() => () => {
			if (holding) setFocus(null);
		},
		[holding, setFocus],
	);

	const layer = scene.layers[plane];
	const gain = holding && focusField ? focusField.emissionGain : 1;

	const body = surface ? (
		<BerxSurface
			surface={layer.surface}
			lighting={layer.lighting}
			radius={radius}
			emissive={holding}
			emissiveGain={gain}
			style={styles.grow}>
			{children}
		</BerxSurface>
	) : (
		children
	);

	return (
		<View
			ref={ref}
			testID={testID}
			onLayout={onLayout}
			style={[holding ? {zIndex: layer.zIndex} : null, style]}>
			{body}
		</View>
	);
}

const styles = StyleSheet.create({
	grow: {flex: 1},
});
