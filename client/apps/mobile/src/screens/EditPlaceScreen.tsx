/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.updatePlace()/deletePlace() were
 * always real, working client methods (backed by real PATCH/DELETE
 * routes in places.php, DELETE also cleans up reviews and the geo-
 * index entry server-side) with zero UI callers anywhere — a place
 * owner could create a place but never edit or delete it again from
 * the app. Server re-checks ownership independently on every real
 * call regardless of how this screen was reached.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	guid: number;
	onSaved: () => void;
	onDeleted: () => void;
	onBack?: () => void;
}

export default function EditPlaceScreen({api, guid, onSaved, onDeleted, onBack}: Props) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [address, setAddress] = useState('');
	const [phone, setPhone] = useState('');
	const [website, setWebsite] = useState('');
	const [hours, setHours] = useState('');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [place, cats] = await Promise.all([api.getPlace(guid), api.placeCategories()]);
			setTitle(place.title);
			setDescription(place.description ?? '');
			setAddress(place.address ?? '');
			setPhone(place.phone ?? '');
			setWebsite(place.website ?? '');
			setHours(place.hours ?? '');
			setCategory(place.category ?? undefined);
			setCategories(cats.categories);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить место');
		} finally {
			setLoading(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	async function submit() {
		if (!title.trim() || !category) {
			setError('Укажите название и категорию.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await api.updatePlace(guid, {
				title: title.trim(),
				category,
				description: description.trim(),
				address: address.trim(),
				phone: phone.trim(),
				website: website.trim(),
				hours: hours.trim(),
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
			'Удалить место?',
			'Это действие нельзя отменить. Отзывы и запись на карте тоже будут удалены.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deletePlace(guid);
							onDeleted();
						} catch (e) {
							setError(e instanceof Error ? e.message : 'Не удалось удалить место');
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
				<BerxHeader title="Редактировать место" onBack={onBack} />
				<BerxLoadingState />
			</View>
		);
	}
	if (error && !title) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать место" onBack={onBack} />
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Редактировать место" onBack={onBack} />
			<View style={styles.body}>
				<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />

				<Text style={styles.label}>Категория</Text>
				<View style={styles.chipWrap}>
					{categories.map((c: BerxPlaceCategory) => (
						<Pressable key={c.slug} style={[styles.chip, category === c.slug && styles.chipActive]} onPress={() => setCategory(c.slug)}>
							<Text style={[styles.chipText, category === c.slug && styles.chipTextActive]}>{c.label}</Text>
						</Pressable>
					))}
				</View>

				<BerxInput placeholder="Адрес" value={address} onChangeText={setAddress} />
				<BerxInput placeholder="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
				<BerxInput placeholder="Сайт" value={website} onChangeText={setWebsite} autoCapitalize="none" />
				<BerxInput placeholder="Часы работы" value={hours} onChangeText={setHours} />
				<BerxInput placeholder="Описание" value={description} onChangeText={setDescription} multiline />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Сохранить" loading={submitting} onPress={submit} fullWidth />
				<Pressable onPress={confirmDelete} disabled={deleting} hitSlop={8}>
					<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить место'}</Text>
				</Pressable>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
});
