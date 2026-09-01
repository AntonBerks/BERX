/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Same real sequence as CreatePostScreen/CreateVideoScreen — upload
 * first (api.uploadMedia), then create the post, then attach
 * (api.attachMedia). `pickAudio` is the real
 * packages/platform/src/audioPicker.ts adapter.
 */
import {useState, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	pickAudio: () => Promise<BerxFilePart | null>;
	onCreated: (postGuid: number) => void;
	onBack?: () => void;
}

export default function CreateTrackScreen({api, pickAudio, onCreated, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [text, setText] = useState('');
	const [pickedPart, setPickedPart] = useState<BerxFilePart | null>(null);
	const [pickedLabel, setPickedLabel] = useState<string | null>(null);
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handlePickAudio() {
		const picked = await pickAudio();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setPickedPart(picked);
		setPickedLabel(typeof picked === 'object' && 'name' in picked ? picked.name : 'Трек выбран');
	}

	async function handlePost() {
		if (!pickedPart) {
			setError('Сначала выберите аудиофайл.');
			return;
		}
		setPosting(true);
		setError(null);
		try {
			const asset = await api.uploadMedia(pickedPart, 'track.mp3');
			// Same real constraint as CreateVideoScreen — POST /posts
			// requires non-empty text server-side; a single space is the
			// honest minimal placeholder for a caption-less track.
			const res = await api.createPost(text.trim() || ' ');
			await api.attachMedia(asset.guid, 'post', res.guid).catch(() => undefined);
			setText('');
			setPickedPart(null);
			setPickedLabel(null);
			onCreated(res.guid);
		} catch {
			setError('Не удалось загрузить трек. Проверьте формат (MP3) и попробуйте ещё раз.');
		} finally {
			setPosting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Новый трек" onBack={onBack} />
			<View style={styles.body}>
				<BerxButton label={pickedLabel ?? 'Выбрать аудиофайл'} variant="secondary" onPress={handlePickAudio} />

				<BerxInput placeholder="Подпись (необязательно)" value={text} onChangeText={setText} multiline style={styles.input} />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Опубликовать" onPress={handlePost} loading={posting} disabled={!pickedPart} fullWidth />
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.lg, gap: spacing.md},
	input: {minHeight: 80, textAlignVertical: 'top'},
	error: {color: colors.danger, fontSize: typography.sizeSm},
});
