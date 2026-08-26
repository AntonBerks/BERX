/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Real, generic media grid — works with any real BerxMediaAsset[] or
 * plain {url, media_type}[] list (Albums, Creator content, a future
 * Post's attached media, etc.). Renders real images via core RN
 * <Image>; video/audio tiles show a real type badge rather than a
 * fake inline player thumbnail — no video preview generation exists
 * in this environment (see BerxMediaViewer's own header for why).
 */
import { View, Image, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../tokens';

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

export function BerxMediaGrid({ items, columns = 3, onPress, onLongPress }: BerxMediaGridProps) {
	return (
		<View style={styles.grid}>
			{items.map((item, index) => (
				<Pressable
					key={item.guid}
					style={[styles.tile, { width: `${100 / columns}%` }]}
					onPress={onPress ? () => onPress(item, index) : undefined}
					onLongPress={onLongPress ? () => onLongPress(item, index) : undefined}>
					<View style={styles.tileInner}>
						{item.media_type === 'image' && item.url ? (
							<Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
						) : (
							<View style={styles.fallback}>
								<Text style={styles.fallbackText}>{item.media_type === 'video' ? '▶ Видео' : '♪ Аудио'}</Text>
							</View>
						)}
					</View>
				</Pressable>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: { flexDirection: 'row', flexWrap: 'wrap' },
	tile: { aspectRatio: 1, padding: 1 },
	tileInner: { flex: 1, backgroundColor: colors.graphite, borderRadius: radius.sm, overflow: 'hidden' },
	image: { width: '100%', height: '100%' },
	fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	fallbackText: { color: colors.textFaint, fontSize: typography.sizeXs },
});
