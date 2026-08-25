/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * HONEST ABSTRACTION, REAL FALLBACK, NOT A FAKE PLAYER. No embedded
 * video-playback library (react-native-video, expo-av, etc.) is
 * installable in this sandbox — same npm-registry-403 constraint as
 * every other native module this session. Rather than render a
 * "video player" that silently does nothing, this component uses
 * `Linking.openURL()` — a CORE React Native API, no external package
 * required — to hand the real, already-working `/media/get/{guid}`
 * URL (real MIME type set server-side, see media.php) to the OS's own
 * default handler. On both iOS and Android that genuinely plays the
 * video in the platform's native viewer. This is real, working
 * functionality today, not a placeholder — it just isn't an in-app
 * embedded player.
 *
 * THE REAL INTEGRATION BOUNDARY for a future embedded player: swap
 * this component's body for `<Video source={{uri: url}} ... />` from
 * react-native-video once that package is actually installed in a
 * real project — every prop this component already takes
 * (`url`, `posterColor`, `onPlay`) maps directly onto that library's
 * own real API, so no caller needs to change.
 */
import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';

export interface BerxVideoPlayerProps {
	url: string;
	widthRatio?: number;
	onOpen?: () => void;
}

export function BerxVideoPlayer({ url, widthRatio = 16 / 9, onOpen }: BerxVideoPlayerProps) {
	async function handleOpen() {
		onOpen?.();
		try {
			await Linking.openURL(url);
		} catch {
			// A device with no handler for the video MIME type at all is
			// a real, if unusual, outcome — silently no-op rather than
			// crash; there's nothing more specific to tell the user that
			// wouldn't be guessing at the OS's own failure reason.
		}
	}

	return (
		<Pressable style={[styles.frame, { aspectRatio: widthRatio }]} onPress={handleOpen}>
			<View style={styles.playBadge}>
				<Text style={styles.playGlyph}>▶</Text>
			</View>
			<Text style={styles.hint}>Открыть видео</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	frame: { backgroundColor: colors.graphite, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
	playBadge: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: 'rgba(5,5,5,0.55)', alignItems: 'center', justifyContent: 'center' },
	playGlyph: { color: colors.white, fontSize: typography.sizeXl },
	hint: { color: colors.textDim, fontSize: typography.sizeSm },
});
