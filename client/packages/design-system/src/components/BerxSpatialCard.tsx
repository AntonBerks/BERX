/**
 * BERX SPATIAL CARD — a real 3D-tilted, parallaxed glass card.
 *
 * TWO SEPARATE MECHANISMS, per this component set's own spec — kept
 * distinct rather than merged into one motion, because they answer
 * different questions:
 *
 *   TILT     — "which way is the card facing?" A real 3D rotation
 *              (rotateX/rotateY + a real `perspective` transform, not
 *              a 2D skew standing in for one) toward wherever the
 *              finger is currently touching (native — the single
 *              wrapping Pressable's own onTouchMove, whose
 *              locationX/locationY already arrive relative to this
 *              view with no separate measure() round-trip — a
 *              PanResponder would only earn its keep negotiating a
 *              gesture against a parent scroll view, which a
 *              self-contained tilt-on-touch does not need) or the
 *              mouse is currently hovering (web — RNW forwards real
 *              DOM mouse events; `onMouseMove`/`onMouseLeave` are read
 *              off `nativeEvent.offsetX/offsetY`, cast through
 *              `as unknown as Record<string, unknown>` since React
 *              Native's own Pressable props don't declare them, only
 *              react-native-web's runtime does). Springs back to flat
 *              the instant the finger lifts or the mouse leaves.
 *
 *              ONE Pressable owns the whole gesture — background glass
 *              and content are both purely decorative layers inside
 *              it, not independently interactive, so onPress and the
 *              continuous tilt tracking are never negotiating against
 *              each other for the same touch.
 *
 *   PARALLAX — "does the background sit behind the content, or on
 *              it?" A real depth cue: the glass backing (BerxGlassView
 *              underneath) shifts LESS than the children sitting on it
 *              when the device itself moves, driven by a REAL
 *              expo-sensors Gyroscope subscription (a new dependency
 *              this component set introduces — see this file's own
 *              header note on native verification). Not wired to
 *              scroll position: a standalone reusable card has no
 *              scroll context of its own to read, and inventing one
 *              blind would be a second, speculative mechanism nothing
 *              asked for by name — real, disclosed scope, not silently
 *              dropped.
 *
 * VERIFICATION. Tilt's touch/press half and the whole 2D glass
 * composition are real, harness-screenshotable behaviour. The
 * gyroscope half and the actual device motion this whole card is
 * meant to respond to are NOT verifiable in this container — no
 * device, no simulator (same standing caveat every *.native.tsx file
 * in this codebase already carries).
 */
import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Platform, Pressable, StyleSheet, View} from 'react-native';
import type {GestureResponderEvent, StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming} from 'react-native-reanimated';
import {Gyroscope} from 'expo-sensors';
type GyroscopeSubscription = ReturnType<typeof Gyroscope.addListener>;
import {BerxGlassView} from './BerxGlassView';
import {BERX_SPRING} from '../animation/springs';

export interface BerxSpatialCardProps {
	children?: ReactNode;
	width?: number;
	height?: number;
	/** Gyroscope-driven background/content depth split. Default on. */
	parallax?: boolean;
	/** Maximum rotation, in degrees, either axis. */
	maxTilt?: number;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
}

/** How far the gyroscope's real rotation RATE (rad/s) is allowed to push the parallax offset, in px — a raw rate is unbounded, so this clamps it to something that reads as a subtle depth cue rather than the card shaking. */
const PARALLAX_CLAMP_PX = 10;
const PARALLAX_SENSITIVITY = 6;

