/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * REAL, DISCLOSED GAP: React Native core has NO built-in image/camera
 * picker — every real app needs expo-image-picker or
 * react-native-image-picker, both external npm packages this sandbox
 * cannot install (npm registry confirmed blocked). `pickImage`/
 * `pickVideo` are injected props — this screen owns everything AFTER
 * a file is selected (preview, caption, upload via the real
 * createStory() API, error handling). AppShell now wires the real
 * packages/platform/src/mediaPicker.ts adapter here (not a stub) —
 * see that file's own header for why it's still unexecuted in this
 * sandbox specifically, not unbuilt.
 *
 * VIDEO STORIES: the real backend (components/OssnApi/v1/stories.php)
 * now accepts video/mp4 alongside images — extended this session, not
 * pretended. A picked video has no local-preview mechanism (no video
 * playback library is installable here either), so this screen shows
 * a real filename label instead of a fake thumbnail — honest about
 * what it can and can't render before upload.
 */
import React, {useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface CreateStoryScreenProps {
	api: BerxApiClient;
	pickImage: () => Promise<BerxFilePart | null>;
	pickVideo: () => Promise<BerxFilePart | null>;
	eventGuid?: number;
	onCreated: () => void;
	onBack: () => void;
}

export default function CreateStoryScreen(props: CreateStoryScreenProps) {
	return (
		<BerxFamilyScene family="HOME" atmosphereKind="immersive" testID="create-story">
			<CreateStoryScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateStoryScreenBody({api, pickImage, pickVideo, eventGuid, onCreated, onBack}: CreateStoryScreenProps) {
	const [file, setFile] = useState<BerxFilePart | null>(null);
	const [isVideo, setIsVideo] = useState(false);
	const [previewUri, setPreviewUri] = useState<string | null>(null);
	const [pickedLabel, setPickedLabel] = useState<string | null>(null);
	const [caption, setCaption] = useState('');
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handlePick(video: boolean) {
		setError(null);
		const picked = video ? await pickVideo() : await pickImage();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setFile(picked);
		setIsVideo(video);
		if (video) {
			setPreviewUri(null);
			setPickedLabel(typeof picked === 'object' && 'name' in picked ? picked.name : 'Видео выбрано');
		} else {
			setPreviewUri(typeof picked === 'object' && 'uri' in picked ? picked.uri : null);
			setPickedLabel(null);
		}
	}

	async function handleUpload() {
		if (!file) return;
		setUploading(true);
		setError(null);
		try {
			await api.createStory(file, caption.trim() || undefined, isVideo ? 'story.mp4' : 'story.jpg', eventGuid);
			onCreated();
		} catch {
			setError(`Не удалось опубликовать историю. Проверьте формат файла (${isVideo ? 'MP4' : 'JPEG/PNG/WebP'}) и размер (до 8 МБ).`);
		} finally {
			setUploading(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={eventGuid ? "История события" : "Новая история"} />
			<View style={styles.content}>
				{previewUri ? (
					<Image source={{uri: previewUri}} style={styles.preview} resizeMode="cover" />
				) : pickedLabel ? (
					<View style={styles.placeholder}>
						<Text style={styles.placeholderText}>▶ {pickedLabel}</Text>
					</View>
				) : (
					<View style={styles.placeholder}>
						<Text style={styles.placeholderText}>Ничего не выбрано</Text>
					</View>
				)}

				<View style={styles.pickRow}>
					<BerxButton label="Фото" variant={!isVideo && file ? 'primary' : 'secondary'} onPress={() => handlePick(false)} />
					<BerxButton label="Видео" variant={isVideo && file ? 'primary' : 'secondary'} onPress={() => handlePick(true)} />
				</View>

				<BerxInput placeholder="Подпись (необязательно)" value={caption} onChangeText={setCaption} />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Опубликовать" onPress={handleUpload} loading={uploading} disabled={!file} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md},
	preview: {width: '100%', height: 320, borderRadius: radius.md, backgroundColor: colors.graphite},
	placeholder: {
		width: '100%',
		height: 320,
		borderRadius: radius.md,
		backgroundColor: colors.glass2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	placeholderText: {color: colors.textFaint, fontSize: typography.sizeBase},
	pickRow: {flexDirection: 'row', gap: spacing.sm},
	error: {color: colors.danger, fontSize: typography.sizeSm},
});
