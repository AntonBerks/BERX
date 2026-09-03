/**
 * BERX FEED SCENE — 2D spatial fallback.
 *
 * DIRECTION CORRECTION — THE WORLD, NOT A WIDGET ABOVE THE OLD FEED.
 * The previous shape of this file was a bounded 340px box sitting above
 * an otherwise-unchanged FlatList of post cards — real 3D data-driven
 * material, but structurally still "old feed with a decoration bolted
 * on top", which is the exact thing this build was told to stop doing.
 * This is now the WHOLE feed surface: full-bleed, behind every other
 * screen element, and it is what you actually move through — dragging
 * it changes which post is centred, the same LIVE camera-through-order
 * relationship the native R3F half of this split drives with a real
 * PerspectiveCamera. There is no separate scrolling list underneath it
 * any more; FeedScreen.tsx now reads the currently-focused item off
 * `onFocusChange` and renders ITS real text/actions in a docked panel,
 * the same way the native scene has nothing else to hand off to either.
 *
 * The web/harness half of the True3D/2D split (Metro takes
 * BerxFeedScene.native.tsx on iOS/Android; the esbuild harness has no
 * `.native.` resolution and always lands here — this is genuinely what
 * ships on web and what every screenshot in this repo's harness shows,
 * never the real GL scene).
 *
 * A real fallback, not a placeholder: it carries the same idea the GL
 * scene does — order as depth, resonance as light, media vs words as
 * shape — using the one thing 2D genuinely has, perspective
 * foreshortened by scale/opacity/position, animated by the SAME real
 * `useSpatialDrag` physics engine every native scene uses (momentum,
 * framerate-independent decay — see that hook's own header), advanced
 * here by a `requestAnimationFrame` loop standing in for the R3F
 * useFrame this file has no GL loop to provide. A real photo renders as
 * the ACTUAL photo, clipped to a circle — the same real content the 3D
 * scene wears as a sphere's texture map — and a real text-only post as
 * a small square.
 *
 * Every node is one real BerxFeedItem. Nothing is invented to fill the
 * frame — an empty feed renders an empty axis and says so.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Image, StyleSheet, LayoutChangeEvent} from 'react-native';
import type {BerxFeedItem} from '@berx/api/types';
import {typography} from '@berx/design-system/tokens';
import {useBerxColors} from '@berx/design-system/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {useSpatialDrag} from '../../../../packages/design-system/src/spatial/engine/useSpatialDrag';
// stage.ts is deliberately dependency-free (see its own header) so this
// 2D half can import the exact same fill-light value the 3D scene
// paints its glass with, rather than guessing at a 2D token that
// doesn't exist for it.
import {SPATIAL_FILL_LIGHT, SPATIAL_KEY_LIGHT} from '../../../../packages/design-system/src/spatial/engine/stage';

/** Matches the native scene's own world unit — one post per SPACING_Z of drag/camera travel. */
const SPACING_Z = 0.95;
/** Matches the native scene's own node cap — a feed page is api.feed(20, 0). */
const MAX_NODES = 20;
/** How many posts ahead stay in view before fading toward the vanishing point. */
const VISIBLE_RANGE = 4.2 * SPACING_Z;
/** A post this far PAST the camera has fully passed — it fades out rather than receding again, matching one-directional camera travel. */
const BEHIND_CULL = -0.4 * SPACING_Z;

function resonance(item: BerxFeedItem): number {
	return (item.like_count ?? 0) + (item.comment_count ?? 0);
}

interface Props {
	items: BerxFeedItem[];
	/** Fires with the real index of whichever post is currently nearest the camera — FeedScreen's docked reading panel is driven off this, not off a separate list. */
	onFocusChange?: (index: number) => void;
}

