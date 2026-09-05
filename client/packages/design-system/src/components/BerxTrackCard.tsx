/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 * Real, generic track-post card. Works with any real BerxTrackPost
 * (components/OssnApi/v1/tracks.php). Real like/comment counts,
 * never estimated. No album art / waveform — no real data source
 * for either exists (no audio-analysis pipeline), so neither is
 * faked; a plain note-glyph badge stands in honestly.
 */
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../tokens';
import { BerxIcon } from '../icons';
import { BerxSpatialCard } from '../spatial/BerxSpatialCard';
import { BerxIdentity } from '../spatial/BerxIdentity';
import { BerxMediaWell } from '../spatial/BerxMediaWell';
import type { BerxTrackPost } from '@berx/api/types';
import {BerxText} from '../spatial/BerxText';
import { berxCount, berxPlural } from '@berx/domain';

export interface BerxTrackCardProps {
	track: BerxTrackPost;
	onPress: (track: BerxTrackPost) => void;
	onOpenProfile?: (username: string) => void;
}

export function BerxTrackCard({ track, onPress, onOpenProfile }: BerxTrackCardProps) {
	return (
		/* D3 — a track is an object on the content plane, not a flat
		   token-coloured row: it catches the scene's light, casts the
		   plane's shadow and lifts on focus like every other card. */
		<BerxSpatialCard
			depth="D3"
			padding={spacing.sm}
			radius={radius.md}
			onPress={() => onPress(track)}
			accessibilityLabel={`Трек ${track.owner_username ?? 'BERX'}${track.text ? `: ${track.text}` : ''}`}
			style={styles.card}>
			<View style={styles.row}>
			{/* a track has no cover art in the API — the well is where one
			    would be, lit by the room rather than filled with grey */}
			<BerxMediaWell radius={radius.md} style={styles.badge}>
				<BerxIcon name="music" size={16} color={colors.white} decorative />
			</BerxMediaWell>
			<View style={styles.body}>
				{/* the author, as a person. videos.php returns owner_icon on
				    every row and the card drew only the name — so whoever
				    made this read as a text label rather than as someone
				    you could recognise. BerxIdentity is one control, so a
				    screen reader gets one action rather than a tappable
				    picture beside untappable words. */}
				<BerxIdentity
					userGuid={track.owner_guid}
					name={track.owner_username ?? 'BERX'}
					avatarUrl={track.owner_icon ?? undefined}
					size={28}
					onPress={track.owner_username && onOpenProfile ? () => onOpenProfile(track.owner_username as string) : undefined}
				/>
				{track.text ? <BerxText role="meta" numberOfLines={1}>{track.text}</BerxText> : null}
				{/* real counts, with the word that agrees with them */}
				<BerxText role="meta" emphasis="tertiary">
					{`${track.like_count} ${berxPlural(track.like_count, 'отметка', 'отметки', 'отметок')} · ${berxCount(track.comment_count, 'комментарий', 'комментария', 'комментариев')}`}
				</BerxText>
			</View>
			</View>
		</BerxSpatialCard>
	);
}

const styles = StyleSheet.create({
	card: { marginBottom: spacing.sm },
	row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
	badge: { width: 48, height: 48 },
	body: { flex: 1, gap: 2 },
});
