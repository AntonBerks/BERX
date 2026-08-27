/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getCollection()/removeCollectionItem()
 * (components/OssnApi/v1/collections.php). Tapping an item navigates
 * to its real detail screen (Place/Event) — Posts are shown but not
 * yet navigable from here (no PostDetail route param path wired for
 * this screen; not faked as clickable when it wouldn't do anything).
 *
 * MAX BUILD — closes the same class of gap as TripDetailScreen/
 * CommunityDetailScreen's inline edit: api.updateCollection()/
 * deleteCollection() were always real, working client methods (real
 * PATCH/DELETE routes, ownership re-checked server-side) with zero UI
 * callers — an owner could create a collection and add/remove items,
 * but never rename it, change its visibility, or delete it again.
 * Same reasoning as Trips: title/description/visibility only, no
 * date-picker-dependent fields, so the edit form lives inline rather
 * than as a separate screen.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, Alert, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCollectionDetail, BerxCollectionItem, BerxCollectionVisibility} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	id: number;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenPost: (guid: number) => void;
	onDeleted?: () => void;
	onBack?: () => void;
}

export default function CollectionDetailScreen({api, id, onOpenPlace, onOpenEvent, onOpenPost, onDeleted, onBack}: Props) {
	const [collection, setCollection] = useState<BerxCollectionDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editVisibility, setEditVisibility] = useState<BerxCollectionVisibility>('private');
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.getCollection(id);
			setCollection(res);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Подборка недоступна');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function removeItem(item: BerxCollectionItem) {
		if (!collection) return;
		try {
			await api.removeCollectionItem(collection.id, item.item_type, item.item_guid);
			setCollection({
				...collection,
				items: collection.items.filter((i: BerxCollectionItem) => !(i.item_type === item.item_type && i.item_guid === item.item_guid)),
			});
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		}
	}

	function openItem(item: BerxCollectionItem) {
		if (item.item_type === 'place') onOpenPlace(item.item_guid);
		else if (item.item_type === 'event') onOpenEvent(item.item_guid);
		else onOpenPost(item.item_guid);
	}

	function openEdit() {
		if (!collection) return;
		setEditTitle(collection.title);
		setEditDescription(collection.description ?? '');
		setEditVisibility(collection.visibility);
		setEditError(null);
		setEditing(true);
	}

	async function saveEdit() {
		if (!collection) return;
		if (!editTitle.trim()) {
			setEditError('Введите название подборки.');
			return;
		}
		setSaving(true);
		setEditError(null);
		try {
			const updated = await api.updateCollection(collection.id, {
				title: editTitle.trim(),
				description: editDescription.trim(),
				visibility: editVisibility,
			});
			setCollection({...collection, ...updated});
			setEditing(false);
		} catch (e) {
			setEditError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSaving(false);
		}
	}

	function confirmDeleteCollection() {
		if (!collection) return;
		Alert.alert(
			'Удалить подборку?',
			'Это действие нельзя отменить.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteCollection(collection.id);
							if (onDeleted) onDeleted();
							else onBack?.();
						} catch (e) {
							setEditError(e instanceof Error ? e.message : 'Не удалось удалить подборку');
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	}

	if (loading) return <BerxLoadingState />;
	if (error || !collection) return <BerxErrorState message={error ?? 'Подборка не найдена'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title={collection.title} onBack={onBack} />

			{editing ? (
				<View style={styles.editForm}>
					<BerxInput placeholder="Название подборки" value={editTitle} onChangeText={setEditTitle} />
					<BerxInput placeholder="Описание" value={editDescription} onChangeText={setEditDescription} multiline />
					<View style={styles.visibilityRow}>
						<Pressable style={[styles.chip, editVisibility === 'private' && styles.chipActive]} onPress={() => setEditVisibility('private')}>
							<Text style={[styles.chipText, editVisibility === 'private' && styles.chipTextActive]}>Приватная</Text>
						</Pressable>
						<Pressable style={[styles.chip, editVisibility === 'public' && styles.chipActive]} onPress={() => setEditVisibility('public')}>
							<Text style={[styles.chipText, editVisibility === 'public' && styles.chipTextActive]}>Открытая</Text>
						</Pressable>
					</View>
					{editError ? <Text style={styles.error}>{editError}</Text> : null}
					<BerxButton label="Сохранить" loading={saving} onPress={saveEdit} fullWidth />
					<Pressable onPress={() => setEditing(false)} disabled={saving}>
						<Text style={styles.editLink}>Отмена</Text>
					</Pressable>
					<Pressable onPress={confirmDeleteCollection} disabled={deleting} hitSlop={8}>
						<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить подборку'}</Text>
					</Pressable>
				</View>
			) : (
				<>
					{collection.description ? <Text style={styles.description}>{collection.description}</Text> : null}
					{collection.is_own ? (
						<Pressable onPress={openEdit} style={styles.editToolbar}>
							<Text style={styles.editLink}>Редактировать подборку</Text>
						</Pressable>
					) : null}
				</>
			)}

			{editing ? null : collection.items.length === 0 ? (
				<BerxEmptyState title="Пока пусто" subtitle="Добавляйте места и события в эту подборку с их страниц." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={collection.items}
						keyExtractor={(i: BerxCollectionItem) => `${i.item_type}-${i.item_guid}`}
						contentContainerStyle={styles.list}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
						renderItem={({item}: {item: BerxCollectionItem}) => (
							<Pressable style={styles.row} onPress={() => openItem(item)}>
								{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.rowBody}>
									<Text style={styles.title} numberOfLines={1}>{item.title}</Text>
									<Text style={styles.type}>{item.item_type === 'place' ? 'Место' : item.item_type === 'event' ? 'Событие' : 'Пост'}</Text>
								</View>
								{collection.is_own ? (
									<Pressable onPress={() => removeItem(item)} hitSlop={8}>
										<Text style={styles.remove}>✕</Text>
									</Pressable>
								) : null}
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	description: {fontSize: typography.sizeSm, color: colors.textDim, paddingHorizontal: spacing.md, paddingTop: spacing.sm},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	type: {fontSize: typography.sizeXs, color: colors.textFaint},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
	editForm: {padding: spacing.md, gap: spacing.md},
	editToolbar: {paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	editLink: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium, textAlign: 'center'},
	visibilityRow: {flexDirection: 'row', gap: spacing.sm},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
});
