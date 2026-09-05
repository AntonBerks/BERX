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
import {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxCircle, BerxPostVisibility} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxChoiceChips} from '../../../../packages/design-system/src/spatial/BerxChoiceChips';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface CreatePostScreenProps {
	api: BerxApiClient;
	pickImage: () => Promise<BerxFilePart | null>;
	onCreated: (postGuid: number) => void;
}

export default function CreatePostScreen(props: CreatePostScreenProps) {
	return (
		<BerxFamilyScene family="HOME" testID="create-post">
			<CreatePostScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreatePostScreenBody({api, pickImage, onCreated}: CreatePostScreenProps) {
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
			<BerxText role="heading" style={styles.title}>Новый пост</BerxText>
			{/* the content scrolls: a post with several attachments and the
			    audience control below them used to run off the bottom with
			    nothing to scroll. Scrolling is also what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
			{/* D2 — the composer is one object: what you write, what you
			    attach and who sees it belong together */}
			<BerxGlassSurface padding="lg" style={styles.form}>
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
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Убрать фото из поста"
						style={styles.previewRemove}
						onPress={() => { setPickedPart(null); setPreviewUri(null); }}>
						<BerxIcon name="close" size={12} decorative />
					</Pressable>
				</View>
			) : null}

			<BerxButton label={pickedPart ? 'Заменить фото' : 'Добавить фото'} variant="secondary" onPress={handlePickImage} />

			<BerxText role="micro" emphasis="tertiary">Кто увидит пост</BerxText>
			{/* the real set: two server visibilities plus every circle the
			    person actually owns — a variable length, so chips, not a
			    fixed segmented control */}
			<BerxChoiceChips
				accessibilityLabel="Кто увидит пост"
				value={visibility}
				onChange={setVisibility}
				options={[
					{key: 'public' as BerxPostVisibility, label: 'Все'},
					{key: 'friends' as BerxPostVisibility, label: 'Друзья'},
					...myCircles.map((c) => ({key: `circle:${c.id}` as BerxPostVisibility, label: c.name})),
				]}
			/>

			{error ? <Text style={styles.error}>{error}</Text> : null}
			{/* D4 — publishing is the commit action, on the control plane */}
			<BerxActionShelf variant="anchored" align="stack">
				<BerxButton label="Опубликовать" onPress={handlePost} loading={posting} disabled={!text.trim() && !pickedPart} fullWidth />
			</BerxActionShelf>
			</BerxGlassSurface>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	form: {gap: spacing.md},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1, padding: spacing.lg, gap: spacing.md},
	title: {marginBottom: spacing.sm},
	input: {minHeight: 120, textAlignVertical: 'top'},
	previewWrap: {alignSelf: 'flex-start'},
	preview: {width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.graphite},
	previewRemove: {position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center'},
	previewRemoveText: {color: colors.textDim, fontSize: typography.sizeXs},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	visRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
});
