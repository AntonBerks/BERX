/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * The base surface for the "Spatial Glass" Business design language:
 * a layered, faintly-lit card with depth (shadow.base) rather than a
 * flat admin-panel row. No blur library is installed (no
 * expo-blur/react-native-blur — same npm constraint as every other
 * native module this session), so depth here comes from layered
 * translucency + shadow + a hairline top edge, not a real gaussian
 * blur. `elevated` adds the glow shadow for hero/primary surfaces.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {colors, radius, spacing, shadow} from '../tokens';

export interface BerxGlassSurfaceProps {
	children: React.ReactNode;
	elevated?: boolean;
	padding?: keyof typeof spacing | 0;
	style?: ViewStyle;
}

export function BerxGlassSurface({children, elevated, padding = 'lg', style}: BerxGlassSurfaceProps) {
	return (
		<View
			style={[
				styles.base,
				elevated ? styles.elevated : styles.flat,
				padding !== 0 ? {padding: spacing[padding]} : null,
				style,
			]}>
			<View style={styles.hairline} />
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.glassBusiness,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.glassBusinessBorder,
		overflow: 'hidden',
	},
	flat: {},
	elevated: {
		...shadow.base,
	},
	hairline: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 1,
		backgroundColor: colors.glassBusinessHairline,
	},
});
