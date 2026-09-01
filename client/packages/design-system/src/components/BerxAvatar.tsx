/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header for
 * the full explanation. Same sandbox constraint applies here.
 */
import {useMemo} from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import {typography, shadow} from '../tokens';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

export interface BerxAvatarProps {
	iconUrl?: string | null;
	fallbackInitial: string;
	size?: number;
	/** Story ring — real, wired data (StoriesRailScreen.tsx passes it for every real active-story owner it renders). */
	hasActiveStory?: boolean;
}

export function BerxAvatar({ iconUrl, fallbackInitial, size = 44, hasActiveStory }: BerxAvatarProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const dimension = { width: size, height: size, borderRadius: size / 2 };
	return (
		<View
			style={[
				styles.ring,
				hasActiveStory && styles.ringActive,
				{ width: size + (hasActiveStory ? 6 : 0), height: size + (hasActiveStory ? 6 : 0), borderRadius: (size + 6) / 2 },
			]}
		>
			{iconUrl ? (
				<Image source={{ uri: iconUrl }} style={[styles.image, dimension]} />
			) : (
				<View style={[styles.fallback, dimension]}>
					<Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{fallbackInitial.toUpperCase()}</Text>
				</View>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	ring: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	ringActive: {
		borderWidth: 2,
		borderColor: colors.accent,
		...shadow.glow,
	},
	image: {
		resizeMode: 'cover',
	},
	fallback: {
		backgroundColor: colors.graphite,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fallbackText: {
		color: colors.textDim,
		fontWeight: typography.weightBold,
	},
});
