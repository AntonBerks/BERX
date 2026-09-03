/**
 * BERX FEED SCENE — real native 3D. The world, not a widget above it.
 *
 * DIRECTION CORRECTION — THE WORLD, NOT A WIDGET ABOVE THE OLD FEED.
 * This scene previously sat in a bounded 340px box above an otherwise
 * unchanged FlatList of post cards — real 3D data-driven material, but
 * structurally still "old feed with a decoration bolted on top". It is
 * now the WHOLE feed surface, full-bleed behind every other screen
 * element: there is no separate scrolling list of cards underneath it
 * any more. FeedScreen.tsx reads whichever post is currently nearest
 * the camera off `onFocusChange` and renders that one real post's
 * text/actions in a docked reading panel — the world itself renders no
 * paragraph text and has no per-node tap target (see below).
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * See BERX_DECISIONS.md ("3D / spatial rendering") for the exact,
 * evidence-based native-build status. Nothing here has been run on a
 * real GL context — this container has no ios/ or android/ project and
 * no device/simulator to build one on. What IS real: written directly
 * against the installed @react-three/fiber@9.7.0 native API and the
 * shared Spatial Engine (SpatialStage/useSpatialGlass/useSpatialDrag),
 * and passes the project's real TypeScript check. The texture load
 * below (useLoader + TextureLoader, wrapped in Suspense) is the same
 * public R3F hook every drei useTexture/useGLTF example wraps the same
 * way; `item.media_url` is the identical field FeedScreen.tsx used to
 * hand straight to a plain RN <Image source={{uri:...}}> before this
 * rewrite, so this is not a new assumption about what that field is.
 *
 * WHY THIS IS 3D AND NOT DECORATION. Depth here is data, the same
 * discipline BerxTimelineScene/BerxTripScene already established: z is
 * the real, server-ranked ORDER feed.php returned (recency/engagement
 * blend, transparent — see that endpoint's own header), not a raw
 * timestamp reinterpreted, and not anything invented to fill the
 * scene — a feed with three posts renders exactly three nodes. Every
 * OTHER real property BerxFeedItem carries is what the scene's
 * material actually encodes, not decoration layered on top of it:
 *
 *   SHAPE     — a real photograph (media_url) is a sphere WEARING that
 *               actual photo as a real texture map, a real text-only
 *               post is a cut plane. Two different kinds of thing,
 *               drawn as two different kinds of object carrying its
 *               own real content, the same vocabulary BerxDepthScene
 *               already uses to tell a committed place from a bare
 *               Plan.
 *   EMISSIVE  — real resonance. like_count + comment_count, normalised
 *               against the loudest post actually in THIS page (never
 *               against an invented absolute maximum — same rule
 *               BerxSocialScene already applies to mutual_count).
 *
 * FOCUS, NOT RAYCASTING. No existing BERX scene raycasts touch through
 * the camera onto a specific mesh (Worlds/Timeline/Trip are all
 * drag-only visualisations, never a 3D tap target), and this scene
 * follows the same rule — but it now needs to tell the REST of the
 * screen which post the camera is looking at, so its 2D reading panel
 * shows the right one. The camera dollies along the real order axis
 * exactly as before; the nearest node's real index is computed each
 * frame from the same dolly value driving the camera (`round(dolly /
 * SPACING_Z)`) and reported up through `onFocusChange`, throttled to
 * fire only when that integer index actually changes. Opening a post
 * still happens by tapping the docked panel FeedScreen renders for
 * that focused item, not by touching a mesh.
 *
 * A texture load can fail (a dead URL, a cold cache, no network) —
 * that must never take the whole stream down, so every media node is
 * its own Suspense + error boundary, falling back to the same plain
 * glass sphere the scene drew before this file carried textures at
 * all. One bad photo dims to a glass bead; it never blanks the scene.
 */
