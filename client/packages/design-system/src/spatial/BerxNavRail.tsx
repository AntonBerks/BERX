/**
 * The wide-layout navigation the archive's platform matrix specifies:
 * a rail on tablet, a sidebar with labels on desktop.
 *
 * Same tabs, same real unread counts, same control-layer material as
 * the bottom bar — one navigation model wearing the shape the platform
 * calls for, rather than a second navigation system for big screens.
 */
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxLayer} from './useBerxLayer';
import {BerxSurface} from './BerxSurface';
import type {BerxNavTab} from './BerxBottomNav';
import {colors, spacing, typography} from '../tokens';

export interface BerxNavRailProps<T extends string> {
	tabs: readonly BerxNavTab<T>[];
	active: T;
	onSelect: (key: T) => void;
	/** 'rail' is icon-first and narrow; 'sidebar' shows labels. */
	variant: 'rail' | 'sidebar';
	testID?: string;
}

export function BerxNavRail<T extends string>({tabs, active, onSelect, variant, testID}: BerxNavRailProps<T>) {
	const layer = useBerxLayer('D4', 'active');
	const accent = layer.accent;
	const sidebar = variant === 'sidebar';

	return (
		<View testID={testID} style={[styles.root, sidebar ? styles.sidebar : styles.rail]}>
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={0} style={styles.fill}>
				<View accessibilityRole="tablist" style={styles.items}>
					{tabs.map((tab) => {
						const selected = tab.key === active;
						return (
							<Pressable
								key={tab.key}
								accessibilityRole="tab"
								accessibilityState={{selected}}
								accessibilityLabel={
									tab.badge && tab.badge > 0 ? `${tab.label}, непрочитанных: ${tab.badge}` : tab.label
								}
								onPress={() => onSelect(tab.key)}
								style={({pressed}) => [
									styles.item,
									sidebar ? styles.itemSidebar : styles.itemRail,
									selected ? {backgroundColor: rgba(accent, 0.12)} : null,
									{opacity: pressed ? 0.7 : 1},
								]}>
								<View style={styles.iconWrap}>
									{tab.icon}
									{tab.badge && tab.badge > 0 ? (
										<View style={[styles.badge, {backgroundColor: accent}]}>
											<Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
										</View>
									) : null}
								</View>
								{sidebar ? (
									<Text style={[styles.label, {color: selected ? accent : colors.textDim}]} numberOfLines={1}>
										{tab.label}
									</Text>
								) : null}
								{selected ? <View style={[styles.indicator, {backgroundColor: accent, shadowColor: accent}]} /> : null}
							</Pressable>
						);
					})}
				</View>
			</BerxSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {height: '100%'},
	rail: {width: 76},
	sidebar: {width: 232},
	fill: {flex: 1, borderRadius: 0},
	items: {paddingTop: spacing.xl, gap: spacing.xs, paddingHorizontal: spacing.sm},
	/* 44dp minimum on every platform, including the ones with a pointer */
	item: {minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
	itemRail: {paddingVertical: spacing.md},
	itemSidebar: {flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, justifyContent: 'flex-start'},
	iconWrap: {},
	label: {flex: 1, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	indicator: {position: 'absolute', left: 0, top: 12, bottom: 12, width: 2, borderRadius: 1, shadowOpacity: 1, shadowRadius: 6},
	badge: {
		position: 'absolute',
		top: -4,
		right: -10,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		paddingHorizontal: 4,
		alignItems: 'center',
		justifyContent: 'center',
	},
	badgeText: {color: '#04252A', fontSize: 10, fontWeight: typography.weightBold},
});
