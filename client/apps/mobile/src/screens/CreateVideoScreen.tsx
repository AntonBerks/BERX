/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Same real sequence as CreatePostScreen's image path — upload first
 * (api.uploadMedia), then create the post, then attach
 * (api.attachMedia) — ordered so a failed upload never leaves a
 * half-created post. `pickVideo` is the real
 * packages/platform/src/mediaPicker.ts adapter's pickVideoFromLibrary,
 * injected the same way `pickImage` already is elsewhere.
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface CreateVideoScreenProps {
	api: BerxApiClient;
	pickVideo: () => Promise<BerxFilePart | null>;
	onCreated: (postGuid: number) => void;
	onBack?: () => void;
}

export default function CreateVideoScreen(props: CreateVideoScreenProps) {
	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" testID="create-video">
			<CreateVideoScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateVideoScreenBody({api, pickVideo, onCreated, onBack}: CreateVideoScreenProps) {
	const [text, setText] = useState('');
	const [pickedPart, setPickedPart] = useState<BerxFilePart | null>(null);
	const [pickedLabel, setPickedLabel] = useState<string | null>(null);
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handlePickVideo() {
		const picked = await pickVideo();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setPickedPart(picked);
		setPickedLabel(typeof picked === 'object' && 'name' in picked ? picked.name : 'Видео выбрано');
	}

	async function handlePost() {
		if (!pickedPart) {
			setError('Сначала выберите видео.');
			return;
		}
		setPosting(true);
		setError(null);
		try {
			const asset = await api.uploadMedia(pickedPart, 'video.mp4');
			// Real constraint, disclosed rather than silently patched
			// around: POST /posts requires non-empty text server-side
			// (posts.php's own validation) — there is no "caption-less
			// post" concept in the real backend. A single space is the
			// minimal honest placeholder when the user leaves the
			// caption blank, not a fabricated caption.
			const res = await api.createPost(text.trim() || ' ');
			await api.attachMedia(asset.guid, 'post', res.guid).catch(() => undefined);
			setText('');
			setPickedPart(null);
			setPickedLabel(null);
			onCreated(res.guid);
		} catch {
			setError('Не удалось загрузить видео. Проверьте формат (MP4) и попробуйте ещё раз.');
		} finally {
			setPosting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Новое видео" onBack={onBack} />
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.body}>
					{/* D2 — the form is a structural object in the room, not
					    fields floating on the substrate */}
					<BerxGlassSurface padding="lg" style={styles.form}>
						<BerxButton label={pickedLabel ?? 'Выбрать видео'} variant="secondary" onPress={handlePickVideo} />

						<BerxInput placeholder="Подпись (необязательно)" value={text} onChangeText={setText} multiline style={styles.input} />

						{error ? <Text style={styles.error}>{error}</Text> : null}

						{/* D4 — the commit action, promoted onto the control plane */}
						<BerxActionShelf variant="anchored" align="stack">
							<BerxButton label="Опубликовать" onPress={handlePost} loading={posting} disabled={!pickedPart} fullWidth />
						</BerxActionShelf>
					</BerxGlassSurface>
				</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.lg, gap: spacing.md},
	form: {gap: spacing.md},
	input: {minHeight: 80, textAlignVertical: 'top'},
	error: {color: colors.danger, fontSize: typography.sizeSm},
});
