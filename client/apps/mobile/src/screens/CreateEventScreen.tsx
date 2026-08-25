/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createEvent() (components/OssnApi/v1/events.php,
 * POST /events). starts is sent as a real unix timestamp — the
 * server's is_numeric() branch accepts that directly (see the
 * comment on createEvent() in client.ts).
 */
import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceCategory, BerxPlace} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

interface Props {
	api: BerxApiClient;
	onCreated: (guid: number) => void;
	onBack?: () => void;
}

/** +1 day at 19:00 — a reasonable default the user can see and the server actually receives; not silently different values in two places. */
function defaultStart(): {label: string; unix: number} {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	d.setHours(19, 0, 0, 0);
	return {label: d.toLocaleString('ru-RU'), unix: Math.floor(d.getTime() / 1000)};
}

export default function CreateEventScreen({api, onCreated, onBack}: Props) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [location, setLocation] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [capacity, setCapacity] = useState('');
	const [places, setPlaces] = useState<BerxPlace[]>([]);
	const [placeGuid, setPlaceGuid] = useState<number | undefined>(undefined);
	const [start] = useState(defaultStart);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.eventCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
		api.places().then((r) => setPlaces(r.places.slice(0, 20))).catch(() => undefined);
	}, [api]);

	async function submit() {
		if (!title.trim() || !category) {
			setError('Укажите название и категорию.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createEvent({
				title: title.trim(),
				category,
				starts: start.unix,
				description: description.trim() || undefined,
				location: location.trim() || undefined,
				placeGuid,
				capacity: capacity ? Number(capacity) : undefined,
			});
			onCreated(res.guid);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать событие');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Создать событие" onBack={onBack} />
			<View style={styles.body}>
				<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />

				<Text style={styles.label}>Начало</Text>
				<Text style={styles.staticValue}>{start.label}</Text>
				<Text style={styles.hint}>Дата/время — заглушка на завтра 19:00 до появления реального picker-компонента (без установленного react-native, полноценный нативный picker здесь непроверяем).</Text>

				<Text style={styles.label}>Категория</Text>
				<View style={styles.chipWrap}>
					{categories.map((c) => (
						<Pressable key={c.slug} style={[styles.chip, category === c.slug && styles.chipActive]} onPress={() => setCategory(c.slug)}>
							<Text style={[styles.chipText, category === c.slug && styles.chipTextActive]}>{c.label}</Text>
						</Pressable>
					))}
				</View>

				{places.length > 0 ? (
					<>
						<Text style={styles.label}>Место (необязательно)</Text>
						<View style={styles.chipWrap}>
							<Pressable style={[styles.chip, !placeGuid && styles.chipActive]} onPress={() => setPlaceGuid(undefined)}>
								<Text style={[styles.chipText, !placeGuid && styles.chipTextActive]}>Не выбрано</Text>
							</Pressable>
							{places.map((p) => (
								<Pressable key={p.guid} style={[styles.chip, placeGuid === p.guid && styles.chipActive]} onPress={() => setPlaceGuid(p.guid)}>
									<Text style={[styles.chipText, placeGuid === p.guid && styles.chipTextActive]} numberOfLines={1}>{p.title}</Text>
								</Pressable>
							))}
						</View>
					</>
				) : null}

				<BerxInput placeholder="Адрес (если без места из BERX)" value={location} onChangeText={setLocation} />
				<BerxInput placeholder="Вместимость (необязательно)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
				<BerxInput placeholder="Описание" value={description} onChangeText={setDescription} multiline />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	staticValue: {fontSize: typography.sizeBase, color: colors.text},
	hint: {fontSize: typography.sizeXs, color: colors.textFaint},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, maxWidth: 160},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
