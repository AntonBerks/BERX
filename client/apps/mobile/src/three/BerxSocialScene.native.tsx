/**
 * BERX SOCIAL SCENE — real native 3D. Your social graph as actual
 * structure.
 *
 * VERIFICATION STATUS — IMPLEMENTED, TYPE-CHECKED, NOT DEVICE-VERIFIED.
 * See BERX_DECISIONS.md ("3D / spatial rendering"). Nothing here has
 * been run on a GL context.
 *
 * WHAT IS HONEST HERE, AND WHAT DELIBERATELY IS NOT ENCODED.
 *
 * BERX has NO friendship-strength data. `BerxFriend` is
 * {guid, username, fullname, icon} — there is no interaction
 * frequency, no closeness score, no mutual count between you and
 * someone you are ALREADY friends with. So every friend sits on ONE
 * ring at ONE radius. Spreading them by depth would look richer and
 * would be a lie: it would be a closeness ranking invented by this
 * file rather than measured by the server.
 *
 * The one real structural signal BERX does have is `mutual_count` on
 * people you are NOT yet connected to (peopleDiscovery). That is what
 * drives depth here: a suggestion sharing many friends with you sits
 * NEAR your ring, one sharing a single friend sits far out. This
 * answers the question a flat avatar list cannot — "who is already
 * close to my world without being in it yet" — and it is measured,
 * not guessed.
 *
 * Edges are drawn ONLY where a real relationship exists: you-to-friend.
 * Suggestions have no line to you, because you are not connected to
 * them. Drawing one would misrepresent the graph.
 *
 * The only per-friend differentiator is real presence (`isOnline`,
 * from OssnUser::isOnline) — a live friend is lit, an offline one is
 * dim. Real state, not decoration.
 */
import {useMemo, useRef} from 'react';
import type {MutableRefObject} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useFrame} from '@react-three/fiber/native';
import type {RootState} from '@react-three/fiber/native';
import type {Group} from 'three';
import type {BerxFriend, BerxPeopleSuggestion} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {SpatialStage} from '@berx/design-system/spatial/engine/SpatialStage';
import {useSpatialGlass} from '@berx/design-system/spatial/engine/quality';
import {useSpatialDrag} from '@berx/design-system/spatial/engine/useSpatialDrag';
import {
	SPATIAL_KEY_LIGHT,
	SPATIAL_FILL_LIGHT,
	SPATIAL_EMISSIVE,
	SPATIAL_MOTION,
} from '@berx/design-system/spatial/engine/stage';

/** The single radius every existing friend sits at — see this file's header on why it is uniform. */
const FRIEND_RING = 1.7;
/** Suggestions live beyond the ring; more shared friends pulls them inward toward it. */
const SUGGEST_NEAR = 2.3;
const SUGGEST_FAR = 3.6;
/** Frame-cost caps. A graph is unreadable past this anyway. */
const MAX_FRIENDS = 24;
const MAX_SUGGESTIONS = 12;

/** You. The anchor everything else is positioned relative to. */
function SelfNode() {
	const ref = useRef<Group>(null);
	const glass = useSpatialGlass();
	useFrame((state: RootState) => {
		if (!ref.current) return;
		// A slow breath, so the centre reads as alive rather than as a dot.
		const s = 1 + Math.sin(state.clock.elapsedTime * SPATIAL_MOTION.breathRadPerSec) * SPATIAL_MOTION.breathAmplitude;
		ref.current.scale.set(s, s, s);
	});
	return (
		<group ref={ref}>
			<mesh>
				<icosahedronGeometry args={[0.26, 2]} />
				<meshPhysicalMaterial
					{...glass}
					color={SPATIAL_KEY_LIGHT}
					emissive={SPATIAL_KEY_LIGHT}
					emissiveIntensity={SPATIAL_EMISSIVE.live}
				/>
			</mesh>
		</group>
	);
}

