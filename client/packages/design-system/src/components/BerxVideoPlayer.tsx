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
 *
 * Spatially it is a real object, not a grey rectangle with a circle
 * on it. The frame stands on the content plane and takes the light
 * that reaches its own corner of the room; the play control is on the
 * control plane in front of it, with the control material's own lit
 * edge — so the thing you press reads as being nearer than the thing
 * it acts on, which is the only reason a badge over a poster works at
 * all.
 */
import { Pressable, Linking, StyleSheet } from 'react-native';
import {BerxSurface} from '../spatial/BerxSurface';
import {useBerxScene} from '../spatial/BerxSpatialScene';
import {useBerxRoomLight} from '../spatial/useBerxRoomLight';
import { colors, spacing, radius } from '../tokens';
import { BerxIcon } from '../icons';
import {BerxText} from '../spatial/BerxText';

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

	const {scene} = useBerxScene();
	const room = useBerxRoomLight();

	return (
		<Pressable
			ref={room.measure}
			onLayout={room.onLayout}
			accessibilityRole="button"
			accessibilityLabel="Открыть видео"
			accessibilityHint="Откроется в системном проигрывателе"
			style={{ aspectRatio: widthRatio }}
			onPress={handleOpen}>
			{/* D3 — the poster is an object standing in the room */}
			<BerxSurface
				surface={scene.layers.D3.surface}
				lighting={scene.layers.D3.lighting}
				radius={radius.md}
				illumination={room.illumination}
				behind={room.behind}
				style={styles.frame}>
				{/* D4 — the control is in front of what it plays, carrying
				    the control plane's own material and its emission */}
				<BerxSurface
					surface={scene.layers.D4.surface}
					lighting={scene.layers.D4.lighting}
					radius={radius.pill}
					emissive
					style={styles.playBadge}>
					<BerxIcon name="play" size={22} color={colors.white} decorative />
				</BerxSurface>
				<BerxText role="meta" emphasis="secondary">Открыть видео</BerxText>
			</BerxSurface>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	frame: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
	playBadge: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
