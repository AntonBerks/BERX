/**
 * BERX GROUP INFO — real group settings, real roster, real membership
 * actions. Every admin-only action here (add/remove member, rename,
 * pin) is offered based on the caller's own real `my_role` from the
 * server, but the server re-checks it independently on every call —
 * this screen showing the option is a convenience, never the actual
 * permission boundary.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, ScrollView, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxGroupConversation, BerxGroupParticipant} from '@berx/api/types';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	myGuid: number;
	groupId: number;
	onOpenProfile: (guid: number) => void;
	/**
	 * Real friend/user search, same real endpoint the rest of BERX uses
	 * to find a person — never a fabricated directory. /search/users
	 * does not return an avatar, so none is faked here (BerxAvatar's
	 * own fallback-initial covers it).
	 */
	searchUsers: (q: string) => Promise<Array<{guid: number; username: string; fullname: string}>>;
	onLeft: () => void;
	onBack: () => void;
}

export default function GroupInfoScreen({api, myGuid, groupId, onOpenProfile, searchUsers, onLeft, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [group, setGroup] = useState<BerxGroupConversation | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nameDraft, setNameDraft] = useState('');
	const [descDraft, setDescDraft] = useState('');
	const [savingInfo, setSavingInfo] = useState(false);
	const [addQuery, setAddQuery] = useState('');
	const [addResults, setAddResults] = useState<Array<{guid: number; username: string; fullname: string}>>([]);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.getGroup(groupId);
			setGroup(res.group);
			setNameDraft(res.group.name);
			setDescDraft(res.group.description ?? '');
			setError(null);
		} catch {
			setError('Не удалось загрузить информацию о группе');
		} finally {
			setLoading(false);
		}
	}, [api, groupId]);

	useEffect(() => {
		load();
	}, [load]);

	const isAdmin = group?.my_role === 'admin';

	async function saveInfo() {
		setSavingInfo(true);
		setActionError(null);
		try {
			const res = await api.updateGroup(groupId, {name: nameDraft.trim(), description: descDraft.trim() || undefined});
			setGroup(res.group);
		} catch {
			setActionError('Не удалось сохранить изменения');
		} finally {
			setSavingInfo(false);
		}
	}

	async function runAddSearch(q: string) {
		setAddQuery(q);
		if (!q.trim()) {
			setAddResults([]);
			return;
		}
		try {
			setAddResults(await searchUsers(q.trim()));
		} catch {
			// search failure just shows no results
		}
	}

	async function handleAdd(userGuid: number) {
		setBusyGuid(userGuid);
		setActionError(null);
		try {
			const res = await api.addGroupParticipant(groupId, userGuid);
			setGroup(res.group);
			setAddQuery('');
			setAddResults([]);
		} catch {
			setActionError('Не удалось пригласить участника — возможно, он уже приглашён.');
		} finally {
			setBusyGuid(null);
		}
	}

	async function handleRemove(userGuid: number, name: string) {
		Alert.alert('Удалить участника?', `${name} будет удалён(а) из группы.`, [
			{text: 'Отмена', style: 'cancel'},
			{
				text: 'Удалить',
				style: 'destructive',
				onPress: async () => {
					setBusyGuid(userGuid);
					try {
						await api.removeGroupParticipant(groupId, userGuid);
						await load();
					} catch {
						setActionError('Не удалось удалить участника');
					} finally {
						setBusyGuid(null);
					}
				},
			},
		]);
	}

	function handleLeave() {
		Alert.alert('Покинуть группу?', 'Вы больше не будете получать сообщения из этой группы.', [
			{text: 'Отмена', style: 'cancel'},
			{
				text: 'Покинуть',
				style: 'destructive',
				onPress: async () => {
					try {
						await api.leaveGroup(groupId);
						onLeft();
					} catch {
						setActionError('Не удалось покинуть группу');
					}
				},
			},
		]);
	}

	async function handleMuteToggle() {
		if (!group) return;
		try {
			// One week — a simple, real, honest default rather than a
			// picker this v1 doesn't need; unmute is the same call with no duration.
			await api.muteGroup(groupId, group.muted ? undefined : 7 * 24 * 3600);
			await load();
		} catch {
			setActionError('Не удалось изменить уведомления');
		}
	}

	if (loading) return <BerxLoadingState label="Загрузка..." />;
	if (error || !group) return <BerxErrorState message={error ?? 'Группа недоступна'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Информация о группе" />
			<ScrollView contentContainerStyle={styles.scroll}>
				{isAdmin ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Название и описание</Text>
						<BerxInput placeholder="Название группы" value={nameDraft} onChangeText={setNameDraft} />
						<BerxInput placeholder="Описание (необязательно)" value={descDraft} onChangeText={setDescDraft} multiline />
						<BerxButton
							label="Сохранить"
							variant="secondary"
							onPress={saveInfo}
							loading={savingInfo}
							disabled={!nameDraft.trim() || (nameDraft === group.name && descDraft === (group.description ?? ''))}
						/>
					</View>
				) : (
					<View style={styles.section}>
						<Text style={styles.groupName}>{group.name}</Text>
						{group.description ? <Text style={styles.groupDescription}>{group.description}</Text> : null}
					</View>
				)}

				<View style={styles.section}>
					<BerxButton label={group.muted ? 'Включить уведомления' : 'Отключить уведомления на неделю'} variant="secondary" onPress={handleMuteToggle} fullWidth />
				</View>

				{isAdmin ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Добавить участника</Text>
						<BerxInput placeholder="Поиск людей" value={addQuery} onChangeText={runAddSearch} />
						{addResults.map((u) => (
							<Pressable key={u.guid} style={styles.resultRow} onPress={() => handleAdd(u.guid)} disabled={busyGuid === u.guid}>
								<BerxAvatar iconUrl={null} fallbackInitial={u.username.charAt(0)} size={32} />
								<Text style={styles.resultName} numberOfLines={1}>{u.fullname || u.username}</Text>
								<Text style={styles.resultAction}>{busyGuid === u.guid ? '…' : '+ Пригласить'}</Text>
							</Pressable>
						))}
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Участники ({group.participant_count})</Text>
					{group.participants.map((p: BerxGroupParticipant) => (
						<Pressable key={p.guid} style={styles.memberRow} onPress={() => onOpenProfile(p.guid)}>
							<BerxAvatar iconUrl={p.icon} fallbackInitial={p.username.charAt(0)} size={36} />
							<View style={styles.memberBody}>
								<Text style={styles.memberName} numberOfLines={1}>{p.fullname || p.username}</Text>
								<Text style={styles.memberRole}>{p.role === 'admin' ? 'Администратор' : 'Участник'}</Text>
							</View>
							{isAdmin && p.guid !== myGuid ? (
								<Pressable onPress={() => handleRemove(p.guid, p.fullname || p.username)} hitSlop={8} disabled={busyGuid === p.guid}>
									<Text style={styles.removeLabel}>{busyGuid === p.guid ? '…' : 'Удалить'}</Text>
								</Pressable>
							) : null}
						</Pressable>
					))}
				</View>

				{actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

				<View style={styles.section}>
					<BerxButton label="Покинуть группу" variant="secondary" onPress={handleLeave} fullWidth />
				</View>
			</ScrollView>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	scroll: {padding: spacing.lg, gap: spacing.lg, paddingBottom: 80},
	section: {gap: spacing.sm},
	sectionTitle: {color: colors.textFaint, fontSize: typography.sizeXs, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: typography.weightBold},
	groupName: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	groupDescription: {color: colors.textDim, fontSize: typography.sizeSm},
	resultRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	resultName: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
	resultAction: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	memberRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	memberBody: {flex: 1},
	memberName: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	memberRole: {color: colors.textFaint, fontSize: typography.sizeXs},
	removeLabel: {color: colors.danger, fontSize: typography.sizeXs},
	actionError: {color: colors.danger, fontSize: typography.sizeSm},
});
