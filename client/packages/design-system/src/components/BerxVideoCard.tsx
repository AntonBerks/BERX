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
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../tokens';
import { BerxIcon } from '../icons';
import { BerxSpatialCard } from '../spatial/BerxSpatialCard';
import { BerxIdentity } from '../spatial/BerxIdentity';
import { BerxMediaWell } from '../spatial/BerxMediaWell';
import type { BerxVideoPost } from '@berx/api/types';
import {BerxText} from '../spatial/BerxText';
import { berxCount, berxPlural } from '@berx/domain';

export interface BerxVideoCardProps {
	video: BerxVideoPost;
	onPress: (video: BerxVideoPost) => void;
	onOpenProfile?: (username: string) => void;
}

export function BerxVideoCard({ video, onPress, onOpenProfile }: BerxVideoCardProps) {
	return (
		/* D3 — the video sits on the content plane as an object */
		<BerxSpatialCard
			depth="D3"
			padding={0}
			radius={radius.md}
			onPress={() => onPress(video)}
			accessibilityLabel={`Видео ${video.owner_username ?? 'BERX'}${video.text ? `: ${video.text}` : ''}`}
			style={styles.card}>
			{/* the poster frame BERX does not have: a recess in the card
			    lit by the room, not a black rectangle */}
			<BerxMediaWell radius={0} style={styles.poster}>
				<View style={styles.playBadge}>
					<BerxIcon name="play" size={18} color={colors.white} decorative />
				</View>
				{video.video.duration_seconds !== null ? (
					<View style={styles.durationBadge}>
						<BerxText role="meta">{formatDuration(video.video.duration_seconds)}</BerxText>
					</View>
				) : null}
			</BerxMediaWell>
			<View style={styles.body}>
				{/* the author, as a person. videos.php returns owner_icon on
				    every row and the card drew only the name — so whoever
				    made this read as a text label rather than as someone
				    you could recognise. BerxIdentity is one control, so a
				    screen reader gets one action rather than a tappable
				    picture beside untappable words. */}
				<BerxIdentity
					userGuid={video.owner_guid}
					name={video.owner_username ?? 'BERX'}
					avatarUrl={video.owner_icon ?? undefined}
					size={28}
					onPress={video.owner_username && onOpenProfile ? () => onOpenProfile(video.owner_username as string) : undefined}
				/>
				{video.text ? <BerxText role="meta" numberOfLines={2}>{video.text}</BerxText> : null}
				{/* real counts, with the word that agrees with them */}
				<BerxText role="meta" emphasis="tertiary">
					{`${video.like_count} ${berxPlural(video.like_count, 'отметка', 'отметки', 'отметок')} · ${berxCount(video.comment_count, 'комментарий', 'комментария', 'комментариев')}`}
				</BerxText>
			</View>
		</BerxSpatialCard>
	);
}

function formatDuration(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
	card: { overflow: 'hidden', marginBottom: spacing.sm },
	poster: { aspectRatio: 16 / 9 },
	playBadge: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: 'rgba(5,5,5,0.55)', alignItems: 'center', justifyContent: 'center' },
	durationBadge: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(5,5,5,0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
	body: { padding: spacing.sm, gap: 4 },
});
