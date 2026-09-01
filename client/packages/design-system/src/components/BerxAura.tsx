/**
 * BERX AURA — the quiet luminous ground.
 *
 * This replaced a procedural "scene" (a gradient sky, a starfield, a
 * skyline, a ringed sphere). Fully-drawn scenery is the single fastest
 * way to make an interface look like a phone wallpaper: the eye reads
 * every shape as an illustration, and illustration is not luxury.
 *
 * What expensive products actually do on their first screen is the
 * opposite — a deep, almost-solid ground, one soft light falling
 * through it, enormous restrained typography, and nothing else. The
 * light is felt rather than looked at. That is what this draws: two
 * very wide, very soft pools in one hue family, at low intensity, over
 * a near-black ground.
 *
 * Nothing here has an outline. If you can see where the light stops,
 * it is too strong.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Rect, Ellipse} from 'react-native-svg';

export interface BerxAuraProps {
	/** The ground. Near-black, with a hint of the accent's hue in it. */
	ground: string;
	/** The light falling through it. */
	glow: string;
	/** A second, cooler or warmer pool from the opposite corner. */
	counter?: string;
	/** 0..1 overall strength. Restraint is the whole point. */
	intensity?: number;
	/** 0..1 vertical placement of the main pool. */
	at?: number;
	style?: ViewStyle;
}

export function BerxAura({ground, glow, counter, intensity = 1, at = 0.3, style}: BerxAuraProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const k = Math.max(0, Math.min(1, intensity));
	return (
		<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {backgroundColor: ground}, style]}>
			<Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
				<Defs>
					{/* Long, gentle ramps. A four-stop gradient has a visible knee;
					    these do not, so the light has no edge to find. */}
					<RadialGradient id={`${uid}-a`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor={glow} stopOpacity={0.5 * k} />
						<Stop offset="20%" stopColor={glow} stopOpacity={0.33 * k} />
						<Stop offset="40%" stopColor={glow} stopOpacity={0.17 * k} />
						<Stop offset="62%" stopColor={glow} stopOpacity={0.07 * k} />
						<Stop offset="82%" stopColor={glow} stopOpacity={0.02 * k} />
						<Stop offset="100%" stopColor={glow} stopOpacity={0} />
					</RadialGradient>
					{counter ? (
						<RadialGradient id={`${uid}-b`} cx="50%" cy="50%" r="50%">
							<Stop offset="0%" stopColor={counter} stopOpacity={0.26 * k} />
							<Stop offset="35%" stopColor={counter} stopOpacity={0.12 * k} />
							<Stop offset="68%" stopColor={counter} stopOpacity={0.035 * k} />
							<Stop offset="100%" stopColor={counter} stopOpacity={0} />
						</RadialGradient>
					) : null}
				</Defs>
				<Rect x="0" y="0" width="100" height="100" fill={ground} />
				{counter ? <Ellipse cx="102" cy="88" rx="86" ry="52" fill={`url(#${uid}-b)`} /> : null}
				<Ellipse cx="26" cy={at * 100} rx="96" ry="60" fill={`url(#${uid}-a)`} />
			</Svg>
		</View>
	);
}
