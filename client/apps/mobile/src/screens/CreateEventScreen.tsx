/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createEvent() (components/OssnApi/v1/events.php,
 * POST /events). starts is sent as a real unix timestamp — the
 * server's is_numeric() branch accepts that directly (see the
 * comment on createEvent() in client.ts).
 */
import {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceCategory, BerxPlace} from '@berx/api/types';
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

export interface CreateEventScreenProps {
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

export default function CreateEventScreen(props: CreateEventScreenProps) {
	return (
		<BerxFamilyScene family="EVENTS" testID="create-event">
			<CreateEventScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateEventScreenBody({api, onCreated, onBack}: CreateEventScreenProps) {
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
		<BerxSceneScroll style={styles.screen}>
			<BerxHeader title="Создать событие" onBack={onBack} />
			<View style={styles.body}>
				{/* D2 — the form is a structural object in the room, not
				    fields floating on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />

					<BerxText role="micro" emphasis="tertiary">Начало</BerxText>
					<BerxText role="body">{start.label}</BerxText>
					<BerxText role="meta" emphasis="tertiary">Дата/время — заглушка на завтра 19:00 до появления реального picker-компонента (без установленного react-native, полноценный нативный picker здесь непроверяем).</BerxText>

					<BerxText role="micro" emphasis="tertiary">Категория</BerxText>
					{/* the server owns the category whitelist */}
					<BerxChoiceChips
						accessibilityLabel="Категория события"
						value={category}
						onChange={setCategory}
						options={categories.map((c) => ({key: c.slug, label: c.label}))}
					/>

					{places.length > 0 ? (
						<>
							<BerxText role="micro" emphasis="tertiary">Место (необязательно)</BerxText>
							{/* the person's own real places, plus an explicit "none" */}
							<BerxChoiceChips
								accessibilityLabel="Место события"
								scroll
								value={placeGuid ?? 0}
								onChange={(key) => setPlaceGuid(key === 0 ? undefined : (key as number))}
								options={[{key: 0, label: 'Не выбрано'}, ...places.map((p) => ({key: p.guid, label: p.title}))]}
							/>
						</>
					) : null}

					<BerxInput placeholder="Адрес (если без места из BERX)" value={location} onChangeText={setLocation} />
					<BerxInput placeholder="Вместимость (необязательно)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
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
