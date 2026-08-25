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
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxCircle, BerxPostVisibility} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

interface Props {
	api: BerxApiClient;
	pickImage: () => Promise<BerxFilePart | null>;
	onCreated: (postGuid: number) => void;
}

export default function CreatePostScreen({api, pickImage, onCreated}: Props) {
	const [text, setText] = useState('');
	const [pickedPart, setPickedPart] = useState<BerxFilePart | null>(null);
	const [previewUri, setPreviewUri] = useState<string | null>(null);
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Real, server-checked at every read path (posts.php, feed.php,
	// videos.php, tracks.php, collections.php, OssnCreator::recentPosts())
	// — not client-side hiding. Circle list is the caller's own real
	// circles (api.circles()); a circle:{id} value is only accepted
	// server-side if the caller actually owns that circle.
	const [visibility, setVisibility] = useState<BerxPostVisibility>('public');
	const [myCircles, setMyCircles] = useState<BerxCircle[]>([]);

	useEffect(() => {
		api.circles().then((res) => setMyCircles(res.circles)).catch(() => undefined);
	}, [api]);

	async function handlePickImage() {
		const picked = await pickImage();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setPickedPart(picked);
		// BerxFilePart is either a Blob (web) or {uri, name, type} (native)
		// — only the native shape carries a directly displayable uri for
		// a local preview; a Blob would need URL.createObjectURL, which
		// this cross-platform screen doesn't assume is available.
		if (typeof picked === 'object' && 'uri' in picked) {
			setPreviewUri(picked.uri);
		}
	}

	async function handlePost() {
		const trimmed = text.trim();
		if (!trimmed && !pickedPart) return;
		setPosting(true);
		setError(null);
		try {
			let mediaGuid: number | null = null;
			if (pickedPart) {
				// Real upload first — a failed upload must never leave a
				// half-created post with a dangling reference.
				const asset = await api.uploadMedia(pickedPart, 'post-photo.jpg');
				mediaGuid = asset.guid;
			}
			const res = await api.createPost(trimmed, visibility !== 'public' ? visibility : undefined);
			if (mediaGuid !== null) {
				// Best-effort attach — the post itself already succeeded;
				// a failed attach shouldn't roll back a real, published post.
				await api.attachMedia(mediaGuid, 'post', res.guid).catch(() => undefined);
			}
			setText('');
			setPickedPart(null);
			setPreviewUri(null);
			onCreated(res.guid);
		} catch {
			setError('Не удалось опубликовать. Попробуйте ещё раз.');
		} finally {
			setPosting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<Text style={styles.title}>Новый пост</Text>
			<BerxInput
				placeholder="О чём думаете?"
				value={text}
				onChangeText={setText}
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
			) : null}

			<BerxButton label={pickedPart ? 'Заменить фото' : 'Добавить фото'} variant="secondary" onPress={handlePickImage} />

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
			<BerxButton label="Опубликовать" onPress={handlePost} loading={posting} disabled={!text.trim() && !pickedPart} fullWidth />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, padding: spacing.lg, gap: spacing.md},
	title: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold, marginBottom: spacing.sm},
	input: {minHeight: 120, textAlignVertical: 'top'},
	previewWrap: {alignSelf: 'flex-start'},
	preview: {width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.graphite},
	previewRemove: {position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center'},
	previewRemoveText: {color: colors.textDim, fontSize: typography.sizeXs},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	label: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	visRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	visChip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.glass1},
	visChipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	visChipText: {fontSize: typography.sizeSm, color: colors.textDim},
	visChipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
});
