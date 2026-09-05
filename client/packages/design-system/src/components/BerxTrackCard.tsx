/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 * Real, generic track-post card. Works with any real BerxTrackPost
 * (components/OssnApi/v1/tracks.php). Real like/comment counts,
 * never estimated. No album art / waveform — no real data source
 * for either exists (no audio-analysis pipeline), so neither is
 * faked; a plain note-glyph badge stands in honestly.
 */
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../tokens';
import { BerxIcon } from '../icons';
import { BerxSpatialCard } from '../spatial/BerxSpatialCard';
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
			<View style={styles.badge}>
				<BerxIcon name="music" size={16} color={colors.white} decorative />
			</View>
			<View style={styles.body}>
				<Pressable
					disabled={!track.owner_username || !onOpenProfile}
					onPress={() => track.owner_username && onOpenProfile?.(track.owner_username)}>
					<BerxText role="label" emphasis="accent">{track.owner_username ?? 'BERX'}</BerxText>
				</Pressable>
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
	badge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
	body: { flex: 1, gap: 2 },
});
