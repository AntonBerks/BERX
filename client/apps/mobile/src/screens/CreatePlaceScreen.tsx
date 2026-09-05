/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createPlace() (components/OssnApi/v1/places.php,
 * POST /places). Category select uses the real server whitelist.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

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
		<ScrollView style={styles.screen}>
			<BerxHeader title="Добавить место" onBack={onBack} />
			<View style={styles.body}>
				<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />

				<Text style={styles.label}>Категория</Text>
				<View style={styles.chipWrap}>
					{categories.map((c) => (
						<Pressable key={c.slug} style={[styles.chip, category === c.slug && styles.chipActive]} onPress={() => setCategory(c.slug)}>
							<Text style={[styles.chipText, category === c.slug && styles.chipTextActive]}>{c.label}</Text>
						</Pressable>
					))}
				</View>

				<BerxInput placeholder="Адрес" value={address} onChangeText={setAddress} />
				<BerxInput placeholder="Описание" value={description} onChangeText={setDescription} multiline />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
