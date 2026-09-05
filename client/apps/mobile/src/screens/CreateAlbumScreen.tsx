/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createAlbum() (components/OssnApi/v1/albums.php).
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface CreateAlbumScreenProps {
	api: BerxApiClient;
	onCreated: (guid: number) => void;
	onBack?: () => void;
}

export default function CreateAlbumScreen(props: CreateAlbumScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="create-album">
			<CreateAlbumScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateAlbumScreenBody({api, onCreated, onBack}: CreateAlbumScreenProps) {
	const [title, setTitle] = useState('');
	const [access, setAccess] = useState<'public' | 'private'>('public');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (!title.trim()) {
			setError('Введите название альбома.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createAlbum(title.trim(), access);
			onCreated(res.guid);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать альбом');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Создать альбом" onBack={onBack} />
			<View style={styles.body}>
				{/* D2 — the form is a structural object in the room, not
				    fields floating on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название альбома" value={title} onChangeText={setTitle} />

					<BerxText role="micro" emphasis="tertiary">Доступ</BerxText>
					{/* the archive's own segmented control, not a second one
					    hand-rolled per screen */}
					<BerxSegmentTabs
						options={[
							{key: 'public', label: 'Открытый'},
							{key: 'private', label: 'Приватный'},
						]}
						value={access}
						onChange={setAccess}
					/>

					{error ? <Text style={styles.error}>{error}</Text> : null}

					{/* D4 — the commit action, promoted onto the control plane */}
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
					</BerxActionShelf>
				</BerxGlassSurface>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	form: {gap: spacing.md},
	row: {flexDirection: 'row', gap: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
