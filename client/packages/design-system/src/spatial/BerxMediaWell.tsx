/**
 * BerxMediaWell — where a picture would be.
 *
 * Every surface in BERX that can show an image can also not have one:
 * a member with no avatar, a video with no poster frame (BERX has no
 * thumbnail-extraction pipeline — see BerxVideoPlayer's header), a
 * place saved before its cover was uploaded. Each of those was
 * painting the same fixed graphite rectangle.
 *
 * A fixed grey belongs to no plane. In a lit room it is darker than
 * the wall behind it, so the missing image reads as a hole punched
 * through the object rather than as part of it — the same inversion
 * that made whole content planes look like holes cut in the wall.
 *
 * A well is the honest shape instead: the structure plane's own
 * material, lit by the light that actually reaches this corner of
 * the room and flattened against the room's colour there. It sits
 * *behind* the content it belongs to, which is what a recess is, and
 * it says nothing about what the image would have been — an invented
 * placeholder graphic is a claim, and there is nothing to claim.
 *
 * Outside a scene it renders the neutral fill, because an object with
 * no room has no light — the honest answer rather than an invented
 * one.
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import {colors} from '../tokens';
import {BerxSurface} from './BerxSurface';
import {useBerxSceneOptional} from './BerxSpatialScene';
import {useBerxRoomLight} from './useBerxRoomLight';

export interface BerxMediaWellProps {
	radius?: number;
	children?: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
}

export function BerxMediaWell({radius = 12, children, style, testID}: BerxMediaWellProps) {
	const scene = useBerxSceneOptional();
	const room = useBerxRoomLight();

	if (!scene) {
		return (
			<View testID={testID} style={[styles.flat, {borderRadius: radius}, style]}>
				{children}
			</View>
		);
	}

	const structure = scene.scene.layers.D2;
	return (
		<View testID={testID} ref={room.measure} onLayout={room.onLayout} style={style}>
			<BerxSurface
				surface={structure.surface}
				lighting={structure.lighting}
				radius={radius}
				illumination={room.illumination}
				behind={room.behind}
				style={styles.well}>
				{children}
			</BerxSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	well: {flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
	flat: {flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.graphite},
});
