/**
 * BERX SPATIAL STAGE — the real native 3D stage every BERX scene
 * stands on.
 *
 * ONE camera language, ONE lighting rig, ONE environment, ONE quality
 * policy. Before this, each *.native.tsx object declared its own
 * ambient + point lights with its own hand-picked intensities and its
 * own camera fov, so two objects on adjacent screens were lit by
 * different suns and seen through different lenses. Composing them all
 * from this stage is what makes the app read as one world (master
 * directive §27 — "a shared world, not 200 mini engines").
 *
 * Real @react-three/fiber/native: a real PerspectiveCamera, real
 * lights, a real PMREM-generated environment, a real GL context via
 * expo-gl. Not a transform trick.
 *
 * WHAT THIS STAGE ADDS BEYOND "SOME LIGHTS":
 *  - a RIM light behind the subject, which is what gives a dark object
 *    a silhouette against a dark ground;
 *  - a real IMAGE-BASED environment built procedurally from BERX's own
 *    rig, so polished surfaces have something in-brand to reflect
 *    instead of reflecting nothing and reading as plastic;
 *  - a contact disc, so hero objects sit on something.
 * Each is engine-level on purpose: one change here reaches every scene
 * at once, which is the whole reason the engine is shared.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * This repo has no ios/ or android/ project directory, and this
 * container has no Xcode, Android SDK, emulator or /dev/kvm, so no
 * native build can be produced here to run it. The dependency matrix
 * IS satisfied on disk (three 0.169.0, @react-three/fiber 9.7.0 with a
 * real /native subpath, expo-gl 15.1.7, expo 57, RN 0.79.7, React
 * 19.2.8 — every R3F peer range met), and this file is type-checked
 * against those real installed typings. Every three API used here
 * (PMREMGenerator.fromScene, Scene.environmentIntensity, itemSize-4
 * vertex alpha) was checked against the INSTALLED package rather than
 * assumed from documentation. See BERX_DECISIONS.md for the exact
 * steps that would unblock a native build.
 *
 * Only ever bundled by Metro on iOS/Android; the web harness always
 * resolves to SpatialStage.tsx instead.
 */
import {useEffect, useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, ViewStyle} from 'react-native';
import {Canvas, useThree} from '@react-three/fiber/native';
import {
	BackSide,
	BufferAttribute,
	Color,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	BoxGeometry,
	PMREMGenerator,
	RingGeometry,
	Scene,
} from 'three';
import type {Scene as ThreeScene, WebGLRenderer} from 'three';
import {SPATIAL_CAMERA, SPATIAL_ENV, SPATIAL_GROUND_DISC, SPATIAL_KEY_LIGHT, SPATIAL_LIGHT, SPATIAL_QUALITY} from './stage';
import type {SpatialQuality} from './stage';
import {SpatialQualityProvider} from './quality';

/**
 * Builds the room BERX objects reflect. Plain emissive-ish panels in a
 * dark box — see SPATIAL_ENV for why this is built rather than loaded.
 *
 * MeshBasicMaterial is correct here and not a shortcut: PMREM captures
 * this scene's COLOUR, so these surfaces must emit their colour
 * regardless of lighting. A shaded material would need lights inside
 * the environment scene to light the panels that are themselves the
 * lights, which is circular.
 */
function buildEnvironmentScene(): ThreeScene {
	const scene = new Scene();
	const box = new BoxGeometry(SPATIAL_ENV.roomSize, SPATIAL_ENV.roomSize, SPATIAL_ENV.roomSize);
	// BackSide so we are standing INSIDE the room looking out at its walls.
	const room = new Mesh(box, new MeshLambertMaterial({color: '#07080A', side: BackSide}));
	scene.add(room);

	for (const panel of SPATIAL_ENV.panels) {
		const light = new Mesh(
			new BoxGeometry(1, 1, 1),
			new MeshBasicMaterial({color: new Color(panel.color).multiplyScalar(panel.intensity)})
		);
		light.position.set(...panel.position);
		light.scale.set(...panel.scale);
		scene.add(light);
	}
	return scene;
}

/** Frees every geometry/material the environment scene owns. */
function disposeEnvironmentScene(scene: ThreeScene) {
	scene.traverse((obj) => {
		const mesh = obj as Mesh;
		if (!mesh.isMesh) return;
		mesh.geometry.dispose();
		const material = mesh.material;
		if (Array.isArray(material)) material.forEach((m) => m.dispose());
		else material.dispose();
	});
	scene.clear();
}

/**
 * Generates the environment map once and hands it to the live scene.
 *
 * Renders nothing itself. PMREM generation is a one-off GPU cost at
 * mount (a handful of small cubemap passes), not a per-frame one — the
 * result is a texture the renderer samples like any other.
 */
