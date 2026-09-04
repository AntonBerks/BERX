/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createAlbum() (components/OssnApi/v1/albums.php).
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

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
				<BerxInput placeholder="Название альбома" value={title} onChangeText={setTitle} />

				<Text style={styles.label}>Доступ</Text>
				<View style={styles.row}>
					<Pressable style={[styles.chip, access === 'public' && styles.chipActive]} onPress={() => setAccess('public')}>
						<Text style={[styles.chipText, access === 'public' && styles.chipTextActive]}>Открытый</Text>
					</Pressable>
					<Pressable style={[styles.chip, access === 'private' && styles.chipActive]} onPress={() => setAccess('private')}>
						<Text style={[styles.chipText, access === 'private' && styles.chipTextActive]}>Приватный</Text>
					</Pressable>
				</View>

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
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
