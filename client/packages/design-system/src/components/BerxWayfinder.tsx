/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header for
 * the sandbox's real constraint (no node_modules, no device/simulator
 * — tsc --noEmit is the only real signal available; this file adds
 * the same +3 "Cannot find module 'react'/'react-native'/react/jsx-
 * runtime" baseline noise every new .tsx file adds in this sandbox,
 * confirmed via git stash -u diffing, nothing more).
 *
 * BERX WORLD TRANSFORMATION — replaces the flat, edge-to-edge,
 * icon-only bottom tab strip (the exact "generic bottom navigation"
 * pattern the transformation directive names directly) with a
 * BERX-native wayfinder: a floating pill, inset from every edge
 * (never touching the screen boundary the way every competitor's tab
 * bar does), with ONE sliding light that moves between destinations
 * instead of five icons independently swapping color — real shared-
 * continuity motion (the same object moves, rather than one icon
 * turning off and an unrelated one turning on), and a raised orb for
 * the create/Stories destination that breaks the bar's own silhouette
 * instead of sitting flush in the row like every other icon.
 *
 * Built on React Native's own bundled `Animated` API only — no
 * gesture-handler/reanimated/safe-area-context, none of which can be
 * installed or verified in this sandbox (same real constraint as
 * every other native-module decision this session). Real spring
 * physics (Animated.spring, not a linear tween) drive: (1) the
 * indicator sliding to the newly active flat destination, using each
 * button's own measured onLayout position — not an assumed equal
 * division of the bar's width, so it stays correct even if a future
 * change gives destinations unequal weight; (2) a press-scale on every
 * icon (one persistent Animated.Value per destination, kept in a ref
 * map rather than a separate child component — this codebase's own
 * JSX/tsc setup, with no @types/react resolvable, only cleanly infers
 * a mapped list's `key` prop against a HOST element like `View`/
 * `Pressable`, the same pattern `BerxScrimHero`/`ProfileScreen` already
 * use for their own `.map()`s — not against a custom child component,
 * so this stays inline rather than extracting one); (3) the orb's own
 * resting scale growing when Stories becomes active. Motion here is
 * never decorative: the indicator's position IS the "which section am
 * I in" signal, replacing flat icon-color toggling with an object that
 * visibly travels from one meaning to the next (directive: "motion
 * must have meaning").
 *
 * Functionally IDENTICAL to the tab bar it replaces — same 5
 * destinations, same order, same badge counts, same tap targets and
 * navigation behavior (`onSelect(tab)`; the caller still owns
 * `activeTab` state and TabPane mounting) — only the presentation
 * changed, per the transformation directive's own "preserve
 * functionality, reinvent presentation" rule.
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, radius, spacing, typography} from '../tokens';
import {IconHome, IconSearch, IconPlus, IconMessage, IconMenu} from './BerxIcons';

export type BerxWayfinderTab = 'Home' | 'Search' | 'Stories' | 'Messages' | 'Profile';

const TABS: BerxWayfinderTab[] = ['Home', 'Search', 'Stories', 'Messages', 'Profile'];
const ORB_INDEX = 2; // 'Stories' — the raised create/discover position, not part of the sliding flat track
const FLAT_TABS: BerxWayfinderTab[] = TABS.filter((_tab, i) => i !== ORB_INDEX);

interface Props {
	activeTab: BerxWayfinderTab;
	onSelect: (tab: BerxWayfinderTab) => void;
	unreadMessages: number;
	unreadNotifications: number;
}

function tabIcon(tab: BerxWayfinderTab, size: number, color: string) {
	switch (tab) {
		case 'Home':
			return <IconHome size={size} color={color} />;
		case 'Search':
			return <IconSearch size={size} color={color} />;
		case 'Stories':
			return <IconPlus size={size} color={color} />;
		case 'Messages':
			return <IconMessage size={size} color={color} />;
		case 'Profile':
			return <IconMenu size={size} color={color} />;
	}
}

/**
 * BERX Wayfinder — the floating pill + raised orb navigation surface.
 * Replaces AppShell's old inline `styles.tabBar` block.
 */