function SpatialEnvironment() {
	const gl = useThree((s) => s.gl) as WebGLRenderer;
	const scene = useThree((s) => s.scene);

	useEffect(() => {
		const pmrem = new PMREMGenerator(gl);
		const envScene = buildEnvironmentScene();
		const target = pmrem.fromScene(envScene, SPATIAL_ENV.blur);
		scene.environment = target.texture;
		scene.environmentIntensity = SPATIAL_ENV.intensity;
		// Everything allocated above is released here. A GL context on a
		// phone does not get to leak render targets across screen changes.
		return () => {
			scene.environment = null;
			target.dispose();
			pmrem.dispose();
			disposeEnvironmentScene(envScene);
		};
	}, [gl, scene]);

	return null;
}

/**
 * The disc of light an object spills onto the floor under itself.
 *
 * Not a shadow: the BERX ground is already near-black, so a darker
 * patch on it would be invisible. What actually reads as contact on a
 * dark set is the object's own light falling on the floor, brightest
 * directly beneath and falling off outward — so that is what this is.
 *
 * The falloff is real per-vertex alpha (a 4-component colour attribute,
 * which three treats as RGBA — verified against the installed build's
 * `vertexAlphas` program flag), on a RingGeometry whose phi segments
 * give genuinely concentric rings. A CircleGeometry would have put
 * every non-centre vertex at the same radius and interpolated to a
 * straight-line ramp; rings give it a curve.
 */
function GroundContact({segments, intensity}: {segments: number; intensity: number}) {
	const geometry = useMemo(() => {
		const theta = Math.max(16, Math.min(segments, 64));
		const rings = 6;
		const geo = new RingGeometry(0, SPATIAL_GROUND_DISC.radius, theta, rings);
		const position = geo.attributes.position;
		const rgba = new Float32Array(position.count * 4);
		const tint = new Color(SPATIAL_KEY_LIGHT);
		for (let i = 0; i < position.count; i += 1) {
			const distance = Math.hypot(position.getX(i), position.getY(i)) / SPATIAL_GROUND_DISC.radius;
			// Quadratic falloff — light spill drops off fast near the object
			// and lingers faintly at the edge. A linear ramp reads as a cone.
			const falloff = Math.max(0, 1 - distance) ** 2;
			rgba[i * 4] = tint.r;
			rgba[i * 4 + 1] = tint.g;
			rgba[i * 4 + 2] = tint.b;
			rgba[i * 4 + 3] = falloff;
		}
		geo.setAttribute('color', new BufferAttribute(rgba, 4));
		return geo;
	}, [segments]);

	// Disposed on unmount because it is built here, not by R3F.
	useEffect(() => () => geometry.dispose(), [geometry]);

	return (
		<mesh geometry={geometry} position={[0, SPATIAL_GROUND_DISC.offsetY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			{/* depthWrite off: this is light lying on a surface, so it must
			    never occlude anything sorted behind it. */}
			<meshBasicMaterial
				vertexColors
				transparent
				depthWrite={false}
				opacity={SPATIAL_GROUND_DISC.opacity * intensity}
			/>
		</mesh>
	);
}

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
	/**
	 * Draw the contact disc under the subject. Off by default: it is
	 * right for a single hero object sitting at the origin, and wrong
	 * for a scene of many nodes spread through depth (Timeline, Trip,
	 * Social), where a disc at the origin would be a bright patch under
	 * nothing in particular.
	 */
	grounded?: boolean;
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export function SpatialStage({
	children,
	camera = 'object',
	quality = 'high',
	intensity = 1,
	grounded = false,
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
				{/* Published to every descendant so a scene can pick the matching
				    glass recipe and geometry subdivision without each one taking
				    its own `quality` prop and threading it down by hand. */}
				<SpatialQualityProvider value={quality}>
					<ambientLight intensity={SPATIAL_LIGHT.ambient.intensity * intensity} />
					<pointLight
						position={SPATIAL_LIGHT.key.position}
						intensity={SPATIAL_LIGHT.key.intensity * intensity}
						color={SPATIAL_LIGHT.key.color}
					/>
					{/* The separation light. Cheap (one more point light) and the
					    single biggest difference between a lit object and a
					    photographed one — so it survives on every tier. */}
					<pointLight
						position={SPATIAL_LIGHT.rim.position}
						intensity={SPATIAL_LIGHT.rim.intensity * intensity}
						color={SPATIAL_LIGHT.rim.color}
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
					{/* Reflections cost a cubemap in memory and a sample per pixel
					    on every physical material, so LOW does without and leans on
					    the three real lights instead. */}
					{tier.environment ? <SpatialEnvironment /> : null}
					{grounded ? <GroundContact segments={tier.segments} intensity={intensity} /> : null}
					{children}
				</SpatialQualityProvider>
			</Canvas>
		</View>
	);
}
