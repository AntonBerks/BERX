/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getExperience()/respondToExperience()/
 * inviteToExperience() (components/OssnApi/v1/experiences.php).
 *
 * MAX BUILD — closes the same class of gap as TripDetailScreen/
 * CollectionDetailScreen's inline edit: api.updateExperience()/
 * deleteExperience()/removeExperienceParticipant() were always real,
 * working client methods (real PATCH/DELETE routes, ownership
 * re-checked server-side) with zero UI callers — an organizer could
 * create an experience and invite friends, but never fix the title/
 * description, change visibility, remove a participant, or cancel it
 * again. scheduled_start/scheduled_end are deliberately left
 * unedited here, same reasoning as EditEventScreen: no native date/
 * time picker library is installed, and updateExperience() only
 * sends fields actually provided, so the real schedule stays intact.
 *
 * BERX WORLD — real Life Moments (classes/OssnLifeMoments.php,
 * api.createLifeMoment()/momentsForSource()): a lightweight, real
 * capture scoped to this experience, only ever creatable by someone
 * the server has already verified was really part of it. Deliberately
 * NOT rendered as a post card — no avatar, no like/comment row — a
 * quiet running log, not the app's main feed grammar.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxExperienceDetail, BerxExperienceParticipant, BerxFriend, BerxCollectionVisibility, BerxLifeMoment} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	id: number;
	myGuid?: number;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onDeleted?: () => void;
	onAddToWorld?: () => void;
	onBack?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
	invited: 'Приглашён',
	accepted: 'Идёт',
	declined: 'Отклонил',
};

function fmtWhen(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'});
}