/** A real friendship edge: centre -> friend. Only ever drawn for a real connection. */
function Edge({angle, length}: {angle: number; length: number}) {
	return (
		<mesh position={[(Math.cos(angle) * length) / 2, (Math.sin(angle) * length) / 2, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
			<cylinderGeometry args={[0.0035, 0.0035, length, 6]} />
			<meshBasicMaterial color={SPATIAL_KEY_LIGHT} transparent opacity={0.3} />
		</mesh>
	);
}

function FriendNode({angle, isOnline}: {angle: number; isOnline: boolean}) {
	const x = Math.cos(angle) * FRIEND_RING;
	const y = Math.sin(angle) * FRIEND_RING;
	const glass = useSpatialGlass();
	return (
		<mesh position={[x, y, 0]}>
			<sphereGeometry args={[0.13, 32, 32]} />
			<meshPhysicalMaterial
				{...glass}
				color={isOnline ? SPATIAL_KEY_LIGHT : SPATIAL_FILL_LIGHT}
				emissive={SPATIAL_KEY_LIGHT}
				// The one real per-friend difference BERX can prove: presence.
				emissiveIntensity={isOnline ? SPATIAL_EMISSIVE.present : SPATIAL_EMISSIVE.dormant}
			/>
		</mesh>
	);
}

/** Not connected to you — so no edge, and a wireframe body: present in the graph, not yet part of it. */
function SuggestionNode({angle, distance}: {angle: number; distance: number}) {
	return (
		<mesh position={[Math.cos(angle) * distance, Math.sin(angle) * distance, -0.35]}>
			<octahedronGeometry args={[0.12, 0]} />
			<meshStandardMaterial
				color={SPATIAL_FILL_LIGHT}
				emissive={SPATIAL_KEY_LIGHT}
				emissiveIntensity={SPATIAL_EMISSIVE.quiet}
				wireframe
				transparent
				opacity={0.75}
			/>
		</mesh>
	);
}

function Scene({
	friends,
	onlineGuids,
	suggestions,
	rotationRef,
	advance,
}: {
	friends: BerxFriend[];
	onlineGuids: Set<number>;
	suggestions: BerxPeopleSuggestion[];
	rotationRef: MutableRefObject<number>;
	advance: (d: number) => void;
}) {
	const group = useRef<Group>(null);
	useFrame((_state: RootState, delta: number) => {
		advance(delta);
		if (group.current) group.current.rotation.z = rotationRef.current;
	});

	// Normalise mutual_count across THIS response — the scale is relative
	// to who actually came back, never to an invented absolute maximum.
	const maxMutual = suggestions.reduce((m, s) => Math.max(m, s.mutual_count), 0);

	return (
		<group ref={group}>
			<SelfNode />
			{friends.map((f: BerxFriend, i: number) => {
				const angle = (i / Math.max(friends.length, 1)) * Math.PI * 2;
				return (
					<group key={`f-${f.guid}`}>
						<Edge angle={angle} length={FRIEND_RING} />
						<FriendNode angle={angle} isOnline={onlineGuids.has(f.guid)} />
					</group>
				);
			})}
			{suggestions.map((s: BerxPeopleSuggestion, i: number) => {
				// More shared friends -> nearer the ring. Real measured pull.
				const t = maxMutual > 0 ? s.mutual_count / maxMutual : 0;
				const distance = SUGGEST_FAR - t * (SUGGEST_FAR - SUGGEST_NEAR);
				// Offset from the friend angles so suggestions read as a
				// separate outer band rather than as more ring members.
				const angle = ((i + 0.5) / Math.max(suggestions.length, 1)) * Math.PI * 2;
				return <SuggestionNode key={`s-${s.guid}`} angle={angle} distance={distance} />;
			})}
		</group>
	);
}

interface Props {
	friends: BerxFriend[];
	online: {guid: number}[];
	suggestions: BerxPeopleSuggestion[];
}

export default function BerxSocialScene({friends, online, suggestions}: Props) {
	const onlineGuids = useMemo(() => new Set(online.map((o) => o.guid)), [online]);
	// Unbounded, like Worlds: your circle is something you turn all the
	// way around. A flick keeps it turning and lets it settle.
	const {panHandlers, valueRef: rotationRef, advance} = useSpatialDrag({sensitivity: 0.008});

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox} {...panHandlers}>
				<SpatialStage camera="scene" style={StyleSheet.absoluteFillObject as never}>
					<Scene
						friends={friends.slice(0, MAX_FRIENDS)}
						onlineGuids={onlineGuids}
						suggestions={suggestions.slice(0, MAX_SUGGESTIONS)}
						rotationRef={rotationRef}
						advance={advance}
					/>
				</SpatialStage>
			</View>
			<Text style={styles.hint}>
				Кольцо — ваши друзья. Снаружи — люди с общими друзьями: чем больше общих, тем ближе.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {
		height: 320,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.bg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center', paddingHorizontal: spacing.md},
});
