/**
 * !!! VERIFICATION STATUS: UNBUILDABLE IN THIS SANDBOX — read before touching.
 *
 * This is a real WebGL 3D scene (three.js via @react-three/fiber,
 * rendered through expo-gl's native GL context) — NOT the same thing
 * as Berx3DTilt.tsx's approach, which fakes depth from RN's own
 * `transform` (perspective + rotateX/rotateY) with zero dependencies.
 * This file genuinely needs `three`/`@react-three/fiber`/`expo-gl` on
 * disk to run at all.
 *
 * The standing constraint documented in Berx3DTilt.tsx's own header
 * ("react-three-fiber/Three.js/Skia are not installable in this
 * sandbox — npm is blocked") still applies. Nothing about that has
 * changed. This file was written anyway, at explicit user request,
 * fully aware it cannot be `npm install`ed, bundled, or `tsc`-checked
 * for real in this environment — every import below will resolve to
 * "Cannot find module" here, and that is expected, not a bug to chase.
 *
 * To actually run this outside this sandbox, in order:
 *   1. `npm install` — pulls in the four packages added to
 *      package.json (three, @react-three/fiber, expo-gl,
 *      expo-modules-core). Check @react-three/fiber's own
 *      compatibility table against this app's React 19 + native
 *      target before trusting the ^8.17.10 pin here — v8 is the
 *      long-proven native line, v9 targets React 19 but its native/
 *      Expo maturity wasn't something this sandbox could verify.
 *   2. This is a BARE React Native app (react-native run-android/
 *      run-ios in package.json, no Expo entry point) — expo-gl needs
 *      Expo's native-modules bridge, which a bare app doesn't have by
 *      default. Run `npx install-expo-modules@latest` from
 *      apps/mobile to bootstrap it (this is the real, current, Expo-
 *      documented command for adding Expo modules to an existing bare
 *      RN app — it edits Podfile/build.gradle/MainApplication for
 *      you; hand-editing those files blind, in a sandbox with no
 *      Xcode/Gradle to catch a mistake, would be worse than not
 *      touching them).
 *   3. `pod install` (iOS) and a Gradle sync (Android) after step 2.
 *   4. three.js on Hermes/JSC sometimes needs polyfills (URL, etc.)
 *      depending on the exact resolved versions — none are used by
 *      this file today (no textures/loaders), but check
 *      @react-three/fiber's native setup guide if the app crashes on
 *      first GL frame.
 *
 * What the scene shows: a real World's real contents (world.items —
 * the same data WorldDetailScreen already fetches, nothing invented
 * here), placed at a depth per item_type that encodes the same "how
 * committed is this, in time" idea as the object model itself: a real
 * Place anchors the scene at z=0; an Experience sits just off it
 * (still real, but softer than a scheduled Event); an Event sits
 * further out (scheduled, not yet checkpointed); a Plan sits furthest
 * out and renders as a dim wireframe, not a solid — it has no fixed
 * place or time yet, same honesty the Plan object itself carries.
 * Drag horizontally to orbit the whole cluster — one real gesture via
 * RN's own PanResponder (no gesture library dependency), driving the
 * camera group's rotation each frame via useFrame, not a CSS trick.
 */
import {useMemo, useRef} from 'react';
import type {MutableRefObject} from 'react';
import {View, PanResponder, StyleSheet, Text, GestureResponderEvent, PanResponderGestureState} from 'react-native';
import {Canvas, useFrame} from '@react-three/fiber';
import type {RootState} from '@react-three/fiber';
import type {Group, Mesh} from 'three';
import type {BerxWorld, BerxWorldItem, BerxWorldItemType} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';

const GOLD = '#D9A93F';
const GOLD_SOFT = '#F2CE74';
const GOLD_DIM = '#8A6B2C';

/** Depth per item_type — same "how real, how committed" idea the
 * object model itself encodes (see classes/OssnPlans.php,
 * classes/OssnWorlds.php): a Place is the anchor; further out is
 * looser / less yet-confirmed. */
const DEPTH_BY_TYPE: Record<BerxWorldItemType, number> = {
	place: 0,
	experience: 0.6,
	event: 1.35,
	plan: 2.1,
};

const TYPE_LABEL: Record<BerxWorldItemType, string> = {
	place: 'Место',
	event: 'Событие',
	plan: 'План',
	experience: 'Впечатление',
};

