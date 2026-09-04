/**
 * BerxNowPulse — the live-state marker.
 *
 * NOW is a real temporal state in BERX (something is happening, near
 * you, at this moment), so the pulse is only rendered when the caller
 * passes a real `live` flag derived from server data. It is never a
 * permanent decoration that implies liveness the data does not have.
 *
 * The animation is the scene's ambient loop. When that loop is
 * suspended — reduced motion, low tier — the marker holds a solid
 * dot: the meaning survives, the movement does not.
 */

import {StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxEnergyHalo} from './BerxEnergyHalo';
import {typography} from '../tokens';

export interface BerxNowPulseProps {
	/** Real liveness from the server. False renders nothing at all. */
	live: boolean;
	label?: string;
	/** 0..1 — how much is happening. Drives the halo's energy, not its presence. */
	intensity?: number;
	testID?: string;
}

export function BerxNowPulse({live, label = 'Сейчас', intensity = 0.8, testID}: BerxNowPulseProps) {
	const {scene} = useBerxScene();
	if (!live) return null;

	return (
		<View testID={testID} accessible accessibilityRole="text" accessibilityLabel={`${label}, идёт прямо сейчас`} style={styles.root}>
			<View style={styles.dotWrap}>
				<BerxEnergyHalo size={18} intensity={intensity} />
				<View style={[styles.dot, {backgroundColor: scene.accent}]} />
			</View>
			<Text style={[styles.label, {color: scene.accent, backgroundColor: rgba(scene.accent, 0.1)}]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flexDirection: 'row', alignItems: 'center', gap: 6},
	dotWrap: {width: 18, height: 18, alignItems: 'center', justifyContent: 'center'},
	dot: {position: 'absolute', width: 7, height: 7, borderRadius: 4},
	label: {
		fontSize: typography.sizeXs,
		fontWeight: typography.weightMedium,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 999,
		overflow: 'hidden',
	},
});
