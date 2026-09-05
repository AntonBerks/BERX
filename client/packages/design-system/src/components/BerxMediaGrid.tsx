/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Real, generic media grid — works with any real BerxMediaAsset[] or
 * plain {url, media_type}[] list (Albums, Creator content, a future
 * Post's attached media, etc.). Renders real images via core RN
 * <Image>; video/audio tiles show a real type badge rather than a
 * fake inline player thumbnail — no video preview generation exists
 * in this environment (see BerxMediaViewer's own header for why).
 *
 * A contact sheet is still made of objects. The old grid packed
 * squares one pixel apart onto a flat graphite fill, which is a
 * texture, not a set of things you can pick one of: nothing had an
 * edge, nothing was anywhere, and the fill sat darker than the room
 * behind it so the sheet read as holes cut in the wall.
 *
 * Each tile is now a plate standing on the content plane: it measures
 * its own place in the room, takes as much of the scene's key light
 * as reaches that corner, and flattens against the room colour there
 * rather than against the substrate. The light falls across the sheet
 * the way it falls across the room, so the top-left of a nine-tile
 * album is not identical to its bottom-right — which is the whole
 * difference between a wall of objects and a repeated rectangle.
 */
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { spacing } from '../tokens';
import { BerxIcon } from '../icons';
import {BerxText} from '../spatial/BerxText';
import {BerxSurface} from '../spatial/BerxSurface';
import {useBerxScene} from '../spatial/BerxSpatialScene';
import {useBerxRoomLight} from '../spatial/useBerxRoomLight';

export interface BerxMediaGridItem {
	guid: number;
	url: string | null;
	media_type: 'image' | 'video' | 'audio';
}

export interface BerxMediaGridProps {
	items: BerxMediaGridItem[];
	columns?: number;
	onPress?: (item: BerxMediaGridItem, index: number) => void;
	onLongPress?: (item: BerxMediaGridItem, index: number) => void;
}

const TYPE_LABEL: Record<BerxMediaGridItem['media_type'], string> = {
	image: 'Изображение',
	video: 'Видео',
	audio: 'Аудио',
};

function Tile({
	item,
	index,
	total,
	columns,
	onPress,
	onLongPress,
}: {
	item: BerxMediaGridItem;
	index: number;
	total: number;
	columns: number;
	onPress?: (item: BerxMediaGridItem, index: number) => void;
	onLongPress?: (item: BerxMediaGridItem, index: number) => void;
}) {
	const {scene} = useBerxScene();
	const room = useBerxRoomLight();
	const content = scene.layers.D3;

	return (
		<Pressable
			ref={room.measure}
			onLayout={room.onLayout}
			style={[styles.tile, {width: `${100 / columns}%`}]}
			accessibilityRole={onPress ? 'imagebutton' : undefined}
			accessibilityLabel={`${TYPE_LABEL[item.media_type]} ${index + 1} из ${total}`}
			onPress={onPress ? () => onPress(item, index) : undefined}
			onLongPress={onLongPress ? () => onLongPress(item, index) : undefined}>
			<BerxSurface
				surface={content.surface}
				lighting={content.lighting}
				radius={14}
				illumination={room.illumination}
				behind={room.behind}
				style={styles.plate}>
				{item.media_type === 'image' && item.url ? (
					<Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
				) : (
					/* the asset BERX cannot draw a frame of says which kind it
					   is, on the plate's own lit surface — not on a flat square
					   of a colour that belongs to no plane */
					<View style={styles.fallback}>
						<BerxIcon name={item.media_type === 'video' ? 'play' : 'music'} size={18} decorative />
						<BerxText role="meta" emphasis="tertiary">{TYPE_LABEL[item.media_type]}</BerxText>
					</View>
				)}
			</BerxSurface>
		</Pressable>
	);
}

export function BerxMediaGrid({ items, columns = 3, onPress, onLongPress }: BerxMediaGridProps) {
	return (
		<View style={styles.grid} accessibilityRole="list">
			{items.map((item, index) => (
				<Tile
					key={item.guid}
					item={item}
					index={index}
					total={items.length}
					columns={columns}
					onPress={onPress}
					onLongPress={onLongPress}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: { flexDirection: 'row', flexWrap: 'wrap' },
	/* a real gutter: one pixel of separation is a seam, and objects
	   standing in a room have space around them */
	tile: { aspectRatio: 1, padding: spacing.xs / 2 },
	plate: { flex: 1, overflow: 'hidden' },
	image: { width: '100%', height: '100%' },
	fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