export function BerxSpatialCard({children, width, height, parallax = true, maxTilt = 8, onPress, style}: BerxSpatialCardProps) {
	const [measured, setMeasured] = useState({width: width ?? 0, height: height ?? 0});
	const layoutRef = useRef(measured);
	layoutRef.current = measured;

	// TILT — normalised -1..1 touch/mouse position relative to card
	// centre. Set directly (not sprung) while actively tracking, so the
	// card follows the finger/cursor 1:1; sprung back to 0 on release.
	const tiltX = useSharedValue(0);
	const tiltY = useSharedValue(0);

	// PARALLAX — real gyroscope rotation rate, clamped to a subtle px
	// offset. Independent of tilt: this animates continuously while the
	// device moves, tilt only while actively touched/hovered.
	const parallaxX = useSharedValue(0);
	const parallaxY = useSharedValue(0);

	// A plain onTouchMove on the wrapping View gives locationX/locationY
	// already relative to THIS view — exactly what tilt needs, with no
	// separate measure() round-trip or screen-coordinate geometry
	// (a PanResponder would only earn its keep here if this needed to
	// negotiate the gesture with a parent scroll view, which a
	// self-contained tilt-on-touch does not).
	function handleTouchMove(e: GestureResponderEvent) {
		const {width: w, height: h} = layoutRef.current;
		if (!w || !h) return;
		const {locationX, locationY} = e.nativeEvent;
		const nx = Math.max(-1, Math.min(1, (locationX / w - 0.5) * 2));
		const ny = Math.max(-1, Math.min(1, (locationY / h - 0.5) * 2));
		tiltX.value = nx;
		tiltY.value = ny;
	}

	function resetTilt() {
		tiltX.value = withSpring(0, BERX_SPRING);
		tiltY.value = withSpring(0, BERX_SPRING);
	}

	// WEB — real DOM mouse events, forwarded by react-native-web.
	// offsetX/offsetY are already relative to the hovered element, so
	// this needs no separate bounding-rect measurement either.
	const webHandlers =
		Platform.OS === 'web'
			? ({
					onMouseMove: (e: {nativeEvent: {offsetX: number; offsetY: number}}) => {
						const {width: w, height: h} = layoutRef.current;
						if (!w || !h) return;
						const {offsetX, offsetY} = e.nativeEvent;
						tiltX.value = Math.max(-1, Math.min(1, (offsetX / w - 0.5) * 2));
						tiltY.value = Math.max(-1, Math.min(1, (offsetY / h - 0.5) * 2));
					},
					onMouseLeave: resetTilt,
				} as unknown as Record<string, unknown>)
			: {};

	// PARALLAX — real Gyroscope subscription, native only (expo-sensors
	// has no web implementation). Checked for availability first: a
	// device/emulator with no gyroscope must not spend an effect
	// subscribing to nothing.
	useEffect(() => {
		if (!parallax || Platform.OS === 'web') return;
		let sub: GyroscopeSubscription | null = null;
		let cancelled = false;
		Gyroscope.isAvailableAsync()
			.then((available) => {
				if (!available || cancelled) return;
				Gyroscope.setUpdateInterval(32); // ~30fps — plenty for a subtle depth cue, not a rate that needs 60fps
				sub = Gyroscope.addListener(({x, y}) => {
					parallaxX.value = withTiming(Math.max(-PARALLAX_CLAMP_PX, Math.min(PARALLAX_CLAMP_PX, x * PARALLAX_SENSITIVITY)), {duration: 120});
					parallaxY.value = withTiming(Math.max(-PARALLAX_CLAMP_PX, Math.min(PARALLAX_CLAMP_PX, y * PARALLAX_SENSITIVITY)), {duration: 120});
				});
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
			sub?.remove();
		};
	}, [parallax, parallaxX, parallaxY]);

	// Explicit deps — see BerxGlassView's own comment on why this is not
	// optional in a build with no Reanimated Babel plugin step.
	const cardAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{perspective: 800},
			{rotateX: `${tiltY.value * maxTilt}deg`},
			{rotateY: `${-tiltX.value * maxTilt}deg`},
		],
	}), [tiltX, tiltY, maxTilt]);
	// Content sits ON the glass, so it moves MORE than the glass backing
	// itself — the real "background moves slower than content" relationship.
	const contentParallaxStyle = useAnimatedStyle(() => ({
		transform: [{translateX: parallaxX.value}, {translateY: parallaxY.value}],
	}), [parallaxX, parallaxY]);
	const backingParallaxStyle = useAnimatedStyle(() => ({
		transform: [{translateX: parallaxX.value * 0.3}, {translateY: parallaxY.value * 0.3}],
	}), [parallaxX, parallaxY]);

	return (
		<Pressable
			onPress={onPress}
			style={[{width: width || undefined, height: height || undefined}, style]}
			onLayout={(e) => setMeasured({width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height})}
			onTouchStart={handleTouchMove}
			onTouchMove={handleTouchMove}
			onTouchEnd={resetTilt}
			onTouchCancel={resetTilt}
			{...webHandlers}>
			{/* The real 3D tilt lives on this single inner layer — the
			    Pressable above owns the gesture, this owns the transform,
			    so background and content (both purely decorative) never
			    compete with it for touches. */}
			<Animated.View style={[styles.fill, cardAnimatedStyle]}>
				<Animated.View style={[StyleSheet.absoluteFillObject, backingParallaxStyle]} pointerEvents="none">
					<BerxGlassView intensity={25} radius={20} style={styles.glassFill}>
						<View />
					</BerxGlassView>
				</Animated.View>
				{/* NOT pointerEvents="none" — `children` is real reusable
				    content (a post's own like/comment buttons, a profile
				    card's own actions) and RN's nested-responder system
				    already lets a child touchable win the gesture over an
				    ancestor's onPress; this outer Pressable's own
				    onTouchMove is a passive observer, not a capture, so it
				    does not steal that. */}
				<Animated.View style={[styles.content, contentParallaxStyle]}>{children}</Animated.View>
			</Animated.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	fill: {flex: 1},
	glassFill: {flex: 1, padding: 0},
	content: {flex: 1},
});
