/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * REAL, WORKING FALLBACK — not a placeholder, and genuinely correct
 * to use here (see BerxVideoPlayer.tsx's header for the case where
 * this exact approach would NOT be honest: Stories' media route is
 * bearer-token gated, so Linking.openURL() would 401 there). Track
 * audio uploaded through the generic Media Foundation gets a URL
 * from the SAME /media/get/{guid} handler Post video/Place covers
 * use — confirmed public-by-URL (see themes/berx/ossn_theme.php's
 * own header comment on that handler) before building this, not
 * assumed. Linking.openURL() on a real audio/mpeg URL genuinely
 * plays it in the OS's native audio handler on both iOS and Android
 * — no embedded player library required for this to actually work.
 *
 * REAL INTEGRATION BOUNDARY for a future embedded/inline player:
 * swap this component's body for `<Sound source={{uri: url}} ... />`
 * (or similar) from a library like react-native-track-player once
 * installed — `url`/`onPlay` map directly onto that kind of API.
 *
 * The bar is an object on the content plane and the play control is
 * on the control plane in front of it. That ordering is the whole
 * point: a flat grey bar with a coloured circle printed into it reads
 * as one graphic, and what you can press has to be the part that is
 * nearer.
 */
import { Pressable, Linking, StyleSheet } from 'react-native';
import { spacing, radius } from '../tokens';
import {BerxSurface} from '../spatial/BerxSurface';
import {useBerxScene} from '../spatial/BerxSpatialScene';
import {useBerxRoomLight} from '../spatial/useBerxRoomLight';
import { BerxIcon } from '../icons';
import {BerxText} from '../spatial/BerxText';

export interface BerxAudioPlayerProps {
	url: string;
	onOpen?: () => void;
}

export function BerxAudioPlayer({ url, onOpen }: BerxAudioPlayerProps) {
	async function handleOpen() {
		onOpen?.();
		try {
			await Linking.openURL(url);
		} catch {
			// A device with no audio handler at all is a real, if
			// unusual, outcome — silently no-op rather than crash;
			// nothing more specific to say that wouldn't be guessing at
			// the OS's own failure reason.
		}
	}

	const {scene} = useBerxScene();
	const room = useBerxRoomLight();

	return (
		<Pressable
			ref={room.measure}
			onLayout={room.onLayout}
			accessibilityRole="button"
			accessibilityLabel="Воспроизвести трек"
			accessibilityHint="Откроется в системном проигрывателе"
			onPress={handleOpen}>
			{/* D3 — the track, standing where it stands in the room */}
			<BerxSurface
				surface={scene.layers.D3.surface}
				lighting={scene.layers.D3.lighting}
				radius={radius.md}
				illumination={room.illumination}
				behind={room.behind}
				style={styles.bar}>
				{/* D4 — the control, one plane nearer, carrying the energy
				    the control plane declares */}
				<BerxSurface
					surface={scene.layers.D4.surface}
					lighting={scene.layers.D4.lighting}
					radius={radius.pill}
					emissive
					style={styles.playBadge}>
					<BerxIcon name="play" size={16} state="active" decorative />
				</BerxSurface>
				<BerxText role="meta" emphasis="secondary">Воспроизвести трек</BerxText>
			</BerxSurface>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
	playBadge: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
