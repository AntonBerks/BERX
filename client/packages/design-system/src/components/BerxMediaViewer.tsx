/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Real, generic full-screen viewer for one or more BerxMediaAsset —
 * works with anything the generic Media Foundation returns (Post
 * attachments, Creator content, a future Story). Images render via
 * core RN <Image>, real pinch/zoom is NOT implemented (no gesture
 * library is installable in this sandbox — npm blocked, same
 * constraint as every other native-module gap this session). Video/
 * audio show a real type badge and open the real underlying URL as a
 * fallback action rather than faking an inline player — no video/
 * audio playback library exists here either. Swiping between
 * multiple assets uses a plain horizontal FlatList with paging, which
 * needs no external library.
 *
 * Spatially this is the clearest D5 moment BERX has: one object, and
 * a whole room told to get out of its way. So it is built as one,
 * not as a black sheet.
 *
 * The backdrop is the scene's own substrate, because the viewer opens
 * out of a room and has to stay in it — a near-black overlay turns
 * the room into a hole and makes the photograph a rectangle floating
 * in nothing. Over that substrate the scene's real focus falloff is
 * painted, resolved from the *measured* box of the asset on screen:
 * transparent across the photograph and its margin, falling to the
 * room's own colour at the edges. The asset stands on the focus
 * plane's own material, so it catches the scene's key light along its
 * face and its lit edge and carries that material's emission — the
 * photograph is an object standing in the room, and the room is what
 * has receded.
 *
 * Everything that is not the asset is on the control plane in front
 * of it, which is why the close control and the position indicator do
 * not fall away with the surround.
 */
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
	Animated,
	View,
	Image,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	useWindowDimensions,
	type LayoutChangeEvent,
} from 'react-native';
import {resolveFocus, type BerxFocusField, type BerxFocusRect} from '@berx/spatial';
import {colors, spacing, radius} from '../tokens';
import {BerxIcon} from '../icons';
import type {BerxMediaAsset} from '@berx/api/types';
import {BerxText} from '../spatial/BerxText';
import {BerxSurface} from '../spatial/BerxSurface';
import {BerxFocusClearing} from '../spatial/BerxFocusClearing';
import {useBerxScene} from '../spatial/BerxSpatialScene';

export interface BerxMediaViewerProps {
	assets: BerxMediaAsset[];
	initialIndex?: number;
	visible: boolean;
	onClose: () => void;
}

/**
 * How much of the window the asset stands in.
 *
 * Not the whole of it: an object that reaches every edge has nothing
 * to stand in, and the falloff around it — the thing that says the
 * room stepped back — would have nowhere to be drawn. The margin is
 * where the room is.
 */
const STAGE_WIDTH = 0.88;
const STAGE_HEIGHT = 0.68;