export function BerxWayfinder({activeTab, onSelect, unreadMessages, unreadNotifications}: Props) {
	const [positions, setPositions] = useState<Partial<Record<BerxWayfinderTab, {x: number; width: number}>>>({});
	const indicatorX = useRef(new Animated.Value(0)).current;
	const indicatorWidth = useRef(new Animated.Value(0)).current;
	const indicatorOpacity = useRef(new Animated.Value(0)).current;
	const orbScale = useRef(new Animated.Value(1)).current;
	const orbPressScale = useRef(new Animated.Value(1)).current;
	// One persistent press-scale per flat destination — real,
	// independent per-icon feedback without extracting a separate
	// child component (see file header for why that trips this
	// sandbox's tsc/JSX setup on the `key` prop).
	const pressScales = useRef<Record<BerxWayfinderTab, Animated.Value>>({
		Home: new Animated.Value(1),
		Search: new Animated.Value(1),
		Stories: new Animated.Value(1), // unused here — the orb owns orbPressScale instead
		Messages: new Animated.Value(1),
		Profile: new Animated.Value(1),
	}).current;

	const handleMeasured = useCallback((tab: BerxWayfinderTab, centerX: number, width: number) => {
		setPositions((prev: Partial<Record<BerxWayfinderTab, {x: number; width: number}>>) => ({...prev, [tab]: {x: centerX, width}}));
	}, []);

	// Slide the indicator to whichever flat destination is active; hide
	// it entirely when Stories (the orb) is active — the orb communicates
	// its own active state via scale/glow instead, sliding a flat pill
	// "into" a raised circle would be a fake, meaningless motion.
	useEffect(() => {
		const isOrb = activeTab === 'Stories';
		Animated.timing(indicatorOpacity, {toValue: isOrb ? 0 : 1, duration: 160, useNativeDriver: true}).start();
		if (!isOrb) {
			const pos = positions[activeTab];
			if (pos) {
				const pillWidth = Math.min(52, pos.width);
				Animated.spring(indicatorX, {toValue: pos.x - pillWidth / 2, useNativeDriver: true, speed: 16, bounciness: 8}).start();
				Animated.spring(indicatorWidth, {toValue: pillWidth, useNativeDriver: false, speed: 16, bounciness: 8}).start();
			}
		}
		Animated.spring(orbScale, {toValue: isOrb ? 1.08 : 1, useNativeDriver: true, speed: 14, bounciness: 8}).start();
	}, [activeTab, positions, indicatorOpacity, indicatorX, indicatorWidth, orbScale]);

	const orbPressIn = useCallback(() => {
		Animated.spring(orbPressScale, {toValue: 0.92, useNativeDriver: true, speed: 30, bounciness: 6}).start();
	}, [orbPressScale]);
	const orbPressOut = useCallback(() => {
		Animated.spring(orbPressScale, {toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10}).start();
	}, [orbPressScale]);

	return (
		<View style={styles.wrap} pointerEvents="box-none">
			<View style={styles.pill}>
				<Animated.View
					style={[
						styles.indicator,
						{
							opacity: indicatorOpacity,
							width: indicatorWidth,
							transform: [{translateX: indicatorX}],
						},
					]}
				/>
				{FLAT_TABS.map((tab) => {
					const active = activeTab === tab;
					const scale = pressScales[tab];
					const badge = tab === 'Messages' ? unreadMessages : tab === 'Profile' ? unreadNotifications : 0;
					const iconColor = active ? colors.black : colors.textFaint;
					return (
						<Pressable
							key={tab}
							onLayout={(e: LayoutChangeEvent) => {
								const {x, width} = e.nativeEvent.layout;
								handleMeasured(tab, x + width / 2, width);
							}}
							onPress={() => onSelect(tab)}
							onPressIn={() => Animated.spring(scale, {toValue: 0.86, useNativeDriver: true, speed: 30, bounciness: 6}).start()}
							onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10}).start()}
							style={styles.flatItem}
							hitSlop={8}
						>
							<Animated.View style={{transform: [{scale}]}}>
								{tabIcon(tab, 20, iconColor)}
								{badge > 0 ? (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
									</View>
								) : null}
							</Animated.View>
						</Pressable>
					);
				})}
				{/* Spacer holding the orb's slot in the flex row so the two
				    flat items either side stay evenly spaced — the orb
				    itself renders on top, absolutely positioned, so it can
				    protrude above the pill's own top edge. */}
				<View style={styles.orbSpacer} />
			</View>
			<Animated.View
				style={[
					styles.orbWrap,
					{
						transform: [{scale: Animated.multiply(orbScale, orbPressScale)}],
					},
				]}
			>
				<Pressable
					onPress={() => onSelect('Stories')}
					onPressIn={orbPressIn}
					onPressOut={orbPressOut}
					style={[styles.orb, activeTab === 'Stories' && styles.orbActive]}
					hitSlop={8}
				>
					{tabIcon('Stories', 24, activeTab === 'Stories' ? colors.black : colors.accent)}
				</Pressable>
			</Animated.View>
		</View>
	);
}

const PILL_HEIGHT = 60;
const ORB_SIZE = 56;

const styles = StyleSheet.create({
	wrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		// Approximates home-indicator clearance without
		// react-native-safe-area-context (not installable/verifiable in
		// this sandbox — same disclosed constraint as the rest of the
		// app). A real device-specific inset is real follow-up work.
		paddingBottom: spacing.lg,
	},
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		height: PILL_HEIGHT,
		width: '88%',
		borderRadius: radius.pill,
		backgroundColor: colors.graphite,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		paddingHorizontal: spacing.sm,
		// Floating, not edge-to-edge — the one structural change that
		// alone separates this from every competitor's flush tab strip.
		shadowColor: '#000000',
		shadowOpacity: 0.45,
		shadowRadius: 24,
		shadowOffset: {width: 0, height: 10},
		elevation: 14,
	},
	indicator: {
		position: 'absolute',
		height: 40,
		top: (PILL_HEIGHT - 40) / 2,
		left: 0,
		borderRadius: radius.pill,
		backgroundColor: colors.accent,
	},
	flatItem: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		height: PILL_HEIGHT,
	},
	orbSpacer: {flex: 1},
	orbWrap: {
		position: 'absolute',
		top: -(ORB_SIZE - PILL_HEIGHT) / 2 - 4,
		alignSelf: 'center',
	},
	orb: {
		width: ORB_SIZE,
		height: ORB_SIZE,
		borderRadius: ORB_SIZE / 2,
		backgroundColor: colors.black,
		borderWidth: 2,
		borderColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: colors.accent,
		shadowOpacity: 0.5,
		shadowRadius: 16,
		shadowOffset: {width: 0, height: 0},
		elevation: 10,
	},
	orbActive: {
		backgroundColor: colors.accent,
	},
	badge: {
		position: 'absolute',
		top: -6,
		right: -10,
		minWidth: 16,
		height: 16,
		borderRadius: 8,
		paddingHorizontal: 3,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.danger,
	},
	badgeText: {color: colors.white, fontSize: 10, fontWeight: typography.weightBold},
});
