/**
 * BerxSceneList — a list that knows how wide it is.
 *
 * The archive gives every screen the same layout contract: one column
 * on a phone, two zones on a tablet, the 12-column spatial grid on a
 * desktop, 1280 of content and no more. BerxResponsive implemented
 * all of it and exactly one screen used it, so on a tablet or a
 * desktop BERX was a phone layout stretched across the window: cards
 * a metre wide, a single column of them, and 1280px of empty room on
 * either side.
 *
 * This is the list every scene's content runs through. It reads the
 * resolved screen and does three things no individual list should
 * have to remember:
 *
 *   holds the content to the contract's maximum width and centres it,
 *   so a wide window gets more room around the scene rather than
 *   wider objects;
 *
 *   lays the objects out in the number of columns the layout mode
 *   actually calls for, which is what a 12-column grid means when
 *   there is something to put in it;
 *
 *   and spaces them on the contract's own gutter and section gap
 *   rather than on a number each screen picked.
 *
 * The virtualization window still comes from the scene's performance
 * budget, and the column count is part of the list's key, because
 * FlatList cannot change numColumns on an existing instance.
 */
import {useMemo} from 'react';
import {FlatList, StyleSheet, View, type FlatListProps, type ViewStyle} from 'react-native';
import type {BerxResolvedScreen} from '@berx/scenes';
import {useBerxResponsive} from './BerxResponsive';

export interface BerxSceneListProps<T> extends Omit<FlatListProps<T>, 'numColumns' | 'columnWrapperStyle'> {
	screen: BerxResolvedScreen;
	/**
	 * Forces a single column for content that is a row rather than a
	 * card — a conversation list, a settings list, a comment thread.
	 * Those get the width limit and the rhythm without being cut into
	 * columns, because a row in three columns is a table.
	 */
	rows?: boolean;
	style?: ViewStyle;
}

export function BerxSceneList<T>({screen, rows = false, style, contentContainerStyle, renderItem, ...rest}: BerxSceneListProps<T>) {
	const {columns, maxContentWidth, gutter, sectionGap} = useBerxResponsive(screen);
	const count = rows ? 1 : columns;

	/**
	 * In more than one column each object has to take its share of the
	 * row, and a card that does not say so keeps its content width and
	 * leaves a ragged right edge. The screens should not each have to
	 * remember that, so the share is applied here and the renderItem a
	 * screen wrote for one column keeps working in three.
	 */
	const renderCell = useMemo<FlatListProps<T>['renderItem']>(() => {
		if (!renderItem) return renderItem;
		if (count <= 1) return renderItem;
		return (info) => <View style={styles.cell}>{renderItem(info)}</View>;
	}, [renderItem, count]);

	const container = useMemo(
		() => [{padding: gutter, gap: sectionGap} as ViewStyle, contentContainerStyle],
		[gutter, sectionGap, contentContainerStyle],
	);

	return (
		<View style={[styles.outer, style]}>
			<View style={[styles.inner, {maxWidth: maxContentWidth}]}>
				<FlatList<T>
					/* numColumns is fixed for the life of a FlatList, so a
					   width change that alters it must produce a new one */
					key={`berx-cols-${count}`}
					numColumns={count}
					columnWrapperStyle={count > 1 ? {gap: sectionGap} : undefined}
					contentContainerStyle={container}
					renderItem={renderCell}
					{...rest}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {flex: 1, alignItems: 'center'},
	inner: {flex: 1, width: '100%'},
	cell: {flex: 1},
});
