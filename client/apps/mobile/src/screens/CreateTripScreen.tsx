/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createTrip() (components/OssnApi/v1/trips.php).
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollectionVisibility} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

interface Props {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
}

export default function CreateTripScreen({api, onCreated, onBack}: Props) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [visibility, setVisibility] = useState<BerxCollectionVisibility>('private');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (!title.trim()) {
			setError('Введите название поездки.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createTrip({title: title.trim(), description: description.trim() || undefined, visibility});
			onCreated(res.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать поездку');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Спланировать поездку" onBack={onBack} />
			<View style={styles.body}>
				<BerxInput placeholder="Название поездки" value={title} onChangeText={setTitle} />
				<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />

				<Text style={styles.label}>Доступ</Text>
				<View style={styles.row}>
					<Pressable style={[styles.chip, visibility === 'private' && styles.chipActive]} onPress={() => setVisibility('private')}>
						<Text style={[styles.chipText, visibility === 'private' && styles.chipTextActive]}>Приватная</Text>
					</Pressable>
					<Pressable style={[styles.chip, visibility === 'public' && styles.chipActive]} onPress={() => setVisibility('public')}>
						<Text style={[styles.chipText, visibility === 'public' && styles.chipTextActive]}>Открытая</Text>
					</Pressable>
				</View>
				<Text style={styles.hint}>Даты и участников можно будет добавить после создания.</Text>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	row: {flexDirection: 'row', gap: spacing.sm},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	hint: {fontSize: typography.sizeXs, color: colors.textFaint},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
