/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createCircle() (components/OssnApi/v1/circles.php).
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircleKind} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxChoiceChips} from '../../../../packages/design-system/src/spatial/BerxChoiceChips';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface CreateCircleScreenProps {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
}

const KINDS: {key: Exclude<BerxCircleKind, null> | null; label: string}[] = [
	{key: null, label: 'Без категории'},
	{key: 'family', label: 'Семья'},
	{key: 'work', label: 'Работа'},
	{key: 'travel', label: 'Путешествия'},
	{key: 'close_friends', label: 'Близкие друзья'},
];

export default function CreateCircleScreen(props: CreateCircleScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" atmosphereKind="community" testID="create-circle">
			<CreateCircleScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateCircleScreenBody({api, onCreated, onBack}: CreateCircleScreenProps) {
	const [name, setName] = useState('');
	const [kind, setKind] = useState<Exclude<BerxCircleKind, null> | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (!name.trim()) {
			setError('Введите название круга.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createCircle(name.trim(), kind ?? undefined);
			onCreated(res.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать круг');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Создать круг" onBack={onBack} />
			<View style={styles.body}>
				{/* D2 — the form is a structural object in the room, not
				    fields floating on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название круга" value={name} onChangeText={setName} />

					<Text style={styles.label}>Категория</Text>
					<BerxChoiceChips
						accessibilityLabel="Категория круга"
						value={kind ?? undefined}
						onChange={(key) => setKind(key as Exclude<BerxCircleKind, null>)}
						options={KINDS.filter((k) => k.key !== null).map((k) => ({key: k.key as string, label: k.label}))}
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
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
