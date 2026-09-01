/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real media attachment via the generic Media Foundation
 * (api.uploadMedia/attachMedia — components/OssnApi/v1/media.php):
 * upload happens first (so a failed upload never leaves a
 * half-created post), then the post is created, then the real
 * uploaded asset is attached to the real post guid. `pickImage` is
 * the same injected-prop pattern already used by CreateStoryScreen/
 * AlbumDetailScreen — no image-picker library is installable in this
 * sandbox, so device picking is a separate piece that plugs into
 * this prop; this screen owns everything after a file is selected.
 *
 * MAX BUILD — real GIF attach (OssnGiphy), same GifPickerModal +
 * download-to-Blob approach as ConversationScreen. The preview shown
 * before upload is Giphy's own real thumb_url (not the downloaded
 * Blob — this screen doesn't assume URL.createObjectURL exists,
 * matching the existing preview-uri comment below), but the actual
 * uploaded bytes are the real downloaded GIF, going through the exact
 * same uploadMedia()/attachMedia() path a picked photo already uses.
 */
import {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxCircle, BerxPostVisibility, BerxGifResult, BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {GifPickerModal} from '../../../../packages/design-system/src/components/GifPickerModal';
import {BerxMentionInput} from '../../../../packages/design-system/src/components/BerxMentionInput';

interface Props {
	api: BerxApiClient;
	pickImage: () => Promise<BerxFilePart | null>;
	onCreated: (postGuid: number) => void;
	/** Real prefill from a saved draft (Max Build) — see MyDraftsScreen.tsx. Only text/visibility restore; a picked-but-unattached photo was never part of a draft's real saved state. */
	draft?: {id: number; text: string; visibility: BerxPostVisibility};
	onOpenDrafts?: () => void;
	/** MAX BUILD — real Repost target (see posts.php's own comment on berx_repost_of). */
	repostTarget?: {guid: number; text: string; owner_username: string | null};
}

export default function CreatePostScreen({api, pickImage, onCreated, draft, onOpenDrafts, repostTarget}: Props) {
	const [text, setText] = useState(draft?.text ?? '');
	const [pickedPart, setPickedPart] = useState<BerxFilePart | null>(null);
	const [previewUri, setPreviewUri] = useState<string | null>(null);
	const [posting, setPosting] = useState(false);
	const [savingDraft, setSavingDraft] = useState(false);
	const [draftStatus, setDraftStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Real, server-checked at every read path (posts.php, feed.php,
	// videos.php, tracks.php, collections.php, OssnCreator::recentPosts())
	// — not client-side hiding. Circle list is the caller's own real
	// circles (api.circles()); a circle:{id} value is only accepted
	// server-side if the caller actually owns that circle.
	const [visibility, setVisibility] = useState<BerxPostVisibility>(draft?.visibility ?? 'public');
	const [myCircles, setMyCircles] = useState<BerxCircle[]>([]);
	const [gifPickerOpen, setGifPickerOpen] = useState(false);
	const [gifDownloading, setGifDownloading] = useState(false);
	const [pickedFilename, setPickedFilename] = useState('post-photo.jpg');
	// BERX WORLD — real @mention autocomplete (BerxMentionInput). Sourced
	// from the caller's own real friend list (api.friends()) because
	// server-side mentions are friends-only too (see
	// ossn_api_extract_mentions() in components/OssnApi/ossn_com.php) —
	// this never suggests someone a mention wouldn't actually notify.
	const [friends, setFriends] = useState<BerxFriend[]>([]);

	useEffect(() => {
		api.circles().then((res) => setMyCircles(res.circles)).catch(() => undefined);
		api.friends().then((res) => setFriends(res.friends)).catch(() => undefined);
	}, [api]);

	async function handlePickImage() {
		const picked = await pickImage();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setPickedPart(picked);
		setPickedFilename('post-photo.jpg');
		// BerxFilePart is either a Blob (web) or {uri, name, type} (native)
		// — only the native shape carries a directly displayable uri for
		// a local preview; a Blob would need URL.createObjectURL, which
		// this cross-platform screen doesn't assume is available.
		if (typeof picked === 'object' && 'uri' in picked) {
			setPreviewUri(picked.uri);
		}
	}

	/** Real download — the picker only ever hands back Giphy's own real gif_url; the preview uses that same real hosted thumb, the upload uses the real downloaded bytes. */
	async function handleSelectGif(gif: BerxGifResult) {
		setGifPickerOpen(false);
		setGifDownloading(true);
		try {
			const res = await fetch(gif.gif_url);
			const blob = await res.blob();
			setPickedPart(blob);
			setPickedFilename(`post-gif-${gif.id}.gif`);
			setPreviewUri(gif.thumb_url);
		} catch {
			setError('Не удалось загрузить GIF. Попробуйте другой вариант.');
		} finally {
			setGifDownloading(false);
		}
	}

	async function handlePost() {
		const trimmed = text.trim();
		if (!trimmed && !pickedPart && !repostTarget) return;
		setPosting(true);
		setError(null);
		try {
			let mediaGuid: number | null = null;
			if (pickedPart) {
				// Real upload first — a failed upload must never leave a
				// half-created post with a dangling reference.
				const asset = await api.uploadMedia(pickedPart, pickedFilename);
				mediaGuid = asset.guid;
			}
			const res = await api.createPost(trimmed, visibility !== 'public' ? visibility : undefined, repostTarget?.guid);
			if (mediaGuid !== null) {
				// Best-effort attach — the post itself already succeeded;
				// a failed attach shouldn't roll back a real, published post.
				await api.attachMedia(mediaGuid, 'post', res.guid).catch(() => undefined);
			}
			setText('');
			setPickedPart(null);
			setPreviewUri(null);
			if (draft) {
				api.deleteDraft(draft.id).catch(() => undefined); // best-effort — the real post is already published either way
			}
			onCreated(res.guid);
		} catch {
			setError('Не удалось опубликовать. Попробуйте ещё раз.');
		} finally {
			setPosting(false);
		}
	}

	/** MAX BUILD — real save-for-later, own row (not AsyncStorage) — see classes/OssnPostDrafts.php's own header. Only text+visibility save; a picked photo is never included. */
	async function handleSaveDraft() {
		if (!text.trim()) return;
		setSavingDraft(true);
		setDraftStatus(null);
		try {
			if (draft) {
				await api.updateDraft(draft.id, text.trim(), visibility);
			} else {
				await api.saveDraft(text.trim(), visibility);
			}
			setDraftStatus('Черновик сохранён');
		} catch {
			setDraftStatus('Не удалось сохранить черновик');
		} finally {
			setSavingDraft(false);
		}
	}

	return (
		<View style={styles.screen}>
			<View style={styles.titleRow}>
				<Text style={styles.title}>{repostTarget ? 'Репост' : 'Новый пост'}</Text>
				{onOpenDrafts ? (
					<Pressable onPress={onOpenDrafts} hitSlop={8}>
						<Text style={styles.draftsLink}>Черновики</Text>
					</Pressable>
				) : null}
			</View>

			{repostTarget ? (
				<View style={styles.repostPreview}>
					<Text style={styles.repostPreviewLabel}>Репост от {repostTarget.owner_username ?? 'BERX'}</Text>
					<Text style={styles.repostPreviewText} numberOfLines={4}>{repostTarget.text}</Text>
				</View>
			) : null}
			<BerxMentionInput
				placeholder="О чём думаете?"
				value={text}
				onChangeText={setText}
				friends={friends}
				multiline
				style={styles.input}
			/>

			{previewUri ? (
				<View style={styles.previewWrap}>
					<Image source={{uri: previewUri}} style={styles.preview} />
					<Pressable style={styles.previewRemove} onPress={() => { setPickedPart(null); setPreviewUri(null); }}>
						<Text style={styles.previewRemoveText}>✕</Text>
					</Pressable>
				</View>
			) : gifDownloading ? (
				<Text style={styles.draftStatus}>Загрузка GIF…</Text>
			) : null}

			<View style={styles.mediaRow}>
				<BerxButton label={pickedPart ? 'Заменить фото' : 'Добавить фото'} variant="secondary" onPress={handlePickImage} />
				<BerxButton label="Добавить GIF" variant="secondary" onPress={() => setGifPickerOpen(true)} />
			</View>

			<GifPickerModal
				visible={gifPickerOpen}
				onClose={() => setGifPickerOpen(false)}
				onSelect={handleSelectGif}
				search={(q) => api.giphySearch(q)}
				trending={() => api.giphyTrending()}
			/>

			<Text style={styles.label}>Кто увидит пост</Text>
			<View style={styles.visRow}>
				<Pressable style={[styles.visChip, visibility === 'public' && styles.visChipActive]} onPress={() => setVisibility('public')}>
					<Text style={[styles.visChipText, visibility === 'public' && styles.visChipTextActive]}>Все</Text>
				</Pressable>
				<Pressable style={[styles.visChip, visibility === 'friends' && styles.visChipActive]} onPress={() => setVisibility('friends')}>
					<Text style={[styles.visChipText, visibility === 'friends' && styles.visChipTextActive]}>Друзья</Text>
				</Pressable>
				{myCircles.map((c) => {
					const key = `circle:${c.id}` as BerxPostVisibility;
					const active = visibility === key;
					return (
						<Pressable key={c.id} style={[styles.visChip, active && styles.visChipActive]} onPress={() => setVisibility(key)}>
							<Text style={[styles.visChipText, active && styles.visChipTextActive]}>{c.name}</Text>
						</Pressable>
					);
				})}
			</View>

			{error ? <Text style={styles.error}>{error}</Text> : null}
			<BerxButton label="Опубликовать" onPress={handlePost} loading={posting} disabled={!text.trim() && !pickedPart && !repostTarget} fullWidth />
			<BerxButton label={draft ? 'Обновить черновик' : 'Сохранить черновик'} variant="secondary" onPress={handleSaveDraft} loading={savingDraft} disabled={!text.trim()} fullWidth />
			{draftStatus ? <Text style={styles.draftStatus}>{draftStatus}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, padding: spacing.lg, gap: spacing.md},
	titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm},
	title: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	draftsLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	draftStatus: {color: colors.textDim, fontSize: typography.sizeSm, textAlign: 'center'},
	repostPreview: {backgroundColor: colors.glass1, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, gap: 4},
	repostPreviewLabel: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	repostPreviewText: {fontSize: typography.sizeSm, color: colors.textDim},
	input: {minHeight: 120, textAlignVertical: 'top'},
	previewWrap: {alignSelf: 'flex-start'},
	preview: {width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.graphite},
	previewRemove: {position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center'},
	previewRemoveText: {color: colors.textDim, fontSize: typography.sizeXs},
	mediaRow: {flexDirection: 'row', gap: spacing.sm},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	label: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	visRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	visChip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.glass1},
	visChipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	visChipText: {fontSize: typography.sizeSm, color: colors.textDim},
	visChipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
});
