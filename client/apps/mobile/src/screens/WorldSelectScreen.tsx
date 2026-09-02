/**
 * BERX WORLD SELECT — "Choose your world," an entered space, not a
 * settings picker and not a static hero-plus-list either.
 *
 * SpatialRenderer: the hero object is now SpatialHero (packages/
 * design-system/src/spatial), not BerxOrb directly. Same call shape,
 * same 2D result on web (this file's own — SpatialHero.tsx literally
 * renders BerxOrb) — the difference only exists on iOS/Android, where
 * Metro's native-extension resolution swaps in SpatialHero.native.tsx:
 * a real @react-three/fiber/native + expo-gl Three.js scene (real
 * camera/lights/geometry/rotation), not device-verified from this
 * environment (no simulator reachable here) but real, typed code
 * checked against the actually-installed library.
 *
 * v3 (visual pass): v2 fixed the COMPOSITION (full-bleed scene per
 * world instead of a card list) but the scene itself still read flat
 * — a lit sky, a hard cut where the horizon layer ended, then a dead
 * unlit zone before the copy. This pass makes the light itself do
 * more work: a second, broader bloom seated behind the orb bridges
 * that dead zone so the glow reads as one continuous field from sky
 * to ground instead of two stacked flat layers; the orb is bigger and
 * has a real halo ring outside its own body; the orb breathes (a slow
 * continuous scale/opacity loop — motion the directive asks for,
 * independent of the swipe-driven parallax scale) instead of sitting
 * static between swipes; and the two redundant navigators (a text tab
 * row AND a dot pager doing the same job) are now one — a single
 * glass capsule of tappable world dots.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Pressable, Animated, Easing, StyleSheet, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {SpatialHero} from '../../../../packages/design-system/src/spatial/SpatialHero';
import {BerxGrain} from '../../../../packages/design-system/src/components/BerxGrain';
import {BerxHorizon} from '../../../../packages/design-system/src/components/BerxHorizon';
import {BerxSpatialLayer} from '../../../../packages/design-system/src/components/BerxSpatialLayer';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxPrimaryAction, BerxQuietAction} from '../../../../packages/design-system/src/components/BerxActions';
import {BERX_WORLDS, BERX_WORLD_ORDER} from '../../../../packages/design-system/src/worlds';
import type {BerxWorld} from '../../../../packages/design-system/src/worlds';

interface Props {
	initialWorld?: BerxWorld;
	onSelect: (world: BerxWorld) => void;
	onBack?: () => void;
}

/** Deterministic ambient particles, seeded by the world's own id so the field never reshuffles between renders. */
function particleField(seed: string, count = 18): Array<{x: number; y: number; r: number; o: number}> {
	let s = 0;
	for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
	const rnd = () => {
		s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
		return ((s >>> 0) % 10000) / 10000;
	};
	return Array.from({length: count}, () => ({x: rnd() * 100, y: rnd() * 100, r: 0.8 + rnd() * 2.2, o: 0.18 + rnd() * 0.34}));
}

