/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createCollection() (components/OssnApi/v1/collections.php).
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollectionVisibility} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface CreateCollectionScreenProps {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
}

export default function CreateCollectionScreen(props: CreateCollectionScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" atmosphereKind="location" testID="create-collection">
			<CreateCollectionScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateCollectionScreenBody({api, onCreated, onBack}: CreateCollectionScreenProps) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [visibility, setVisibility] = useState<BerxCollectionVisibility>('private');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (!title.trim()) {
			setError('Введите название подборки.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createCollection(title.trim(), description.trim() || undefined, visibility);
			onCreated(res.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать подборку');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Создать подборку" onBack={onBack} />
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.body}>
					{/* D2 — the form is a structural object in the room, not
					    fields floating on the substrate */}
					<BerxGlassSurface padding="lg" style={styles.form}>
						<BerxInput placeholder="Название подборки" value={title} onChangeText={setTitle} />
						<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />

						<BerxText role="micro" emphasis="tertiary">Доступ</BerxText>
						{/* the archive's own segmented control */}
						<BerxSegmentTabs
							options={[
								{key: 'private', label: 'Приватная'},
								{key: 'public', label: 'Открытая'},
							]}
							value={visibility}
							onChange={setVisibility}
						/>

						{error ? <Text style={styles.error}>{error}</Text> : null}

						{/* D4 — the commit action, promoted onto the control plane */}
						<BerxActionShelf variant="anchored" align="stack">
							<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
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
	body: {padding: spacing.md, gap: spacing.md},
	form: {gap: spacing.md},
	row: {flexDirection: 'row', gap: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
