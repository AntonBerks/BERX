/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Real, generic video-post card — feed row shape. Works with any
 * real BerxVideoPost (components/OssnApi/v1/videos.php). Poster
 * frame shows a real static image if the server ever provides one
 * (it doesn't yet — no thumbnail-extraction pipeline exists, see
 * BerxVideoPlayer's header), so this currently renders a dark
 * placeholder with a real play glyph rather than a fabricated
 * thumbnail. Real like/comment counts, never estimated.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';
import type { BerxVideoPost } from '@berx/api/types';

export interface BerxVideoCardProps {
	video: BerxVideoPost;
	onPress: (video: BerxVideoPost) => void;
	onOpenProfile?: (username: string) => void;
}

export function BerxVideoCard({ video, onPress, onOpenProfile }: BerxVideoCardProps) {
	return (
		<Pressable style={styles.card} onPress={() => onPress(video)}>
			<View style={styles.poster}>
				<View style={styles.playBadge}>
					<Text style={styles.playGlyph}>▶</Text>
				</View>
				{video.video.duration_seconds !== null ? (
					<View style={styles.durationBadge}>
						<Text style={styles.durationText}>{formatDuration(video.video.duration_seconds)}</Text>
					</View>
				) : null}
			</View>
			<View style={styles.body}>
				<Pressable
					disabled={!video.owner_username || !onOpenProfile}
					onPress={() => video.owner_username && onOpenProfile?.(video.owner_username)}>
					<Text style={styles.owner}>{video.owner_username ?? 'BERX'}</Text>
				</Pressable>
				{video.text ? <Text style={styles.text} numberOfLines={2}>{video.text}</Text> : null}
				<Text style={styles.meta}>{video.like_count} нравится · {video.comment_count} комментариев</Text>
			</View>
		</Pressable>
	);
}

function formatDuration(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
	card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
	poster: { aspectRatio: 16 / 9, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
	playBadge: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: 'rgba(5,5,5,0.55)', alignItems: 'center', justifyContent: 'center' },
	playGlyph: { color: colors.white, fontSize: typography.sizeLg },
	durationBadge: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(5,5,5,0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
	durationText: { color: colors.white, fontSize: typography.sizeXs },
	body: { padding: spacing.sm, gap: 4 },
	owner: { color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium },
	text: { color: colors.text, fontSize: typography.sizeSm },
	meta: { color: colors.textFaint, fontSize: typography.sizeXs },
});
