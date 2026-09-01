/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes the same class of gap as EditPlaceScreen: real,
 * working api.updateEvent()/deleteEvent() (PATCH/DELETE on
 * /events/{guid}, both already implemented in events.php with real
 * server-side ownership checks) had zero UI callers anywhere — an
 * organizer could create an event but never fix it or cancel it again
 * from the app.
 *
 * Deliberately does NOT touch starts/ends: CreateEventScreen.tsx
 * already discloses that no native date/time picker library is
 * installed in this environment, so it ships a hardcoded "+1 day at
 * 19:00" default rather than fake one. Building a real date/time
 * editor here would face the identical constraint, so this screen
 * edits the fields that don't need one (title/category/description/
 * location/capacity) and simply omits starts/ends from the PATCH body
 * — updateEvent() only sends fields that are actually provided, so
 * the event's real date is left untouched rather than silently
 * overwritten with a fake value. Rescheduling stays a "delete and
 * recreate" operation until a real picker exists.
 *
 * Also closes uploadEventCover() from the same sweep — real, working,
 * zero UI callers. Its response only echoes {status}, not a fresh
 * cover_url (unlike uploadPlaceCover()) — confirmed by reading
 * events.php's real /cover route — so a successful upload re-fetches
 * the event to pick up the real new cover_url rather than guessing it.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, ScrollView, Image, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxPlaceCategory} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	guid: number;
	pickImage: () => Promise<BerxFilePart | null>;
	onSaved: () => void;
	onDeleted: () => void;
	onBack?: () => void;
}

export default function EditEventScreen({api, guid, pickImage, onSaved, onDeleted, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [location, setLocation] = useState('');
	const [capacity, setCapacity] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [coverUrl, setCoverUrl] = useState<string | null>(null);
	const [uploadingCover, setUploadingCover] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [event, cats] = await Promise.all([api.getEvent(guid), api.eventCategories()]);
			setTitle(event.title);
			setDescription(event.description ?? '');
			setLocation(event.location ?? '');
			setCapacity(event.capacity !== null ? String(event.capacity) : '');
			setCategory(event.category ?? undefined);
			setCategories(cats.categories);
			setCoverUrl(event.cover_url);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить событие');
		} finally {
			setLoading(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleUploadCover() {
		const picked = await pickImage();
		if (!picked) return; // cancelled — real optional action, not an error
		setUploadingCover(true);
		setError(null);
		try {
			await api.uploadEventCover(guid, picked);
			const fresh = await api.getEvent(guid);
			setCoverUrl(fresh.cover_url);
		} catch {
			setError('Не удалось загрузить обложку. Проверьте формат (JPEG/PNG/WebP/GIF).');
		} finally {
			setUploadingCover(false);
		}
	}

	async function submit() {
		if (!title.trim() || !category) {
			setError('Укажите название и категорию.');
			return;
		}
		const trimmedCapacity = capacity.trim();
		if (trimmedCapacity && (!/^\d+$/.test(trimmedCapacity) || Number(trimmedCapacity) < 1)) {
			setError('Вместимость должна быть положительным числом.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await api.updateEvent(guid, {
				title: title.trim(),
				category,
				description: description.trim(),
				location: location.trim(),
				...(trimmedCapacity ? {capacity: Number(trimmedCapacity)} : {}),
			});
			onSaved();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSubmitting(false);
		}
	}

	function confirmDelete() {
		Alert.alert(
			'Отменить событие?',
			'Это действие нельзя отменить. Все записи участников будут удалены.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteEvent(guid);
							onDeleted();
						} catch (e) {
							setError(e instanceof Error ? e.message : 'Не удалось удалить событие');
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать событие" onBack={onBack} />
				<BerxLoadingState />
			</View>
		);
	}
	if (error && !title) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать событие" onBack={onBack} />
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Редактировать событие" onBack={onBack} />
			<View style={styles.body}>
				<Pressable onPress={handleUploadCover} disabled={uploadingCover}>
					{coverUrl ? (
						<Image source={{uri: coverUrl}} style={styles.cover} />
					) : (
						<View style={styles.coverPlaceholder}>
							<Text style={styles.coverPlaceholderText}>{uploadingCover ? 'Загрузка…' : '+ Добавить обложку'}</Text>
						</View>
					)}
					{coverUrl ? <Text style={styles.coverChangeText}>{uploadingCover ? 'Загрузка…' : 'Изменить обложку'}</Text> : null}
				</Pressable>

				<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />

				<Text style={styles.label}>Категория</Text>
				<View style={styles.chipWrap}>
					{categories.map((c: BerxPlaceCategory) => (
						<Pressable key={c.slug} style={[styles.chip, category === c.slug && styles.chipActive]} onPress={() => setCategory(c.slug)}>
							<Text style={[styles.chipText, category === c.slug && styles.chipTextActive]}>{c.label}</Text>
						</Pressable>
					))}
				</View>

				<BerxInput placeholder="Место проведения (текстом)" value={location} onChangeText={setLocation} />
				<BerxInput placeholder="Вместимость (необязательно)" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
				<BerxInput placeholder="Описание" value={description} onChangeText={setDescription} multiline />

				<Text style={styles.hint}>Дата и время не редактируются здесь — до появления реального picker-компонента перенос события требует удаления и создания заново.</Text>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Сохранить" loading={submitting} onPress={submit} fullWidth />
				<Pressable onPress={confirmDelete} disabled={deleting} hitSlop={8}>
					<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Отменить событие'}</Text>
				</Pressable>
			</View>
		</ScrollView>
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
	hint: {fontSize: typography.sizeXs, color: colors.textFaint},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
	cover: {width: '100%', aspectRatio: 1.6, borderRadius: radius.md, backgroundColor: colors.graphite},
	coverPlaceholder: {width: '100%', aspectRatio: 1.6, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'},
	coverPlaceholderText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	coverChangeText: {fontSize: typography.sizeXs, color: colors.accent, textAlign: 'center', marginTop: spacing.xs},
});
