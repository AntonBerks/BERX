/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — closes a real gap: api.getSavedMemory()/
 * updateMemoryNotes() were both real, working client methods with
 * zero UI callers — MemoriesScreen's "Сохранённые" rail could only
 * show a compact card, never open into the full record or let you
 * write a personal note onto it. Real data only, real fields never
 * fabricated: who/where/when/what (see classes/OssnMemories.php) plus
 * the live Moments actually captured during that source (Moment ->
 * Memory link, not copied data). Notes are the one editable field —
 * everything else stays a true record of what really happened (see
 * OssnMemories::updateNotes()'s own header for why).
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxSavedMemory, BerxSavedMemoryPerson, BerxSavedMemoryMoment} from '@berx/api/types';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	id: number;
	onBack?: () => void;
}

export default function MemoryDetailScreen({api, id, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [memory, setMemory] = useState<BerxSavedMemory | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [notes, setNotes] = useState('');
	const [saving, setSaving] = useState(false);
	const [savedFlash, setSavedFlash] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await api.getSavedMemory(id);
			setMemory(res.memory);
			setNotes(res.memory.notes ?? '');
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить воспоминание');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function saveNotes() {
		setSaving(true);
		setSavedFlash(false);
		try {
			await api.updateMemoryNotes(id, notes.trim());
			setSavedFlash(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось сохранить заметку');
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && !memory) return <BerxErrorState message={error} onRetry={load} />;
	if (!memory) return null;

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title={memory.title} onBack={onBack} />
			<BerxFadeIn style={styles.body}>
				<View style={styles.metaRow}>
					<Text style={styles.meta}>
						{new Date(memory.happened_at * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}
					</Text>
					{memory.place ? <Text style={styles.meta}>{memory.place.title}</Text> : null}
				</View>

				{memory.people.length > 0 ? (
					<>
						<Text style={styles.sectionTitle}>С кем</Text>
						<View style={styles.peopleRow}>
							{memory.people.map((person: BerxSavedMemoryPerson) => (
								<View key={person.guid} style={styles.personChip}>
									<BerxAvatar iconUrl={person.icon} fallbackInitial={(person.username ?? '#').charAt(0)} size={28} />
									<Text style={styles.personName} numberOfLines={1}>{person.username ?? `#${person.guid}`}</Text>
								</View>
							))}
						</View>
					</>
				) : null}

				{memory.moments.length > 0 ? (
					<>
						<Text style={styles.sectionTitle}>Моменты</Text>
						<View style={styles.momentsList}>
							{memory.moments.map((moment: BerxSavedMemoryMoment, i: number) => (
								<View key={i} style={styles.momentRow}>
									<Text style={styles.momentAuthor}>{moment.owner_username ?? 'Кто-то'}</Text>
									<Text style={styles.momentText}>{moment.text}</Text>
								</View>
							))}
						</View>
					</>
				) : null}

				<Text style={styles.sectionTitle}>Ваша заметка</Text>
				<BerxInput placeholder="Что вы хотите запомнить об этом?" value={notes} onChangeText={setNotes} multiline />
				{error ? <Text style={styles.error}>{error}</Text> : null}
				{savedFlash ? <Text style={styles.savedText}>Заметка сохранена ✓</Text> : null}
				<BerxButton label="Сохранить заметку" onPress={saveNotes} loading={saving} fullWidth />
			</BerxFadeIn>
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.lg, gap: spacing.md},
	metaRow: {gap: 2},
	meta: {color: colors.textDim, fontSize: typography.sizeSm},
	sectionTitle: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm},
	peopleRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md},
	personChip: {alignItems: 'center', gap: 4, width: 60},
	personName: {color: colors.textDim, fontSize: typography.sizeXs, textAlign: 'center'},
	momentsList: {gap: spacing.sm},
	momentRow: {borderLeftWidth: 2, borderLeftColor: colors.borderSoft, paddingLeft: spacing.sm, gap: 2},
	momentAuthor: {color: colors.textFaint, fontSize: typography.sizeXs},
	momentText: {color: colors.text, fontSize: typography.sizeSm},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	savedText: {color: colors.accent, fontSize: typography.sizeSm},
});
