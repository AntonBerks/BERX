/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX SEGMENTED TABS — the reference set's content switcher
 * (Gallery/Tags, Library/Videos/Saved, Feed/Reels). One glass track
 * with a filled active segment, not four separate pills.
 *
 * Segments are supplied by the caller and only ever describe surfaces
 * that actually exist; there is no "coming soon" segment.
 */
import {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {typography, radius} from '../tokens';
import type {BerxColorTokens} from '../tokens';
import {useBerxColors} from '../theme';

export interface BerxSegment {
	key: string;
	label: string;
	glyph?: string;
	/** Real count, when the caller has one. Omitted rather than shown as 0. */
	count?: number;
}

export interface BerxSegmentedTabsProps {
	segments: BerxSegment[];
	activeKey: string;
	onSelect: (key: string) => void;
	style?: ViewStyle;
}

export function BerxSegmentedTabs({segments, activeKey, onSelect, style}: BerxSegmentedTabsProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={[styles.track, style]}>
			{segments.map((seg: BerxSegment) => {
				const active = seg.key === activeKey;
				return (
					<Pressable
						key={seg.key}
						style={[styles.segment, active && styles.segmentActive]}
						onPress={() => onSelect(seg.key)}>
						{seg.glyph ? (
							<Text style={[styles.glyph, active && styles.glyphActive]}>{seg.glyph}</Text>
						) : null}
						<Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
							{seg.label}
						</Text>
						{typeof seg.count === 'number' ? (
							<Text style={[styles.count, active && styles.countActive]}>{seg.count}</Text>
						) : null}
					</Pressable>
				);
			})}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		track: {
			flexDirection: 'row',
			padding: 4,
			borderRadius: radius.pill,
			backgroundColor: colors.glass2,
			borderWidth: 1,
			borderColor: colors.borderSoft,
			gap: 2,
		},
		segment: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 6,
			paddingVertical: 9,
			borderRadius: radius.pill,
		},
		segmentActive: {backgroundColor: colors.accent},
		glyph: {color: colors.textDim, fontSize: 13},
		glyphActive: {color: colors.onAccent},
		label: {color: colors.textDim, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
		labelActive: {color: colors.onAccent, fontWeight: typography.weightBold},
		count: {color: colors.textFaint, fontSize: typography.sizeXs},
		countActive: {color: colors.onAccent},
	});
