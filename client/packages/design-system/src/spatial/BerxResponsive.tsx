/**
 * The archive's responsive and platform rules, implemented.
 *
 * Every contract carries the same layout contract — single column on
 * mobile, two zones on tablet, a 12-column spatial grid on desktop,
 * 1280 max content width, 16 gutter, 24 section gap — and the
 * platform matrix says how navigation and input differ. Those are
 * applied here, from the resolved screen, rather than re-decided per
 * screen.
 *
 * The same BERX world on every platform: identical domain, tokens,
 * materials, depth and motion. What changes is layout, navigation and
 * input — which is exactly the split the archive draws.
 */
import {StyleSheet, View, useWindowDimensions, type ViewStyle} from 'react-native';
import type {BerxLayoutMode, BerxNavShell, BerxResolvedScreen} from '@berx/scenes';
import {spacing} from '../tokens';

export interface BerxResponsiveInfo {
	layout: BerxLayoutMode;
	navShell: BerxNavShell;
	/** Columns available to a grid at this width, on the archive's 12-column desktop grid. */
	columns: number;
	maxContentWidth: number;
	gutter: number;
	sectionGap: number;
	/** True where a secondary zone is worth rendering at all. */
	hasSecondaryZone: boolean;
	width: number;
}

export function useBerxResponsive(screen: BerxResolvedScreen): BerxResponsiveInfo {
	const {width} = useWindowDimensions();
	const layout = screen.layoutMode;

	return {
		layout,
		navShell: screen.navShell,
		/**
		 * Column count follows the archive: one on a phone, two zones on
		 * a tablet, and the 12-column spatial grid on desktop — which in
		 * practice means three content columns at 1280 and four beyond
		 * it, since a 12-column grid with 3- or 4-column cards is what
		 * the layout contract describes.
		 */
		columns: layout === 'single-column' ? 1 : layout === 'two-zone' ? 2 : width >= 1600 ? 4 : 3,
		maxContentWidth: screen.maxContentWidth,
		gutter: screen.gutter,
		sectionGap: screen.sectionGap,
		hasSecondaryZone: layout !== 'single-column',
		width,
	};
}

export interface BerxContentFrameProps {
	screen: BerxResolvedScreen;
	children: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
}

/**
 * Holds content to the contract's max width and centres it.
 *
 * On a phone this is a no-op; on a desktop it is the difference
 * between a BERX scene and a stretched mobile app. Applied once, here,
 * so no screen has to remember it.
 */
export function BerxContentFrame({screen, children, style, testID}: BerxContentFrameProps) {
	const {maxContentWidth, gutter} = useBerxResponsive(screen);
	return (
		<View testID={testID} style={[styles.frameOuter, style]}>
			<View style={[styles.frameInner, {maxWidth: maxContentWidth, paddingHorizontal: gutter}]}>{children}</View>
		</View>
	);
}

export interface BerxTwoZoneProps {
	screen: BerxResolvedScreen;
	primary: React.ReactNode;
	/** Rendered beside the primary zone on tablet and wider; below it never. */
	secondary: React.ReactNode;
	/** 0..1 share of the width the secondary zone takes. */
	secondaryRatio?: number;
	testID?: string;
}

/**
 * The archive's two-zone tablet layout, and the desktop grid's
 * side channel.
 *
 * On a phone the secondary zone is not rendered rather than stacked
 * underneath: a phone-height column of secondary content is how a
 * tablet layout becomes an endless scroll, and the archive's mobile
 * contract is single-column for a reason.
 */
export function BerxTwoZone({screen, primary, secondary, secondaryRatio = 0.36, testID}: BerxTwoZoneProps) {
	const {hasSecondaryZone, sectionGap} = useBerxResponsive(screen);

	if (!hasSecondaryZone) {
		return (
			<View testID={testID} style={styles.zoneSingle}>
				{primary}
			</View>
		);
	}

	return (
		<View testID={testID} style={[styles.zoneRow, {gap: sectionGap}]}>
			<View style={{flex: 1 - secondaryRatio}}>{primary}</View>
			<View style={{flex: secondaryRatio}}>{secondary}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	frameOuter: {flex: 1, alignItems: 'center'},
	frameInner: {flex: 1, width: '100%'},
	zoneSingle: {flex: 1},
	zoneRow: {flex: 1, flexDirection: 'row', paddingHorizontal: spacing.lg},
});
