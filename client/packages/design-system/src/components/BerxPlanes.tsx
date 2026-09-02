/**
 * BERX PLANES — the architectural 3D language.
 *
 * Not a sphere, not an icon, not a mascot. BERX's 3D is flat glass
 * slabs seen at an angle, floating at different depths, each catching
 * the scene's light along one leading edge. It reads as architecture
 * rather than as an illustration, it costs nothing to render, and the
 * same construction scales to every object the product needs: a
 * checkpoint is a slab with a mark on it, a badge is a slab with a
 * rim, a ticket is a long slab, a reward is a stack of them.
 *
 * Depth is real, not implied. Each slab has its own size, its own
 * brightness, its own edge strength and its own thickness, and they
 * are drawn far-to-near so the close ones occlude the distant ones.
 * The nearest slab is sharp and lit; the furthest is barely a
 * suggestion of a back wall.
 *
 * The field is MEASURED rather than assumed. Drawing this in a square
 * viewBox stretched to a phone would shear every slab into a different
 * shape than the one it was authored as — the geometry has to be laid
 * out in the real pixel box it will occupy.
 */
import {useMemo, useState} from 'react';
import {View, StyleSheet, ViewStyle, LayoutChangeEvent} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Polygon} from 'react-native-svg';

export interface BerxPlaneSpec {
	/** Centre, as a fraction of the field. */
	x: number;
	y: number;
	/** Width as a fraction of the field's width. */
	w: number;
	/** How far back it sits, 0 = nearest, 1 = furthest. */
	depth: number;
	/** Lean, in degrees. */
	tilt?: number;
}

export interface BerxPlanesProps {
	planes: BerxPlaneSpec[];
	/** Light along each slab's leading edge. */
	light: string;
	/** Body of the glass. */
	body: string;
	style?: ViewStyle;
}

export function BerxPlanes({planes, light, body, style}: BerxPlanesProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const [size, setSize] = useState<{w: number; h: number} | null>(null);

	function onLayout(e: LayoutChangeEvent) {
		const {width, height} = e.nativeEvent.layout;
		if (!size || Math.abs(size.w - width) > 1 || Math.abs(size.h - height) > 1) {
			setSize({w: width, h: height});
		}
	}

	// Far to near, so nearer slabs occlude the ones behind them.
	const ordered = useMemo(
		() => planes.map((p: BerxPlaneSpec, i: number) => ({p, i})).sort((a, b) => b.p.depth - a.p.depth),
		[planes],
	);

	return (
		<View pointerEvents="none" onLayout={onLayout} style={[StyleSheet.absoluteFillObject, style]}>
			{size ? (
				<Svg width={size.w} height={size.h}>
					<Defs>
						{planes.map((p: BerxPlaneSpec, i: number) => {
							// Nearer slabs are brighter and more present. The far ones
							// exist to give the space a back wall, not to be looked at.
							const near = 1 - Math.min(1, Math.max(0, p.depth));
							return (
								<LinearGradient key={i} id={`${uid}-f${i}`} x1="0" y1="0" x2="0.85" y2="1">
									<Stop offset="0%" stopColor={light} stopOpacity={0.3 * near + 0.03} />
									<Stop offset="40%" stopColor={body} stopOpacity={0.55 * near + 0.14} />
									<Stop offset="100%" stopColor={body} stopOpacity={0.36 * near + 0.07} />
								</LinearGradient>
							);
						})}
						{planes.map((p: BerxPlaneSpec, i: number) => {
							const near = 1 - Math.min(1, Math.max(0, p.depth));
							return (
								<LinearGradient key={`e${i}`} id={`${uid}-e${i}`} x1="0" y1="0" x2="1" y2="0.7">
									<Stop offset="0%" stopColor={light} stopOpacity={0.85 * near + 0.05} />
									<Stop offset="45%" stopColor={light} stopOpacity={0.24 * near + 0.03} />
									<Stop offset="100%" stopColor={light} stopOpacity={0.04 * near} />
								</LinearGradient>
							);
						})}
						{planes.map((p: BerxPlaneSpec, i: number) => {
							const near = 1 - Math.min(1, Math.max(0, p.depth));
							return (
								<LinearGradient key={`s${i}`} id={`${uid}-s${i}`} x1="0" y1="0" x2="1" y2="0">
									<Stop offset="0%" stopColor={body} stopOpacity={0.9} />
									<Stop offset="100%" stopColor={light} stopOpacity={0.16 * near} />
								</LinearGradient>
							);
						})}
					</Defs>
					{ordered.map(({p, i}) => {
						const w = p.w * size.w;
						// One isometric proportion for every slab, so the whole set
						// reads as lying in a single space.
						const h = w * 0.34;
						const skew = w * 0.22;
						const thick = Math.max(2, w * 0.05);
						const cx = p.x * size.w;
						const cy = p.y * size.h;
						const x = cx - w / 2;
						const y = cy - (h + skew) / 2;
						const near = 1 - Math.min(1, Math.max(0, p.depth));
						// Top face, then the short side that gives it thickness.
						const top = `0,${skew} ${w},0 ${w},${h} 0,${h + skew}`;
						const side = `0,${h + skew} ${w},${h} ${w},${h + thick} 0,${h + skew + thick}`;
						const t = `translate(${x} ${y}) rotate(${p.tilt ?? 0} ${w / 2} ${(h + skew) / 2})`;
						return (
							<Svg key={i} x={0} y={0}>
								<Polygon points={side} transform={t} fill={`url(#${uid}-s${i})`} />
								<Polygon
									points={top}
									transform={t}
									fill={`url(#${uid}-f${i})`}
									stroke={`url(#${uid}-e${i})`}
									strokeWidth={0.6 + near * 0.9}
								/>
							</Svg>
						);
					})}
				</Svg>
			) : null}
		</View>
	);
}
