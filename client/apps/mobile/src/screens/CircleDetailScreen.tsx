/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getCircle()/addCircleMember()/removeCircleMember()
 * (components/OssnApi/v1/circles.php). The "add" picker is sourced
 * from api.friends() (real, existing this session) filtered to
 * exclude people already in the circle — never an arbitrary user
 * search, since the server would reject a non-friend anyway.
 *
 * MAX BUILD — closes the same class of gap as Trips/Collections'
 * inline edit: api.renameCircle()/deleteCircle() were always real,
 * working client methods (real PATCH/DELETE routes, ownership
 * re-checked server-side) with zero UI callers — a circle owner
 * could create a circle and manage members, but never rename it or
 * delete it again from the app.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircleDetail, BerxCircleMember, BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	id: number;
	onDeleted?: () => void;
	onBack?: () => void;
}

export default function CircleDetailScreen({api, id, onDeleted, onBack}: Props) {
	const [circle, setCircle] = useState<BerxCircleDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [c, f] = await Promise.all([api.getCircle(id), api.friends()]);
			setCircle(c);
			setFriends(f.friends);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Круг недоступен');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function addMember(guid: number) {
		if (!circle) return;
		setBusyGuid(guid);
		try {
			await api.addCircleMember(circle.id, guid);
			await load();
		} catch {
			// server rejects non-friends / duplicates with a real error — nothing optimistic here
		} finally {
			setBusyGuid(null);
		}
	}

	async function removeMember(guid: number) {
		if (!circle) return;
		setBusyGuid(guid);
		try {
			await api.removeCircleMember(circle.id, guid);
			setCircle({...circle, members: circle.members.filter((m: BerxCircleMember) => m.guid !== guid)});
		} catch {
			// list stays as-is on failure
		} finally {
			setBusyGuid(null);
		}
	}

	function openEdit() {
		if (!circle) return;
		setEditName(circle.name);
		setEditError(null);
		setEditing(true);
	}

	async function saveEdit() {
		if (!circle) return;
		if (!editName.trim()) {
			setEditError('Введите название круга.');
			return;
		}
		setSaving(true);
		setEditError(null);
		try {
			const updated = await api.renameCircle(circle.id, editName.trim());
			setCircle({...circle, ...updated});
			setEditing(false);
		} catch (e) {
			setEditError(e instanceof Error ? e.message : 'Не удалось переименовать круг');
		} finally {
			setSaving(false);
		}
	}

	function confirmDeleteCircle() {
		if (!circle) return;
		Alert.alert(
			'Удалить круг?',
			'Это действие нельзя отменить.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteCircle(circle.id);
							if (onDeleted) onDeleted();
							else onBack?.();
						} catch (e) {
							setEditError(e instanceof Error ? e.message : 'Не удалось удалить круг');
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	}

	if (loading) return <BerxLoadingState />;
	if (error || !circle) return <BerxErrorState message={error ?? 'Круг не найден'} onRetry={load} />;

	const memberGuids = new Set(circle.members.map((m: BerxCircleMember) => m.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !memberGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			<BerxHeader title={circle.name} onBack={onBack} />

			{editing ? (
				<View style={styles.editForm}>
					<BerxInput placeholder="Название круга" value={editName} onChangeText={setEditName} />
					{editError ? <Text style={styles.error}>{editError}</Text> : null}
					<BerxButton label="Сохранить" loading={saving} onPress={saveEdit} fullWidth />
					<Pressable onPress={() => setEditing(false)} disabled={saving}>
						<Text style={styles.toggleBtnText}>Отмена</Text>
					</Pressable>
					<Pressable onPress={confirmDeleteCircle} disabled={deleting} hitSlop={8}>
						<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить круг'}</Text>
					</Pressable>
				</View>
			) : (
				<View style={styles.toolbar}>
					<Pressable style={styles.toggleBtn} onPress={() => setShowPicker(!showPicker)}>
						<Text style={styles.toggleBtnText}>{showPicker ? 'Скрыть список друзей' : 'Добавить друга'}</Text>
					</Pressable>
					<Pressable style={styles.toggleBtn} onPress={openEdit}>
						<Text style={styles.toggleBtnText}>Переименовать / удалить</Text>
					</Pressable>
				</View>
			)}

			{editing ? null : showPicker ? (
				availableFriends.length === 0 ? (
					<Text style={styles.hint}>Все друзья уже в этом круге.</Text>
				) : (
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={availableFriends}
						keyExtractor={(f: BerxFriend) => String(f.guid)}
						contentContainerStyle={styles.pickerRow}
						renderItem={({item}: {item: BerxFriend}) => (
							<Pressable style={styles.pickerItem} onPress={() => addMember(item.guid)} disabled={busyGuid === item.guid}>
								<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
								<Text style={styles.pickerName} numberOfLines={1}>{item.fullname}</Text>
							</Pressable>
						)}
					/>
				)
			) : null}

			{editing ? null : circle.members.length === 0 ? (
				<BerxEmptyState title="В круге пока никого нет" subtitle="Добавьте друзей выше." />
			) : (
				<FlatList
					data={circle.members}
					keyExtractor={(m: BerxCircleMember) => String(m.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCircleMember}) => (
						<View style={styles.row}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
							<Pressable onPress={() => removeMember(item.guid)} hitSlop={8} disabled={busyGuid === item.guid}>
								<Text style={styles.remove}>✕</Text>
							</Pressable>
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md, gap: spacing.sm},
	toggleBtn: {alignSelf: 'flex-start'},
	editForm: {padding: spacing.md, gap: spacing.md},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
	toggleBtnText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
