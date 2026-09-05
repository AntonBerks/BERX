/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 * Three small, reusable primitives for the Business "Spatial Glass"
 * language: a stat tile, an eyebrow section label, and a segmented
 * tab switcher. Kept in one file since each is a handful of lines —
 * not a reason to fragment into three near-empty files.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../tokens';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';
import {BerxText} from '../spatial/BerxText';

export interface BerxStatTileProps {
	label: string;
	value: string;
	trend?: 'up' | 'down' | 'flat';
}

export function BerxStatTile({label, value, trend}: BerxStatTileProps) {
	return (
		<View style={tileStyles.tile}>
			<Text style={tileStyles.value}>{value}</Text>
			<Text style={tileStyles.label}>{label}</Text>
			{trend ? (
				<Text style={[tileStyles.trend, trend === 'up' ? tileStyles.trendUp : trend === 'down' ? tileStyles.trendDown : tileStyles.trendFlat]}>
					{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
				</Text>
			) : null}
		</View>
	);
}

const tileStyles = StyleSheet.create({
	tile: {flex: 1, backgroundColor: colors.glassBusiness, borderWidth: 1, borderColor: colors.glassBusinessBorder, borderRadius: radius.md, padding: spacing.md, gap: 2},
	value: {fontSize: typography.sizeXl, color: colors.white, fontWeight: typography.weightBold},
	label: {fontSize: typography.sizeXs, color: colors.textFaint},
	trend: {position: 'absolute', top: spacing.sm, right: spacing.sm, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	trendUp: {color: colors.success},
	trendDown: {color: colors.danger},
	trendFlat: {color: colors.textFaint},
});

/**
 * The section label, everywhere.
 *
 * Nine screens each had their own `sectionTitle` — 11px faint bold
 * uppercase here, 13px accent bold uppercase there, 15px medium
 * sentence case somewhere else. It is the same thing on every one of
 * them: the name of the group you are about to read. It is the micro
 * role, and it is a real heading for assistive technology, which most
 * of those copies were not.
 *
 * `tone` is the only variation, and it is semantic: accent for a
 * section that belongs to the scene's subject, quiet for one that is
 * simply structure.
 */
export function BerxEyebrow({children, tone = 'accent'}: {children: React.ReactNode; tone?: 'accent' | 'quiet'}) {
	return (
		<BerxText role="micro" emphasis={tone === 'accent' ? 'accent' : 'tertiary'} heading>
			{children}
		</BerxText>
	);
}

export interface BerxSegmentTabsProps<T extends string> {
	options: {key: T; label: string}[];
	value: T;
	onChange: (key: T) => void;
}

/**
 * The segmented control, lit by the scene.
 *
 * It used to paint a fixed `glass1` track with a fixed lighter thumb —
 * the same two greys in every scene, in every colour world, at every
 * tier. In v9 the track is the structure plane and the selected
 * segment is on the control plane, which is exactly what selection
 * means here: one option has been brought forward. Outside a scene it
 * keeps its previous static look rather than throwing, for the same
 * reason BerxGlassSurface does.
 *
 * Selection is announced, not just coloured: each segment is a tab
 * with `selected` state, so a screen-reader user hears which one is
 * active instead of inferring it from a background.
 */
export function BerxSegmentTabs<T extends string>({options, value, onChange}: BerxSegmentTabsProps<T>) {
	const scene = useBerxSceneOptional();
	const track = scene ? {backgroundColor: scene.scene.layers.D2.surface.backgroundColor} : null;

	return (
		<View style={[segStyles.row, track]} accessibilityRole="tablist">
			{options.map((opt) => {
				const active = opt.key === value;
				const activeSurface =
					active && scene
						? {
								backgroundColor: scene.scene.layers.D4.surface.backgroundColor,
								borderColor: scene.scene.layers.D4.surface.edgeHighlightColor,
								borderWidth: 1,
						  }
						: null;
				return (
					<Pressable
						key={opt.key}
						accessibilityRole="tab"
						accessibilityState={{selected: active}}
						accessibilityLabel={opt.label}
						style={[segStyles.tab, active && segStyles.tabActive, activeSurface]}
						onPress={() => onChange(opt.key)}>
						<Text style={[segStyles.tabText, active && segStyles.tabTextActive]}>{opt.label}</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const segStyles = StyleSheet.create({
	row: {flexDirection: 'row', backgroundColor: colors.glass1, borderRadius: radius.pill, padding: 3, gap: 2},
	tab: {flex: 1, paddingVertical: spacing.xs, borderRadius: radius.pill, alignItems: 'center'},
	tabActive: {backgroundColor: colors.glassBusinessBorder},
	tabText: {fontSize: typography.sizeSm, color: colors.textFaint, fontWeight: typography.weightMedium},
	tabTextActive: {color: colors.white},
});
