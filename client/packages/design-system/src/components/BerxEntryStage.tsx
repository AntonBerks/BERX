/**
 * BERX ENTRY STAGE — the one environment the whole entry sequence
 * stands in.
 *
 * Splash, welcome, discover, sign-in, sign-up and every onboarding
 * step share this, rather than each assembling a similar-looking
 * background of its own. "Does it feel like one product" is answered
 * by literally sharing the stage; nineteen screens that merely
 * resemble each other drift apart on the first edit.
 *
 * `progress` moves the camera THROUGH that one environment instead of
 * changing it: the ember pool rises and the floating slabs drift up
 * and recede as the sequence advances, so the last screen is
 * recognisably the same room as the first, seen from further in.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {BerxAura} from './BerxAura';
import {BerxPlanes} from './BerxPlanes';
import type {BerxPlaneSpec} from './BerxPlanes';
import {BerxGrain} from './BerxGrain';
import {BERX_SCENE} from '../palette';

export interface BerxEntryStageProps {
	/** 0..1 — how far through the sequence this screen is. */
	progress?: number;
	/**
	 * How much of the frame the slabs are allowed to occupy, from the
	 * top. Screens with a lot of content pull this in so the 3D never
	 * competes with what the user is actually reading.
	 */
	field?: number;
	/**
	 * How present the slabs are. Content-heavy steps pull this right
	 * down: 3D is a material inside the design, and a slab that competes
	 * with a headline for attention has stopped being one.
	 */
	presence?: number;
	children?: React.ReactNode;
	style?: ViewStyle;
}

/** Authored once, then drifted by `progress`. */
const SLABS: BerxPlaneSpec[] = [
	{x: 0.68, y: 0.09, w: 0.3, depth: 0.88, tilt: -6},
	{x: 0.3, y: 0.15, w: 0.24, depth: 0.72, tilt: 4},
	{x: 0.74, y: 0.24, w: 0.44, depth: 0.1, tilt: -3},
	{x: 0.22, y: 0.3, w: 0.34, depth: 0.42, tilt: 7},
	{x: 0.52, y: 0.38, w: 0.2, depth: 0.8, tilt: -8},
];

export function BerxEntryStage({progress = 0, field = 0.52, presence = 1, children, style}: BerxEntryStageProps) {
	const p = Math.max(0, Math.min(1, progress));
	const planes = useMemo(
		() =>
			SLABS.map((s: BerxPlaneSpec) => ({
				...s,
				// The nearer a slab is, the more the camera move shifts it —
				// which is what parallax is.
				y: s.y - p * 0.16 * (1 - s.depth) - p * 0.04,
				depth: Math.min(1, s.depth + p * 0.18),
			})),
		[p],
	);
	const styles = useMemo(
		() =>
			StyleSheet.create({
				screen: {flex: 1, backgroundColor: BERX_SCENE.ground, overflow: 'hidden'},
				field: {
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: `${field * 100}%` as unknown as number,
					opacity: presence,
				},
			}),
		[field, presence],
	);

	return (
		<View style={[styles.screen, style]}>
			<BerxAura
				ground={BERX_SCENE.ground}
				glow={BERX_SCENE.glow}
				counter={BERX_SCENE.counter}
				intensity={1}
				at={0.52 - p * 0.2}
			/>
			<BerxPlanes planes={planes} light={BERX_SCENE.light} body={BERX_SCENE.object} style={styles.field} />
			<BerxGrain opacity={0.045} />
			{children}
		</View>
	);
}