function ItemNode({item, index, total}: {item: BerxWorldItem; index: number; total: number}) {
	const ref = useRef<Mesh>(null);
	const z = DEPTH_BY_TYPE[item.item_type];
	const angle = (index / Math.max(total, 1)) * Math.PI * 2;
	const orbit = 1.5 + z * 0.35;
	const x = Math.cos(angle) * orbit;
	const y = Math.sin(angle) * orbit * 0.32;
	const isPlan = item.item_type === 'plan';

	useFrame((state: RootState) => {
		if (!ref.current) return;
		ref.current.rotation.y = state.clock.elapsedTime * 0.5 + index;
		ref.current.rotation.x = state.clock.elapsedTime * 0.3;
		if (isPlan) {
			// A Plan has no fixed place or time — the one node allowed to drift.
			ref.current.position.y = y + Math.sin(state.clock.elapsedTime * 1.4 + index) * 0.07;
		}
	});

	return (
		<mesh ref={ref} position={[x, y, z]}>
			<octahedronGeometry args={[0.22, 0]} />
			<meshStandardMaterial
				color={isPlan ? GOLD_DIM : GOLD}
				emissive={GOLD}
				emissiveIntensity={isPlan ? 0.12 : 0.42}
				wireframe={isPlan}
				transparent
				opacity={isPlan ? 0.6 : 0.94}
			/>
		</mesh>
	);
}

function WorldShell() {
	return (
		<>
			<mesh rotation={[Math.PI / 2.4, 0, 0]}>
				<torusGeometry args={[2.3, 0.006, 8, 64]} />
				<meshBasicMaterial color={GOLD} transparent opacity={0.22} />
			</mesh>
			<mesh rotation={[0, Math.PI / 2.4, 0]}>
				<torusGeometry args={[2.05, 0.006, 8, 64]} />
				<meshBasicMaterial color={GOLD} transparent opacity={0.17} />
			</mesh>
		</>
	);
}

function Scene({items, rotationRef}: {items: BerxWorldItem[]; rotationRef: MutableRefObject<number>}) {
	const groupRef = useRef<Group>(null);
	useFrame(() => {
		if (groupRef.current) groupRef.current.rotation.y = rotationRef.current;
	});
	return (
		<>
			<ambientLight intensity={0.35} color="#c9b98a" />
			<pointLight position={[2, 3, 4]} intensity={1.15} color={GOLD_SOFT} />
			<pointLight position={[-3, -2, -2]} intensity={0.3} color="#3a2f18" />
			<gridHelper args={[10, 20, GOLD, '#241d11']} position={[0, -1.2, 0]} />
			<group ref={groupRef}>
				{items.length > 0 ? <WorldShell /> : null}
				{items.length > 0 ? (
					items.slice(0, 12).map((item, i) => (
						<ItemNode key={`${item.item_type}-${item.item_id}`} item={item} index={i} total={Math.min(items.length, 12)} />
					))
				) : (
					<mesh>
						<octahedronGeometry args={[0.24, 0]} />
						<meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.4} />
					</mesh>
				)}
			</group>
		</>
	);
}

interface Props {
	world: BerxWorld;
}

export default function BerxDepthScene({world}: Props) {
	const rotationRef = useRef(0);
	const lastDx = useRef(0);

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onPanResponderGrant: () => {
					lastDx.current = 0;
				},
				onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
					rotationRef.current += (gesture.dx - lastDx.current) * 0.008;
					lastDx.current = gesture.dx;
				},
			}),
		[]
	);

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox} {...panResponder.panHandlers}>
				<Canvas camera={{position: [0, 0.6, 4.6], fov: 42}}>
					<Scene items={world.items} rotationRef={rotationRef} />
				</Canvas>
			</View>
			<Text style={styles.hint}>Проведите пальцем — сцена повернётся вокруг мира</Text>
			{world.items.length > 0 ? (
				<View style={styles.legend}>
					{world.items.map((item) => (
						<View key={`${item.item_type}-${item.item_id}`} style={styles.legendRow}>
							<View style={[styles.legendDot, item.item_type === 'plan' && styles.legendDotPlan]} />
							<Text style={styles.legendType}>{TYPE_LABEL[item.item_type]}</Text>
							<Text style={styles.legendTitle} numberOfLines={1}>{item.title ?? `#${item.item_id}`}</Text>
						</View>
					))}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {height: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.black, borderWidth: 1, borderColor: colors.borderSoft},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
	legend: {gap: spacing.xs},
	legendRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	legendDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
	legendDotPlan: {backgroundColor: colors.textFaint, borderWidth: 1, borderColor: colors.accent},
	legendType: {color: colors.textFaint, fontSize: typography.sizeXs, width: 90},
	legendTitle: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
});
