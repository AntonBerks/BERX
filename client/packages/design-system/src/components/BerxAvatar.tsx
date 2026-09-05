/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header for
 * the full explanation. Same sandbox constraint applies here.
 */
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../tokens';
import { BerxMediaWell } from '../spatial/BerxMediaWell';
import { useBerxSceneOptional } from '../spatial/BerxSpatialScene';

export interface BerxAvatarProps {
	iconUrl?: string | null;
	fallbackInitial: string;
	size?: number;
	/** Story ring — only meaningful once Stories UI actually calls this with hasActiveStory; not wired to any screen yet. */
	hasActiveStory?: boolean;
}

export function BerxAvatar({ iconUrl, fallbackInitial, size = 44, hasActiveStory }: BerxAvatarProps) {
	const scene = useBerxSceneOptional();
	/* the ring around a person with a story is the scene's own accent:
	   the token is one cyan in every colour world, and a ring that
	   ignores the room it is in is the flattening the Color World
	   system exists to prevent */
	const ringColor = scene?.scene.accent ?? colors.accent;
	const dimension = { width: size, height: size, borderRadius: size / 2 };
	return (
		<View
			style={[
				styles.ring,
				hasActiveStory && [styles.ringActive, { borderColor: ringColor }],
				{ width: size + (hasActiveStory ? 6 : 0), height: size + (hasActiveStory ? 6 : 0), borderRadius: (size + 6) / 2 },
			]}
		>
			{iconUrl ? (
				<Image source={{ uri: iconUrl }} style={[styles.image, dimension]} />
			) : (
				/* no avatar is a recess in the room, not a grey disc that
				   belongs to no plane */
				<BerxMediaWell radius={size / 2} style={dimension}>
					<Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{fallbackInitial.toUpperCase()}</Text>
				</BerxMediaWell>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	ring: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	ringActive: {
		borderWidth: 2,
	},
	image: {
		resizeMode: 'cover',
	},
	fallbackText: {
		color: colors.textDim,
		fontWeight: typography.weightBold,
	},
});
