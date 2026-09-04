/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Media auth: stories.php's /media route is bearer-token gated, not a
 * public URL — RN's <Image> supports {uri, headers} for exactly this
 * case (real, stable RN API, not invented), using
 * api.getAuthHeaders() rather than duplicating token-reading logic.
 *
 * VIDEO STORIES — REAL, HONEST LIMITATION: `current.mime_type` (real,
 * added to the feed response this session) decides how a story
 * renders. Video does NOT reuse BerxVideoPlayer's Linking.openURL()
 * fallback (the one used for the Video/Post domain) — that only
 * works because a POST's video URL is deliberately PUBLIC-by-URL
 * (see media.php's own header). Stories' media route is deliberately
 * bearer-token gated instead (more private, matching an ephemeral
 * story), so handing its URL to the OS's external handler would 401,
 * not play — the external app has no way to attach the bearer token.
 * Shipping that would look like it works and silently fail. Instead
 * this shows a real, honest "not viewable inline yet" state — true
 * playback needs an embedded player that can attach the same
 * {uri, headers} pattern <Image> already uses (react-native-video
 * supports this), which isn't installable in this sandbox.
 */
import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Image, Pressable, Animated, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxStoryFeedGroup} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface StoryViewerScreenProps {
	api: BerxApiClient;
	group: BerxStoryFeedGroup;
	myGuid: number;
	onClose: () => void;
}

const STORY_DURATION_MS = 5000;

/**
 * The story is the room.
 *
 * An immersive scene puts the media at D1 as well as at D3: the same
 * frame, dimmed and lit, fills the space around a story whose aspect
 * ratio does not match the screen — which is every portrait story on
 * a tall phone and every landscape one on any phone. Before this the
 * gap was flat black. The media now renders `contain` rather than
 * `cover`, so nothing is cropped away and the room carries the rest.
 *
 * `index` and the auth headers live out here because the atmosphere
 * has to follow the story being viewed, not the first one in the
 * group.
 */
export default function StoryViewerScreen(props: StoryViewerScreenProps) {
	const [index, setIndex] = useState(0);
	const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

	useEffect(() => {
		props.api.getAuthHeaders().then(setAuthHeaders);
	}, [props.api]);

	const current = props.group.stories[index];
	/* Video stories cannot be sampled for a still here (see the header
	   note on the bearer-gated media route), so they get the lit room
	   without media rather than a frame BERX does not have. */
	const atmosphere =
		current && current.mime_type !== 'video/mp4'
			? {uri: props.api.storyMediaUrl(current.id), headers: authHeaders}
			: undefined;

	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" atmosphere={atmosphere} testID="story-viewer">
			<StoryViewerScreenBody {...props} index={index} setIndex={setIndex} authHeaders={authHeaders} />
		</BerxFamilyScene>
	);
}

