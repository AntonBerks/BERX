/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 * Real, generic track-post card. Works with any real BerxTrackPost
 * (components/OssnApi/v1/tracks.php). Real like/comment counts,
 * never estimated. No album art / waveform — no real data source
 * for either exists (no audio-analysis pipeline), so neither is
 * faked; a plain note-glyph badge stands in honestly.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';
import type { BerxTrackPost } from '@berx/api/types';

export interface BerxTrackCardProps {
	track: BerxTrackPost;
	onPress: (track: BerxTrackPost) => void;
	onOpenProfile?: (username: string) => void;
}

export function BerxTrackCard({ track, onPress, onOpenProfile }: BerxTrackCardProps) {
	return (
		<Pressable style={styles.row} onPress={() => onPress(track)}>
			<View style={styles.badge}>
				<Text style={styles.badgeGlyph}>♪</Text>
			</View>
			<View style={styles.body}>
				<Pressable
					disabled={!track.owner_username || !onOpenProfile}
					onPress={() => track.owner_username && onOpenProfile?.(track.owner_username)}>
					<Text style={styles.owner}>{track.owner_username ?? 'BERX'}</Text>
				</Pressable>
				{track.text ? <Text style={styles.text} numberOfLines={1}>{track.text}</Text> : null}
				<Text style={styles.meta}>{track.like_count} нравится · {track.comment_count} комментариев</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
	badge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
	badgeGlyph: { color: colors.accent, fontSize: typography.sizeLg },
	body: { flex: 1, gap: 2 },
	owner: { color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium },
	text: { color: colors.text, fontSize: typography.sizeSm },
	meta: { color: colors.textFaint, fontSize: typography.sizeXs },
});