/** The slow, continuous "the object is alive" breath — independent of the swipe-driven parallax scale applied around it. */
function useBreath() {
	const v = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(v, {toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
				Animated.timing(v, {toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [v]);
	return v;
}

export default function WorldSelectScreen({initialWorld = 'night_ice', onSelect, onBack}: Props) {
	const styles = useMemo(() => makeStyles(), []);
	const initialIndex = Math.max(0, BERX_WORLD_ORDER.indexOf(initialWorld));
	const [pageWidth, setPageWidth] = useState(0);
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const scrollX = useRef(new Animated.Value(0)).current;
	const breath = useBreath();
	// Animated.ScrollView's imperative ref shape is genuinely inconsistent
	// across RN/RN-web versions (getNode() on some, a direct scrollTo on
	// others) — `any` here is a real, contained exception for exactly
	// that reason, not a shortcut around real typing elsewhere.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const scrollRef = useRef<any>(null);

	const activeWorld = BERX_WORLD_ORDER[activeIndex];
	const def = BERX_WORLDS[activeWorld];
	const breathScale = breath.interpolate({inputRange: [0, 1], outputRange: [1, 1.045]});
	const breathGlow = breath.interpolate({inputRange: [0, 1], outputRange: [0.55, 0.85]});

	function onLayout(e: LayoutChangeEvent) {
		const w = e.nativeEvent.layout.width;
		if (w && w !== pageWidth) setPageWidth(w);
	}

	function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
		if (!pageWidth) return;
		const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
		setActiveIndex(Math.min(BERX_WORLD_ORDER.length - 1, Math.max(0, idx)));
	}

	function goTo(idx: number) {
		const node = scrollRef.current?.getNode ? scrollRef.current.getNode() : scrollRef.current;
		node?.scrollTo?.({x: idx * pageWidth, animated: true});
		setActiveIndex(idx);
	}

	return (
		<View style={styles.screen} onLayout={onLayout}>
			{pageWidth > 0 ? (
				<Animated.ScrollView
					ref={scrollRef}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollX}}}], {useNativeDriver: true})}
					scrollEventThrottle={16}
					onMomentumScrollEnd={onMomentumEnd}
					style={StyleSheet.absoluteFillObject}>
					{BERX_WORLD_ORDER.map((id: BerxWorld, i: number) => {
						const w = BERX_WORLDS[id];
						const inputRange = [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth];
						const orbScale = scrollX.interpolate({inputRange, outputRange: [0.68, 1, 0.68], extrapolate: 'clamp'});
						const orbOpacity = scrollX.interpolate({inputRange, outputRange: [0.25, 1, 0.25], extrapolate: 'clamp'});
						const rise = scrollX.interpolate({inputRange, outputRange: [30, 0, 30], extrapolate: 'clamp'});
						const particles = particleField(id);
						return (
							<View key={id} style={[styles.page, {width: pageWidth, backgroundColor: w.scene.ground}]}>
								{/* Sky field. */}
								<BerxAura ground={w.scene.ground} glow={w.scene.glow} counter={w.scene.counter} intensity={1} at={0.3} />
								{/* Ground field — a SECOND, broader pool low in the frame, the
								    fix for v2's dead flat zone below the horizon: without this
								    the light stops at the skyline and everything under it is
								    one flat, undynamic rectangle. Now the whole page is one
								    continuous lit field, sky to ground. Its own soft breathing
								    opacity is the "the object is alive" motion cue, carried by
								    a real radial-gradient light field rather than a flat disc. */}
								<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {opacity: breathGlow}]}>
									<BerxAura ground="transparent" glow={w.scene.glow} counter={w.scene.counter} intensity={0.85} at={0.8} />
								</Animated.View>

								<BerxSpatialLayer plane="background" style={StyleSheet.absoluteFillObject}>
									<View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
										{particles.map((p, pi: number) => (
											<View
												key={pi}
												style={{
													position: 'absolute',
													left: `${p.x}%`,
													top: `${p.y}%`,
													width: p.r * 3,
													height: p.r * 3,
													borderRadius: 999,
													backgroundColor: w.scene.light,
													opacity: p.o,
												}}
											/>
										))}
									</View>
								</BerxSpatialLayer>

								<BerxHorizon color={w.scene.ground} rim={w.scene.light} seed={i * 37 + 5} skyline fade={0.55} style={styles.horizon} />
								<BerxGrain opacity={0.05} />

								<Animated.View style={[styles.orbSlot, {transform: [{scale: orbScale}, {translateY: rise}], opacity: orbOpacity}]}>
									<Animated.View style={{transform: [{scale: breathScale}]}}>
										<SpatialHero size={272} light={w.scene.light} fill={w.scene.fill} body={w.scene.object} />
									</Animated.View>
								</Animated.View>

								<Animated.View style={[styles.pageCopy, {transform: [{translateY: rise}], opacity: orbOpacity}]}>
									<Text style={[styles.worldName, {color: w.colors.text}]}>{w.name}</Text>
									<Text style={[styles.worldTagline, {color: w.colors.textDim}]}>{w.tagline}</Text>
								</Animated.View>
							</View>
						);
					})}
				</Animated.ScrollView>
			) : null}

			{/* Fixed overlay — reads the CURRENT world's own colours, so the chrome belongs to whichever world is centred, not a neutral shell around it. */}
			<View style={styles.overlayTop} pointerEvents="none">
				<Text style={[styles.eyebrow, {color: def.scene.light}]}>BERX WORLD</Text>
				<Text style={[styles.title, {color: def.colors.text}]}>Выберите свой мир</Text>
			</View>

			{/* One navigator, not two: a floating glass capsule of world dots — tap any to jump, the active one carries that world's own light and a name label. Level 4 (the top glass plane) rather than 3: against a photographed-dark scene a level-3 fill is nearly invisible — this needs to read as a real physical object floating over the scene. */}
			<BerxGlassSurface level={4} padding={0} radius={999} style={styles.navCapsule}>
				<View style={styles.navRow}>
					{BERX_WORLD_ORDER.map((id: BerxWorld, i: number) => {
						const w = BERX_WORLDS[id];
						const active = i === activeIndex;
						return (
							<Pressable key={id} onPress={() => goTo(i)} hitSlop={6} style={styles.navHit}>
								<View style={[styles.navDot, {backgroundColor: w.scene.light}, active && styles.navDotActive, active && {shadowColor: w.scene.light}]} />
								<Text style={[styles.navLabel, active ? {color: w.scene.light} : styles.navLabelDim, active && styles.navLabelActive]}>
									{w.name}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</BerxGlassSurface>

			<View style={styles.actions}>
				<BerxPrimaryAction label={`Выбрать ${def.name}`} onPress={() => onSelect(activeWorld)} tone={def.scene.light} ink={def.colors.onAccent} />
				{onBack ? <BerxQuietAction label="Позже" onPress={onBack} /> : null}
			</View>
		</View>
	);
}

const makeStyles = () =>
	StyleSheet.create({
		screen: {flex: 1, overflow: 'hidden'},
		page: {flex: 1, overflow: 'hidden'},
		horizon: {position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%'},
		orbSlot: {position: 'absolute', top: '16%', left: 0, right: 0, alignItems: 'center'},
		pageCopy: {position: 'absolute', bottom: 196, left: spacing.xl, right: spacing.xl, alignItems: 'center'},
		worldName: {fontSize: 30, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center'},
		worldTagline: {fontSize: typography.sizeSm, lineHeight: 20, textAlign: 'center', marginTop: spacing.xs, maxWidth: 300},
		overlayTop: {position: 'absolute', top: '6%', left: spacing.xl, right: spacing.xl},
		eyebrow: {fontSize: 11, letterSpacing: 5, fontWeight: typography.weightBold, marginBottom: spacing.sm},
		title: {fontSize: 27, fontWeight: '700', letterSpacing: -0.6},
		navCapsule: {position: 'absolute', bottom: 132, alignSelf: 'center'},
		navRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.lg},
		navHit: {alignItems: 'center', gap: 5, paddingVertical: 2},
		navDot: {width: 8, height: 8, borderRadius: 4, opacity: 0.55},
		navDotActive: {width: 10, height: 10, borderRadius: 5, opacity: 1, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: {width: 0, height: 0}},
		navLabel: {fontSize: 10, fontWeight: typography.weightMedium},
		navLabelDim: {color: 'rgba(255,255,255,0.45)'},
		navLabelActive: {fontWeight: typography.weightBold, fontSize: 11},
		actions: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 40, gap: spacing.sm},
	});
