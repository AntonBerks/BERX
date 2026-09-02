/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createGroup() (components/OssnApi/v1/groups.php,
 * backend classes/OssnGroupChat.php). Participant search uses the same
 * real /search/users endpoint every other "find a person" flow in BERX
 * uses — never a fabricated directory.
 *
 * Two real entry shapes, both honest about what they pre-fill:
 *  - `initialAnchor` — "context everywhere" (master build directive §56):
 *    pushed from CommunityDetail/EventDetail/ExperienceDetail/
 *    CircleDetail/TripDetail so the new group is tied to that entity
 *    from creation (context_type/context_guid), same pattern as
 *    CreateExperienceScreen's own place/event anchor.
 *  - `preselectGuids` — "Direct Message → Group creation": starting a
 *    group from an existing 1:1 conversation seeds the real other
 *    participant so the flow is "add more people", not "start over".
 */
import {useMemo, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxGroupContextType} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

type Anchor = {type: BerxGroupContextType; guid: number; title: string};
type PersonResult = {guid: number; username: string; fullname: string};

interface Props {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
	initialAnchor?: Anchor;
	/** Real people, already known by guid (e.g. the other side of a 1:1 conversation) — added to the picker without a search round-trip. */
	preselectPeople?: PersonResult[];
}

export default function CreateGroupScreen({api, onCreated, onBack, initialAnchor, preselectPeople}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<PersonResult[]>([]);
	const [selected, setSelected] = useState<PersonResult[]>(preselectPeople ?? []);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function runSearch(q: string) {
		setQuery(q);
		if (!q.trim()) {
			setResults([]);
			return;
		}
		try {
			const res = await api.searchUsers(q.trim());
			setResults(res.users);
		} catch {
			// search failure just shows no results — not a form-blocking error
		}
	}

	function toggle(person: PersonResult) {
		setSelected((prev) => (prev.some((p) => p.guid === person.guid) ? prev.filter((p) => p.guid !== person.guid) : [...prev, person]));
	}

	async function submit() {
		if (!name.trim()) {
			setError('Укажите название группы.');
			return;
		}
		if (selected.length < 2) {
			// Real server minimum (OssnGroupChat::MIN_OTHER_PARTICIPANTS) —
			// a "group" of just you + one other person is a real, honest
			// rejection, not a degraded 1:1: BERX already has a real 1:1
			// messenger for that case (ConversationScreen.tsx).
			setError('Добавьте минимум двух участников — для разговора с одним человеком уже есть личные сообщения.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createGroup({
				name: name.trim(),
				description: description.trim() || undefined,
				participantGuids: selected.map((p) => p.guid),
				contextType: initialAnchor?.type,
				contextGuid: initialAnchor?.guid,
			});
			onCreated(res.group.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать группу');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Новая группа" onBack={onBack} />
			<View style={styles.body}>
				{initialAnchor ? (
					<View style={styles.anchorBadge}>
						<Text style={styles.anchorBadgeText}>Групповой чат для «{initialAnchor.title}»</Text>
					</View>
				) : null}

				<BerxInput placeholder="Название группы" value={name} onChangeText={setName} />
				<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />

				{selected.length > 0 ? (
					<View style={styles.selectedRow}>
						{selected.map((p) => (
							<Pressable key={p.guid} style={styles.selectedChip} onPress={() => toggle(p)}>
								<Text style={styles.selectedChipText} numberOfLines={1}>{p.fullname || p.username} ✕</Text>
							</Pressable>
						))}
					</View>
				) : null}

				<Text style={styles.label}>Участники</Text>
				<BerxInput placeholder="Поиск людей" value={query} onChangeText={runSearch} />
				<FlatList
					data={results}
					keyExtractor={(p: PersonResult) => String(p.guid)}
					renderItem={({item}: {item: PersonResult}) => {
						const isSelected = selected.some((p) => p.guid === item.guid);
						return (
							<Pressable style={styles.resultRow} onPress={() => toggle(item)}>
								<BerxAvatar iconUrl={null} fallbackInitial={item.username.charAt(0)} size={32} />
								<Text style={styles.resultText} numberOfLines={1}>{item.fullname || item.username}</Text>
								<Text style={isSelected ? styles.resultActionSelected : styles.resultAction}>{isSelected ? 'Добавлен' : 'Добавить'}</Text>
							</Pressable>
						);
					}}
				/>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Создать группу" loading={submitting} onPress={submit} fullWidth />
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md, flex: 1},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	anchorBadge: {backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.accent},
	anchorBadgeText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	selectedRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	selectedChip: {paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.accentSoft},
	selectedChipText: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightMedium},
	resultRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	resultText: {flex: 1, fontSize: typography.sizeSm, color: colors.white},
	resultAction: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightMedium},
	resultActionSelected: {fontSize: typography.sizeXs, color: colors.textFaint},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
