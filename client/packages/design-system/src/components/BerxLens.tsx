/**
 * BERX LENS — the restrained BERX object.
 *
 * It replaced a ringed sphere with a specular hit and a halo, which
 * read as a planet: a picture of something, sitting in the middle of a
 * product that is not about planets.
 *
 * This is the opposite instinct. A disc of dark glass, almost the
 * colour of the ground it sits on, betrayed only by a thin arc of
 * light along the edge the light comes from and a very soft interior
 * lift. You should have to look at it to be sure it is there. That is
 * what makes an object read as expensive rather than as an
 * illustration — presence without decoration.
 *
 * The same construction scales to the checkpoint, badge, reward and
 * memory objects: one disc, one lit edge, one interior lift.
 */
import {useMemo} from 'react';
import {View, ViewStyle} from 'react-native';
import Svg, {Defs, RadialGradient, LinearGradient, Stop, Circle} from 'react-native-svg';

export interface BerxLensProps {
	size?: number;
	/** The light along the lit edge. */
	light?: string;
	/** Body of the glass — normally a touch lighter than the ground. */
	body?: string;
	/** 0..1 how present the object is. Low is the point. */
	presence?: number;
	style?: ViewStyle;
}

export function BerxLens({size = 240, light = '#7FE8F2', body = '#10151C', presence = 1, style}: BerxLensProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const k = Math.max(0, Math.min(1, presence));
	return (
		<View pointerEvents="none" style={[{width: size, height: size}, style]}>
			<Svg width={size} height={size} viewBox="0 0 200 200">
				<Defs>
					{/* Interior: barely lifted off the ground, brightest where the
					    light enters, gone before it reaches the far edge. */}
					<RadialGradient id={`${uid}-body`} cx="34%" cy="30%" r="82%">
						<Stop offset="0%" stopColor={light} stopOpacity={0.13 * k} />
						<Stop offset="34%" stopColor={body} stopOpacity={0.85} />
						<Stop offset="100%" stopColor={body} stopOpacity={0.55} />
					</RadialGradient>
					{/* The whole object is this arc. Bright for a short run along
					    the upper-left edge, then nothing. */}
					<LinearGradient id={`${uid}-edge`} x1="0.12" y1="0.05" x2="0.9" y2="0.95">
						<Stop offset="0%" stopColor={light} stopOpacity={0} />
						<Stop offset="12%" stopColor={light} stopOpacity={0.85 * k} />
						<Stop offset="28%" stopColor={light} stopOpacity={0.32 * k} />
						<Stop offset="46%" stopColor={light} stopOpacity={0.06 * k} />
						<Stop offset="100%" stopColor={light} stopOpacity={0} />
					</LinearGradient>
					{/* A whisper of the light spilling outward. */}
					<RadialGradient id={`${uid}-spill`} cx="50%" cy="50%" r="50%">
						<Stop offset="60%" stopColor={light} stopOpacity={0} />
						<Stop offset="72%" stopColor={light} stopOpacity={0.07 * k} />
						<Stop offset="100%" stopColor={light} stopOpacity={0} />
					</RadialGradient>
				</Defs>
				<Circle cx="100" cy="100" r="99" fill={`url(#${uid}-spill)`} />
				<Circle cx="100" cy="100" r="82" fill={`url(#${uid}-body)`} />
				<Circle cx="100" cy="100" r="82" fill="none" stroke={`url(#${uid}-edge)`} strokeWidth={1.4} />
				{/* One inner line, concentric: the BERX plane, seen edge-on. It
				    is the only geometry on the object. */}
				<Circle cx="100" cy="100" r="58" fill="none" stroke={`url(#${uid}-edge)`} strokeWidth={0.9} opacity={0.55} />
			</Svg>
		</View>
	);
}
