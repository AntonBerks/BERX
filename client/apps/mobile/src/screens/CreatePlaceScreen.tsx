/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createPlace() (components/OssnApi/v1/places.php,
 * POST /places). Category select uses the real server whitelist.
 */
import {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxChoiceChips} from '../../../../packages/design-system/src/spatial/BerxChoiceChips';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface CreatePlaceScreenProps {
	api: BerxApiClient;
	onCreated: (guid: number) => void;
	onBack?: () => void;
}

export default function CreatePlaceScreen(props: CreatePlaceScreenProps) {
	return (
		<BerxFamilyScene family="PLACES" testID="create-place">
			<CreatePlaceScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreatePlaceScreenBody({api, onCreated, onBack}: CreatePlaceScreenProps) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [address, setAddress] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.placeCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
	}, [api]);

	async function submit() {
		if (!title.trim() || !category) {
			setError('Укажите название и категорию.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createPlace({title: title.trim(), category, description: description.trim() || undefined, address: address.trim() || undefined});
			onCreated(res.guid);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать место');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<BerxSceneScroll style={styles.screen}>
			<BerxHeader title="Добавить место" onBack={onBack} />
			<View style={styles.body}>
				{/* D2 — the form is a structural object in the room, not
				    fields floating on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />

					<BerxText role="micro" emphasis="tertiary">Категория</BerxText>
					{/* the server owns the category whitelist — these are the
					    slugs it actually returned, never a hardcoded list */}
					<BerxChoiceChips
						accessibilityLabel="Категория места"
						value={category}
						onChange={setCategory}
						options={categories.map((c) => ({key: c.slug, label: c.label}))}
					/>

					<BerxInput placeholder="Адрес" value={address} onChangeText={setAddress} />
					<BerxInput placeholder="Описание" value={description} onChangeText={setDescription} multiline />

					{error ? <Text style={styles.error}>{error}</Text> : null}

					{/* D4 — the commit action, promoted onto the control plane */}
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
					</BerxActionShelf>
				</BerxGlassSurface>
			</View>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	form: {gap: spacing.md},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