function StoryViewerScreenBody({
	api,
	group,
	myGuid,
	onClose,
	index,
	setIndex,
	authHeaders,
}: StoryViewerScreenProps & {
	index: number;
	setIndex: React.Dispatch<React.SetStateAction<number>>;
	authHeaders: Record<string, string>;
}) {
	const [paused, setPaused] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const progress = useRef(new Animated.Value(0)).current;
	const isOwn = group.owner_guid === myGuid;

	const current = group.stories[index];

	useEffect(() => {
		if (!current) {
			onClose();
			return;
		}
		api.markStoryViewed(current.id).catch(() => undefined); // best-effort — a failed view-mark shouldn't block viewing
		progress.setValue(0);

		if (paused) return;

		const anim = Animated.timing(progress, {
			toValue: 1,
			duration: STORY_DURATION_MS,
			useNativeDriver: false,
		});
		anim.start(({finished}: {finished: boolean}) => {
			if (finished) advance();
		});
		return () => anim.stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index, paused]);

	function advance() {
		if (index < group.stories.length - 1) {
			setIndex((i) => i + 1);
		} else {
			onClose();
		}
	}

	function goBack() {
		if (index > 0) {
			setIndex((i) => i - 1);
		} else {
			onClose();
		}
	}

	async function handleDelete() {
		if (!current || deleting) return;
		setDeleting(true);
		try {
			await api.deleteStory(current.id);
			if (group.stories.length <= 1) {
				onClose();
			} else {
				group.stories.splice(index, 1); // local mutation of the passed-in group is intentional here — this viewer instance is the only consumer of this specific object for its lifetime
				setIndex((i) => Math.min(i, group.stories.length - 1));
			}
		} catch {
			setDeleting(false);
		}
	}

	if (!current) return null;

	return (
		<View style={styles.screen}>
			<View style={styles.progressRow}>
				{group.stories.map((s, i) => (
					<View key={s.id} style={styles.progressTrack}>
						<Animated.View
							style={[
								styles.progressFill,
								{
									width:
										i < index
											? '100%'
											: i === index
											? progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']})
											: '0%',
								},
							]}
						/>
					</View>
				))}
			</View>

			{current.mime_type === 'video/mp4' ? (
				<View style={styles.videoFallback}>
					<Text style={styles.videoFallbackText}>▶ Видео-история</Text>
					<Text style={styles.videoFallbackHint}>Просмотр видео-историй в приложении пока не поддерживается</Text>
				</View>
			) : (
				<Image
					source={{uri: api.storyMediaUrl(current.id), headers: authHeaders}}
					style={styles.media}
					/* contain, not cover: the scene's own atmosphere fills
					   the rest of the frame, so nothing has to be cropped */
					resizeMode="contain"
				/>
			)}

			<View style={styles.tapZones}>
				<Pressable
					style={styles.tapLeft}
					onPress={goBack}
					onLongPress={() => setPaused(true)}
					onPressOut={() => setPaused(false)}
				/>
				<Pressable
					style={styles.tapRight}
					onPress={advance}
					onLongPress={() => setPaused(true)}
					onPressOut={() => setPaused(false)}
				/>
			</View>

			<View style={styles.footer}>
				{current.caption ? <Text style={styles.caption}>{current.caption}</Text> : null}
				<View style={styles.footerRow}>
					<Text style={styles.owner}>{group.owner_username ?? `#${group.owner_guid}`}</Text>
					{isOwn ? (
						<Pressable onPress={handleDelete} disabled={deleting}>
							<Text style={styles.deleteText}>{deleting ? '...' : 'Удалить'}</Text>
						</Pressable>
					) : null}
				</View>
			</View>

			<Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
				<Text style={styles.closeText}>✕</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	/* transparent: the scene paints the room, and an opaque black here
	   would hide the atmosphere the story itself provides */
	screen: {flex: 1},
	progressRow: {flexDirection: 'row', gap: spacing.xs, padding: spacing.md, paddingTop: spacing.xl},
	progressTrack: {flex: 1, height: 3, backgroundColor: colors.glass2, borderRadius: 2, overflow: 'hidden'},
	progressFill: {height: '100%', backgroundColor: colors.accent},
	media: {flex: 1, width: '100%'},
	videoFallback: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: spacing.sm},
	videoFallbackText: {color: colors.white, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	videoFallbackHint: {color: colors.textFaint, fontSize: typography.sizeSm, textAlign: 'center', paddingHorizontal: spacing.xl},
	tapZones: {...StyleSheet.absoluteFillObject, flexDirection: 'row'},
	tapLeft: {flex: 1},
	tapRight: {flex: 1},
	footer: {position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg},
	footerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	caption: {color: colors.text, fontSize: typography.sizeBase, marginBottom: spacing.sm},
	owner: {color: colors.textDim, fontSize: typography.sizeSm},
	deleteText: {color: colors.danger, fontSize: typography.sizeSm},
	closeButton: {position: 'absolute', top: spacing.xl, right: spacing.md, padding: spacing.sm},
	closeText: {color: colors.text, fontSize: typography.sizeLg},
});
