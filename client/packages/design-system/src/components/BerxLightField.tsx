/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX LIGHT FIELD — the lighting layer of the design system.
 *
 * Until react-native-svg landed, BERX had no gradient of any kind: the
 * "glow" behind the entry screen was a flat circle with low opacity,
 * which is why every unphotographed screen read as black. These are
 * real radial gradients with real falloff, so a screen can have a light
 * source, a horizon and an atmosphere instead of a flat ground.
 *
 * Lighting is a MATERIAL, not decoration: each source has a position, a
 * radius, a colour and an intensity, and screens compose a few of them
 * the way a photographer places lamps.
 *
 * FALLOFF IS THE WHOLE POINT. The first version used four stops with
 * 45% of peak still at 45% of the radius; stacked, that filled the
 * frame with an even teal fog and the screen read FLATTER than the
 * black it replaced — light everywhere is the same as light nowhere.
 * Sources now decay on (1-t)^k across `RAMP_STEPS` stops, and every
 * field carries a vignette that pulls the corners back down to the
 * ground colour. A lit scene needs the dark it is lit against.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Defs, RadialGradient, LinearGradient, Stop, Rect, Ellipse} from 'react-native-svg';
import {useBerxColors} from '../theme';

/** Enough stops that the ramp reads as light, not as banding. */
const RAMP_STEPS = 14;

export interface BerxLightSource {
	/** Position as a fraction of the field, 0..1. */
	x: number;
	y: number;
	/** Radius as a fraction of the field's width. */
	r: number;
	color: string;
	/** Peak opacity at the centre, 0..1. */
	intensity: number;
	/**
	 * Falloff exponent. Higher = tighter, more like a real lamp; lower =
	 * a broad atmospheric wash. Defaults to 2.6, which keeps a source
	 * readable as a source rather than as a tint over the whole screen.
	 */
	falloff?: number;
	/** Vertical stretch of the pool, 1 = circular. */
	stretch?: number;
}

export interface BerxLightFieldProps {
	sources: BerxLightSource[];
	/** Ground colour under the lights. Defaults to the theme's own ground. */
	ground?: string;
	/**
	 * How hard the corners are pulled back to the ground, 0..1. This is
	 * what keeps a lit screen from becoming a flat wash; 0 disables it.
	 */
	vignette?: number;
	/**
	 * Height of the dark floor at the bottom, as a fraction of the field.
	 * Gives the composition a horizon to stand on. 0 disables it.
	 */
	horizon?: number;
	style?: ViewStyle;
}

/** opacity = peak * (1 - t)^k, sampled across the gradient. */
function rampStops(peak: number, k: number): Array<{offset: string; opacity: number}> {
	return Array.from({length: RAMP_STEPS + 1}, (_v, i) => {
		const t = i / RAMP_STEPS;
		return {offset: `${(t * 100).toFixed(2)}%`, opacity: peak * Math.pow(1 - t, k)};
	});
}

export function BerxLightField({sources, ground, vignette = 0.85, horizon = 0, style}: BerxLightFieldProps) {
	const colors = useBerxColors();
	const base = ground ?? colors.bg;
	// Stable ids: two light fields on one screen must not share gradient ids.
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

	return (
		<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
			<Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 200">
				<Defs>
					{sources.map((s: BerxLightSource, i: number) => (
						<RadialGradient key={i} id={`${uid}-${i}`} cx="50%" cy="50%" r="50%">
							{rampStops(s.intensity, s.falloff ?? 2.6).map((st, j: number) => (
								<Stop key={j} offset={st.offset} stopColor={s.color} stopOpacity={st.opacity} />
							))}
						</RadialGradient>
					))}
					{vignette > 0 ? (
						<RadialGradient id={`${uid}-vig`} cx="50%" cy="50%" r="50%">
							{/* Inverse of a source: clear in the middle, ground at the
							    corners. Held off until 40% so it darkens the frame
							    without eating the lit centre. */}
							<Stop offset="0%" stopColor={base} stopOpacity={0} />
							<Stop offset="40%" stopColor={base} stopOpacity={0} />
							<Stop offset="70%" stopColor={base} stopOpacity={vignette * 0.42} />
							<Stop offset="88%" stopColor={base} stopOpacity={vignette * 0.8} />
							<Stop offset="100%" stopColor={base} stopOpacity={vignette} />
						</RadialGradient>
					) : null}
					{horizon > 0 ? (
						<LinearGradient id={`${uid}-hz`} x1="0" y1="0" x2="0" y2="1">
							<Stop offset="0%" stopColor={base} stopOpacity={0} />
							<Stop offset="55%" stopColor={base} stopOpacity={0.72} />
							<Stop offset="100%" stopColor={base} stopOpacity={1} />
						</LinearGradient>
					) : null}
				</Defs>
				<Rect x="0" y="0" width="100" height="200" fill={base} />
				{sources.map((s: BerxLightSource, i: number) => (
					<Ellipse
						key={i}
						cx={s.x * 100}
						cy={s.y * 200}
						rx={s.r * 100}
						ry={s.r * 100 * (s.stretch ?? 1.15)}
						fill={`url(#${uid}-${i})`}
					/>
				))}
				{vignette > 0 ? <Rect x="-20" y="-20" width="140" height="240" fill={`url(#${uid}-vig)`} /> : null}
				{horizon > 0 ? (
					<Rect x="0" y={200 - horizon * 200} width="100" height={horizon * 200} fill={`url(#${uid}-hz)`} />
				) : null}
			</Svg>
		</View>
	);
}
