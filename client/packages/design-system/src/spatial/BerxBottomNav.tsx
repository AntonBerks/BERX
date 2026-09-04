/**
 * BerxBottomNav — the D4 control layer's home.
 *
 * Extracted from AppShell, where it lived inline with no focus
 * handling and no badge semantics. It now sits on the control layer
 * (legible over any background media by contract), has 44dp targets,
 * announces the selected tab, and reports unread counts as real
 * numbers from the server rather than a decorative dot.
 */
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';
import {colors, spacing, typography} from '../tokens';

export interface BerxNavTab<T extends string> {
	key: T;
	label: string;
	icon: React.ReactNode;
	/** Real unread count from the server. undefined = nothing to report. */
	badge?: number;
}

export interface BerxBottomNavProps<T extends string> {
	tabs: readonly BerxNavTab<T>[];
	active: T;
	onSelect: (key: T) => void;
	testID?: string;
}

export function BerxBottomNav<T extends string>({tabs, active, onSelect, testID}: BerxBottomNavProps<T>) {
	const {scene} = useBerxScene();
	const layer = scene.layers.D4;

	return (
		<View testID={testID} style={styles.root}>
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={0}>
				<View accessibilityRole="tablist" style={styles.row}>
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
								style={({pressed}) => [styles.tab, {opacity: pressed ? 0.7 : 1}]}>
								<View style={styles.iconWrap}>
									{tab.icon}
									{tab.badge && tab.badge > 0 ? (
										<View style={[styles.badge, {backgroundColor: scene.accent}]}>
											<Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
										</View>
									) : null}
								</View>
								<Text style={[styles.label, {color: selected ? scene.accent : colors.textFaint}]}>{tab.label}</Text>
								{selected ? <View style={[styles.indicator, {backgroundColor: scene.accent, shadowColor: scene.accent}]} /> : null}
							</Pressable>
						);
					})}
				</View>
			</BerxSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {},
	row: {flexDirection: 'row'},
	/* 44dp minimum, and the label is always visible — an icon-only tab bar is a guessing game */
	tab: {flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.sm},
	iconWrap: {},
	label: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	indicator: {position: 'absolute', top: 0, width: 24, height: 2, borderRadius: 1, shadowOpacity: 1, shadowRadius: 6},
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

/** Kept next to the nav so callers styling a custom icon share the same dim value. */
export const BERX_NAV_INACTIVE = rgba(colors.text, 0.38);