import {Component, Suspense, useRef} from 'react';
import type {MutableRefObject, ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import {useFrame, useLoader} from '@react-three/fiber/native';
import type {RootState} from '@react-three/fiber/native';
import {TextureLoader} from 'three';
import type {Group} from 'three';
import type {BerxFeedItem} from '@berx/api/types';
import {colors} from '@berx/design-system/tokens';
import {SpatialStage} from '@berx/design-system/spatial/engine/SpatialStage';
import {useSpatialGlass, useSpatialKeyLight} from '@berx/design-system/spatial/engine/quality';
import {useSpatialDrag} from '@berx/design-system/spatial/engine/useSpatialDrag';
import {
	SPATIAL_FILL_LIGHT,
	SPATIAL_EMISSIVE,
	SPATIAL_MOTION,
} from '@berx/design-system/spatial/engine/stage';

/** How far apart consecutive posts sit on the order axis, in world units — the same unit the 2D fallback's dolly math uses. */
const SPACING_Z = 0.95;
/** Cap the node count — a feed page is api.feed(20, 0); this leaves room without ever uncapping frame cost. */
const MAX_NODES = 20;
/** Sphere radius for a photo node — big enough that the real texture it wears actually reads as a photo, not a coloured bead. */
const MEDIA_RADIUS = 0.19;

function resonance(item: BerxFeedItem): number {
	return (item.like_count ?? 0) + (item.comment_count ?? 0);
}

interface NodeProps {
	item: BerxFeedItem;
	index: number;
	maxResonance: number;
}

/** Shared position/drift/lighting math every node variant below uses identically. */
function useNodeRig(index: number, maxResonance: number, item: BerxFeedItem) {
	const ref = useRef<Group>(null);
	// Alternate sides of the axis so nodes never occlude each other
	// straight down the barrel of the camera — same layout Timeline uses
	// for the same reason.
	const side = index % 2 === 0 ? 1 : -1;
	const x = side * (0.52 + (index % 3) * 0.13);
	const z = -index * SPACING_Z;
	const glass = useSpatialGlass();
	const keyLight = useSpatialKeyLight();
	const t = maxResonance > 0 ? Math.min(1, resonance(item) / maxResonance) : 0;
	const emissiveIntensity = SPATIAL_EMISSIVE.dormant + (SPATIAL_EMISSIVE.live - SPATIAL_EMISSIVE.dormant) * t;

	useFrame((state: RootState) => {
		if (!ref.current) return;
		ref.current.rotation.y = state.clock.elapsedTime * SPATIAL_MOTION.driftRadPerSec + index;
	});

	return {ref, x, z, glass, keyLight, emissiveIntensity};
}

/** The stem down to the axis, shared by every node variant, so each post reads as attached to the stream rather than floating loose beside it. */
function Stem({x}: {x: number}) {
	const keyLight = useSpatialKeyLight();
	return (
		<mesh position={[-x / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
			<cylinderGeometry args={[0.004, 0.004, Math.abs(x), 6]} />
			<meshBasicMaterial color={keyLight} transparent opacity={0.26} />
		</mesh>
	);
}

/** A text-only post — a cut plane, the same "an intention, not a photographed thing" distinction BerxDepthScene already draws, applied here to words vs media. */
function PostNodeText({item, index, maxResonance}: NodeProps) {
	const {ref, x, z, glass, keyLight, emissiveIntensity} = useNodeRig(index, maxResonance, item);
	return (
		<group ref={ref} position={[x, 0, z]}>
			<mesh>
				<boxGeometry args={[0.2, 0.2, 0.05]} />
				<meshPhysicalMaterial {...glass} color={keyLight} emissive={keyLight} emissiveIntensity={emissiveIntensity} />
			</mesh>
			<Stem x={x} />
		</group>
	);
}

/** A media post before/without its real texture — the same plain glass sphere this scene drew before texture-mapping existed. Used as the Suspense fallback AND the error-boundary fallback, so a slow or dead image degrades to this instead of ever taking the node — or the scene — down. */
function PostNodeMediaFallback({item, index, maxResonance}: NodeProps) {
	const {ref, x, z, glass, keyLight, emissiveIntensity} = useNodeRig(index, maxResonance, item);
	return (
		<group ref={ref} position={[x, 0, z]}>
			<mesh>
				<sphereGeometry args={[MEDIA_RADIUS, 24, 24]} />
				<meshPhysicalMaterial {...glass} color={SPATIAL_FILL_LIGHT} emissive={keyLight} emissiveIntensity={emissiveIntensity} />
			</mesh>
			<Stem x={x} />
		</group>
	);
}

/** A media post wearing its own real photograph as the sphere's texture map. Suspends while the image loads — always rendered inside the Suspense/TextureBoundary pair below, never bare. */
function PostNodeMedia({item, index, maxResonance, url}: NodeProps & {url: string}) {
	const {ref, x, z, glass, keyLight, emissiveIntensity} = useNodeRig(index, maxResonance, item);
	const texture = useLoader(TextureLoader, url);
	return (
		<group ref={ref} position={[x, 0, z]}>
			<mesh>
				<sphereGeometry args={[MEDIA_RADIUS, 24, 24]} />
				<meshPhysicalMaterial {...glass} map={texture} color="#ffffff" emissive={keyLight} emissiveIntensity={emissiveIntensity} />
			</mesh>
			<Stem x={x} />
		</group>
	);
}

/** Catches a failed texture load (dead URL, no network) and falls back to the plain glass sphere rather than losing the node — or throwing past the scene entirely. */
class TextureBoundary extends Component<{fallback: ReactNode; children: ReactNode}, {failed: boolean}> {
	state = {failed: false};
	static getDerivedStateFromError() {
		return {failed: true};
	}
	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

function PostNode(props: NodeProps) {
	const url = props.item.media_url;
	if (!url) return <PostNodeText {...props} />;
	const fallback = <PostNodeMediaFallback {...props} />;
	return (
		<TextureBoundary fallback={fallback}>
			<Suspense fallback={fallback}>
				<PostNodeMedia {...props} url={url} />
			</Suspense>
		</TextureBoundary>
	);
}

/** The order axis itself — one line the stream recedes along, same role Timeline's TimeAxis plays for history. */
function StreamAxis({length}: {length: number}) {
	const keyLight = useSpatialKeyLight();
	return (
		<mesh position={[0, 0, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.007, 0.007, length, 8]} />
			<meshBasicMaterial color={keyLight} transparent opacity={0.32} />
		</mesh>
	);
}

function Scene({
	items,
	dollyRef,
	advance,
	onFocusChange,
}: {
	items: BerxFeedItem[];
	dollyRef: MutableRefObject<number>;
	advance: (d: number) => void;
	onFocusChange?: (index: number) => void;
}) {
	const lastFocusRef = useRef(-1);
	// Real camera translation along the real order — the user is moving
	// THROUGH their feed's actual shape, not spinning a decoration. The
	// same dolly value also decides which post is "in focus" for the
	// rest of the screen — see this file's own header.
	useFrame((state: RootState, delta: number) => {
		advance(delta);
		state.camera.position.z = 2.3 - dollyRef.current;
		state.camera.lookAt(0, 0, state.camera.position.z - 3);
		if (items.length > 0) {
			const focused = Math.max(0, Math.min(items.length - 1, Math.round(dollyRef.current / SPACING_Z)));
			if (focused !== lastFocusRef.current) {
				lastFocusRef.current = focused;
				onFocusChange?.(focused);
			}
		}
	});
	const length = Math.max(items.length, 1) * SPACING_Z + 2;
	// Normalised against the loudest post actually on THIS page — never
	// an invented absolute maximum.
	const maxResonance = items.reduce((m, it) => Math.max(m, resonance(it)), 0);
	return (
		<>
			<StreamAxis length={length} />
			{items.map((item: BerxFeedItem, i: number) => (
				<PostNode key={item.guid} item={item} index={i} maxResonance={maxResonance} />
			))}
		</>
	);
}

interface Props {
	items: BerxFeedItem[];
	/** Fires with the real index of whichever post is currently nearest the camera — FeedScreen's docked reading panel is driven off this. */
	onFocusChange?: (index: number) => void;
}

export default function BerxFeedScene({items, onFocusChange}: Props) {
	const shown = items.slice(0, MAX_NODES);
	// A flick coasts through the stream and decelerates, instead of
	// stopping the instant the finger lifts. Clamped to the REAL number
	// of posts actually on this page — momentum cannot dolly past the
	// last real thing that was returned.
	const {panHandlers, valueRef: dollyRef, advance} = useSpatialDrag({
		sensitivity: 0.02,
		min: 0,
		max: Math.max(shown.length - 1, 0) * SPACING_Z,
		invert: true,
	});

	return (
		<View style={styles.wrap} {...panHandlers}>
			<SpatialStage camera="scene" style={StyleSheet.absoluteFillObject as never}>
				<Scene items={shown} dollyRef={dollyRef} advance={advance} onFocusChange={onFocusChange} />
			</SpatialStage>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {flex: 1, backgroundColor: colors.bg},
});
