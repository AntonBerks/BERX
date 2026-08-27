/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Honest scope: no group feed/posts/comments here — OssnGroup has
 * real methods for members (getMembers) but this pass only wires
 * join/leave/view/manage, consistent with "add what's actually built
 * and tested, not a guessed full feature set."
 *
 * MAX BUILD — closes the same class of gap as EditPlaceScreen/
 * EditEventScreen/TripDetailScreen's inline edit: api.updateCommunity()/
 * deleteCommunity() were always real, working client methods (real
 * PATCH/DELETE routes in communities.php, ownership re-checked
 * server-side) with zero UI callers. A community is simple enough
 * (name/description only — updateGroup()'s own real scope, matching
 * the web edit action) that the edit form lives inline here, same
 * principle as TripDetailScreen.
 *
 * MAX BUILD — real Communities <-> Events connection: a real
 * "Ближайшие события" section (api.communityEvents(), real
 * OssnEvents::upcomingByGroup() — only events an actual member
 * organized and explicitly tagged to this community, never a guess).
 * Best-effort, never blocks the community itself from loading.
 */
import {useEffect, useState} from 'react';
import {View, Text, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity, BerxEvent} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	onBack: () => void;
	onOpenRequests?: (guid: number) => void;
	onOpenModerators?: (guid: number) => void;
	onOpenMembers?: (guid: number, isOwner: boolean) => void;
	onOpenEvent?: (guid: number) => void;
	onReport?: (guid: number) => void;
	onDeleted?: () => void;
}

export default function CommunityDetailScreen({api, guid, myGuid, onBack, onOpenRequests, onOpenModerators, onOpenMembers, onOpenEvent, onReport, onDeleted}: Props) {
	const [community, setCommunity] = useState<BerxCommunity | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState(false);
	const [events, setEvents] = useState<BerxEvent[]>([]);
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		try {
			const data = await api.getCommunity(guid);
			setCommunity(data);
			setError(null);
			// Best-effort — a community with no tagged events still loads normally.
			api.communityEvents(guid).then((res) => setEvents(res.events)).catch(() => undefined);
		} catch {
			setError('Сообщество недоступно');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [guid]);

	async function handleJoinLeave() {
		if (!community) return;
		setActing(true);
		try {
			if (community.is_member) {
				await api.leaveCommunity(guid);
			} else {
				await api.joinCommunity(guid);
			}
			await load();
		} finally {
			setActing(false);
		}
	}

	function openEdit() {
		if (!community) return;
		setEditName(community.name);
		setEditDescription(community.description ?? '');
		setEditError(null);
		setEditing(true);
	}

	async function saveEdit() {
		if (!community) return;
		if (!editName.trim()) {
			setEditError('Введите название сообщества.');
			return;
		}
		setSaving(true);
		setEditError(null);
		try {
			await api.updateCommunity(guid, editName.trim(), editDescription.trim());
			setCommunity({...community, name: editName.trim(), description: editDescription.trim()});
			setEditing(false);
		} catch (e) {
			setEditError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSaving(false);
		}
	}

	function confirmDeleteCommunity() {
		Alert.alert(
			'Удалить сообщество?',
			'Это действие нельзя отменить. Участники, модераторы и заявки будут удалены.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteCommunity(guid);
							if (onDeleted) onDeleted();
							else onBack();
						} catch (e) {
							setEditError(e instanceof Error ? e.message : 'Не удалось удалить сообщество');
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
				<BerxHeader onBack={onBack} />
				<BerxLoadingState label="Загрузка..." />
			</View>
		);
	}
	if (error || !community) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxErrorState message={error ?? 'Сообщество не найдено'} onRetry={load} />
			</View>
		);
	}

	const isOwner = Boolean(myGuid && community.owner_guid === myGuid);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={community.name} />
			<View style={styles.content}>
				{editing ? (
					<>
						<BerxInput placeholder="Название сообщества" value={editName} onChangeText={setEditName} />
						<BerxInput placeholder="Описание" value={editDescription} onChangeText={setEditDescription} multiline />
						{editError ? <Text style={styles.error}>{editError}</Text> : null}
						<BerxButton label="Сохранить" loading={saving} onPress={saveEdit} fullWidth />
						<Pressable onPress={() => setEditing(false)} disabled={saving}>
							<Text style={styles.reportLink}>Отмена</Text>
						</Pressable>
						<Pressable onPress={confirmDeleteCommunity} disabled={deleting} hitSlop={8}>
							<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить сообщество'}</Text>
						</Pressable>
					</>
				) : (
					<>
						<Text style={styles.name}>{community.name}</Text>
						<Text style={styles.privacy}>{community.privacy === 'private' ? 'Закрытое сообщество' : 'Открытое сообщество'}</Text>
						{community.description ? <Text style={styles.description}>{community.description}</Text> : null}

						<BerxButton
							label={community.is_member ? 'Покинуть сообщество' : 'Вступить'}
							variant={community.is_member ? 'secondary' : 'primary'}
							onPress={handleJoinLeave}
							loading={acting}
							fullWidth
						/>

						{onOpenMembers ? <BerxButton label="Участники" variant="secondary" onPress={() => onOpenMembers(guid, isOwner)} fullWidth /> : null}

						{events.length > 0 ? (
							<View style={styles.eventsSection}>
								<Text style={styles.eventsTitle}>Ближайшие события</Text>
								{events.map((e) => (
									<Pressable key={e.guid} style={styles.eventRow} onPress={() => onOpenEvent && onOpenEvent(e.guid)} disabled={!onOpenEvent}>
										<Text style={styles.eventTitle} numberOfLines={1}>{e.title}</Text>
										<Text style={styles.eventMeta}>{new Date(e.starts * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})} · {e.attendee_count} идут</Text>
									</Pressable>
								))}
							</View>
						) : null}

						{isOwner ? (
							<View style={styles.ownerActions}>
								{onOpenRequests ? <BerxButton label="Заявки на вступление" variant="secondary" onPress={() => onOpenRequests(guid)} fullWidth /> : null}
								{onOpenModerators ? <BerxButton label="Модераторы" variant="secondary" onPress={() => onOpenModerators(guid)} fullWidth /> : null}
								<BerxButton label="Редактировать" variant="secondary" onPress={openEdit} fullWidth />
							</View>
						) : null}

						{myGuid && !isOwner && onReport ? (
							<Pressable onPress={() => onReport(guid)} hitSlop={8}>
								<Text style={styles.reportLink}>Пожаловаться на сообщество</Text>
							</Pressable>
						) : null}
					</>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	content: {padding: spacing.lg, gap: spacing.md},
	ownerActions: {gap: spacing.sm, marginTop: spacing.sm},
	name: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	privacy: {color: colors.accent, fontSize: typography.sizeSm},
	description: {color: colors.textDim, fontSize: typography.sizeBase},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center', marginTop: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
	eventsSection: {gap: spacing.xs, marginTop: spacing.sm},
	eventsTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	eventRow: {gap: 2, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	eventTitle: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	eventMeta: {color: colors.textFaint, fontSize: typography.sizeXs},
});
