/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX DEPTH CARD — structural 3D, driven by where the card actually
 * is on screen.
 *
 * Berx3DTilt already gives a surface real perspective under a finger.
 * This is the other half: a card's depth as a function of its REAL
 * position in the scroll viewport. A card entering from below leans
 * away from the viewer and sits slightly smaller and dimmer; as it
 * reaches the reading position it stands up flat and full size; past
 * it, it recedes again. That is the physics of a stack of objects
 * moving past a camera, not an entrance animation on a timer.
 *
 * Why this is structural and not decoration: nothing here moves unless
 * the user moves it, the transform is a real `perspective` +
 * `rotateX` + `scale` matrix rendered by the platform compositor, and
 * the rotation is bounded small enough that text on the card never
 * becomes hard to read. Set `reducedMotion` and it collapses to a flat
 * card with no transform at all, keeping order and elevation.
 */
import React, {useCallback, useRef, useState} from 'react';
import {Animated, LayoutChangeEvent, Pressable, ViewStyle, Dimensions} from 'react-native';
import {elevation as elevationTokens} from '../tokens';
import type {BerxElevation} from '../tokens';

export interface BerxDepthCardProps {
	children: React.ReactNode;
	/** The screen's own real scroll offset. Without it the card renders flat. */
	driver?: Animated.Value;
	/** Max lean in degrees at the far edge of the viewport. Small on purpose. */
	maxAngle?: number;
	/** How much the card shrinks at the far edge (0.06 = 6%). */
	depthScale?: number;
	perspective?: number;
	elevation?: BerxElevation;
	reducedMotion?: boolean;
	/**
	 * Real press depth. A touched surface should physically recede — the
	 * reference cards do — so pressing scales the card down and eases it
	 * back on release. Supplying onPress makes the whole card the target.
	 */
	onPress?: () => void;
	style?: ViewStyle;
}

export function BerxDepthCard({
	children,
	driver,
	maxAngle = 7,
	depthScale = 0.06,
	perspective = 1100,
	elevation = 2,
	reducedMotion,
	onPress,
	style,
}: BerxDepthCardProps) {
	// Press depth is its own spring, multiplied into the scroll-driven
	// scale below so the two never fight each other.
	const pressScale = useRef(new Animated.Value(1)).current;
	const onPressIn = useCallback(() => {
		Animated.spring(pressScale, {toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 4}).start();
	}, [pressScale]);
	const onPressOut = useCallback(() => {
		Animated.spring(pressScale, {toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8}).start();
	}, [pressScale]);
	// The card's own offset inside the scroll content, measured for real
	// rather than assumed — a card's depth must follow where it actually
	// sits, not its index in a list.
	const [offsetY, setOffsetY] = useState<number | null>(null);
	const [height, setHeight] = useState(0);
	const viewportH = useRef(Dimensions.get('window').height).current;

	const onLayout = (e: LayoutChangeEvent) => {
		const {y, height: h} = e.nativeEvent.layout;
		setOffsetY(y);
		setHeight(h);
	};

	const active = !!driver && !reducedMotion && offsetY !== null && height > 0;

	// The card is "at the reading position" when its centre is at the
	// viewport centre; the input range walks one viewport either side.
	const centre = (offsetY ?? 0) + height / 2 - viewportH / 2;
	const range = [centre - viewportH, centre, centre + viewportH];

	const rotateX = active
		? (driver as Animated.Value).interpolate({
				inputRange: range,
				outputRange: [`${maxAngle}deg`, '0deg', `${-maxAngle}deg`],
				extrapolate: 'clamp',
		  })
		: '0deg';

	const scale = active
		? (driver as Animated.Value).interpolate({
				inputRange: range,
				outputRange: [1 - depthScale, 1, 1 - depthScale],
				extrapolate: 'clamp',
		  })
		: 1;

	const opacity = active
		? (driver as Animated.Value).interpolate({
				inputRange: range,
				outputRange: [0.82, 1, 0.82],
				extrapolate: 'clamp',
		  })
		: 1;

	const composedScale = reducedMotion ? scale : Animated.multiply(scale as never, pressScale);

	return (
		<Animated.View
			onLayout={onLayout}
			style={[
				elevationTokens[elevation],
				{opacity, transform: [{perspective}, {rotateX}, {scale: composedScale}]},
				style,
			]}>
			{onPress ? (
				<Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
					{children}
				</Pressable>
			) : (
				children
			)}
		</Animated.View>
	);
}
