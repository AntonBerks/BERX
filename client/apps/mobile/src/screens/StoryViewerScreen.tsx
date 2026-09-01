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
 *
 * MAX BUILD — real "Кто посмотрел" (OssnStories::listViewers()/
 * viewerCount(), zero prior UI caller — markViewed() has always
 * written a real row per (story, viewer) on every real story open).
 * Owner-only, matching every other real platform with this feature.
 */
import {useEffect, useRef, useState, useMemo} from 'react';
import {View, Text, Image, Pressable, Animated, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxStoryFeedGroup, BerxStoryViewer} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	group: BerxStoryFeedGroup;
	myGuid: number;
	onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export default function StoryViewerScreen({api, group, myGuid, onClose}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
	const [deleting, setDeleting] = useState(false);
	const [highlighting, setHighlighting] = useState(false);
	const [highlightOverrides, setHighlightOverrides] = useState<Record<number, boolean>>({});
	const [showViewers, setShowViewers] = useState(false);
	const [viewersLoading, setViewersLoading] = useState(false);
	const [viewers, setViewers] = useState<BerxStoryViewer[]>([]);
	/** BERX WORLD — real "reply to a story". Always lands in a real DM to the story's owner, same product convention every real platform with stories uses — see conversations.php's own ossn_api_message_shared_story(). */
	const [replyText, setReplyText] = useState('');
	const [sendingReply, setSendingReply] = useState(false);
	const [replyStatus, setReplyStatus] = useState<string | null>(null);
	const progress = useRef(new Animated.Value(0)).current;
	const isOwn = group.owner_guid === myGuid;

	useEffect(() => {
		api.getAuthHeaders().then(setAuthHeaders);
	}, [api]);

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

	// Real story-scoped state — a stale viewers list from the previous
	// story must never bleed into the next one when the user advances.
	useEffect(() => {
		setShowViewers(false);
		setViewers([]);
		setReplyText('');
		setReplyStatus(null);
	}, [index]);

	async function toggleViewers() {
		if (showViewers) {
			setShowViewers(false);
			return;
		}
		setShowViewers(true);
		if (!current) return;
		setViewersLoading(true);
		try {
			const res = await api.storyViewers(current.id);
			setViewers(res.viewers);
		} catch {
			setViewers([]);
		} finally {
			setViewersLoading(false);
		}
	}

	async function toggleHighlight() {
		if (!current || highlighting) return;
		const next = !(highlightOverrides[current.id] ?? current.is_highlighted ?? false);
		setHighlighting(true);
		try {
			await api.setStoryHighlighted(current.id, next);
			setHighlightOverrides((prev: Record<number, boolean>) => ({...prev, [current.id]: next}));
		} catch {
			// real server rejection — highlight state stays as-is, nothing optimistic
		} finally {
			setHighlighting(false);
		}
	}

	async function handleSendReply() {
		if (!current || !replyText.trim()) return;
		setSendingReply(true);
		setReplyStatus(null);
		try {
			await api.sendMessage(group.owner_guid, replyText.trim(), undefined, undefined, undefined, current.id);
			setReplyText('');
			setReplyStatus('Отправлено');
		} catch {
			setReplyStatus('Не удалось отправить');
		} finally {
			setSendingReply(false);
		}
	}

	if (!current) return null;

	const isHighlighted = highlightOverrides[current.id] ?? current.is_highlighted ?? false;

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
					resizeMode="cover"
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
						<View style={styles.ownActions}>
							<Pressable onPress={toggleViewers} hitSlop={8}>
								<Text style={styles.viewersText}>👁 {current.viewer_count ?? 0}</Text>
							</Pressable>
							<Pressable onPress={toggleHighlight} disabled={highlighting} hitSlop={8}>
								<Text style={[styles.highlightText, isHighlighted && styles.highlightTextActive]}>
									{highlighting ? '...' : isHighlighted ? '★ В актуальном' : '☆ В актуальное'}
								</Text>
							</Pressable>
							<Pressable onPress={handleDelete} disabled={deleting} hitSlop={8}>
								<Text style={styles.deleteText}>{deleting ? '...' : 'Удалить'}</Text>
							</Pressable>
						</View>
					) : null}
				</View>

				{isOwn && showViewers ? (
					<View style={styles.viewersPanel}>
						<Text style={styles.viewersPanelTitle}>Просмотрели</Text>
						{viewersLoading ? (
							<Text style={styles.viewersHint}>Загрузка...</Text>
						) : viewers.length === 0 ? (
							<Text style={styles.viewersHint}>Пока никто не посмотрел</Text>
						) : (
							<ScrollView>
								{viewers.map((v: BerxStoryViewer) => (
									<View key={v.guid} style={styles.viewerRow}>
										<Text style={styles.viewerName}>{v.username ?? `#${v.guid}`}</Text>
										<Text style={styles.viewerTime}>{relativeTimeLabel(v.time_viewed)}</Text>
									</View>
								))}
							</ScrollView>
						)}
					</View>
				) : null}

				{!isOwn ? (
					<View style={styles.replyRow}>
						<BerxInput
							placeholder="Ответить на историю..."
							value={replyText}
							onChangeText={setReplyText}
							style={styles.replyInput}
							placeholderTextColor={colors.textFaint}
						/>
						<Pressable onPress={handleSendReply} disabled={sendingReply || !replyText.trim()} hitSlop={8}>
							<Text style={styles.replySend}>{sendingReply ? '...' : 'Отправить'}</Text>
						</Pressable>
					</View>
				) : null}
				{replyStatus ? <Text style={styles.replyStatus}>{replyStatus}</Text> : null}
			</View>

			<Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
				<Text style={styles.closeText}>✕</Text>
			</Pressable>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	progressRow: {flexDirection: 'row', gap: spacing.xs, padding: spacing.md, paddingTop: spacing.xl},
	progressTrack: {flex: 1, height: 3, backgroundColor: colors.glass2, borderRadius: 2, overflow: 'hidden'},
	progressFill: {height: '100%', backgroundColor: colors.accent},
	media: {flex: 1, width: '100%'},
	videoFallback: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.graphite},
	videoFallbackText: {color: colors.white, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	videoFallbackHint: {color: colors.textFaint, fontSize: typography.sizeSm, textAlign: 'center', paddingHorizontal: spacing.xl},
	tapZones: {...StyleSheet.absoluteFillObject, flexDirection: 'row'},
	tapLeft: {flex: 1},
	tapRight: {flex: 1},
	footer: {position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg},
	footerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	caption: {color: colors.text, fontSize: typography.sizeBase, marginBottom: spacing.sm},
	owner: {color: colors.textDim, fontSize: typography.sizeSm},
	ownActions: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	highlightText: {color: colors.textDim, fontSize: typography.sizeSm},
	highlightTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	deleteText: {color: colors.danger, fontSize: typography.sizeSm},
	viewersText: {color: colors.textDim, fontSize: typography.sizeSm},
	viewersPanel: {marginTop: spacing.sm, maxHeight: 160, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: spacing.sm, gap: 4},
	viewersPanelTitle: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', marginBottom: 4},
	viewersHint: {color: colors.textFaint, fontSize: typography.sizeSm},
	viewerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4},
	viewerName: {color: colors.text, fontSize: typography.sizeSm},
	viewerTime: {color: colors.textFaint, fontSize: typography.sizeXs},
	replyRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm},
	replyInput: {flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: colors.white, borderColor: 'rgba(255,255,255,0.3)'},
	replySend: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	replyStatus: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: 4},
	closeButton: {position: 'absolute', top: spacing.xl, right: spacing.md, padding: spacing.sm},
	closeText: {color: colors.text, fontSize: typography.sizeLg},
});
