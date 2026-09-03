/**
 * BERX SPATIAL STAGE — the real native 3D stage every BERX scene
 * stands on.
 *
 * ONE camera language, ONE lighting rig, ONE quality policy. Before
 * this, each *.native.tsx object declared its own ambient + point
 * lights with its own hand-picked intensities and its own camera fov,
 * so two objects on adjacent screens were lit by different suns and
 * seen through different lenses. Composing them all from this stage is
 * what makes the app read as one world (master directive §27 — "a
 * shared world, not 200 mini engines").
 *
 * Real @react-three/fiber/native: a real PerspectiveCamera, real
 * lights, a real GL context via expo-gl. Not a transform trick.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * This repo has no ios/ or android/ project directory, and this
 * container has no Xcode, Android SDK, emulator or /dev/kvm, so no
 * native build can be produced here to run it. The dependency matrix
 * IS satisfied on disk (three 0.169.0, @react-three/fiber 9.7.0 with a
 * real /native subpath, expo-gl 15.1.7, expo 57, RN 0.79.7, React
 * 19.2.8 — every R3F peer range met), and this file is type-checked
 * against those real installed typings. See BERX_DECISIONS.md for the
 * exact steps that would unblock a native build.
 *
 * Only ever bundled by Metro on iOS/Android; the web harness always
 * resolves to SpatialStage.tsx instead.
 */
import {useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, ViewStyle} from 'react-native';
import {Canvas} from '@react-three/fiber/native';
import {SPATIAL_CAMERA, SPATIAL_LIGHT, SPATIAL_QUALITY} from './stage';
import type {SpatialQuality} from './stage';

export interface SpatialStageProps {
	children?: ReactNode;
	/** Which camera language this scene speaks — see SPATIAL_CAMERA. */
	camera?: 'object' | 'hero' | 'scene';
	quality?: SpatialQuality;
	/**
	 * Scales the WHOLE rig, keeping every light's direction and colour.
	 *
	 * This exists so a deliberately restrained object (SpatialLens on
	 * Welcome — "one object so quiet you have to look twice") can be dim
	 * without owning a private lighting rig. Same sun, turned down; not
	 * a different sun. Anything that wants a different light DIRECTION
	 * belongs in the scene, not here.
	 */
	intensity?: number;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export function SpatialStage({
	children,
	camera = 'object',
	quality = 'high',
	intensity = 1,
	width,
	height,
	style,
}: SpatialStageProps) {
	const lens = SPATIAL_CAMERA[camera];
	const tier = SPATIAL_QUALITY[quality];
	// Both objects are re-created only when their inputs actually
	// change: R3F treats a new `camera`/`gl` prop object as a real
	// update, so an inline literal would re-apply it on every render.
	const cameraProp = useMemo(() => ({position: lens.position, fov: lens.fov}), [lens]);
	const glProp = useMemo(() => ({antialias: tier.antialias}), [tier.antialias]);

	return (
		<View style={[{width, height}, style]}>
			<Canvas camera={cameraProp} gl={glProp}>
				<ambientLight intensity={SPATIAL_LIGHT.ambient.intensity * intensity} />
				<pointLight
					position={SPATIAL_LIGHT.key.position}
					intensity={SPATIAL_LIGHT.key.intensity * intensity}
					color={SPATIAL_LIGHT.key.color}
				/>
				{/* First thing dropped on LOW: a full extra lighting pass, whose
				    absence reads as "moodier" rather than "broken". */}
				{tier.fillLight ? (
					<pointLight
						position={SPATIAL_LIGHT.fill.position}
						intensity={SPATIAL_LIGHT.fill.intensity * intensity}
						color={SPATIAL_LIGHT.fill.color}
					/>
				) : null}
				{children}
			</Canvas>
		</View>
	);
}
