/**
 * BerxBottomNav — the D4 control layer's home.
 *
 * Extracted from AppShell, where it lived inline with no focus
 * handling and no badge semantics. It sits on the control layer
 * (legible over any background media by contract), has 44dp targets,
 * announces the selected tab, and reports unread counts as real
 * numbers from the server rather than a decorative dot.
 *
 * It is an object, not a bar. Edge-to-edge with square corners it
 * read as a strip laid over the bottom of every scene, cutting the
 * room off at the ankles — the same flat-layer-above-the-scene
 * mistake the header made at the top. Inset from the edges and
 * rounded, it becomes what D4 is supposed to be: a control surface
 * floating nearer than the content, with the room continuing behind
 * and under it. The scene it floats over is what makes it read as
 * near, which is why it carries no fill of its own beyond the
 * control plane's own material.
 *
 * The selected tab is marked by the accent underneath rather than a
 * bar across the top: an indicator that touches the object's own edge
 * turns the object back into a bar.
 */
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxLayer} from './useBerxLayer';
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
	/**
	 * Visible text under each icon. BERX ships this off, per an
	 * explicit design decision recorded in the app shell: the bar is
	 * icon-only. That decision is about what is drawn, not about what
	 * is announced — `label` is always the accessible name, so the bar
	 * stays usable by screen reader either way. Left on by default
	 * because for any new surface a labelled tab is the safer choice.
	 */
	showLabels?: boolean;
	testID?: string;
}

export function BerxBottomNav<T extends string>({tabs, active, onSelect, showLabels = true, testID}: BerxBottomNavProps<T>) {
	/**
	 * The tab bar spans every scene rather than belonging to one, so it
	 * resolves its control-layer material directly — same material
	 * system, no scene required.
	 */
	const layer = useBerxLayer('D4', 'active');
	const accent = layer.accent;

	return (
		<View testID={testID} style={styles.root}>
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={26}>
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
										<View style={[styles.badge, {backgroundColor: accent}]}>
											<Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
										</View>
									) : null}
								</View>
								{showLabels ? (
									<Text style={[styles.label, {color: selected ? accent : colors.textFaint}]}>{tab.label}</Text>
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
	/* inset, so the room runs behind and past it on every side */
	root: {marginHorizontal: spacing.lg, marginBottom: spacing.md},
	row: {flexDirection: 'row'},
	/* 44dp minimum. Whether the label is drawn is the caller's call; the
	   accessible name is not optional either way. */
	tab: {flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.sm},
	iconWrap: {},
	label: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	/* under the icon, not across the object's edge */
	indicator: {position: 'absolute', bottom: 8, width: 18, height: 2, borderRadius: 1, shadowOpacity: 1, shadowRadius: 6},
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
