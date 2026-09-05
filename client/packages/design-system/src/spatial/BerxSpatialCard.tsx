/**
 * BerxSpatialCard — the content-plane card.
 *
 * A card in BERX is an object in a lit space, not a rounded
 * rectangle: it sits on a real depth plane, catches the scene's key
 * light, casts a shadow proportional to its distance, and lifts
 * toward the viewer on focus using the scene's own focus motion.
 *
 * Press behaviour is a real button contract — role, accessible name,
 * focus ring, 44dp minimum target — because a card that navigates is
 * a control whatever it looks like.
 */
import React, {useCallback, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {type BerxDepthKey} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {useBerxRoomLight} from './useBerxRoomLight';
import {BerxSurface} from './BerxSurface';
import {BerxFocusRing} from './BerxFocusRing';
import {useBerxSharedElementSource} from './BerxSharedElement';

export interface BerxSpatialCardProps {
	children: React.ReactNode;
	/** Content plane by default. Controls belong on D4, focus energy on D5. */
	depth?: BerxDepthKey;
	onPress?: () => void;
	/** Required when the card is pressable — an unlabelled control is unusable by screen reader. */
	accessibilityLabel?: string;
	accessibilityHint?: string;
	disabled?: boolean;
	radius?: number;
	padding?: number;
	style?: ViewStyle;
	testID?: string;
	/** Shared-element tag, so the card can travel into the detail scene as one object. */
	sharedTag?: string;
}

export function BerxSpatialCard({
	children,
	depth = 'D3',
	onPress,
	accessibilityLabel,
	accessibilityHint,
	disabled,
	radius = 22,
	padding = 16,
	style,
	testID,
	sharedTag,
}: BerxSpatialCardProps) {
	const {scene} = useBerxScene();
	const layer = scene.layers[depth];
	const lift = useRef(new Animated.Value(0)).current;
	/**
	 * Focus is tracked here rather than read from Pressable's state
	 * callback: that callback reports `pressed` on native and only
	 * React Native Web adds `focused`, so relying on it would give
	 * keyboard users a focus ring on web and nothing on a hardware
	 * keyboard attached to a tablet.
	 */
	const [focused, setFocused] = useState(false);
	const {ref: sharedRef, record: recordSharedElement} = useBerxSharedElementSource(sharedTag);
	/**
	 * Where this object is standing, and how much of the room's light
	 * reaches it. Measured once per layout, so a list of cards is lit
	 * by the room rather than by one repeated highlight.
	 */
	const light = useBerxRoomLight();
	const focusMotion = scene.motion.focus;

	const animate = useCallback(
		(to: number) => {
			Animated.timing(lift, {toValue: to, duration: focusMotion.durationMs, useNativeDriver: true}).start();
		},
		[lift, focusMotion.durationMs],
	);

	/**
	 * The focus preset's `to.scale` is the contract's own number
	 * (1.025). Under reduced motion resolveMotion has already replaced
	 * the preset with a cross-fade that carries no scale, so the card
	 * stops growing rather than growing a little less.
	 */
	const targetScale = focusMotion.to?.scale ?? 1;
	const scale = lift.interpolate({inputRange: [0, 1], outputRange: [1, targetScale]});

	const body = (
		<Animated.View style={[{transform: [{scale}]}, styles.grow]}>
			<BerxSurface
				surface={layer.surface}
				lighting={layer.lighting}
				radius={radius}
				emissive={depth === 'D5'}
				illumination={light.illumination}
				behind={light.behind}
				testID={testID ? `${testID}-surface` : undefined}>
				<View style={{padding}}>{children}</View>
			</BerxSurface>
		</Animated.View>
	);

	if (!onPress) {
		return (
			<View
				ref={(node) => {
					sharedRef.current = node;
					light.measure(node);
				}}
				testID={testID}
				nativeID={sharedTag}
				onLayout={light.onLayout}
				style={[styles.wrapper, style]}>
				{body}
			</View>
		);
	}

	return (
		<Pressable
			ref={(node) => {
				sharedRef.current = node;
				light.measure(node as unknown as View | null);
			}}
			onLayout={light.onLayout}
			testID={testID}
			nativeID={sharedTag}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessibilityState={{disabled: disabled === true}}
			disabled={disabled}
			onPress={() => {
				/* record where this object was standing before the
				   navigation takes it off screen, so the destination can
				   travel from here rather than appearing */
				recordSharedElement();
				onPress();
			}}
			onPressIn={() => animate(1)}
			onPressOut={() => animate(0)}
			onFocus={() => {
				setFocused(true);
				animate(1);
			}}
			onBlur={() => {
				setFocused(false);
				animate(0);
			}}
			style={[styles.wrapper, styles.target, disabled ? styles.disabled : null, style]}>
			{body}
			{focused ? <BerxFocusRing radius={radius} /> : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrapper: {},
	grow: {flex: 0},
	/** 44dp is the v9 preferred touch target; nothing pressable is smaller. */
	target: {minHeight: 44},
	disabled: {opacity: 0.45},
});
