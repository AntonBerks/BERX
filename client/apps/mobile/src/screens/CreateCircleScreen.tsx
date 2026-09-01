/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createCircle() (components/OssnApi/v1/circles.php).
 */
import {useState, useMemo} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircleKind} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
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

export default function CreateCircleScreen({api, onCreated, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
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
				<BerxInput placeholder="Название круга" value={name} onChangeText={setName} />

				<Text style={styles.label}>Категория</Text>
				<View style={styles.chipWrap}>
					{KINDS.map((k) => (
						<Pressable key={k.label} style={[styles.chip, kind === k.key && styles.chipActive]} onPress={() => setKind(k.key)}>
							<Text style={[styles.chipText, kind === k.key && styles.chipTextActive]}>{k.label}</Text>
						</Pressable>
					))}
				</View>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
