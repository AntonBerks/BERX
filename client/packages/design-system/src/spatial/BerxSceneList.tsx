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
 * It also moves the room. Parallax is the most legible depth cue BERX
 * has, and it only happens when something tells the scene where the
 * viewer has scrolled to — which fifteen of the fifty-two scrolling
 * screens did. On the other thirty-seven the environment sat still
 * behind moving content, so the room read as wallpaper. A list is
 * the thing that scrolls, so the list reports it, and a screen no
 * longer has to remember. A caller's own onScroll still runs.
 *
 * The virtualization window still comes from the scene's performance
 * budget, and the column count is part of the list's key, because
 * FlatList cannot change numColumns on an existing instance.
 */
import {useCallback, useMemo} from 'react';
import {
	FlatList,
	StyleSheet,
	View,
	useWindowDimensions,
	type FlatListProps,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	type ViewStyle,
} from 'react-native';
import {BERX_V9_CONTRACT_DEFAULTS, resolveLayoutMode, type BerxResolvedScreen} from '@berx/scenes';
import {useBerxResponsive} from './BerxResponsive';
import {useBerxSceneScrollOptional} from './BerxSpatialScene';

export interface BerxSceneListProps<T> extends Omit<FlatListProps<T>, 'numColumns' | 'columnWrapperStyle'> {
	/**
	 * The resolved screen, when the caller has one.
	 *
	 * Optional, and the fallback is exact rather than approximate: the
	 * layout mode is a pure function of the viewport width, and the
	 * width limit, gutter and section gap are contract *defaults* —
	 * identical across all 300 archive contracts, and checked against
	 * the archive by the verifier. A list that cannot reach its screen
	 * therefore lays out exactly as it would with one, instead of
	 * being left as a stretched phone column.
	 */
	screen?: BerxResolvedScreen;
	/**
	 * Forces a single column for content that is a row rather than a
	 * card — a conversation list, a settings list, a comment thread.
	 * Those get the width limit and the rhythm without being cut into
	 * columns, because a row in three columns is a table.
	 */
	rows?: boolean;
	style?: ViewStyle;
}

export function BerxSceneList<T>({screen, rows = false, style, contentContainerStyle, renderItem, onScroll, ...rest}: BerxSceneListProps<T>) {
	const {width} = useWindowDimensions();
	const scene = useBerxSceneScrollOptional();
	const resolved = useBerxResponsive(screen ?? fallbackScreen(width));
	const {columns, maxContentWidth, gutter, sectionGap} = resolved;
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

	/* the room moves with the viewer; the caller's own handler still runs */
	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			scene?.onScroll(event);
			onScroll?.(event);
		},
		[scene, onScroll],
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
					onScroll={handleScroll}
					scrollEventThrottle={scene?.scrollEventThrottle ?? 16}
					{...rest}
				/>
			</View>
		</View>
	);
}

/**
 * The layout half of a resolved screen, from the width and the
 * archive's own defaults. Only the fields useBerxResponsive reads are
 * filled; nothing here is invented, and nothing else is claimed.
 */
function fallbackScreen(width: number): BerxResolvedScreen {
	return {
		layoutMode: resolveLayoutMode(width),
		maxContentWidth: BERX_V9_CONTRACT_DEFAULTS.layout.maxContentWidth,
		gutter: BERX_V9_CONTRACT_DEFAULTS.layout.gutter,
		sectionGap: BERX_V9_CONTRACT_DEFAULTS.layout.sectionGap,
	} as BerxResolvedScreen;
}

const styles = StyleSheet.create({
	outer: {flex: 1, alignItems: 'center'},
	inner: {flex: 1, width: '100%'},
	cell: {flex: 1},
});
