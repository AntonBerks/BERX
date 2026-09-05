/**
 * BerxHorizontalRail — a horizontally scrolling row of spatial cards.
 *
 * Two things make this more than a ScrollView:
 *
 *  - it virtualizes. The performance contract requires it, and a rail
 *    of place or event cards is exactly where an unbounded row starts
 *    costing frames.
 *  - a horizontal rail is a drag interaction, and the v9 interaction
 *    contract requires an alternative wherever dragging exists — so
 *    it renders real previous/next controls that move the rail by one
 *    page, usable by keyboard and switch control.
 */
import React, {useCallback, useRef, useState} from 'react';
import {FlatList, Pressable, StyleSheet, View, type ListRenderItem, type ViewStyle} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {spacing} from '../tokens';
import {BerxIcon, type BerxIconName} from '../icons';

export interface BerxHorizontalRailProps<T> {
	data: readonly T[];
	renderItem: ListRenderItem<T>;
	keyExtractor: (item: T, index: number) => string;
	/** Item width in dp — needed for the page step and for getItemLayout. */
	itemWidth: number;
	gap?: number;
	/** Names the rail for assistive technology, e.g. "Места рядом". */
	accessibilityLabel: string;
	ListEmptyComponent?: React.ReactElement | null;
	style?: ViewStyle;
	testID?: string;
}

export function BerxHorizontalRail<T>({
	data,
	renderItem,
	keyExtractor,
	itemWidth,
	gap = spacing.md,
	accessibilityLabel,
	ListEmptyComponent,
	style,
	testID,
}: BerxHorizontalRailProps<T>) {
	const {scene} = useBerxScene();
	const listRef = useRef<FlatList<T>>(null);
	const [index, setIndex] = useState(0);
	const step = itemWidth + gap;

	const page = useCallback(
		(direction: -1 | 1) => {
			const next = Math.max(0, Math.min(data.length - 1, index + direction));
			setIndex(next);
			listRef.current?.scrollToOffset({offset: next * step, animated: !scene.reducedMotion});
		},
		[data.length, index, step, scene.reducedMotion],
	);

	const atStart = index <= 0;
	const atEnd = index >= data.length - 1;

	return (
		<View testID={testID} style={style} accessibilityLabel={accessibilityLabel} accessibilityRole="list">
			<FlatList
				ref={listRef}
				horizontal
				data={data as T[]}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				showsHorizontalScrollIndicator={false}
				ItemSeparatorComponent={() => <View style={{width: gap}} />}
				ListEmptyComponent={ListEmptyComponent}
				/* virtualization: the performance contract's list window for this tier */
				initialNumToRender={Math.min(data.length, 4)}
				maxToRenderPerBatch={4}
				windowSize={Math.max(3, Math.round(scene.budget.listWindowSize / 4))}
				removeClippedSubviews
				getItemLayout={(_, i) => ({length: step, offset: step * i, index: i})}
				contentContainerStyle={styles.content}
			/>

			{/* drag alternative — required wherever a gesture is the only way to move */}
			{data.length > 1 ? (
				<View style={styles.controls}>
					<RailControl
						label={`${accessibilityLabel}: назад`}
						icon="chevronLeft"
						disabled={atStart}
						accent={scene.accent}
						onPress={() => page(-1)}
					/>
					<RailControl
						label={`${accessibilityLabel}: вперёд`}
						icon="chevronRight"
						disabled={atEnd}
						accent={scene.accent}
						onPress={() => page(1)}
					/>
				</View>
			) : null}
		</View>
	);
}

function RailControl({
	label,
	icon,
	disabled,
	accent,
	onPress,
}: {
	label: string;
	icon: BerxIconName;
	disabled: boolean;
	accent: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{disabled}}
			disabled={disabled}
			onPress={onPress}
			style={[styles.control, {borderColor: rgba(accent, disabled ? 0.14 : 0.4)}, disabled ? styles.controlDisabled : null]}>
			<BerxIcon name={icon} size={18} color={disabled ? rgba(accent, 0.3) : accent} decorative />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	content: {paddingHorizontal: spacing.lg},
	controls: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
	/* 44dp minimum touch target, per the v9 accessibility contract */
	control: {width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	controlDisabled: {opacity: 0.6},
});
