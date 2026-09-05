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
import {BerxSurface} from '../spatial/BerxSurface';
import {BerxIcon} from '../icons';
import {useBerxRoomLight} from '../spatial/useBerxRoomLight';

export interface BerxStatTileProps {
	label: string;
	value: string;
	trend?: 'up' | 'down' | 'flat';
}

/**
 * A real number, as an object in the room.
 *
 * It was a flat fill with a hairline: the same rectangle in every
 * scene, on every plane, whatever the room was doing. A stat is
 * content, so it stands on the content plane, takes the light that
 * reaches its corner, and — where the device has no blur — is
 * flattened against what is actually behind it rather than against
 * the substrate.
 *
 * The trend arrow becomes the icon set's own trend mark. ↑ ↓ → are
 * typographic characters whose shape and weight change with whatever
 * font resolves them.
 */
export function BerxStatTile({label, value, trend}: BerxStatTileProps) {
	const scene = useBerxSceneOptional();
	const light = useBerxRoomLight();
	const body = (
		<View style={tileStyles.body}>
			<BerxText role="heading">{String(value)}</BerxText>
			<BerxText role="meta" emphasis="tertiary">
				{label}
			</BerxText>
			{trend ? (
				<View style={tileStyles.trend}>
					<BerxIcon
						name={trend === 'flat' ? 'forward' : 'trend'}
						size={13}
						color={trend === 'up' ? colors.success : trend === 'down' ? colors.danger : colors.textFaint}
						style={trend === 'down' ? tileStyles.trendDown : undefined}
						decorative
					/>
				</View>
			) : null}
		</View>
	);

	if (!scene) return <View style={tileStyles.tile}>{body}</View>;

	const content = scene.scene.layers.D3;
	return (
		<View ref={light.measure} onLayout={light.onLayout} style={tileStyles.slot}>
			<BerxSurface
				surface={content.surface}
				lighting={content.lighting}
				radius={radius.md}
				illumination={light.illumination}
				behind={light.behind}>
				{body}
			</BerxSurface>
		</View>
	);
}

const tileStyles = StyleSheet.create({
	slot: {flex: 1},
	tile: {flex: 1, backgroundColor: colors.glassBusiness, borderWidth: 1, borderColor: colors.glassBusinessBorder, borderRadius: radius.md},
	body: {padding: spacing.md, gap: 2},
	trend: {position: 'absolute', top: spacing.sm, right: spacing.sm},
	/* the same mark, turned over: a fall is a rise pointing down */
	trendDown: {transform: [{scaleY: -1}]},
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
