/**
 * useBerxRoomLight — where an object is standing, and how lit that is.
 *
 * A BERX scene has light sources at real positions. Nothing standing
 * in the scene knew about them, so every card in a list was lit
 * identically wherever it sat — which is exactly what makes a list of
 * objects read as a list of rectangles: one repeated surface, one
 * repeated highlight, no sense that the objects are anywhere.
 *
 * An object measures itself once per layout and asks the room how
 * bright its own corner is. Once per layout, not once per frame: the
 * performance contract forbids reading layout inside an animation
 * frame, and an object's place in the room is not something that
 * changes sixty times a second.
 *
 * Outside a scene, or before the backdrop has painted, it returns the
 * even wash — the honest answer when there is no room yet, rather
 * than an invented one.
 */
import {useCallback, useState} from 'react';
import {useWindowDimensions, type View} from 'react-native';
import {berxIlluminationAt, berxRoomColorAt} from '@berx/spatial';
import {useBerxSceneOptional} from './BerxSpatialScene';

/** The neutral value: neither brighter nor darker than an even wash. */
export const BERX_EVEN_LIGHT = 0.5;

export interface BerxRoomLight {
	/** 0..1 for this object's position. 0.5 until it has been measured. */
	illumination: number;
	/**
	 * The room's own colour at this object's position, or null before
	 * it has been measured.
	 *
	 * A surface that lost its translucency — which on React Native is
	 * every surface, since there is no backdrop filter without a native
	 * module — is flattened over the substrate. That is right only
	 * where the substrate is what is behind it, and in a lit room it is
	 * not: the room between two cards measured 12 L* brighter than the
	 * cards in front of it, so the content plane rendered as holes cut
	 * in the wall. Given this, a surface flattens its own fill against
	 * what is really behind it.
	 */
	behind: string | null;
	/** Attach to the measured element, alongside onLayout. */
	measure: (node: View | null) => void;
	/** Call from onLayout; re-measures the object's place in the room. */
	onLayout: () => void;
}

export function useBerxRoomLight(): BerxRoomLight {
	const scene = useBerxSceneOptional();
	const {width, height} = useWindowDimensions();
	const [illumination, setIllumination] = useState(BERX_EVEN_LIGHT);
	const [behind, setBehind] = useState<string | null>(null);
	const [node, setNode] = useState<View | null>(null);
	const atmosphere = scene?.atmosphere ?? null;

	const onLayout = useCallback(() => {
		if (!node || !atmosphere) return;
		node.measureInWindow((x, y, w, h) => {
			if (w <= 0 || h <= 0) return;
			/* the object's centre, in the room's own normalized space */
			const nx = (x + w / 2) / Math.max(1, width);
			const ny = (y + h / 2) / Math.max(1, height);
			const next = berxIlluminationAt(atmosphere, nx, ny);
			setIllumination((prev) => (Math.abs(prev - next) < 0.02 ? prev : next));
			const room = berxRoomColorAt(atmosphere, scene?.scene.background ?? '#050505', nx, ny);
			setBehind((prev) => (prev === room ? prev : room));
		});
	}, [node, atmosphere, width, height, scene?.scene.background]);

	return {illumination, behind, measure: setNode, onLayout};
}