export default function ExperienceDetailScreen({api, id, myGuid, onOpenPlace, onOpenEvent, onDeleted, onAddToWorld, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [experience, setExperience] = useState<BerxExperienceDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [busy, setBusy] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editVisibility, setEditVisibility] = useState<BerxCollectionVisibility>('private');
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [savingMemory, setSavingMemory] = useState(false);
	const [memorySaved, setMemorySaved] = useState(false);
	const [moments, setMoments] = useState<BerxLifeMoment[]>([]);
	const [momentText, setMomentText] = useState('');
	const [momentBusy, setMomentBusy] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [e, f] = await Promise.all([api.getExperience(id), api.friends()]);
			setExperience(e);
			setFriends(f.friends);
			// Best-effort — canViewSource() 403s for someone with no real
			// connection to this experience; that's expected for a public
			// experience's non-participant viewer, not a real failure.
			api.momentsForSource('experience', id).then((r) => setMoments(r.moments)).catch(() => undefined);
		} catch (e2) {
			setError(e2 instanceof Error ? e2.message : 'Впечатление недоступно');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function respond(accept: boolean) {
		if (!experience) return;
		setBusy(true);
		try {
			await api.respondToExperience(experience.id, accept);
			await load();
		} catch {
			// real error (e.g. not actually invited) — nothing optimistic
		} finally {
			setBusy(false);
		}
	}

	/**
	 * BERX WORLD — Experience -> Memory. Real, server-guarded (owner or
	 * a real accepted participant, only once scheduled_start has
	 * actually passed — see OssnMemories::createFromExperience()'s own
	 * header); this button is only ever shown when both are already
	 * true, never offered as a dead end that would 403/422.
	 */
	async function saveMemory() {
		if (!experience) return;
		setSavingMemory(true);
		try {
			await api.saveMemoryFromExperience(experience.id);
			setMemorySaved(true);
		} catch {
			// real rejection (e.g. already saved) — button stays, no fake success
		} finally {
			setSavingMemory(false);
		}
	}

	/**
	 * BERX WORLD — a real Life Moment, scoped to this experience. Only
	 * reachable by someone real presence already gates (is_own or a
	 * real accepted participant — same server check saveMemory() above
	 * relies on), never offered to a random viewer of a public
	 * experience.
	 */
	async function createMoment() {
		if (!experience || !momentText.trim()) return;
		setMomentBusy(true);
		try {
			await api.createLifeMoment('experience', experience.id, momentText.trim());
			setMomentText('');
			const res = await api.momentsForSource('experience', experience.id);
			setMoments(res.moments);
		} catch {
			// real rejection — text stays in the input, nothing optimistic
		} finally {
			setMomentBusy(false);
		}
	}

	/** Owner-only (server re-checks — OssnLifeMoments::deleteMoment()). Optimistic removal, real server call. */
	async function deleteMoment(momentId: number) {
		setMoments((prev: BerxLifeMoment[]) => prev.filter((m: BerxLifeMoment) => m.id !== momentId));
		try {
			await api.deleteLifeMoment(momentId);
		} catch {
			// real rejection — reload the true state rather than leaving a stale optimistic remove
			if (experience) {
				api.momentsForSource('experience', experience.id).then((res) => setMoments(res.moments)).catch(() => undefined);
			}
		}
	}

	async function invite(guid: number) {
		if (!experience) return;
		setBusy(true);
		try {
			await api.inviteToExperience(experience.id, guid);
			await load();
		} catch {
			// server rejects non-friends/duplicates with a real error
		} finally {
			setBusy(false);
		}
	}

	function openEdit() {
		if (!experience) return;
		setEditTitle(experience.title);
		setEditDescription(experience.description ?? '');
		setEditVisibility(experience.visibility);
		setEditError(null);
		setEditing(true);
	}

	async function saveEdit() {
		if (!experience) return;
		if (!editTitle.trim()) {
			setEditError('Введите название.');
			return;
		}
		setSaving(true);
		setEditError(null);
		try {
			const updated = await api.updateExperience(experience.id, {
				title: editTitle.trim(),
				description: editDescription.trim(),
				visibility: editVisibility,
			});
			setExperience({...experience, ...updated});
			setEditing(false);
		} catch (e) {
			setEditError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSaving(false);
		}
	}

	function confirmDeleteExperience() {
		if (!experience) return;
		Alert.alert(
			'Удалить впечатление?',
			'Это действие нельзя отменить. Список участников будет удалён.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteExperience(experience.id);
							if (onDeleted) onDeleted();
							else onBack?.();
						} catch (e) {
							setEditError(e instanceof Error ? e.message : 'Не удалось удалить впечатление');
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	}

	async function removeParticipant(guid: number) {
		if (!experience) return;
		try {
			await api.removeExperienceParticipant(experience.id, guid);
			setExperience({...experience, participants: experience.participants.filter((p: BerxExperienceParticipant) => p.guid !== guid)});
		} catch {
			// list stays as-is on failure
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !experience) return <BerxErrorState message={error ?? 'Впечатление не найдено'} onRetry={load} />;

	const participantGuids = new Set(experience.participants.map((p: BerxExperienceParticipant) => p.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !participantGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			<BerxHeader title={experience.title} onBack={onBack} />
			<View style={styles.body}>
				{editing ? (
					<>
						<BerxInput placeholder="Название" value={editTitle} onChangeText={setEditTitle} />
						<BerxInput placeholder="Описание" value={editDescription} onChangeText={setEditDescription} multiline />
						<View style={styles.visibilityRow}>
							<Pressable style={[styles.chip, editVisibility === 'private' && styles.chipActive]} onPress={() => setEditVisibility('private')}>
								<Text style={[styles.chipText, editVisibility === 'private' && styles.chipTextActive]}>Приватное</Text>
							</Pressable>
							<Pressable style={[styles.chip, editVisibility === 'public' && styles.chipActive]} onPress={() => setEditVisibility('public')}>
								<Text style={[styles.chipText, editVisibility === 'public' && styles.chipTextActive]}>Открытое</Text>
							</Pressable>
						</View>
						{editError ? <Text style={styles.error}>{editError}</Text> : null}
						<BerxButton label="Сохранить" loading={saving} onPress={saveEdit} fullWidth />
						<Pressable onPress={() => setEditing(false)} disabled={saving}>
							<Text style={styles.toggleText}>Отмена</Text>
						</Pressable>
						<Pressable onPress={confirmDeleteExperience} disabled={deleting} hitSlop={8}>
							<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить впечатление'}</Text>
						</Pressable>
					</>
				) : (
					<>
				<Text style={styles.when}>{fmtWhen(experience.scheduled_start)}</Text>

				{experience.anchor ? (
					<Pressable
						style={styles.anchorCard}
						onPress={() => (experience.anchor!.type === 'place' ? onOpenPlace(experience.anchor!.guid) : onOpenEvent(experience.anchor!.guid))}>
						{experience.anchor.image_url ? <Image source={{uri: experience.anchor.image_url}} style={styles.anchorImage} /> : <View style={styles.anchorImageFallback} />}
						<View style={styles.anchorBody}>
							<Text style={styles.anchorTitle} numberOfLines={1}>{experience.anchor.title}</Text>
							<Text style={styles.anchorType}>{experience.anchor.type === 'place' ? 'Место' : 'Событие'}</Text>
						</View>
					</Pressable>
				) : null}

				{experience.description ? <Text style={styles.description}>{experience.description}</Text> : null}

				{onAddToWorld ? <BerxButton label="В мир" variant="secondary" onPress={onAddToWorld} /> : null}

				{experience.scheduled_start * 1000 <= Date.now() && (experience.is_own || experience.my_status === 'accepted') ? (
					<View style={styles.memoryRow}>
						{memorySaved ? (
							<Text style={styles.memorySavedText}>Сохранено как воспоминание ✓</Text>
						) : (
							<BerxButton label="Сохранить как воспоминание" variant="secondary" loading={savingMemory} onPress={saveMemory} fullWidth />
						)}
					</View>
				) : null}

				{experience.is_own || experience.my_status === 'accepted' ? (
					<View style={styles.momentsSection}>
						<Text style={styles.sectionTitle}>Моменты</Text>
						<View style={styles.momentInputRow}>
							<View style={styles.momentInputField}>
								<BerxInput placeholder="Что происходит?" value={momentText} onChangeText={setMomentText} />
							</View>
							<BerxButton label="+" onPress={createMoment} loading={momentBusy} disabled={!momentText.trim()} />
						</View>
						{moments.map((m: BerxLifeMoment) => (
							<View key={m.id} style={styles.momentRow}>
								<View style={styles.momentRowHeader}>
									<Text style={styles.momentAuthor}>{m.owner_username ?? 'Кто-то'}</Text>
									{myGuid === m.owner_guid ? (
										<Pressable onPress={() => deleteMoment(m.id)}>
											<Text style={styles.momentDelete}>удалить</Text>
										</Pressable>
									) : null}
								</View>
								<Text style={styles.momentText}>{m.text}</Text>
							</View>
						))}
					</View>
				) : null}

				{!experience.is_own && experience.my_status === 'invited' ? (
					<View style={styles.actions}>
						<BerxButton label="Пойду" loading={busy} onPress={() => respond(true)} />
						<BerxButton label="Не пойду" variant="secondary" loading={busy} onPress={() => respond(false)} />
					</View>
				) : null}

				{experience.is_own ? (
					<View style={styles.ownerToolbar}>
						<Pressable onPress={() => setShowPicker(!showPicker)}>
							<Text style={styles.toggleText}>{showPicker ? 'Скрыть друзей' : 'Пригласить друга'}</Text>
						</Pressable>
						<Pressable onPress={openEdit}>
							<Text style={styles.toggleText}>Редактировать</Text>
						</Pressable>
					</View>
				) : null}

				{showPicker ? (
					availableFriends.length === 0 ? (
						<Text style={styles.hint}>Все друзья уже приглашены.</Text>
					) : (
						<FlatList
							horizontal
							showsHorizontalScrollIndicator={false}
							data={availableFriends}
							keyExtractor={(f: BerxFriend) => String(f.guid)}
							contentContainerStyle={styles.pickerRow}
							renderItem={({item}: {item: BerxFriend}) => (
								<Pressable style={styles.pickerItem} onPress={() => invite(item.guid)} disabled={busy}>
									<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
									<Text style={styles.pickerName} numberOfLines={1}>{item.fullname}</Text>
								</Pressable>
							)}
						/>
					)
				) : null}

				<Text style={styles.sectionTitle}>Участники ({experience.participants.length})</Text>
				{experience.participants.map((p: BerxExperienceParticipant) => (
					<View key={p.guid} style={styles.participantRow}>
						<Image source={{uri: p.icon}} style={styles.participantAvatar} />
						<Text style={styles.participantName} numberOfLines={1}>{p.fullname}</Text>
						<Text style={styles.participantStatus}>{STATUS_LABEL[p.status]}</Text>
						{experience.is_own ? (
							<Pressable onPress={() => removeParticipant(p.guid)} hitSlop={8}>
								<Text style={styles.remove}>✕</Text>
							</Pressable>
						) : null}
					</View>
				))}
					</>
				)}
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	when: {fontSize: typography.sizeSm, color: colors.textDim},
	anchorCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm},
	anchorImage: {width: 56, height: 56, borderRadius: radius.sm},
	anchorImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	anchorBody: {flex: 1, gap: 2},
	anchorTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	anchorType: {fontSize: typography.sizeXs, color: colors.textFaint},
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	memoryRow: {marginTop: spacing.xs},
	memorySavedText: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, textAlign: 'center'},
	actions: {flexDirection: 'row', gap: spacing.sm},
	toggleText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint},
	pickerRow: {gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	// BERX WORLD — Life Moments: a lightweight, timestamped stream
	// scoped to this experience, deliberately NOT rendered as a post
	// card (no avatar circle, no like/comment row) — a quiet running
	// log, not the main feed's visual grammar.
	momentsSection: {gap: spacing.xs},
	momentInputRow: {flexDirection: 'row', gap: spacing.xs, alignItems: 'center'},
	momentInputField: {flex: 1},
	momentRow: {paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	momentRowHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	momentAuthor: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold},
	momentDelete: {fontSize: typography.sizeXs, color: colors.danger},
	momentText: {fontSize: typography.sizeSm, color: colors.white, marginTop: 2},
	participantRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	participantAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	participantName: {flex: 1, fontSize: typography.sizeSm, color: colors.white},
	participantStatus: {fontSize: typography.sizeXs, color: colors.textFaint},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
	ownerToolbar: {flexDirection: 'row', gap: spacing.md},
	visibilityRow: {flexDirection: 'row', gap: spacing.sm},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
});
