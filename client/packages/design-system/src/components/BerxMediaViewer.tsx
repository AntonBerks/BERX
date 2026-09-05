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
 */
import React, {useState} from 'react';
import {View, Image, Text, FlatList, Modal, Pressable, Dimensions, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../tokens';
import { BerxIcon } from '../icons';
import type {BerxMediaAsset} from '@berx/api/types';

export interface BerxMediaViewerProps {
	assets: BerxMediaAsset[];
	initialIndex?: number;
	visible: boolean;
	onClose: () => void;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export function BerxMediaViewer({assets, initialIndex = 0, visible, onClose}: BerxMediaViewerProps) {
	const [index, setIndex] = useState(initialIndex);

	if (!visible || assets.length === 0) return null;

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.backdrop}>
				<Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
					<BerxIcon name="close" size={18} color={colors.white} decorative />
				</Pressable>

				<FlatList
					horizontal
					pagingEnabled
					initialScrollIndex={initialIndex}
					data={assets}
					keyExtractor={(a: BerxMediaAsset) => String(a.guid)}
					onMomentumScrollEnd={(e: {nativeEvent: {contentOffset: {x: number}}}) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
					getItemLayout={(_: unknown, i: number) => ({length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i})}
					renderItem={({item}: {item: BerxMediaAsset}) => (
						<View style={styles.page}>
							{item.media_type === 'image' && item.url ? (
								<Image source={{uri: item.url}} style={styles.image} resizeMode="contain" />
							) : (
								<View style={styles.typeFallback}>
									<BerxIcon name={item.media_type === 'video' ? 'play' : 'music'} size={20} decorative />
									<Text style={styles.typeFallbackText}>{item.media_type === 'video' ? 'Видео' : 'Аудио'}</Text>
									<Text style={styles.typeFallbackHint}>Воспроизведение в приложении пока не поддерживается</Text>
								</View>
							)}
						</View>
					)}
				/>

				{assets.length > 1 ? (
					<View style={styles.dots}>
						{assets.map((a, i) => (
							<View key={a.guid} style={[styles.dot, i === index && styles.dotActive]} />
						))}
					</View>
				) : null}
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {flex: 1, backgroundColor: 'rgba(5,5,5,0.96)'},
	closeBtn: {position: 'absolute', top: 48, right: spacing.lg, zIndex: 1, width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.glass2, alignItems: 'center', justifyContent: 'center'},
	closeText: {color: colors.white, fontSize: typography.sizeBase},
	page: {width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center'},
	image: {width: SCREEN_WIDTH, height: '100%'},
	typeFallback: {alignItems: 'center', gap: spacing.sm, padding: spacing.xl},
	typeFallbackText: {color: colors.white, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	typeFallbackHint: {color: colors.textFaint, fontSize: typography.sizeSm, textAlign: 'center'},
	dots: {flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: spacing.lg},
	dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.glass2},
	dotActive: {backgroundColor: colors.accent},
});
