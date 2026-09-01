/**
 * BERX GLASS PANEL — real glass, not a grey rounded rectangle.
 *
 * Glass in a premium interface has five things a flat translucent box
 * does not: an EDGE that catches light brightest where the light is,
 * a HIGHLIGHT running along the inside of that top edge, a TINT that
 * lets the scene behind it through, a SHADOW that separates it from
 * what it floats over, and a BODY that is darker at the bottom than
 * the top because light falls off through it.
 *
 * All five are drawn here. The gradient edge is an SVG stroke because
 * React Native has no gradient border; everything else is real layout.
 *
 * Use it for the few surfaces that should genuinely float. Putting a
 * glass rectangle behind every element is how an interface stops
 * having a hierarchy.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';

export interface BerxGlassPanelProps {
	/** Colour of the light hitting the panel's edge. */
	edge?: string;
	/** Tint of the glass body. */
	tint?: string;
	/** 0..1 how much the body tints what is behind it. */
	opacity?: number;
	radius?: number;
	/** Vertical padding inside the panel. */
	padding?: number;
	/** Lifts the panel further off the scene. */
	elevated?: boolean;
	children?: React.ReactNode;
	style?: ViewStyle;
}

export function BerxGlassPanel({
	edge = '#FFFFFF',
	tint = '#0B1016',
	opacity = 0.42,
	radius = 32,
	padding = 22,
	elevated = true,
	children,
	style,
}: BerxGlassPanelProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	return (
		<View
			style={[
				{
					borderRadius: radius,
					paddingVertical: padding,
					paddingHorizontal: padding,
					overflow: 'hidden',
					backgroundColor: 'transparent',
				},
				elevated && {
					shadowColor: '#000000',
					shadowOpacity: 0.5,
					shadowRadius: 34,
					shadowOffset: {width: 0, height: 20},
					elevation: 18,
				},
				style,
			]}>
			{/* BODY + EDGE, one SVG so the stroke sits exactly on the radius. */}
			<Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
				<Defs>
					<LinearGradient id={`${uid}-body`} x1="0" y1="0" x2="0.35" y2="1">
						<Stop offset="0%" stopColor={edge} stopOpacity={0.1 * opacity + 0.03} />
						<Stop offset="34%" stopColor={tint} stopOpacity={opacity * 0.82} />
						<Stop offset="100%" stopColor={tint} stopOpacity={opacity} />
					</LinearGradient>
					{/* Brightest at the top-left corner, gone by the bottom-right:
					    one light source, wrapping one edge. */}
					<LinearGradient id={`${uid}-edge`} x1="0" y1="0" x2="1" y2="1">
						<Stop offset="0%" stopColor={edge} stopOpacity={0.55} />
						<Stop offset="30%" stopColor={edge} stopOpacity={0.2} />
						<Stop offset="65%" stopColor={edge} stopOpacity={0.07} />
						<Stop offset="100%" stopColor={edge} stopOpacity={0.16} />
					</LinearGradient>
				</Defs>
				<Rect x="0" y="0" width="100%" height="100%" rx={radius} ry={radius} fill={`url(#${uid}-body)`} />
				<Rect
					x="0.75"
					y="0.75"
					width="98.5%"
					height="98.5%"
					rx={radius}
					ry={radius}
					fill="none"
					stroke={`url(#${uid}-edge)`}
					strokeWidth={1.5}
				/>
			</Svg>
			{/* INNER HIGHLIGHT — the sheen just inside the top edge. */}
			<View
				pointerEvents="none"
				style={{
					position: 'absolute',
					top: 1,
					left: radius * 0.5,
					right: radius * 0.5,
					height: 1,
					backgroundColor: edge,
					opacity: 0.34,
				}}
			/>
			{children}
		</View>
	);
}