export function BerxMediaViewer({assets, initialIndex = 0, visible, onClose}: BerxMediaViewerProps) {
	const [index, setIndex] = useState(initialIndex);
	const [stage, setStage] = useState<BerxFocusRect | null>(null);
	const {scene} = useBerxScene();
	const {width, height} = useWindowDimensions();

	/* The asset arrives; it is not already there. A cut to a
	   full-screen photograph reads as a different screen, and this is
	   the same object seen closer. Reduced motion keeps the arrival
	   and drops the movement. */
	const enter = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		if (!visible) {
			enter.setValue(0);
			return;
		}
		Animated.timing(enter, {
			toValue: 1,
			duration: scene.reducedMotion ? 120 : scene.motion.enter.durationMs,
			useNativeDriver: true,
		}).start();
	}, [visible, enter, scene.reducedMotion, scene.motion.enter.durationMs]);

	const measureStage = useCallback((event: LayoutChangeEvent) => {
		const {x, y, width: w, height: h} = event.nativeEvent.layout;
		setStage((prev) =>
			prev && Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5 && Math.abs(prev.width - w) < 0.5 && Math.abs(prev.height - h) < 0.5
				? prev
				: {x, y, width: w, height: h},
		);
	}, []);

	/* The falloff is shaped by the real box the asset occupies, so a
	   tall portrait photograph and a wide one open the room by
	   different amounts — which is what actually happens when you put
	   two differently-shaped objects in the same room. */
	const field = useMemo<BerxFocusField | null>(() => {
		if (!stage) return null;
		return resolveFocus({
			rect: stage,
			viewportWidth: width,
			viewportHeight: height,
			background: scene.background,
			tier: scene.budget.tier,
			blurred: scene.layers.D5.blurred,
		});
	}, [stage, width, height, scene.background, scene.budget.tier, scene.layers.D5.blurred]);

	if (!visible || assets.length === 0) return null;

	const stageWidth = Math.round(width * STAGE_WIDTH);
	const stageHeight = Math.round(height * STAGE_HEIGHT);

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			{/* the room the asset is standing in — the scene's own
			    substrate, never a black sheet */}
			<View style={[styles.room, {backgroundColor: scene.background}]}>
				<FlatList
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					initialScrollIndex={initialIndex}
					data={assets}
					keyExtractor={(a: BerxMediaAsset) => String(a.guid)}
					onMomentumScrollEnd={(e: {nativeEvent: {contentOffset: {x: number}}}) =>
						setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
					}
					getItemLayout={(_: unknown, i: number) => ({length: width, offset: width * i, index: i})}
					renderItem={({item, index: i}: {item: BerxMediaAsset; index: number}) => (
						<View style={[styles.page, {width, height}]}>
							<Animated.View
								/* only the asset in view reports its box: two
								   clearings fighting over one room is one room too
								   many */
								onLayout={i === index ? measureStage : undefined}
								style={[
									{width: stageWidth, height: stageHeight},
									{
										opacity: enter,
										transform: scene.reducedMotion
											? []
											: [{scale: enter.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]})}],
									},
								]}>
								{/* D5's own material: the asset catches the scene's
								    key light and carries the emission the focus
								    plane declares, rather than being pasted onto
								    black */}
								<BerxSurface
									surface={scene.layers.D5.surface}
									lighting={scene.layers.D5.lighting}
									radius={22}
									emissive
									style={styles.stage}>
									{item.media_type === 'image' && item.url ? (
										<Image
											source={{uri: item.url}}
											style={styles.image}
											/* contain, not cover: the room fills the rest
											   of the frame, so nothing is cropped to fit a
											   rectangle */
											resizeMode="contain"
											accessibilityRole="image"
											accessibilityLabel={`Изображение ${i + 1} из ${assets.length}`}
										/>
									) : (
										<View style={styles.typeFallback}>
											<BerxIcon name={item.media_type === 'video' ? 'play' : 'music'} size={20} decorative />
											<BerxText role="heading">{item.media_type === 'video' ? 'Видео' : 'Аудио'}</BerxText>
											<BerxText role="meta" emphasis="tertiary" style={styles.typeFallbackHint}>
												Воспроизведение в приложении пока не поддерживается
											</BerxText>
										</View>
									)}
								</BerxSurface>
							</Animated.View>
						</View>
					)}
				/>

				{/* the falloff, over the surround and clear across the asset */}
				{field ? <BerxFocusClearing field={field} id="berx-media-viewer" testID="berx-media-viewer-clearing" /> : null}

				{/* D4 — in front of the focus, so it does not recede with the
				    room. A viewer whose only way out had dimmed away with
				    everything else would be a trap. */}
				<View style={styles.chrome} pointerEvents="box-none">
					<Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Закрыть">
						<BerxSurface surface={scene.layers.D4.surface} lighting={scene.layers.D4.lighting} radius={radius.pill} style={styles.closeInner}>
							<BerxIcon name="close" size={18} color={colors.white} decorative />
						</BerxSurface>
					</Pressable>

					{assets.length > 1 ? (
						<View style={styles.dots} accessible accessibilityLabel={`${index + 1} из ${assets.length}`}>
							{assets.map((a, i) => (
								<View
									key={a.guid}
									style={[
										styles.dot,
										{backgroundColor: scene.layers.D2.surface.borderColor},
										i === index && {backgroundColor: scene.accent, width: 18},
									]}
								/>
							))}
						</View>
					) : null}
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	room: {flex: 1},
	page: {alignItems: 'center', justifyContent: 'center'},
	stage: {flex: 1, overflow: 'hidden'},
	image: {width: '100%', height: '100%'},
	chrome: {...StyleSheet.absoluteFillObject, zIndex: 4, justifyContent: 'space-between'},
	closeBtn: {alignSelf: 'flex-end', marginTop: 48, marginRight: spacing.lg},
	closeInner: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
	typeFallback: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl},
	typeFallbackHint: {textAlign: 'center'},
	dots: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingBottom: spacing.xxl},
	/* the position indicator reads as a length, not as a lit dot:
	   the current asset's mark is longer, which survives a colour
	   the viewer cannot distinguish */
	dot: {width: 6, height: 6, borderRadius: 3},
});
