/**
 * The atmosphere, painted.
 *
 * @berx/spatial resolves *what* the environment of a scene is — a lit
 * sky, positioned pools of light, an optional ground plane and
 * horizon, a vignette. This paints exactly that and decides nothing
 * itself, so the same environment resolves identically on the web
 * adapter.
 *
 * It is drawn with react-native-svg rather than stacked Views for a
 * reason that matters to the visual contract: real gradients give
 * continuous luminance falloff, and continuous falloff is what makes
 * a surface read as lit rather than as a coloured rectangle. Bands
 * of flat Views would be exactly the flatness the v9 acceptance rule
 * forbids.
 *
 * Pools sit at different apparent distances and move at their own
 * rate against the scroll, so the environment is not one sheet
 * sliding behind the content — the sky barely moves, the ground
 * moves most. That parallax is the depth cue that survives when the
 * blur budget takes the glass away.
 */
import {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop} from 'react-native-svg';
import type {BerxAtmosphere} from '@berx/spatial';

export interface BerxAtmosphereFieldProps {
	atmosphere: BerxAtmosphere;
	width: number;
	height: number;
	/** Live scroll offset; pools drift against it by their own depth. */
	scrollY?: number;
	/**
	 * Which half of the environment to paint.
	 *
	 * When a scene has real media, the media belongs *inside* the
	 * room: `back` (sky + ground) is drawn under it and `front`
	 * (light pools + vignette) over it, so the photograph is lit by
	 * the scene instead of covering it. With no media the whole
	 * environment is one pass and one SVG.
	 */
	pass?: 'all' | 'back' | 'front';
}

/**
 * CSS gradient angles (0° = to top, 180° = to bottom) into SVG's
 * two-point form. Kept here rather than in the resolver because it
 * is a rendering detail of this platform, not part of the contract.
 */
function axisFor(angleDeg: number) {
	const rad = (angleDeg * Math.PI) / 180;
	const dx = Math.sin(rad);
	const dy = -Math.cos(rad);
	return {
		x1: `${(0.5 - dx / 2) * 100}%`,
		y1: `${(0.5 - dy / 2) * 100}%`,
		x2: `${(0.5 + dx / 2) * 100}%`,
		y2: `${(0.5 + dy / 2) * 100}%`,
	};
}

export function BerxAtmosphereField({atmosphere, width, height, scrollY = 0, pass = 'all'}: BerxAtmosphereFieldProps) {
	const major = Math.max(width, height);
	const axis = useMemo(() => axisFor(atmosphere.sky.angleDeg), [atmosphere.sky.angleDeg]);
	const back = pass !== 'front';
	const front = pass !== 'back';
	/* Gradient ids are resolved per document, and a scene with media
	   mounts two of these. Namespacing by pass keeps the front pass
	   from picking up the back pass's definitions. */
	const ns = `berx-${pass}`;

	if (width <= 0 || height <= 0) return null;

	return (
		<View
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={StyleSheet.absoluteFillObject}>
			<Svg width={width} height={height} pointerEvents="none">
				<Defs>
					<LinearGradient id={`${ns}-sky`} x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2}>
						{atmosphere.sky.stops.map((s, i) => (
							<Stop key={i} offset={`${s.position * 100}%`} stopColor={s.color} />
						))}
					</LinearGradient>
					{front
						? atmosphere.pools.map((p, i) => (
						/* A pool is a light source: full strength at its
						   centre, gone by its edge. Two inner stops keep the
						   falloff from looking like a printed circle. */
							<RadialGradient key={i} id={`${ns}-pool-${i}`} cx="50%" cy="50%" r="50%">
								<Stop offset="0%" stopColor={p.color} />
								<Stop offset="45%" stopColor={p.color} stopOpacity={0.45} />
								<Stop offset="100%" stopColor={p.color} stopOpacity={0} />
							</RadialGradient>
						  ))
						: null}
					{back && atmosphere.ground ? (
						<LinearGradient id={`${ns}-ground`} x1="0%" y1="0%" x2="0%" y2="100%">
							{/* haze at the horizon, solid ground underfoot */}
							<Stop offset="0%" stopColor={atmosphere.ground.color} stopOpacity={1 - atmosphere.ground.haze} />
							<Stop offset="100%" stopColor={atmosphere.ground.color} />
						</LinearGradient>
					) : null}
					{front && atmosphere.vignette > 0 ? (
						<RadialGradient id={`${ns}-vignette`} cx="50%" cy="45%" r="75%">
							<Stop offset="55%" stopColor="#000000" stopOpacity={0} />
							<Stop offset="100%" stopColor="#000000" stopOpacity={atmosphere.vignette} />
						</RadialGradient>
					) : null}
				</Defs>

				{/* the room's own light */}
				{back ? <Rect x={0} y={0} width={width} height={height} fill={`url(#${ns}-sky)`} /> : null}

				{/* the ground the scene stands on, when its content has one */}
				{back && atmosphere.ground ? (
					<>
						<Rect
							x={0}
							y={atmosphere.ground.horizon * height}
							width={width}
							height={height - atmosphere.ground.horizon * height}
							fill={`url(#${ns}-ground)`}
						/>
						{/* the horizon line itself — the single strongest distance cue in the frame */}
						<Rect
							x={0}
							y={atmosphere.ground.horizon * height}
							width={width}
							height={1}
							fill="#FFFFFF"
							opacity={atmosphere.ground.edge}
						/>
					</>
				) : null}

				{/* positioned light, each pool drifting at its own distance */}
				{front
					? atmosphere.pools.map((p, i) => {
					const r = p.radius * major;
					const drift = -scrollY * atmosphere.parallaxScale * p.depth * 0.06;
							return (
								<Ellipse
									key={i}
									cx={p.x * width}
									cy={p.y * height + drift}
									rx={r}
									ry={r * 0.82}
									fill={`url(#${ns}-pool-${i})`}
								/>
							);
					  })
					: null}

				{/* the walls */}
				{front && atmosphere.vignette > 0 ? <Rect x={0} y={0} width={width} height={height} fill={`url(#${ns}-vignette)`} /> : null}
			</Svg>
		</View>
	);
}
