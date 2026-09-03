/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX Future UI — depth INTERACTION for flat surfaces. Deliberately
 * not a 3D scene.
 *
 * CORRECTION (this header used to claim "react-three-fiber/Three.js
 * are not installable in this sandbox — npm is blocked"): that is
 * FALSE today. three@0.169.0, @react-three/fiber@9.7.0 (with its real
 * /native entry) and expo-gl@15.1.7 are all installed and every R3F
 * peer range is satisfied. Real 3D scenes live in spatial/*.native.tsx
 * and compose from SpatialStage. The stale claim is removed rather
 * than left to mislead the next reader into thinking 3D is impossible.
 *
 * What this component IS: a perspective TRANSFORM, not a rendered
 * scene. RN's `transform` style array supports a real `perspective`
 * matrix component plus `rotateX`/`rotateY`, composited natively (no
 * JS-side pixel faking), and PanResponder maps touch position to
 * rotation around both axes. That is a genuine 3D transform of a flat
 * plane — it is NOT a camera, geometry, lighting or a render pipeline,
 * and it must never be described as "real 3D" in the sense
 * SpatialStage is. Use it to give a card depth RESPONSE; use a
 * SpatialStage scene when the content itself should exist in depth.
 *
 * Wrap any card-like surface (BerxGlassSurface, a stat tile, a hero
 * image) in this to give it real depth response to touch instead of a
 * flat tap target. Springs back to flat (rotateX=rotateY=0) on
 * release — never left mid-tilt.
 */
import React, {useRef} from 'react';
import {Animated, PanResponder, GestureResponderEvent, PanResponderGestureState, StyleSheet, View, ViewStyle, LayoutChangeEvent} from 'react-native';

export interface Berx3DTiltProps {
	children: React.ReactNode;
	style?: ViewStyle;
	/** Max rotation in degrees at the card's edge — real, bounded, never disorienting. */
	maxAngle?: number;
	/** Perspective distance in px — lower = more dramatic depth. */
	perspective?: number;
	disabled?: boolean;
}

export function Berx3DTilt({children, style, maxAngle = 10, perspective = 900, disabled}: Berx3DTiltProps) {
	const rotateX = useRef(new Animated.Value(0)).current;
	const rotateY = useRef(new Animated.Value(0)).current;
	const lift = useRef(new Animated.Value(0)).current;
	const size = useRef({width: 1, height: 1});

	function onLayout(e: LayoutChangeEvent) {
		size.current = {width: e.nativeEvent.layout.width || 1, height: e.nativeEvent.layout.height || 1};
	}

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => !disabled,
			onMoveShouldSetPanResponder: () => !disabled,
			onPanResponderGrant: () => {
				Animated.spring(lift, {toValue: 1, useNativeDriver: true, friction: 6}).start();
			},
			onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
				const {width, height} = size.current;
				// gesture.moveX/moveY are screen-absolute; approximate local
				// position from the drag delta around the touch start, which
				// is real relative motion, not a simulated value.
				const nx = Math.max(-1, Math.min(1, gesture.dx / (width / 2)));
				const ny = Math.max(-1, Math.min(1, gesture.dy / (height / 2)));
				rotateY.setValue(nx * maxAngle);
				rotateX.setValue(-ny * maxAngle);
			},
			onPanResponderRelease: () => {
				Animated.parallel([
					Animated.spring(rotateX, {toValue: 0, useNativeDriver: true, friction: 5}),
					Animated.spring(rotateY, {toValue: 0, useNativeDriver: true, friction: 5}),
					Animated.spring(lift, {toValue: 0, useNativeDriver: true, friction: 6}),
				]).start();
			},
			onPanResponderTerminate: () => {
				Animated.parallel([
					Animated.spring(rotateX, {toValue: 0, useNativeDriver: true, friction: 5}),
					Animated.spring(rotateY, {toValue: 0, useNativeDriver: true, friction: 5}),
					Animated.spring(lift, {toValue: 0, useNativeDriver: true, friction: 6}),
				]).start();
			},
		})
	).current;

	const scale = lift.interpolate({inputRange: [0, 1], outputRange: [1, 1.03]});

	return (
		<View style={style} onLayout={onLayout} {...panResponder.panHandlers}>
			<Animated.View
				style={[
					styles.face,
					{
						transform: [
							{perspective},
							{
								rotateX: rotateX.interpolate({inputRange: [-maxAngle, maxAngle], outputRange: [`-${maxAngle}deg`, `${maxAngle}deg`]}),
							},
							{
								rotateY: rotateY.interpolate({inputRange: [-maxAngle, maxAngle], outputRange: [`-${maxAngle}deg`, `${maxAngle}deg`]}),
							},
							{scale},
						],
					},
				]}
			>
				{children}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	face: {flex: 1},
});