export default function BerxFeedScene({items, onFocusChange}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const shown = items.slice(0, MAX_NODES);
	const maxResonance = shown.reduce((m, it) => Math.max(m, resonance(it)), 0);

	// Real measured viewport — this scene is full-bleed now, so unlike
	// the old bounded 340px box there is no fixed constant to lay out
	// against; the first frame uses a plausible phone-sized guess so
	// nothing is at (0,0) before the real onLayout fires.
	const [size, setSize] = useState({width: 360, height: 640});
	const onLayout = (e: LayoutChangeEvent) => {
		const {width, height} = e.nativeEvent.layout;
		setSize({width, height});
	};

	// The same real physics engine every native BERX scene drags
	// through — momentum, framerate-independent decay. `advance` is
	// normally called from R3F's useFrame; this file has no GL frame
	// loop, so a requestAnimationFrame loop stands in for it, ticking
	// on the one real clock 2D actually has.
	const drag = useSpatialDrag({
		sensitivity: 0.02,
		min: 0,
		max: Math.max(shown.length - 1, 0) * SPACING_Z,
		invert: true,
	});
	const [dollyValue, setDollyValue] = useState(0);
	const lastFocusRef = useRef(-1);

	useEffect(() => {
		let raf = 0;
		let last = 0;
		const tick = (t: number) => {
			if (last === 0) last = t;
			const delta = Math.min((t - last) / 1000, 0.05);
			last = t;
			drag.advance(delta);
			const v = drag.valueRef.current;
			setDollyValue((prev) => (Math.abs(prev - v) > 0.0008 ? v : prev));
			if (shown.length > 0) {
				const focused = Math.max(0, Math.min(shown.length - 1, Math.round(v / SPACING_Z)));
				if (focused !== lastFocusRef.current) {
					lastFocusRef.current = focused;
					onFocusChange?.(focused);
				}
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shown.length]);

	// Every node's real geometry, derived from the LIVE dolly position —
	// this is what makes the world actually move under a drag instead of
	// showing one static arrangement. Painted nearest-last (see the
	// render pass below) so a loud recent post's big bright photo always
	// wins the stack over a quiet old one behind it.
	const nodes = shown
		.map((item, i) => {
			const rel = i * SPACING_Z - dollyValue;
			if (rel < BEHIND_CULL) return null;
			const passing = rel < 0;
			const depthFrac = passing ? 0 : Math.min(1, rel / VISIBLE_RANGE);
			const passFade = passing ? 1 + rel / Math.abs(BEHIND_CULL) : 1;
			const lane = i % 4;
			const side = lane < 2 ? 1 : -1;
			const laneSpread = lane % 2 === 0 ? 1 : 0.58;
			const hasMedia = !!item.media_url;
			const t = maxResonance > 0 ? resonance(item) / maxResonance : 0;
			const sizeBase = (hasMedia ? size.width * 0.13 : size.width * 0.085) * (1 - depthFrac * 0.55);
			const offset = side * (size.width * 0.36) * laneSpread * (1 - depthFrac * 0.3);
			const translateY = -depthFrac * (size.height * 0.4) + size.height * 0.16;
			const opacity = (0.6 + t * 0.4) * (1 - depthFrac * 0.2) * passFade;
			return {item, i, hasMedia, size: sizeBase, offset, translateY, opacity};
		})
		.filter((n): n is NonNullable<typeof n> => n !== null);

	return (
		<View style={styles.wrap} onLayout={onLayout} {...drag.panHandlers}>
			<BerxAura ground={colors.bg} glow={SPATIAL_KEY_LIGHT} intensity={0.5} at={0.38} style={StyleSheet.absoluteFillObject} />
			{/* The order axis — the same single line the 3D scene recedes along. */}
			<View style={[styles.axis, {height: size.height * 0.7, left: size.width / 2}]} />
			{/* Stems first, under every node — the connective read the 3D
			    scene gives each post, so this reads as one stream and not
			    scattered dots. */}
			{nodes.map(({item, offset, translateY}) => (
				<View
					key={`stem-${item.guid}`}
					style={[
						styles.stem,
						{left: size.width / 2, width: Math.abs(offset), opacity: 0.22, transform: [{translateX: offset / 2}, {translateY}]},
					]}
				/>
			))}
			{[...nodes].reverse().map(({item, hasMedia, size: nodeSize, offset, translateY, opacity}) =>
				hasMedia ? (
					<Image
						key={item.guid}
						source={{uri: item.media_url as string}}
						style={[
							styles.nodeMedia,
							{
								left: size.width / 2,
								top: size.height / 2,
								width: nodeSize,
								height: nodeSize,
								borderRadius: nodeSize / 2,
								opacity,
								transform: [{translateX: offset - nodeSize / 2}, {translateY: translateY - nodeSize / 2}],
							},
						]}
					/>
				) : (
					<View
						key={item.guid}
						style={[
							styles.nodeText,
							{
								left: size.width / 2,
								top: size.height / 2,
								width: nodeSize * 0.66,
								height: nodeSize * 0.66,
								opacity,
								transform: [{translateX: offset - (nodeSize * 0.66) / 2}, {translateY: translateY - (nodeSize * 0.66) / 2}],
							},
						]}
					/>
				)
			)}
			{shown.length === 0 ? (
				<View style={styles.emptyWrap}>
					<Text style={styles.empty}>Лента пока пуста</Text>
				</View>
			) : null}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {flex: 1, backgroundColor: colors.bg, overflow: 'hidden'},
	axis: {position: 'absolute', top: '15%', width: 1, backgroundColor: colors.accent, opacity: 0.28},
	stem: {position: 'absolute', top: '50%', height: 1, backgroundColor: colors.accent},
	// A real photo is the actual photo, clipped to a circle with a thin
	// glass-fill ring; a text-only post is a small square in the key
	// light — the same sphere/plane, real-texture/flat material split
	// the 3D scene draws.
	nodeMedia: {position: 'absolute', borderWidth: 1, borderColor: SPATIAL_FILL_LIGHT},
	nodeText: {position: 'absolute', backgroundColor: SPATIAL_KEY_LIGHT, borderRadius: 4},
	emptyWrap: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
	empty: {color: colors.textFaint, fontSize: typography.sizeSm},
});
