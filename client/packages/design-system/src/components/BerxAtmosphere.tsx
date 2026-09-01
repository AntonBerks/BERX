/**
 * BERX ATMOSPHERE — the cinematic sky every premium BERX surface is
 * built on.
 *
 * A dusk sky is not one colour with a glow on it. It is a vertical ramp
 * through several — deep indigo at the zenith, violet-blue in the upper
 * mid, teal where the light starts, and a luminous bloom right at the
 * horizon where the sun has just gone. That warm/cool opposition is
 * what makes a frame read as photographed rather than filled.
 *
 * THE RAMP ENDS AT THE HORIZON, not at the bottom of the screen. The
 * first version ran the full height, which put the brightest band under
 * the waterline where nothing could see it and left the actual horizon
 * flat. Everything below the horizon is water: a separate, much darker
 * ramp that takes a dim echo of the bloom and nothing else.
 *
 * BERX cyan stays the brand: it owns the horizon light, the rim on
 * every object, and every control. The sky around it carries colour so
 * the product stops looking monochrome.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, RadialGradient, Stop, Rect, Ellipse} from 'react-native-svg';

export interface BerxAtmosphereProps {
	/** Zenith → horizon ramp, top first. At least two colours. */
	sky: string[];
	/** The luminous band sitting on the horizon line. */
	bloom: string;
	/** Colour of the plane below the horizon. */
	water?: string;
	/** 0..1 — where the horizon sits in the frame. */
	horizonAt?: number;
	bloomIntensity?: number;
	stars?: boolean;
	style?: ViewStyle;
}

function rng(seed: number): () => number {
	let s = seed >>> 0 || 1;
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return ((s >>> 0) % 100000) / 100000;
	};
}

export function BerxAtmosphere({
	sky,
	bloom,
	water = '#05070F',
	horizonAt = 0.6,
	bloomIntensity = 1,
	stars = true,
	style,
}: BerxAtmosphereProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const hy = horizonAt * 100;

	// Stars are drawn in their OWN square viewBox and stretched with the
	// rest of the frame, so a "circle" here would come out an oval. They
	// are authored as ellipses whose ry is squashed by the frame's own
	// aspect instead — a star that reads as a raindrop is the fastest way
	// to make a sky look cheap.
	const starField = useMemo(() => {
		if (!stars) return [];
		const rand = rng(1337);
		return Array.from({length: 220}, () => {
			const t = rand();
			return {
				cx: rand() * 100,
				// Squared so stars crowd the zenith and thin out toward the
				// bright horizon, the way they actually do at dusk.
				cy: t * t * hy,
				r: 0.08 + rand() * 0.16,
				o: 0.12 + rand() * rand() * 0.85,
			};
		});
	}, [stars, hy]);

	return (
		<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
			<Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
				<Defs>
					<LinearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
						{sky.map((c: string, i: number) => (
							<Stop key={i} offset={`${(i / (sky.length - 1)) * 100}%`} stopColor={c} />
						))}
					</LinearGradient>
					<LinearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0%" stopColor={bloom} stopOpacity={0.34} />
						<Stop offset="14%" stopColor={water} stopOpacity={0.72} />
						<Stop offset="45%" stopColor={water} stopOpacity={0.94} />
						<Stop offset="100%" stopColor={water} stopOpacity={1} />
					</LinearGradient>
					<RadialGradient id={`${uid}-bloom`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor={bloom} stopOpacity={0.98 * bloomIntensity} />
						<Stop offset="18%" stopColor={bloom} stopOpacity={0.72 * bloomIntensity} />
						<Stop offset="42%" stopColor={bloom} stopOpacity={0.32 * bloomIntensity} />
						<Stop offset="70%" stopColor={bloom} stopOpacity={0.1 * bloomIntensity} />
						<Stop offset="100%" stopColor={bloom} stopOpacity={0} />
					</RadialGradient>
					{/* The column of light the bloom throws straight up. This is
					    the single cheapest thing that makes a sky look like a
					    photograph of one. */}
					<LinearGradient id={`${uid}-shaft`} x1="0" y1="1" x2="0" y2="0">
						<Stop offset="0%" stopColor={bloom} stopOpacity={0.26 * bloomIntensity} />
						<Stop offset="45%" stopColor={bloom} stopOpacity={0.08 * bloomIntensity} />
						<Stop offset="100%" stopColor={bloom} stopOpacity={0} />
					</LinearGradient>
				</Defs>

				{/* SKY — only above the horizon. */}
				<Rect x="0" y="0" width="100" height={hy} fill={`url(#${uid}-sky)`} />
				{starField.map((s, i: number) => (
					<Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.r} ry={s.r * 2.2} fill="#FFFFFF" fillOpacity={s.o} />
				))}
				<Rect x="14" y={hy - 46} width="62" height="46" fill={`url(#${uid}-shaft)`} />
				<Ellipse cx="42" cy={hy} rx="70" ry="17" fill={`url(#${uid}-bloom)`} />

				{/* WATER — everything below. */}
				<Rect x="0" y={hy} width="100" height={100 - hy} fill={`url(#${uid}-water)`} />
			</Svg>
		</View>
	);
}
