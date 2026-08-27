/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX Future UI — real, native 3D depth interaction. No 3D engine, no
 * new dependency (react-three-fiber/Three.js/Skia are not installable
 * in this sandbox — npm is blocked, see BerxIcons.tsx's own header for
 * the same constraint on icon libs). This is genuinely three-
 * dimensional, not a flat card pretending to be one: RN's `transform`
 * style array supports a real `perspective` matrix component plus
 * `rotateX`/`rotateY`, all natively rendered by the platform's own
 * compositor (no JS-side pixel faking). PanResponder tracks the raw
 * touch position inside the card and maps it to a real rotation
 * around both axes — the same "holographic card" interaction pattern
 * used by native iOS/Android widgets, built from RN primitives only.
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
