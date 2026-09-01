/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX EMBLEM — the original BERX 3D object.
 *
 * No licensed 3D pack was reachable and licence-verifiable from this
 * environment (see the resource registry), so BERX's 3D is its own:
 * real perspective, real rotation, real light. Not a downloaded model,
 * and not a cartoon.
 *
 * The form is architectural rather than illustrative — three stacked
 * planes with lit top edges and shadowed undersides, rotated on two
 * axes so the stack reads as an object standing in space. That is the
 * same language the checkpoint, badge and reward objects are built
 * from, so BERX's 3D is one material rather than a set of props.
 *
 * It is deliberately quiet: 3D is one material inside the design, not
 * the design. It carries the light, it does not compete with media.
 */
import {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, View, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Polygon} from 'react-native-svg';
import {useBerxColors} from '../theme';

export interface BerxEmblemProps {
	size?: number;
	/** Lean of the object, in degrees. Small: this is a standing form, not a tumbling one. */
	tilt?: number;
	/** Accent that lights the object's edges. Defaults to the theme accent. */
	light?: string;
	style?: ViewStyle;
}

/** One plane of the stack: a parallelogram seen at an angle, lit along its leading edge. */
function Plane({id, y, depth, edge}: {id: string; y: number; depth: number; edge: string}) {
	const top = `20,${y} 80,${y - depth} 100,${y + 8} 40,${y + depth + 8}`;
	const side = `20,${y} 40,${y + depth + 8} 40,${y + depth + 20} 20,${y + 12}`;
	return (
		<>
			<Polygon points={top} fill={`url(#${id})`} />
			<Polygon points={side} fill={edge} opacity={0.55} />
		</>
	);
}

export function BerxEmblem({size = 120, tilt = 0, light, style}: BerxEmblemProps) {
	const colors = useBerxColors();
	const accent = light ?? colors.accent;
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

	return (
		<View
			style={[
				{width: size, height: size, transform: [{perspective: 700}, {rotateX: `${8 + tilt}deg`}, {rotateY: `${-10 + tilt}deg`}]},
				style,
			]}>
			<Svg width={size} height={size} viewBox="0 0 120 120">
				<Defs>
					<LinearGradient id={`${uid}-a`} x1="0" y1="0" x2="1" y2="1">
						<Stop offset="0%" stopColor={accent} stopOpacity={0.95} />
						<Stop offset="100%" stopColor={accent} stopOpacity={0.35} />
					</LinearGradient>
					<LinearGradient id={`${uid}-b`} x1="0" y1="0" x2="1" y2="1">
						<Stop offset="0%" stopColor={colors.onMedia} stopOpacity={0.22} />
						<Stop offset="100%" stopColor={colors.onMedia} stopOpacity={0.05} />
					</LinearGradient>
					<LinearGradient id={`${uid}-c`} x1="0" y1="0" x2="1" y2="1">
						<Stop offset="0%" stopColor={colors.onMedia} stopOpacity={0.12} />
						<Stop offset="100%" stopColor={colors.onMedia} stopOpacity={0.02} />
					</LinearGradient>
				</Defs>
				{/* Back to front: the lowest plane is the dimmest, the lit one on top. */}
				<Plane id={`${uid}-c`} y={78} depth={16} edge={colors.mediaScrim} />
				<Plane id={`${uid}-b`} y={58} depth={16} edge={colors.mediaScrim} />
				<Plane id={`${uid}-a`} y={38} depth={16} edge={colors.mediaScrim} />
			</Svg>
		</View>
	);
}


/**
 * The same object, assembling itself.
 *
 * Each plane is its own absolutely-positioned SVG layer so the stack
 * can come together with real motion: the three planes drop into place
 * from above, back one first, and the whole object settles from a
 * lean. Splitting the layers is what makes this possible on the native
 * driver — animating the polygon geometry itself would mean re-issuing
 * the SVG every frame from JS.
 *
 * Used for the entry reveal. It ends in exactly the pose BerxEmblem
 * holds, so the object the app opens on and the object it uses
 * everywhere else are the same object.
 */
export interface BerxEmblemRevealProps extends BerxEmblemProps {
	/** Milliseconds before the first plane starts moving. */
	delayMs?: number;
	/** Fires once the last plane has settled. */
	onSettled?: () => void;
}

export function BerxEmblemReveal({size = 120, tilt = 0, light, delayMs = 0, onSettled, style}: BerxEmblemRevealProps) {
	const colors = useBerxColors();
	const accent = light ?? colors.accent;
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	// One driver per plane: back, middle, front.
	const drivers = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
	const settle = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const anim = Animated.sequence([
			Animated.delay(delayMs),
			Animated.stagger(
				150,
				drivers.map((d: Animated.Value) =>
					Animated.timing(d, {
						toValue: 1,
						duration: 620,
						// Overshoot-free deceleration: the planes land, they do not
						// bounce. A bouncing logo reads as a toy.
						easing: Easing.bezier(0.16, 1, 0.3, 1),
						useNativeDriver: true,
					}),
				),
			),
			Animated.timing(settle, {toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
		]);
		anim.start(({finished}: {finished: boolean}) => {
			if (finished && onSettled) {
				onSettled();
			}
		});
		return () => anim.stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Back plane travels furthest, so the stack reads as depth resolving.
	const travel = [-size * 0.55, -size * 0.4, -size * 0.26];
	const planes = [
		{id: `${uid}-c`, y: 78, edge: colors.mediaScrim},
		{id: `${uid}-b`, y: 58, edge: colors.mediaScrim},
		{id: `${uid}-a`, y: 38, edge: colors.mediaScrim},
	];

	return (
		<Animated.View
			style={[
				{
					width: size,
					height: size,
					transform: [
						{perspective: 700},
						{rotateX: `${8 + tilt}deg`},
						{
							rotateY: settle.interpolate({inputRange: [0, 1], outputRange: ['-38deg', `${-10 + tilt}deg`]}),
						},
					],
				},
				style,
			]}>
			{planes.map((plane, i: number) => (
				<Animated.View
					key={plane.id}
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: size,
						height: size,
						opacity: drivers[i],
						transform: [{translateY: drivers[i].interpolate({inputRange: [0, 1], outputRange: [travel[i], 0]})}],
					}}>
					<Svg width={size} height={size} viewBox="0 0 120 120">
						{/* Each layer carries its own gradient defs: an id defined in a
						    zero-sized sibling Svg is not in this one's document scope
						    on every renderer, and a missing paint server renders black. */}
						<Defs>
							<LinearGradient id={`${plane.id}-l${i}`} x1="0" y1="0" x2="1" y2="1">
								<Stop
									offset="0%"
									stopColor={i === 2 ? accent : colors.onMedia}
									stopOpacity={i === 2 ? 0.95 : i === 1 ? 0.22 : 0.12}
								/>
								<Stop
									offset="100%"
									stopColor={i === 2 ? accent : colors.onMedia}
									stopOpacity={i === 2 ? 0.35 : i === 1 ? 0.05 : 0.02}
								/>
							</LinearGradient>
						</Defs>
						<Plane id={`${plane.id}-l${i}`} y={plane.y} depth={16} edge={plane.edge} />
					</Svg>
				</Animated.View>
			))}
		</Animated.View>
	);
}
